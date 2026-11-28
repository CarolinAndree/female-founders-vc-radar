// Schreibt die Einträge vorab als fertiges HTML in index.html und expertinnen.html.
// So sehen auch Suchmaschinen, KI-Crawler und Link-Vorschauen die Liste, ohne JavaScript.
// Im Browser übernimmt danach assets/app.js bzw. assets/expertinnen.js (Filter, Suche, Aufklappen).
// Nutzt nur Node selbst und dieselben Bausteine wie der Browser (assets/render.js).
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const RV = require('../assets/render.js');

const root = path.join(__dirname, '..');

// Datendatei so laden, wie der Browser sie lädt (sie setzt window.…)
function loadData(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
  return sandbox.window;
}

// Ersetzt den Inhalt zwischen <!-- prerender:NAME --> und <!-- /prerender:NAME -->
function fill(html, name, content) {
  const re = new RegExp('(<!-- prerender:' + name + ' -->)[\\s\\S]*?(<!-- /prerender:' + name + ' -->)');
  if (!re.test(html)) throw new Error('Markierung „prerender:' + name + '“ fehlt');
  return html.replace(re, (m, open, close) => open + content + close);
}

function page(file, parts) {
  const p = path.join(root, file);
  let html = fs.readFileSync(p, 'utf8');
  for (const [name, content] of Object.entries(parts)) html = fill(html, name, content);
  fs.writeFileSync(p, html);
  console.log('vorgerendert: ' + file);
}

const vc = loadData('data/vcs.js');
const vcs = vc.VC_DATA;
page('index.html', {
  updated: RV.esc(RV.updatedText(vc.LAST_UPDATED)),
  total: String(vcs.length),
  label: RV.esc(RV.vcCount(vcs.length, vcs.length)),
  rows: vcs.map(d => RV.vcRow(d, false)).join(''),
  cards: vcs.map(d => RV.vcCard(d, false)).join('')
});

const ex = loadData('data/experts.js');
const experts = ex.EXPERT_DATA;
page('expertinnen.html', {
  updated: RV.esc(RV.updatedText(ex.EXPERTS_UPDATED)),
  total: String(experts.length),
  label: RV.esc(RV.expertCount(experts.length, experts.length)),
  rows: experts.map(e => RV.expertRow(e, false)).join(''),
  cards: experts.map(e => RV.expertCard(e, false)).join('')
});
