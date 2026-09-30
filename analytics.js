/* Shared GA4 tag for the public studio website. */
(() => {
  if (window.location.hostname !== 'littlegd.github.io') return;
  if (document.getElementById('jml-ga4-loader')) return;

  const measurementId = 'G-1L3JRK6FVG';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  const tag = document.createElement('script');
  tag.id = 'jml-ga4-loader';
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(tag);
})();
