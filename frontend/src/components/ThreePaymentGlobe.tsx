import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Globe, Shield, RefreshCw } from 'lucide-react';

export const ThreePaymentGlobe: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedGateway, setSelectedGateway] = useState('UPI PSP Switch (99.2% Health)');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 1. Core Globe Wireframe / Dots Sphere
    const sphereRadius = 1.8;
    const segments = 40;
    const sphereGeom = new THREE.SphereGeometry(sphereRadius, segments, segments);
    
    // Dot matrix vertices
    const dotGeom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    const cCyan = new THREE.Color(0x38bdf8);
    const cEmerald = new THREE.Color(0x10b981);
    const cIndigo = new THREE.Color(0x818cf8);

    const posAttr = sphereGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      if (Math.random() > 0.3) {
        positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        const c = Math.random() > 0.6 ? cEmerald : (Math.random() > 0.3 ? cCyan : cIndigo);
        colors.push(c.r, c.g, c.b);
      }
    }

    dotGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    dotGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const dotMat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const globePoints = new THREE.Points(dotGeom, dotMat);
    scene.add(globePoints);

    // 2. Gateway Telemetry Hub Nodes (Indian & Global Switches)
    const hubData = [
      { name: 'Razorpay UPI Hub', lat: 19.076, lon: 72.877, color: 0x10b981 }, // Mumbai
      { name: 'HDFC PSP Core', lat: 28.613, lon: 77.209, color: 0x38bdf8 }, // Delhi
      { name: 'ICICI Switch', lat: 12.971, lon: 77.594, color: 0x10b981 }, // Bangalore
      { name: 'Stripe Global Mandates', lat: 37.774, lon: -122.419, color: 0x818cf8 }, // San Francisco
      { name: 'Visa Direct Switch', lat: 51.507, lon: -0.127, color: 0x38bdf8 }, // London
      { name: 'Singapore PayNow Gateway', lat: 1.352, lon: 103.819, color: 0x10b981 }, // Singapore
    ];

    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    const hubVectors: THREE.Vector3[] = [];
    hubData.forEach((h) => {
      const v = latLonToVector3(h.lat, h.lon, sphereRadius * 1.02);
      hubVectors.push(v);

      const nodeGeom = new THREE.SphereGeometry(0.06, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({ color: h.color });
      const node = new THREE.Mesh(nodeGeom, nodeMat);
      node.position.copy(v);
      nodeGroup.add(node);
    });

    // 3. Glowing Arcs Connecting Nodes
    const arcGroup = new THREE.Group();
    scene.add(arcGroup);

    for (let i = 0; i < hubVectors.length; i++) {
      for (let j = i + 1; j < hubVectors.length; j++) {
        const v1 = hubVectors[i];
        const v2 = hubVectors[j];

        // Great circle arc with midpoint pushed outward
        const mid = v1.clone().add(v2).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(sphereRadius * 1.35);

        const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
        const points = curve.getPoints(50);
        const arcGeom = new THREE.BufferGeometry().setFromPoints(points);

        const arcMat = new THREE.LineBasicMaterial({
          color: (i + j) % 2 === 0 ? 0x06b6d4 : 0x10b981,
          transparent: true,
          opacity: 0.35,
        });

        const line = new THREE.Line(arcGeom, arcMat);
        arcGroup.add(line);
      }
    }

    // 4. Mouse Drag Interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      globePoints.rotation.y += deltaX * 0.006;
      globePoints.rotation.x += deltaY * 0.006;
      nodeGroup.rotation.y += deltaX * 0.006;
      nodeGroup.rotation.x += deltaY * 0.006;
      arcGroup.rotation.y += deltaX * 0.006;
      arcGroup.rotation.x += deltaY * 0.006;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

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

    // 5. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isDragging) {
        globePoints.rotation.y += 0.004;
        nodeGroup.rotation.y += 0.004;
        arcGroup.rotation.y += 0.004;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div className="relative w-full h-[380px] sm:h-[440px] rounded-2xl overflow-hidden bg-slate-950/70 border border-slate-800 p-4 flex flex-col justify-between">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Header Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 uppercase">
          <Globe className="w-3.5 h-3.5" />
          <span>GLOBAL PAYMENT SWITCH RECOVERY TOPOLOGY</span>
        </div>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
          Real-time telemetry across UPI PSPs, Card Switches, and Mandate Gateways
        </p>
      </div>

      {/* Bottom Status */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono pointer-events-none">
        <div className="px-3 py-1 rounded-md bg-slate-900/90 border border-emerald-500/30 text-emerald-300">
          ● 6 Regional Gateways Synchronized
        </div>
        <div className="text-slate-400">
          Drag to rotate 3D sphere
        </div>
      </div>
    </div>
  );
};
