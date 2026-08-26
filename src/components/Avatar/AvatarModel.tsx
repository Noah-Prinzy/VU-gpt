import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { collectMorphMeshes, createMorphSetter, type SetMorph } from './morphTargets'
import { decayAmplitude, getAmplitude } from './speechAmplitude'
import { useAppStore } from '../../store/useAppStore'
import type { AvatarPhase, View } from '../../types'

const MODEL_URL = '/avatar-web.glb'

interface AvatarModelProps {
  onReady?: (setMorph: SetMorph) => void
}

// Bones this rig exposes without a "mixamorig:" prefix (confirmed by the
// T-pose arm correction below, which already relies on these exact names).
type PoseBone = 'Head' | 'Neck' | 'Spine2' | 'Spine1' | 'Spine' | 'RightArm' | 'RightForeArm' | 'LeftArm'

const BREATH_BONE_CANDIDATES: PoseBone[] = ['Spine2', 'Spine1', 'Spine']

// Additive Euler offsets (radians) applied on top of each bone's rest pose,
// per avatar phase. Only Head/RightArm/RightForeArm carry a per-phase pose —
// everything else stays at rest and only picks up the idle breathing sway.
const PHASE_POSE: Record<AvatarPhase, Partial<Record<PoseBone, THREE.Euler>>> = {
  idle: {},
  listening: {
    Head: new THREE.Euler(0.1, 0.12, -0.04),
  },
  processing: {
    Head: new THREE.Euler(0.06, -0.26, 0.18),
    RightArm: new THREE.Euler(-0.25, 0.05, 1.15),
    RightForeArm: new THREE.Euler(-1.95, 0.2, 0.05),
  },
  responding: {
    Head: new THREE.Euler(-0.03, 0.05, -0.02),
    RightArm: new THREE.Euler(-0.1, -0.1, 0.5),
    RightForeArm: new THREE.Euler(-0.55, -0.05, 0.05),
  },
}

interface CropPreset {
  topEdge: number
  bottomEdge: number
  lookBias: number
}

interface FrameGeo {
  full: CropPreset
  badge: CropPreset
  centerX: number
  centerZ: number
}

