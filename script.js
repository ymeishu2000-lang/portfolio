document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------------------------------------------
     1. Intro text reveal (h3 → p, staggered by 0.3s)
  ----------------------------------------------------------- */
  const introEl = document.querySelector('.intro');
  const titleMask = document.getElementById('revealTitle');
  const textMask = document.getElementById('revealText');

  if (introEl && titleMask && textMask) {
    const introObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        titleMask.classList.add('in-view');
        window.setTimeout(() => {
          textMask.classList.add('in-view');
        }, 300); // 0.3s gap between title and text

        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.3
    });

    introObserver.observe(introEl);
  }

  /* -----------------------------------------------------------
     2. Bento grid items: blur(30px) -> blur(0), staggered
        by order of appearance in the viewport.
  ----------------------------------------------------------- */
  const galleryItems = document.querySelectorAll('.gallery-item');
  let revealCount = 0;
  const STEP_MS = 90;   // delay added per item, in reveal order
  const MAX_DELAY_MS = 540;

  const gridObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const delay = Math.min(revealCount * STEP_MS, MAX_DELAY_MS);
      revealCount += 1;

      entry.target.style.transitionDelay = `${delay}ms`;
      entry.target.classList.add('in-view');

      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  galleryItems.forEach(item => gridObserver.observe(item));

});
/* -----------------------------------------------------------
   3. Masonry with flush bottoms
      カードを実際の列要素へ振り分け、列の高さを
      縦横比の重みで分配して底辺を揃える。
----------------------------------------------------------- */
const bento = document.querySelector('.bento');

if (bento) {
  // 重み = 高さ / 幅（CSS の aspect-ratio と対応）
  const RATIO = {
    'ratio-square': 1,
    'ratio-portrait': 4 / 3,
    'ratio-tall': 3 / 2,
    'ratio-wide': 3 / 4
  };

  const items = Array.from(bento.querySelectorAll('.gallery-item'));
  const weights = items.map(item => {
    const key = Object.keys(RATIO).find(k => item.classList.contains(k));
    return key ? RATIO[key] : 1;
  });

  // style2.css のブレークポイントと合わせる
  const getColumnCount = () =>
    window.innerWidth >= 1024 ? 4 : window.innerWidth >= 767 ? 3 : 2;

  let currentCols = 0;

  const build = cols => {
    bento.replaceChildren(); // items は配列で保持しているので破棄されない
    const columns = [];
    const loads = new Array(cols).fill(0);

    for (let i = 0; i < cols; i++) {
      const col = document.createElement('div');
      col.className = 'bento-col';
      columns.push(col);
      bento.appendChild(col);
    }

    items.forEach((item, i) => {
      // 現時点で最も低い列に入れる
      let target = 0;
      for (let c = 1; c < cols; c++) {
        if (loads[c] < loads[target]) target = c;
      }
      columns[target].appendChild(item);
      loads[target] += weights[i];
      item.style.flexGrow = weights[i];
    });

    currentCols = cols;
  };

  const layout = () => {
    const cols = getColumnCount();
    if (cols !== currentCols) build(cols);

    const gap = parseFloat(getComputedStyle(bento).rowGap) || 0;
    const columns = Array.from(bento.children);
    const colWidth = columns[0].getBoundingClientRect().width;

    // 各列の「自然な高さ」を求め、その最大値を壁の高さにする
    let tallest = 0;
    columns.forEach(col => {
      const children = Array.from(col.children);
      const sum = children.reduce(
        (acc, el) => acc + (parseFloat(el.style.flexGrow) || 1), 0
      );
      const height = sum * colWidth + gap * Math.max(children.length - 1, 0);
      if (height > tallest) tallest = height;
    });

    bento.style.height = `${tallest}px`;
  };

  bento.classList.add('is-flush');
  layout();

  let resizeRaf;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(layout);
  });
}