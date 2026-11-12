"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { incidents, locations } from "@/lib/data";
import { HEALTH_COLOR } from "@/components/ui";
import type { Location } from "@/lib/types";

const NOW_WINDOW = 30 * 86_400_000;

function useIncidentCounts() {
  return useMemo(() => {
    const latest = Math.max(...incidents.map((i) => i.createdAt));
    const counts = new Map<string, number>();
    for (const i of incidents) {
      if (latest - i.createdAt <= NOW_WINDOW) counts.set(i.locationId, (counts.get(i.locationId) ?? 0) + 1);
    }
    return counts;
  }, []);
}

function Node({
  location,
  volume,
  selected,
  onSelect,
}: {
  location: Location;
  volume: number;
  selected: boolean;
  onSelect: (l: Location) => void;
}) {
  const ring = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const color = HEALTH_COLOR[location.health];
  const radius = 0.055 + Math.min(volume, 30) * 0.0042;
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + offset;
    if (ring.current) {
      const speed = location.health === "critical" ? 1.6 : 0.6;
      const phase = (t * speed) % 1;
      ring.current.scale.setScalar(1 + phase * 2.4);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.55;
    }
    if (core.current) {
      const target = hover || selected ? 1.5 : 1;
      core.current.scale.lerp(new THREE.Vector3(target, target, target), 0.15);
    }
  });

  return (
    <group position={location.position}>
      <mesh
        ref={core}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(location);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[radius, 24, 24]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {location.health !== "healthy" && (
        <mesh ref={ring}>
          <sphereGeometry args={[radius, 20, 20]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} depthWrite={false} />
        </mesh>
      )}
      {selected && (
        <mesh>
          <ringGeometry args={[radius * 2.2, radius * 2.5, 48]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

function Links() {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const colors: number[] = [];
    const base = new THREE.Color("#3D8BFF");
    const alert = new THREE.Color("#FF5470");
    for (const loc of locations) {
      for (const dep of loc.dependsOn) {
        const target = locations.find((l) => l.id === dep);
        if (!target) continue;
        pts.push(...loc.position, ...target.position);
        const c = loc.health === "critical" || target.health === "critical" ? alert : base;
        colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.28} />
    </lineSegments>
  );
}

function Packets() {
  // Small particles travelling along dependency links to suggest live telemetry.
  const ref = useRef<THREE.Points>(null);
  const routes = useMemo(
    () =>
      locations.flatMap((l) =>
        l.dependsOn
          .map((d) => locations.find((x) => x.id === d))
          .filter(Boolean)
          .map((t) => [new THREE.Vector3(...l.position), new THREE.Vector3(...t!.position), Math.random()] as const),
      ),
    [],
  );
  const positions = useMemo(() => new Float32Array(routes.length * 3), [routes]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    routes.forEach(([a, b, o], i) => {
      const p = (t * 0.25 + o) % 1;
      positions[i * 3] = a.x + (b.x - a.x) * p;
      positions[i * 3 + 1] = a.y + (b.y - a.y) * p;
      positions[i * 3 + 2] = a.z + (b.z - a.z) * p;
    });
    if (ref.current) ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#9CC3FF" transparent opacity={0.85} />
    </points>
  );
}

function Shell() {
  return (
    <mesh>
      <icosahedronGeometry args={[3.05, 3]} />
      <meshBasicMaterial color="#1F2C4A" wireframe transparent opacity={0.18} />
    </mesh>
  );
}

export default function OpsNetwork({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (location: Location | null) => void;
}) {
  const counts = useIncidentCounts();
  return (
    <Canvas
      camera={{ position: [0, 0.6, 9.6], fov: 45 }}
      dpr={[1, 2]}
      onPointerMissed={() => onSelect(null)}
      gl={{ antialias: true, alpha: true }}
    >
      <fog attach="fog" args={["#05080F", 7, 14]} />
      <group rotation={[0.25, 0, 0]}>
        <Shell />
        <Links />
        <Packets />
        {locations.map((l) => (
          <Node
            key={l.id}
            location={l}
            volume={counts.get(l.id) ?? 0}
            selected={l.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </group>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={!selectedId} autoRotateSpeed={0.45} />
    </Canvas>
  );
}
