import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile(new URL('../assets/vacancy-overrides.js', import.meta.url), 'utf8');
const fixture = () => ({
  id: 'greenhouse-tomatoes', status: 'open', updatedAt: '2026-07-23',
  availabilityConfirmedOn: '2026-10-15',
  salary: { confirmed: true, min: 31.4, max: 31.4, currency: 'PLN', period: 'час' },
  benefits: ['Accommodation must be confirmed for this site.'],
  contract: 'Original contract conditions'
});

async function apply(override, job = fixture()) {
  const window = { PORTAL_CONTENT: { jobs: [job] }, setTimeout, clearTimeout };
  vm.runInNewContext(source, { window, AbortController, console, fetch: async (url, options) => {
    assert.equal(url, 'https://candidate-form-flow.lovable.app/api/public/vacancies');
    assert.equal(options.method, 'GET');
    return { ok: true, json: async () => ({ ok: true, vacancies: [{ jobId: job.id, ...override }] }) };
  } });
  await window.PORTAL_VACANCY_OVERRIDES_READY;
  return job;
}

test('new owner availability keeps the job open despite the old July pause', async () => {
  const job = fixture(), original = structuredClone(job);
  await apply({ status: 'paused', lastConfirmedOn: '2026-07-23' }, job);
  assert.deepEqual(job, original);
});

test('undated and equal-date default pauses do not overrule a dated owner confirmation', async () => {
  for (const lastConfirmedOn of [undefined, '', '2026-10-15', '2026-02-30']) {
    const job = await apply({ status: 'paused', lastConfirmedOn });
    assert.equal(job.status, 'open');
    assert.equal(job.updatedAt, '2026-07-23');
  }
});

test('newer pause and closure remain authoritative without relabeling old conditions', async () => {
  for (const status of ['paused', 'closed']) {
    const job = await apply({ status, lastConfirmedOn: '2026-10-16' });
    assert.equal(job.status, status);
    assert.equal(job.runtimeAvailabilityConfirmedOn, '2026-10-16');
    assert.equal(job.updatedAt, '2026-07-23');
    assert.deepEqual(job.salary, fixture().salary);
    assert.deepEqual(job.benefits, fixture().benefits);
    assert.equal(job.contract, fixture().contract);
  }
});

test('same-day newer ISO status timestamps are compared without truncating the time', async () => {
  for (const timestamp of ['2026-10-15T20:00:00Z', '2026-10-15T22:00:00+02:00', '2026-10-15T20:00:00.123456Z']) {
    const job = await apply({ status: 'paused', lastConfirmedOn: '2026-10-15', updatedAt: timestamp });
    assert.equal(job.status, 'paused');
    assert.equal(job.runtimeAvailabilityConfirmedOn, timestamp);
    assert.equal(job.updatedAt, '2026-07-23');
  }
  const job = await apply({ status: 'closed', lastConfirmedOn: '2026-10-15T20:00:00.000Z' });
  assert.equal(job.status, 'closed');
});

test('ISO timezone offsets use actual time order rather than lexical date order', async () => {
  const beforeOwner = await apply({ status: 'paused', updatedAt: '2026-10-15T00:30:00+02:00' });
  assert.equal(beforeOwner.status, 'open');
  const afterOwner = await apply({ status: 'paused', updatedAt: '2026-10-14T23:30:00-02:00' });
  assert.equal(afterOwner.status, 'paused');
});

test('a stale availability override does not suppress independent pay updates', async () => {
  const job = await apply({ status: 'paused', lastConfirmedOn: '2026-07-23', rateConfirmed: false });
  assert.equal(job.status, 'open');
  assert.equal(job.salary.confirmed, false);
  assert.equal(job.runtimeRateUnconfirmed, true);
  assert.equal(job.updatedAt, '2026-07-23');
});

test('jobs without an explicit owner confirmation retain existing API availability behavior', async () => {
  const job = fixture(); delete job.availabilityConfirmedOn;
  await apply({ status: 'paused' }, job);
  assert.equal(job.status, 'paused');
  assert.equal(job.updatedAt, '2026-07-23');
});
