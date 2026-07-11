"use client"

import { useMemo, useRef } from "react"
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber"
import { ContactShadows, Float, RoundedBox } from "@react-three/drei"
import * as THREE from "three"

/**
 * Procedural 3D cover texture for "Unwhistled" — drawn to a canvas so we
 * ship zero external 3D assets. Dark leather-ish ground, gold title,
 * crimson rule. Rendered once and memoised.
 */
function useCoverTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 1024
    c.height = 1280
    const ctx = c.getContext("2d")!

    // ground
    const g = ctx.createLinearGradient(0, 0, 0, c.height)
    g.addColorStop(0, "#14181f")
    g.addColorStop(0.5, "#0c0f15")
    g.addColorStop(1, "#05070a")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, c.width, c.height)

    // subtle spotlight
    const spot = ctx.createRadialGradient(512, 380, 60, 512, 380, 720)
    spot.addColorStop(0, "rgba(217,180,92,0.16)")
    spot.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = spot
    ctx.fillRect(0, 0, c.width, c.height)

    // kicker
    ctx.fillStyle = "#d9b45c"
    ctx.font = "600 30px 'Barlow Condensed', sans-serif"
    ctx.textAlign = "center"
    ctx.letterSpacing = "10px"
    ctx.fillText("GAME · INTEGRITY · JOURNAL", 512, 250)

    // title
    ctx.fillStyle = "#f3f0ea"
    ctx.font = "800 150px 'Barlow Condensed', sans-serif"
    ctx.letterSpacing = "2px"
    ctx.fillText("UNWHISTLED", 512, 690)

    // crimson rule
    ctx.strokeStyle = "#d31f3c"
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(300, 770)
    ctx.lineTo(724, 770)
    ctx.stroke()

    // subtitle
    ctx.fillStyle = "#cfd3dc"
    ctx.font = "500 34px 'Barlow Condensed', sans-serif"
    ctx.letterSpacing = "14px"
    ctx.fillText("THE FULL INDICTMENT", 512, 850)

    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return tex
  }, [])
}

/** The book: dark covers, gilded fore-edge, gold-lettered front cover. */
function Book(props: ThreeElements["group"]) {
  const group = useRef<THREE.Group>(null)
  const cover = useCoverTexture()

  // Mouse-reactive tilt + gentle idle rotation.
  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const targetY = state.pointer.x * 0.6 + state.clock.elapsedTime * 0.12
    const targetX = -state.pointer.y * 0.35
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 3, delta)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 3, delta)
  })

  const coverMat = <meshStandardMaterial color="#0c0f15" roughness={0.62} metalness={0.15} />

  return (
    <group ref={group} {...props}>
      {/* page block (cream, inset) */}
      <mesh position={[0.06, 0, 0]} castShadow>
        <boxGeometry args={[2.9, 3.9, 0.5]} />
        <meshStandardMaterial color="#e7e2d4" roughness={0.9} />
      </mesh>
      {/* gilded fore-edge */}
      <mesh position={[1.52, 0, 0]}>
        <boxGeometry args={[0.04, 3.94, 0.52]} />
        <meshStandardMaterial color="#d9b45c" roughness={0.35} metalness={0.7} />
      </mesh>
      {/* back cover */}
      <RoundedBox args={[3.1, 4.1, 0.12]} radius={0.06} smoothness={4} position={[0, 0, -0.32]} castShadow receiveShadow>
        {coverMat}
      </RoundedBox>
      {/* spine */}
      <RoundedBox args={[0.16, 4.1, 0.78]} radius={0.05} smoothness={4} position={[-1.55, 0, 0]} castShadow>
        {coverMat}
      </RoundedBox>
      {/* front cover */}
      <RoundedBox args={[3.1, 4.1, 0.12]} radius={0.06} smoothness={4} position={[0, 0, 0.32]} castShadow receiveShadow>
        {coverMat}
      </RoundedBox>
      {/* printed cover face (just proud of the front cover) */}
      <mesh position={[0.02, 0, 0.386]}>
        <planeGeometry args={[2.86, 3.86]} />
        <meshStandardMaterial map={cover} roughness={0.5} metalness={0.05} />
      </mesh>
    </group>
  )
}

export default function BookScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8.2], fov: 34 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.35} />
      {/* warm key spotlight, echoing the book-photo lighting */}
      <spotLight position={[4, 8, 6]} angle={0.5} penumbra={0.8} intensity={90} color="#f0d69a" castShadow shadow-mapSize={[1024, 1024]} />
      {/* electric rim from behind for the cinematic edge */}
      <directionalLight position={[-6, 2, -4]} intensity={2.4} color="#4f7bff" />
      <directionalLight position={[6, -2, 2]} intensity={0.5} color="#d31f3c" />

      <Float speed={1.3} rotationIntensity={0.25} floatIntensity={0.6}>
        <Book position={[0, 0.1, 0]} rotation={[0.1, -0.5, 0]} />
      </Float>

      <ContactShadows position={[0, -2.5, 0]} opacity={0.55} scale={12} blur={3} far={4.5} color="#000000" />
    </Canvas>
  )
}
