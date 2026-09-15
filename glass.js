/* JML.Studio: every app icon sits inside a low slab of clear glass.

   The glass is Canvas UI's Glass Object
   (https://canvasui.dev/docs/components/glass-object) with Frost at 0: its
   physical material, studio environment and extrusion, applied to a rounded
   box a little larger than each icon. Adapted under the MIT + Commons Clause
   license, Copyright (c) 2026 David Haz; see third-party/canvas-ui-LICENSE.md.

   One WebGL canvas sits behind the page and follows the DOM icons, which stay
   in place for links, focus and screen readers. If WebGL or three.js is not
   available, main.js brings the CSS icons back. */

import * as THREE from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

/* Glass Object's defaults, with Frost (roughness) at 0. Two changes suit a
   white page with an icon inside: the studio turned a quarter so the front
   face mirrors a soft gradient instead of a flat grey wall, and a little
   less of it, so the icon reads through clearly. */
const GLASS = {
  ior: 1.75,
  roughness: 0,
  dispersion: 1.5,
  clearcoat: 0.5,
  highlight: '#066aff',
  environmentIntensity: 0.8,
  environmentRotation: Math.PI / 2,
  floatIntensity: 1,
  rotationIntensity: 1,
  floatSpeed: 2,
};

/* the slab, in fractions of its width (the DOM .app-icon box) */
const SLAB = {
  icon: 0.84, // the app icon inside
  depth: 0.16, // a low slab
  bevel: 0.35, // edge rounding, 0 to 1 as in Glass Object; low keeps it a box
  thickness: 0.6, // how deep the refraction reads the volume
  lift: 0.14, // how far a hovered slab comes forward
};

/* colored light the icon casts on the page behind its slab */
const GLOW = { size: 1.35, drop: 0.08, strength: 0.7 };

const ICON_RADIUS = 0.225; // matches .app-icon's border-radius
const FOV = 30;

/* Glass Object's studio: a grey room with light panels and a colored ring,
   baked into an environment map for the glass to reflect */
const ROOM_BLOCKS = [
  { position: [-10.906, -1, 1.846], rotation: [0, -0.195, 0], scale: [2.328, 7.905, 4.651] },
  { position: [-5.607, -0.754, -0.758], rotation: [0, 0.994, 0], scale: [1.97, 1.534, 3.955] },
  { position: [6.167, -0.16, 7.803], rotation: [0, 0.561, 0], scale: [3.927, 6.285, 3.687] },
  { position: [-2.017, 0.018, 6.124], rotation: [0, 0.333, 0], scale: [2.002, 4.566, 2.064] },
  { position: [2.291, -0.756, -2.621], rotation: [0, -0.286, 0], scale: [1.546, 1.552, 1.496] },
  { position: [-2.193, -0.369, -5.547], rotation: [0, 0.516, 0], scale: [3.875, 3.487, 2.986] },
];

const ROOM_FORMERS = [
  { kind: 'ring', intensity: 15, position: [2, 3, -2], scale: [10, 10, 10], lookAtCenter: true },
  { kind: 'box', intensity: 80, position: [-14, 10, 8], scale: [0.1, 2.5, 2.5] },
  { kind: 'box', intensity: 80, position: [-14, 14, -4], scale: [0.1, 2.5, 2.5], withLight: true },
  { kind: 'box', intensity: 23, position: [14, 12, 0], scale: [0.1, 5, 5], withLight: true },
  { kind: 'box', intensity: 16, position: [0, 9, 14], scale: [5, 5, 0.1], withLight: true },
  { kind: 'box', intensity: 80, position: [7, 8, -14], scale: [2.5, 2.5, 0.1], withLight: true },
  { kind: 'box', intensity: 80, position: [-7, 16, -14], scale: [2.5, 2.5, 0.1], withLight: true },
  { kind: 'box', intensity: 1, position: [0, 20, 0], scale: [0.1, 0.1, 0.1], withLight: true },
  { kind: 'box', intensity: 20, position: [0, 15, 0], scale: [10, 1, 10], withLight: true },
];

