import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Globe, Compass } from 'lucide-react';

interface GatewayHub {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  colorHex: number;
  colorCss: string;
  latency: string;
  health: string;
  status: 'OPTIMAL' | 'RECOVERING' | 'PROTECTED';
}

const GATEWAY_HUBS: GatewayHub[] = [
  {
    id: 'mumbai',
    name: 'Mumbai NPCI Switch',
    city: 'Mumbai',
    country: 'India',
    lat: 19.076,
    lon: 72.877,
    colorHex: 0x10b981,
    colorCss: '#10b981',
    latency: '11ms',
    health: '99.8%',
    status: 'OPTIMAL',
  },
  {
    id: 'delhi',
    name: 'New Delhi Core',
    city: 'Delhi',
    country: 'India',
    lat: 28.6139,
    lon: 77.209,
    colorHex: 0x38bdf8,
    colorCss: '#38bdf8',
    latency: '14ms',
    health: '99.4%',
    status: 'OPTIMAL',
  },
  {
    id: 'bangalore',
    name: 'Bengaluru Cluster',
    city: 'Bengaluru',
    country: 'India',
    lat: 12.9716,
    lon: 77.5946,
    colorHex: 0x10b981,
    colorCss: '#10b981',
    latency: '8ms',
    health: '99.9%',
    status: 'OPTIMAL',
  },
  {
    id: 'singapore',
    name: 'Singapore Nexus',
    city: 'Singapore',
    country: 'Singapore',
    lat: 1.3521,
    lon: 103.8198,
    colorHex: 0x38bdf8,
    colorCss: '#38bdf8',
    latency: '26ms',
    health: '99.6%',
    status: 'OPTIMAL',
  },
  {
    id: 'london',
    name: 'London Clearing',
    city: 'London',
    country: 'UK',
    lat: 51.5074,
    lon: -0.1278,
    colorHex: 0x818cf8,
    colorCss: '#818cf8',
    latency: '45ms',
    health: '98.9%',
    status: 'PROTECTED',
  },
  {
    id: 'frankfurt',
    name: 'Frankfurt Core',
    city: 'Frankfurt',
    country: 'Germany',
    lat: 50.1109,
    lon: 8.6821,
    colorHex: 0x818cf8,
    colorCss: '#818cf8',
    latency: '42ms',
    health: '99.2%',
    status: 'OPTIMAL',
  },
  {
    id: 'sf',
    name: 'San Francisco Core',
    city: 'SF',
    country: 'USA',
    lat: 37.7749,
    lon: -122.4194,
    colorHex: 0x38bdf8,
    colorCss: '#38bdf8',
    latency: '68ms',
    health: '99.1%',
    status: 'OPTIMAL',
  },
  {
    id: 'dubai',
    name: 'Dubai Switch',
    city: 'Dubai',
    country: 'UAE',
    lat: 25.2048,
    lon: 55.2708,
    colorHex: 0xf59e0b,
    colorCss: '#f59e0b',
    latency: '22ms',
    health: '99.5%',
    status: 'RECOVERING',
  },
];

// Optimized Continental Centroids
const CONTINENT_LAND_POINTS = [
  { lat: 21.0, lon: 78.0, spread: 7, count: 140 }, // India
  { lat: 50.0, lon: 15.0, spread: 10, count: 110 }, // Europe
  { lat: 38.0, lon: -97.0, spread: 14, count: 120 }, // N. America
  { lat: 34.0, lon: 110.0, spread: 12, count: 110 }, // E. Asia
  { lat: 26.0, lon: 45.0, spread: 7, count: 60 }, // Middle East
  { lat: -15.0, lon: -55.0, spread: 12, count: 70 }, // S. America
  { lat: 5.0, lon: 20.0, spread: 14, count: 80 }, // Africa
  { lat: -25.0, lon: 135.0, spread: 8, count: 50 }, // Australia
];

