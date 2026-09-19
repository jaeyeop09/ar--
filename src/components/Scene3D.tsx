import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { useStore } from "../store";
import type { ReactNode } from "react";

type SceneObject = {
  id: string | number;
  type?: string;
  x?: number;
  y?: number;
  width?: number;
  depth?: number;
  height?: number;
  rotation?: number;
};

function Obj({ o }: { o: SceneObject }) {
  const color =
    o.type === "wall"
      ? "#64748b"
      : o.type === "seismicWall"
        ? "#10b981"
        : o.type === "column"
          ? "#475569"
          : o.type === "damper"
            ? "#f59e0b"
            : "#cbd5e1";

  const width = Math.max(0.05, (Number(o.width) || 20) / 40);
  const depth = Math.max(0.05, (Number(o.depth) || 20) / 40);
  const height = Math.max(0.1, Number(o.height) || 3);
  const x = (Number(o.x) || 0) / 40;
  const z = (Number(o.y) || 0) / 40;
  const rotation = ((Number(o.rotation) || 0) * Math.PI) / 180;

  return (
    <mesh
      position={[x, height / 2, z]}
      rotation={[0, -rotation, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={color} roughness={0.72} metalness={0.05} />
    </mesh>
  );
}

function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <Grid args={[40, 40]} cellSize={1} sectionSize={5} fadeDistance={45} />
    </>
  );
}

function SceneContents({ objects }: { objects: SceneObject[] }): ReactNode {
  return (
    <>
      <color attach="background" args={["#f8fafc"]} />
      <ambientLight intensity={1.4} />
      <hemisphereLight intensity={0.7} groundColor="#cbd5e1" />
      <directionalLight
        position={[8, 14, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <Ground />
      {objects.map((o) => (
        <Obj key={o.id} o={o} />
      ))}
      <OrbitControls makeDefault target={[0, 1, 0]} enableDamping />
    </>
  );
}

export default function Scene3D() {
  const objects = useStore((s) => s.objects);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 0 }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [14, 11, 14], fov: 50, near: 0.1, far: 200 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#f8fafc");
        }}
      >
        <SceneContents objects={objects} />
      </Canvas>
    </div>
  );
}
