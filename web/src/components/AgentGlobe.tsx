import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

interface ActionLog {
  id: number;
  agentId: string;
  agentName: string;
  timestamp: string;
  action: string;
  affectedLocations?: string[];
}

interface AgentGlobeProps {
  actionLogs: ActionLog[];
}

// Datacenter locations
const DATACENTER_LOCATIONS: { [key: string]: { lat: number; lon: number; name: string } } = {
  'Texas': { lat: 31.9686, lon: -99.9018, name: 'Texas' },
  'Phoenix': { lat: 33.4484, lon: -112.0740, name: 'Phoenix' },
  'Iceland': { lat: 64.9631, lon: -19.0208, name: 'Iceland' },
  'Oregon': { lat: 43.8041, lon: -120.5542, name: 'Oregon' },
  'Virginia': { lat: 37.4316, lon: -78.6569, name: 'Virginia' },
  'Singapore': { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
  'Taiwan': { lat: 23.6978, lon: 120.9605, name: 'Taiwan' },
  'Europe': { lat: 50.8503, lon: 4.3517, name: 'Europe' }
};

// Convert lat/lon to 3D coordinates
const latLonToVector3 = (lat: number, lon: number, radius: number = 2): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
};

// Earth Globe Component
const Globe = () => {
  const globeRef = useRef<THREE.Mesh>(null!);

  // Create Earth texture
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Ocean
    ctx.fillStyle = '#0a1929';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Land masses (simplified)
    ctx.fillStyle = '#1e3a5f';

    // North America
    ctx.beginPath();
    ctx.ellipse(300, 350, 200, 150, 0, 0, Math.PI * 2);
    ctx.fill();

    // South America
    ctx.beginPath();
    ctx.ellipse(450, 650, 120, 200, 0, 0, Math.PI * 2);
    ctx.fill();

    // Europe
    ctx.beginPath();
    ctx.ellipse(1024, 300, 150, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    // Africa
    ctx.beginPath();
    ctx.ellipse(1100, 550, 180, 220, 0, 0, Math.PI * 2);
    ctx.fill();

    // Asia
    ctx.beginPath();
    ctx.ellipse(1500, 350, 300, 200, 0, 0, Math.PI * 2);
    ctx.fill();

    // Australia
    ctx.beginPath();
    ctx.ellipse(1650, 750, 120, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={globeRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};

// Datacenter Marker Component
const DatacenterMarker = ({ position, name, active }: { position: THREE.Vector3; name: string; active: boolean }) => {
  const markerRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (markerRef.current && active) {
      markerRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2) * 0.2);
    }
  });

  return (
    <mesh ref={markerRef} position={position}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial
        color={active ? '#3b82f6' : '#64748b'}
        emissive={active ? '#3b82f6' : '#000000'}
        emissiveIntensity={active ? 0.5 : 0}
      />
    </mesh>
  );
};

// Connection Arc Component
const ConnectionArc = ({ start, end, color = '#3b82f6' }: { start: THREE.Vector3; end: THREE.Vector3; color?: string }) => {
  const points = useMemo(() => {
    const result: THREE.Vector3[] = [];
    const steps = 50;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      // Linear interpolation
      const point = new THREE.Vector3().lerpVectors(start, end, t);

      // Add height for arc effect
      const height = Math.sin(t * Math.PI) * 0.5;
      point.normalize().multiplyScalar(2 + height);

      result.push(point);
    }

    return result;
  }, [start, end]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.6}
    />
  );
};

// Main Scene Component
const Scene = ({ actionLogs }: { actionLogs: ActionLog[] }) => {
  // Get active locations from recent logs
  const activeLocations = useMemo(() => {
    const recent = actionLogs.slice(0, 10);
    const locations = new Set<string>();

    recent.forEach(log => {
      if (log.affectedLocations) {
        log.affectedLocations.forEach(loc => locations.add(loc));
      }
    });

    return Array.from(locations);
  }, [actionLogs]);

  // Get connections between locations from recent logs
  const connections = useMemo(() => {
    const conns: Array<{ from: string; to: string; color: string }> = [];
    const recent = actionLogs.slice(0, 5);

    recent.forEach(log => {
      if (log.affectedLocations && log.affectedLocations.length >= 2) {
        // Connect first location to others
        for (let i = 1; i < log.affectedLocations.length; i++) {
          conns.push({
            from: log.affectedLocations[0],
            to: log.affectedLocations[i],
            color: getAgentColor(log.agentId)
          });
        }
      }
    });

    return conns;
  }, [actionLogs]);

  const getAgentColor = (agentId: string): string => {
    const colors: { [key: string]: string } = {
      'energy-optimizer': '#10b981',
      'network-optimizer': '#3b82f6',
      'supply-chain': '#f59e0b',
      'carbon-offset': '#22c55e',
      'gpu-arbitrage': '#8b5cf6',
      'risk-hedging': '#ef4444',
      'returns-maximizer': '#06b6d4'
    };
    return colors[agentId] || '#3b82f6';
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <Globe />

      {/* Render datacenter markers */}
      {Object.entries(DATACENTER_LOCATIONS).map(([key, loc]) => {
        const position = latLonToVector3(loc.lat, loc.lon);
        const isActive = activeLocations.includes(key);
        return <DatacenterMarker key={key} position={position} name={loc.name} active={isActive} />;
      })}

      {/* Render connections */}
      {connections.map((conn, idx) => {
        const fromLoc = DATACENTER_LOCATIONS[conn.from];
        const toLoc = DATACENTER_LOCATIONS[conn.to];

        if (!fromLoc || !toLoc) return null;

        const start = latLonToVector3(fromLoc.lat, fromLoc.lon);
        const end = latLonToVector3(toLoc.lat, toLoc.lon);

        return <ConnectionArc key={idx} start={start} end={end} color={conn.color} />;
      })}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
};

const AgentGlobe: React.FC<AgentGlobeProps> = ({ actionLogs }) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <Scene actionLogs={actionLogs} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default AgentGlobe;
