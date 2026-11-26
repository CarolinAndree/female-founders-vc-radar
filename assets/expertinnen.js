// Seite „Expertinnen“: Anwältinnen, Notarinnen, Beraterinnen. Nutzt die Bausteine aus common.js.
(function () {
  'use strict';
  const { $, esc, extLink, ICON, fillSelect, fact, chipsHtml, nextSort, markSort, actions } = window.RC;

  const DATA = (window.EXPERT_DATA || []).slice();
  const PHASES = ['Gründen', 'Finanzieren', 'Wachsen', 'Verkaufen'];
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

  // ───────── Bausteine ─────────
  const contact = e => '<div class="flex flex-wrap gap-1">' + (e.linkedin ? extLink(e.linkedin, 'icon-btn', ICON.li, 'LinkedIn: ' + e.name) : '') + '</div>';

  function details(e) {
    return '<div class="grid grid-cols-12 gap-x-8 gap-y-8 py-8 text-sm cursor-default">' +
      '<div class="col-span-12 lg:col-span-5">' +
        '<p class="label mb-3">Schwerpunkt</p>' +
        '<p class="text-lg leading-relaxed">' + esc(e.roles.join(' & ')) + ' mit Schwerpunkt ' + esc(e.fields.join(', ')) + '.</p>' +
        '<div class="mt-6 flex flex-wrap gap-2">' +
          (e.linkedin ? extLink(e.linkedin, 'btn btn-accent', 'LinkedIn-Profil ↗') : '') +
        '</div>' +
      '</div>' +
      '<div class="col-span-12 lg:col-span-7">' +
        '<p class="label mb-3">Eckdaten</p>' +
        '<dl class="border-b border-ink/20">' +
          fact('Rolle', esc(e.roles.join(', '))) +
          fact('Fachgebiet', esc(e.fields.join(', '))) +
          fact('Phase', esc(e.phases.join(' / '))) +
          fact('Ort', esc([e.city, e.country].filter(Boolean).join(', '))) +
          fact('Kanzlei', esc(e.firm)) +
          fact('Auszeichnung', esc(e.recognition)) +
        '</dl>' +
      '</div>' +
    '</div>';
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
    $('statLabel').textContent = (list.length === 1 ? 'Expertin' : 'Expertinnen') + (list.length === DATA.length ? '' : ' von ' + DATA.length);
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

    $('tbody').innerHTML = list.map(e => {
      const open = state.open.has(e.id);
      return '<tr data-toggle="' + esc(e.id) + '" class="cursor-pointer border-b border-ink/20 align-top hover:bg-ink/5 ' + (open ? 'open' : '') + '">' +
          '<td class="py-4 pr-4"><div class="text-base font-bold leading-tight tracking-tight">' + esc(e.name) + '</div>' +
            '<div class="mt-1 text-xs text-ink/55">' + esc([e.city, e.country].filter(Boolean).join(', ')) + (e.firm ? ' · ' + esc(e.firm) : '') + '</div></td>' +
          '<td class="py-4 pr-4">' + esc(e.roles.join(' & ')) + '</td>' +
          '<td class="py-4 pr-4"><span class="tag">' + esc(e.fields.join(', ')) + '</span></td>' +
          '<td class="py-4 pr-4"><span class="font-mono text-xs">' + e.phases.map(esc).join(' / ') + '</span></td>' +
          '<td class="py-4 pr-4">' + contact(e) + '</td>' +
          '<td class="py-4 text-right font-mono text-lg leading-none"><span class="toggle-sign" aria-hidden="true"></span></td></tr>' +
        (open ? '<tr class="border-b border-ink"><td colspan="6">' + details(e) + '</td></tr>' : '');
    }).join('');

    $('mobileList').innerHTML = list.map(e => {
      const open = state.open.has(e.id);
      return '<article class="border-b border-ink/20 py-5 ' + (open ? 'open' : '') + '">' +
          '<div class="flex cursor-pointer items-start justify-between gap-4" data-toggle="' + esc(e.id) + '">' +
            '<div class="min-w-0"><p class="text-lg font-bold leading-tight tracking-tight">' + esc(e.name) + '</p>' +
              '<p class="mt-1 text-xs text-ink/55">' + esc(e.roles.join(' & ')) + ' · ' + esc(e.city) + '</p></div>' +
            '<span class="toggle-sign font-mono text-xl leading-none" aria-hidden="true"></span>' +
          '</div>' +
          '<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs"><span class="tag">' + esc(e.fields.join(', ')) + '</span><span class="font-mono">' + e.phases.map(esc).join(' / ') + '</span></div>' +
          '<div class="mt-3">' + contact(e) + '</div>' +
          (open ? '<div class="mt-2 border-t border-ink">' + details(e) + '</div>' : '') +
        '</article>';
    }).join('');
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