function buildRoom() {
  const roomScene = new THREE.Scene();
  const room = new THREE.Group();
  room.position.set(0, -0.5, 0);
  roomScene.add(room);

  for (const [x, z] of [[-15, 15], [15, 15], [15, -15], [-15, -15]]) {
    const spot = new THREE.SpotLight(0xffffff, 2, 0, 0.2, 1, 0);
    spot.position.set(x, 20, z);
    room.add(spot, spot.target);
  }
  const center = new THREE.PointLight(0xffffff, 100, 28, 2);
  center.position.set(0.5, 14, 0.5);
  room.add(center);

  const box = new THREE.BoxGeometry();
  const shell = new THREE.Mesh(
    box,
    new THREE.MeshStandardMaterial({ color: 'gray', side: THREE.BackSide })
  );
  shell.position.set(0, 13.2, 0);
  shell.scale.set(31.5, 28.5, 31.5);
  room.add(shell);

  const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
  for (const def of ROOM_BLOCKS) {
    const mesh = new THREE.Mesh(box, white);
    mesh.position.set(...def.position);
    mesh.rotation.set(...def.rotation);
    mesh.scale.set(...def.scale);
    room.add(mesh);
  }

  for (const def of ROOM_FORMERS) {
    const geometry = def.kind === 'ring' ? new THREE.RingGeometry(0.5, 1, 64) : box;
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false });
    material.color
      .set(def.kind === 'ring' ? GLASS.highlight : '#ffffff')
      .multiplyScalar(def.intensity);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...def.position);
    mesh.scale.set(...def.scale);
    if (def.lookAtCenter) mesh.lookAt(0, 0, 0);
    room.add(mesh);
    if (def.withLight) {
      const light = new THREE.PointLight(0xffffff, 100, 28, 2);
      light.position.set(...def.position);
      room.add(light);
    }
  }
  return roomScene;
}

function disposeScene(root) {
  root.traverse((node) => {
    node.geometry?.dispose();
    node.material?.dispose();
  });
}

/* flat normals on the front and back faces so they read as polished planes */
function flattenCapNormals(geometry) {
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();
  for (const group of geometry.groups) {
    if (group.materialIndex !== 0) continue;
    for (let i = group.start; i < group.start + group.count; i += 3) {
      a.fromBufferAttribute(position, i);
      b.fromBufferAttribute(position, i + 1);
      c.fromBufferAttribute(position, i + 2);
      cb.subVectors(c, b);
      ab.subVectors(a, b);
      cb.cross(ab).normalize();
      for (let j = 0; j < 3; j++) normal.setXYZ(i + j, cb.x, cb.y, cb.z);
    }
  }
  normal.needsUpdate = true;
}

function roundedSquare(size, radius) {
  const h = size / 2;
  const r = Math.min(Math.max(radius, 0), h);
  const shape = new THREE.Shape();
  shape.moveTo(-h + r, -h);
  shape.lineTo(h - r, -h);
  shape.absarc(h - r, -h + r, r, -Math.PI / 2, 0);
  shape.lineTo(h, h - r);
  shape.absarc(h - r, h - r, r, 0, Math.PI / 2);
  shape.lineTo(-h + r, h);
  shape.absarc(-h + r, h - r, r, Math.PI / 2, Math.PI);
  shape.lineTo(-h, -h + r);
  shape.absarc(-h + r, -h + r, r, Math.PI, Math.PI * 1.5);
  return shape;
}

/* Glass Object's extrusion, on a rounded square whose corners run concentric
   with the icon's. The bevel pushes the outline out, so start that much in. */
function slabGeometry(size) {
  const depth = size * SLAB.depth;
  const bevel = SLAB.bevel * depth * 0.5;
  const grow = bevel * 0.9;
  const icon = size * SLAB.icon;
  const radius = icon * ICON_RADIUS + (size - icon) / 2;
  const core = Math.max(depth - bevel * 2, depth * 0.1);
  let geometry = new THREE.ExtrudeGeometry(roundedSquare(size - grow * 2, radius - grow), {
    depth: core,
    bevelEnabled: bevel > 1e-4,
    bevelThickness: bevel,
    bevelSize: grow,
    bevelOffset: 0,
    bevelSegments: 12,
    curveSegments: 24,
  });
  geometry = toCreasedNormals(geometry, Math.PI / 7);
  flattenCapNormals(geometry);
  geometry.translate(0, 0, -core / 2);
  return geometry;
}

function iconGeometry(size) {
  const geometry = new THREE.ShapeGeometry(roundedSquare(size, size * ICON_RADIUS), 24);
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, position.getX(i) / size + 0.5, position.getY(i) / size + 0.5);
  }
  return geometry;
}

/* A soft, saturated blur of the icon on white. Drawn with multiply blending,
   so it tints the page like light through colored glass. Shrinking to 12px
   and scaling back up blurs it without canvas filters, which older Safari
   lacks. */
