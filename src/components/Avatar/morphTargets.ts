import type * as THREE from 'three'

export type SetMorph = (name: string, value: number) => void

type MorphMesh = THREE.Mesh & {
  morphTargetDictionary?: Record<string, number>
  morphTargetInfluences?: number[]
}

/**
 * The viseme subset is duplicated across Head_Mesh, Teeth_Mesh, and Tongue_Mesh —
 * driving only the head leaves the teeth/tongue clamped in their rest pose. This
 * fans every named morph out to every mesh that declares it.
 */
export function createMorphSetter(meshes: MorphMesh[]): SetMorph {
  return (name, value) => {
    for (const mesh of meshes) {
      const dict = mesh.morphTargetDictionary
      const influences = mesh.morphTargetInfluences
      if (dict && influences && name in dict) {
        influences[dict[name]] = value
      }
    }
  }
}

export function collectMorphMeshes(root: THREE.Object3D): MorphMesh[] {
  const meshes: MorphMesh[] = []
  root.traverse((obj) => {
    const mesh = obj as MorphMesh
    if (mesh.morphTargetDictionary) meshes.push(mesh)
  })
  return meshes
}
