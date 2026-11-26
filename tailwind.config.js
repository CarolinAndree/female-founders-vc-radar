/** @type {import('tailwindcss').Config} */
// Swiss Style: zwei Hauptfarben (Papier, Tinte) und eine Akzentfarbe (Signalrot).
// Hell/Dunkel tauscht nur die CSS-Variablen in src/input.css.
module.exports = {
  content: ['./*.html', './data/*.js', './assets/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      borderRadius: { none: '0', DEFAULT: '0', full: '9999px' } // full nur für das runde Porträt
    }
  }
};
