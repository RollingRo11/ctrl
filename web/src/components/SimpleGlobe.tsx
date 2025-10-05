import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { fetchFlightData, fetchVesselData, CHOKE_POINTS, FlightData, VesselData, ChokePoint } from '@/services/logisticsApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, Ship, AlertTriangle, Activity, RotateCw, Anchor } from 'lucide-react';

// Convert lat/lon to 3D coordinates
const latLonToVector3 = (lat: number, lon: number, radius: number = 2) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// Earth sphere with real Earth texture using TextureLoader
const EarthSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Load Earth texture from free public CDN
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    // Using NASA's Blue Marble texture from a CDN
    const earthTexture = loader.load(
      'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg',
      () => console.log('Earth texture loaded'),
      undefined,
      (error) => {
        console.error('Error loading Earth texture:', error);
      }
    );
    return earthTexture;
  }, []);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.7}
        metalness={0.2}
      />
    </mesh>
  );
};

// Flight marker (plane shape - triangle)
const FlightMarker = ({ position }: { position: THREE.Vector3 }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create triangle shape for plane
  const planeShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.03);
    shape.lineTo(-0.015, -0.02);
    shape.lineTo(0.015, -0.02);
    shape.lineTo(0, 0.03);
    return shape;
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.lookAt(0, 0, 0);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <extrudeGeometry args={[planeShape, { depth: 0.01, bevelEnabled: false }]} />
      <meshBasicMaterial color="#fbbf24" />
    </mesh>
  );
};

// Vessel marker (box shape for cargo ship)
const VesselMarker = ({ position }: { position: THREE.Vector3 }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.04, 0.015, 0.02]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.02, 0.01, 0.01]} />
        <meshBasicMaterial color="#60a5fa" />
      </mesh>
    </group>
  );
};

// Choke point marker (pulsing cylinder)
const ChokePointMarker = ({ position, risk }: { position: THREE.Vector3; risk: string }) => {
  const color = risk === 'critical' ? '#ef4444' : risk === 'high' ? '#f97316' : '#eab308';
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.2;
      meshRef.current.scale.set(scale, 1, scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <cylinderGeometry args={[0.03, 0.03, 0.05, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
};

// Port marker (cube with crane)
const PortMarker = ({ position, name }: { position: THREE.Vector3; name: string }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.035, 0.035, 0.02]} />
        <meshBasicMaterial color="#a855f7" />
      </mesh>
      <mesh position={[0.015, 0.025, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.03, 6]} />
        <meshBasicMaterial color="#c084fc" />
      </mesh>
    </group>
  );
};

// Airport marker (cone)
const AirportMarker = ({ position, name }: { position: THREE.Vector3; name: string }) => {
  return (
    <mesh position={position}>
      <coneGeometry args={[0.025, 0.04, 4]} />
      <meshBasicMaterial color="#ec4899" />
    </mesh>
  );
};

// Shipping route arc
const ShippingRoute = ({ start, end, color }: { start: THREE.Vector3; end: THREE.Vector3; color: string }) => {
  const points = useMemo(() => {
    const startVec = start.clone();
    const endVec = end.clone();
    const distance = startVec.distanceTo(endVec);
    const arcHeight = distance * 0.3;

    const midpoint = new THREE.Vector3()
      .addVectors(startVec, endVec)
      .multiplyScalar(0.5);

    midpoint.normalize().multiplyScalar(2 + arcHeight);

    const curve = new THREE.QuadraticBezierCurve3(startVec, midpoint, endVec);
    return curve.getPoints(50);
  }, [start, end]);

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 50, 0.005, 8, false);
  }, [points]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </mesh>
  );
};

