// Dunkles Design nach Systemeinstellung, bevor die Seite gezeichnet wird. Es wird nichts gespeichert.
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}
