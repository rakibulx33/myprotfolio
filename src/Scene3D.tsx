import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Float } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function ParticleWave({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Points>(null!);
  const COUNT = 6000;

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 30;
      arr[i * 3] = x;
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = z;
    }
    return arr;
  }, []);

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();
    const geom = ref.current.geometry as THREE.BufferGeometry;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const x = arr[i * 3];
      const z = arr[i * 3 + 2];
      const d = Math.sqrt(x * x + z * z);
      arr[i * 3 + 1] = Math.sin(d * 0.6 - t * 1.2) * 0.8 + Math.cos(x * 0.3 + t) * 0.3;
    }
    pos.needsUpdate = true;

    const s = scrollRef.current;
    ref.current.rotation.x = 0.4 + s * 0.6;
    ref.current.rotation.y = t * 0.03 + mouse.x * 0.2;
    ref.current.position.y = -2 - s * 4;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#ff7a18"
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.9}
      />
    </Points>
  );
}

function Embers({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Points>(null!);
  const COUNT = 250;
  const data = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const speed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = Math.random() * 14 - 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
      speed[i] = 0.2 + Math.random() * 0.6;
    }
    return { pos, speed };
  }, []);

  useFrame((_, delta) => {
    const geom = ref.current.geometry as THREE.BufferGeometry;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] += data.speed[i] * delta;
      arr[i * 3] += Math.sin(arr[i * 3 + 1] * 0.5) * delta * 0.3;
      if (arr[i * 3 + 1] > 10) arr[i * 3 + 1] = -5;
    }
    pos.needsUpdate = true;
    ref.current.rotation.y = scrollRef.current * 0.3;
  });

  return (
    <Points ref={ref} positions={data.pos} stride={3}>
      <PointMaterial
        transparent
        color="#ffb347"
        size={0.08}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function FloatingCore({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const s = scrollRef.current;
    ref.current.rotation.x = t * 0.2 + s * 2;
    ref.current.rotation.y = t * 0.3;
    ref.current.position.y = 1 - s * 3;
    ref.current.scale.setScalar(1 + s * 0.5);
  });
  return (
    <Float speed={1.5} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial
          color="#ff5722"
          emissive="#ff7a18"
          emissiveIntensity={0.8}
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  );
}

export default function Scene3D({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 2, 8], fov: 60 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#0a0606"]} />
        <fog attach="fog" args={["#0a0606", 8, 22]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} color="#ff7a18" intensity={2} />
        <pointLight position={[-5, -3, 2]} color="#e8326c" intensity={1.5} />
        <FloatingCore scrollRef={scrollRef} />
        <ParticleWave scrollRef={scrollRef} />
        <Embers scrollRef={scrollRef} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0606]/30 to-[#0a0606]/80 pointer-events-none" />
    </div>
  );
}
