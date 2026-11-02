import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import typeface from 'three/examples/fonts/gentilis_regular.typeface.json';

const engravingFont = new FontLoader().parse(typeface);

export function initRings(config) {
  const canvas = document.querySelector('#rings-canvas');
  const fallback = document.querySelector('#ring-fallback');
  const stage = document.querySelector('#ring-stage');
  const closing = document.querySelector('#closing');
  if (!canvas || !stage || !closing) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (error) {
    if (fallback) fallback.hidden = false;
    console.warn('WebGL is unavailable; showing the ring illustration.', error);
    return;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 8.2);
  scene.add(new THREE.HemisphereLight(0xfff8e8, 0x806333, 2.1));
  const key = new THREE.DirectionalLight(0xfff0bd, 3.1); key.position.set(-3, 5, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffd96b, 2.4); fill.position.set(4, 1, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 2.0); rim.position.set(1, -3, 4); scene.add(rim);
  const environment = new THREE.PMREMGenerator(renderer);
  const environmentTarget = environment.fromScene(new RoomEnvironment(), 0.035);
  scene.environment = environmentTarget.texture;
  environment.dispose();

  const models = [];
  let loaded = false;
  let stageVisible = false;
  let journeyActive = false;
  let journeyLayerActive = false;
  let progress = 0;
  let animatedProgress = 0;
  let frame = 0;
  let lastFrame = 0;
  let stageTop = 0;
  let closingTop = 0;
  let journeyEnd = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let celebrated = false;
  try { celebrated = sessionStorage.getItem('ring-interlock-celebrated') === '1'; } catch {}
  const ringSpecs = [
    { name: 'Bijith', side: -1, startEuler: new THREE.Euler(-0.18, 0.42, -0.22), endEuler: new THREE.Euler(0.38, 0.12, -0.06) },
    { name: 'Angel', side: 1, startEuler: new THREE.Euler(0.2, -0.4, 0.22), endEuler: new THREE.Euler(-0.38, -0.12, 0.06) }
  ];

  new GLTFLoader().load(config.assets.ringModel, gltf => {
    const source = gltf.scene;
    ringSpecs.forEach((spec, index) => {
      const model = source.clone(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 1.35 / Math.max(size.x, size.y, size.z);
      const frontZ = bounds.max.z + 0.05;
      model.scale.setScalar(scale);
      bounds.setFromObject(model);
      model.position.sub(bounds.getCenter(new THREE.Vector3()));
      model.traverse(node => {
        if (!node.isMesh) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        const polished = materials.map(original => {
          const material = original.clone();
          if ('metalness' in material) material.metalness = Math.max(material.metalness ?? 0, 0.68);
          if ('roughness' in material) material.roughness = Math.max(0.16, Math.min(material.roughness ?? 0.22, 0.28));
          if ('clearcoat' in material) material.clearcoat = Math.max(material.clearcoat ?? 0, 0.45);
          if ('envMapIntensity' in material) material.envMapIntensity = 1.2;
          material.needsUpdate = true;
          return material;
        });
        node.material = Array.isArray(node.material) ? polished : polished[0];
        node.castShadow = true;
        node.receiveShadow = true;
      });
      addCurvedEngraving(model, spec.name, frontZ);

      const rig = new THREE.Group();
      rig.add(model);
      rig.userData.side = spec.side;
      rig.userData.startQuaternion = new THREE.Quaternion().setFromEuler(spec.startEuler);
      rig.userData.endQuaternion = new THREE.Quaternion().setFromEuler(spec.endEuler);
      rig.userData.phase = spec.side * 0.8;
      scene.add(rig);
      models[index] = rig;
    });
    loaded = true;
    if (fallback) fallback.hidden = true;
    document.body.classList.add('has-webgl-rings');
    updateScrollState();
    renderOnce();
  }, undefined, error => {
    console.warn(`Unable to load ring model: ${config.assets.ringModel}`, error);
    if (fallback) fallback.hidden = false;
  });

  function addCurvedEngraving(model, name, frontZ) {
    const size = 1.15;
    const gap = 0.08;
    const letters = [...name].map(character => {
      const geometry = new TextGeometry(character, {
        font: engravingFont, size, depth: 0.035,
        curveSegments: 6, bevelEnabled: true,
        bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2
      });
      geometry.computeBoundingBox();
      const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      const height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      geometry.translate(-width / 2, -height / 2, 0);
      return { geometry, width };
    });
    const totalWidth = letters.reduce((sum, letter) => sum + letter.width, 0) + gap * (letters.length - 1);
    let distance = -totalWidth / 2;
    const radius = 10.53;
    const engraving = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0x72500e, metalness: 0.28, roughness: 0.34, emissive: 0x120900, emissiveIntensity: 0.1 });
    for (const letter of letters) {
      const center = distance + letter.width / 2;
      const angle = Math.PI / 2 - center / radius;
      const mesh = new THREE.Mesh(letter.geometry, material);
      mesh.position.set(radius * Math.cos(angle), radius * Math.sin(angle), frontZ);
      mesh.rotation.z = angle - Math.PI / 2;
      mesh.castShadow = true;
      engraving.add(mesh);
      distance += letter.width + gap;
    }
    model.add(engraving);
  }

  function resize() {
    const width = Math.max(1, canvas.clientWidth || stage.clientWidth || window.innerWidth);
    const height = Math.max(1, canvas.clientHeight || stage.clientHeight || window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.1 : 1.35));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderOnce();
  }
  function recalculateAnchors() {
    const scroll = window.scrollY;
    stageTop = stage.getBoundingClientRect().top + scroll;
    closingTop = closing.getBoundingClientRect().top + scroll;
    const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    journeyEnd = Math.min(closingTop + closing.offsetHeight * 0.55, maximumScroll);
  }
  function setJourneyLayer(active) {
    document.body.classList.toggle('ring-journey-active', active);
    const parent = active ? document.body : stage;
    if (canvas.parentElement !== parent) parent.appendChild(canvas);
  }
  function updateScrollState() {
    const wasActive = journeyActive;
    const y = window.scrollY;
    const start = stageTop - window.innerHeight * 0.18;
    const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    journeyEnd = Math.min(maximumScroll, Math.max(start + window.innerHeight * 0.8, journeyEnd));
    progress = THREE.MathUtils.clamp((y - start) / Math.max(1, journeyEnd - start), 0, 1);
    journeyActive = y >= start && y <= journeyEnd + 2;
    const layerActive = journeyActive && loaded;
    const layerChanged = layerActive !== journeyLayerActive;
    journeyLayerActive = layerActive;
    setJourneyLayer(layerActive);
    if (wasActive !== journeyActive || layerChanged) resize();
    if (journeyActive || stageVisible) startFrames();
    else stopFrames();
  }
  function resizeScene() { recalculateAnchors(); updateScrollState(); resize(); }
  if ('ResizeObserver' in window) new ResizeObserver(resizeScene).observe(stage);
  window.addEventListener('resize', resizeScene, { passive: true });
  window.addEventListener('scroll', updateScrollState, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      stageVisible = entry.isIntersecting;
      if (journeyActive || stageVisible) startFrames();
      else stopFrames();
    }, { threshold: 0.01 }).observe(stage);
  } else stageVisible = true;

  function startFrames() {
    if (frame) return;
    frame = requestAnimationFrame(draw);
  }
  function stopFrames() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function renderOnce() {
    if (renderer && !frame) renderer.render(scene, camera);
  }
  function celebrateInterlock() {
    if (celebrated) return;
    celebrated = true;
    try { sessionStorage.setItem('ring-interlock-celebrated', '1'); } catch {}
    document.body.classList.add('ring-lock-sparkle');
    window.setTimeout(() => document.body.classList.remove('ring-lock-sparkle'), 700);
    if (reducedMotion) return;
    burstConfetti();
  }
  function burstConfetti() {
    const confetti = document.createElement('canvas');
    confetti.className = 'ring-confetti';
    confetti.setAttribute('aria-hidden', 'true');
    document.body.appendChild(confetti);
    const ctx = confetti.getContext('2d');
    if (!ctx) { confetti.remove(); return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 1.4);
    const width = window.innerWidth, height = window.innerHeight;
    confetti.width = Math.round(width * dpr);
    confetti.height = Math.round(height * dpr);
    ctx.scale(dpr, dpr);
    const colors = ['#D4AF37', '#C5A059', '#F4E3AD', '#FAF7F2', '#E8C96A'];
    const count = width < 600 ? 48 : 92;
    const pieces = Array.from({ length: count }, (_, i) => ({
      x: width / 2 + (Math.random() - 0.5) * 24,
      y: height * 0.32 + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 9,
      vy: -2.8 - Math.random() * 7,
      gravity: 0.1 + Math.random() * 0.1,
      spin: (Math.random() - 0.5) * 0.22,
      angle: Math.random() * Math.PI,
      size: 3 + Math.random() * 5,
      petal: i % 4 === 0,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    const started = performance.now();
    function animate(now) {
      const elapsed = now - started;
      ctx.clearRect(0, 0, width, height);
      const opacity = Math.max(0, 1 - elapsed / 2400);
      pieces.forEach(piece => {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += piece.gravity;
        piece.vx *= 0.994;
        piece.angle += piece.spin;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.angle);
        ctx.fillStyle = piece.color;
        if (piece.petal) {
          ctx.beginPath();
          ctx.ellipse(0, 0, piece.size * 0.52, piece.size * 1.3, 0, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * 0.66);
        ctx.restore();
      });
      if (elapsed < 2400) requestAnimationFrame(animate);
      else confetti.remove();
    }
    requestAnimationFrame(animate);
  }
  function draw(time = 0) {
    frame = 0;
    if (!journeyActive && !stageVisible) return;
    if (time - lastFrame >= 30 || lastFrame === 0) {
      lastFrame = time;
      if (reducedMotion || progress >= 0.999) animatedProgress = progress;
      else animatedProgress += (progress - animatedProgress) * 0.095;
      if (Math.abs(progress - animatedProgress) < 0.0015) animatedProgress = progress;
      if (animatedProgress >= 0.999 && progress >= 0.999) celebrateInterlock();
      if (loaded) {
        const aspect = Math.max(0.4, camera.aspect);
        const viewHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const viewWidth = viewHeight * aspect;
        const smooth = animatedProgress * animatedProgress * (3 - 2 * animatedProgress);
        models.forEach(rig => {
          const side = rig.userData.side;
          const mobile = aspect < 0.82;
          const from = new THREE.Vector3(side * viewWidth * (mobile ? 0.3 : 0.36), viewHeight * 0.34, 0);
          const to = new THREE.Vector3(side * (mobile ? 0.32 : 0.34), viewHeight * 0.18, side * 0.12);
          const float = reducedMotion ? 0 : Math.sin(time * 0.0018 + rig.userData.phase) * 0.045 * Math.sin(Math.PI * smooth);
          rig.position.copy(from).lerp(to, smooth);
          rig.position.y += float;
          rig.scale.setScalar(THREE.MathUtils.lerp(mobile ? 0.58 : 0.62, 0.92, smooth));
          const orientation = rig.userData.startQuaternion.clone().slerp(rig.userData.endQuaternion, smooth);
          if (!reducedMotion) {
            const envelope = Math.sin(Math.PI * smooth);
            orientation.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(
              Math.sin(smooth * Math.PI * 2 + rig.userData.phase) * 0.18 * envelope,
              Math.cos(smooth * Math.PI * 2 + rig.userData.phase) * 0.16 * envelope,
              Math.sin(smooth * Math.PI + rig.userData.phase) * 0.12 * envelope
            )));
          }
          rig.quaternion.copy(orientation);
        });
      }
      renderer.render(scene, camera);
    }
    if (!reducedMotion && (journeyActive || Math.abs(progress - animatedProgress) > 0.0015)) frame = requestAnimationFrame(draw);
  }

  recalculateAnchors();
  updateScrollState();
  resize();
}



