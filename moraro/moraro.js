/* Moraro pages: the language menu. Each link opens its own stable language
   address. Vanilla, no dependencies. */

(function () {
  var switchers = document.querySelectorAll('.lang');

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

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
