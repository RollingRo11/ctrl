import React, { useRef, useMemo, Suspense, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { VesselData, FlightData, ChokePoint, WeatherEvent } from '@/services/logisticsApi';
import { Button } from '@/components/ui/button';
import { Maximize2 } from 'lucide-react';

interface LogisticsGlobeProps {
  vessels: VesselData[];
  flights: FlightData[];
  chokePoints: ChokePoint[];
  weather: WeatherEvent[];
  activeLayers: {
    vessels: boolean;
    flights: boolean;
    chokePoints: boolean;
    weather: boolean;
  };
  onChokePointClick?: (chokePoint: ChokePoint) => void;
  onVesselClick?: (vessel: VesselData) => void;
  hoveredItem: any;
  setHoveredItem: (item: any) => void;
}

// Convert lat/lon to 3D coordinates
const latLonToVector3 = (lat: number, lon: number, radius: number = 2): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

// Realistic Earth Globe with better colors
const Globe = () => {
  const meshRef = useRef<THREE.Mesh>(null!);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Ocean - deeper blue
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGradient.addColorStop(0, '#1e3a5f');
    oceanGradient.addColorStop(0.5, '#2563eb');
    oceanGradient.addColorStop(1, '#1e3a5f');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Land - more realistic green/brown
    ctx.fillStyle = '#34a853';

    // North America (more detailed)
    ctx.beginPath();
    ctx.ellipse(250, 300, 180, 130, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(320, 430, 90, 70, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // South America
    ctx.beginPath();
    ctx.ellipse(400, 680, 110, 200, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Europe
    ctx.fillStyle = '#3d8f3d';
    ctx.beginPath();
    ctx.ellipse(1000, 280, 140, 90, 0, 0, Math.PI * 2);
    ctx.fill();

    // Africa
    ctx.fillStyle = '#e5a642';
    ctx.beginPath();
    ctx.ellipse(1050, 600, 200, 250, 0, 0, Math.PI * 2);
    ctx.fill();

    // Asia
    ctx.fillStyle = '#34a853';
    ctx.beginPath();
    ctx.ellipse(1600, 350, 400, 250, 0, 0, Math.PI * 2);
    ctx.fill();

    // Australia
    ctx.fillStyle = '#d4a259';
    ctx.beginPath();
    ctx.ellipse(1800, 800, 130, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    // Add subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 16; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * (canvas.height / 16));
      ctx.lineTo(canvas.width, i * (canvas.height / 16));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * (canvas.width / 16), 0);
      ctx.lineTo(i * (canvas.width / 16), canvas.height);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <Sphere ref={meshRef} args={[2, 64, 64]}>
      <meshStandardMaterial
        map={texture || undefined}
        roughness={0.7}
        metalness={0.1}
      />
    </Sphere>
  );
};

// Shipping Route - curved tube
const ShippingRoute: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
}> = ({ start, end, color }) => {
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 50;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = new THREE.Vector3().lerpVectors(start, end, t);
      const arcHeight = 0.4 * Math.sin(t * Math.PI);
      point.normalize().multiplyScalar(2 + arcHeight);
      pts.push(point);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 50, 0.008, 8, false);
  }, [start, end]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  );
};

// Choke Point Marker with pulsing animation
const ChokePointMarker: React.FC<{
  chokePoint: ChokePoint;
  onClick?: () => void;
  onHover: (hovered: boolean) => void;
}> = ({ chokePoint, onClick, onHover }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const position = useMemo(() => latLonToVector3(chokePoint.lat, chokePoint.lon, 2.05), [chokePoint]);

  const color = useMemo(() => {
    switch (chokePoint.riskLevel) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#ffffff';
    }
  }, [chokePoint.riskLevel]);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
      >
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      <pointLight color={color} intensity={1} distance={0.8} />
    </group>
  );
};

// Vessel Marker
const VesselMarker: React.FC<{
  vessel: VesselData;
  onClick?: () => void;
  onHover: (hovered: boolean) => void;
}> = ({ vessel, onClick, onHover }) => {
  const position = useMemo(() => latLonToVector3(vessel.lat, vessel.lon, 2.02), [vessel]);

  return (
    <mesh
      position={position}
      onClick={onClick}
      onPointerOver={() => onHover(true)}
      onPointerOut={() => onHover(false)}
    >
      <boxGeometry args={[0.02, 0.02, 0.02]} />
      <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.5} />
    </mesh>
  );
};

// Flight Marker
const FlightMarker: React.FC<{
  flight: FlightData;
  onHover: (hovered: boolean) => void;
}> = ({ flight, onHover }) => {
  const position = useMemo(
    () => latLonToVector3(flight.lat, flight.lon, 2.2 + flight.altitude / 40000),
    [flight]
  );

  return (
    <mesh
      position={position}
      onPointerOver={() => onHover(true)}
      onPointerOut={() => onHover(false)}
    >
      <coneGeometry args={[0.015, 0.03, 4]} />
      <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
    </mesh>
  );
};

// Camera controller
const CameraController: React.FC<{ resetTrigger: number }> = ({ resetTrigger }) => {
  const { camera } = useThree();

  React.useEffect(() => {
    if (resetTrigger > 0) {
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
    }
  }, [resetTrigger, camera]);

  return null;
};

