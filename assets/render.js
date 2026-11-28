// Bausteine, die aus den Daten HTML bauen. Ohne Zugriff auf die Seite (DOM):
// Dieselben Funktionen zeichnen die Liste im Browser und schreiben sie beim Build
// vorab in die HTML-Dateien (scripts/prerender.js). So gibt es nur eine Version.
(function () {
  'use strict';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Nur https- und mailto-Links zulassen (Schutz gegen javascript:-Links in den Daten)
  const safeUrl = u => (/^(https:\/\/|mailto:)/i.test(String(u || '')) ? esc(u) : '#');
  const liSearch = q => 'https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(q);
  const liCompany = q => 'https://www.linkedin.com/search/results/companies/?keywords=' + encodeURIComponent(q);
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
  const extLink = (href, cls, inner, title) =>
    '<a href="' + safeUrl(href) + '" target="_blank" rel="noopener noreferrer"' + (title ? ' title="' + esc(title) + '" aria-label="' + esc(title) + '"' : '') + ' class="' + cls + '">' + inner + '</a>';
  const place = x => [x.city, x.country].filter(Boolean).join(', ');

  // Kleine Strich-Icons als SVG (keine Icon-Schrift, keine externen Dateien)
  const svg = d => '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="miter" aria-hidden="true">' + d + '</svg>';
  const ICON = {
    web: svg('<circle cx="8" cy="8" r="6.5"/><path d="M1.5 8h13M8 1.5c2.2 2 2.2 11 0 13M8 1.5c-2.2 2-2.2 11 0 13"/>'),
    mail: svg('<rect x="1.5" y="3.5" width="13" height="9"/><path d="M1.5 4l6.5 5 6.5-5"/>'),
    copy: svg('<rect x="5.5" y="5.5" width="8.5" height="8.5"/><path d="M3 10.5V2h8.5"/>'),
    check: svg('<path d="M2.5 8.5l3.5 3.5 7.5-8"/>'),
    li: '<span class="font-mono text-[11px] font-semibold leading-none" aria-hidden="true">in</span>'
  };

  // Zeile einer Definitionsliste: Monospace-Label links, Inhalt rechts, harte Linie oben
  const fact = (label, value) => value
    ? '<div class="grid grid-cols-[7rem_1fr] gap-4 border-t border-ink/20 py-2.5 sm:grid-cols-[9rem_1fr]"><dt class="label pt-0.5">' + label + '</dt><dd>' + value + '</dd></div>'
    : '';

  // Gemeinsamer Rahmen für Tabellenzeile (Desktop) und Karte (Handy)
  const row = (id, open, cells, detail) =>
    '<tr data-toggle="' + esc(id) + '" class="cursor-pointer border-b border-ink/20 align-top hover:bg-ink/5 ' + (open ? 'open' : '') + '">' +
      cells.map(c => '<td class="py-4 pr-4' + (c.cls ? ' ' + c.cls : '') + '">' + c.html + '</td>').join('') +
      '<td class="py-4 text-right font-mono text-lg leading-none"><span class="toggle-sign" aria-hidden="true"></span></td></tr>' +
    (open ? '<tr class="border-b border-ink"><td colspan="' + (cells.length + 1) + '">' + detail() + '</td></tr>' : '');

  const card = (id, open, title, sub, meta, contact, detail) =>
    '<article class="border-b border-ink/20 py-5 ' + (open ? 'open' : '') + '">' +
      '<div class="flex cursor-pointer items-start justify-between gap-4" data-toggle="' + esc(id) + '">' +
        '<div class="min-w-0"><p class="text-lg font-bold leading-tight tracking-tight">' + esc(title) + '</p>' +
          '<p class="mt-1 text-xs text-ink/55">' + sub + '</p></div>' +
        '<span class="toggle-sign font-mono text-xl leading-none" aria-hidden="true"></span>' +
      '</div>' +
      '<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">' + meta + '</div>' +
      '<div class="mt-3">' + contact + '</div>' +
      (open ? '<div class="mt-2 border-t border-ink">' + detail() + '</div>' : '') +
    '</article>';

  const nameCell = (name, sub) =>
    '<div class="text-base font-bold leading-tight tracking-tight">' + esc(name) + '</div><div class="mt-1 text-xs text-ink/55">' + sub + '</div>';

  // ───────── Kapital ─────────
  // Fokus-Kategorie als typografische Markierung statt Farbfläche
  const FOCUS_MARK = { 'Nur Gründerinnen': 'mark-nur', 'Gründerinnen-Quote': 'mark-quote' };
  const focusTag = d => '<span class="tag"><span class="mark ' + (FOCUS_MARK[d.focus] || '') + '"></span>' + esc(d.focus) + '</span>';
  const stageText = d => '<span class="font-mono text-xs">' + d.stages.map(esc).join(' / ') + '</span>';

  function vcContact(d) {
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
  function vcDetails(d) {
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
          fact('Standort', esc(place(d))) +
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

  const vcRow = (d, open) => row(d.id, open, [
    { html: nameCell(d.name, esc(place(d) || d.region) + ' · ' + esc(d.type)) },
    { html: focusTag(d) },
    { html: stageText(d) },
    { html: esc(d.ticket) || '<span class="text-ink/35">k. A.</span>', cls: 'max-w-[200px] text-xs' },
    { html: vcContact(d) }
  ], () => vcDetails(d));

  const vcCard = (d, open) => card(d.id, open, d.name, esc(place(d)) + ' · ' + esc(d.type),
    focusTag(d) + stageText(d), vcContact(d), () => vcDetails(d));

  // ───────── Expertinnen ─────────
  // Rolle steht in der Box, wie der Fokus auf der Kapital-Seite: danach filtern die Schnellfilter
  const roleTags = e => e.roles.map(r => '<span class="tag">' + esc(r) + '</span>').join('');
  const phaseText = e => '<span class="font-mono text-xs">' + e.phases.map(esc).join(' / ') + '</span>';
  const expertContact = e => '<div class="flex flex-wrap gap-1">' +
    (e.linkedin ? extLink(e.linkedin, 'icon-btn', ICON.li, 'LinkedIn: ' + e.name) : '') + '</div>';

  function expertDetails(e) {
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
          fact('Ort', esc(place(e))) +
          fact('Kanzlei', esc(e.firm)) +
          fact('Auszeichnung', esc(e.recognition)) +
        '</dl>' +
      '</div>' +
    '</div>';
  }

  const expertRow = (e, open) => row(e.id, open, [
    { html: nameCell(e.name, esc(place(e)) + (e.firm ? ' · ' + esc(e.firm) : '')) },
    { html: '<div class="flex flex-wrap gap-1">' + roleTags(e) + '</div>' },
    { html: esc(e.fields.join(', ')) },
    { html: phaseText(e) },
    { html: expertContact(e) }
  ], () => expertDetails(e));

  const expertCard = (e, open) => card(e.id, open, e.name, esc(place(e)),
    roleTags(e) + '<span>' + esc(e.fields.join(', ')) + '</span>' + phaseText(e), expertContact(e), () => expertDetails(e));

  // Zahl und Beschriftung über der Liste
  const vcCount = (n, total) => (n === 1 ? 'Eintrag' : 'Einträge') + ' gefunden' + (n === total ? '' : ' von ' + total);
  const expertCount = (n, total) => (n === 1 ? 'Expertin' : 'Expertinnen') + (n === total ? '' : ' von ' + total);
  const updatedText = date => 'Stand ' + new Date(date).toLocaleDateString('de-DE');

  const api = { esc, safeUrl, host, extLink, ICON, FOCUS_MARK, vcRow, vcCard, vcCount, expertRow, expertCard, expertCount, updatedText };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else window.RV = api;
})();
