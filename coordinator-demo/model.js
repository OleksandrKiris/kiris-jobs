(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CoordinatorDemo = api;
})(typeof window === 'object' ? window : this, function () {
  'use strict';
  const KEY = 'primserv:coordinator-demo:v1';
  const IDS = Object.freeze(['demo-01', 'demo-02', 'demo-03']);
  const STATUSES = Object.freeze(['todo', 'doing', 'done']);
  const LANGS = Object.freeze(['ru', 'uk', 'pl', 'en']);
  const initial = () => Object.fromEntries(IDS.map(id => [id, 'todo']));
  function language(value) {
    const code = String(value || 'en').toLowerCase();
    return code === 'ua' ? 'uk' : LANGS.includes(code) ? code : 'en';
  }
  function decode(raw) {
    if (raw === null) return initial();
    if (typeof raw !== 'string' || raw.length > 2000) throw Error('invalid');
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 || Object.keys(value).sort().join(',') !== 'statuses,version') throw Error('invalid');
    const statuses = value.statuses;
    if (!statuses || typeof statuses !== 'object' || Array.isArray(statuses) ||
        Object.keys(statuses).sort().join(',') !== IDS.join(',') ||
        IDS.some(id => !STATUSES.includes(statuses[id]))) throw Error('invalid');
    return Object.fromEntries(IDS.map(id => [id, statuses[id]]));
  }
  function create(storage) {
    let statuses = initial();
    let persistence = 'ready';
    let canWrite = true;
    try { statuses = decode(storage.getItem(KEY)); }
    catch (error) {
      persistence = error?.message === 'invalid' || error instanceof SyntaxError ? 'invalid' : 'blocked';
      canWrite = false;
    }
    function save() {
      // Never overwrite an unknown or damaged format, even after an edit.
      if (!canWrite) return;
      try { storage.setItem(KEY, JSON.stringify({version:1, statuses})); persistence = 'saved'; }
      catch { persistence = 'blocked'; }
    }
    return {
      snapshot: () => ({statuses:{...statuses}, persistence}),
      list(filter = 'all') { return IDS.filter(id => filter === 'all' || statuses[id] === filter); },
      set(id, status) {
        if (!IDS.includes(id) || !STATUSES.includes(status)) return false;
        statuses = {...statuses, [id]:status}; save(); return true;
      },
      reset(confirmed) {
        if (confirmed !== true) return false;
        try { storage.removeItem(KEY); persistence = 'ready'; canWrite = true; }
        catch { persistence = persistence === 'invalid' ? 'invalid' : 'blocked'; }
        statuses = initial(); return true;
      }
    };
  }
  return Object.freeze({KEY, IDS, STATUSES, LANGS, initial, language, decode, create});
});
