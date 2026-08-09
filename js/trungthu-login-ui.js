/* Trung Thu login UI — stars */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stars = document.getElementById('stars');
  if (!stars) return;

  const count = window.innerWidth < 700 ? 90 : 160;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    const bright = Math.random() > 0.72;
    s.className = bright ? 'star star-bright' : 'star';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    const size = bright ? 2 + Math.random() * 2.4 : 1.2 + Math.random() * 1.8;
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    if (!reduce) {
      s.style.setProperty('--d', 1.6 + Math.random() * 3.2 + 's');
      s.style.animationDelay = Math.random() * 3 + 's';
    } else {
      s.style.animation = 'none';
      s.style.opacity = String(0.55 + Math.random() * 0.45);
    }
    frag.appendChild(s);
  }
  stars.appendChild(frag);
})();
