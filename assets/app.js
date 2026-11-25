// Female Founders VC Radar
// Läuft komplett im Browser: keine Cookies, kein Speicher, keine Anfragen an andere Server.
(function () {
  'use strict';

  // ───────── Daten & Zustand ─────────
  const DATA = (window.VC_DATA || []).slice();
  const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Growth'];
  const REGION_CYCLE = ['ALL', 'Deutschland', 'Europa', 'WORLD'];
  const REGION_LABEL = {
    ALL: 'Alle', Deutschland: 'Deutschland', Europa: 'Europa (ohne DE)', WORLD: 'Rest der Welt',
    Nordamerika: 'Nordamerika', 'Asien-Pazifik': 'Asien-Pazifik', Afrika: 'Afrika', Weltweit: 'Weltweit (global)'
  };
  // Fokus-Kategorie als typografische Markierung statt Farbfläche
  const FOCUS_MARK = { 'Exklusiv Gründerinnen': 'mark-exklusiv', 'Gender-Lens': 'mark-lens', 'Diversity': 'mark-diversity' };

  const state = { region: 'ALL', flags: { exclusive: false, email: false }, sort: { key: null, dir: 1 }, open: new Set() };

  // ───────── Helfer ─────────
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Nur https- und mailto-Links zulassen (Schutz gegen javascript:-Links in den Daten)
  const safeUrl = u => (/^(https:\/\/|mailto:)/i.test(String(u || '')) ? esc(u) : '#');
  const liSearch = q => 'https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(q);
  const liCompany = q => 'https://www.linkedin.com/search/results/companies/?keywords=' + encodeURIComponent(q);
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
  const extLink = (href, cls, inner, title) =>
    '<a href="' + safeUrl(href) + '" target="_blank" rel="noopener noreferrer"' + (title ? ' title="' + esc(title) + '"' : '') + ' class="' + cls + '">' + inner + '</a>';
  const pad = n => String(n).padStart(2, '0');

  // ───────── Filter-Auswahl ─────────
  function fillSelect(id, allLabel, values, labelFn) {
    const el = $(id), cur = el.value;
    el.innerHTML = '<option value="ALL">' + esc(allLabel) + '</option>' +
      values.map(v => '<option value="' + esc(v) + '">' + esc(labelFn ? labelFn(v) : v) + '</option>').join('');
    if ([...el.options].some(o => o.value === cur)) el.value = cur;
  }

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
    (!state.flags.exclusive || d.focus === 'Exklusiv Gründerinnen') && (!state.flags.email || d.email));

  function sortList(list) {
    const { key, dir } = state.sort;
    if (!key) return list;
    const v = d => ({
      name: d.name.toLowerCase(), region: d.region + d.country,
      focus: Object.keys(FOCUS_MARK).indexOf(d.focus), stage: Math.min(...d.stages.map(s => STAGES.indexOf(s))),
      ticket: d.ticket ? 0 : 1
    }[key]);
    return list.slice().sort((a, b) => (v(a) > v(b) ? 1 : v(a) < v(b) ? -1 : 0) * dir);
  }

  // ───────── Bausteine ─────────
  const focusLabel = d => '<span class="inline-flex items-center gap-2 whitespace-nowrap"><span class="mark ' + (FOCUS_MARK[d.focus] || '') + '"></span>' + esc(d.focus) + '</span>';
  const stageText = d => '<span class="font-mono text-xs">' + d.stages.map(esc).join(' / ') + '</span>';
  const linkCls = 'font-mono text-[11px] uppercase tracking-[0.1em] underline-offset-4 hover:text-accent hover:underline';

  function contactLinks(d) {
    const parts = [extLink(d.website, linkCls, 'Web ↗', 'Website: ' + host(d.website))];
    if (d.email) parts.push(extLink('mailto:' + d.email, linkCls, 'Mail', d.email));
    const p = (d.people || [])[0];
    parts.push(p
      ? extLink(p.linkedin || liSearch(p.name + ' ' + d.name), linkCls, 'LinkedIn ↗', 'LinkedIn: ' + p.name)
      : extLink(liCompany(d.name), linkCls, 'LinkedIn ↗', 'LinkedIn-Suche: ' + d.name));
    return '<div class="flex flex-wrap gap-x-4 gap-y-1">' + parts.join('') + '</div>';
  }

  // Zeile einer Definitionsliste: Monospace-Label links, Inhalt rechts, harte Linie oben
  const fact = (label, value) => value
    ? '<div class="grid grid-cols-[7rem_1fr] gap-4 border-t border-ink/20 py-2.5 sm:grid-cols-[9rem_1fr]"><dt class="label pt-0.5">' + label + '</dt><dd>' + value + '</dd></div>'
    : '';

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

  // ───────── Zeichnen ─────────
  function render() {
    const countries = [...new Set(baseFiltered(true).map(d => d.country))].sort((a, b) => a.localeCompare(b, 'de'));
    fillSelect('fCountry', 'Alle Länder', countries);
    $('fRegion').value = state.region;

    const base = baseFiltered(false);
    const list = sortList(applyFlags(base));

    $('regionTitle').textContent = REGION_LABEL[state.region];
    $('statTotal').textContent = pad(list.length);
    $('statTotalSub').textContent = 'von ' + DATA.length + ' Einträgen';
    $('statExclusive').textContent = pad(base.filter(d => d.focus === 'Exklusiv Gründerinnen').length);
    $('statEmail').textContent = pad(base.filter(d => d.email).length);
    ['exclusive', 'email'].forEach(f => $(f + 'Card').classList.toggle('is-active', state.flags[f]));
    $('regionCard').classList.toggle('is-active', state.region !== 'ALL');
    document.querySelectorAll('th[data-sort]').forEach(th => {
      const on = state.sort.key === th.dataset.sort;
      th.querySelector('.sorti').textContent = on ? (state.sort.dir === 1 ? '↑' : '↓') : '↕';
      th.classList.toggle('text-ink', on);
    });

    $('emptyState').classList.toggle('hidden', list.length > 0);
    $('tableWrap').classList.toggle('md:block', list.length > 0);

    $('tbody').innerHTML = list.map((d, i) => {
      const open = state.open.has(d.id);
      return '<tr data-toggle="' + esc(d.id) + '" class="cursor-pointer border-b border-ink/20 align-top hover:bg-ink/5 ' + (open ? 'open' : '') + '">' +
          '<td class="py-4 pr-2 font-mono text-xs text-ink/50">' + pad(i + 1) + '</td>' +
          '<td class="py-4 pr-4"><div class="text-base font-bold leading-tight tracking-tight">' + esc(d.name) + '</div><div class="label mt-1 normal-case tracking-normal">' + esc(d.type) + ' · ' + esc(d.sectors) + '</div></td>' +
          '<td class="py-4 pr-4 whitespace-nowrap"><div>' + esc(d.country) + '</div><div class="label mt-1 normal-case tracking-normal">' + esc(d.city || d.region) + '</div></td>' +
          '<td class="py-4 pr-4">' + focusLabel(d) + '</td>' +
          '<td class="py-4 pr-4">' + stageText(d) + '</td>' +
          '<td class="py-4 pr-4 max-w-[200px] text-xs">' + (esc(d.ticket) || '<span class="text-ink/35">k. A.</span>') + '</td>' +
          '<td class="py-4 pr-4">' + contactLinks(d) + '</td>' +
          '<td class="py-4 text-right font-mono text-lg leading-none"><span class="toggle-sign" aria-hidden="true"></span></td></tr>' +
        (open ? '<tr class="border-b border-ink"><td></td><td colspan="7">' + details(d) + '</td></tr>' : '');
    }).join('');

    $('mobileList').innerHTML = list.map((d, i) => {
      const open = state.open.has(d.id);
      return '<article class="border-b border-ink/20 py-5 ' + (open ? 'open' : '') + '">' +
          '<div class="flex cursor-pointer items-start justify-between gap-4" data-toggle="' + esc(d.id) + '">' +
            '<div class="min-w-0"><p class="font-mono text-xs text-ink/50">' + pad(i + 1) + '</p>' +
              '<p class="mt-1 text-lg font-bold leading-tight tracking-tight">' + esc(d.name) + '</p>' +
              '<p class="label mt-1 normal-case tracking-normal">' + esc([d.city, d.country].filter(Boolean).join(', ')) + ' · ' + esc(d.type) + '</p></div>' +
            '<span class="toggle-sign font-mono text-xl leading-none" aria-hidden="true"></span>' +
          '</div>' +
          '<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">' + focusLabel(d) + stageText(d) + '</div>' +
          '<div class="mt-3">' + contactLinks(d) + '</div>' +
          (open ? '<div class="mt-2 border-t border-ink">' + details(d) + '</div>' : '') +
        '</article>';
    }).join('');
  }

  // ───────── Aktionen ─────────
  function openAbout() { $('aboutModal').classList.remove('hidden'); $('aboutModal').classList.add('flex'); }
  function closeAbout() { $('aboutModal').classList.add('hidden'); $('aboutModal').classList.remove('flex'); }

  function exportCSV() {
    const list = sortList(applyFlags(baseFiltered(false)));
    const cols = ['Name', 'Region', 'Land', 'Stadt', 'Art', 'Fokus', 'Kriterium', 'Phasen', 'Ticket', 'Branchen', 'Website', 'E-Mail', 'Ansprechpartner'];
    // Schutz vor Formel-Injection in Excel: Zellen, die (nach Leerzeichen) mit = + - @ | beginnen, werden entschärft
    const q = v => { let s = String(v ?? ''); if (/^[\s]*[=+\-@|]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const rows = list.map(d => [d.name, d.region, d.country, d.city, d.type, d.focus, d.criterion, d.stages.join(' / '), d.ticket, d.sectors, d.website, d.email,
      (d.people || []).map(p => p.name + ' (' + p.role + ')').join('; ')].map(q).join(';'));
    const blob = new Blob(['﻿' + [cols.map(q).join(';'), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'female-founders-vc-radar.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const actions = {
    toggleTheme: () => document.documentElement.classList.toggle('dark'),
    openAbout, closeAbout, exportCSV,
    cycleRegion: () => {
      const i = REGION_CYCLE.indexOf(state.region);
      state.region = REGION_CYCLE[(i + 1) % REGION_CYCLE.length] || 'ALL';
      $('fCountry').value = 'ALL';
      render();
    },
    toggleFlag: f => { if (f in state.flags) { state.flags[f] = !state.flags[f]; render(); } }
  };

  // ───────── Start ─────────
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.insertAdjacentHTML('beforeend', ' <span class="sorti ml-1">↕</span>');
  });
  $('updatedText').textContent = 'Stand ' + new Date(window.LAST_UPDATED || Date.now()).toLocaleDateString('de-DE');
  fillSelect('fRegion', 'Alle', ['Deutschland', 'Europa', 'WORLD', 'Nordamerika', 'Asien-Pazifik', 'Afrika', 'Weltweit'], v => REGION_LABEL[v]);
  fillSelect('fStage', 'Alle', STAGES);
  fillSelect('fFocus', 'Alle', Object.keys(FOCUS_MARK));
  fillSelect('fType', 'Alle', [...new Set(DATA.map(d => d.type))].sort());

  // Ein zentraler Klick-Handler statt Inline-JavaScript (erlaubt eine strenge Content Security Policy)
  document.addEventListener('click', e => {
    const modal = $('aboutModal');
    if (e.target === modal) return closeAbout();
    const act = e.target.closest('[data-action]');
    if (act) return Object.prototype.hasOwnProperty.call(actions, act.dataset.action) && actions[act.dataset.action](act.dataset.arg);
    const th = e.target.closest('th[data-sort]');
    if (th) {
      const key = th.dataset.sort;
      if (state.sort.key !== key) state.sort = { key, dir: 1 };
      else if (state.sort.dir === 1) state.sort.dir = -1;
      else state.sort = { key: null, dir: 1 };
      return render();
    }
    if (e.target.closest('a, select, input')) return;
    const row = e.target.closest('[data-toggle]');
    if (row) {
      const id = row.dataset.toggle;
      state.open.has(id) ? state.open.delete(id) : state.open.add(id);
      render();
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAbout(); });
  $('searchInput').addEventListener('input', render);
  $('fRegion').addEventListener('change', e => { state.region = e.target.value; $('fCountry').value = 'ALL'; render(); });
  ['fCountry', 'fStage', 'fFocus', 'fType'].forEach(id => $(id).addEventListener('change', render));

  render();
})();
