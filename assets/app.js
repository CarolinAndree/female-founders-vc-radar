// Seite „Kapital“: VC-Fonds, Angel-Netzwerke, Programme.
// Zeichnen: render.js (RV), Seiten-Helfer: common.js (RC).
(function () {
  'use strict';
  const { FOCUS_MARK, vcRow, vcCard, vcCount } = window.RV;
  const { $, fillSelect, chipsHtml, nextSort, markSort, actions } = window.RC;

  const DATA = (window.VC_DATA || []).slice();
  const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Growth'];
  const REGION_LABEL = {
    ALL: 'Alle', Deutschland: 'Deutschland', Europa: 'Europa (ohne DE)', WORLD: 'Rest der Welt',
    Nordamerika: 'Nordamerika', 'Asien-Pazifik': 'Asien-Pazifik', Afrika: 'Afrika', Weltweit: 'Weltweit (global)'
  };

  const state = { region: 'ALL', flags: { exclusive: false, email: false }, sort: { key: null, dir: 1 }, open: new Set(), advanced: false };

  // ───────── Filtern & Sortieren ─────────
  function inRegion(d, r) {
    if (r === 'ALL') return true;
    if (r === 'WORLD') return d.region !== 'Deutschland' && d.region !== 'Europa';
    return d.region === r;
  }

  function baseFiltered(ignoreCountry) {
    const q = $('searchInput').value.trim().toLowerCase();
    const country = $('fCountry').value, stage = $('fStage').value, focus = $('fFocus').value, type = $('fType').value;
    return DATA.filter(d => {
      if (!inRegion(d, state.region)) return false;
      if (!ignoreCountry && country !== 'ALL' && d.country !== country) return false;
      if (stage !== 'ALL' && !d.stages.includes(stage)) return false;
      if (focus !== 'ALL' && d.focus !== focus) return false;
      if (type !== 'ALL' && d.type !== type) return false;
      if (q) {
        const hay = [d.name, d.city, d.country, d.region, d.sectors, d.criterion, d.description, d.focus, d.email,
          ...(d.people || []).map(p => p.name + ' ' + p.role)].join(' ').toLowerCase();
        if (!q.split(/\s+/).every(t => hay.includes(t))) return false;
      }
      return true;
    });
  }

  const applyFlags = list => list.filter(d =>
    (!state.flags.exclusive || d.focus === 'Nur Gründerinnen') && (!state.flags.email || d.email));

  function sortList(list) {
    const { key, dir } = state.sort;
    if (!key) return list;
    const v = d => ({
      name: d.name.toLowerCase(),
      focus: Object.keys(FOCUS_MARK).indexOf(d.focus), stage: Math.min(...d.stages.map(s => STAGES.indexOf(s))),
      ticket: d.ticket ? 0 : 1
    }[key]);
    return list.slice().sort((a, b) => (v(a) > v(b) ? 1 : v(a) < v(b) ? -1 : 0) * dir);
  }

  function activeFilters() {
    const out = [];
    const q = $('searchInput').value.trim();
    if (q) out.push(['search', 'Suche: ' + q]);
    if (state.flags.exclusive) out.push(['exclusive', 'Nur Gründerinnen']);
    if (state.flags.email) out.push(['email', 'Mit E-Mail']);
    if (state.region !== 'ALL') out.push(['region', REGION_LABEL[state.region] || state.region]);
    [['fCountry', 'country'], ['fStage', 'stage'], ['fFocus', 'focus'], ['fType', 'type']].forEach(([id, key]) => {
      const v = $(id).value;
      if (v !== 'ALL') out.push([key, v]);
    });
    return out;
  }

  // ───────── Zeichnen ─────────
  function render() {
    const countries = [...new Set(baseFiltered(true).map(d => d.country))].sort((a, b) => a.localeCompare(b, 'de'));
    fillSelect('fCountry', 'Alle Länder', countries);
    $('fRegion').value = state.region;

    const list = sortList(applyFlags(baseFiltered(false)));

    $('statTotal').textContent = list.length;
    $('statLabel').textContent = vcCount(list.length, DATA.length);
    $('pillExclusive').classList.toggle('is-active', state.flags.exclusive);
    $('pillEmail').classList.toggle('is-active', state.flags.email);
    document.querySelectorAll('[data-action="setRegion"]').forEach(b => b.classList.toggle('is-active', state.region === b.dataset.arg));
    $('advFilters').classList.toggle('hidden', !state.advanced);
    $('advFilters').classList.toggle('grid', state.advanced);
    $('advToggle').textContent = state.advanced ? 'Weniger Filter −' : 'Weitere Filter +';
    $('advToggle').setAttribute('aria-expanded', String(state.advanced));
    markSort(state.sort);
    $('chips').innerHTML = chipsHtml(activeFilters());

    $('emptyState').classList.toggle('hidden', list.length > 0);
    $('tableWrap').classList.toggle('md:block', list.length > 0);
    $('mobileList').classList.toggle('hidden', list.length === 0);

    $('tbody').innerHTML = list.map(d => vcRow(d, state.open.has(d.id))).join('');
    $('mobileList').innerHTML = list.map(d => vcCard(d, state.open.has(d.id))).join('');
  }

  // ───────── Aktionen ─────────
  function exportCSV() {
    const list = sortList(applyFlags(baseFiltered(false)));
    const cols = ['Name', 'Region', 'Land', 'Stadt', 'Art', 'Fokus', 'Kriterium', 'Gründerinnen-Quote', 'Phasen', 'Ticket', 'Branchen', 'Website', 'E-Mail', 'Ansprechpartner'];
    // Schutz vor Formel-Injection in Excel: Zellen, die (nach Leerzeichen) mit = + - @ | beginnen, werden entschärft
    const q = v => { let s = String(v ?? ''); if (/^[\s]*[=+\-@|]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const rows = list.map(d => [d.name, d.region, d.country, d.city, d.type, d.focus, d.criterion, d.quota, d.stages.join(' / '), d.ticket, d.sectors, d.website, d.email,
      (d.people || []).map(p => p.name + ' (' + p.role + ')').join('; ')].map(q).join(';'));
    const blob = new Blob(['﻿' + [cols.map(q).join(';'), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'female-founders-vc-radar.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function resetFilters() {
    $('searchInput').value = '';
    ['fCountry', 'fStage', 'fFocus', 'fType'].forEach(id => { $(id).value = 'ALL'; });
    state.region = 'ALL';
    state.flags.exclusive = false;
    state.flags.email = false;
    render();
  }

  function clearFilter(key) {
    const sel = { country: 'fCountry', stage: 'fStage', focus: 'fFocus', type: 'fType' }[key];
    if (key === 'search') $('searchInput').value = '';
    else if (key === 'region') { state.region = 'ALL'; $('fCountry').value = 'ALL'; }
    else if (key in state.flags) state.flags[key] = false;
    else if (sel) $(sel).value = 'ALL';
    render();
  }

  Object.assign(actions, {
    exportCSV, resetFilters,
    toggleAdvanced: () => { state.advanced = !state.advanced; render(); },
    setRegion: r => { state.region = state.region === r ? 'ALL' : r; $('fCountry').value = 'ALL'; render(); },
    toggleFlag: f => { if (f in state.flags) { state.flags[f] = !state.flags[f]; render(); } }
  });

  // Seitenspezifische Klicks: Chip entfernen, sortieren, Zeile aufklappen
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
  fillSelect('fRegion', 'Alle', ['Deutschland', 'Europa', 'WORLD', 'Nordamerika', 'Asien-Pazifik', 'Afrika', 'Weltweit'], v => REGION_LABEL[v]);
  fillSelect('fStage', 'Alle', STAGES);
  fillSelect('fFocus', 'Alle', Object.keys(FOCUS_MARK));
  fillSelect('fType', 'Alle', [...new Set(DATA.map(d => d.type))].sort());
  $('searchInput').addEventListener('input', render);
  $('fRegion').addEventListener('change', e => { state.region = e.target.value; $('fCountry').value = 'ALL'; render(); });
  ['fCountry', 'fStage', 'fFocus', 'fType'].forEach(id => $(id).addEventListener('change', render));

  render();
})();
