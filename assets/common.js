// Gemeinsame Bausteine für alle Seiten des Radars.
// Keine Cookies, kein Speicher, keine Anfragen an andere Server.
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const { esc, ICON, updatedText } = window.RV; // aus render.js

  function fillSelect(id, allLabel, values, labelFn) {
    const el = $(id), cur = el.value;
    el.innerHTML = '<option value="ALL">' + esc(allLabel) + '</option>' +
      values.map(v => '<option value="' + esc(v) + '">' + esc(labelFn ? labelFn(v) : v) + '</option>').join('');
    if ([...el.options].some(o => o.value === cur)) el.value = cur;
  }

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
  if (updated) updated.textContent = updatedText(window.LAST_UPDATED || window.EXPERTS_UPDATED || Date.now());
  if (location.hash === '#ueber') openAbout();

  window.RC = { $, fillSelect, chipsHtml, nextSort, markSort, actions, onClick: null };
})();
