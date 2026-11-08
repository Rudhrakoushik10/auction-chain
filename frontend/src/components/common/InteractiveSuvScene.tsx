import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const InteractiveSuvScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const containerEl = mountRef.current;
    if (!containerEl) return;

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const w = containerEl.clientWidth || window.innerWidth || 1200;
    const h = containerEl.clientHeight || window.innerHeight || 800;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 1.8, 8.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(w, h);
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    containerEl.appendChild(renderer.domElement);

    // Comprehensive Lighting Setup for deep luxury dark canvas
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xd4b57e, 3.5);
    mainKeyLight.position.set(7, 10, 8);
    scene.add(mainKeyLight);

    const rimLightLeft = new THREE.DirectionalLight(0x8e95a5, 2.5);
    rimLightLeft.position.set(-8, 3, -6);
    scene.add(rimLightLeft);

    const frontFillLight = new THREE.DirectionalLight(0xffffff, 2.0);
    frontFillLight.position.set(0, 2, 8);
    scene.add(frontFillLight);

    const goldGlowPoint = new THREE.PointLight(0xc5a46d, 4.0, 25);
    goldGlowPoint.position.set(0, 3, 2);
    scene.add(goldGlowPoint);

    // Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const carGroup = new THREE.Group();
    rootGroup.add(carGroup);

    // Materials with high contrast, emissive undertones, and visible specular highlights
    const suvBodyMat = new THREE.MeshPhongMaterial({
      color: 0x181c26,
      emissive: 0x080a10,
      specular: 0xd4b57e,
      shininess: 90,
      transparent: false,
    });

    const suvWireMat = new THREE.MeshBasicMaterial({
      color: 0xd4b57e,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });

    const glassMat = new THREE.MeshPhongMaterial({
      color: 0x2a3245,
      specular: 0xffffff,
      shininess: 120,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });

    const goldAccentMat = new THREE.MeshPhongMaterial({
      color: 0xc5a46d,
      emissive: 0x48381d,
      specular: 0xffffff,
      shininess: 100,
    });

    const darkTrimMat = new THREE.MeshPhongMaterial({
      color: 0x12141a,
      emissive: 0x0a0c10,
      specular: 0x8e95a5,
      shininess: 60,
    });

    const glowingGoldMat = new THREE.MeshBasicMaterial({
      color: 0xffe094,
    });

    const taillightMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
    });

    // 1. CHASSIS & UNDERBODY
    const skidGeo = new THREE.BoxGeometry(2.4, 0.28, 4.8);
    const skid = new THREE.Mesh(skidGeo, darkTrimMat);
    skid.position.y = 0.45;
    carGroup.add(skid);

    // 2. MAIN SCULPTED SUV LOWER & UPPER BELTLINE
    const mainBodyGeo = new THREE.BoxGeometry(2.45, 0.75, 4.7);
    const mainBody = new THREE.Mesh(mainBodyGeo, suvBodyMat);
    mainBody.position.y = 0.92;
    carGroup.add(mainBody);

    const mainWireMesh = new THREE.Mesh(mainBodyGeo, suvWireMat);
    mainWireMesh.position.y = 0.92;
    carGroup.add(mainWireMesh);

    // 3. PROUD SUV HOOD & SCULPTED FRONT NOSE
    const hoodGeo = new THREE.BoxGeometry(2.36, 0.38, 1.55);
    hoodGeo.rotateX(0.04);
    const hood = new THREE.Mesh(hoodGeo, suvBodyMat);
    hood.position.set(0, 1.15, 1.5);
    carGroup.add(hood);

    const hoodWire = new THREE.Mesh(hoodGeo, suvWireMat);
    hoodWire.position.set(0, 1.15, 1.5);
    carGroup.add(hoodWire);

    // Signature Prestige Grille
    const grilleGeo = new THREE.BoxGeometry(1.65, 0.44, 0.1);
    const grille = new THREE.Mesh(grilleGeo, goldAccentMat);
    grille.position.set(0, 0.92, 2.42);
    carGroup.add(grille);

    // Dual Crisp Champagne LED Headlight Bars
    const headlightGeo = new THREE.BoxGeometry(0.52, 0.1, 0.15);
    const hlLeft = new THREE.Mesh(headlightGeo, glowingGoldMat);
    hlLeft.position.set(-0.88, 1.05, 2.4);
    const hlRight = hlLeft.clone();
    hlRight.position.set(0.88, 1.05, 2.4);
    carGroup.add(hlLeft, hlRight);

    // 4. CABIN & GREENHOUSE
    const cabinGeo = new THREE.BoxGeometry(2.18, 0.76, 2.6);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.58, -0.4);
    carGroup.add(cabin);

    const cabinWire = new THREE.Mesh(cabinGeo, suvWireMat);
    cabinWire.position.set(0, 1.58, -0.4);
    carGroup.add(cabinWire);

    // Roof panel
    const roofGeo = new THREE.BoxGeometry(2.2, 0.1, 2.65);
    const roof = new THREE.Mesh(roofGeo, suvBodyMat);
    roof.position.set(0, 1.98, -0.4);
    carGroup.add(roof);

    // Champagne Gold Roof Utility Rails
    const railGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.4, 8);
    railGeo.rotateX(Math.PI / 2);
    const railLeft = new THREE.Mesh(railGeo, goldAccentMat);
    railLeft.position.set(-0.98, 2.06, -0.4);
    const railRight = railLeft.clone();
    railRight.position.set(0.98, 2.06, -0.4);
    carGroup.add(railLeft, railRight);

    // Upright Pillars (A, B, C, D)
    const pillarGeo = new THREE.BoxGeometry(0.08, 0.74, 0.08);
    const pillarCoords: [number, number, number][] = [
      [-1.08, 1.58, 0.85],
      [1.08, 1.58, 0.85],
      [-1.08, 1.58, 0.0],
      [1.08, 1.58, 0.0],
      [-1.08, 1.58, -0.85],
      [1.08, 1.58, -0.85],
      [-1.08, 1.58, -1.65],
      [1.08, 1.58, -1.65],
    ];
    pillarCoords.forEach(([px, py, pz]) => {
      const pMesh = new THREE.Mesh(pillarGeo, suvBodyMat);
      pMesh.position.set(px, py, pz);
      carGroup.add(pMesh);
    });

    // Rear Tailgate Continuous Crimson Lightbar
    const lightbarGeo = new THREE.BoxGeometry(2.1, 0.09, 0.08);
    const lightbar = new THREE.Mesh(lightbarGeo, taillightMat);
    lightbar.position.set(0, 1.12, -2.42);
    carGroup.add(lightbar);

    // Rear Bumper
    const rearBumperGeo = new THREE.BoxGeometry(2.3, 0.32, 0.22);
    const rearBumper = new THREE.Mesh(rearBumperGeo, darkTrimMat);
    rearBumper.position.set(0, 0.52, -2.35);
    carGroup.add(rearBumper);

    // 5. HIGH-RIDING ALLOY WHEELS & MULTI-SPOKE RIMS
    const tireGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.38, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshPhongMaterial({
      color: 0x1a1e26,
      specular: 0x555f73,
      shininess: 40,
    });
    const rimOuterGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.4, 16);
    rimOuterGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0xd4b57e,
      wireframe: true,
    });
    const hubGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.42, 12);
    hubGeo.rotateZ(Math.PI / 2);

    const wheelPositions: [number, number, number][] = [
      [-1.28, 0.55, 1.48],
      [1.28, 0.55, 1.48],
      [-1.28, 0.55, -1.4],
      [1.28, 0.55, -1.4],
    ];

    const wheels: THREE.Group[] = [];
    const archGeo = new THREE.BoxGeometry(0.14, 0.38, 1.25);

    wheelPositions.forEach((pos) => {
      const wGroup = new THREE.Group();
      const tire = new THREE.Mesh(tireGeo, tireMat);
      const rim = new THREE.Mesh(rimOuterGeo, rimMat);
      const hub = new THREE.Mesh(hubGeo, goldAccentMat);

      wGroup.add(tire, rim, hub);
      wGroup.position.set(pos[0], pos[1], pos[2]);
      carGroup.add(wGroup);
      wheels.push(wGroup);

      const arch = new THREE.Mesh(archGeo, goldAccentMat);
      arch.position.set(pos[0] > 0 ? 1.24 : -1.24, pos[1] + 0.34, pos[2]);
      carGroup.add(arch);
    });

    // 6. CRYPTOGRAPHIC TELEMETRY & AUCTION SCANNER
    const telemetryGroup = new THREE.Group();
    rootGroup.add(telemetryGroup);

    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xc5a46d,
      transparent: true,
      opacity: 0.75,
      wireframe: true,
    });
    const ringGeo1 = new THREE.TorusGeometry(3.6, 0.02, 12, 100);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI * 0.45;
    telemetryGroup.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x8e95a5,
      transparent: true,
      opacity: 0.5,
    });
    const ringGeo2 = new THREE.TorusGeometry(4.1, 0.015, 8, 100);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI * 0.25;
    ring2.rotation.x = Math.PI * 0.15;
    telemetryGroup.add(ring2);

    const hexRingGeo = new THREE.RingGeometry(2.4, 4.8, 6, 1);
    const hexRingMat = new THREE.MeshBasicMaterial({
      color: 0xc5a46d,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const floorGrid = new THREE.Mesh(hexRingGeo, hexRingMat);
    floorGrid.rotation.x = -Math.PI / 2;
    floorGrid.position.y = -0.02;
    rootGroup.add(floorGrid);

    // Protocol Node Particles
    const particleCount = 320;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);

    const goldColor = new THREE.Color(0xc5a46d);
    const emeraldColor = new THREE.Color(0x2e9b68);
    const steelColor = new THREE.Color(0x8e95a5);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 2.6 + Math.random() * 3.6;
      const py = (Math.random() - 0.5) * 3.2;

      pPos[i * 3] = Math.cos(theta) * radius;
      pPos[i * 3 + 1] = py;
      pPos[i * 3 + 2] = Math.sin(theta) * radius;

      const rnd = Math.random();
      let c = goldColor;
      if (rnd > 0.72) c = emeraldColor;
      else if (rnd > 0.4) c = steelColor;

      pColors[i * 3] = c.r;
      pColors[i * 3 + 1] = c.g;
      pColors[i * 3 + 2] = c.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });
    const particles = new THREE.Points(pGeo, pMat);
    rootGroup.add(particles);

    // Spatial Pose
    rootGroup.position.set(0.35, -0.55, 0);
    rootGroup.rotation.y = -0.55;
    rootGroup.rotation.x = 0.15;

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetX = normX * 0.45;
      targetY = normY * 0.25;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const onWindowResize = () => {
      if (!containerEl) return;
      const nw = containerEl.clientWidth || window.innerWidth || 1200;
      const nh = containerEl.clientHeight || window.innerHeight || 800;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onWindowResize);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const elapsedTime = clock.getElapsedTime();

      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.04;

      carGroup.position.y = Math.sin(elapsedTime * 1.3) * 0.08;

      rootGroup.rotation.y = -0.55 + mouseX + elapsedTime * 0.18;
      rootGroup.rotation.x = 0.15 - mouseY + Math.sin(elapsedTime * 0.7) * 0.03;

      ring1.rotation.z = elapsedTime * 0.22;
      ring2.rotation.y = -elapsedTime * 0.16;
      floorGrid.rotation.z = elapsedTime * 0.09;

      particles.rotation.y = elapsedTime * 0.06;

      wheels.forEach((wheel) => {
        wheel.rotation.x = elapsedTime * 0.6;
      });

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onWindowResize);
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode === containerEl) {
        containerEl.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full bg-transparent z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
};