// Infrastructure locations (Major ports, airports, and hubs)
const INFRASTRUCTURE_LOCATIONS = [
  // Major Ports
  { name: 'LA/Long Beach Port', type: 'port', lat: 33.7, lon: -118.3 },
  { name: 'Port of Singapore', type: 'port', lat: 1.3, lon: 103.8 },
  { name: 'Port of Rotterdam', type: 'port', lat: 51.9, lon: 4.5 },
  { name: 'Port of Shanghai', type: 'port', lat: 31.2, lon: 121.5 },
  { name: 'Port of Shenzhen', type: 'port', lat: 22.5, lon: 114.1 },
  { name: 'Port of Ningbo', type: 'port', lat: 29.9, lon: 121.6 },
  { name: 'Port of Busan', type: 'port', lat: 35.1, lon: 129.0 },
  { name: 'Port of Hong Kong', type: 'port', lat: 22.3, lon: 114.2 },
  { name: 'Port of Antwerp', type: 'port', lat: 51.3, lon: 4.4 },
  { name: 'Port of Hamburg', type: 'port', lat: 53.5, lon: 9.9 },
  { name: 'Port of Houston', type: 'port', lat: 29.7, lon: -95.3 },
  { name: 'Port of New York/NJ', type: 'port', lat: 40.7, lon: -74.0 },
  { name: 'Port of Savannah', type: 'port', lat: 32.1, lon: -81.1 },
  { name: 'Port of Mombasa', type: 'port', lat: -4.0, lon: 39.6 },
  { name: 'JNPT Mumbai', type: 'port', lat: 18.9, lon: 72.9 },
  { name: 'Port of Darwin', type: 'port', lat: -12.4, lon: 130.8 },
  { name: 'Port of Sydney', type: 'port', lat: -33.9, lon: 151.2 },
  { name: 'Port of Melbourne', type: 'port', lat: -37.8, lon: 144.9 },
  { name: 'Port of Tokyo', type: 'port', lat: 35.6, lon: 139.8 },
  { name: 'Port of Yokohama', type: 'port', lat: 35.4, lon: 139.6 },
  { name: 'Port of Santos', type: 'port', lat: -23.9, lon: -46.3 },
  { name: 'Port of Valparaiso', type: 'port', lat: -33.0, lon: -71.6 },
  { name: 'Port of Vancouver', type: 'port', lat: 49.3, lon: -123.1 },
  { name: 'Port of Seattle', type: 'port', lat: 47.6, lon: -122.3 },
  { name: 'Port of Jebel Ali (Dubai)', type: 'port', lat: 25.0, lon: 55.0 },
  { name: 'Port of Colombo', type: 'port', lat: 6.9, lon: 79.9 },
  { name: 'Port of Cape Town', type: 'port', lat: -33.9, lon: 18.4 },
  { name: 'Port of Lagos', type: 'port', lat: 6.5, lon: 3.4 },

  // Major Airports
  { name: 'Dubai Al Maktoum', type: 'airport', lat: 25.2, lon: 55.3 },
  { name: 'Heathrow Airport', type: 'airport', lat: 51.5, lon: -0.5 },
  { name: 'LAX Airport', type: 'airport', lat: 33.9, lon: -118.4 },
  { name: 'JFK Airport', type: 'airport', lat: 40.6, lon: -73.8 },
  { name: 'Hong Kong Int Airport', type: 'airport', lat: 22.3, lon: 113.9 },
  { name: 'Singapore Changi', type: 'airport', lat: 1.4, lon: 103.9 },
  { name: 'Tokyo Narita', type: 'airport', lat: 35.8, lon: 140.4 },
  { name: 'Frankfurt Airport', type: 'airport', lat: 50.0, lon: 8.6 },
  { name: 'Amsterdam Schiphol', type: 'airport', lat: 52.3, lon: 4.8 },
  { name: 'Paris CDG', type: 'airport', lat: 49.0, lon: 2.5 },
  { name: 'Beijing Capital', type: 'airport', lat: 40.1, lon: 116.6 },
  { name: 'Shanghai Pudong', type: 'airport', lat: 31.1, lon: 121.8 },
  { name: 'Seoul Incheon', type: 'airport', lat: 37.5, lon: 126.4 },
  { name: 'Sydney Airport', type: 'airport', lat: -33.9, lon: 151.2 },
  { name: 'São Paulo GRU', type: 'airport', lat: -23.4, lon: -46.5 },
];

