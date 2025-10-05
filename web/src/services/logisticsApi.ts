// Logistics API Service
// Handles real-time data fetching for cargo ships, flights, ports, and weather

export interface VesselData {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  destination?: string;
  eta?: string;
  type: string;
  status?: string;
}

export interface FlightData {
  icao24: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude: number;
  velocity: number;
  heading: number;
  origin?: string;
  destination?: string;
}

export interface ChokePoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: 'port' | 'strait' | 'canal' | 'airport';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  currentCongestion: number;
  description: string;
  impact?: string;
}

export interface WeatherEvent {
  id: string;
  type: string;
  lat: number;
  lon: number;
  severity: string;
  description: string;
}

// Static choke points data
export const CHOKE_POINTS: ChokePoint[] = [
  {
    id: 'suez',
    name: 'Suez Canal',
    lat: 30.5,
    lon: 32.3,
    type: 'canal',
    riskLevel: 'high',
    currentCongestion: 75,
    description: 'Critical maritime passage connecting Mediterranean and Red Sea',
    impact: '12% of global trade'
  },
  {
    id: 'panama',
    name: 'Panama Canal',
    lat: 9.08,
    lon: -79.68,
    type: 'canal',
    riskLevel: 'medium',
    currentCongestion: 60,
    description: 'Strategic waterway connecting Atlantic and Pacific',
    impact: '6% of global trade'
  },
  {
    id: 'singapore',
    name: 'Strait of Malacca',
    lat: 1.43,
    lon: 102.87,
    type: 'strait',
    riskLevel: 'medium',
    currentCongestion: 70,
    description: 'Busiest shipping lane in the world',
    impact: '25% of traded goods'
  },
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    lat: 26.57,
    lon: 56.25,
    type: 'strait',
    riskLevel: 'critical',
    currentCongestion: 85,
    description: 'Critical oil shipping route',
    impact: '21% of global petroleum'
  },
  {
    id: 'la-long-beach',
    name: 'LA/Long Beach Port',
    lat: 33.74,
    lon: -118.27,
    type: 'port',
    riskLevel: 'high',
    currentCongestion: 80,
    description: 'Largest port complex in the Americas',
    impact: '40% of US container traffic'
  },
  {
    id: 'shanghai',
    name: 'Port of Shanghai',
    lat: 31.23,
    lon: 121.47,
    type: 'port',
    riskLevel: 'medium',
    currentCongestion: 65,
    description: "World's largest container port",
    impact: '20% of China trade'
  },
  {
    id: 'rotterdam',
    name: 'Port of Rotterdam',
    lat: 51.92,
    lon: 4.48,
    type: 'port',
    riskLevel: 'low',
    currentCongestion: 45,
    description: 'Largest port in Europe',
    impact: 'European gateway'
  },
  {
    id: 'taiwan-strait',
    name: 'Taiwan Strait',
    lat: 24.5,
    lon: 119.5,
    type: 'strait',
    riskLevel: 'critical',
    currentCongestion: 90,
    description: 'Critical trade route between China and Taiwan',
    impact: '88% of world\'s largest ships'
  }
];