function glowTexture(img) {
  const tiny = document.createElement('canvas');
  tiny.width = tiny.height = 12;
  const t = tiny.getContext('2d', { willReadFrequently: true });
  t.drawImage(img, 0, 0, 12, 12);
  const pixels = t.getImageData(0, 0, 12, 12);
  const d = pixels.data;
  for (let i = 0; i < d.length; i += 4) {
    const grey = (d[i] + d[i + 1] + d[i + 2]) / 3;
    for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, grey + (d[i + k] - grey) * 1.6));
  }
  t.putImageData(pixels, 0, 0);

  const mid = document.createElement('canvas');
  mid.width = mid.height = 48;
  mid.getContext('2d').drawImage(tiny, 0, 0, 48, 48);

  const blob = document.createElement('canvas');
  blob.width = blob.height = 256;
  const b = blob.getContext('2d');
  b.drawImage(mid, 0, 0, 256, 256);
  b.globalCompositeOperation = 'destination-in';
  const falloff = b.createRadialGradient(128, 128, 0, 128, 128, 128);
  falloff.addColorStop(0, 'rgba(0, 0, 0, 1)');
  falloff.addColorStop(0.4, 'rgba(0, 0, 0, 0.75)');
  falloff.addColorStop(1, 'rgba(0, 0, 0, 0)');
  b.fillStyle = falloff;
  b.fillRect(0, 0, 256, 256);

  const out = document.createElement('canvas');
  out.width = out.height = 256;
  const o = out.getContext('2d');
  o.fillStyle = '#fff';
  o.fillRect(0, 0, 256, 256);
  o.globalAlpha = GLOW.strength;
  o.drawImage(blob, 0, 0);

  const texture = new THREE.CanvasTexture(out);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* The icon, redrawn at the power of two just above its size on screen, so
   the GPU samples the top mip level. Mipmapping the 512px original down to
   ~240px would blend in the 128px level and blur it. */
function textureSide(img, pixels) {
  return Math.min(img.naturalWidth || 512, 2 ** Math.ceil(Math.log2(Math.max(pixels, 16))));
}

function iconTexture(img, side) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = side;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, side, side);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

