import React, { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { Sky, OrbitControls, AdaptiveDpr } from "@react-three/drei"
import Grass from "./Grass"

export default function App() {
  return (
    <Canvas
      camera={{ position: [15, 15, 10] }}
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
    >
      <AdaptiveDpr pixelated />
      <Sky azimuth={1} inclination={0.6} distance={1000} />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null}>
        <Grass />
      </Suspense>
      <OrbitControls minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 2.5} />
    </Canvas>
  )
}
