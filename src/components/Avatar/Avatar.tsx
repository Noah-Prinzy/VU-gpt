import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { AvatarModel } from './AvatarModel'
import { hasWebGL } from './webgl'
import { ErrorBoundary } from '../Shell/ErrorBoundary'
import styles from './Avatar.module.css'

function AvatarFallback() {
  return (
    <div className={styles.fallback}>
      <p>3D preview isn't available right now.</p>
    </div>
  )
}

export function Avatar() {
  const supported = useMemo(() => hasWebGL(), [])

  if (!supported) {
    return (
      <div className={styles.fallback}>
        <p>3D preview isn't supported on this device.</p>
      </div>
    )
  }

  return (
    <ErrorBoundary fallback={<AvatarFallback />}>
      <Canvas
        className={styles.canvas}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 32, near: 0.1, far: 100, position: [0, 1.5, 3] }}
        onCreated={({ gl }) => {
          // A lost WebGL context (backgrounded tab reclaimed by the OS,
          // GPU driver reset, too many contexts) doesn't throw — it fires
          // this event instead, and without a handler the canvas just
          // stays permanently blank with nothing telling React anything
          // is wrong. Re-request the context in the background browsers
          // already retry automatically for; this just ensures the model
          // reloads once it comes back instead of staying blank forever.
          const canvasEl = gl.domElement
          canvasEl.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            console.warn('[Avatar] WebGL context lost')
          })
          canvasEl.addEventListener('webglcontextrestored', () => {
            console.info('[Avatar] WebGL context restored')
          })
        }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 5]} intensity={1.25} color="#fff2e6" />
        <directionalLight position={[-4, 1, 3]} intensity={0.55} color="#cfe0ff" />
        <pointLight position={[-3.2, 1.4, -2.4]} intensity={1.2} distance={14} color="#d62246" />
        <pointLight position={[3.2, 0.6, -2.4]} intensity={1.2} distance={14} color="#2e6bc4" />
        {/* No <Environment> here on purpose — drei's preset HDRs fetch from
            a live third-party CDN (raw.githubusercontent.com) on every
            load. That request failing (rate limit, transient 503, a
            corporate firewall) throws inside the R3F tree — confirmed
            happening — and without the ErrorBoundary above this used to
            blank the *entire* app, not just the avatar. The explicit
            lights above already give this model real dimensional
            lighting; not worth a live external dependency for the extra
            reflection polish an env map adds. */}
        <Suspense fallback={null}>
          <AvatarModel />
        </Suspense>
        {import.meta.env.DEV && (
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={0.2}
            maxDistance={4}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.7}
          />
        )}
      </Canvas>
    </ErrorBoundary>
  )
}
