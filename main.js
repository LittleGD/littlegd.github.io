/* JML.Studio: scroll reveal + pointer tilt. Vanilla, no dependencies. */

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealables = document.querySelectorAll('[data-reveal]');

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  /* reveal on scroll, once per element */
  if (reduce || !('IntersectionObserver' in window)) {
    each(revealables, function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -24px 0px' });
    each(revealables, function (el) { io.observe(el); });
  }

  /* 3D tilt on the app icon, fine pointers only */
  var tilt = document.querySelector('[data-tilt]');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!tilt || !finePointer || reduce) return;

  var MAX = 15;
  var zone = tilt.parentNode;

  function reset() {
    tilt.style.transform = '';
  }

  zone.addEventListener('pointermove', function (event) {
    var box = tilt.getBoundingClientRect();
    var x = (event.clientX - box.left) / box.width - 0.5;
    var y = (event.clientY - box.top) / box.height - 0.5;
    tilt.style.transform =
      'rotateX(' + (-y * MAX).toFixed(2) + 'deg) ' +
      'rotateY(' + (x * MAX).toFixed(2) + 'deg) scale(1.06)';
  });

  zone.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
});
