# Sicher Rad fahren – Verkehrsregeln für Au-Pairs

Offenes Lernangebot zu den Grundregeln des Fahrradfahrens im deutschen
Straßenverkehr, für Au-Pairs ohne vertraute Verkehrsregeln. Statische
Website, kein Backend, kein Framework. Ursprünglich als Teil des Repos
`au-pair-deutsch` entstanden, seit Oktober 2026 als eigenes Projekt
getrennt, weil zwei unabhängige Kurse in einem Repo zu Verwechslungen
führten.

Vier unabhängige Module (keine Kette, keine feste Reihenfolge): Vorfahrt,
Verkehrsschilder und Fahrradwege, Ampeln/Fußgängerüberwege/Abbiegen,
Sicherheit und Kindertransport. Jedes Modul: kurze Regelerklärung
(Deutsch zuerst, Englisch per Umschalter), dazu bildgestützte
Multiple-Choice-Aufgaben mit sofortiger Rückmeldung.

## Build

    node scripts/verkehr-build.js

Ergebnis liegt in `dist/`. Liest die Module aus `module/`, die Übersicht
aus `module/uebersicht.json`, kopiert `bilder/` unverändert mit.

## Tests

    node --test scripts/*.test.js

## Prüfstand

    node scripts/verkehr-pruefstand.js

## Bilder erzeugen

Szenenbilder entstehen über die `media-skill` (kie.ai-API, Modell
nano-banana-2), fachlich geprüft gegen die jeweilige Verkehrsregel, dann
verkleinert:

    node scripts/verkehr-bilder-aufbereiten.js

Liest aus `bildkarten-quelle/` (nicht eingecheckt, nur lokal), schreibt
720×480-WebP nach `bilder/` (eingecheckt). Braucht `ffmpeg` im PATH.

## Neues Modul ergänzen

1. `module/NN-slug.md` nach dem Muster der bestehenden Module anlegen
   (Frontmatter `id`, `titel`, `themenbereich`, `typ: verkehrsmodul`;
   Abschnitte `Einleitung Deutsch/Englisch`, `Regel Deutsch/Englisch`,
   beliebig viele `Aufgabe: <Titel>` mit `Bild`, `Frage Deutsch/Englisch`,
   `Optionen` (Markdown-Checkliste, genau ein `[x]`), `Erklärung
   Deutsch/Englisch`)
2. Szenenbilder erzeugen und über `node scripts/verkehr-bilder-aufbereiten.js`
   nach `bilder/` bringen
3. `node scripts/verkehr-pruefstand.js` zur Kontrolle laufen lassen
4. `node scripts/verkehr-build.js`
5. Eintrag in `module/uebersicht.json` ergänzen (`id`, `titel`,
   `themenbereich`, `akzent`), damit die Übersichtsseite die Kachel zeigt

Die Übersichtsseite verlinkt automatisch jedes Modul, für das eine
Markdown-Datei existiert. Geplante, noch nicht geschriebene Module aus
`uebersicht.json` bleiben als Vorschau mit „in Arbeit" stehen.

## Technik und Ablage

Statische Website, reines HTML/CSS/JavaScript ohne Framework, Node.js
(nur Bordmittel, keine npm-Abhängigkeiten). Vollständiger Implementierungsplan
und Design-Spec liegen unter `docs/superpowers/`.