export const ThreePaymentGlobe: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedHubId, setSelectedHubId] = useState('mumbai');
  const [isAutoSpinning, setIsAutoSpinning] = useState(true);

  const isVisibleRef = useRef(true);
  const isAutoSpinningRef = useRef(true);
  const animIdRef = useRef<number>(0);

  useEffect(() => {
    isAutoSpinningRef.current = isAutoSpinning;
  }, [isAutoSpinning]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Lightweight Scene & Camera
    const scene = new THREE.Scene();
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 420;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 40);
    camera.position.set(0, 0, 5.2);

    // Capped DPR = 1.25 for minimal GPU fill rate
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'default',
      stencil: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Simple Lights (No shadows)
    const ambient = new THREE.AmbientLight(0x0c1938, 2.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(4, 5, 4);
    scene.add(dirLight);

    // 3. Globe Group
    const globeGroup = new THREE.Group();
    globeGroup.rotation.y = -1.2;
    globeGroup.rotation.x = 0.3;
    scene.add(globeGroup);

    const sphereRadius = 1.8;

    // Inner Oceanic Shaded Sphere
    const innerSphereGeom = new THREE.SphereGeometry(sphereRadius * 0.985, 32, 32);
    const innerSphereMat = new THREE.MeshBasicMaterial({ color: 0x060c18 });
    const innerSphere = new THREE.Mesh(innerSphereGeom, innerSphereMat);
    globeGroup.add(innerSphere);

    // Atmospheric Halo
    const haloGeom = new THREE.SphereGeometry(sphereRadius * 1.04, 24, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.15,
    });
    globeGroup.add(new THREE.Mesh(haloGeom, haloMat));

    // Lat/Lon to Vector3 Helper
    const latLonToVector3 = (lat: number, lon: number, r: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    // Continental Points (Optimized count: ~740 points)
    const landPositions: number[] = [];
    const landColors: number[] = [];
    const cCyan = new THREE.Color(0x38bdf8);
    const cEmerald = new THREE.Color(0x10b981);
    const cSlate = new THREE.Color(0x1e293b);

    CONTINENT_LAND_POINTS.forEach((c) => {
      for (let i = 0; i < c.count; i++) {
        const dLat = (Math.random() - 0.5) * c.spread * 1.8;
        const dLon = (Math.random() - 0.5) * c.spread * 2.2;
        const v = latLonToVector3(c.lat + dLat, c.lon + dLon, sphereRadius);
        landPositions.push(v.x, v.y, v.z);
        const col = Math.random() > 0.6 ? cEmerald : Math.random() > 0.25 ? cCyan : cSlate;
        landColors.push(col.r, col.g, col.b);
      }
    });

    const landGeom = new THREE.BufferGeometry();
    landGeom.setAttribute('position', new THREE.Float32BufferAttribute(landPositions, 3));
    landGeom.setAttribute('color', new THREE.Float32BufferAttribute(landColors, 3));

    const landMat = new THREE.PointsMaterial({
      size: 0.042,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    globeGroup.add(new THREE.Points(landGeom, landMat));

    // Elevated Gateway Spindles & Beacons
    const hubVectors: { hub: GatewayHub; v: THREE.Vector3 }[] = [];
    GATEWAY_HUBS.forEach((hub) => {
      const surfaceV = latLonToVector3(hub.lat, hub.lon, sphereRadius);
      const elevatedV = latLonToVector3(hub.lat, hub.lon, sphereRadius * 1.06);
      hubVectors.push({ hub, v: elevatedV });

      // Spindle
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, sphereRadius * 0.06, 6),
        new THREE.MeshBasicMaterial({ color: hub.colorHex })
      );
      cyl.position.copy(surfaceV.clone().add(elevatedV).multiplyScalar(0.5));
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surfaceV.clone().normalize());
      globeGroup.add(cyl);

      // Beacon
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 10, 10),
        new THREE.MeshBasicMaterial({ color: hub.colorHex })
      );
      beacon.position.copy(elevatedV);
      globeGroup.add(beacon);
    });

    // Connecting Great-Circle Arcs
    const arcConnections = [
      ['mumbai', 'delhi'],
      ['mumbai', 'bangalore'],
      ['mumbai', 'singapore'],
      ['mumbai', 'dubai'],
      ['mumbai', 'london'],
      ['london', 'frankfurt'],
      ['london', 'sf'],
      ['singapore', 'sf'],
    ];

    interface ArcRunner {
      curve: THREE.QuadraticBezierCurve3;
      packet: THREE.Mesh;
      speed: number;
      t: number;
    }
    const arcRunners: ArcRunner[] = [];

    arcConnections.forEach(([id1, id2]) => {
      const h1 = hubVectors.find((h) => h.hub.id === id1);
      const h2 = hubVectors.find((h) => h.hub.id === id2);
      if (!h1 || !h2) return;

      const v1 = h1.v;
      const v2 = h2.v;
      const dist = v1.distanceTo(v2);

      const mid = v1.clone().add(v2).multiplyScalar(0.5);
      const alt = sphereRadius * (1.15 + Math.min(dist * 0.1, 0.35));
      mid.normalize().multiplyScalar(alt);

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const points = curve.getPoints(36);
      const arcGeom = new THREE.BufferGeometry().setFromPoints(points);

      const line = new THREE.Line(
        arcGeom,
        new THREE.LineBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.35 })
      );
      globeGroup.add(line);

      // Traveling Packet
      const pkt = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      globeGroup.add(pkt);

      arcRunners.push({
        curve,
        packet: pkt,
        speed: 0.4 + Math.random() * 0.3,
        t: Math.random(),
      });
    });

    // 4. Drag Rotation with Inertia
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let velX = 0;
    let velY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevX = clientX;
      prevY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      velX += (clientX - prevX) * 0.0035;
      velY += (clientY - prevY) * 0.0035;

      prevX = clientX;
      prevY = clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Resize
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 5. GPU Optimization: IntersectionObserver (Pauses 60 FPS when offscreen)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 6. Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);

      if (!isVisibleRef.current) return;

      const delta = clock.getDelta();

      if (isAutoSpinningRef.current && !isDragging) {
        globeGroup.rotation.y += 0.003;
      }

      globeGroup.rotation.y += velX;
      globeGroup.rotation.x += velY;
      velX *= 0.92;
      velY *= 0.92;

      // Animate packet runners
      arcRunners.forEach((r) => {
        r.t = (r.t + delta * r.speed) % 1.0;
        r.packet.position.copy(r.curve.getPoint(r.t));
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animIdRef.current);
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  const currentHub = GATEWAY_HUBS.find((h) => h.id === selectedHubId) || GATEWAY_HUBS[0];

  return (
    <div className="relative w-full h-[420px] sm:h-[460px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#060913] via-[#090e1c] to-[#040711] border border-cyan-500/20 p-5 flex flex-col justify-between shadow-xl select-none group">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        title="Drag in any direction to spin the 3D globe"
      />

      {/* Top Header Bar (Clean, NO watermarks) */}
      <div className="absolute top-5 left-5 right-5 flex items-start justify-between pointer-events-none z-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-Gateway Payment Topology</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Real-time routing across UPI PSPs and International Settlement Corridors
          </p>
        </div>

        <button
          onClick={() => setIsAutoSpinning(!isAutoSpinning)}
          className="pointer-events-auto p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-400 hover:text-white transition"
          title={isAutoSpinning ? 'Pause spin' : 'Resume spin'}
        >
          <Compass className={`w-3.5 h-3.5 ${isAutoSpinning ? 'text-cyan-400 animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
        </button>
      </div>

      {/* Bottom Live Selected Hub Telemetry Card */}
      <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pointer-events-auto z-10">
        {/* Hub Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono scrollbar-none">
          {GATEWAY_HUBS.slice(0, 5).map((hub) => (
            <button
              key={hub.id}
              onClick={() => setSelectedHubId(hub.id)}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                selectedHubId === hub.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hub.colorCss }} />
              <span>{hub.city}</span>
            </button>
          ))}
        </div>

        {/* Telemetry Snapshot Pill */}
        <div className="p-2.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-emerald-500/30 text-xs font-mono flex items-center gap-3 text-left shadow-lg">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">{currentHub.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-emerald-400 font-bold">{currentHub.health}</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-cyan-300 font-semibold">{currentHub.latency}</span>
            </div>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 uppercase font-bold">
            {currentHub.status}
          </span>
        </div>
      </div>
    </div>
  );
};
