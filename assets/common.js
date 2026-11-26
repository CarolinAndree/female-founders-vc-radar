// Gemeinsame Bausteine für alle Seiten des Radars.
// Keine Cookies, kein Speicher, keine Anfragen an andere Server.
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Nur https- und mailto-Links zulassen (Schutz gegen javascript:-Links in den Daten)
  const safeUrl = u => (/^(https:\/\/|mailto:)/i.test(String(u || '')) ? esc(u) : '#');
  const liSearch = q => 'https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(q);
  const liCompany = q => 'https://www.linkedin.com/search/results/companies/?keywords=' + encodeURIComponent(q);
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
  const extLink = (href, cls, inner, title) =>
    '<a href="' + safeUrl(href) + '" target="_blank" rel="noopener noreferrer"' + (title ? ' title="' + esc(title) + '" aria-label="' + esc(title) + '"' : '') + ' class="' + cls + '">' + inner + '</a>';

  // Kleine Strich-Icons als SVG (keine Icon-Schrift, keine externen Dateien)
  const svg = d => '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="miter" aria-hidden="true">' + d + '</svg>';
  const ICON = {
    web: svg('<circle cx="8" cy="8" r="6.5"/><path d="M1.5 8h13M8 1.5c2.2 2 2.2 11 0 13M8 1.5c-2.2 2-2.2 11 0 13"/>'),
    mail: svg('<rect x="1.5" y="3.5" width="13" height="9"/><path d="M1.5 4l6.5 5 6.5-5"/>'),
    copy: svg('<rect x="5.5" y="5.5" width="8.5" height="8.5"/><path d="M3 10.5V2h8.5"/>'),
    check: svg('<path d="M2.5 8.5l3.5 3.5 7.5-8"/>'),
    li: '<span class="font-mono text-[11px] font-semibold leading-none" aria-hidden="true">in</span>'
  };

  function fillSelect(id, allLabel, values, labelFn) {
    const el = $(id), cur = el.value;
    el.innerHTML = '<option value="ALL">' + esc(allLabel) + '</option>' +
      values.map(v => '<option value="' + esc(v) + '">' + esc(labelFn ? labelFn(v) : v) + '</option>').join('');
    if ([...el.options].some(o => o.value === cur)) el.value = cur;
  }

  // Zeile einer Definitionsliste: Monospace-Label links, Inhalt rechts, harte Linie oben
  const fact = (label, value) => value
    ? '<div class="grid grid-cols-[7rem_1fr] gap-4 border-t border-ink/20 py-2.5 sm:grid-cols-[9rem_1fr]"><dt class="label pt-0.5">' + label + '</dt><dd>' + value + '</dd></div>'
    : '';

  // Aktive Filter als löschbare Chips
  const chipsHtml = chips => chips.map(([key, label]) =>
      '<button type="button" class="chip" data-clear="' + esc(key) + '" aria-label="Filter ' + esc(label) + ' entfernen">' + esc(label) + ' <span aria-hidden="true">×</span></button>').join('') +
    (chips.length > 1 ? '<button type="button" class="label px-2 underline-offset-4 hover:text-accent hover:underline" data-action="resetFilters">Alle zurücksetzen</button>' : '');

  // 3-stufige Sortierung: auf, ab, aus
  function nextSort(sort, key) {
    if (sort.key !== key) return { key, dir: 1 };
    if (sort.dir === 1) return { key, dir: -1 };
    return { key: null, dir: 1 };
  }
  function markSort(sort) {
    document.querySelectorAll('th[data-sort]').forEach(th => {
      const on = sort.key === th.dataset.sort;
      th.querySelector('.sorti').textContent = on ? (sort.dir === 1 ? '↑' : '↓') : '↕';
      th.classList.toggle('text-ink', on);
    });
  }

  // E-Mail in die Zwischenablage, mit kurzem Häkchen als Rückmeldung
  function copyEmail(btn) {
    const done = () => {
      btn.innerHTML = ICON.check;
      btn.classList.add('is-active');
      setTimeout(() => { btn.innerHTML = ICON.copy; btn.classList.remove('is-active'); }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(btn.dataset.copy).then(done, () => {});
  }

  // Über-Blatt (nur auf der Startseite vorhanden)
  function openAbout() { const m = $('aboutModal'); if (!m) return; m.classList.remove('hidden'); m.classList.add('flex'); }
  function closeAbout() { const m = $('aboutModal'); if (!m) return; m.classList.add('hidden'); m.classList.remove('flex'); }

  // Aktionen: gemeinsame plus seitenspezifische (über RC.actions ergänzt)
  const actions = {
    toggleTheme: () => document.documentElement.classList.toggle('dark'),
    openAbout, closeAbout
  };

  // Ein zentraler Klick-Handler statt Inline-JavaScript (erlaubt eine strenge Content Security Policy)
  document.addEventListener('click', e => {
    if (e.target === $('aboutModal')) return closeAbout();
    const copy = e.target.closest('[data-copy]');
    if (copy) return copyEmail(copy);
    const act = e.target.closest('[data-action]');
    if (act) return Object.prototype.hasOwnProperty.call(actions, act.dataset.action) && actions[act.dataset.action](act.dataset.arg);
    if (typeof window.RC.onClick === 'function') window.RC.onClick(e);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAbout(); });

  // Skripte stehen am Ende von <body>, das HTML ist also schon da:
  // Sortier-Pfeile in die Tabellenköpfe setzen, Stand-Datum anzeigen, ggf. Über-Blatt öffnen
  document.querySelectorAll('th[data-sort]').forEach(th => th.insertAdjacentHTML('beforeend', ' <span class="sorti ml-1">↕</span>'));
  const updated = $('updatedText');
  if (updated) updated.textContent = 'Stand ' + new Date(window.LAST_UPDATED || window.EXPERTS_UPDATED || Date.now()).toLocaleDateString('de-DE');
  if (location.hash === '#ueber') openAbout();

  window.RC = { $, esc, safeUrl, liSearch, liCompany, host, extLink, ICON, fillSelect, fact, chipsHtml, nextSort, markSort, actions, onClick: null };
})();
