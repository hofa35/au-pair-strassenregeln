// scripts/verkehr-renderer.js
const { escapeHtml } = require('./html.js');

const ZURUECK_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H6"/><path d="m12 19-7-7 7-7"/></svg>`;

/** Hängt eine kurze Prüfsumme an Stylesheet/Skript, siehe verkehr-build.js. */
function mitVersion(datei, version) {
  return version ? `${datei}?v=${version}` : datei;
}

/**
 * Baut eine zweisprachige Box: Deutsch sichtbar, Englisch hinter dem
 * Umschalter. Der Vertrag (Klasse "erklaerung", [data-sprache],
 * button.sprach-umschalter) kommt unverändert aus toggle.js.
 */
function renderErklaerungsbox(textDe, textEn, zusatzklasse = '') {
  return `<div class="erklaerung${zusatzklasse ? ` ${zusatzklasse}` : ''}">
  <p class="erklaerung-text" data-sprache="de">${textDe}</p>
  <p class="erklaerung-text" data-sprache="en" style="display:none">${textEn}</p>
  <button class="sprach-umschalter" aria-pressed="false">Verstehst du das nicht? Hier auf Englisch</button>
</div>`;
}

function renderAufgabe(aufgabe, index) {
  const richtigIndex = aufgabe.optionen.findIndex((option) => option.richtig);
  const optionenHtml = aufgabe.optionen
    .map(
      (option, i) => `    <label class="option">
      <input type="radio" name="aufgabe-${index}" value="${i}">
      <span>${escapeHtml(option.text)}</span>
    </label>`
    )
    .join('\n');

  return `<section class="aufgabe">
  <h3>${escapeHtml(aufgabe.titel)}</h3>
  <div class="aufgabe-bild">
    <img src="bilder/${aufgabe.bild}" alt="Verkehrssituation: ${escapeHtml(aufgabe.titel)}" width="720" height="480" loading="lazy" decoding="async">
  </div>
  ${renderErklaerungsbox(aufgabe.fragDe, aufgabe.fragEn, 'erklaerung--frage')}
  <form class="optionen" data-richtig="${richtigIndex}">
${optionenHtml}
  </form>
  <p class="rueckmeldung" hidden></p>
  <div class="erklaerung-feld" hidden>
    ${renderErklaerungsbox(aufgabe.erklaerungDe, aufgabe.erklaerungEn)}
  </div>
</section>`;
}

/**
 * Schild-Quiz-Karte: dieselben Felder wie eine Aufgabe (Bild, Frage,
 * Optionen, Erklärung), aber ohne Straßenszene – nur das Schild-Icon, dafür
 * im Grid statt untereinander. Die Auswerte-Logik in verkehr-uebung.js
 * braucht dafür keine Änderung, sie greift generisch über die Klassen
 * ".optionen" / ".aufgabe" / ".rueckmeldung" / ".erklaerung-feld", die hier
 * bewusst wiederverwendet werden. Eigener name-Namensraum ("schild-N" statt
 * "aufgabe-N"), damit die Radiogruppen nicht mit denen der Aufgaben
 * kollidieren.
 */
function renderSchild(schild, index) {
  const richtigIndex = schild.optionen.findIndex((option) => option.richtig);
  const optionenHtml = schild.optionen
    .map(
      (option, i) => `    <label class="option">
      <input type="radio" name="schild-${index}" value="${i}">
      <span>${escapeHtml(option.text)}</span>
    </label>`
    )
    .join('\n');

  return `<article class="aufgabe schild-karte">
  <div class="schild-bild">
    <img src="bilder/${schild.bild}" alt="Verkehrsschild: ${escapeHtml(schild.titel)}" width="720" height="480" loading="lazy" decoding="async">
  </div>
  <h3>${escapeHtml(schild.titel)}</h3>
  ${renderErklaerungsbox(schild.fragDe, schild.fragEn, 'erklaerung--frage')}
  <form class="optionen" data-richtig="${richtigIndex}">
${optionenHtml}
  </form>
  <p class="rueckmeldung" hidden></p>
  <div class="erklaerung-feld" hidden>
    ${renderErklaerungsbox(schild.erklaerungDe, schild.erklaerungEn)}
  </div>
</article>`;
}

/**
 * @param {object} modul  Ergebnis von parseVerkehrsmodul()
 * @param {{css?: string, js?: string, uebung?: string}} [versionen]
 */
function renderModulHtml(modul, versionen = {}) {
  const aufgabenHtml = modul.aufgaben.map((aufgabe, i) => renderAufgabe(aufgabe, i)).join('\n\n');
  const schilder = modul.schilder || [];
  const schilderBlockHtml = schilder.length
    ? `
<section class="block block--schilder">
<h2>Schilder erkennen</h2>
<p class="block-hinweis">Kurzes Schilder-Quiz, ohne Szene drumherum: Nur das Schild – was bedeutet es?</p>
<div class="schilder-grid">
${schilder.map((schild, i) => renderSchild(schild, i)).join('\n\n')}
</div>
</section>
`
    : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(modul.titel)} – Sicher Rad fahren</title>
<link rel="stylesheet" href="${mitVersion('styles.css', versionen.css)}">
</head>
<body>
<header class="kopfzeile">
  <a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Module</span></a>
  <span class="kopf-hinweis">${escapeHtml(modul.themenbereich)}</span>
</header>
<main class="modul">
<h1>${escapeHtml(modul.titel)}</h1>

${renderErklaerungsbox(modul.einleitungDe, modul.einleitungEn, 'erklaerung--einleitung')}

<section class="block block--regel">
<h2>Die Regel</h2>
${renderErklaerungsbox(modul.regelDe, modul.regelEn)}
</section>

<section class="block block--aufgaben">
<h2>Teste dich selbst</h2>
${aufgabenHtml}
</section>
${schilderBlockHtml}
<p class="modul-fuss"><a class="zurueck" href="index.html">${ZURUECK_ICON}<span>Alle Module in der Übersicht</span></a></p>
</main>
<script src="${mitVersion('toggle.js', versionen.js)}"></script>
<script src="${mitVersion('verkehr-uebung.js', versionen.uebung)}"></script>
</body>
</html>`;
}

module.exports = { renderModulHtml, renderAufgabe, renderSchild, mitVersion, ZURUECK_ICON };