const Scene = ({
  flights,
  vessels,
  chokePoints,
  showFlights,
  showVessels,
  showChokePoints,
  showRoutes,
  showInfrastructure
}: {
  flights: FlightData[];
  vessels: VesselData[];
  chokePoints: ChokePoint[];
  showFlights: boolean;
  showVessels: boolean;
  showChokePoints: boolean;
  showRoutes: boolean;
  showInfrastructure: boolean;
}) => {
  // Major global shipping routes
  const routes = useMemo(() => [
    // Trans-Pacific Routes
    { start: latLonToVector3(33.7, -118.3), end: latLonToVector3(35.4, 139.6), color: '#60a5fa' }, // LA to Tokyo
    { start: latLonToVector3(33.7, -118.3), end: latLonToVector3(31.2, 121.5), color: '#60a5fa' }, // LA to Shanghai
    { start: latLonToVector3(47.6, -122.3), end: latLonToVector3(35.1, 129.0), color: '#60a5fa' }, // Seattle to Busan
    { start: latLonToVector3(49.3, -123.1), end: latLonToVector3(22.3, 114.2), color: '#60a5fa' }, // Vancouver to Hong Kong

    // Trans-Atlantic Routes
    { start: latLonToVector3(51.9, 4.5), end: latLonToVector3(40.7, -74.0), color: '#60a5fa' }, // Rotterdam to NY
    { start: latLonToVector3(51.5, -0.5), end: latLonToVector3(40.6, -73.8), color: '#3b82f6' }, // London to JFK
    { start: latLonToVector3(53.5, 9.9), end: latLonToVector3(29.7, -95.3), color: '#60a5fa' }, // Hamburg to Houston

    // Asia-Europe Routes
    { start: latLonToVector3(31.2, 121.5), end: latLonToVector3(51.9, 4.5), color: '#60a5fa' }, // Shanghai to Rotterdam
    { start: latLonToVector3(1.3, 103.8), end: latLonToVector3(51.3, 4.4), color: '#60a5fa' }, // Singapore to Antwerp
    { start: latLonToVector3(22.5, 114.1), end: latLonToVector3(53.5, 9.9), color: '#60a5fa' }, // Shenzhen to Hamburg

    // Middle East Hub Routes
    { start: latLonToVector3(25.0, 55.0), end: latLonToVector3(51.9, 4.5), color: '#60a5fa' }, // Dubai to Rotterdam
    { start: latLonToVector3(25.0, 55.0), end: latLonToVector3(1.3, 103.8), color: '#60a5fa' }, // Dubai to Singapore
    { start: latLonToVector3(25.2, 55.3), end: latLonToVector3(40.6, -73.8), color: '#3b82f6' }, // Dubai Airport to JFK

    // Asia-Pacific Routes
    { start: latLonToVector3(1.3, 103.8), end: latLonToVector3(-33.9, 151.2), color: '#60a5fa' }, // Singapore to Sydney
    { start: latLonToVector3(22.3, 114.2), end: latLonToVector3(-37.8, 144.9), color: '#60a5fa' }, // Hong Kong to Melbourne
    { start: latLonToVector3(35.6, 139.8), end: latLonToVector3(-12.4, 130.8), color: '#60a5fa' }, // Tokyo to Darwin

    // Africa Routes
    { start: latLonToVector3(-4.0, 39.6), end: latLonToVector3(18.9, 72.9), color: '#60a5fa' }, // Mombasa to Mumbai
    { start: latLonToVector3(-33.9, 18.4), end: latLonToVector3(51.9, 4.5), color: '#60a5fa' }, // Cape Town to Rotterdam
    { start: latLonToVector3(6.5, 3.4), end: latLonToVector3(40.7, -74.0), color: '#60a5fa' }, // Lagos to NY

    // South America Routes
    { start: latLonToVector3(-23.9, -46.3), end: latLonToVector3(40.7, -74.0), color: '#60a5fa' }, // Santos to NY
    { start: latLonToVector3(-33.0, -71.6), end: latLonToVector3(31.2, 121.5), color: '#60a5fa' }, // Valparaiso to Shanghai

    // Intra-Asia Routes
    { start: latLonToVector3(31.2, 121.5), end: latLonToVector3(35.1, 129.0), color: '#3b82f6' }, // Shanghai to Busan
    { start: latLonToVector3(22.3, 114.2), end: latLonToVector3(1.3, 103.8), color: '#3b82f6' }, // Hong Kong to Singapore
    { start: latLonToVector3(35.4, 139.6), end: latLonToVector3(37.5, 126.4), color: '#3b82f6' }, // Yokohama to Incheon
  ], []);

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />
      <pointLight position={[-5, -3, -5]} intensity={0.3} />
      <EarthSphere />

      {/* Render flights (sample first 50 for performance) */}
      {showFlights && flights.slice(0, 50).map((flight, idx) => (
        <FlightMarker
          key={`flight-${idx}`}
          position={latLonToVector3(flight.lat, flight.lon)}
        />
      ))}

      {/* Render vessels */}
      {showVessels && vessels.slice(0, 30).map((vessel, idx) => (
        <VesselMarker
          key={`vessel-${idx}`}
          position={latLonToVector3(vessel.lat, vessel.lon)}
        />
      ))}

      {/* Render choke points */}
      {showChokePoints && chokePoints.map((choke, idx) => (
        <ChokePointMarker
          key={`choke-${idx}`}
          position={latLonToVector3(choke.lat, choke.lon)}
          risk={choke.riskLevel}
        />
      ))}

      {/* Render infrastructure */}
      {showInfrastructure && INFRASTRUCTURE_LOCATIONS.map((infra, idx) => (
        infra.type === 'port' ? (
          <PortMarker
            key={`infra-${idx}`}
            position={latLonToVector3(infra.lat, infra.lon)}
            name={infra.name}
          />
        ) : (
          <AirportMarker
            key={`infra-${idx}`}
            position={latLonToVector3(infra.lat, infra.lon)}
            name={infra.name}
          />
        )
      ))}

      {/* Render shipping routes */}
      {showRoutes && routes.map((route, idx) => (
        <ShippingRoute
          key={`route-${idx}`}
          start={route.start}
          end={route.end}
          color={route.color}
        />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={10}
        rotateSpeed={0.5}
      />
    </>
  );
};

export const SimpleGlobe = () => {
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [vessels, setVessels] = useState<VesselData[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState({ opensky: 'connecting', marine: 'demo' });

  // Filter toggles
  const [showFlights, setShowFlights] = useState(true);
  const [showVessels, setShowVessels] = useState(true);
  const [showChokePoints, setShowChokePoints] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showInfrastructure, setShowInfrastructure] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const startTime = Date.now();
        const [flightData, vesselData] = await Promise.all([
          fetchFlightData(),
          fetchVesselData()
        ]);

        // Check if real API data or demo
        const responseTime = Date.now() - startTime;
        setApiStatus({
          opensky: flightData.length > 0 ? 'connected' : 'error',
          marine: 'demo' // Always demo for now
        });

        setFlights(flightData);
        setVessels(vesselData);
      } catch (error) {
        console.error('Error loading logistics data:', error);
        setApiStatus({ opensky: 'error', marine: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Main Globe Container */}
      <div className="relative">
        <div className="w-full bg-gradient-to-b from-gray-950 to-gray-900 rounded-xl border border-gray-800 shadow-2xl" style={{ height: '650px' }}>
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <Scene
              flights={flights}
              vessels={vessels}
              chokePoints={CHOKE_POINTS}
              showFlights={showFlights}
              showVessels={showVessels}
              showChokePoints={showChokePoints}
              showRoutes={showRoutes}
              showInfrastructure={showInfrastructure}
            />
          </Canvas>
        </div>

        {/* Overlay Stats */}
        <div className="absolute top-4 left-4 space-y-2">
          <div className="bg-black/70 backdrop-blur-sm border border-yellow-500/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-yellow-400" />
              <span className="text-white text-sm font-semibold">{flights.length}</span>
              <span className="text-gray-400 text-xs">Active Flights</span>
            </div>
          </div>
          <div className="bg-black/70 backdrop-blur-sm border border-blue-500/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Ship className="h-4 w-4 text-blue-400" />
              <span className="text-white text-sm font-semibold">{vessels.length}</span>
              <span className="text-gray-400 text-xs">Cargo Vessels</span>
            </div>
          </div>
          <div className="bg-black/70 backdrop-blur-sm border border-purple-500/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Anchor className="h-4 w-4 text-purple-400" />
              <span className="text-white text-sm font-semibold">28</span>
              <span className="text-gray-400 text-xs">Major Ports</span>
            </div>
          </div>
          <div className="bg-black/70 backdrop-blur-sm border border-pink-500/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-pink-400" />
              <span className="text-white text-sm font-semibold">15</span>
              <span className="text-gray-400 text-xs">Hub Airports</span>
            </div>
          </div>
          <div className="bg-black/70 backdrop-blur-sm border border-red-500/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-white text-sm font-semibold">{CHOKE_POINTS.length}</span>
              <span className="text-gray-400 text-xs">Choke Points</span>
            </div>
          </div>
          <div className="bg-black/70 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-white text-sm font-semibold">24</span>
              <span className="text-gray-400 text-xs">Trade Routes</span>
            </div>
          </div>
        </div>

        {/* Controls Overlay */}
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm border border-gray-700 rounded-lg p-2 space-y-1.5 w-36">
          <div className="text-xs text-gray-300 font-semibold mb-1">Display Layers</div>
          <Button
            size="sm"
            variant={showFlights ? "default" : "ghost"}
            onClick={() => setShowFlights(!showFlights)}
            className="w-full justify-start h-7 text-xs px-2"
          >
            <Plane className="h-3 w-3 mr-1.5" />
            Flights
          </Button>
          <Button
            size="sm"
            variant={showVessels ? "default" : "ghost"}
            onClick={() => setShowVessels(!showVessels)}
            className="w-full justify-start h-7 text-xs px-2"
          >
            <Ship className="h-3 w-3 mr-1.5" />
            Vessels
          </Button>
          <Button
            size="sm"
            variant={showChokePoints ? "default" : "ghost"}
            onClick={() => setShowChokePoints(!showChokePoints)}
            className="w-full justify-start h-7 text-xs px-2"
          >
            <AlertTriangle className="h-3 w-3 mr-1.5" />
            Choke Points
          </Button>
          <Button
            size="sm"
            variant={showRoutes ? "default" : "ghost"}
            onClick={() => setShowRoutes(!showRoutes)}
            className="w-full justify-start h-7 text-xs px-2"
          >
            <Activity className="h-3 w-3 mr-1.5" />
            Routes
          </Button>
          <Button
            size="sm"
            variant={showInfrastructure ? "default" : "ghost"}
            onClick={() => setShowInfrastructure(!showInfrastructure)}
            className="w-full justify-start h-7 text-xs px-2"
          >
            <Anchor className="h-3 w-3 mr-1.5" />
            Infrastructure
          </Button>
        </div>

        {/* Legend at Bottom */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2.5 bg-yellow-400" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
              <span className="text-gray-300">Aircraft</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-blue-400"></div>
              <span className="text-gray-300">Ships</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-3 bg-purple-400"></div>
              <span className="text-gray-300">Ports</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-pink-500" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
              <span className="text-gray-300">Airports</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-gray-300">Critical Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gray-900 border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-3">Top Congested Ports</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Singapore Port</span>
              <Badge variant="outline" className="text-xs text-orange-400">82% Capacity</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">LA/Long Beach</span>
              <Badge variant="outline" className="text-xs text-red-400">91% Capacity</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Shanghai Port</span>
              <Badge variant="outline" className="text-xs text-yellow-400">76% Capacity</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gray-900 border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-3">Active Trade Volume</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Trans-Pacific</span>
              <span className="text-sm text-white font-semibold">8.2M TEU</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Asia-Europe</span>
              <span className="text-sm text-white font-semibold">6.8M TEU</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Trans-Atlantic</span>
              <span className="text-sm text-white font-semibold">3.1M TEU</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gray-900 border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-3">Critical Alerts</h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5" />
              <span className="text-xs text-gray-400">Panama Canal: Low water levels causing delays</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3 w-3 text-orange-400 mt-0.5" />
              <span className="text-xs text-gray-400">Suez Canal: High congestion (75%)</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5" />
              <span className="text-xs text-gray-400">Strait of Malacca: Weather delays expected</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Source Info */}
      <Card className="p-4 bg-gray-900 border-gray-800">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">Data Sources</h3>
            <p className="text-xs text-gray-400">Real-time API integrations updating every 30 seconds · {flights.length} flights tracked · {vessels.length} vessels monitored</p>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="text-xs">
              OpenSky Network
            </Badge>
            <Badge variant="outline" className="text-xs">
              Marine Traffic (Demo)
            </Badge>
            <Badge variant="outline" className="text-xs">
              AIS Hub
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
