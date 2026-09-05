import * as THREE from 'three';

/**
 * Creates a photorealistic, anatomically accurate 3D botanical leaf geometry:
 * - Obovate-elliptical blade with drip-tip (acuminate apex)
 * - Central midrib trough & V-gutter lamina angle
 * - Longitudinal graceful botanical S-curve arch
 * - Physical 3D embossed secondary vein ridges radiating at botanical angles
 * - Delicate undulating ruffled margin waves
 */
export function createBotanicalLeafGeometry(
  length = 3.2,
  width = 1.55,
  segmentsX = 52,
  segmentsY = 72
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= segmentsY; j++) {
    const v = j / segmentsY; // 0 (petiole base) to 1 (acute drip tip)

    // Realistic botanical blade outline envelope:
    // Starts narrow at petiole base, bulges gracefully peaking at ~35-40% length,
    // then tapers into an acute, elegant drip-tip.
    let envelope = 0;
    if (v < 0.05) {
      envelope = (v / 0.05) * 0.18;
    } else {
      const vAdjusted = (v - 0.05) / 0.95;
      envelope = Math.pow(Math.sin(Math.PI * Math.pow(vAdjusted, 0.65)), 1.1) * (1.0 - 0.28 * vAdjusted);
    }

    for (let i = 0; i <= segmentsX; i++) {
      const u = i / segmentsX; // 0 (left margin) to 0.5 (midrib) to 1 (right margin)
      const uCentered = (u - 0.5) * 2; // -1 to +1
      const absU = Math.abs(uCentered);

      // Width calculation
      const x = uCentered * (width * 0.5) * envelope;
      // Length positioning (centered along Y)
      const y = (v - 0.5) * length;

      // 1. Longitudinal biological arch:
      // Leaf arches gracefully backwards from stem, reaches maximum depth, then curls slightly forward at the tip
      const archZ = -Math.sin(v * Math.PI * 0.9) * 0.38 + Math.pow(v, 3) * 0.15;

      // 2. Transverse V-gutter & lamina cup:
      // The leaf is folded along the midrib like a real leaf. The two halves angle upwards,
      // then curve gently downwards towards the outer edges.
      const vGutterZ = Math.pow(absU, 0.8) * 0.18 - Math.pow(absU, 2.2) * 0.08;

      // 3. Margin ruffled waves (high frequency micro-waves along the blade edges):
      const edgeFactor = Math.pow(absU, 2.0); // only affects outer margin
      const marginRuffleZ = Math.sin(v * 36.0 + (uCentered > 0 ? 1.0 : -1.0)) * 0.028 * edgeFactor * envelope;

      // 4. Physical 3D Secondary Vein embossing:
      // 14 pairs of lateral veins branching out from midrib at ~42 degree angle
      const veinAnglePhase = v * 28.0 - absU * 6.5;
      const veinRidge = Math.pow(Math.max(0, Math.cos(veinAnglePhase)), 4.0) * 0.016 * envelope * (1.0 - absU * 0.3);

      // Total Z coordinate
      const z = archZ + vGutterZ + marginRuffleZ + veinRidge;

      vertices.push(x, y, z);
      uvs.push(u, v);
    }
  }

  // Generate triangle indices
  for (let j = 0; j < segmentsY; j++) {
    for (let i = 0; i < segmentsX; i++) {
      const row1 = j * (segmentsX + 1);
      const row2 = (j + 1) * (segmentsX + 1);

      const a = row1 + i;
      const b = row2 + i;
      const c = row2 + i + 1;
      const d = row1 + i + 1;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates an anatomical 3D Petiole (stem stalk) that naturally transitions into the midrib
 */
export function createStemGeometry(length = 1.2, radiusBase = 0.06, radiusTip = 0.025): THREE.BufferGeometry {
  const geom = new THREE.CylinderGeometry(radiusTip, radiusBase, length, 16, 24);
  // Curve the stem gently backwards
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const progress = (y + length * 0.5) / length;
    const bend = -Math.sin(progress * Math.PI * 0.5) * 0.15;
    pos.setZ(i, pos.getZ(i) + bend);
  }
  geom.computeVertexNormals();
  return geom;
}

/**
 * Generates 10 pairs of physical 3D tubular secondary veins that arch out from the midrib
 */
export function createSecondaryVeinGeometries(
  length = 3.4,
  width = 1.65
): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];
  const numVeinPairs = 10;

  for (let k = 0; k < numVeinPairs; k++) {
    const v = 0.12 + (k / (numVeinPairs - 1)) * 0.72; // height along leaf
    const y0 = (v - 0.5) * length;
    const envelope = Math.pow(Math.sin(Math.PI * Math.pow(v, 0.65)), 1.1) * (1.0 - 0.28 * v);
    const halfWidth = (width * 0.5) * envelope;

    const archZ = -Math.sin(v * Math.PI * 0.9) * 0.38 + Math.pow(v, 3) * 0.15;
    const tubeRadius = Math.max(0.008, 0.022 * (1.0 - v * 0.6));

    // Right vein curve
    const rightPoints = [
      new THREE.Vector3(0, y0, archZ + 0.025),
      new THREE.Vector3(halfWidth * 0.45, y0 + 0.12, archZ + 0.06),
      new THREE.Vector3(halfWidth * 0.88, y0 + 0.28, archZ + 0.04),
    ];
    const rightCurve = new THREE.CatmullRomCurve3(rightPoints);
    geometries.push(new THREE.TubeGeometry(rightCurve, 14, tubeRadius, 6, false));

    // Left vein curve
    const leftPoints = [
      new THREE.Vector3(0, y0, archZ + 0.025),
      new THREE.Vector3(-halfWidth * 0.45, y0 + 0.12, archZ + 0.06),
      new THREE.Vector3(-halfWidth * 0.88, y0 + 0.28, archZ + 0.04),
    ];
    const leftCurve = new THREE.CatmullRomCurve3(leftPoints);
    geometries.push(new THREE.TubeGeometry(leftCurve, 14, tubeRadius, 6, false));
  }

  return geometries;
}


