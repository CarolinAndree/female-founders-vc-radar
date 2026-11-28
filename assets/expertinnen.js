// Seite „Expertinnen“: Anwältinnen, Notarinnen, Beraterinnen.
// Zeichnen: render.js (RV), Seiten-Helfer: common.js (RC).
(function () {
  'use strict';
  const { esc, expertRow, expertCard, expertCount } = window.RV;
  const { $, fillSelect, chipsHtml, nextSort, markSort, actions } = window.RC;

  const DATA = (window.EXPERT_DATA || []).slice();
  const PHASES = ['Gründung', 'Finanzierung', 'Wachstum', 'Exit'];
  const ROLES = [...new Set(DATA.flatMap(e => e.roles))].sort((a, b) => a.localeCompare(b, 'de'));
  const FIELDS = [...new Set(DATA.flatMap(e => e.fields))].sort((a, b) => a.localeCompare(b, 'de'));
  const CITIES = [...new Set(DATA.map(e => e.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));

  const state = { role: 'ALL', sort: { key: null, dir: 1 }, open: new Set(), advanced: false };

  // ───────── Filtern & Sortieren ─────────
  function filtered() {
    const q = $('searchInput').value.trim().toLowerCase();
    const phase = $('fPhase').value, field = $('fField').value, city = $('fCity').value;
    return DATA.filter(e => {
      if (state.role !== 'ALL' && !e.roles.includes(state.role)) return false;
      if (phase !== 'ALL' && !e.phases.includes(phase)) return false;
      if (field !== 'ALL' && !e.fields.includes(field)) return false;
      if (city !== 'ALL' && e.city !== city) return false;
      if (q) {
        const hay = [e.name, e.city, e.country, e.firm, e.recognition, ...e.roles, ...e.fields, ...e.phases].join(' ').toLowerCase();
        if (!q.split(/\s+/).every(t => hay.includes(t))) return false;
      }
      return true;
    });
  }

  function sortList(list) {
    const { key, dir } = state.sort;
    if (!key) return list;
    const v = e => ({
      name: e.name.replace(/^Dr\.\s*/, '').toLowerCase(),
      role: e.roles.join(' '), field: e.fields.join(' '),
      phase: Math.min(...e.phases.map(p => PHASES.indexOf(p)))
    }[key]);
    return list.slice().sort((a, b) => (v(a) > v(b) ? 1 : v(a) < v(b) ? -1 : 0) * dir);
  }

  function activeFilters() {
    const out = [];
    const q = $('searchInput').value.trim();
    if (q) out.push(['search', 'Suche: ' + q]);
    if (state.role !== 'ALL') out.push(['role', state.role]);
    [['fPhase', 'phase'], ['fField', 'field'], ['fCity', 'city']].forEach(([id, key]) => {
      const v = $(id).value;
      if (v !== 'ALL') out.push([key, v]);
    });
    return out;
  }

  // ───────── Zeichnen ─────────
  function render() {
    const list = sortList(filtered());

    $('statTotal').textContent = list.length;
    $('statLabel').textContent = expertCount(list.length, DATA.length);
    document.querySelectorAll('[data-action="setRole"]').forEach(b => b.classList.toggle('is-active', state.role === b.dataset.arg));
    $('advFilters').classList.toggle('hidden', !state.advanced);
    $('advFilters').classList.toggle('grid', state.advanced);
    $('advToggle').textContent = state.advanced ? 'Weniger Filter −' : 'Weitere Filter +';
    $('advToggle').setAttribute('aria-expanded', String(state.advanced));
    markSort(state.sort);
    $('chips').innerHTML = chipsHtml(activeFilters());

    $('emptyState').classList.toggle('hidden', list.length > 0);
    $('tableWrap').classList.toggle('md:block', list.length > 0);
    $('mobileList').classList.toggle('hidden', list.length === 0);

    $('tbody').innerHTML = list.map(e => expertRow(e, state.open.has(e.id))).join('');
    $('mobileList').innerHTML = list.map(e => expertCard(e, state.open.has(e.id))).join('');
  }

  // ───────── Aktionen ─────────
  function resetFilters() {
    $('searchInput').value = '';
    ['fPhase', 'fField', 'fCity'].forEach(id => { $(id).value = 'ALL'; });
    state.role = 'ALL';
    render();
  }

  function clearFilter(key) {
    const sel = { phase: 'fPhase', field: 'fField', city: 'fCity' }[key];
    if (key === 'search') $('searchInput').value = '';
    else if (key === 'role') state.role = 'ALL';
    else if (sel) $(sel).value = 'ALL';
    render();
  }

  Object.assign(actions, {
    resetFilters,
    toggleAdvanced: () => { state.advanced = !state.advanced; render(); },
    setRole: r => { state.role = state.role === r ? 'ALL' : r; render(); }
  });

  window.RC.onClick = e => {
    const clear = e.target.closest('[data-clear]');
    if (clear) return clearFilter(clear.dataset.clear);
    const th = e.target.closest('th[data-sort]');
    if (th) { state.sort = nextSort(state.sort, th.dataset.sort); return render(); }
    if (e.target.closest('a, select, input, button')) return;
    const row = e.target.closest('[data-toggle]');
    if (row) {
      const id = row.dataset.toggle;
      state.open.has(id) ? state.open.delete(id) : state.open.add(id);
      render();
    }
  };

  // ───────── Start ─────────
  $('rolePills').innerHTML = ROLES.map(r => '<button type="button" class="pill" data-action="setRole" data-arg="' + esc(r) + '">' + esc(r) + '</button>').join('');
  fillSelect('fPhase', 'Alle', PHASES);
  fillSelect('fField', 'Alle', FIELDS);
  fillSelect('fCity', 'Alle', CITIES);
  $('searchInput').addEventListener('input', render);
  ['fPhase', 'fField', 'fCity'].forEach(id => $(id).addEventListener('change', render));

  render();
})();
