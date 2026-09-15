/* JML.Studio: keep the pixel logo on whole device pixels, fit the shelf to
   one screen, stagger it in, then let each icon tilt toward the pointer and
   catch the light on its rim. Vanilla, no dependencies. */

(function () {
  /* glass.js is a module, so it runs after this. Where WebGL exists, hide
     the CSS icons until the glass takes over, and bring them back if it
     never does (no WebGL, blocked CDN, an error). */
  var root = document.documentElement;
  if (window.WebGLRenderingContext && 'noModule' in document.createElement('script')) {
    root.classList.add('glass-pending');
    setTimeout(function () {
      root.classList.remove('glass-pending');
    }, 4000);
  }

  var logo = document.querySelector('.logo');
  var shelf = document.querySelector('.shelf');
  var list = document.querySelector('.apps');
  var apps = list.querySelectorAll('.app');
  var links = list.querySelectorAll('.app-link');
  var MIN_ICON = 40;

  function each(nodes, fn) {
    Array.prototype.forEach.call(nodes, fn);
  }

  function num(css, name) {
    return parseFloat(css.getPropertyValue(name));
  }

  /* One Bytesized pixel is font-size / 8. Round it, and the letter spacing,
     to whole device pixels so the wordmark keeps hard edges at any display
     scaling or zoom. */
  function snapLogo() {
    logo.style.fontSize = '';
    logo.style.letterSpacing = '';
    var dpr = window.devicePixelRatio || 1;
    var css = getComputedStyle(logo);
    var cssSize = parseFloat(css.fontSize);
    var tracking = (parseFloat(css.letterSpacing) || 0) / cssSize;
    var size = (Math.max(1, Math.round((cssSize / 8) * dpr)) / dpr) * 8;
    logo.style.fontSize = size + 'px';
    logo.style.letterSpacing = Math.round(size * tracking * dpr) / dpr + 'px';
  }

  /* Choose a column count and icon size that show every app without
     scrolling. Walk the row counts from fewest up, balance the columns for
     each, and take the first layout that stays within --max-cols and keeps
     icons at 75% of full size or more. If none does (a short landscape
     phone, a long catalog), take whichever gives the biggest icons. */
  function fit() {
    list.style.removeProperty('--icon');
    list.style.removeProperty('--cols');

    var css = getComputedStyle(list);
    var cell = num(css, '--cell-ratio');
    var gapX = num(css, '--gap-x-ratio');
    var gapY = num(css, '--gap-y-ratio');
    var maxCols = num(css, '--max-cols');
    /* styles not applied yet: leave the CSS defaults alone */
    if ([cell, gapX, gapY, maxCols].some(isNaN)) return;

    var full = apps[0].querySelector('.app-icon').offsetWidth;

    /* name plus the gap above it, at full size; the real height is checked
       again once a size is picked */
    var label = 0;
    each(apps, function (app) {
      label = Math.max(label, app.offsetHeight - full);
    });

    /* the box CSS lays out (body min-height is 100dvh) minus header, footer
       and padding. Not window.innerHeight, which WebKit shrinks with pinch
       zoom. Works whether or not the shelf overflows right now. */
    var shelfCss = getComputedStyle(shelf);
    var width = shelf.clientWidth;
    var height = parseFloat(getComputedStyle(document.body).minHeight) -
      (document.body.offsetHeight - shelf.offsetHeight) -
      parseFloat(shelfCss.paddingTop) - parseFloat(shelfCss.paddingBottom);

    var n = apps.length;
    var pick = null;
    for (var rows = 1; rows <= n; rows++) {
      var cols = Math.ceil(n / rows);
      var icon = Math.min(
        full,
        width / (cols * cell + (cols - 1) * gapX),
        (height - rows * label) / (rows + (rows - 1) * gapY)
      );
      var option = { cols: cols, icon: icon };
      if (cols <= maxCols && icon >= full * 0.75) {
        pick = option;
        break;
      }
      if (!pick || icon > pick.icon) pick = option;
    }

    /* at the floor the picked columns may no longer fit across: rebalance */
    var size = Math.max(MIN_ICON, Math.floor(pick.icon));
    var across = Math.max(1, Math.floor((width + gapX * size) / (size * (cell + gapX))));
    if (pick.cols > across) pick.cols = Math.ceil(n / Math.ceil(n / across));

    list.style.setProperty('--cols', pick.cols);
    list.style.setProperty('--icon', size + 'px');

    /* names wrap onto more lines as the cells narrow, so check the real
       height and step down until the shelf fits */
    while (size > MIN_ICON && list.offsetHeight > height) {
      size -= 2;
      list.style.setProperty('--icon', size + 'px');
    }
  }

  /* the inked note above the portfolio link steps aside if a crowded shelf
     reaches down to it */
  var doodle = document.querySelector('.doodle');
  function placeDoodle() {
    if (!doodle) return;
    doodle.classList.remove('is-crowded');
    var note = doodle.getBoundingClientRect();
    var crowded = Array.prototype.some.call(apps, function (app) {
      var box = app.getBoundingClientRect();
      return box.left < note.right && box.right > note.left &&
        box.top < note.bottom && box.bottom > note.top;
    });
    doodle.classList.toggle('is-crowded', crowded);
  }

  var queued = false;
  function layout() {
    queued = false;
    snapLogo();
    if (apps.length) fit();
    placeDoodle();
  }

  layout();
  window.addEventListener('resize', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(layout);
  });

  each(apps, function (app, i) {
    app.style.setProperty('--i', i);
  });

  /* iOS only paints :active when the page listens for touches; this lets the
     tap press in style.css show on iPhone */
  document.addEventListener('touchstart', function () {}, { passive: true });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce || !finePointer) return;

  var MAX_TILT = 10;
  var REST_LIGHT = 160;

  function clamp(v) {
    return Math.max(-0.5, Math.min(0.5, v));
  }

  /* step to the equivalent angle nearest the current one, so the rim light
     never spins the long way round when it crosses 0deg */
  function nearest(from, to) {
    return from + ((((to - from) % 360) + 540) % 360) - 180;
  }

  each(links, function (link) {
    var icon = link.querySelector('.app-icon');
    var light = REST_LIGHT;

    /* measure the link, never the tilted icon, so the tilt can't feed back */
    link.addEventListener('pointermove', function (event) {
      var box = link.getBoundingClientRect();
      var size = icon.offsetWidth;
      var x = clamp((event.clientX - box.left - box.width / 2) / size);
      var y = clamp((event.clientY - box.top - size / 2) / size);

      light = nearest(light, Math.atan2(-x, y) * 180 / Math.PI);
      icon.style.setProperty('--rx', (-y * MAX_TILT).toFixed(2) + 'deg');
      icon.style.setProperty('--ry', (x * MAX_TILT).toFixed(2) + 'deg');
      icon.style.setProperty('--light', light.toFixed(1) + 'deg');
    });

    link.addEventListener('pointerleave', function () {
      light = nearest(light, REST_LIGHT);
      icon.style.removeProperty('--rx');
      icon.style.removeProperty('--ry');
      icon.style.setProperty('--light', light.toFixed(1) + 'deg');
    });
  });
})();
