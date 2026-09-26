/* Moraro pages: the language menu. Each language has its own page; the inline
   script in <head> sends a visitor to theirs. Vanilla, no dependencies. */

(function () {
  var switchers = document.querySelectorAll('.lang');

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  /* a language picked in the menu is remembered, so the default (English)
     address opens in it next time; the link itself does the navigation */
  each(document.querySelectorAll('[data-set-lang]'), function (link) {
    link.addEventListener('click', function () {
      try { localStorage.setItem('moraro-lang', link.getAttribute('data-set-lang')); } catch (e) {}
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
})();
