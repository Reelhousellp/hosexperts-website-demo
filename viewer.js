import * as THREE from './three.module.min.js';

const mount = document.getElementById('productCanvas');
if (mount) {
  const label = document.getElementById('labModeLabel');
  const family = document.getElementById('labFamily');
  const title = document.getElementById('labTitle');
  const description = document.getElementById('labDescription');
  const question = document.getElementById('labQuestion');
  const explore = document.getElementById('labExplore');
  const explodeButton = document.getElementById('explodeView');
  const spinButton = document.getElementById('toggleSpin');
  const fallback = document.getElementById('viewerFallback');
  const modes = {
    hose: {
      label: '01 — INDUSTRIAL HOSE', family: '01 / INDUSTRIAL HOSES', title: 'Follow the flow.',
      description: 'Turn the hose to see its flexible path and connection ends from every angle.',
      question: 'What medium, pressure and temperature will the hose need to handle?',
      href: 'solutions.html?category=hoses#finder', link: 'Explore hose range'
    },
    assembly: {
      label: '02 — HOSE ASSEMBLY', family: '02 / HOSE ASSEMBLIES', title: 'Inspect the whole assembly.',
      description: 'Rotate the assembly and separate its illustrative components to understand the connection points.',
      question: 'Which length, diameter and end connections does the application call for?',
      href: 'solutions.html?category=assemblies#finder', link: 'Explore assemblies'
    },
    coupling: {
      label: '03 — COUPLING', family: '03 / CLAMPS & COUPLINGS', title: 'See the connection.',
      description: 'Turn the coupling and examine the form from the mating end through to the collar.',
      question: 'What mating connection, material and size are required?',
      href: 'solutions.html?category=components#finder', link: 'Explore components'
    }
  };

  let renderer, scene, camera, product, animationId, active = true;
  let mode = 'hose', exploded = false, autoRotate = false, dragging = false;
  let pointerX = 0, pointerY = 0, zoom = 7.1, targetZoom = 7.1;
  const parts = { left: null, right: null };
  const dark = new THREE.MeshStandardMaterial({ color: 0x141d1c, roughness: .7, metalness: .08 });
  const rib = new THREE.MeshStandardMaterial({ color: 0x2c3936, roughness: .65, metalness: .13 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xabb8b3, roughness: .29, metalness: .86 });
  const metalDark = new THREE.MeshStandardMaterial({ color: 0x53635e, roughness: .32, metalness: .78 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xe86b40, roughness: .4, metalness: .42 });
  const inner = new THREE.MeshStandardMaterial({ color: 0x111918, roughness: .85, metalness: .1 });

  function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(x, y, z);
    parent.add(item);
    return item;
  }
  function cylinder(parent, x, length, radius, material) {
    const item = mesh(new THREE.CylinderGeometry(radius, radius, length, 48), material, parent, x);
    item.rotation.z = Math.PI / 2;
    return item;
  }
  function ring(parent, x, radius, tube, material) {
    const item = mesh(new THREE.TorusGeometry(radius, tube, 10, 48), material, parent, x);
    item.rotation.y = Math.PI / 2;
    return item;
  }
  function coupling(parent, side = 1) {
    const assembly = new THREE.Group();
    parent.add(assembly);
    cylinder(assembly, 0, .42, .43, metal);
    cylinder(assembly, side * .3, .23, .51, metalDark);
    cylinder(assembly, side * .53, .32, .48, metal);
    cylinder(assembly, side * .76, .18, .54, metalDark);
    cylinder(assembly, side * .88, .11, .5, metal);
    for (const x of [-.15, -.04, .08, .19]) ring(assembly, x, .435, .018, metalDark);
    ring(assembly, side * .91, .39, .075, metal);
    const hole = cylinder(assembly, side * .944, .008, .31, inner);
    hole.material = inner;
    return assembly;
  }
  function makeHose() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.2, -.6, -.12),
      new THREE.Vector3(-1.25, -.12, .1),
      new THREE.Vector3(-.1, .3, .26),
      new THREE.Vector3(1.05, .2, -.08),
      new THREE.Vector3(2.18, -.37, -.12)
    ]);
    mesh(new THREE.TubeGeometry(curve, 90, .34, 18, false), dark, product);
    const axis = new THREE.Vector3(0, 0, 1);
    for (let i = 2; i < 67; i++) {
      const t = i / 69;
      const item = mesh(new THREE.TorusGeometry(.345, .036, 7, 24), rib, product);
      item.position.copy(curve.getPointAt(t));
      item.quaternion.setFromUnitVectors(axis, curve.getTangentAt(t).normalize());
    }
    const end = coupling(product, 1);
    end.position.copy(curve.getPointAt(1));
    end.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), curve.getTangentAt(1).normalize());
    const start = coupling(product, -1);
    start.position.copy(curve.getPointAt(0));
    start.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), curve.getTangentAt(0).normalize());
    product.rotation.set(-.12, -.35, -.12);
  }
  function makeAssembly() {
    cylinder(product, 0, 3.75, .36, dark);
    for (let i = 0; i < 48; i++) ring(product, -1.75 + i * (3.5 / 47), .367, .028, rib);
    ring(product, -1.85, .41, .065, orange);
    ring(product, 1.85, .41, .065, orange);
    parts.left = coupling(product, -1);
    parts.right = coupling(product, 1);
    parts.left.position.x = -2.03;
    parts.right.position.x = 2.03;
    product.rotation.set(-.08, -.28, -.16);
  }
  function makeCoupling() {
    const body = new THREE.Group();
    product.add(body);
    cylinder(body, 0, 1.35, .58, metal);
    cylinder(body, -.74, .35, .65, metalDark);
    cylinder(body, .76, .3, .66, metalDark);
    for (let x = -.54; x <= .54; x += .17) ring(body, x, .584, .027, metalDark);
    ring(body, -.93, .49, .095, metal);
    ring(body, .94, .48, .1, metal);
    cylinder(body, -.98, .006, .36, inner);
    cylinder(body, .99, .006, .35, inner);
    ring(body, .64, .65, .035, orange);
    product.scale.setScalar(1.45);
    product.rotation.set(-.2, -.54, -.17);
  }
  function disposeProduct() {
    if (!product) return;
    product.traverse(child => child.geometry?.dispose());
    scene.remove(product);
  }
  function setMode(next) {
    if (!modes[next]) return;
    mode = next;
    exploded = false;
    parts.left = parts.right = null;
    disposeProduct();
    product = new THREE.Group();
    scene.add(product);
    if (next === 'hose') makeHose();
    if (next === 'assembly') makeAssembly();
    if (next === 'coupling') makeCoupling();
    const data = modes[next];
    label.textContent = data.label;
    family.textContent = data.family;
    title.textContent = data.title;
    description.textContent = data.description;
    question.textContent = data.question;
    explore.href = data.href;
    explore.innerHTML = `${data.link} <span>↗</span>`;
    mount.setAttribute('aria-label', `Interactive 3D illustration of ${data.family.toLowerCase()}. Drag or use arrow keys to rotate, plus and minus to zoom.`);
    const specTitle = document.getElementById('specTitle');
    const specIntro = document.getElementById('specIntro');
    const specBody = document.getElementById('specBody');
    const specPdf = document.getElementById('specPdf');
    const specNote = document.getElementById('specNote');
    const specStatus = document.getElementById('specStatus');
    if (next === 'hose') {
      specTitle.textContent = 'SAE 100 R3 · selected sizes';
      specIntro.textContent = 'Values transcribed from a HoseXperts product sheet. The 3D hose above is illustrative and does not depict this exact model.';
      specBody.innerHTML = '<tr><td>≈¼ / 6.40</td><td>87 / 1,250</td><td>348 / 5,046</td><td>76</td><td>−40 to +100</td></tr><tr><td>≈⅜ / 9.50</td><td>78 / 1,131</td><td>312 / 4,524</td><td>101</td><td>−40 to +100</td></tr><tr><td>≈½ / 12.70</td><td>70 / 1,015</td><td>280 / 4,060</td><td>127</td><td>−40 to +100</td></tr><tr><td>≈¾ / 19.10</td><td>52 / 754</td><td>208 / 3,016</td><td>152</td><td>−40 to +100</td></tr>';
      specPdf.hidden = false;
      specNote.textContent = '*The source sheet labels this “Bending Radius.” Inch sizes are approximate conversions from the listed millimetres. Confirm the current specification with HoseXperts before ordering.';
      specStatus.textContent = 'SOURCE: HOSEXPERTS SAE 100 R3 PRODUCT SHEET';
    } else {
      specTitle.textContent = next === 'assembly' ? 'Assembly specifications' : 'Coupling specifications';
      specIntro.textContent = 'This table is ready for client-approved technical data. No operating values have been supplied for this illustrated family.';
      specBody.innerHTML = '<tr class="pending"><td>Pending product selection</td><td>Awaiting data sheet</td><td>Awaiting data sheet</td><td>Awaiting data sheet</td><td>Awaiting data sheet</td></tr>';
      specPdf.hidden = true;
      specNote.textContent = 'The live website should link each exact part number to its verified product sheet and relevant certificates.';
      specStatus.textContent = 'TECHNICAL DATA PENDING CLIENT APPROVAL';
    }
    explodeButton.hidden = next !== 'assembly';
    explodeButton.setAttribute('aria-pressed', 'false');
    document.querySelectorAll('[data-model]').forEach(button => {
      const selected = button.dataset.model === next;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    targetZoom = zoom = next === 'coupling' ? 5.8 : 7.1;
  }
  function resize() {
    if (!renderer) return;
    const width = mount.clientWidth, height = mount.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  function animate() {
    animationId = requestAnimationFrame(animate);
    if (!active) return;
    if (autoRotate && !dragging) product.rotation.y += .003;
    if (parts.left && parts.right) {
      parts.left.position.x += ((exploded ? -2.72 : -2.03) - parts.left.position.x) * .1;
      parts.right.position.x += ((exploded ? 2.72 : 2.03) - parts.right.position.x) * .1;
    }
    zoom += (targetZoom - zoom) * .12;
    camera.position.set(0, 1.15, zoom);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  function showFallback() {
    fallback.hidden = false;
    document.querySelector('.lab-controls').hidden = true;
    explodeButton.hidden = true;
    mount.style.display = 'none';
  }
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(37, 1, .1, 100);
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(-3, 6, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0xe9b68e, 2.5);
    rim.position.set(3, 2, -4); scene.add(rim);
    const fill = new THREE.DirectionalLight(0x9dbeb0, 1.2);
    fill.position.set(1, -2, 4); scene.add(fill);
    setMode('hose');
    resize();
    new ResizeObserver(resize).observe(mount);
    new IntersectionObserver(entries => { active = entries[0].isIntersecting; }, { threshold: .05 }).observe(mount);
    animate();
  } catch (error) {
    console.warn('3D viewer could not start', error);
    showFallback();
  }
  mount.tabIndex = 0;
  mount.addEventListener('pointerdown', event => {
    dragging = true; pointerX = event.clientX; pointerY = event.clientY;
    mount.setPointerCapture(event.pointerId);
  });
  mount.addEventListener('pointermove', event => {
    if (!dragging || !product) return;
    product.rotation.y += (event.clientX - pointerX) * .008;
    product.rotation.x = THREE.MathUtils.clamp(product.rotation.x + (event.clientY - pointerY) * .006, -.85, .85);
    pointerX = event.clientX; pointerY = event.clientY;
  });
  mount.addEventListener('pointerup', () => { dragging = false; });
  mount.addEventListener('pointercancel', () => { dragging = false; });
  mount.addEventListener('keydown', event => {
    if (!product) return;
    if (event.key === 'ArrowLeft') product.rotation.y -= .12;
    else if (event.key === 'ArrowRight') product.rotation.y += .12;
    else if (event.key === 'ArrowUp') product.rotation.x = Math.max(-.85, product.rotation.x - .12);
    else if (event.key === 'ArrowDown') product.rotation.x = Math.min(.85, product.rotation.x + .12);
    else if (event.key === '+' || event.key === '=') targetZoom = Math.max(4.4, targetZoom - .4);
    else if (event.key === '-') targetZoom = Math.min(10, targetZoom + .4);
    else if (event.key === 'Home') setMode(mode);
    else return;
    event.preventDefault();
  });
  document.querySelectorAll('[data-model]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.model)));
  document.addEventListener('hosexperts:model', event => setMode(event.detail));
  document.getElementById('zoomIn').addEventListener('click', () => { targetZoom = Math.max(4.4, targetZoom - .55); });
  document.getElementById('zoomOut').addEventListener('click', () => { targetZoom = Math.min(10, targetZoom + .55); });
  document.getElementById('resetView').addEventListener('click', () => setMode(mode));
  explodeButton.addEventListener('click', () => {
    exploded = !exploded;
    explodeButton.setAttribute('aria-pressed', String(exploded));
    explodeButton.innerHTML = `${exploded ? 'Rejoin components' : 'Separate components'} <span>↗</span>`;
  });
  spinButton.addEventListener('click', () => {
    autoRotate = !autoRotate;
    spinButton.setAttribute('aria-pressed', String(autoRotate));
  });
  addEventListener('pagehide', () => { cancelAnimationFrame(animationId); renderer?.dispose(); });
}
