import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls, Grid } from "@react-three/drei";
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
            : o.type === "floor"
              ? "#cbd5e1"
              : "#94a3b8";

  const width = Math.max(0.05, (Number(o.width) || 20) / 40);
  const depth = Math.max(0.05, (Number(o.depth) || 20) / 40);
  const height = Math.max(0.03, Number(o.height) || 3);
  const x = (Number(o.x) || 0) / 40;
  const z = (Number(o.y) || 0) / 40;
  const rotation = ((Number(o.rotation) || 0) * Math.PI) / 180;

  return (
    <mesh
      position={[x + width / 2, height / 2, z + depth / 2]}
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
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[7.5, -0.06, 5]}
        receiveShadow
      >
        <boxGeometry args={[15, 0.1, 10]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <Grid
        args={[40, 40]}
        cellSize={0.5}
        sectionSize={2.5}
        fadeDistance={45}
        position={[7.5, 0, 5]}
      />
    </>
  );
}

function SceneContents({ objects }: { objects: SceneObject[] }): ReactNode {
  return (
    <>
      <color attach="background" args={["#f8fafc"]} />
      <ambientLight intensity={1.6} />
      <hemisphereLight intensity={0.8} groundColor="#cbd5e1" />
      <directionalLight
        position={[10, 16, 10]}
        intensity={2.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Bounds fit clip observe margin={1.25}>
        <Ground />
        <group>
          {objects.map((o) => (
            <Obj key={o.id} o={o} />
          ))}
        </group>
      </Bounds>

      <OrbitControls
        makeDefault
        enableDamping
        minDistance={3}
        maxDistance={60}
        target={[7.5, 0, 5]}
      />
    </>
  );
}

export default function Scene3D() {
  const objects = useStore((s) => s.objects);

  return (
    <div style={{ width: "100%", height: "calc(100vh - 64px)", minHeight: 0 }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: [18, 16, 18],
          fov: 50,
          near: 0.1,
          far: 200,
        }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <SceneContents objects={objects} />
      </Canvas>
    </div>
  );
}
