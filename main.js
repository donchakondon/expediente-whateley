/* =============================
   MAIN — Router, renderers, lógica del cofre
   ============================= */

(() => {
  // ---------------------------------------------------------------
  // Router (basado en hash)
  // ---------------------------------------------------------------
  const ROUTES = ['entry', 'hub', 'decreto', 'informe', 'hemeroteca', 'parroco', 'mapa', 'carta', 'archivo'];

  function getRouteFromHash() {
    const h = (location.hash || '').replace(/^#\/?/, '');
    return ROUTES.includes(h) ? h : 'entry';
  }

  function navigate(route) {
    if (!ROUTES.includes(route)) return;
    if (location.hash !== '#' + route) {
      location.hash = '#' + route;
    } else {
      showRoute(route);
    }
  }

  function showRoute(route) {
    document.querySelectorAll('.route').forEach(el => {
      el.classList.toggle('is-active', el.getAttribute('data-route') === route);
    });
    document.body.classList.toggle('is-entry', route === 'entry');
    window.scrollTo(0, 0);
  }

  function setupRouter() {
    window.addEventListener('hashchange', () => showRoute(getRouteFromHash()));
    showRoute(getRouteFromHash());
    // Botones con data-go="ruta"
    document.body.addEventListener('click', e => {
      const trigger = e.target.closest('[data-go]');
      if (!trigger) return;
      e.preventDefault();
      navigate(trigger.getAttribute('data-go'));
    });
    // Enlaces back-link con href="#xxx"
    document.querySelectorAll('a.back-link').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        navigate(a.getAttribute('data-go') || 'hub');
      });
    });
  }

  // ---------------------------------------------------------------
  // Sonido ambiente
  // ---------------------------------------------------------------
  function setupSound() {
    const toggle = document.getElementById('sound-toggle');
    const audio = document.getElementById('ambient-audio');
    if (!toggle || !audio) return;

    let muted = true;
    audio.muted = true;
    audio.volume = 0.35;
    toggle.classList.add('is-muted');

    toggle.addEventListener('click', () => {
      muted = !muted;
      audio.muted = muted;
      toggle.classList.toggle('is-muted', muted);
      if (!muted) audio.play().catch(() => {});
    });
  }

  // ---------------------------------------------------------------
  // Renderers — se vuelven a ejecutar al cambiar idioma
  // ---------------------------------------------------------------
  const HUB_ICONS = {
    decreto: '♛',
    informe: '✉',
    hemeroteca: '❘❘',
    parroco: '†',
    mapa: '✦',
    carta: '✍',
    archivo: '⎈'
  };
  const HUB_ORDER = ['decreto', 'informe', 'hemeroteca', 'parroco', 'mapa', 'carta', 'archivo'];

  function renderHub(dict) {
    const grid = document.getElementById('hub-grid');
    if (!grid || !dict.hub) return;
    grid.innerHTML = '';
    const items = dict.hub.items || {};
    HUB_ORDER.forEach(key => {
      const item = items[key];
      if (!item) return;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'hub-card';
      card.setAttribute('data-go', key);
      const isLocked = key === 'archivo';
      card.innerHTML = `
        <span class="hub-card-icon" aria-hidden="true">${HUB_ICONS[key] || '·'}</span>
        <span class="hub-card-label">${escapeHtml(item.label)}</span>
        <span class="hub-card-hint">${escapeHtml(item.hint)}</span>
        ${isLocked ? '<span class="hub-card-locked" aria-hidden="true">⚿</span>' : ''}
      `;
      grid.appendChild(card);
    });
  }

  function renderDecreto(dict) {
    const wrap = document.getElementById('decreto-body');
    if (!wrap || !dict.decreto) return;
    const paragraphs = dict.decreto.body || [];
    wrap.innerHTML = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
  }

  function renderInforme(dict) {
    const wrap = document.getElementById('informe-body');
    if (!wrap || !dict.informe) return;
    const sections = dict.informe.sections || [];
    wrap.innerHTML = sections.map(s => `
      <div class="paper-section ${s.emphasis ? 'paper-section-emphasis' : ''}">
        <h3 class="paper-section-heading">${escapeHtml(s.heading)}</h3>
        <p>${escapeHtml(s.body)}</p>
      </div>
    `).join('');
  }

  function renderHemeroteca(dict) {
    const wrap = document.getElementById('hemeroteca-list');
    if (!wrap || !dict.hemeroteca) return;
    const clippings = dict.hemeroteca.clippings || [];
    wrap.innerHTML = clippings.map(c => `
      <article class="clipping">
        <div class="clipping-source">${escapeHtml(c.source)}</div>
        <h2 class="clipping-headline">${escapeHtml(c.headline)}</h2>
        <p class="clipping-body">${escapeHtml(c.body)}</p>
      </article>
    `).join('');
  }

  function renderMapa(dict) {
    const wrap = document.getElementById('mapa-locations');
    if (!wrap || !dict.mapa) return;
    const locations = dict.mapa.locations || [];
    wrap.innerHTML = locations.map(l => `
      <div class="mapa-location" data-loc-card="${escapeAttr(l.id)}">
        <div class="mapa-location-label">${escapeHtml(l.label)}</div>
        <div class="mapa-location-note">${escapeHtml(l.note)}</div>
      </div>
    `).join('');

    // Toggle al pulsar
    wrap.querySelectorAll('.mapa-location').forEach(card => {
      card.addEventListener('click', () => {
        const wasOpen = card.classList.contains('is-open');
        wrap.querySelectorAll('.mapa-location').forEach(c => c.classList.remove('is-open'));
        if (!wasOpen) card.classList.add('is-open');
        // Sincroniza pin
        const id = card.getAttribute('data-loc-card');
        document.querySelectorAll('.map-pin').forEach(p => {
          p.classList.toggle('is-active', !wasOpen && p.getAttribute('data-loc') === id);
        });
      });
    });

    // También permitir activar desde los pines del SVG
    document.querySelectorAll('.map-pin').forEach(pin => {
      pin.addEventListener('click', () => {
        const id = pin.getAttribute('data-loc');
        const card = wrap.querySelector(`[data-loc-card="${id}"]`);
        if (card) card.click();
      });
    });
  }

  function renderCarta(dict) {
    const wrap = document.getElementById('carta-body');
    if (!wrap || !dict.carta) return;
    const paragraphs = dict.carta.body || [];
    wrap.innerHTML = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
  }

  function renderWhateley(dict) {
    const wrap = document.getElementById('whateley-body');
    if (!wrap || !dict.archivo || !dict.archivo.unlocked) return;
    const paragraphs = (dict.archivo.unlocked.letter && dict.archivo.unlocked.letter.body) || [];
    wrap.innerHTML = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
  }

  // ---------------------------------------------------------------
  // Cofre — secuencia de 5 símbolos
  // ---------------------------------------------------------------
  const COFRE_KEY = 'expediente.archivo.unlocked';
  const SOLUTION = ['hexagono', 'circulo', 'pentagono', 'triangulo', 'cuadrado'];
  let pressed = [];

  function isUnlocked() {
    try { return localStorage.getItem(COFRE_KEY) === '1'; } catch (_) { return false; }
  }
  function setUnlocked() {
    try { localStorage.setItem(COFRE_KEY, '1'); } catch (_) {}
  }

  function renderCofreUI() {
    const lockedBlock = document.getElementById('archivo-locked');
    const unlockedBlock = document.getElementById('archivo-unlocked');
    if (!lockedBlock || !unlockedBlock) return;
    const open = isUnlocked();
    lockedBlock.classList.toggle('is-hidden', open);
    unlockedBlock.classList.toggle('is-hidden', !open);
  }

  function setupCofre() {
    const cofre = document.querySelector('.cofre');
    const buttons = document.querySelectorAll('.cofre-symbol');
    const slots = document.querySelectorAll('.cofre-slot');
    const msg = document.getElementById('cofre-msg');
    const reset = document.getElementById('cofre-reset');
    if (!cofre || !buttons.length) return;

    function updateSlots() {
      slots.forEach((slot, i) => {
        slot.classList.toggle('is-filled', i < pressed.length);
        slot.classList.remove('is-error');
      });
    }

    function clearMsg() {
      msg.textContent = '';
      msg.classList.remove('is-error', 'is-success');
    }

    function fail() {
      const errMsg = I18N.pluck('archivo.errorMsg') || 'Combinación incorrecta.';
      msg.textContent = errMsg;
      msg.classList.add('is-error');
      cofre.classList.add('is-error');
      slots.forEach(s => s.classList.add('is-error'));
      reset.classList.remove('is-hidden');
      setTimeout(() => cofre.classList.remove('is-error'), 600);
    }

    function success() {
      const okMsg = I18N.pluck('archivo.successMsg') || 'Cofre abierto.';
      msg.textContent = okMsg;
      msg.classList.add('is-success');
      cofre.classList.add('is-open');
      setUnlocked();
      setTimeout(() => {
        renderCofreUI();
      }, 1200);
    }

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (cofre.classList.contains('is-open') || cofre.classList.contains('is-error')) return;
        const sym = btn.getAttribute('data-symbol');
        pressed.push(sym);
        btn.classList.add('is-pressed');
        setTimeout(() => btn.classList.remove('is-pressed'), 250);
        clearMsg();
        updateSlots();

        // Verificar si el último presionado coincide
        const idx = pressed.length - 1;
        if (pressed[idx] !== SOLUTION[idx]) {
          // Falló — esperar a que termine la animación de pulsado y mostrar error
          setTimeout(() => fail(), 200);
          return;
        }
        if (pressed.length === SOLUTION.length) {
          setTimeout(() => success(), 250);
        }
      });
    });

    reset.addEventListener('click', () => {
      pressed = [];
      cofre.classList.remove('is-error', 'is-open');
      reset.classList.add('is-hidden');
      clearMsg();
      updateSlots();
    });
  }

  // ---------------------------------------------------------------
  // Util
  // ---------------------------------------------------------------
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ---------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    setupRouter();
    setupSound();
    setupCofre();
    renderCofreUI();

    I18N.onChange((dict) => {
      renderHub(dict);
      renderDecreto(dict);
      renderInforme(dict);
      renderHemeroteca(dict);
      renderMapa(dict);
      renderCarta(dict);
      renderWhateley(dict);
    });
  });
})();
