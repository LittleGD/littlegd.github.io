/* FAGL pages: the language menu and the timer demo. Each language has its own
   page; the inline script in <head> sends a visitor to theirs. Vanilla, no
   dependencies. */

(function () {
  var switchers = document.querySelectorAll('.lang');

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  /* a language picked in the menu is remembered, so the default (English)
     address opens in it next time; the link itself does the navigation */
  each(document.querySelectorAll('[data-set-lang]'), function (link) {
    link.addEventListener('click', function () {
      try { localStorage.setItem('fagl-lang', link.getAttribute('data-set-lang')); } catch (e) {}
    });
  });

  /* the menu closes on a click elsewhere or on Escape */
  document.addEventListener('click', function (event) {
    each(switchers, function (details) {
      if (details.open && !details.contains(event.target)) details.open = false;
    });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    each(switchers, function (details) {
      if (details.open) {
        details.open = false;
        details.querySelector('summary').focus();
      }
    });
  });

  /* Timer demo: a 25 minute goal. When the card comes into view, the timer
     runs from 25:00 down to 18:21 in under five seconds, easing out, and
     stops there, the state the CSS draws without script. It plays again the
     next time the card comes into view. The red wedge is the time left
     against the goal, as in the app. Never with reduced motion. */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var demos = document.querySelectorAll('.demo');
  if (!demos.length || !('IntersectionObserver' in window)) return;

  var GOAL = 25 * 60; // seconds on the timer
  var REST = 18 * 60 + 21; // where it stops
  var PLAY = 4.5; // seconds of real time, under WCAG's five

  function label(seconds) {
    var s = Math.ceil(seconds);
    var m = Math.floor(s / 60);
    s -= m * 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  each(demos, function (demo) {
    var time = demo.querySelector('.demo-time');
    var frame = 0;
    var start = 0;
    var shown = '';

    function show(left) {
      demo.style.setProperty('--sweep', (left / GOAL) * 360 + 'deg');
      var text = label(left);
      if (text !== shown) {
        time.textContent = text;
        shown = text;
      }
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      show(REST);
    }

    function tick(now) {
      if (!start) start = now;
      var p = Math.min(1, (now - start) / 1000 / PLAY);
      show(GOAL - (GOAL - REST) * (1 - Math.pow(1 - p, 3)));
      frame = p < 1 ? requestAnimationFrame(tick) : 0;
    }

    new IntersectionObserver(function (entries) {
      var visible = entries[entries.length - 1].isIntersecting;
      if (visible && !frame && !reduce.matches) {
        start = 0;
        frame = requestAnimationFrame(tick);
      } else if (!visible && frame) {
        stop();
      }
    }, { threshold: 0.6 }).observe(demo);

    /* reduced motion turned on mid-visit: stop at once */
    if (reduce.addEventListener) {
      reduce.addEventListener('change', function () {
        if (reduce.matches && frame) stop();
      });
    }
  });
})();
