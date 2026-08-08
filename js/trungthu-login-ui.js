/* Trung Thu login UI — stars */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stars = document.getElementById('stars');
  if (stars && !reduce) {
    const count = window.innerWidth < 700 ? 40 : 70;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'star';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.setProperty('--d', 1.8 + Math.random() * 2.8 + 's');
      s.style.animationDelay = Math.random() * 2 + 's';
      const size = 1 + Math.random() * 2;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      frag.appendChild(s);
    }
    stars.appendChild(frag);
  }
})();