// OpenSky Network API - Free real-time flight data
export const fetchFlightData = async (): Promise<FlightData[]> => {
  try {
    const response = await fetch('https://opensky-network.org/api/states/all', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.warn('OpenSky API rate limit or error, using demo data');
      return generateDemoFlightData();
    }

    const data = await response.json();

    if (!data.states || !Array.isArray(data.states)) {
      return generateDemoFlightData();
    }

    // Filter for cargo/commercial flights and convert to our format
    const flights: FlightData[] = data.states
      .filter((state: any) => state[5] && state[6] && state[13] > 1000) // has position and altitude > 1000m
      .slice(0, 500) // Limit to 500 flights for performance
      .map((state: any) => ({
        icao24: state[0],
        callsign: (state[1] || '').trim() || `FL${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        lat: state[6],
        lon: state[5],
        altitude: state[13] || 0,
        velocity: state[9] || 0,
        heading: state[10] || 0
      }));

    return flights.length > 0 ? flights : generateDemoFlightData();
  } catch (error) {
    console.error('Error fetching flight data, using demo data:', error);
    return generateDemoFlightData();
  }
};

// AIS Hub API - Free vessel tracking (requires API key)
// Note: Users need to register at https://www.aishub.net/
export const fetchVesselData = async (apiKey?: string): Promise<VesselData[]> => {
  // Demo data if no API key provided
  if (!apiKey) {
    return generateDemoVesselData();
  }

  try {
    const response = await fetch(
      `https://data.aishub.net/ws.php?username=${apiKey}&format=1&output=json&compress=0`
    );
    const data = await response.json();

    if (!data[0]?.DATA) return [];

    const vessels: VesselData[] = data[0].DATA.map((vessel: any) => ({
      mmsi: vessel.MMSI,
      name: vessel.NAME || 'Unknown',
      lat: parseFloat(vessel.LATITUDE),
      lon: parseFloat(vessel.LONGITUDE),
      speed: parseFloat(vessel.SPEED || 0),
      course: parseFloat(vessel.COURSE || 0),
      destination: vessel.DESTINATION,
      type: vessel.TYPE || 'Cargo',
      status: vessel.NAVSTAT
    }));

    return vessels;
  } catch (error) {
    console.error('Error fetching vessel data:', error);
    return generateDemoVesselData();
  }
};

// Generate demo vessel data for visualization
const generateDemoVesselData = (): VesselData[] => {
  const routes = [
    { from: [31.23, 121.47], to: [33.74, -118.27], name: 'Shanghai Express' }, // Shanghai to LA
    { from: [1.29, 103.85], to: [51.92, 4.48], name: 'Singapore Trader' }, // Singapore to Rotterdam
    { from: [30.5, 32.3], to: [40.64, -74.07], name: 'Suez Navigator' }, // Suez to NY
    { from: [9.08, -79.68], to: [35.68, 139.76], name: 'Panama Voyager' }, // Panama to Tokyo
    { from: [22.28, 114.16], to: [47.56, -122.33], name: 'Hong Kong Carrier' }, // HK to Seattle
    { from: [25.27, 55.29], to: [51.50, -0.13], name: 'Dubai Merchant' }, // Dubai to London
  ];

  const vessels: VesselData[] = [];
  const timestamp = Date.now();

  routes.forEach((route, idx) => {
    // Create 3-5 vessels per route at different positions
    for (let i = 0; i < 4; i++) {
      const progress = (i * 0.25 + ((timestamp / 100000) % 1)) % 1;
      const lat = route.from[0] + (route.to[0] - route.from[0]) * progress;
      const lon = route.from[1] + (route.to[1] - route.from[1]) * progress;

      vessels.push({
        mmsi: `${idx}${i}${Math.floor(Math.random() * 1000)}`,
        name: `${route.name} ${i + 1}`,
        lat,
        lon,
        speed: 15 + Math.random() * 10,
        course: Math.atan2(route.to[0] - route.from[0], route.to[1] - route.from[1]) * 180 / Math.PI,
        destination: route.to.join(','),
        eta: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'Cargo',
        status: Math.random() > 0.8 ? 'Delayed' : 'On-time'
      });
    }
  });

  return vessels;
};

// Generate demo flight data
const generateDemoFlightData = (): FlightData[] => {
  const flights: FlightData[] = [];
  const routes = [
    { lat: 40.64, lon: -73.78 }, // JFK
    { lat: 51.47, lon: -0.45 }, // Heathrow
    { lat: 35.55, lon: 139.78 }, // Narita
    { lat: 25.25, lon: 55.36 }, // Dubai
    { lat: 1.36, lon: 103.99 }, // Changi
    { lat: 33.94, lon: -118.41 }, // LAX
  ];

  for (let i = 0; i < 200; i++) {
    const fromIdx = Math.floor(Math.random() * routes.length);
    const toIdx = (fromIdx + 1 + Math.floor(Math.random() * (routes.length - 1))) % routes.length;
    const progress = Math.random();

    const from = routes[fromIdx];
    const to = routes[toIdx];

    const lat = from.lat + (to.lat - from.lat) * progress;
    const lon = from.lon + (to.lon - from.lon) * progress;

    flights.push({
      icao24: `FL${i.toString(16).padStart(6, '0')}`,
      callsign: `FLT${Math.floor(Math.random() * 9000 + 1000)}`,
      lat,
      lon,
      altitude: 8000 + Math.random() * 4000,
      velocity: 200 + Math.random() * 250,
      heading: Math.atan2(to.lat - from.lat, to.lon - from.lon) * 180 / Math.PI
    });
  }

  return flights;
};

// Weather data from NOAA or demo data
export const fetchWeatherEvents = async (): Promise<WeatherEvent[]> => {
  // Demo severe weather events
  return [
    {
      id: 'storm-1',
      type: 'Tropical Storm',
      lat: 15.5,
      lon: -65.0,
      severity: 'high',
      description: 'Category 2 Hurricane approaching Caribbean'
    },
    {
      id: 'storm-2',
      type: 'Monsoon',
      lat: 10.0,
      lon: 80.0,
      severity: 'medium',
      description: 'Heavy monsoon rains affecting Bay of Bengal'
    },
    {
      id: 'fog-1',
      type: 'Dense Fog',
      lat: 51.92,
      lon: 4.48,
      severity: 'low',
      description: 'Visibility reduced at Rotterdam Port'
    }
  ];
};

// Aggregate logistics data
export const fetchAllLogisticsData = async (vesselApiKey?: string) => {
  const [vessels, flights, weather] = await Promise.all([
    fetchVesselData(vesselApiKey),
    fetchFlightData(),
    fetchWeatherEvents()
  ]);

  return {
    vessels,
    flights,
    weather,
    chokePoints: CHOKE_POINTS
  };
};
