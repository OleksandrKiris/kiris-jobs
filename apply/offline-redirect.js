(() => {
  'use strict';
  if (/\/offline\.html$/i.test(location.pathname)) return;
  location.replace(`offline.html${location.search}${location.hash}`);
})();