// Main Scene
const Scene: React.FC<LogisticsGlobeProps & { resetTrigger: number }> = ({
  vessels,
  flights,
  chokePoints,
  weather,
  activeLayers,
  onChokePointClick,
  onVesselClick,
  setHoveredItem,
  resetTrigger,
}) => {
  const controlsRef = useRef<any>();

  // Major shipping routes
  const shippingRoutes = useMemo(() => [
    { start: latLonToVector3(31.23, 121.47), end: latLonToVector3(33.74, -118.27), color: '#06b6d4', name: 'Trans-Pacific' },
    { start: latLonToVector3(1.29, 103.85), end: latLonToVector3(51.92, 4.48), color: '#8b5cf6', name: 'Asia-Europe' },
    { start: latLonToVector3(30.5, 32.3), end: latLonToVector3(40.64, -74.07), color: '#ec4899', name: 'Suez-Atlantic' },
    { start: latLonToVector3(22.28, 114.16), end: latLonToVector3(51.50, -0.13), color: '#f59e0b', name: 'China-UK' },
    { start: latLonToVector3(35.68, 139.76), end: latLonToVector3(47.56, -122.33), color: '#10b981', name: 'Pacific Coast' },
  ], []);

  React.useEffect(() => {
    if (resetTrigger > 0 && controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [resetTrigger]);

  return (
    <>
      <CameraController resetTrigger={resetTrigger} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      <Globe />

      {/* Shipping Routes */}
      {shippingRoutes.map((route, idx) => (
        <ShippingRoute
          key={`route-${idx}`}
          start={route.start}
          end={route.end}
          color={route.color}
        />
      ))}

      {/* Choke Points */}
      {activeLayers.chokePoints &&
        chokePoints.map((cp) => (
          <ChokePointMarker
            key={cp.id}
            chokePoint={cp}
            onClick={() => onChokePointClick?.(cp)}
            onHover={(hovered) => setHoveredItem(hovered ? cp : null)}
          />
        ))}

      {/* Vessels */}
      {activeLayers.vessels &&
        vessels.slice(0, 150).map((vessel) => (
          <VesselMarker
            key={vessel.mmsi}
            vessel={vessel}
            onClick={() => onVesselClick?.(vessel)}
            onHover={(hovered) => setHoveredItem(hovered ? vessel : null)}
          />
        ))}

      {/* Flights */}
      {activeLayers.flights &&
        flights.slice(0, 200).map((flight) => (
          <FlightMarker
            key={flight.icao24}
            flight={flight}
            onHover={(hovered) => setHoveredItem(hovered ? flight : null)}
          />
        ))}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.6}
        minDistance={2.5}
        maxDistance={8}
        enablePan={false}
      />
    </>
  );
};

// Main Component
export const LogisticsGlobe: React.FC<LogisticsGlobeProps> = (props) => {
  const [resetTrigger, setResetTrigger] = useState(0);

  return (
    <div className="relative w-full h-full" style={{ minHeight: '600px', maxHeight: '600px' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene {...props} resetTrigger={resetTrigger} />
        </Suspense>
      </Canvas>

      {/* Recenter Button */}
      <Button
        onClick={() => setResetTrigger((prev) => prev + 1)}
        size="sm"
        className="absolute top-4 right-4 z-10 bg-gray-800 hover:bg-gray-700 border border-gray-600"
        variant="secondary"
      >
        <Maximize2 className="h-4 w-4 mr-2" />
        Recenter
      </Button>

      {/* Tooltip */}
      {props.hoveredItem && (
        <div className="absolute top-4 left-4 bg-gray-900 border border-gray-700 text-white p-3 rounded-lg shadow-xl max-w-xs z-10">
          {props.hoveredItem.name && (
            <div className="font-bold text-lg mb-1">{props.hoveredItem.name}</div>
          )}
          {props.hoveredItem.callsign && (
            <div className="font-bold text-lg mb-1">{props.hoveredItem.callsign}</div>
          )}
          {props.hoveredItem.type && (
            <div className="text-sm text-gray-400">Type: {props.hoveredItem.type}</div>
          )}
          {props.hoveredItem.riskLevel && (
            <div className="text-sm">
              Risk: <span className={`font-bold ${
                props.hoveredItem.riskLevel === 'critical' ? 'text-red-400' :
                props.hoveredItem.riskLevel === 'high' ? 'text-orange-400' :
                props.hoveredItem.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
              }`}>{props.hoveredItem.riskLevel.toUpperCase()}</span>
            </div>
          )}
          {props.hoveredItem.currentCongestion !== undefined && (
            <div className="text-sm text-gray-400">
              Congestion: {props.hoveredItem.currentCongestion}%
            </div>
          )}
          {props.hoveredItem.speed && (
            <div className="text-sm text-gray-400">
              Speed: {props.hoveredItem.speed.toFixed(1)} knots
            </div>
          )}
          {props.hoveredItem.altitude && (
            <div className="text-sm text-gray-400">
              Altitude: {props.hoveredItem.altitude.toFixed(0)} m
            </div>
          )}
          {props.hoveredItem.destination && (
            <div className="text-sm text-gray-400 mt-1">
              → {props.hoveredItem.destination}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
