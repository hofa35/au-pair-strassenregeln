// scripts/verkehr-parser.js
//
// Liest die Modul-Dateien aus module/. Es gibt nur eine Art von Dokument
// (Verkehrsmodul), und Module sind unabhängig voneinander – keine Kette,
// keine Querverweise.
//
// Vollständig eigenständig: keine Abhängigkeit von einem anderen Projekt
// oder Repository. Ursprünglich teilte sich dieser Parser ein Repository
// mit dem Au-pair-Deutschkurs und durfte dessen scripts/parser.js nicht
// anfassen, deshalb waren Frontmatter-Parsing und CRLF-Normalisierung schon
// damals lokal. Seit der Trennung in ein eigenes Repository gilt das erst
// recht: alles Nötige steht in dieser einen Datei.
const fs = require('node:fs');

const AUFGABE_MUSTER = /^Aufgabe\s*[:·\-–]?\s*(.*)$/;

// Eigenes, schlankeres Übungsformat neben der normalen Aufgabe: nur das
// Schild-Icon statt einer ganzen Straßenszene, sonst dieselben Felder
// (Bild, Frage, Optionen, Erklärung). Der Doppelpunkt ist hier Pflicht,
// nicht optional wie bei AUFGABE_MUSTER – sonst würde z.B. eine Überschrift
// "Schilder und Radwege" fälschlich als Schild-Quiz erkannt.
const SCHILD_MUSTER = /^Schild\s*:\s*(.*)$/;

/**
 * Vereinheitlicht die Zeilenenden, bevor irgendetwas geparst wird. Git
 * stellt unter Windows beim Auschecken mit core.autocrlf=true auf CRLF um,
 * die Regex unten erwartet aber \n. Das BOM fällt gleich mit weg.
 */
function normalisiereZeilenenden(rohtext) {
  return rohtext.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
}

/** Liest Frontmatter und Rumpf einer Modul-Datei. */
function parseFrontmatter(rohtext) {
  const raw = normalisiereZeilenenden(rohtext);
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Keine Frontmatter gefunden');
  const [, frontmatterRaw, body] = match;
  const frontmatter = {};
  for (const line of frontmatterRaw.split('\n')) {
    const lineMatch = line.match(/^(\w+):\s*(.*)$/);
    if (!lineMatch) continue;
    const [, key, rawValue] = lineMatch;
    let value = rawValue.trim();
    value = value.replace(/^"(.*)"$/, '$1');
    frontmatter[key] = /^\d+$/.test(value) ? Number(value) : value;
  }
  return { frontmatter, body };
}

/** Zerlegt den Rumpf einer Modul-Datei in ihre "## "-Abschnitte, in Dateireihenfolge. */
function parseAbschnitte(body) {
  const roh = [];
  const regex = /^## (.+)$/gm;
  let match;
  while ((match = regex.exec(body)) !== null) {
    roh.push({ titel: match[1].trim(), von: regex.lastIndex, bis: body.length });
    if (roh.length > 1) roh[roh.length - 2].bis = match.index;
  }
  return roh.map(({ titel, von, bis }) => ({ titel, inhalt: body.slice(von, bis).trim() }));
}

/**
 * Zerlegt den Inhalt einer Aufgabe in seine "### "-Unterabschnitte
 * (Bild, Frage Deutsch, Frage Englisch, Optionen, Erklärung Deutsch,
 * Erklärung Englisch). Eine Ebene tiefer als parseAbschnitte(), das nur
 * "## " kennt – deshalb eine eigene, kleine Funktion statt parseAbschnitte
 * zu verbiegen.
 */
function parseUnterabschnitte(inhalt) {
  const roh = [];
  const regex = /^### (.+)$/gm;
  let match;
  while ((match = regex.exec(inhalt)) !== null) {
    roh.push({ titel: match[1].trim(), von: regex.lastIndex, bis: inhalt.length });
    if (roh.length > 1) roh[roh.length - 2].bis = match.index;
  }
  return roh.map(({ titel, von, bis }) => ({ titel, inhalt: inhalt.slice(von, bis).trim() }));
}

/**
 * Liest die Optionen-Liste einer Aufgabe. Jede Zeile ist eine
 * Markdown-Checkliste ("- [ ] Text" oder "- [x] Text"); "x" markiert die
 * richtige Option. Ob am Ende genau eine Option als richtig markiert ist,
 * prüft nicht der Parser, sondern der Prüfstand (scripts/verkehr-pruefstand.js)
 * – der Parser meldet nur echte Strukturfehler.
 */
function parseOptionen(text) {
  return text
    .split('\n')
    .map((zeile) => zeile.trim())
    .filter((zeile) => zeile.startsWith('-'))
    .map((zeile) => {
      const match = zeile.match(/^-\s*\[([ xX])\]\s*(.+)$/);
      if (!match) throw new Error(`Malformed Optionen-Zeile: "${zeile}"`);
      return { text: match[2].trim(), richtig: match[1].toLowerCase() === 'x' };
    });
}

function parseAufgabe(titelRoh, inhalt, muster = AUFGABE_MUSTER) {
  const treffer = titelRoh.match(muster);
  const titel = treffer ? treffer[1].trim() : titelRoh.trim();
  const unter = new Map(parseUnterabschnitte(inhalt).map((u) => [u.titel, u.inhalt]));

  return {
    titel,
    bild: (unter.get('Bild') || '').trim(),
    fragDe: unter.get('Frage Deutsch') || '',
    fragEn: unter.get('Frage Englisch') || '',
    optionen: parseOptionen(unter.get('Optionen') || ''),
    erklaerungDe: unter.get('Erklärung Deutsch') || '',
    erklaerungEn: unter.get('Erklärung Englisch') || '',
  };
}

function parseVerkehrsmodul(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  if (frontmatter.typ !== 'verkehrsmodul') {
    throw new Error(
      `${filePath}: erwartet Frontmatter "typ: verkehrsmodul", gefunden "${frontmatter.typ || '(fehlt)'}"`
    );
  }

  const sektionen = new Map();
  const aufgaben = [];
  const schilder = [];
  for (const { titel, inhalt } of parseAbschnitte(body)) {
    if (AUFGABE_MUSTER.test(titel)) {
      aufgaben.push(parseAufgabe(titel, inhalt));
    } else if (SCHILD_MUSTER.test(titel)) {
      schilder.push(parseAufgabe(titel, inhalt, SCHILD_MUSTER));
    } else {
      sektionen.set(titel, inhalt);
    }
  }

  return {
    id: frontmatter.id,
    titel: frontmatter.titel,
    themenbereich: frontmatter.themenbereich,
    einleitungDe: sektionen.get('Einleitung Deutsch') || '',
    einleitungEn: sektionen.get('Einleitung Englisch') || '',
    regelDe: sektionen.get('Regel Deutsch') || '',
    regelEn: sektionen.get('Regel Englisch') || '',
    aufgaben,
    schilder,
  };
}

module.exports = { parseVerkehrsmodul };
