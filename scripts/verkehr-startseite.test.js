const test = require('node:test');
const assert = require('node:assert');
const { renderVerkehrStartseiteHtml } = require('./verkehr-startseite.js');

const uebersicht = [
  { id: 1, titel: 'Vorfahrt im Straßenverkehr', themenbereich: 'Vorfahrt', akzent: '#FFE3B3', bild: 'uebersicht-01-vorfahrt.webp' },
  { id: 2, titel: 'Verkehrsschilder und Fahrradwege', themenbereich: 'Schilder', akzent: '#CFE8FF', bild: 'uebersicht-02-schilder.webp' },
];

test('fertige Module werden verlinkt, unfertige als "in Arbeit" markiert', () => {
  const gebaut = new Map([
    [1, { titel: 'Vorfahrt im Straßenverkehr', themenbereich: 'Vorfahrt', dateiname: 'modul-01.html' }],
  ]);
  const html = renderVerkehrStartseiteHtml(uebersicht, gebaut);
  assert.match(html, /<a class="karte karte--offen" href="modul-01\.html">/);
  assert.match(html, /in Arbeit/);
});

test('der Stand-Text zählt fertige von geplanten Modulen', () => {
  const gebaut = new Map([[1, { titel: 'X', themenbereich: 'Y', dateiname: 'modul-01.html' }]]);
  const html = renderVerkehrStartseiteHtml(uebersicht, gebaut);
  assert.match(html, /1 von 2 ist fertig/);
});

test('ohne fertige Module bleibt die Karte unverlinkt', () => {
  const html = renderVerkehrStartseiteHtml(uebersicht, new Map());
  assert.doesNotMatch(html, /karte--offen/);
});

test('jede Karte zeigt ihr Übersichtsbild, auch unfertige', () => {
  const html = renderVerkehrStartseiteHtml(uebersicht, new Map());
  assert.match(html, /src="bilder\/uebersicht-01-vorfahrt\.webp"/);
  assert.match(html, /src="bilder\/uebersicht-02-schilder\.webp"/);
  assert.match(html, /alt="Illustration zu Modul 1: Vorfahrt im Straßenverkehr"/);
});

test('ohne bild-Feld bleibt die Karte ohne Bild-Block, aber ohne Fehler', () => {
  const ohneBild = [{ id: 9, titel: 'X', themenbereich: 'Y', akzent: '#fff' }];
  const html = renderVerkehrStartseiteHtml(ohneBild, new Map());
  assert.doesNotMatch(html, /karte-bild/);
  assert.doesNotMatch(html, /undefined/);
});