/**
 * Procedural Botanical Texture Suite (2048x2048)
 * Generates photorealistic high-fidelity:
 * 1. Albedo / Diffuse Color Map (cellular chlorophyll, luminous veins, marginal gradient)
 * 2. Bump / Height Map (raised midrib and secondary pinnate veins for directional specular highlights)
 * 3. Roughness Map (waxy glossy veins, satin velvety lamina)
 */
export function createBotanicalLeafTextures(): {
  colorMap: THREE.CanvasTexture | null;
  bumpMap: THREE.CanvasTexture | null;
  roughnessMap: THREE.CanvasTexture | null;
} {
  if (typeof document === 'undefined') {
    return { colorMap: null, bumpMap: null, roughnessMap: null };
  }

  const width = 2048;
  const height = 2048;

  // --- 1. COLOR MAP CANVAS ---
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const cCtx = colorCanvas.getContext('2d');

  // --- 2. BUMP MAP CANVAS ---
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d');

  // --- 3. ROUGHNESS MAP CANVAS ---
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d');

  if (!cCtx || !bCtx || !rCtx) {
    return { colorMap: null, bumpMap: null, roughnessMap: null };
  }

  // --- BASE COLOR GRADIENT (Deep chlorophyll into vibrant emerald) ---
  const baseGrad = cCtx.createLinearGradient(0, height, 0, 0);
  baseGrad.addColorStop(0, '#062614');   // Deep forest green near stem
  baseGrad.addColorStop(0.3, '#0b4021'); // Rich lush green
  baseGrad.addColorStop(0.7, '#105c30'); // Vibrant sunlit green
  baseGrad.addColorStop(1, '#15753d');   // Fresh apex green
  cCtx.fillStyle = baseGrad;
  cCtx.fillRect(0, 0, width, height);

  // Subtle radial variegation (lighter in interveinal zones, darker towards margin)
  const radialVar = cCtx.createRadialGradient(width * 0.5, height * 0.45, 100, width * 0.5, height * 0.45, width * 0.5);
  radialVar.addColorStop(0, 'rgba(46, 204, 113, 0.18)');
  radialVar.addColorStop(0.6, 'rgba(39, 174, 96, 0.08)');
  radialVar.addColorStop(1, 'rgba(5, 40, 20, 0.35)');
  cCtx.fillStyle = radialVar;
  cCtx.fillRect(0, 0, width, height);

  // Initialize Bump map (neutral gray baseline)
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, width, height);

  // Initialize Roughness map (satin base ~0.4)
  rCtx.fillStyle = '#666666';
  rCtx.fillRect(0, 0, width, height);

  // --- FINE TERTIARY VEINLET RETICULATION (Cellular micro-network) ---
  cCtx.strokeStyle = 'rgba(74, 222, 128, 0.12)';
  cCtx.lineWidth = 1.5;
  for (let step = 0; step < 300; step++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    const rLen = 20 + Math.random() * 40;
    const rAng = Math.random() * Math.PI * 2;
    cCtx.beginPath();
    cCtx.moveTo(rx, ry);
    cCtx.lineTo(rx + Math.cos(rAng) * rLen, ry + Math.sin(rAng) * rLen);
    cCtx.stroke();
  }

  // --- SECONDARY PINNATE LATERAL VEINS (16 alternating pairs) ---
  const numVeins = 16;
  for (let k = 0; k < numVeins; k++) {
    const yRatio = k / (numVeins - 1);
    const yPos = height * 0.88 - yRatio * (height * 0.76);
    const span = Math.sin(Math.PI * Math.pow(yRatio, 0.7)) * (width * 0.42);
    const archY = yPos - span * 0.32; // graceful upward curve

    // Draw on Color Map (luminous mint halo)
    cCtx.shadowColor = 'rgba(110, 231, 183, 0.45)';
    cCtx.shadowBlur = 10;
    cCtx.strokeStyle = '#5eead4';
    cCtx.lineWidth = 5.0 * (1.0 - yRatio * 0.4);

    // Right lateral vein
    cCtx.beginPath();
    cCtx.moveTo(width * 0.5, yPos);
    cCtx.quadraticCurveTo(width * 0.5 + span * 0.45, yPos - span * 0.15, width * 0.5 + span, archY);
    cCtx.stroke();

    // Left lateral vein
    cCtx.beginPath();
    cCtx.moveTo(width * 0.5, yPos);
    cCtx.quadraticCurveTo(width * 0.5 - span * 0.45, yPos - span * 0.15, width * 0.5 - span, archY);
    cCtx.stroke();

    // Secondary sub-branching veinlets
    cCtx.lineWidth = 2.0;
    cCtx.strokeStyle = 'rgba(110, 231, 183, 0.25)';
    for (let sub = 1; sub <= 3; sub++) {
      const subX = span * (sub / 4);
      const subY = yPos - subX * 0.25;
      cCtx.beginPath();
      cCtx.moveTo(width * 0.5 + subX, subY);
      cCtx.lineTo(width * 0.5 + subX + 25, subY - 30);
      cCtx.moveTo(width * 0.5 - subX, subY);
      cCtx.lineTo(width * 0.5 - subX - 25, subY - 30);
      cCtx.stroke();
    }

    // Draw on Bump Map (raised white ridges)
    bCtx.shadowColor = '#ffffff';
    bCtx.shadowBlur = 8;
    bCtx.strokeStyle = '#d4d4d4';
    bCtx.lineWidth = 6.0 * (1.0 - yRatio * 0.35);

    bCtx.beginPath();
    bCtx.moveTo(width * 0.5, yPos);
    bCtx.quadraticCurveTo(width * 0.5 + span * 0.45, yPos - span * 0.15, width * 0.5 + span, archY);
    bCtx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(width * 0.5, yPos);
    bCtx.quadraticCurveTo(width * 0.5 - span * 0.45, yPos - span * 0.15, width * 0.5 - span, archY);
    bCtx.stroke();

    // Draw on Roughness Map (glossier vein ridges = darker value ~0.2)
    rCtx.strokeStyle = '#333333';
    rCtx.lineWidth = 8.0;
    rCtx.beginPath();
    rCtx.moveTo(width * 0.5, yPos);
    rCtx.quadraticCurveTo(width * 0.5 + span * 0.45, yPos - span * 0.15, width * 0.5 + span, archY);
    rCtx.stroke();
    rCtx.beginPath();
    rCtx.moveTo(width * 0.5, yPos);
    rCtx.quadraticCurveTo(width * 0.5 - span * 0.45, yPos - span * 0.15, width * 0.5 - span, archY);
    rCtx.stroke();
  }

  // --- PRIMARY CENTRAL MIDRIB (Thick, luminous spine) ---
  // Color Map Spine
  cCtx.shadowColor = 'rgba(167, 243, 208, 0.6)';
  cCtx.shadowBlur = 14;
  cCtx.strokeStyle = '#a7f3d0';
  cCtx.lineWidth = 20;
  cCtx.lineCap = 'round';
  cCtx.beginPath();
  cCtx.moveTo(width * 0.5, height * 0.96);
  cCtx.quadraticCurveTo(width * 0.505, height * 0.5, width * 0.5, height * 0.04);
  cCtx.stroke();

  // Core bright filament
  cCtx.strokeStyle = '#ffffff';
  cCtx.lineWidth = 6;
  cCtx.beginPath();
  cCtx.moveTo(width * 0.5, height * 0.96);
  cCtx.quadraticCurveTo(width * 0.505, height * 0.5, width * 0.5, height * 0.04);
  cCtx.stroke();

  // Bump Map Spine (strong high elevation)
  bCtx.shadowColor = '#ffffff';
  bCtx.shadowBlur = 16;
  bCtx.strokeStyle = '#ffffff';
  bCtx.lineWidth = 26;
  bCtx.lineCap = 'round';
  bCtx.beginPath();
  bCtx.moveTo(width * 0.5, height * 0.96);
  bCtx.quadraticCurveTo(width * 0.505, height * 0.5, width * 0.5, height * 0.04);
  bCtx.stroke();

  // Roughness Map Spine (high gloss cuticle)
  rCtx.strokeStyle = '#1a1a1a';
  rCtx.lineWidth = 30;
  rCtx.lineCap = 'round';
  rCtx.beginPath();
  rCtx.moveTo(width * 0.5, height * 0.96);
  rCtx.quadraticCurveTo(width * 0.505, height * 0.5, width * 0.5, height * 0.04);
  rCtx.stroke();

  const colorTexture = new THREE.CanvasTexture(colorCanvas);
  colorTexture.wrapS = THREE.ClampToEdgeWrapping;
  colorTexture.wrapT = THREE.ClampToEdgeWrapping;
  colorTexture.colorSpace = THREE.SRGBColorSpace;

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.wrapS = THREE.ClampToEdgeWrapping;
  bumpTexture.wrapT = THREE.ClampToEdgeWrapping;

  const roughTexture = new THREE.CanvasTexture(roughCanvas);
  roughTexture.wrapS = THREE.ClampToEdgeWrapping;
  roughTexture.wrapT = THREE.ClampToEdgeWrapping;

  return {
    colorMap: colorTexture,
    bumpMap: bumpTexture,
    roughnessMap: roughTexture,
  };
}

/**
 * Creates a faceted 3D emerald gemstone token geometry
 */
export function createEmeraldTokenGeometry(radius = 1.0, height = 0.5): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radius * 0.8, radius, height, 8, 1);
}

// Backward-compatible alias for existing components
export const createLeafGeometry = createBotanicalLeafGeometry;

