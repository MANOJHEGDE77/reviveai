import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Eye, RotateCw, Layers, ShieldCheck, Zap } from 'lucide-react';

interface ThreeCanvasHeroProps {
  onInteract?: () => void;
}

export const ThreeCanvasHero: React.FC<ThreeCanvasHeroProps> = ({ onInteract }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activePreset, setActivePreset] = useState<'hologram' | 'quartz' | 'wireframe'>('hologram');
  const [recoveredCount, setRecoveredCount] = useState(14820);
  const [pulseActive, setPulseActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const coreMeshRef = useRef<THREE.Mesh | null>(null);
  const ringGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const shockwavesRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.5);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 5, 20);
    cyanLight.position.set(4, 3, 5);
    scene.add(cyanLight);

    const emeraldLight = new THREE.PointLight(0x10b981, 6, 20);
    emeraldLight.position.set(-4, -2, 4);
    scene.add(emeraldLight);

    const indigoLight = new THREE.DirectionalLight(0x6366f1, 2.5);
    indigoLight.position.set(0, 5, -2);
    scene.add(indigoLight);

    // 3. Central 3D Autonomous Recovery Loop (Torus Knot)
    const geom = new THREE.TorusKnotGeometry(1.6, 0.42, 140, 24, 2, 3);
    
    // Shader Material for glowing holographic effect
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false,
      transmission: 0.35,
      opacity: 0.95,
      transparent: true,
    });

    const coreMesh = new THREE.Mesh(geom, material);
    scene.add(coreMesh);
    coreMeshRef.current = coreMesh;

    // 4. Concentric Orbital Cybernetic Rings
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);
    ringGroupRef.current = ringGroup;

    // Ring 1 (Inner Cyan)
    const ring1Geom = new THREE.TorusGeometry(2.6, 0.02, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
    const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ringGroup.add(ring1);

    // Ring 2 (Middle Emerald)
    const ring2Geom = new THREE.TorusGeometry(3.1, 0.025, 16, 120);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.5 });
    const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    ringGroup.add(ring2);

    // Ring 3 (Outer Indigo)
    const ring3Geom = new THREE.TorusGeometry(3.6, 0.015, 16, 120);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.3 });
    const ring3 = new THREE.Mesh(ring3Geom, ring3Mat);
    ring3.rotation.z = Math.PI / 6;
    ringGroup.add(ring3);

    // 5. 3D Particle Constellation / Telemetry Photons
    const particleCount = 1200;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0x06b6d4); // Cyan
    const c2 = new THREE.Color(0x10b981); // Emerald
    const c3 = new THREE.Color(0x818cf8); // Indigo

    for (let i = 0; i < particleCount; i++) {
      // Swirling spherical cloud with density towards center
      const r = 2.0 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);

      const chosenColor = Math.random() > 0.6 ? c2 : (Math.random() > 0.3 ? c1 : c3);
      particleColors[i * 3] = chosenColor.r;
      particleColors[i * 3 + 1] = chosenColor.g;
      particleColors[i * 3 + 2] = chosenColor.b;
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 6. Interactive Mouse Parallax
    let targetRotX = 0;
    let targetRotY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;
      targetRotY = x * 0.7;
      targetRotX = -y * 0.7;
      setMousePos({ x, y });
    };

    container.addEventListener('mousemove', handleMouseMove);

    // 7. Click Pulse / Shockwave Action
    const handleClick = () => {
      setPulseActive(true);
      setRecoveredCount((prev) => prev + 1);

      // Create expanding shockwave ring
      const waveGeom = new THREE.RingGeometry(0.5, 0.6, 64);
      const waveMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      const wave = new THREE.Mesh(waveGeom, waveMat);
      wave.position.set(0, 0, 0);
      wave.lookAt(camera.position);
      scene.add(wave);
      shockwavesRef.current.push(wave);

      if (onInteract) onInteract();
      setTimeout(() => setPulseActive(false), 800);
    };

    container.addEventListener('click', handleClick);

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 9. Main Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth rotation with mouse influence
      if (coreMeshRef.current) {
        coreMeshRef.current.rotation.x += 0.007;
        coreMeshRef.current.rotation.y += 0.01;
        coreMeshRef.current.rotation.x += (targetRotX - coreMeshRef.current.rotation.x) * 0.05;
        coreMeshRef.current.rotation.y += (targetRotY - coreMeshRef.current.rotation.y) * 0.05;

        // Subtle breathing scale
        const scale = 1.0 + 0.04 * Math.sin(elapsedTime * 2);
        coreMeshRef.current.scale.set(scale, scale, scale);
      }

      // Rings counter-rotation
      if (ringGroupRef.current) {
        ringGroupRef.current.rotation.z += 0.003;
        ringGroupRef.current.rotation.x += 0.002;
      }

      // Swirling particles
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.05;
        particlesRef.current.rotation.x = Math.sin(elapsedTime * 0.03) * 0.2;
      }

      // Animate and cull shockwaves
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const wave = shockwavesRef.current[i];
        wave.scale.x += 0.09;
        wave.scale.y += 0.09;
        const mat = wave.material as THREE.MeshBasicMaterial;
        mat.opacity -= 0.025;

        if (mat.opacity <= 0) {
          scene.remove(wave);
          wave.geometry.dispose();
          mat.dispose();
          shockwavesRef.current.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      scene.clear();
    };
  }, []);

  // Preset switch effect
  useEffect(() => {
    if (!coreMeshRef.current) return;
    const mat = coreMeshRef.current.material as THREE.MeshPhysicalMaterial;

    if (activePreset === 'hologram') {
      mat.color.setHex(0x0ea5e9);
      mat.emissive.setHex(0x0284c7);
      mat.emissiveIntensity = 0.45;
      mat.wireframe = false;
      mat.transmission = 0.35;
    } else if (activePreset === 'quartz') {
      mat.color.setHex(0x10b981);
      mat.emissive.setHex(0x059669);
      mat.emissiveIntensity = 0.3;
      mat.wireframe = false;
      mat.transmission = 0.8;
      mat.roughness = 0.05;
    } else if (activePreset === 'wireframe') {
      mat.color.setHex(0x818cf8);
      mat.emissive.setHex(0x4f46e5);
      mat.emissiveIntensity = 0.8;
      mat.wireframe = true;
    }
  }, [activePreset]);

  return (
    <div className="relative w-full h-[540px] sm:h-[620px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#070A12] via-[#0B0F19] to-[#030712] border border-cyan-500/25 shadow-2xl shadow-cyan-950/30 group">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Telemetry HUD (Top Left) */}
      <div className="absolute top-6 left-6 pointer-events-none space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AUTONOMOUS AGENTIC 3D MESH</span>
        </div>
        <p className="text-xs text-slate-400 font-mono">
          Interactive WebGL core &bull; Click to stimulate recovery shockwave
        </p>
      </div>

      {/* Floating Settlement Metric Badge (Top Right) */}
      <div className="absolute top-6 right-6 pointer-events-auto">
        <div className="p-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 shadow-lg text-right font-mono">
          <span className="text-[10px] text-slate-400 uppercase block font-bold">LIVE SETTLEMENT CADENCE</span>
          <span className="text-xl font-extrabold text-emerald-400 block mt-0.5">
            ₹{recoveredCount.toLocaleString('en-IN')},000
          </span>
          <span className="text-[10px] text-cyan-300 flex items-center justify-end gap-1 mt-0.5">
            <Zap className="w-2.5 h-2.5" />
            <span>Autonomous Loop Active</span>
          </span>
        </div>
      </div>

      {/* Floating 3D Node Pins Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Left Floating Node */}
        <div className="absolute left-8 sm:left-14 top-1/2 -translate-y-12 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 shadow-xl max-w-[200px] text-left">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-red-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>INCIDENT DETECTED</span>
          </div>
          <p className="text-xs font-bold text-white mt-1">₹42,500 INR</p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">HDFC PSP Timeout</p>
        </div>

        {/* Right Floating Node */}
        <div className="absolute right-8 sm:right-14 top-1/2 translate-y-8 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 shadow-xl max-w-[200px] text-left">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>ACTION VERIFIED</span>
          </div>
          <p className="text-xs font-bold text-white mt-1">DELAYED_RETRY (14m)</p>
          <p className="text-[10px] text-emerald-300 font-mono mt-0.5">89% Cohort Yield</p>
        </div>
      </div>

      {/* Bottom Shading & Mode Controls */}
      <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center justify-between gap-4 pointer-events-auto">
        {/* Shading Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 font-mono text-xs">
          <button
            onClick={() => setActivePreset('hologram')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activePreset === 'hologram'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Holographic
          </button>
          <button
            onClick={() => setActivePreset('quartz')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activePreset === 'quartz'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Emerald Quartz
          </button>
          <button
            onClick={() => setActivePreset('wireframe')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activePreset === 'wireframe'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Wireframe
          </button>
        </div>

        {/* Interaction Hint */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-800">
          <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Move cursor to tilt &bull; Click to pulse</span>
        </div>
      </div>
    </div>
  );
};
