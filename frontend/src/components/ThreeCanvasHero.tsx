import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCw,
  Zap,
  Compass,
  Radio,
  Sliders,
  Layers,
  Activity
} from 'lucide-react';

interface ThreeCanvasHeroProps {
  onInteract?: () => void;
}

export const ThreeCanvasHero: React.FC<ThreeCanvasHeroProps> = ({ onInteract }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activePreset, setActivePreset] = useState<'cyber' | 'quantum' | 'exploded'>('cyber');
  const [recoveredAmount, setRecoveredAmount] = useState(14820);
  const [isSurging, setIsSurging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // References for Three.js state & GPU lifecycle
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const coreGroupRef = useRef<THREE.Group | null>(null);
  const innerNucleusRef = useRef<THREE.Mesh | null>(null);
  const crystalVaultRef = useRef<THREE.Mesh | null>(null);
  const cageRef = useRef<THREE.LineSegments | null>(null);
  const ring1Ref = useRef<THREE.Group | null>(null);
  const ring2Ref = useRef<THREE.Group | null>(null);
  const ring3Ref = useRef<THREE.Group | null>(null);
  const satelliteGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const shockwavesRef = useRef<{ mesh: THREE.Mesh; scaleSpeed: number; opacitySpeed: number }[]>([]);

  // Performance & Visibility flags
  const isVisibleRef = useRef(true);
  const autoRotateRef = useRef(true);
  const animIdRef = useRef<number>(0);

  // Smooth orbital state
  const orbitState = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    yaw: 0.5,
    pitch: 0.2,
    yawVel: 0,
    pitchVel: 0,
    camDistance: 8.2,
    targetCamDistance: 8.2,
  });

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Lightweight, High-Performance Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 550;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 50);
    camera.position.set(0, 1.0, orbitState.current.camDistance);
    cameraRef.current = camera;

    // GPU Optimization: Cap DPR at 1.25 for crisp lines with 60% lower fill-rate cost
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'default', // Low power mode
      stencil: false,
      depth: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Efficient Lighting (2 balanced lights, zero shadow maps)
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 3.0);
    dirLight.position.set(5, 7, 5);
    scene.add(dirLight);

    const fillLight = new THREE.PointLight(0x10b981, 3.5, 18);
    fillLight.position.set(-4, -2, 3);
    scene.add(fillLight);

    // 3. Central 3D Model Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Ground Hologram Stage
    const stageGroup = new THREE.Group();
    stageGroup.position.y = -2.5;
    rootGroup.add(stageGroup);

    const floorRingGeom = new THREE.RingGeometry(2.4, 2.52, 48);
    const floorRingMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const floorRing = new THREE.Mesh(floorRingGeom, floorRingMat);
    floorRing.rotation.x = Math.PI / 2;
    stageGroup.add(floorRing);

    const innerFloorGeom = new THREE.RingGeometry(1.5, 1.58, 36);
    const innerFloorMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const innerFloor = new THREE.Mesh(innerFloorGeom, innerFloorMat);
    innerFloor.rotation.x = Math.PI / 2;
    stageGroup.add(innerFloor);

    // Core Assembly
    const coreGroup = new THREE.Group();
    rootGroup.add(coreGroup);
    coreGroupRef.current = coreGroup;

    // Inner Pulsing Nucleus
    const nucleusGeom = new THREE.SphereGeometry(0.5, 24, 24);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 2.2,
      roughness: 0.3,
    });
    const nucleus = new THREE.Mesh(nucleusGeom, nucleusMat);
    coreGroup.add(nucleus);
    innerNucleusRef.current = nucleus;

    // Faceted 3D Crystal Core (MeshStandardMaterial with flatShading = ultra-crisp 3D facets, ZERO transmission GPU overhead)
    const crystalGeom = new THREE.IcosahedronGeometry(1.22, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.15,
      metalness: 0.85,
      flatShading: true,
    });
    const crystalMesh = new THREE.Mesh(crystalGeom, crystalMat);
    coreGroup.add(crystalMesh);
    crystalVaultRef.current = crystalMesh;

    // Clean Outer Wireframe Cage
    const cageGeom = new THREE.IcosahedronGeometry(1.42, 0);
    const cageWire = new THREE.WireframeGeometry(cageGeom);
    const cageMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });
    const cage = new THREE.LineSegments(cageWire, cageMat);
    coreGroup.add(cage);
    cageRef.current = cage;

    // 4. Lightweight Gyroscope Rings (48 tubular segments for smooth curves with low vertex count)
    const createRing = (radius: number, tube: number, color: number, emissive: number) => {
      const g = new THREE.Group();
      const torusGeom = new THREE.TorusGeometry(radius, tube, 12, 48);
      const torusMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: emissive,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.8,
      });
      const torus = new THREE.Mesh(torusGeom, torusMat);
      g.add(torus);

      // 4 Accent blocks
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        const bGeom = new THREE.BoxGeometry(tube * 2.8, tube * 2.8, tube * 2.8);
        const bMat = new THREE.MeshBasicMaterial({ color: color });
        const b = new THREE.Mesh(bGeom, bMat);
        b.position.set(Math.cos(ang) * radius, Math.sin(ang) * radius, 0);
        g.add(b);
      }
      return g;
    };

    const ring1 = createRing(2.0, 0.045, 0x06b6d4, 0x0284c7);
    ring1.rotation.x = Math.PI / 3;
    rootGroup.add(ring1);
    ring1Ref.current = ring1;

    const ring2 = createRing(2.5, 0.038, 0x10b981, 0x059669);
    ring2.rotation.y = Math.PI / 4;
    rootGroup.add(ring2);
    ring2Ref.current = ring2;

    const ring3 = createRing(3.0, 0.03, 0x818cf8, 0x4f46e5);
    ring3.rotation.z = Math.PI / 6;
    rootGroup.add(ring3);
    ring3Ref.current = ring3;

    // 5. Orbiting Gateway Satellite Satellites (Rotated in GPU via group matrix)
    const satGroup = new THREE.Group();
    rootGroup.add(satGroup);
    satelliteGroupRef.current = satGroup;

    const satNodes = [
      { r: 3.5, color: 0x10b981, y: 0.3 },
      { r: 3.8, color: 0x38bdf8, y: -0.5 },
      { r: 4.1, color: 0x818cf8, y: 0.6 },
      { r: 3.6, color: 0xf59e0b, y: -0.2 },
    ];

    satNodes.forEach((n, idx) => {
      const angle = (idx * Math.PI * 2) / satNodes.length;
      const x = Math.cos(angle) * n.r;
      const z = Math.sin(angle) * n.r;

      const podG = new THREE.Group();
      podG.position.set(x, n.y, z);

      // Chassis
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.18, 0.28),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.9 })
      );
      podG.add(box);

      // Beacon
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 12, 12),
        new THREE.MeshBasicMaterial({ color: n.color })
      );
      beacon.position.y = 0.1;
      podG.add(beacon);

      satGroup.add(podG);
    });

    // 6. Optimized Static Particle Buffer (Rotated via matrix, ZERO CPU buffer uploads)
    const pCount = 200;
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    const cCyan = new THREE.Color(0x38bdf8);
    const cEmerald = new THREE.Color(0x10b981);

    for (let i = 0; i < pCount; i++) {
      const rad = 1.8 + Math.random() * 3.0;
      const theta = Math.random() * Math.PI * 2;
      pPositions[i * 3] = Math.cos(theta) * rad;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 3.6;
      pPositions[i * 3 + 2] = Math.sin(theta) * rad;

      const col = Math.random() > 0.5 ? cEmerald : cCyan;
      pColors[i * 3] = col.r;
      pColors[i * 3 + 1] = col.g;
      pColors[i * 3 + 2] = col.b;
    }

    const pGeom = new THREE.BufferGeometry();
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeom.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeom, pMat);
    rootGroup.add(particles);
    particlesRef.current = particles;

    // 7. Interactive Orbit Listeners
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      orbitState.current.isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      orbitState.current.prevX = clientX;
      orbitState.current.prevY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!orbitState.current.isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const dX = clientX - orbitState.current.prevX;
      const dY = clientY - orbitState.current.prevY;

      orbitState.current.yawVel += dX * 0.003;
      orbitState.current.pitchVel += dY * 0.003;

      orbitState.current.prevX = clientX;
      orbitState.current.prevY = clientY;
    };

    const onPointerUp = () => {
      orbitState.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitState.current.targetCamDistance = THREE.MathUtils.clamp(
        orbitState.current.targetCamDistance + e.deltaY * 0.004,
        5.5,
        11.0
      );
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. CRITICAL GPU OPTIMIZATION: IntersectionObserver
    // Pauses 60 FPS animation loop whenever the 3D canvas is scrolled out of view!
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // Pause when browser tab is inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisibleRef.current = false;
      } else {
        isVisibleRef.current = true;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 9. Ultra-Smooth, Low-Overhead 60 FPS Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);

      // Skip render if off-screen (0% GPU usage when scrolled away!)
      if (!isVisibleRef.current) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Orbit physics with momentum
      const st = orbitState.current;
      if (autoRotateRef.current && !st.isDragging) {
        st.yaw += 0.003;
      }
      st.yaw += st.yawVel;
      st.pitch += st.pitchVel;
      st.pitch = THREE.MathUtils.clamp(st.pitch, -1.1, 1.1);

      st.yawVel *= 0.92;
      st.pitchVel *= 0.92;
      st.camDistance += (st.targetCamDistance - st.camDistance) * 0.1;

      const cosP = Math.cos(st.pitch);
      camera.position.x = Math.sin(st.yaw) * cosP * st.camDistance;
      camera.position.y = Math.sin(st.pitch) * st.camDistance + 0.5;
      camera.position.z = Math.cos(st.yaw) * cosP * st.camDistance;
      camera.lookAt(0, 0, 0);

      // Core rotation & gentle heartbeat
      if (innerNucleusRef.current) {
        const p = 1.0 + 0.08 * Math.sin(elapsed * 3.5);
        innerNucleusRef.current.scale.set(p, p, p);
      }
      if (crystalVaultRef.current) {
        crystalVaultRef.current.rotation.x = elapsed * 0.25;
        crystalVaultRef.current.rotation.y = elapsed * 0.4;
      }
      if (cageRef.current) {
        cageRef.current.rotation.x = -elapsed * 0.2;
        cageRef.current.rotation.z = elapsed * 0.3;
      }

      // Rings counter-rotation
      if (ring1Ref.current) ring1Ref.current.rotation.z += 0.006;
      if (ring2Ref.current) ring2Ref.current.rotation.x -= 0.008;
      if (ring3Ref.current) ring3Ref.current.rotation.y += 0.005;

      // Satellite group rotation (GPU transformed)
      if (satelliteGroupRef.current) {
        satelliteGroupRef.current.rotation.y = elapsed * 0.25;
      }

      // Particles rotation (GPU transformed, zero CPU overhead)
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsed * 0.06;
      }

      // Shockwave propagation
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.mesh.scale.x += sw.scaleSpeed * delta;
        sw.mesh.scale.y += sw.scaleSpeed * delta;
        const mat = sw.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity -= sw.opacitySpeed * delta;

        if (mat.opacity <= 0.01) {
          scene.remove(sw.mesh);
          sw.mesh.geometry.dispose();
          mat.dispose();
          shockwavesRef.current.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Robust Memory Cleanup
    return () => {
      cancelAnimationFrame(animIdRef.current);
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      container.removeEventListener('wheel', onWheel);

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      scene.clear();
    };
  }, []);

  // Update preset materials efficiently
  useEffect(() => {
    if (!crystalVaultRef.current || !innerNucleusRef.current) return;
    const crystalMat = crystalVaultRef.current.material as THREE.MeshStandardMaterial;
    const nucleusMat = innerNucleusRef.current.material as THREE.MeshStandardMaterial;

    if (activePreset === 'cyber') {
      crystalMat.color.setHex(0x0ea5e9);
      crystalMat.emissive.setHex(0x0284c7);
      crystalMat.wireframe = false;
      nucleusMat.color.setHex(0x10b981);
      if (ring1Ref.current) ring1Ref.current.position.set(0, 0, 0);
      if (ring2Ref.current) ring2Ref.current.position.set(0, 0, 0);
      if (ring3Ref.current) ring3Ref.current.position.set(0, 0, 0);
    } else if (activePreset === 'quantum') {
      crystalMat.color.setHex(0xa855f7);
      crystalMat.emissive.setHex(0x7e22ce);
      crystalMat.wireframe = false;
      nucleusMat.color.setHex(0x38bdf8);
      if (ring1Ref.current) ring1Ref.current.position.set(0, 0, 0);
      if (ring2Ref.current) ring2Ref.current.position.set(0, 0, 0);
      if (ring3Ref.current) ring3Ref.current.position.set(0, 0, 0);
    } else if (activePreset === 'exploded') {
      crystalMat.color.setHex(0x10b981);
      crystalMat.emissive.setHex(0x059669);
      crystalMat.wireframe = true;
      nucleusMat.color.setHex(0xf59e0b);
      if (ring1Ref.current) ring1Ref.current.position.set(0, 0.7, 0);
      if (ring2Ref.current) ring2Ref.current.position.set(0, -0.7, 0);
      if (ring3Ref.current) ring3Ref.current.position.set(0, 1.3, 0);
    }
  }, [activePreset]);

  // Trigger Recovery Surge in 3D
  const triggerShockwave = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current) return;
    setIsSurging(true);
    setRecoveredAmount((prev) => prev + 1);

    const waveGeom = new THREE.RingGeometry(0.6, 0.78, 48);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const wave = new THREE.Mesh(waveGeom, waveMat);
    wave.position.set(0, 0, 0);
    wave.lookAt(cameraRef.current.position);
    sceneRef.current.add(wave);

    shockwavesRef.current.push({
      mesh: wave,
      scaleSpeed: 9.0,
      opacitySpeed: 1.2,
    });

    if (onInteract) onInteract();
    setTimeout(() => setIsSurging(false), 800);
  }, [onInteract]);

  const recenterCamera = () => {
    orbitState.current.yaw = 0.5;
    orbitState.current.pitch = 0.2;
    orbitState.current.yawVel = 0;
    orbitState.current.pitchVel = 0;
    orbitState.current.targetCamDistance = 8.2;
  };

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#060913] via-[#080d1a] to-[#04060c] border border-cyan-500/20 shadow-xl select-none group">
      {/* 1. Main Three.js WebGL Canvas (Optimized Low-Power Engine) */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        title="Drag to orbit • Scroll to zoom"
      />

      {/* 2. Top-Right Clean Production Telemetry Badge (NO watermarks) */}
      <div className="absolute top-5 right-5 pointer-events-auto z-10">
        <div className="px-3.5 py-2.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-lg text-right font-mono">
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-emerald-400 font-bold">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            <span>Autonomous Engine Active</span>
          </div>
          <span className="text-lg font-bold text-white block mt-0.5">
            ₹{recoveredAmount.toLocaleString('en-IN')},000
          </span>
        </div>
      </div>

      {/* 3. Bottom Production Controls Toolbar */}
      <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-3 pointer-events-auto z-10">
        {/* Architecture Shading Presets */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActivePreset('cyber')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activePreset === 'cyber'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Core Engine
          </button>
          <button
            onClick={() => setActivePreset('quantum')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activePreset === 'quantum'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/35 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quantum Prism
          </button>
          <button
            onClick={() => setActivePreset('exploded')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              activePreset === 'exploded'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Exploded View
          </button>
        </div>

        {/* Action Controls: Pulse Surge, Auto-Rotate, Recenter */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={triggerShockwave}
            disabled={isSurging}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shadow-md ${
              isSurging
                ? 'bg-emerald-500 text-slate-950 scale-95'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
            title="Simulate autonomous recovery pulse"
          >
            <Zap className={`w-3.5 h-3.5 fill-current ${isSurging ? 'animate-bounce' : ''}`} />
            <span>{isSurging ? 'Surging...' : 'Pulse Surge'}</span>
          </button>

          {/* Auto-Rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl backdrop-blur-md border transition ${
              autoRotate
                ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={autoRotate ? 'Pause auto-orbit' : 'Resume auto-orbit'}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '9s' }} />
          </button>

          {/* Reset Camera Recenter */}
          <button
            onClick={recenterCamera}
            className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-400 hover:text-white transition"
            title="Recenter camera"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
