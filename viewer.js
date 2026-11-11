/* מודל תלת-ממדי של סגירת מרפסת ההורים. נבנה מ-scene-data.js (שמיוצא מ-model.py).
   צירים: X = מזרח (x בתוכנית), Y = גובה (z), Z = דרום (y בתוכנית). יחידות: ס"מ.
   ?view=axo|living|closet|work לרינדור סטטי, בלי פרמטר: מצב אינטראקטיבי. */
(function () {
  const D = window.MODEL;
  const params = new URLSearchParams(location.search);
  const VIEW = params.get('view') || 'interactive';
  const AXO = VIEW === 'axo' || VIEW === 'interactive';

  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  const FW = +params.get('w') || window.innerWidth, FH = +params.get('h') || window.innerHeight;
  renderer.setSize(FW, FH);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = AXO ? 1.05 : 1.3;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(VIEW === 'axo' || VIEW === 'interactive' ? '#EEF1F4' : '#DCE7F0');

  // ------------------------------------------------------------ materials
  const mats = {};
  function M(color, opts) {
    const key = color + JSON.stringify(opts || {});
    if (!mats[key]) mats[key] = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.82, metalness: 0.0 }, opts || {}));
    return mats[key];
  }
  const WALL = M('#F3F1ED'), WALL_EX = M('#DEDBD4'), OAK = M('#C9A97C', { roughness: 0.7 }), FLOOR = M('#D7C2A0', { roughness: 0.75 });
  const WHITE = M('#F7F6F3'), ALU = M('#4A4F57', { roughness: 0.5, metalness: 0.4 }), STEEL = M('#A8B0B6', { roughness: 0.35, metalness: 0.7 });
  const GLASS = new THREE.MeshPhysicalMaterial({ color: '#CFE6F5', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.0, depthWrite: false });
  const MIRROR = M('#C3D3DD', { roughness: 0.12, metalness: 0.05, emissive: '#A9BDCA', emissiveIntensity: 0.28 });
  const LEDM = new THREE.MeshStandardMaterial({ color: '#FFE7B0', emissive: '#FFD27A', emissiveIntensity: 1.6 });

  // ------------------------------------------------------------ helpers (plan coords → scene)
  function box(x0, x1, y0, y1, z0, z1, mat, opts) {
    opts = opts || {};
    const w = Math.abs(x1 - x0), d = Math.abs(y1 - y0), h = Math.abs(z1 - z0);
    if (w <= 0 || d <= 0 || h <= 0) return null;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set((x0 + x1) / 2, (z0 + z1) / 2, (y0 + y1) / 2);
    m.castShadow = opts.cast !== false && mat !== GLASS;
    m.receiveShadow = true;
    if (opts.edges) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: opts.edges, transparent: true, opacity: 0.35 }));
      m.add(e);
    }
    scene.add(m);
    return m;
  }
  function cyl(x, y, z0, z1, r, mat, seg) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, z1 - z0, seg || 18), mat);
    m.position.set(x, (z0 + z1) / 2, y);
    m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
  }
  function plant(x, y, size) {
    cyl(x, y, 0, size * 0.55, size * 0.42, M('#C9B9A6'));
    const leaves = M('#6E9B57', { roughness: 0.9 });
    [[0, 0, 1.0], [0.35, 0.2, 0.75], [-0.3, 0.25, 0.7], [0.1, -0.35, 0.7]].forEach(function (p) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(size * 0.55 * p[2], 0), leaves);
      s.position.set(x + p[0] * size, size * 0.55 + size * 0.5 * p[2], y + p[1] * size);
      s.castShadow = true; scene.add(s);
    });
  }
  let rndSeed = 7;
  function rnd() { rndSeed = (rndSeed * 9301 + 49297) % 233280; return rndSeed / 233280; }
  const BOOKC = ['#8FA9C4', '#B9806B', '#9BB08A', '#D7C79E', '#7E7E8C', '#C9A877', '#5E7D5A', '#A85A4A', '#E6DCC8'];
  function booksAlongY(x0, x1, y0, y1, z) { // shelf running along y, books facing +x or -x
    let y = y0 + 2;
    while (y < y1 - 4) {
      const w = 2 + rnd() * 3.2, h = 18 + rnd() * 9;
      if (rnd() < 0.07) { y += 10; continue; }
      box(x0 + 2, x1 - 4 - rnd() * 4, y, y + w, z, z + h, M(BOOKC[Math.floor(rnd() * BOOKC.length)]), { cast: false });
      y += w + 0.4;
    }
  }
  function booksAlongX(x0, x1, y0, y1, z) {
    let x = x0 + 2;
    while (x < x1 - 4) {
      const w = 2 + rnd() * 3.2, h = 18 + rnd() * 9;
      if (rnd() < 0.07) { x += 10; continue; }
      box(x, x + w, y0 + 4 + rnd() * 3, y1 - 2, z, z + h, M(BOOKC[Math.floor(rnd() * BOOKC.length)]), { cast: false });
      x += w + 0.4;
    }
  }
  function label(textStr, x, y, z) {
    const c = document.createElement('canvas'); c.width = 640; c.height = 140;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(255,255,255,0.92)';
    const r = 30; g.beginPath(); g.moveTo(r, 10); g.arcTo(630, 10, 630, 130, r); g.arcTo(630, 130, 10, 130, r); g.arcTo(10, 130, 10, 10, r); g.arcTo(10, 10, 630, 10, r); g.fill();
    g.fillStyle = '#26262B'; g.font = 'bold 64px "Varela Round", "Arial Hebrew", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.direction = 'rtl'; g.fillText(textStr, 320, 74);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false }));
    s.scale.set(150, 33, 1); s.position.set(x, z, y); s.renderOrder = 10; scene.add(s);
  }

  const H = D.H;

  // ------------------------------------------------------------ floors & base
  box(-20, 900, -20, AXO ? 330 : 470, -36, -12, M('#BDB8B0'), { cast: false });
  box(670, 900, 330, 470, -36, -12, M('#BDB8B0'), { cast: false });
  D.rooms.forEach(function (r) {
    const mat = r.key === 'smoke' ? M('#CFCDC8', { roughness: 0.9 }) : FLOOR;
    box(r.x0, r.x1, r.y0, r.y1, -12, 0, mat, { cast: false });
  });
  box(23, 655, 282, AXO ? 330 : 470, -12, 0, M('#E3E0DA'), { cast: false });   // existing bedroom/bathroom floor (context)
  box(12, 862, 0, 12, -12, 0, FLOOR, { cast: false });

  // ------------------------------------------------------------ walls
  const showNorth = VIEW !== 'axo' && VIEW !== 'interactive' ? true : true;
  const exH = AXO ? 105 : H + 30;                           // existing house walls cut low in the overview
  D.walls_new.forEach(function (w) {
    const southWall = w[1] === 257 && w[3] === 269;           // closet south wall (on the building line)
    box(w[0], w[2], w[1], w[3], 0, (AXO && southWall) ? exH : H, WALL);
  });
  // lintels & sills
  box(242, 252, 18, 100, D.DOOR_H, H, WALL); box(612, 622, 164, 244, D.DOOR_H, H, WALL);
  if (!AXO) box(717, 797, 257, 269, D.DOOR_H, H, WALL);
  D.windows.forEach(function (w) {
    box(w.x0, w.x1, 0, 12, w.head, H, WALL);
    if (w.sill > 0) box(w.x0, w.x1, 0, 12, 0, w.sill, WALL);
    // frame + glass
    const panes = w.panes;
    box(w.x0, w.x1, 4, 8, w.sill, w.sill + 4, ALU); box(w.x0, w.x1, 4, 8, w.head - 4, w.head, ALU);
    for (let i = 0; i <= panes; i++) {
      const xm = w.x0 + (w.x1 - w.x0) * i / panes;
      box(Math.max(w.x0, xm - 2), Math.min(w.x1, xm + 2), 3, 9, w.sill, w.head, ALU);
    }
    box(w.x0, w.x1, 5.5, 6.5, w.sill + 4, w.head - 4, GLASS, { cast: false });
    box(w.x0, w.x1, -6, 0, w.head - 2, H + 4, ALU);                  // shutter box
  });
  // existing house walls (context)
  D.walls_exist.forEach(function (w) {
    const zTop = (w[1] === 257 && w[3] === 282) ? exH : Math.min(exH, H + 30);
    if (w[3] - w[1] > 60 && AXO) { box(w[0], w[2], w[1], Math.min(w[3], 300), 0, Math.min(zTop, 60), WALL_EX); return; }
    box(w[0], w[2], w[1], w[3], 0, zTop, WALL_EX);
  });
  if (!AXO) box(D.BED_OPEN[0], D.BED_OPEN[1], 257, 282, D.DOOR_H, H + 30, WALL_EX);
  // existing bedroom sliding door (glass, aluminium)
  const dz = AXO ? Math.min(exH, D.DOOR_H) : D.DOOR_H;
  box(D.BED_OPEN[0], 497, 262, 266, 0, dz, GLASS, { cast: false });
  box(487, D.BED_OPEN[1], 268, 272, 0, dz, GLASS, { cast: false });
  [[D.BED_OPEN[0], D.BED_OPEN[0] + 4, 262, 266], [493, 497, 262, 266], [487, 491, 268, 272], [D.BED_OPEN[1] - 4, D.BED_OPEN[1], 268, 272]].forEach(function (f) {
    box(f[0], f[1], f[2], f[3], 0, dz, ALU);
  });

  // ------------------------------------------------------------ doors
  const DOORM = M('#EDE7DE', { roughness: 0.6 });
  box(162, 242, 14, 18, 0, D.DOOR_H, DOORM);                 // D1 open toward the window
  box(622, 702, 240, 244, 0, D.DOOR_H, DOORM);               // D2 open into the closet room
  box(717, 761, 259, 262.5, 0, AXO ? exH : D.DOOR_H, ALU);   // D3 aluminium sliding
  box(753, 797, 264, 267.5, 0, AXO ? exH : D.DOOR_H, ALU);

  // ------------------------------------------------------------ work room
  box(14, 154, 14, 79, 72, 76, OAK);
  [[16, 18, 16, 18], [150, 152, 16, 18], [16, 18, 75, 77], [150, 152, 75, 77]].forEach(function (l) { box(l[0], l[1], l[2], l[3], 0, 72, ALU); });
  box(56, 112, 20, 23, 80, 118, M('#1E1F22', { roughness: 0.4 }));
  box(80, 88, 26, 34, 76, 80, ALU);
  box(66, 102, 88, 122, 44, 50, M('#5A5F66'));
  box(68, 100, 118, 123, 50, 96, M('#5A5F66'));
  cyl(84, 105, 0, 44, 2.2, ALU);
  // bookcases
  [[D.BOOK_W, 'y'], [D.BOOK_E, 'y']].forEach(function (b) {
    const r = b[0];
    box(r[0], r[1], r[2], r[2] + 2, 0, 240, OAK); box(r[0], r[1], r[3] - 2, r[3], 0, 240, OAK);
    for (let z = 0; z <= 240; z += 35) {
      box(r[0], r[1], r[2], r[3], z, z + 2.5, OAK);
      if (z + 30 < 240) booksAlongY(r[0], r[1], r[2] + 2, r[3] - 2, z + 2.5);
    }
  });
  box(42, 240, 177, 255, 0, 32, M('#BFB2A0'));
  box(44, 238, 179, 253, 32, 45, M('#EEE9E1'));
  box(56, 226, 238, 255, 45, 85, M('#D9D3C9'));
  box(42, 56, 177, 238, 45, 66, M('#D9D3C9')); box(226, 240, 177, 238, 45, 66, M('#D9D3C9'));
  box(62, 90, 222, 236, 45, 66, M('#D7A86E')); box(192, 220, 222, 236, 45, 66, M('#8DA58A'));
  D.SHELF_DB_Z.forEach(function (z) {
    box(42, 240, 230, 257, z, z + 2.5, OAK);
    box(44, 238, 230, 232, z - 1, z, LEDM, { cast: false });
    booksAlongX(44, 238, 232, 257, z + 2.5);
  });
  box(56, 68, 250, 257, 96, 104, ALU); box(214, 226, 250, 257, 96, 104, ALU);

  // ------------------------------------------------------------ living room
  box(296, 520, 38, 178, 0, 1.2, M('#CEC6BA', { roughness: 1 }), { cast: false });
  const SOFA = M('#A9A49C', { roughness: 0.95 }), SOFA_L = M('#BDB8B0', { roughness: 0.95 });
  box(256, 478, 162, 252, 0, 40, SOFA); box(256, 346, 102, 162, 0, 40, SOFA);
  box(256, 478, 234, 252, 40, 82, SOFA); box(256, 274, 102, 252, 40, 82, SOFA);
  box(274, 346, 102, 116, 40, 60, SOFA); box(462, 478, 162, 234, 40, 60, SOFA);
  box(275, 345, 117, 233, 40, 47, SOFA_L); box(347, 403, 163, 233, 40, 47, SOFA_L); box(405, 461, 163, 233, 40, 47, SOFA_L);
  box(280, 300, 214, 232, 47, 68, M('#C77D5B')); box(436, 456, 214, 232, 47, 68, M('#7F9C86')); box(278, 296, 120, 142, 47, 66, M('#D9C08A'));
  box(392, 472, 77, 122, 36, 40, OAK); box(398, 466, 83, 116, 0, 36, M('#8A7558'));
  // screen (down) with a projected image
  const sc = document.createElement('canvas'); sc.width = 512; sc.height = 288;
  const sg = sc.getContext('2d'); const grd = sg.createLinearGradient(0, 0, 0, 288);
  grd.addColorStop(0, '#1F3B66'); grd.addColorStop(0.55, '#E08A4B'); grd.addColorStop(0.62, '#3B2A3A'); grd.addColorStop(1, '#141018');
  sg.fillStyle = grd; sg.fillRect(0, 0, 512, 288);
  sg.fillStyle = 'rgba(255,240,200,0.9)'; sg.beginPath(); sg.arc(330, 160, 26, 0, Math.PI * 2); sg.fill();
  const stex = new THREE.CanvasTexture(sc); stex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(144, 81), new THREE.MeshStandardMaterial({ map: stex, emissive: '#ffffff', emissiveMap: stex, emissiveIntensity: 0.55, roughness: 0.9 }));
  scr.position.set(375, (D.SCREEN_Z[0] + D.SCREEN_Z[1]) / 2, 22.6); scene.add(scr);
  box(301, 449, 21, 22.4, D.SCREEN_Z[0] - 3, D.SCREEN_Z[1] + 3, M('#1A1A1C'));
  box(375 - 0.5, 375 + 0.5, 21, 22, D.SCREEN_Z[1] + 3, H - 6, M('#E8E8E8'));
  box(299, 451, 17, 27, H - 8, H, M('#DADADF'));
  box(364, 386, 134, 148, H - 16, H - 4, WHITE); cyl(375, 133, H - 12, H - 8, 3, M('#222'));
  // bar
  const BX0 = D.BAR[0];
  box(BX0, 612, 12, 162, 0, 8, M('#3A3836'));
  box(BX0, 612, 12, 52, 8, 86, M('#E8E3DB'));
  box(BX0 - 0.6, BX0, 15, 49, 12, 82, M('#2A1D22', { roughness: 0.2 }));
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) cyl(BX0 + 4, 19 + c * 8, 16 + r * 17, 18 + r * 17, 3, M('#7A2340'));
  box(BX0, 612, 52, 102, 8, 86, M('#E8E3DB')); box(BX0 - 0.6, BX0, 76.5, 77.5, 8, 86, M('#B9B2A6'));
  box(BX0, 612, 102, 162, 8, 86, M('#E8E3DB')); box(BX0 - 1.5, BX0, 106, 158, 76, 78, STEEL);
  box(BX0 - 2, 612, 12, 162, 86, 90, M('#E4DFD6', { roughness: 0.45 }));
  box(566, 598, 59, 95, 89.6, 90.4, M('#7E878D', { roughness: 0.3, metalness: 0.6 }));
  cyl(605, 77, 90, 116, 1.4, STEEL); box(596, 606, 76, 78, 114, 116, STEEL);
  box(588, 608, 16, 36, 90, 128, M('#2F2B29', { roughness: 0.4 })); box(587, 589, 20, 32, 104, 114, STEEL);
  box(610, 612, 12, 162, 90, 138, M('#CDBFAE'));
  D.BAR_SHELF_Z.forEach(function (z, i) {
    box(582, 612, 12, 162, z, z + 3, OAK);
    box(583, 611, 13, 161, z - 1, z, LEDM, { cast: false });
    for (let y = 18; y < 156; y += 9) {
      if (rnd() < 0.55) {
        const col = ['#2F5A3A', '#7A2340', '#B8862E', '#2C4E73'][Math.floor(rnd() * 4)];
        const h = 20 + rnd() * 9;
        cyl(597, y, z + 3, z + 3 + h * 0.65, 3.2, M(col, { roughness: 0.25 }));
        cyl(597, y, z + 3 + h * 0.65, z + 3 + h, 1.2, M(col, { roughness: 0.25 }));
      } else {
        cyl(597, y, z + 3, z + 13, 3, new THREE.MeshPhysicalMaterial({ color: '#E8F2FA', transparent: true, opacity: 0.45, roughness: 0.05 }));
      }
    }
  });
  plant(536, 28, 22);

  // ------------------------------------------------------------ closet room
  const FRONT = M('#F2EFEA', { roughness: 0.55 }), SEAM = M('#9A958D');
  function closetRun(x0, x1, y0, y1, frontAxis, seams) {
    box(x0, x1, y0, y1, 0, 8, M('#D9D5CE'));
    box(x0, x1, y0, y1, 8, D.CLOSET_H, FRONT);
    box(x0, x1, y0, y1, D.CLOSET_H, H, M('#ECE9E4'));
    seams.forEach(function (s) {
      if (frontAxis === 'y') box(s - 0.4, s + 0.4, y1, y1 + 0.3, 8, D.CLOSET_H, SEAM, { cast: false });
      else box(x0 - 0.3, x0, s - 0.4, s + 0.4, 8, D.CLOSET_H, SEAM, { cast: false });
    });
  }
  closetRun(712, 862, 12, 72, 'y', [757, 802]);
  box(752, 754, 72, 74, 95, 130, STEEL); box(760, 762, 72, 74, 95, 130, STEEL);
  closetRun(802, 862, 72, 257, 'x', [132, 192]);
  box(800, 802, 128, 130, 95, 130, STEEL); box(800, 802, 134, 136, 95, 130, STEEL); box(800, 802, 196, 198, 95, 130, STEEL);
  box(801.4, 802, 100, 168, 40, 205, MIRROR, { cast: false });
  // vanity (continuing the north closet) + lit mirror + chair
  box(672, 712, 12, 62, 8, 72, FRONT); [30, 51].forEach(function (z) { box(672, 712, 62, 62.3, z, z + 0.6, SEAM, { cast: false }); });
  box(622, 712, 12, 62, 62, 72, FRONT); box(622, 712, 12, 62, 72, 76, M('#E4DFD6', { roughness: 0.45 }));
  box(632, 702, 12, 13.5, 95, 185, MIRROR, { cast: false });
  box(629, 705, 12, 13, 92, 95, LEDM, { cast: false }); box(629, 705, 12, 13, 185, 188, LEDM, { cast: false });
  box(629, 632, 12, 13, 95, 185, LEDM, { cast: false }); box(702, 705, 12, 13, 95, 185, LEDM, { cast: false });
  box(622, 712, 12, 57, 210, H, FRONT);
  box(646, 688, 68, 108, 40, 46, M('#D8B9B4')); box(650, 684, 102, 108, 46, 82, M('#D8B9B4'));
  [[648, 650, 70, 72], [684, 686, 70, 72], [648, 650, 104, 106], [684, 686, 104, 106]].forEach(function (l) { box(l[0], l[1], l[2], l[3], 0, 40, M('#C9A97C')); });
  // bench in the middle
  box(702, 736, 122, 198, 0, 34, OAK); box(700, 738, 120, 200, 34, 45, M('#B98B5E', { roughness: 0.6 }));
  box(706, 732, 130, 190, 6, 8, M('#8A7558'));
  // full-length mirror on the inner wall
  box(622, 623.5, 110, 158, 30, 200, MIRROR, { cast: false });

  // ------------------------------------------------------------ smoking balcony
  box(862, 868, 257, 446, 0, 110, GLASS, { cast: false }); box(680, 868, 440, 446, 0, 110, GLASS, { cast: false });
  box(862, 868, 257, 446, 108, 112, ALU); box(680, 868, 440, 446, 108, 112, ALU);
  [[702, 758], [786, 842]].forEach(function (c) {
    box(c[0], c[1], 370, 426, 0, 38, M('#D9CFC0')); box(c[0], c[1], 414, 426, 38, 72, M('#D9CFC0'));
    box(c[0] + 4, c[1] - 4, 374, 414, 38, 44, M('#F0EAE0'));
  });
  cyl(771, 398, 0, 48, 15, M('#E6E1D8'));
  plant(846, 330, 20);

  // ------------------------------------------------------------ interior views: ceiling + landscape backdrop behind the glazing
  if (!AXO) {
    box(0, 874, 0, 269, H, H + 2, M('#FAF9F7'), { cast: false });
    const bc = document.createElement('canvas'); bc.width = 2048; bc.height = 768;
    const bg = bc.getContext('2d');
    const sky = bg.createLinearGradient(0, 0, 0, 768); sky.addColorStop(0, '#8DB6DE'); sky.addColorStop(0.62, '#E3EDF4'); sky.addColorStop(1, '#EEF2EC');
    bg.fillStyle = sky; bg.fillRect(0, 0, 2048, 768);
    function ridge(y0, amp, col, seed) {
      bg.fillStyle = col; bg.beginPath(); bg.moveTo(0, 768);
      for (let x = 0; x <= 2048; x += 16) bg.lineTo(x, y0 - amp * (0.5 + 0.5 * Math.sin(x / 210 + seed) * Math.cos(x / 530 + seed * 2)));
      bg.lineTo(2048, 768); bg.closePath(); bg.fill();
    }
    ridge(470, 90, '#B7C9B6', 1.3); ridge(540, 70, '#93AE91', 2.1); ridge(610, 50, '#6F9270', 0.4);
    const btex = new THREE.CanvasTexture(bc); btex.colorSpace = THREE.SRGBColorSpace;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(5200, 1950), new THREE.MeshBasicMaterial({ map: btex }));
    back.position.set(437, 200, -1300); scene.add(back);
    scene.background = new THREE.Color('#E6EEF3');
  }

  // ------------------------------------------------------------ lights
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#B9AE9E', AXO ? 0.95 : 1.25));
  const sun = new THREE.DirectionalLight('#FFF1DC', 2.6);
  sun.position.set(437 - 650, 1350, 140 + 750); sun.target.position.set(437, 0, 140);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc2 = sun.shadow.camera; sc2.left = -700; sc2.right = 700; sc2.top = 700; sc2.bottom = -700; sc2.near = 100; sc2.far = 4000;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight('#DCE8FF', 0.55); fill.position.set(437 + 600, 900, 140 - 1200); scene.add(fill);
  if (!AXO) {
    [[375, 120], [742, 160], [140, 150]].forEach(function (p) {
      const l = new THREE.PointLight('#FFE9C9', 0.55, 520, 1.6); l.position.set(p[0], H - 20, p[1]); scene.add(l);
    });
  }

  // ------------------------------------------------------------ labels (overview)
  if (AXO) {
    label('חדר עבודה', 127, 135, H + 70); label('סלון הורים', 432, 135, H + 70); label('חדר ארונות', 742, 135, H + 70);
    label('מרפסת עישון', 771, 360, 170); label('חדר שינה (קיים)', 340, 310, 125);
  }

  // ------------------------------------------------------------ cameras
  const aspect = FW / FH;
  let camera;
  if (AXO) {
    const half = (FW / FH > 2) ? 252 : 372;
    camera = new THREE.OrthographicCamera(-half * aspect, half * aspect, half, -half, 1, 6000);
    camera.position.set(462 - 230, 1180, 70 + 1105);
    camera.lookAt(462, 30, 70);
    camera.zoom = VIEW === 'axo' ? 1.0 : 1.0; camera.updateProjectionMatrix();
  } else {
    const V = {
      living: { pos: [580, 150, 228], look: [345, 100, 28], fov: 68 },
      closet: { pos: [640, 158, 238], look: [805, 92, 62], fov: 74 },
      work: { pos: [150, 152, 36], look: [122, 80, 252], fov: 72 },
    }[VIEW];
    camera = new THREE.PerspectiveCamera(V.fov, aspect, 5, 8000);
    camera.position.set(V.pos[0], V.pos[1], V.pos[2]);
    camera.lookAt(V.look[0], V.look[1], V.look[2]);
  }

  // ------------------------------------------------------------ interactive orbit
  if (VIEW === 'interactive') {
    const target = new THREE.Vector3(437, 30, 175);
    let r = camera.position.clone().sub(target);
    let sph = new THREE.Spherical().setFromVector3(r);
    let drag = null;
    canvas.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, t: sph.theta, p: sph.phi }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag) return;
      sph.theta = drag.t - (e.clientX - drag.x) * 0.006;
      sph.phi = Math.min(1.45, Math.max(0.15, drag.p - (e.clientY - drag.y) * 0.006));
      camera.position.copy(new THREE.Vector3().setFromSpherical(sph).add(target)); camera.lookAt(target); draw();
    });
    canvas.addEventListener('pointerup', function () { drag = null; });
    canvas.addEventListener('wheel', function (e) { e.preventDefault(); camera.zoom = Math.min(4, Math.max(0.5, camera.zoom * (e.deltaY > 0 ? 0.92 : 1.08))); camera.updateProjectionMatrix(); draw(); }, { passive: false });
    window.addEventListener('resize', function () {
      const FW = +params.get('w') || window.innerWidth, FH = +params.get('h') || window.innerHeight;
  renderer.setSize(FW, FH);
      const a = window.innerWidth / window.innerHeight; camera.left = -395 * a; camera.right = 395 * a; camera.updateProjectionMatrix(); draw();
    });
  }
  function draw() { renderer.render(scene, camera); }
  draw();
  document.title = 'ready';
})();
