import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

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
    const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 1000);
    camera.position.set(0, 1.38, 8.6);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.32;
    renderer.setSize(w, h);
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    containerEl.appendChild(renderer.domElement);

    // Studio environment map for realistic Crystal Black Pearl clearcoat & glass reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Automotive Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xe4eeff, 0x0b0c10, 1.35);
    scene.add(hemiLight);

    const mainKeyLight = new THREE.DirectionalLight(0xfff0d4, 3.6);
    mainKeyLight.position.set(5, 9, 8);
    scene.add(mainKeyLight);

    const rimLightLeft = new THREE.DirectionalLight(0xa8c0e8, 2.8);
    rimLightLeft.position.set(-8, 5, -5);
    scene.add(rimLightLeft);

    const sideBeltLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sideBeltLight.position.set(0, 2.2, 9);
    scene.add(sideBeltLight);

    const goldGlowPoint = new THREE.PointLight(0xc5a46d, 2.8, 20);
    goldGlowPoint.position.set(0, 2.8, 2.0);
    scene.add(goldGlowPoint);

    // Root Group & Car Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const carGroup = new THREE.Group();
    rootGroup.add(carGroup);

    // =========================================================================
    // MATERIALS (Crystal Black Pearl / Obsidian Metallic Honda City Reference)
    // =========================================================================
    // Deep Crystal Black Pearl Metallic with Mirror Clearcoat (matches reference photo)
    const blackPearlPaintMat = new THREE.MeshPhysicalMaterial({
      color: 0x0d1017,
      metalness: 0.85,
      roughness: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.75,
    });

    // Lower Rocker & Diffuser Satin Metallic
    const darkAeroMat = new THREE.MeshPhysicalMaterial({
      color: 0x080a0f,
      metalness: 0.65,
      roughness: 0.25,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    });

    // Realistic Semi-Clear Tinted Window Glass (allows interior seats/pillars to be seen)
    const sideWindowGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x6c829e,
      metalness: 0.1,
      roughness: 0.05,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      envMapIntensity: 1.9,
    });

    // Front & Rear Windshield Laminated Glass
    const windshieldGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x263244,
      metalness: 0.15,
      roughness: 0.04,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      envMapIntensity: 2.0,
    });

    // Interior Cabin Leather / Trim (visible through side windows like reference photo)
    const interiorSeatMat = new THREE.MeshStandardMaterial({
      color: 0x2a2f3d,
      metalness: 0.1,
      roughness: 0.65,
    });

    // Bright Machined Silver / Chrome (Solid Wing Face, Alloy Faces, Front Lower Lip Streak)
    const brightChromeMat = new THREE.MeshStandardMaterial({
      color: 0xf0f4fa,
      metalness: 0.96,
      roughness: 0.1,
      envMapIntensity: 1.9,
    });

    // Champagne Gold Subtle Accent
    const champagneChromeMat = new THREE.MeshStandardMaterial({
      color: 0xdcc08e,
      metalness: 0.92,
      roughness: 0.15,
      envMapIntensity: 1.6,
    });

    // Gloss Black Pillars, Grille Mesh & Window Trim
    const glossBlackMat = new THREE.MeshStandardMaterial({
      color: 0x050608,
      metalness: 0.4,
      roughness: 0.12,
    });

    // Vulcanized Tire Rubber
    const tireRubberMat = new THREE.MeshStandardMaterial({
      color: 0x0f1115,
      metalness: 0.08,
      roughness: 0.78,
    });

    // Ventilated Steel Brake Disc
    const brakeRotorMat = new THREE.MeshStandardMaterial({
      color: 0x9aa3b2,
      metalness: 0.85,
      roughness: 0.28,
    });

    // Crisp Ice-White LED Headlamp & DRL Emitter
    const ledWhiteMat = new THREE.MeshBasicMaterial({
      color: 0xf8fbff,
    });

    // Translucent Headlamp Cover
    const headlampCoverMat = new THREE.MeshPhysicalMaterial({
      color: 0xeaf2ff,
      metalness: 0.1,
      roughness: 0.05,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    // Ruby Red LED Taillight Emitter
    const taillightRedMat = new THREE.MeshBasicMaterial({
      color: 0xff2622,
    });

    // Clear/Silver Reverse Indicator Strip inside Taillight
    const taillightClearMat = new THREE.MeshBasicMaterial({
      color: 0xf2f6ff,
    });

    // =========================================================================
    // HELPER: V-SWEPT FRONT NOSE & SCULPTED EXTRUSION
    // =========================================================================
    // Matches the exact curved nose taper of the 5th-Gen Honda City
    const frontNoseSweepZ = (absX: number): number => {
      const normX = Math.min(1, absX / 0.9);
      return -0.32 * Math.pow(normX, 1.65);
    };

    const createSculptedMesh = (
      shape: THREE.Shape,
      width: number,
      bevelSize: number,
      bevelThickness: number,
      sculptFn?: (x: number, y: number, z: number) => [number, number, number]
    ): THREE.BufferGeometry => {
      const geo = new THREE.ExtrudeGeometry(shape, {
        steps: 12,
        depth: width - bevelThickness * 2,
        bevelEnabled: true,
        bevelThickness,
        bevelSize,
        bevelSegments: 8,
        curveSegments: 36,
      });

      geo.translate(0, 0, -(width - bevelThickness * 2) / 2);
      geo.rotateY(Math.PI / 2);

      if (sculptFn) {
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i);
          const vy = pos.getY(i);
          const vz = pos.getZ(i);
          const [nx, ny, nz] = sculptFn(vx, vy, vz);
          pos.setXYZ(i, nx, ny, nz);
        }
        pos.needsUpdate = true;
      }

      geo.computeVertexNormals();
      return geo;
    };

    // =========================================================================
    // 1. LOWER SEDAN BODY SHELL (Exact Side Silhouette from Reference Photo)
    //    - Gracefully sloping curved hood from cowl (z=0.82, y=0.93) down over
    //      the front wheel arch to a low shark-nose brow (z=2.45, y=0.63)
    //    - Vertical front bumper with recessed intake & lower chin lip (y=0.27)
    //    - Slight wedge beltline rising to rear decklid (z=-1.75..z=-2.32, y=0.98)
    //    - Tight, circular wheel arches at z = +1.42 and z = -1.38
    // =========================================================================
    const lowerBodyShape = new THREE.Shape();
    // Front lower bumper chin splitter tip (right side of reference photo)
    lowerBodyShape.moveTo(2.44, 0.27);
    lowerBodyShape.lineTo(2.51, 0.29);
    lowerBodyShape.lineTo(2.48, 0.34);
    // Vertical lower bumper intake recess
    lowerBodyShape.lineTo(2.44, 0.36);
    lowerBodyShape.lineTo(2.47, 0.56);
    // Forward-leaning Honda City nose brow right at the headlamp/grille tip
    lowerBodyShape.quadraticCurveTo(2.52, 0.61, 2.45, 0.65);
    // EXACT HONDA CITY SLOPING HOOD CURVE:
    // Smooth convex arc rising from nose tip (2.45, 0.65) over headlamp (2.10, 0.77)
    // and front wheel arch (1.42, 0.88) to base of windshield (0.82, 0.93)
    lowerBodyShape.bezierCurveTo(2.22, 0.76, 1.68, 0.88, 0.82, 0.93);
    // Door beltline / waist sill rising gently toward the rear quarter panel
    lowerBodyShape.lineTo(-1.32, 0.98);
    // Crisp rear trunk decklid
    lowerBodyShape.bezierCurveTo(-1.72, 0.99, -2.08, 0.98, -2.33, 0.96);
    // Taillight step & rear bumper upper shelf
    lowerBodyShape.lineTo(-2.35, 0.83);
    lowerBodyShape.lineTo(-2.42, 0.74);
    // Rear bumper vertical face & lower diffuser corner
    lowerBodyShape.quadraticCurveTo(-2.44, 0.52, -2.38, 0.34);
    lowerBodyShape.lineTo(-1.92, 0.31);
    // Rear wheel arch cutout (center z = -1.38, radius = 0.43)
    lowerBodyShape.absarc(-1.38, 0.42, 0.43, Math.PI * 1.07, -Math.PI * 0.07, true);
    // Flat horizontal side rocker sill between wheels
    lowerBodyShape.lineTo(0.99, 0.26);
    // Front wheel arch cutout (center z = +1.42, radius = 0.43)
    lowerBodyShape.absarc(1.42, 0.42, 0.43, Math.PI * 1.07, -Math.PI * 0.07, true);
    // Front lower overhang
    lowerBodyShape.lineTo(2.44, 0.27);

    const lowerBodyGeo = createSculptedMesh(
      lowerBodyShape,
      1.84,
      0.055,
      0.07,
      (vx, vy, vz) => {
        let x = vx;
        let y = vy;
        let z = vz;
        const absX = Math.abs(x);

        // Front nose V-sweep & sloped fender crown (z > 1.45)
        if (z > 1.45) {
          const t = Math.min(1, (z - 1.45) / 1.05);
          // Taper width smoothly toward front bumper corners
          x *= 1 - 0.14 * Math.pow(t, 1.45);
          // Sweep outer corners backward so front nose forms a sleek V-plan
          z += frontNoseSweepZ(Math.abs(x)) * Math.pow(t, 1.3);

          // Drop outer fender shoulder slightly toward the wraparound headlamps
          if (y > 0.62) {
            const lat = Math.min(1, Math.abs(x) / 0.85);
            y -= 0.055 * Math.pow(lat, 1.5) * (0.35 + 0.65 * t);
          }
        }

        // Rear trunk & bumper plan-view taper (z < -1.70)
        if (z < -1.7) {
          const t = Math.min(1, (-1.7 - z) / 0.72);
          x *= 1 - 0.11 * t * t;
          const centerFactor = Math.max(0, 1 - absX / 0.92);
          z -= 0.04 * t * centerFactor;
        }

        // Muscular circular wheel arch flares around z = +1.42 and z = -1.38
        const distFrontAxle = Math.hypot(z - 1.42, (y - 0.48) * 1.15);
        if (distFrontAxle < 0.6 && absX > 0.7) {
          const flare = Math.cos((distFrontAxle / 0.6) * (Math.PI / 2));
          x += Math.sign(x) * 0.065 * flare * flare;
        }
        const distRearAxle = Math.hypot(z + 1.38, (y - 0.48) * 1.15);
        if (distRearAxle < 0.62 && absX > 0.7) {
          const flare = Math.cos((distRearAxle / 0.62) * (Math.PI / 2));
          x += Math.sign(x) * 0.072 * flare * flare;
        }

        // Sculpted lower door waist indentation between wheels (creates light-catching sill reflection)
        if (z > -0.92 && z < 0.95 && y > 0.33 && y < 0.76 && absX > 0.74) {
          const doorTuck = Math.sin(((z + 0.92) / 1.87) * Math.PI);
          const heightFactor = Math.sin(((y - 0.33) / 0.43) * Math.PI);
          x -= Math.sign(x) * 0.038 * doorTuck * heightFactor;
        }

        return [x, y, z];
      }
    );

    const lowerBodyMesh = new THREE.Mesh(lowerBodyGeo, blackPearlPaintMat);
    carGroup.add(lowerBodyMesh);

    // =========================================================================
    // 2. FRAMED CABIN GREENHOUSE, CLEAR SIDE WINDOWS (DLO) & INTERIOR SEATS
    //    Matches the reference photo where you can see through the side windows,
    //    framed by the arched roof rail, A-pillar, B-pillar, and C-pillar kick.
    // =========================================================================
    // 2A. Painted Outer Roof Arch & A/C-Pillar Structural Frame (with open side windows)
    const roofFrameShape = new THREE.Shape();
    // Outer contour of A-pillar, arched roof, and C-pillar
    roofFrameShape.moveTo(0.84, 0.92);
    roofFrameShape.bezierCurveTo(0.42, 1.21, 0.08, 1.38, -0.28, 1.41);
    roofFrameShape.bezierCurveTo(-0.78, 1.39, -1.26, 1.24, -1.74, 0.97);
    roofFrameShape.lineTo(-1.52, 0.97);
    // Inner window cutout top curve (creates the painted cantrail arch above the windows)
    roofFrameShape.bezierCurveTo(-1.14, 1.19, -0.72, 1.33, -0.26, 1.35);
    roofFrameShape.bezierCurveTo(0.06, 1.32, 0.36, 1.16, 0.68, 0.92);
    roofFrameShape.closePath();

    const roofFrameGeo = createSculptedMesh(
      roofFrameShape,
      1.52,
      0.03,
      0.04,
      (vx, vy, vz) => {
        let x = vx;
        const y = vy;
        const z = vz;
        const roofRatio = Math.max(0, Math.min(1, (y - 0.92) / 0.49));
        // Tumblehome inward slope
        x *= 1 - 0.15 * Math.pow(roofRatio, 1.1);
        if (z > 0.3) x *= 1 - 0.05 * Math.pow((z - 0.3) / 0.55, 2);
        if (z < -1.15) x *= 1 - 0.07 * Math.pow((-1.15 - z) / 0.6, 2);
        return [x, y, z];
      }
    );
    const roofFrameMesh = new THREE.Mesh(roofFrameGeo, blackPearlPaintMat);
    carGroup.add(roofFrameMesh);

    // 2B. Translucent Window Greenhouse Core (Front Windshield, Side Glass & Rear Backlight)
    const glassHouseShape = new THREE.Shape();
    glassHouseShape.moveTo(0.76, 0.92);
    glassHouseShape.bezierCurveTo(0.38, 1.19, 0.06, 1.35, -0.28, 1.37);
    glassHouseShape.bezierCurveTo(-0.75, 1.35, -1.2, 1.21, -1.62, 0.97);
    glassHouseShape.lineTo(0.76, 0.92);

    const glassHouseGeo = createSculptedMesh(
      glassHouseShape,
      1.46,
      0.025,
      0.035,
      (vx, vy, vz) => {
        let x = vx;
        const y = vy;
        let z = vz;
        const roofRatio = Math.max(0, Math.min(1, (y - 0.92) / 0.46));
        x *= 1 - 0.155 * Math.pow(roofRatio, 1.1);
        const centerCurve = Math.max(0, 1 - Math.pow(x / 0.73, 2));
        if (z > 0.15) z += 0.07 * centerCurve * (1 - roofRatio * 0.4);
        else if (z < -1.05) z -= 0.05 * centerCurve * (1 - roofRatio * 0.4);
        return [x, y, z];
      }
    );
    const glassHouseMesh = new THREE.Mesh(glassHouseGeo, sideWindowGlassMat);
    carGroup.add(glassHouseMesh);

    // Separate Front & Rear Windshield Panels with slightly deeper angle reflections
    const frontShieldGeo = new THREE.PlaneGeometry(1.18, 0.72, 12, 8);
    const fsPos = frontShieldGeo.attributes.position;
    for (let i = 0; i < fsPos.count; i++) {
      const px = fsPos.getX(i);
      const py = fsPos.getY(i);
      const arch = Math.cos((px / 0.62) * (Math.PI / 3)) * 0.045;
      fsPos.setZ(i, arch);
      // Taper narrower at top of windshield
      const topRatio = (py + 0.36) / 0.72;
      fsPos.setX(i, px * (1 - 0.12 * topRatio));
    }
    frontShieldGeo.computeVertexNormals();
    const frontShield = new THREE.Mesh(frontShieldGeo, windshieldGlassMat);
    frontShield.position.set(0, 1.15, 0.42);
    frontShield.rotation.x = -0.92;
    carGroup.add(frontShield);

    // 2C. B-Pillars, Rear Door Window Bar & Signature C-Pillar Quarter Window Kick
    [-1, 1].forEach((side) => {
      // Main Center B-Pillar (between front and rear doors)
      const bPillarGeo = new THREE.BoxGeometry(0.025, 0.42, 0.085);
      const bPillar = new THREE.Mesh(bPillarGeo, glossBlackMat);
      bPillar.position.set(side * 0.68, 1.15, -0.18);
      bPillar.rotation.z = side * 0.22;
      carGroup.add(bPillar);

      // Rear Door Quarter Glass Divider Bar (creates the 3-panel sedan window look in photo)
      const qBarGeo = new THREE.BoxGeometry(0.022, 0.32, 0.032);
      const qBar = new THREE.Mesh(qBarGeo, glossBlackMat);
      qBar.position.set(side * 0.685, 1.12, -1.02);
      qBar.rotation.z = side * 0.22;
      qBar.rotation.x = -0.08;
      carGroup.add(qBar);

      // Lower Window Sill Molding with Upward C-Pillar Kick (exact match to photo)
      const sillPts = [
        new THREE.Vector3(side * 0.74, 0.94, 0.74),
        new THREE.Vector3(side * 0.75, 0.96, -0.18),
        new THREE.Vector3(side * 0.74, 0.98, -1.15),
        new THREE.Vector3(side * 0.71, 1.05, -1.46),
      ];
      const sillCurve = new THREE.CatmullRomCurve3(sillPts);
      const sillGeo = new THREE.TubeGeometry(sillCurve, 28, 0.012, 8, false);
      const sillMesh = new THREE.Mesh(sillGeo, brightChromeMat);
      carGroup.add(sillMesh);
    });

    // 2D. Interior Cabin Silhouette (Front Seats, Headrests, Rear Seats, Dashboard)
    // Visible through the side window glass just like the reference photo!
    const interiorGroup = new THREE.Group();
    carGroup.add(interiorGroup);

    // Dashboard Cowl
    const dashGeo = new THREE.BoxGeometry(1.18, 0.22, 0.38);
    const dashMesh = new THREE.Mesh(dashGeo, glossBlackMat);
    dashMesh.position.set(0, 0.92, 0.42);
    interiorGroup.add(dashMesh);

    // Front Bucket Seats & Headrests (Left & Right)
    [-0.28, 0.28].forEach((sx) => {
      const seatBackGeo = new THREE.BoxGeometry(0.34, 0.36, 0.1);
      const seatBack = new THREE.Mesh(seatBackGeo, interiorSeatMat);
      seatBack.position.set(sx, 0.98, -0.05);
      seatBack.rotation.x = -0.22;
      interiorGroup.add(seatBack);

      const headrestGeo = new THREE.BoxGeometry(0.18, 0.13, 0.075);
      const headrest = new THREE.Mesh(headrestGeo, interiorSeatMat);
      headrest.position.set(sx, 1.21, -0.11);
      headrest.rotation.x = -0.15;
      interiorGroup.add(headrest);
    });

    // Rear Bench Seat & Headrests
    const rearBenchGeo = new THREE.BoxGeometry(1.06, 0.32, 0.12);
    const rearBench = new THREE.Mesh(rearBenchGeo, interiorSeatMat);
    rearBench.position.set(0, 0.97, -0.88);
    rearBench.rotation.x = -0.25;
    interiorGroup.add(rearBench);

    [-0.3, 0.3].forEach((rx) => {
      const rHeadGeo = new THREE.BoxGeometry(0.17, 0.11, 0.07);
      const rHead = new THREE.Mesh(rHeadGeo, interiorSeatMat);
      rHead.position.set(rx, 1.16, -0.95);
      interiorGroup.add(rHead);
    });

    // Shark-Fin Roof Antenna (at rear roof edge, visible in reference photo)
    const sharkFinShape = new THREE.Shape();
    sharkFinShape.moveTo(0, 0);
    sharkFinShape.quadraticCurveTo(-0.07, 0.075, -0.14, 0.088);
    sharkFinShape.lineTo(-0.12, 0);
    sharkFinShape.closePath();
    const sharkFinGeo = new THREE.ExtrudeGeometry(sharkFinShape, {
      steps: 1,
      depth: 0.026,
      bevelEnabled: true,
      bevelSize: 0.005,
      bevelThickness: 0.005,
      bevelSegments: 3,
    });
    sharkFinGeo.translate(0, 0, -0.013);
    sharkFinGeo.rotateY(Math.PI / 2);
    const sharkFin = new THREE.Mesh(sharkFinGeo, blackPearlPaintMat);
    sharkFin.position.set(0, 1.32, -0.98);
    carGroup.add(sharkFin);

    // =========================================================================
    // 3. EXACT HONDA CITY FRONT FASCIA, SLOPED HEADLAMP WEDGES & LOWER LIP
    //    Look at the right side of the reference photo:
    //    - Sloping hood meets a sharp swept-back white/silver headlamp wedge
    //      that wraps back from z = 2.42 to z = 1.84 above the front bumper
    //    - Solid Wing chrome/LED bar across the top of the grille & headlamps
    //    - Vertical dark front bumper intake + bright horizontal lower lip streak
    // =========================================================================
    const frontFasciaGroup = new THREE.Group();
    carGroup.add(frontFasciaGroup);

    const buildContouredRibbon = (
      xMax: number,
      segments: number,
      yFn: (absX: number) => [number, number],
      zOffset: number,
      depthThickness: number
    ): THREE.BufferGeometry => {
      const shape = new THREE.Shape();
      for (let i = 0; i <= segments; i++) {
        const x = -xMax + (i / segments) * (xMax * 2);
        const [, yTop] = yFn(Math.abs(x));
        if (i === 0) shape.moveTo(x, yTop);
        else shape.lineTo(x, yTop);
      }
      for (let i = segments; i >= 0; i--) {
        const x = -xMax + (i / segments) * (xMax * 2);
        const [yBot] = yFn(Math.abs(x));
        shape.lineTo(x, yBot);
      }
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, {
        steps: 1,
        depth: depthThickness,
        bevelEnabled: true,
        bevelSize: 0.005,
        bevelThickness: 0.007,
        bevelSegments: 3,
      });

      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        const sweepZ = 2.48 + frontNoseSweepZ(Math.abs(vx)) + zOffset + vz;
        pos.setXYZ(i, vx, vy, sweepZ);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      return geo;
    };

    // 3A. Signature "Solid Wing Face" Upper Chrome Bar & Eyebrows
    const solidWingGeo = buildContouredRibbon(
      0.82,
      48,
      (absX) => {
        if (absX < 0.4) {
          const t = absX / 0.4;
          const yTop = 0.675 - 0.008 * t * t;
          const yBot = 0.595 + 0.032 * Math.pow(t, 1.15);
          return [yBot, yTop];
        } else {
          const t = (absX - 0.4) / 0.42;
          const yTop = 0.667 + 0.065 * t;
          const yBot = 0.627 + 0.068 * t;
          return [yBot, yTop];
        }
      },
      -0.01,
      0.04
    );
    const solidWingMesh = new THREE.Mesh(solidWingGeo, brightChromeMat);
    frontFasciaGroup.add(solidWingMesh);

    // Honda "H" Emblem Badge in Center of Solid Wing Grille
    const hBadgeGroup = new THREE.Group();
    hBadgeGroup.position.set(0, 0.635, 2.515);
    const badgeBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.075, 0.016),
      glossBlackMat
    );
    const hLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.054, 0.022),
      brightChromeMat
    );
    hLeft.position.set(-0.024, 0, 0.004);
    const hRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.054, 0.022),
      brightChromeMat
    );
    hRight.position.set(0.024, 0, 0.004);
    const hCross = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.013, 0.022),
      brightChromeMat
    );
    hCross.position.set(0, -0.002, 0.004);
    hBadgeGroup.add(badgeBack, hLeft, hRight, hCross);
    frontFasciaGroup.add(hBadgeGroup);

    // Recessed Upper Honeycomb Grille Mesh
    const upperGrilleGeo = buildContouredRibbon(
      0.41,
      24,
      (absX) => [0.515 + 0.02 * (absX / 0.41), 0.61],
      -0.045,
      0.025
    );
    const upperGrille = new THREE.Mesh(upperGrilleGeo, glossBlackMat);
    frontFasciaGroup.add(upperGrille);

    // 3B. Swept-Back Side-Profile Headlamp Wedges & Jewel-Eye LED Projectors
    // Look at the reference photo: the bright headlamp wraps far back along the
    // sloped front fender side (from z = 2.40 back to z = 1.82)!
    [-1, 1].forEach((side) => {
      // Side-wrapping crystalline headlamp wedge (visible in both profile & 3/4 views)
      const hlSideShape = new THREE.Shape();
      hlSideShape.moveTo(2.41, 0.62);
      hlSideShape.quadraticCurveTo(2.15, 0.72, 1.84, 0.77);
      hlSideShape.lineTo(1.94, 0.69);
      hlSideShape.quadraticCurveTo(2.18, 0.62, 2.41, 0.57);
      hlSideShape.closePath();

      const hlSideGeo = new THREE.ExtrudeGeometry(hlSideShape, {
        steps: 2,
        depth: 0.18,
        bevelEnabled: true,
        bevelSize: 0.012,
        bevelThickness: 0.015,
        bevelSegments: 4,
      });
      hlSideGeo.translate(0, 0, -0.09);
      hlSideGeo.rotateY(Math.PI / 2);

      // Contour the headlamp wedge to hug the curved front fender corner
      const hPos = hlSideGeo.attributes.position;
      for (let i = 0; i < hPos.count; i++) {
        const vx = hPos.getX(i);
        const vy = hPos.getY(i);
        const vz = hPos.getZ(i);
        // As z goes from 1.84 (rear fender tip) to 2.41 (front grille edge),
        // curve X inward from |x| = 0.82 at fender to |x| = 0.42 at grille
        const t = Math.max(0, Math.min(1, (vz - 1.84) / 0.57));
        const baseLat = 0.81 - 0.36 * Math.pow(t, 1.25);
        const nx = side * baseLat + vx * 0.45;
        hPos.setXYZ(i, nx, vy, vz);
      }
      hPos.needsUpdate = true;
      hlSideGeo.computeVertexNormals();

      const hlWedgeMesh = new THREE.Mesh(hlSideGeo, ledWhiteMat);
      frontFasciaGroup.add(hlWedgeMesh);

      const hlCoverMesh = new THREE.Mesh(hlSideGeo.clone(), headlampCoverMat);
      hlCoverMesh.scale.set(1.015, 1.015, 1.015);
      frontFasciaGroup.add(hlCoverMesh);

      // Upper DRL / Chrome Eyebrow Streak running along the top of the headlamp wedge
      const drlPts = [
        new THREE.Vector3(side * 0.41, 0.64, 2.43),
        new THREE.Vector3(side * 0.63, 0.69, 2.24),
        new THREE.Vector3(side * 0.78, 0.74, 2.02),
        new THREE.Vector3(side * 0.83, 0.77, 1.84),
      ];
      const drlCurve = new THREE.CatmullRomCurve3(drlPts);
      const drlGeo = new THREE.TubeGeometry(drlCurve, 24, 0.013, 8, false);
      const drlStreak = new THREE.Mesh(drlGeo, ledWhiteMat);
      frontFasciaGroup.add(drlStreak);

      // 3C. Vertical Front Bumper Side Air-Curtain & Bright Horizontal Lower Chin Lip Streak
      // Look at the bottom-right corner of the reference photo: there is a distinct
      // vertical intake edge and a bright horizontal silver/white trim streak along the bottom!
      const lowerLipStreakPts = [
        new THREE.Vector3(side * 0.42, 0.305, 2.46),
        new THREE.Vector3(side * 0.65, 0.305, 2.33),
        new THREE.Vector3(side * 0.82, 0.31, 2.12),
      ];
      const lipStreakCurve = new THREE.CatmullRomCurve3(lowerLipStreakPts);
      const lipStreakGeo = new THREE.TubeGeometry(lipStreakCurve, 20, 0.014, 8, false);
      const lipStreakMesh = new THREE.Mesh(lipStreakGeo, brightChromeMat);
      frontFasciaGroup.add(lipStreakMesh);

      // Vertical Side Fog-Pocket Fin on the Front Bumper Corner
      const fogFinPts = [
        new THREE.Vector3(side * 0.74, 0.54, 2.26),
        new THREE.Vector3(side * 0.76, 0.43, 2.28),
        new THREE.Vector3(side * 0.75, 0.32, 2.25),
      ];
      const fogFinCurve = new THREE.CatmullRomCurve3(fogFinPts);
      const fogFinGeo = new THREE.TubeGeometry(fogFinCurve, 16, 0.018, 8, false);
      const fogFinMesh = new THREE.Mesh(fogFinGeo, darkAeroMat);
      frontFasciaGroup.add(fogFinMesh);
    });

    // Lower Center Bumper Grille & Front Chin Splitter
    const lowerGrilleGeo = buildContouredRibbon(
      0.48,
      24,
      () => [0.31, 0.46],
      -0.035,
      0.025
    );
    const lowerGrille = new THREE.Mesh(lowerGrilleGeo, glossBlackMat);
    frontFasciaGroup.add(lowerGrille);

    const chinSplitterGeo = buildContouredRibbon(
      0.84,
      36,
      () => [0.265, 0.298],
      0.01,
      0.035
    );
    const chinSplitter = new THREE.Mesh(chinSplitterGeo, darkAeroMat);
    frontFasciaGroup.add(chinSplitter);

    // =========================================================================
    // 4. SIDE KATANA SHOULDER CREASE, DOOR HANDLES, SIDE MIRRORS & ROCKER SKIRT
    // =========================================================================
    [-1, 1].forEach((side) => {
      // Sharp Katana Shoulder Line from Headlamp Tip to Rear Wraparound Taillamp
      const katanaPts = [
        new THREE.Vector3(side * 0.83, 0.77, 1.84),
        new THREE.Vector3(side * 0.91, 0.86, 1.15),
        new THREE.Vector3(side * 0.91, 0.9, 0.0),
        new THREE.Vector3(side * 0.91, 0.93, -1.2),
        new THREE.Vector3(side * 0.86, 0.94, -1.95),
      ];
      const katanaCurve = new THREE.CatmullRomCurve3(katanaPts);
      const katanaGeo = new THREE.TubeGeometry(katanaCurve, 36, 0.009, 8, false);
      const katanaMesh = new THREE.Mesh(katanaGeo, blackPearlPaintMat);
      carGroup.add(katanaMesh);

      // Lower Door Sculpted Crease Line (above rocker panel, clearly visible in reference photo)
      const lowerCreasePts = [
        new THREE.Vector3(side * 0.89, 0.42, 0.88),
        new THREE.Vector3(side * 0.9, 0.41, 0.0),
        new THREE.Vector3(side * 0.89, 0.43, -0.88),
      ];
      const lowerCreaseCurve = new THREE.CatmullRomCurve3(lowerCreasePts);
      const lowerCreaseGeo = new THREE.TubeGeometry(
        lowerCreaseCurve,
        24,
        0.014,
        8,
        false
      );
      const lowerCreaseMesh = new THREE.Mesh(lowerCreaseGeo, blackPearlPaintMat);
      carGroup.add(lowerCreaseMesh);

      // Flush Body-Colored Door Handles (Front & Rear Doors)
      [0.18, -0.62].forEach((hz, idx) => {
        const handleGeo = new THREE.CapsuleGeometry(0.013, 0.13, 6, 8);
        handleGeo.rotateX(Math.PI / 2);
        const handleMesh = new THREE.Mesh(handleGeo, blackPearlPaintMat);
        handleMesh.position.set(side * 0.915, 0.86 + idx * 0.02, hz);
        carGroup.add(handleMesh);
      });

      // Door-Mounted Side Mirror (ORVM) with Bright White/Silver LED Turn Indicator Strip
      // Look at the reference photo: the side mirror sits on the front door shoulder
      // with a bright white horizontal turn-signal bar!
      const mirrorGroup = new THREE.Group();
      const stalkGeo = new THREE.BoxGeometry(0.09, 0.035, 0.055);
      const stalk = new THREE.Mesh(stalkGeo, glossBlackMat);
      stalk.position.set(side * 0.035, -0.02, 0.01);
      mirrorGroup.add(stalk);

      const capGeo = new THREE.SphereGeometry(0.082, 16, 12);
      capGeo.scale(1.25, 0.65, 0.85);
      const cap = new THREE.Mesh(capGeo, blackPearlPaintMat);
      cap.position.set(side * 0.1, 0.01, 0);
      mirrorGroup.add(cap);

      const turnStripGeo = new THREE.BoxGeometry(0.11, 0.014, 0.025);
      const turnStrip = new THREE.Mesh(turnStripGeo, ledWhiteMat);
      turnStrip.position.set(side * 0.115, 0.015, 0.058);
      turnStrip.rotation.y = side * -0.2;
      mirrorGroup.add(turnStrip);

      mirrorGroup.position.set(side * 0.74, 0.96, 0.56);
      carGroup.add(mirrorGroup);
    });

    // =========================================================================
    // 5. REAR RAISED TRUNK SPOILER & LONG WRAPAROUND TAILLIGHTS (Matches Photo)
    //    Look at the left side of the reference photo:
    //    - Raised trunk wing spoiler at the rear edge of the trunk lid
    //    - Long horizontal wraparound red-and-clear taillight extending forward
    //      into the rear fender side profile
    // =========================================================================
    // Raised Sport Trunk Wing Spoiler (with side winglets)
    const spoilerShape = new THREE.Shape();
    spoilerShape.moveTo(-2.18, 0.98);
    spoilerShape.quadraticCurveTo(-2.28, 1.03, -2.38, 1.055);
    spoilerShape.lineTo(-2.35, 1.01);
    spoilerShape.quadraticCurveTo(-2.26, 0.98, -2.18, 0.98);

    const spoilerGeo = createSculptedMesh(
      spoilerShape,
      1.36,
      0.012,
      0.015,
      (vx, vy, vz) => {
        const lat = Math.abs(vx) / 0.68;
        return [vx, vy - 0.012 * lat * lat, vz + 0.04 * lat * lat];
      }
    );
    const spoilerMesh = new THREE.Mesh(spoilerGeo, blackPearlPaintMat);
    carGroup.add(spoilerMesh);

    // Long Side-Wrapping Red + Clear Taillights (visible in side profile & rear 3/4)
    [-1, 1].forEach((side) => {
      // Side-wrapping outer red taillight housing (from z = -1.84 to z = -2.36)
      const tlSideShape = new THREE.Shape();
      tlSideShape.moveTo(-1.84, 0.92);
      tlSideShape.lineTo(-2.35, 0.94);
      tlSideShape.lineTo(-2.36, 0.84);
      tlSideShape.quadraticCurveTo(-2.08, 0.85, -1.84, 0.92);

      const tlSideGeo = new THREE.ExtrudeGeometry(tlSideShape, {
        steps: 2,
        depth: 0.14,
        bevelEnabled: true,
        bevelSize: 0.01,
        bevelThickness: 0.012,
        bevelSegments: 3,
      });
      tlSideGeo.translate(0, 0, -0.07);
      tlSideGeo.rotateY(Math.PI / 2);

      const tPos = tlSideGeo.attributes.position;
      for (let i = 0; i < tPos.count; i++) {
        const vx = tPos.getX(i);
        const vy = tPos.getY(i);
        const vz = tPos.getZ(i);
        const t = Math.max(0, Math.min(1, (-1.84 - vz) / 0.52));
        const baseLat = 0.83 - 0.22 * Math.pow(t, 1.3);
        tPos.setXYZ(i, side * baseLat + vx * 0.4, vy, vz);
      }
      tPos.needsUpdate = true;
      tlSideGeo.computeVertexNormals();

      const tlSideMesh = new THREE.Mesh(tlSideGeo, taillightRedMat);
      carGroup.add(tlSideMesh);

      // Clear/White Upper Reverse Strip inside the Wraparound Taillight (visible in reference photo)
      const clearStripPts = [
        new THREE.Vector3(side * 0.83, 0.915, -1.9),
        new THREE.Vector3(side * 0.76, 0.925, -2.14),
        new THREE.Vector3(side * 0.64, 0.93, -2.34),
      ];
      const clearStripCurve = new THREE.CatmullRomCurve3(clearStripPts);
      const clearStripGeo = new THREE.TubeGeometry(
        clearStripCurve,
        16,
        0.012,
        8,
        false
      );
      const clearStripMesh = new THREE.Mesh(clearStripGeo, taillightClearMat);
      carGroup.add(clearStripMesh);
    });

    // =========================================================================
    // 6. 16-INCH DIRECTIONAL SWIRL DIAMOND-CUT ALLOY WHEELS (Exact Photo Style)
    //    Look at the wheels in the reference photo:
    //    - 5 directional swirl / Y-blade machined silver spokes over gloss black
    //    - Centered in tight circular wheel arches at z = +1.42 and z = -1.38
    // =========================================================================
    const wheelPositions: [number, number, number][] = [
      [-0.86, 0.41, 1.42],
      [0.86, 0.41, 1.42],
      [-0.86, 0.41, -1.38],
      [0.86, 0.41, -1.38],
    ];

    const wheels: THREE.Group[] = [];

    const tireTreadGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.24, 40);
    tireTreadGeo.rotateZ(Math.PI / 2);

    const tireShoulderGeo = new THREE.TorusGeometry(0.335, 0.058, 16, 40);
    tireShoulderGeo.rotateY(Math.PI / 2);

    const innerBarrelGeo = new THREE.CylinderGeometry(0.285, 0.285, 0.22, 32);
    innerBarrelGeo.rotateZ(Math.PI / 2);

    const outerLipGeo = new THREE.TorusGeometry(0.28, 0.015, 12, 40);
    outerLipGeo.rotateY(Math.PI / 2);

    const rotorGeo = new THREE.CylinderGeometry(0.215, 0.215, 0.024, 28);
    rotorGeo.rotateZ(Math.PI / 2);

    const caliperGeo = new THREE.BoxGeometry(0.055, 0.13, 0.09);

    const hubCapGeo = new THREE.CylinderGeometry(0.062, 0.062, 0.04, 20);
    hubCapGeo.rotateZ(Math.PI / 2);

    // Directional Swirl Blade Spoke Geometry (matches reference photo alloys)
    const mainBladeGeo = new THREE.BoxGeometry(0.024, 0.22, 0.036);
    const subBladeGeo = new THREE.BoxGeometry(0.02, 0.14, 0.022);

    wheelPositions.forEach(([wx, wy, wz]) => {
      const side = Math.sign(wx);

      const brakeHubGroup = new THREE.Group();
      brakeHubGroup.position.set(wx, wy, wz);
      const caliper = new THREE.Mesh(caliperGeo, champagneChromeMat);
      caliper.position.set(side * 0.04, 0.04, wz > 0 ? -0.13 : 0.13);
      brakeHubGroup.add(caliper);
      carGroup.add(brakeHubGroup);

      const wGroup = new THREE.Group();
      wGroup.position.set(wx, wy, wz);

      const tread = new THREE.Mesh(tireTreadGeo, tireRubberMat);
      const shoulderIn = new THREE.Mesh(tireShoulderGeo, tireRubberMat);
      shoulderIn.position.x = -side * 0.085;
      const shoulderOut = new THREE.Mesh(tireShoulderGeo, tireRubberMat);
      shoulderOut.position.x = side * 0.085;

      const barrel = new THREE.Mesh(innerBarrelGeo, glossBlackMat);
      const rotor = new THREE.Mesh(rotorGeo, brakeRotorMat);
      rotor.position.x = side * 0.03;

      const rimLip = new THREE.Mesh(outerLipGeo, brightChromeMat);
      rimLip.position.x = side * 0.105;

      const hubCap = new THREE.Mesh(hubCapGeo, glossBlackMat);
      hubCap.position.x = side * 0.106;

      wGroup.add(tread, shoulderIn, shoulderOut, barrel, rotor, rimLip, hubCap);

      // 5 Directional Swirl Y-Spokes in Bright Machined Silver
      const numSwirls = 5;
      for (let s = 0; s < numSwirls; s++) {
        const baseAngle = (s / numSwirls) * Math.PI * 2;

        // Primary angled swirl blade
        const blade = new THREE.Mesh(mainBladeGeo, brightChromeMat);
        const r1 = 0.16;
        blade.position.set(
          side * 0.102,
          Math.cos(baseAngle) * r1,
          Math.sin(baseAngle) * r1
        );
        blade.rotation.x = baseAngle + 0.34;
        wGroup.add(blade);

        // Secondary Y-fork accent blade
        const forkAngle = baseAngle + 0.32;
        const fork = new THREE.Mesh(subBladeGeo, brightChromeMat);
        const r2 = 0.19;
        fork.position.set(
          side * 0.101,
          Math.cos(forkAngle) * r2,
          Math.sin(forkAngle) * r2
        );
        fork.rotation.x = forkAngle - 0.28;
        wGroup.add(fork);
      }

      carGroup.add(wGroup);
      wheels.push(wGroup);
    });

    // Dark Wheelhouse Liners
    const linerGeo = new THREE.CylinderGeometry(
      0.415,
      0.415,
      1.58,
      24,
      1,
      false,
      0,
      Math.PI
    );
    linerGeo.rotateZ(Math.PI / 2);
    [1.42, -1.38].forEach((az) => {
      const liner = new THREE.Mesh(linerGeo, glossBlackMat);
      liner.position.set(0, 0.42, az);
      carGroup.add(liner);
    });

    const underbodyGeo = new THREE.BoxGeometry(1.6, 0.06, 4.3);
    const underbody = new THREE.Mesh(underbodyGeo, glossBlackMat);
    underbody.position.set(0, 0.26, 0.02);
    carGroup.add(underbody);

    // =========================================================================
    // 7. CRYPTOGRAPHIC TELEMETRY PODIUM & AUCTION SCANNER RINGS
    // =========================================================================
    const telemetryGroup = new THREE.Group();
    rootGroup.add(telemetryGroup);

    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xc5a46d,
      transparent: true,
      opacity: 0.58,
      wireframe: true,
    });
    const ringGeo1 = new THREE.TorusGeometry(3.55, 0.015, 12, 100);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI * 0.46;
    telemetryGroup.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x8e95a5,
      transparent: true,
      opacity: 0.38,
    });
    const ringGeo2 = new THREE.TorusGeometry(4.05, 0.012, 8, 100);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI * 0.25;
    ring2.rotation.x = Math.PI * 0.15;
    telemetryGroup.add(ring2);

    const hexRingGeo = new THREE.RingGeometry(2.45, 4.75, 6, 1);
    const hexRingMat = new THREE.MeshBasicMaterial({
      color: 0xc5a46d,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const floorGrid = new THREE.Mesh(hexRingGeo, hexRingMat);
    floorGrid.rotation.x = -Math.PI / 2;
    floorGrid.position.y = 0.02;
    rootGroup.add(floorGrid);

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 18, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
      grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.36)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlaneGeo = new THREE.PlaneGeometry(2.9, 5.7);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const contactShadow = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.03;
    carGroup.add(contactShadow);

    const particleCount = 260;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);

    const goldColor = new THREE.Color(0xc5a46d);
    const emeraldColor = new THREE.Color(0x2e9b68);
    const steelColor = new THREE.Color(0x8e95a5);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 2.6 + Math.random() * 3.5;
      const py = (Math.random() - 0.5) * 3.0;

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
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
    });
    const particles = new THREE.Points(pGeo, pMat);
    rootGroup.add(particles);

    // Pose oriented to showcase the iconic Honda City side/front-quarter silhouette
    // matching the reference photo (nose pointing right, sleek side profile & front wedge visible)
    rootGroup.position.set(0.55, -0.44, 0);
    const baseYaw = Math.PI * 0.42; // Side-front profile facing right like the reference photo
    rootGroup.rotation.y = baseYaw;
    rootGroup.rotation.x = 0.06;

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetX = normX * 0.35;
      targetY = normY * 0.16;
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

      carGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.045;

      // Gentle showroom turntable oscillation around the signature side-front profile
      // so the Honda City silhouette from the reference image is always recognizable
      rootGroup.rotation.y =
        baseYaw + Math.sin(elapsedTime * 0.38) * 0.36 + mouseX;
      rootGroup.rotation.x =
        0.06 - mouseY + Math.sin(elapsedTime * 0.6) * 0.02;

      ring1.rotation.z = elapsedTime * 0.22;
      ring2.rotation.y = -elapsedTime * 0.16;
      floorGrid.rotation.z = elapsedTime * 0.09;

      particles.rotation.y = elapsedTime * 0.055;

      wheels.forEach((wheel) => {
        wheel.rotation.x = elapsedTime * 0.65;
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
      envTex.dispose();
      shadowTex.dispose();
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
