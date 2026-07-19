"use client"

import { Suspense, useRef } from "react"
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber"
import { ContactShadows, Float, RoundedBox, useTexture } from "@react-three/drei"
import * as THREE from "three"

/* Real KDP front cover, mapped onto the book. 6x9 proportions. */
const COVER_SRC = "/media/unwhistled-cover-texture.jpg"
const W = 3.0 // book width
const H = 4.5 // book height (6:9 ≈ 0.667)
const D = 0.62 // book thickness

/** The book: dark noir covers wrapping the real Unwhistled artwork. */
function Book(props: ThreeElements["group"]) {
  const group = useRef<THREE.Group>(null)
  const cover = useTexture(COVER_SRC, (t) => {
    const tex = t as THREE.Texture
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
  })

  // Mouse-reactive tilt + gentle idle rotation.
  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const targetY = state.pointer.x * 0.55 + state.clock.elapsedTime * 0.1
    const targetX = -state.pointer.y * 0.32
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 3, delta)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 3, delta)
  })

  const coverMat = <meshStandardMaterial color="#0a0c11" roughness={0.55} metalness={0.2} />

  return (
    <group ref={group} {...props}>
      {/* page block (cream, inset) */}
      <mesh position={[0.05, 0, 0]} castShadow>
        <boxGeometry args={[W - 0.16, H - 0.16, D - 0.12]} />
        <meshStandardMaterial color="#e7e2d4" roughness={0.9} />
      </mesh>
      {/* gilded fore-edge (premium accent) */}
      <mesh position={[W / 2 - 0.06, 0, 0]}>
        <boxGeometry args={[0.04, H - 0.14, D - 0.1]} />
        <meshStandardMaterial color="#d9b45c" roughness={0.35} metalness={0.7} />
      </mesh>
      {/* back cover */}
      <RoundedBox args={[W, H, 0.12]} radius={0.05} smoothness={4} position={[0, 0, -D / 2 + 0.02]} castShadow receiveShadow>
        {coverMat}
      </RoundedBox>
      {/* spine */}
      <RoundedBox args={[0.14, H, D - 0.02]} radius={0.04} smoothness={4} position={[-W / 2 + 0.02, 0, 0]} castShadow>
        {coverMat}
      </RoundedBox>
      {/* front cover */}
      <RoundedBox args={[W, H, 0.12]} radius={0.05} smoothness={4} position={[0, 0, D / 2 - 0.02]} castShadow receiveShadow>
        {coverMat}
      </RoundedBox>
      {/* printed cover face — the real artwork, just proud of the front cover */}
      <mesh position={[0.02, 0, D / 2 + 0.045]}>
        <planeGeometry args={[W - 0.16, H - 0.16]} />
        <meshStandardMaterial map={cover} roughness={0.45} metalness={0.05} />
      </mesh>
    </group>
  )
}

export default function BookScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8.6], fov: 34 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.4} />
      {/* warm key spotlight, echoing the cover's own lighting */}
      <spotLight position={[4, 8, 6]} angle={0.5} penumbra={0.8} intensity={95} color="#f0d69a" castShadow shadow-mapSize={[1024, 1024]} />
      {/* electric rim from behind for the cinematic edge */}
      <directionalLight position={[-6, 2, -4]} intensity={2.6} color="#4f7bff" />
      <directionalLight position={[6, -2, 2]} intensity={0.5} color="#d31f3c" />

      <Suspense fallback={null}>
        <Float speed={1.3} rotationIntensity={0.25} floatIntensity={0.6}>
          <Book position={[0, 0.1, 0]} rotation={[0.08, -0.55, 0]} />
        </Float>
      </Suspense>

      <ContactShadows position={[0, -2.7, 0]} opacity={0.55} scale={12} blur={3} far={4.8} color="#000000" />
    </Canvas>
  )
}
