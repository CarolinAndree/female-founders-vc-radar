// Seite „Kapital“: VC-Fonds, Angel-Netzwerke, Programme. Nutzt die Bausteine aus common.js.
(function () {
  'use strict';
  const { $, esc, liSearch, liCompany, host, extLink, ICON, fillSelect, fact, chipsHtml, nextSort, markSort, actions } = window.RC;

  const DATA = (window.VC_DATA || []).slice();
  const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Growth'];
  const REGION_LABEL = {
    ALL: 'Alle', Deutschland: 'Deutschland', Europa: 'Europa (ohne DE)', WORLD: 'Rest der Welt',
    Nordamerika: 'Nordamerika', 'Asien-Pazifik': 'Asien-Pazifik', Afrika: 'Afrika', Weltweit: 'Weltweit (global)'
  };
  // Fokus-Kategorie als typografische Markierung statt Farbfläche
  const FOCUS_MARK = { 'Nur Gründerinnen': 'mark-nur', 'Gründerinnen-Quote': 'mark-quote' };

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

  // ───────── Bausteine ─────────
  const focusTag = d => '<span class="tag"><span class="mark ' + (FOCUS_MARK[d.focus] || '') + '"></span>' + esc(d.focus) + '</span>';
  const stageText = d => '<span class="font-mono text-xs">' + d.stages.map(esc).join(' / ') + '</span>';

  function contactIcons(d) {
    let h = extLink(d.website, 'icon-btn', ICON.web, 'Website: ' + host(d.website));
    if (d.email) {
      h += extLink('mailto:' + d.email, 'icon-btn', ICON.mail, 'E-Mail an ' + d.email);
      h += '<button type="button" class="icon-btn" data-copy="' + esc(d.email) + '" title="E-Mail kopieren" aria-label="E-Mail ' + esc(d.email) + ' kopieren">' + ICON.copy + '</button>';
    }
    const p = (d.people || [])[0];
    h += p
      ? extLink(p.linkedin || liSearch(p.name + ' ' + d.name), 'icon-btn', ICON.li, 'LinkedIn: ' + p.name)
      : extLink(liCompany(d.name), 'icon-btn', ICON.li, 'LinkedIn-Suche: ' + d.name);
    return '<div class="flex flex-wrap gap-1">' + h + '</div>';
  }

  // Aufgeklappter Eintrag: Editorial-Layout aus Text-, Fakten- und Personenspalte
  function details(d) {
    const people = (d.people || []).length
      ? d.people.map(p =>
          '<li class="border-t border-ink/20 py-2.5">' +
            extLink(p.linkedin || liSearch(p.name + ' ' + d.name), 'font-semibold hover:text-accent', esc(p.name) + ' ↗') +
            '<div class="label mt-1 normal-case tracking-normal">' + esc(p.role) + (p.linkedin ? '' : ' · LinkedIn-Suche') + '</div>' +
          '</li>').join('')
      : '<li class="border-t border-ink/20 py-2.5 text-ink/60">Keine Person hinterlegt. ' + extLink(liCompany(d.name), 'underline underline-offset-4 hover:text-accent', 'Auf LinkedIn suchen ↗') + '</li>';

    return '<div class="grid grid-cols-12 gap-x-8 gap-y-8 py-8 text-sm cursor-default">' +
      '<div class="col-span-12 lg:col-span-5">' +
        '<p class="label mb-3">Über</p>' +
        (d.description ? '<p class="text-lg leading-relaxed">' + esc(d.description) + '</p>' : '') +
        '<div class="mt-6 border border-accent p-4">' +
          '<p class="label text-accent">Investment-Kriterium</p>' +
          '<p class="mt-2 text-base font-semibold leading-snug">' + esc(d.criterion) + '</p>' +
        '</div>' +
        '<div class="mt-6 flex flex-wrap gap-2">' +
          extLink(d.website, 'btn btn-accent', esc(host(d.website)) + ' ↗') +
          (d.contactUrl ? extLink(d.contactUrl, 'btn', 'Kontakt / Pitch ↗') : '') +
        '</div>' +
      '</div>' +
      '<div class="col-span-12 sm:col-span-7 lg:col-span-4">' +
        '<p class="label mb-3">Eckdaten</p>' +
        '<dl class="border-b border-ink/20">' +
          fact('Standort', esc([d.city, d.country].filter(Boolean).join(', '))) +
          fact('Art', esc(d.type)) +
          fact('Gründerinnen-Quote', esc(d.quota)) +
          fact('Phase', esc(d.stages.join(' / '))) +
          fact('Branchen', esc(d.sectors)) +
          fact('Ticket', esc(d.ticket)) +
          fact('Fondsgröße', esc(d.fundSize)) +
          fact('E-Mail', d.email ? extLink('mailto:' + d.email, 'font-mono text-xs underline underline-offset-4 break-all hover:text-accent', esc(d.email)) : '') +
        '</dl>' +
      '</div>' +
      '<div class="col-span-12 sm:col-span-5 lg:col-span-3">' +
        '<p class="label mb-3">Ansprechpartner:innen</p>' +
        '<ul class="border-b border-ink/20">' + people + '</ul>' +
      '</div>' +
    '</div>';
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
    $('statLabel').textContent = (list.length === 1 ? 'Eintrag' : 'Einträge') + ' gefunden' + (list.length === DATA.length ? '' : ' von ' + DATA.length);
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

    $('tbody').innerHTML = list.map(d => {
      const open = state.open.has(d.id);
      return '<tr data-toggle="' + esc(d.id) + '" class="cursor-pointer border-b border-ink/20 align-top hover:bg-ink/5 ' + (open ? 'open' : '') + '">' +
          '<td class="py-4 pr-4"><div class="text-base font-bold leading-tight tracking-tight">' + esc(d.name) + '</div>' +
            '<div class="mt-1 text-xs text-ink/55">' + esc([d.city, d.country].filter(Boolean).join(', ') || d.region) + ' · ' + esc(d.type) + '</div></td>' +
          '<td class="py-4 pr-4">' + focusTag(d) + '</td>' +
          '<td class="py-4 pr-4">' + stageText(d) + '</td>' +
          '<td class="py-4 pr-4 max-w-[200px] text-xs">' + (esc(d.ticket) || '<span class="text-ink/35">k. A.</span>') + '</td>' +
          '<td class="py-4 pr-4">' + contactIcons(d) + '</td>' +
          '<td class="py-4 text-right font-mono text-lg leading-none"><span class="toggle-sign" aria-hidden="true"></span></td></tr>' +
        (open ? '<tr class="border-b border-ink"><td colspan="6">' + details(d) + '</td></tr>' : '');
    }).join('');

    $('mobileList').innerHTML = list.map(d => {
      const open = state.open.has(d.id);
      return '<article class="border-b border-ink/20 py-5 ' + (open ? 'open' : '') + '">' +
          '<div class="flex cursor-pointer items-start justify-between gap-4" data-toggle="' + esc(d.id) + '">' +
            '<div class="min-w-0"><p class="text-lg font-bold leading-tight tracking-tight">' + esc(d.name) + '</p>' +
              '<p class="mt-1 text-xs text-ink/55">' + esc([d.city, d.country].filter(Boolean).join(', ')) + ' · ' + esc(d.type) + '</p></div>' +
            '<span class="toggle-sign font-mono text-xl leading-none" aria-hidden="true"></span>' +
          '</div>' +
          '<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">' + focusTag(d) + stageText(d) + '</div>' +
          '<div class="mt-3">' + contactIcons(d) + '</div>' +
          (open ? '<div class="mt-2 border-t border-ink">' + details(d) + '</div>' : '') +
        '</article>';
    }).join('');
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
