<div align="center">

# Female Founders VC Radar

**VC-Fonds, Angel-Netzwerke und Programme, die in Gründerinnen investieren: Deutschland, Europa & weltweit.**

[Live ansehen](https://carolinandree.github.io/female-founders-vc-radar/)

![Fonds](https://img.shields.io/badge/Fonds_%26_Programme-45-111111)
![Cookies](https://img.shields.io/badge/Cookies-keine-111111)
![Tracking](https://img.shields.io/badge/Tracking-keins-111111)
![Lizenz](https://img.shields.io/badge/Lizenz-MIT-e2231a)

</div>

---

## Warum?

Laut [EY Startup-Barometer](https://www.ey.com/de_de/newsroom/2026/03/ey-startup-barometer-2026-gruenderinnen-und-gruender) flossen 2025 in Deutschland rund **94 %** des Wagniskapitals an rein männliche Gründungsteams. Rein weibliche Teams erhielten etwa **1 %**, also 53 Mio. € von insgesamt 7,8 Mrd. €.

Es gibt Investor:innen, die das ändern wollen, aber sie sind schwer zu finden. Der Radar sammelt sie an einem Ort: mit Website, Phase, Region, Investment-Kriterium und Ansprechpartner:innen.

## Funktionen

| | |
|---|---|
| **Region** | Mit einem Klick durchschalten: Deutschland → Europa → Rest der Welt |
| **Filter & Suche** | Land, Phase (Pre-Seed bis Growth), Fokus, Art (VC-Fonds, Angel-Netzwerk, Programm) und Volltextsuche |
| **Nur Gründerinnen** | Ein Klick zeigt nur Fonds, die ausschließlich in Teams mit Gründerin investieren |
| **Kontakt** | Website, öffentliche E-Mail und Ansprechpartner:innen mit LinkedIn-Link |
| **CSV-Export** | Gefilterte Liste für Excel/Numbers herunterladen |
| **Hell & Dunkel** | Folgt der Systemeinstellung, umschaltbar |
| **Mobil** | Eigene Kartenansicht fürs Handy |

## Kategorien

**Fokus** (wie stark auf Gründerinnen ausgerichtet):


| Fokus | Bedeutung |
|---|---|
| **Exklusiv Gründerinnen** | investiert nur, wenn (mind.) eine Gründerin im Team ist |
| **Gender-Lens** | starker Fokus auf Frauen oder Frauen-Themen (z. B. Women's Health), aber nicht exklusiv |
| **Diversity** | unterrepräsentierte Gründer:innen allgemein, inkl. Frauen |

**Art** (welche Form von Unterstützung):

| Art | Bedeutung |
|---|---|
| **VC-Fonds** | investiert Eigenkapital aus einem Fonds |
| **Angel-Netzwerk** | Business Angels, die einzeln oder gemeinsam investieren |
| **Programm** | Accelerator, Förderprogramm oder Grant, meist ohne Beteiligung |

## Datenschutz by Design

- **Keine Cookies**, kein Local Storage. Die Seite speichert nichts im Browser.
- **Kein Tracking**, keine Analyse-Tools.
- **Keine fremden Server:** Schriften (DM Sans, JetBrains Mono) und CSS liegen im Repo, Icons sind Schriftzeichen. Kein Google Fonts, kein CDN.
- **Strenge Content Security Policy:** Der Browser darf nur Dateien von der eigenen Seite laden und kein eingebettetes JavaScript ausführen.
- **Kein Referrer:** Klicks auf externe Links verraten nicht, von welcher Seite man kommt.
- E-Mails stehen nur drin, wenn sie öffentlich auf der Website des Fonds stehen. Ohne verifiziertes LinkedIn-Profil öffnet der Link eine LinkedIn-Suche.

## Schnellstart

Keine Installation nötig: `index.html` im Browser öffnen. Oder als lokaler Server:

```bash
python3 -m http.server 3344
```

→ http://localhost:3344

## Daten pflegen

Alle Einträge stehen in [`data/vcs.js`](data/vcs.js). Neuen Eintrag anlegen: vorhandenen Block kopieren und anpassen.

Regeln für Einträge:

- **Quelle angeben:** Die Angaben müssen öffentlich überprüfbar sein (Website des Fonds, Pressemitteilung, Fachpresse).
- **E-Mail** nur, wenn sie öffentlich auf der Website des Fonds steht.
- **LinkedIn-Profil** nur, wenn es eindeutig zur Person gehört, sonst weglassen, die Seite erzeugt dann eine Suche.
- **Fokus:** `Exklusiv Gründerinnen` · `Gender-Lens` · `Diversity`
- **Region:** `Deutschland` · `Europa` · `Nordamerika` · `Asien-Pazifik` · `Afrika` · `Weltweit`
- **Art:** `VC-Fonds` · `Angel-Netzwerk` · `Programm`

## Projektstruktur

```
├── index.html          Der Radar
├── impressum.html      Impressum
├── datenschutz.html    Datenschutzerklärung
├── data/vcs.js         Alle Fonds & Programme (hier pflegen)
├── assets/
│   ├── app.js          Logik (Filter, Suche, Sortierung, Export)
│   ├── theme.js        Hell/Dunkel nach Systemeinstellung
│   ├── app.css         Gebautes CSS (Tailwind)
│   └── fonts/          DM Sans, JetBrains Mono
└── src/input.css       Quelle für assets/app.css
```

## Entwicklung

Das CSS ist vorgebaut. Nur wenn du **neue Tailwind-Klassen** im HTML verwendest, musst du neu bauen (Node.js nötig):

```bash
npm install
npm run build
```

Neue Fonds in `data/vcs.js` brauchen keinen Neubau.

Nach Änderungen an CSS, JavaScript oder Daten die Versionsnummer `?v=…` in den drei HTML-Dateien erhöhen (z. B. auf das aktuelle Datum). Dann laden Browser die neue Fassung statt einer zwischengespeicherten.

## Veröffentlichen

Die Seite ist komplett statisch und läuft auf jedem Webspace, z. B. GitHub Pages, Netlify oder einem deutschen Hoster.
Impressum und Datenschutzerklärung sind für GitHub Pages ausgefüllt. Bei einem Wechsel des Hosting-Anbieters den Abschnitt „Hosting“ in `datenschutz.html` anpassen.

## Haftungsausschluss

Kuratiert aus öffentlich zugänglichen Quellen, ohne Gewähr. Kriterien, Ticketgrößen und Kontaktwege ändern sich. Bitte vor dem Pitch auf der Website des Fonds prüfen. Keine Anlage- oder Finanzierungsberatung.

## Lizenz

Code und Daten: [MIT](LICENSE) © 2026 SmoochyPod UG (haftungsbeschränkt)

Mitgelieferte Drittanbieter-Dateien behalten ihre eigenen Lizenzen:
[DM Sans](https://fonts.google.com/specimen/DM+Sans/license) und [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt) (SIL Open Font License 1.1) ·
[Tailwind CSS](https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE) (MIT)

---

<div align="center">

Zusammengestellt von **Carolin Andree** · [LinkedIn](https://www.linkedin.com/in/carolinandree/)

</div>