export function AvatarModel({ onReady }: AvatarModelProps) {
  const { scene } = useGLTF(MODEL_URL, false, true)
  const { camera, controls } = useThree()
  const phase = useAppStore((s) => s.phase)
  const view = useAppStore((s) => s.view)

  // Geometry facts measured once from the rest pose (crown height, ground
  // level, horizontal centre) — resolution-independent. Two crops are kept:
  // "full" (knee-to-head, used in the avatar view) and "badge" (a tight
  // face close-up, used when the avatar shrinks into the chat header). The
  // camera is smoothly lerped between them every frame based on `view` (see
  // useFrame below) rather than snapped in an effect — that continuous
  // camera dolly *is* the "avatar becomes the chat header photo" motion.
  const frameGeo = useRef<FrameGeo | null>(null)
  const lookTarget = useRef<THREE.Vector3 | null>(null)
  const setMorphRef = useRef<SetMorph | null>(null)
  const smoothedDistance = useRef<number | null>(null)
  const smoothedLookY = useRef<number | null>(null)

  const bones = useRef<Partial<Record<PoseBone, THREE.Bone>>>({})
  const restQuats = useRef<Partial<Record<PoseBone, THREE.Quaternion>>>({})
  const breathBone = useRef<THREE.Bone | null>(null)
  const breathScale = useRef<THREE.Vector3 | null>(null)

  const phaseRef = useRef<AvatarPhase>(phase)
  const phaseEnteredAt = useRef(0)
  const blink = useRef({ timer: 0, next: 2, phase: -1 })
  const clockStart = useRef(0)
  const morphState = useRef<Record<string, number>>({})

  // Math.random / performance.now are impure — seed these after mount, not
  // during render.
  useEffect(() => {
    clockStart.current = performance.now()
    blink.current.next = 2 + Math.random() * 2
  }, [])

  const morphMeshes = useMemo(() => collectMorphMeshes(scene), [scene])

  useEffect(() => {
    if (import.meta.env.DEV) {
      const head = morphMeshes.find((m) => m.name === 'Head_Mesh')
      console.info(
        '[AvatarModel] morph meshes:',
        morphMeshes.map((m) => `${m.name} (${Object.keys(m.morphTargetDictionary ?? {}).length})`),
      )
      if (head) {
        console.info('[AvatarModel] Head_Mesh targets:', Object.keys(head.morphTargetDictionary ?? {}))
      }
    }
    const setMorph = createMorphSetter(morphMeshes)
    setMorphRef.current = setMorph
    onReady?.(setMorph)
  }, [morphMeshes, onReady])

  // Lower the T-pose arms to the sides before framing — the outstretched arms
  // would otherwise fill a wide viewport's horizontal FOV even in a tight
  // head-and-shoulders vertical crop. Guessing an Euler angle on the bone's
  // local axis is fragile (it depends on the rig's bind-pose axis convention,
  // and got the last attempt wrong — arms bent forward instead of hanging
  // down). Instead: measure the bone's actual bind-pose world direction from
  // a known child joint, and rotate that direction onto world-down. This is
  // axis-convention-agnostic and rotates the whole rigid arm+forearm+hand
  // chain (T-pose has no elbow bend, so no separate forearm correction needed).
  useEffect(() => {
    scene.updateMatrixWorld(true)

    const pointBoneDown = (boneName: string, childName: string) => {
      const bone = scene.getObjectByName(boneName)
      const child = scene.getObjectByName(childName)
      if (!bone || !child) return

      const bonePos = new THREE.Vector3()
      const childPos = new THREE.Vector3()
      bone.getWorldPosition(bonePos)
      child.getWorldPosition(childPos)
      const currentDir = childPos.sub(bonePos).normalize()
      const targetDir = new THREE.Vector3(0, -1, 0)

      const deltaWorld = new THREE.Quaternion().setFromUnitVectors(currentDir, targetDir)
      const currentWorldQuat = new THREE.Quaternion()
      bone.getWorldQuaternion(currentWorldQuat)
      const targetWorldQuat = deltaWorld.multiply(currentWorldQuat)

      const parentWorldQuat = new THREE.Quaternion()
      bone.parent?.getWorldQuaternion(parentWorldQuat)
      bone.quaternion.copy(parentWorldQuat.invert().multiply(targetWorldQuat))
      bone.updateMatrixWorld(true)
    }

    pointBoneDown('LeftArm', 'LeftForeArm')
    pointBoneDown('RightArm', 'RightForeArm')

    // Cache the bones we'll animate, and their rest quaternion *after* the
    // arms-down correction above — every phase pose is layered on top of
    // this rest pose, not the original T-pose.
    const poseBoneNames: PoseBone[] = ['Head', 'Neck', 'RightArm', 'RightForeArm', 'LeftArm']
    for (const name of poseBoneNames) {
      const bone = scene.getObjectByName(name) as THREE.Bone | undefined
      if (bone) {
        bones.current[name] = bone
        restQuats.current[name] = bone.quaternion.clone()
      }
    }

    for (const name of BREATH_BONE_CANDIDATES) {
      const bone = scene.getObjectByName(name) as THREE.Bone | undefined
      if (bone) {
        breathBone.current = bone
        breathScale.current = bone.scale.clone()
        break
      }
    }

    if (import.meta.env.DEV) {
      const found = poseBoneNames.filter((n) => bones.current[n])
      const missing = poseBoneNames.filter((n) => !bones.current[n])
      console.info('[AvatarModel] pose bones found:', found, 'missing:', missing)
      console.info('[AvatarModel] breath bone:', breathBone.current?.name ?? 'none found')
    }
  }, [scene])

  // Measure the knee-to-head crop from the rest pose once. Box3.setFromObject
  // reads each SkinnedMesh's *bind-pose* geometry (skinning is a GPU vertex
  // shader effect — it never touches geometry.boundingBox on the CPU side),
  // so this is unaffected by the arms-down bone correction above. That's
  // exactly what we want for a vertical crown/knee measurement: the T-pose
  // arms don't move the head or leg joints, so the height reading is correct
  // either way. (Deliberately not using the box's *width* for anything below
  // — for a skinned mesh that would still read as the T-pose's arm span.)
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const dims = box.getSize(new THREE.Vector3())
    if (dims.y === 0) return

    const center = box.getCenter(new THREE.Vector3())
    const headTopY = box.max.y

    frameGeo.current = {
      // Fractions of total standing height, measured from the ground (y=0
      // at the feet): a touch of headroom above the crown, cropped just
      // below the knee (average adult knee height ≈ 0.285 of height).
      full: { topEdge: headTopY + dims.y * 0.035, bottomEdge: box.min.y + dims.y * 0.26, lookBias: 0.4 },
      // Tight face close-up for the chat-header badge — crop right below
      // the chin.
      badge: { topEdge: headTopY + dims.y * 0.02, bottomEdge: headTopY - dims.y * 0.085, lookBias: 0.42 },
      centerX: center.x,
      centerZ: center.z,
    }

    const orbit = controls as { target?: THREE.Vector3; update?: () => void } | null
    const preset = frameGeo.current.full
    const visibleHeight = preset.topEdge - preset.bottomEdge
    const lookY = preset.topEdge - visibleHeight * preset.lookBias
    lookTarget.current = new THREE.Vector3(center.x, lookY, center.z)
    orbit?.target?.copy(lookTarget.current)
    orbit?.update?.()
  }, [scene, controls])

  const viewRef = useRef<View>(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    if (phase !== phaseRef.current) {
      phaseRef.current = phase
      phaseEnteredAt.current = performance.now()
    }
  }, [phase])

  const tmpQuat = useMemo(() => new THREE.Quaternion(), [])
  const tmpOffsetQuat = useMemo(() => new THREE.Quaternion(), [])

  useFrame((_state, delta) => {
    const t = (performance.now() - clockStart.current) / 1000
    const currentPhase = phaseRef.current
    const dt = Math.min(delta, 0.05)
    // Framerate-independent smoothing toward the target pose each frame.
    const lerpAlpha = 1 - Math.pow(0.0001, dt)

    // --- camera dolly between the full (knee-to-head) and badge (face
    // close-up) crops, smoothly following `view` — this continuous
    // reframe is what makes the avatar read as "becoming" the tiny chat
    // header photo instead of just jump-cutting between two shots.
    const geo = frameGeo.current
    if (geo) {
      const preset = viewRef.current === 'avatar' ? geo.full : geo.badge
      const visibleHeight = preset.topEdge - preset.bottomEdge
      const lookYTarget = preset.topEdge - visibleHeight * preset.lookBias

      const perspCamera = camera as THREE.PerspectiveCamera
      const fov = perspCamera.fov ?? 32
      const distanceTarget = visibleHeight / (2 * Math.tan((fov * Math.PI) / 360))

      if (smoothedDistance.current === null) smoothedDistance.current = distanceTarget
      if (smoothedLookY.current === null) smoothedLookY.current = lookYTarget
      smoothedDistance.current += (distanceTarget - smoothedDistance.current) * lerpAlpha
      smoothedLookY.current += (lookYTarget - smoothedLookY.current) * lerpAlpha

      camera.position.set(geo.centerX, smoothedLookY.current, geo.centerZ + smoothedDistance.current)
      camera.lookAt(geo.centerX, smoothedLookY.current, geo.centerZ)
      if (perspCamera.isPerspectiveCamera) perspCamera.updateProjectionMatrix()

      // DEV-only OrbitControls (see Avatar.tsx) re-derives its own spherical
      // position from `target` every frame and clamps it — if `target` is
      // left stale from whichever mode set it last, that clamp fights this
      // camera dolly and can strand the camera at the wrong distance/angle.
      // Keeping it locked to the same point we're driving the camera toward
      // makes that recomputation a no-op instead of a fight.
      const orbit = controls as { target?: THREE.Vector3 } | null
      orbit?.target?.set(geo.centerX, smoothedLookY.current, geo.centerZ)
    }

    // --- breathing (all phases) ---
    if (breathBone.current && breathScale.current) {
      const breath = Math.sin(t * 1.25) * 0.5 + 0.5
      breathBone.current.scale.set(
        breathScale.current.x * (1 + breath * 0.01),
        breathScale.current.y * (1 + breath * 0.006),
        breathScale.current.z * (1 + breath * 0.01),
      )
    }

    // --- per-bone pose blending ---
    const pose = PHASE_POSE[currentPhase]
    for (const name of Object.keys(bones.current) as PoseBone[]) {
      const bone = bones.current[name]
      const rest = restQuats.current[name]
      if (!bone || !rest) continue

      const offsetEuler = pose[name]
      tmpQuat.copy(rest)
      if (offsetEuler) {
        tmpOffsetQuat.setFromEuler(offsetEuler)
        tmpQuat.multiply(tmpOffsetQuat)
      }

      // Idle head sway + a small acknowledgement nod at the start of
      // "responding" ride on top of the phase target quaternion.
      if (name === 'Head') {
        if (currentPhase === 'idle') {
          const swayEuler = new THREE.Euler(Math.sin(t * 0.33) * 0.025, Math.sin(t * 0.42) * 0.05, Math.sin(t * 0.27) * 0.02)
          tmpOffsetQuat.setFromEuler(swayEuler)
          tmpQuat.multiply(tmpOffsetQuat)
        } else if (currentPhase === 'responding') {
          const sinceEnter = (performance.now() - phaseEnteredAt.current) / 1000
          const nodDuration = 0.6
          if (sinceEnter < nodDuration) {
            const p = sinceEnter / nodDuration
            const dip = Math.sin(p * Math.PI) * 0.18
            tmpOffsetQuat.setFromEuler(new THREE.Euler(dip, 0, 0))
            tmpQuat.multiply(tmpOffsetQuat)
          }
        }
      }

      bone.quaternion.slerp(tmpQuat, lerpAlpha)
    }

    // --- facial expression + blink ---
    const setMorph = setMorphRef.current
    if (setMorph) {
      blink.current.timer += dt
      if (blink.current.phase < 0 && blink.current.timer > blink.current.next) {
        blink.current.phase = 0
        blink.current.timer = 0
        blink.current.next = currentPhase === 'listening' ? 1.8 + Math.random() * 2 : 2.6 + Math.random() * 3.2
      }
      let blinkAmount = 0
      if (blink.current.phase >= 0) {
        blink.current.phase += dt * 8
        const k = blink.current.phase < 1 ? blink.current.phase : 2 - blink.current.phase
        blinkAmount = Math.max(0, Math.min(1, k))
        if (blink.current.phase >= 2) blink.current.phase = -1
      }
      setMorph('eyeBlinkLeft', blinkAmount)
      setMorph('eyeBlinkRight', blinkAmount)

      const target = { browInnerUp: 0, browOuterUpLeft: 0, browOuterUpRight: 0, browDownLeft: 0, browDownRight: 0, mouthSmileLeft: 0, mouthSmileRight: 0, mouthPucker: 0, eyeSquintLeft: 0, eyeSquintRight: 0, jawOpen: 0 }

      if (currentPhase === 'idle') {
        target.mouthSmileLeft = 0.12
        target.mouthSmileRight = 0.12
      } else if (currentPhase === 'listening') {
        target.browInnerUp = 0.35
        target.browOuterUpLeft = 0.22
        target.browOuterUpRight = 0.22
      } else if (currentPhase === 'processing') {
        target.browDownLeft = 0.28
        target.browDownRight = 0.28
        target.eyeSquintLeft = 0.18
        target.eyeSquintRight = 0.18
        target.mouthPucker = 0.15
      } else if (currentPhase === 'responding') {
        target.mouthSmileLeft = 0.2
        target.mouthSmileRight = 0.2
      }

      // STEP 4c: this is where the jaw actually moves. Every rendered frame
      // we read the current pulse level (getAmplitude, set by tts.ts's word
      // events via speechAmplitude.ts) and use it to push the `jawOpen`
      // morph target open, then immediately decay it back down. Repeated
      // every frame while speech is playing, this produces a rapid
      // open-close chatter timed to the words — not real lip-sync, just a
      // convincing approximation. Applied regardless of `currentPhase`
      // (additively) because the intro's welcome line plays while the
      // avatar is still in 'idle', not 'responding'.
      target.jawOpen += getAmplitude() * 0.42
      decayAmplitude(0.82)

      for (const [name, value] of Object.entries(target)) {
        const current = morphState.current[name] ?? 0
        const smoothed = current + (value - current) * Math.min(1, lerpAlpha * 1.5)
        morphState.current[name] = smoothed
        setMorph(name, smoothed)
      }
    }
  })

  return <primitive object={scene} />
}

useGLTF.preload(MODEL_URL)
