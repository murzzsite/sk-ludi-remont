const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/7RLK5R3RJG';

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/ | /g, ' ');

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* header */
  const header = $('#header'), burger = $('#burger'), nav = $('#nav');
  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('is-open'); nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  /* hero title split */
  const title = $('[data-split]');
  if (title) {
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', words.join(' '));
    title.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
  }

  /* phone mask (keeps Telegram nicks) */
  $$('input[type="tel"]').forEach(input => input.addEventListener('input', e => {
    const raw = e.target.value;
    if (/[a-zA-Zа-яА-Я@]/.test(raw)) return;
    let v = raw.replace(/\D/g, '');
    if (!v) { e.target.value = ''; return; }
    if (v.startsWith('8')) v = '7' + v.slice(1);
    if (!v.startsWith('7')) v = '7' + v;
    v = v.slice(0, 11);
    let out = '+7';
    if (v.length > 1) out += ' (' + v.slice(1, 4);
    if (v.length >= 4) out += ') ' + v.slice(4, 7);
    if (v.length >= 7) out += '-' + v.slice(7, 9);
    if (v.length >= 9) out += '-' + v.slice(9, 11);
    e.target.value = out;
  }));

  /* smooth anchors */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href.length <= 1) return;
    const t = $(href); if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 64, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ============ plan (pseudo-3D apartment) ============ */
  const ROOMS = [
    { id: 'k', x: 20, y: 20, w: 300, h: 200, c: '#E9D3AE' },
    { id: 'b', x: 320, y: 20, w: 260, h: 200, c: '#CBD9D0' },
    { id: 'h', x: 20, y: 220, w: 140, h: 200, c: '#E6CDB8' },
    { id: 'w', x: 160, y: 220, w: 120, h: 200, c: '#B9D6DD' },
    { id: 'c', x: 280, y: 220, w: 300, h: 200, c: '#D3DAE6' }
  ];
  const WALLS = [
    [20,20,580,20],[20,420,580,420],[20,20,20,420],[580,20,580,420],
    [320,20,320,120],[320,172,320,220],
    [20,220,62,220],[106,220,360,220],[404,220,580,220],
    [160,220,160,300],[160,350,160,420],[280,220,280,420]
  ];
  const FURN = [
    { r: 'k', s: '<rect x="38" y="38" width="170" height="30" fill="#B79F74"/><rect x="38" y="160" width="120" height="48" fill="#7C8F9C"/><rect x="48" y="170" width="22" height="22" fill="#FF5A1F"/><rect x="214" y="110" width="64" height="64" fill="#FBFBF9"/>' },
    { r: 'b', s: '<rect x="390" y="50" width="110" height="140" fill="#FBFBF9"/><rect x="390" y="44" width="110" height="14" fill="#7C8F9C"/><rect x="344" y="50" width="36" height="30" fill="#B79F74"/><rect x="510" y="50" width="48" height="30" fill="#B79F74"/>' },
    { r: 'h', s: '<rect x="36" y="378" width="64" height="30" fill="#B79F74"/><rect x="36" y="236" width="22" height="90" fill="#7C8F9C"/>' },
    { r: 'w', s: '<rect x="172" y="236" width="48" height="80" fill="#FBFBF9"/><circle cx="244" cy="388" r="14" fill="#FBFBF9"/><rect x="226" y="236" width="40" height="22" fill="#7C8F9C"/>' },
    { r: 'c', s: '<rect x="296" y="380" width="120" height="28" fill="#B79F74"/><rect x="480" y="260" width="84" height="140" fill="#FBFBF9"/><rect x="480" y="256" width="84" height="12" fill="#FF5A1F"/>' }
  ];
  const NS = 'http://www.w3.org/2000/svg';
  const svg = inner => `<svg viewBox="0 0 600 440" xmlns="${NS}" aria-hidden="true">${inner}</svg>`;
  const floorSVG = () => svg(ROOMS.map(r => `<rect class="rm" data-room="${r.id}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.c}"/>`).join(''));
  const furnSVG = () => svg(FURN.map(f => `<g class="furn" data-room="${f.r}">${f.s}</g>`).join(''));
  const wallSVG = top => svg(WALLS.map(w => `<line class="wall${top ? ' wall--top' : ''}" x1="${w[0]}" y1="${w[1]}" x2="${w[2]}" y2="${w[3]}"/>`).join(''));

  const buildPlan = (host, layers) => {
    const stage = document.createElement('div');
    stage.className = 'iso__stage';
    const add = (html, z, cls) => {
      const d = document.createElement('div');
      d.className = 'iso__layer ' + (cls || '');
      d.innerHTML = html;
      d.style.transform = `translateZ(${z}px)`;
      stage.appendChild(d);
      return d;
    };
    add(floorSVG(), 0, 'l-floor');
    const furn = add(furnSVG(), 3, 'l-furn');
    const walls = [];
    for (let i = 1; i <= layers; i++) walls.push(add(wallSVG(i === layers), 0, 'l-wall'));
    host.appendChild(stage);
    return { stage, furn, walls };
  };
  const setLift = (plan, lift) => plan.walls.forEach((w, i) => { w.style.transform = `translateZ(${(i + 1) * lift}px)`; });

  /* hero plan */
  const heroHost = $('#heroIso');
  let hero = null;
  if (heroHost) {
    hero = buildPlan(heroHost, 18);
    if (reduce) setLift(hero, 1.7);
    else {
      setLift(hero, 0);
      const t0 = performance.now() + 500;
      const grow = t => {
        const p = Math.max(0, Math.min(1, (t - t0) / 1500));
        setLift(hero, 1.7 * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(grow);
      };
      requestAnimationFrame(grow);
    }
    if (!reduce && matchMedia('(hover:hover)').matches) {
      const wrap = $('.hero__plan');
      wrap.addEventListener('pointermove', e => {
        const r = wrap.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        hero.stage.style.setProperty('--rz', (-34 + px * 22) + 'deg');
        hero.stage.style.setProperty('--rx', (56 - py * 14) + 'deg');
      });
      wrap.addEventListener('pointerleave', () => {
        hero.stage.style.removeProperty('--rz'); hero.stage.style.removeProperty('--rx');
      });
    }
  }

  /* scene plan */
  const sceneHost = $('#sceneIso');
  const scene = sceneHost ? buildPlan(sceneHost, 14) : null;
  if (scene) setLift(scene, 2.6);
  const BARE = ['#D3D6D1', '#B9BEB8', '#C9C2B2', '#EAE5DA'];
  const sceneRects = scene ? $$('.l-floor .rm', scene.stage) : [];
  const sceneFurn = scene ? $$('.furn', scene.stage) : [];
  const weekEl = $('#wayWeek');
  const steps = $$('.way__step');
  const way = $('#way');
  let shown = -1, lastWeek = -1;

  function updateWay() {
    if (!way || !scene) return;
    const r = way.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = Math.max(0, Math.min(1, -r.top / total));
    const prog = p * 6;                        // 0..6
    const step = Math.min(5, Math.floor(prog));
    const week = Math.round(p * 15);
    if (week !== lastWeek) { weekEl.textContent = week; lastWeek = week; }
    if (step !== shown) {
      shown = step;
      steps.forEach((s, i) => s.classList.toggle('is-active', i === step));
    }
    sceneRects.forEach((rect, i) => {
      const local = prog - i * 0.28;
      const s = Math.max(0, Math.min(4, Math.floor(local - 0.4 + 1)));  // rooms trail each other
      rect.style.fill = s >= 4 ? ROOMS[i].c : BARE[Math.min(s, 3)];
    });
    const done = prog > 5.2;
    sceneFurn.forEach((f, i) => { f.style.opacity = prog - i * 0.1 > 5.0 ? 1 : 0; });
    if (!reduce) {
      scene.stage.style.setProperty('--rz', (-46 + p * 24) + 'deg');
      scene.stage.style.setProperty('--rx', (60 - p * 8) + 'deg');
    }
    setLift(scene, 1.2 + Math.min(1, p * 3) * 1.6);
  }

  /* ============ reveal + counters + header ============ */
  const revealEls = $$('[data-reveal]');
  const groups = new Map();
  revealEls.forEach(el => {
    const p = el.parentElement, n = groups.get(p) || 0;
    el.style.setProperty('--d', Math.min(n, 5) * 80 + 'ms');
    groups.set(p, n + 1);
  });
  const countUp = el => {
    const target = parseInt(el.dataset.target, 10);
    if (reduce || Number.isNaN(target)) return;
    const t0 = performance.now(), dur = 1400;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  let ticking = false;
  const check = () => {
    ticking = false;
    const vh = window.innerHeight;
    header?.classList.toggle('scrolled', window.scrollY > 8);
    revealEls.forEach(el => {
      if (el.classList.contains('is-in')) return;
      if (el.getBoundingClientRect().top < vh * .94) {
        el.classList.add('is-in');
        $$('[data-target]', el).forEach(countUp);
      }
    });
    updateWay();
    if (hero && !reduce) {
      const hp = Math.min(1, window.scrollY / (vh * .9));
      hero.stage.style.opacity = 1 - hp * .15;
    }
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  addEventListener('load', req);
  req(); setTimeout(req, 400);

  /* magnetic buttons */
  if (!reduce && matchMedia('(hover:hover)').matches) {
    $$('[data-magnet]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .12}px,${(e.clientY - r.top - r.height / 2) * .25}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ============ calculator ============ */
  const area = $('#area'), areaOut = $('#areaOut');
  const cTotal = $('#cTotal'), cRepair = $('#cRepair'), cDesign = $('#cDesign'), cNote = $('#cNote');
  const val = n => ($(`input[name="${n}"]:checked`) || {}).value;
  let shownTotal = 1200000, anim;
  let summary = '';
  const calc = () => {
    const a = +area.value, kind = val('kind'), where = val('where'), des = val('design');
    areaOut.textContent = a;
    let repair, note;
    if (kind === 'cap') {
      repair = a * 20000;
      note = 'Сумма «от»: итог зависит от состояния квартиры и выбранных материалов.';
    } else {
      repair = where === 'out' ? 800000 : 500000;
      note = 'Косметический и черновой ремонт: от 500 000 ₽ в пределах МКАД и от 800 000 ₽ за МКАД, до 20 км.';
    }
    const rate = des === 'tech' ? 2390 : des === '3d' ? 3690 : 0;
    const design = a * rate;
    const total = repair + design;
    cRepair.textContent = 'от ' + fmt(repair) + ' ₽';
    cDesign.textContent = rate ? fmt(design) + ' ₽' : 'не нужен';
    cNote.textContent = note;
    const from = shownTotal;
    cancelAnimationFrame(anim);
    if (reduce) { cTotal.textContent = fmt(total); shownTotal = total; }
    else {
      const t0 = performance.now();
      const step = t => {
        const p = Math.min(1, (t - t0) / 450);
        shownTotal = from + (total - from) * (1 - Math.pow(1 - p, 3));
        cTotal.textContent = fmt(shownTotal);
        if (p < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }
    summary = `Калькулятор: ${a} м², ${kind === 'cap' ? 'капитальный' : 'косметический'} ремонт, ${where === 'out' ? 'за МКАД' : 'в пределах МКАД'}, дизайн-проект: ${des === 'tech' ? 'техническая часть' : des === '3d' ? 'с 3D' : 'не нужен'}, ориентир от ${fmt(total)} ₽`;
  };
  $$('#calc input').forEach(i => i.addEventListener('input', calc));
  calc();
  $('#calcGo')?.addEventListener('click', () => {
    const f = $('#fArea');
    if (f && !f.value) f.value = `${area.value} м²`;
    $('#calcField').value = summary;
  });

  /* ============ form → Worker → Telegram ============ */
  const form = $('#leadForm'), note = $('#formNote');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.querySelector('span'), orig = label.textContent;
    const fd = new FormData(form), payload = {};
    fd.forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone) { note.textContent = 'Заполните имя и телефон или Telegram'; return; }
    if (!form.consent.checked) { note.textContent = 'Нужно согласие на обработку данных'; return; }
    delete payload.consent;
    if (!payload.calc) payload.calc = summary;
    btn.disabled = true; label.textContent = 'Отправляем…'; note.textContent = '';
    try {
      const resp = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      label.textContent = 'Заявка отправлена';
      note.textContent = 'Спасибо! Мы свяжемся с вами и договоримся о времени замера.';
      form.reset();
    } catch (err) {
      console.error(err);
      label.textContent = 'Ошибка, попробуйте ещё раз';
      note.textContent = 'Не удалось отправить. Напишите нам в Telegram: @sk_ludi';
    } finally {
      setTimeout(() => { label.textContent = orig; btn.disabled = false; }, 3500);
    }
  });
})();
