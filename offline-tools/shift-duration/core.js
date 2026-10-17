(function (root) {
  'use strict';
  const KEY = 'primserv.offline.shift-duration.v1';
  const LANGS = ['ru', 'uk', 'pl', 'en', 'ka', 'tr', 'hy'];
  const empty = () => ({ start: '', end: '', nextDay: false, breakMinutes: '0', lang: 'en' });
  function language(value) { return value === 'ua' ? 'uk' : LANGS.includes(value) ? value : 'en'; }
  function minutes(value) {
    if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  }
  function calculate(v) {
    const start = minutes(v.start), end = minutes(v.end);
    if (start === null) return { error: 'timeError', field: 'start' };
    if (end === null) return { error: 'timeError', field: 'end' };
    if (typeof v.nextDay !== 'boolean') return { error: 'rangeError', field: 'nextDay' };
    const total = end - start + (v.nextDay ? 1440 : 0);
    if (total <= 0 || total >= 1440) return { error: 'rangeError', field: 'end' };
    if (typeof v.breakMinutes !== 'string' || !/^\d{1,4}$/.test(v.breakMinutes)) return { error: 'breakError', field: 'breakMinutes' };
    const rest = Number(v.breakMinutes);
    if (rest >= total) return { error: 'breakError', field: 'breakMinutes' };
    return { total, rest, net: total - rest };
  }
  // Rounded readout only; exact minute arithmetic and v1 saves are unchanged.
  function decimalHours(netMinutes) {
    if (!Number.isInteger(netMinutes) || netMinutes < 0 || netMinutes >= 1440) return null;
    const hundredths = Math.round(netMinutes * 100 / 60);
    return `${Math.floor(hundredths / 100)}.${String(hundredths % 100).padStart(2, '0')}`;
  }
  function validState(v) {
    return v && typeof v === 'object' && !Array.isArray(v) &&
      Object.keys(v).length === 5 && ['start', 'end'].every(k => typeof v[k] === 'string' && (v[k] === '' || minutes(v[k]) !== null)) &&
      typeof v.nextDay === 'boolean' && typeof v.breakMinutes === 'string' && /^\d{1,4}$/.test(v.breakMinutes) && LANGS.includes(v.lang);
  }
  function read(getStorage) {
    try {
      const raw = getStorage().getItem(KEY);
      if (raw === null) return { status: 'empty', value: empty() };
      const parsed = JSON.parse(raw);
      if (parsed?.version !== 1 || !validState(parsed.value)) return { status: 'unsupported', value: empty() };
      return { status: 'loaded', value: parsed.value };
    } catch (error) {
      return { status: error instanceof SyntaxError ? 'unsupported' : 'unavailable', value: empty() };
    }
  }
  function save(getStorage, value) {
    if (!validState(value)) return 'saveFailed';
    const old = read(getStorage);
    if (old.status === 'unsupported') return 'unsupported';
    // A failed read is not an empty slot: preserve the unseen previous record.
    if (old.status === 'unavailable') return 'saveFailed';
    try { getStorage().setItem(KEY, JSON.stringify({ version: 1, value })); return 'saved'; }
    catch { return 'saveFailed'; }
  }
  function forget(getStorage, confirmed) {
    if (!confirmed) return 'cancelled';
    try { getStorage().removeItem(KEY); return 'forgotten'; }
    catch { return 'saveFailed'; }
  }
  const api = { KEY, LANGS, empty, language, minutes, calculate, decimalHours, validState, read, save, forget };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShiftDuration = api;
})(typeof window !== 'undefined' ? window : this);