async function start() {
  const root = document.documentElement;
  const icons = [...document.querySelectorAll('.app-icon')];
  if (!icons.length) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'glass-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0xffffff, 1);
  /* Glass Object uses ACES, which greys and desaturates an icon seen through
     the glass; the neutral curve keeps its colors */
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 10);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = buildRoom();
  const environment = pmrem.fromScene(room, 0.6, 0.1, 1000);
  disposeScene(room);
  pmrem.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = GLASS.environmentIntensity;
  scene.environmentRotation.y = GLASS.environmentRotation;

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    transmission: 1,
    ior: GLASS.ior,
    roughness: GLASS.roughness,
    dispersion: GLASS.dispersion,
    clearcoat: GLASS.clearcoat,
    clearcoatRoughness: 0.06,
    specularIntensity: 1,
  });
  /* three.js floors roughness at 0.0525, so even unfrosted glass reads what
     is behind it from a blurred mip level through a bicubic B-spline filter,
     which smears the icon by several pixels. With Frost at 0 there is
     nothing to blur: read the full-resolution level directly. */
  if (GLASS.roughness === 0) {
    glass.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <transmission_pars_fragment>',
        THREE.ShaderChunk.transmission_pars_fragment.replace(
          'return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );',
          'return textureLod( transmissionSamplerMap, fragCoord.xy, 0.0 );'
        )
      );
    };
    glass.customProgramCacheKey = () => 'glass-clear';
  }

  const images = icons.map((icon) => icon.querySelector('img'));
  await Promise.all(images.map((img) => (img.complete ? Promise.resolve() : img.decode())));

  const items = icons.map((icon, i) => {
    const img = images[i];
    const body = new THREE.Group();
    const slab = new THREE.Mesh(undefined, glass);
    const art = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({ toneMapped: false }));
    /* opaque on purpose, so the transmission pass sees it and the glass
       refracts the glow too; multiply makes its white margins vanish */
    const glow = new THREE.Mesh(
      undefined,
      new THREE.MeshBasicMaterial({
        map: glowTexture(img),
        blending: THREE.MultiplyBlending,
        premultipliedAlpha: true,
        depthWrite: false,
        toneMapped: false,
      })
    );
    body.add(slab, art);
    const group = new THREE.Group();
    group.add(glow, body);
    scene.add(group);
    return {
      icon,
      img,
      link: icon.closest('a'),
      group,
      body,
      slab,
      art,
      glow,
      phase: i * 2.4,
      lift: 0,
      press: 0,
      rx: 0,
      ry: 0,
    };
  });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let size = 0;
  let slabGeo = null;
  let iconGeo = null;
  let glowGeo = null;
  let elapsed = 0;
  let last = 0;
  let shown = false;
  let lastLayout = '';

  function resize(w, h) {
    width = w;
    height = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = h / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.near = camera.position.z / 10;
    camera.far = camera.position.z * 3;
    camera.updateProjectionMatrix();
  }

  function rebuild(next) {
    size = next;
    slabGeo?.dispose();
    iconGeo?.dispose();
    glowGeo?.dispose();
    slabGeo = slabGeometry(size);
    iconGeo = iconGeometry(size * SLAB.icon);
    glowGeo = new THREE.PlaneGeometry(size * GLOW.size, size * GLOW.size);
    glass.thickness = size * SLAB.thickness;
    const pixels = size * SLAB.icon * renderer.getPixelRatio();
    for (const item of items) {
      const side = textureSide(item.img, pixels);
      const map = item.art.material.map;
      if (!map || map.image.width !== side) {
        map?.dispose();
        item.art.material.map = iconTexture(item.img, side);
        item.art.material.needsUpdate = true;
      }
      item.slab.geometry = slabGeo;
      item.art.geometry = iconGeo;
      item.glow.geometry = glowGeo;
      item.glow.position.set(0, -size * GLOW.drop, -size * SLAB.depth);
    }
  }

  function ease(value, target, dt, rate) {
    return value + (target - value) * (1 - Math.exp(-dt * rate));
  }

  function frame(time) {
    const dt = last ? Math.min((time - last) / 1000, 0.1) : 0;
    last = time;
    const still = reduce.matches;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w !== width || h !== height) resize(w, h);

    /* follow the DOM: position from the box on screen, size from layout */
    let layout = '';
    for (const item of items) {
      const box = item.icon.getBoundingClientRect();
      const x = box.left + box.width / 2 - width / 2;
      const y = height / 2 - (box.top + box.height / 2);
      item.group.position.set(x, y, 0);
      layout += x.toFixed(1) + ',' + y.toFixed(1) + ';';
    }
    const next = items[0].icon.offsetWidth;
    if (next && next !== size) rebuild(next);
    layout += size;

    let moving = !still;
    if (!still) elapsed += dt * GLASS.floatSpeed;
    for (const item of items) {
      const hovered = !still && item.link.matches(':hover');
      const pressed = !still && item.link.matches(':active');
      /* main.js writes the pointer tilt as CSS rotations on the icon */
      const tx = -(parseFloat(item.icon.style.getPropertyValue('--rx')) || 0);
      const ty = parseFloat(item.icon.style.getPropertyValue('--ry')) || 0;
      item.lift = ease(item.lift, hovered ? 1 : 0, dt, 8);
      item.press = ease(item.press, pressed ? 1 : 0, dt, 18);
      item.rx = ease(item.rx, THREE.MathUtils.degToRad(tx), dt, 8);
      item.ry = ease(item.ry, THREE.MathUtils.degToRad(ty), dt, 8);

      const e = elapsed + item.phase;
      const rock = still ? 0 : GLASS.rotationIntensity;
      const bob = still ? 0 : GLASS.floatIntensity;
      const body = item.body;
      /* Glass Object's float and rocking, scaled from its 3-unit model */
      body.rotation.set(
        (Math.cos(e / 4) / 8) * rock + item.rx,
        (Math.sin(e / 4) / 8) * rock + item.ry,
        (Math.sin(e / 4) / 20) * rock
      );
      body.position.set(0, (Math.sin(e / 1.5) / 10) * bob * (size / 3), item.lift * size * SLAB.lift);
      body.scale.setScalar(1 - item.press * 0.04);
      if (Math.abs(item.lift - (hovered ? 1 : 0)) > 0.001 || Math.abs(item.press - (pressed ? 1 : 0)) > 0.001) {
        moving = true;
      }
    }

    /* with reduced motion, draw only when something actually changed */
    if (!moving && shown && layout === lastLayout) return;
    lastLayout = layout;
    renderer.render(scene, camera);

    if (!shown) {
      shown = true;
      root.classList.remove('glass-pending');
      root.classList.add('glass');
    }
  }

  canvas.addEventListener('webglcontextlost', () => {
    renderer.setAnimationLoop(null);
    root.classList.remove('glass', 'glass-pending');
  });

  renderer.setAnimationLoop(frame);
}

start().catch(() => {
  document.documentElement.classList.remove('glass', 'glass-pending');
  document.querySelector('.glass-canvas')?.remove();
});
