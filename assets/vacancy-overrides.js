(function () {
  "use strict";

  const ENDPOINT = "https://candidate-form-flow.lovable.app/api/public/vacancies";
  const allowedStatuses = new Set(["open", "paused", "closed"]);
  const allowedCurrencies = new Set(["PLN", "EUR"]);
  const periods = { hour: "час", month: "месяц" };

  function confirmation(value) {
    if (typeof value !== "string") return null;
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const isoTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value);
    if (!dateOnly && !isoTime) return null;
    const day = value.slice(0, 10);
    const calendarDate = new Date(`${day}T00:00:00Z`);
    const timestamp = Date.parse(dateOnly ? `${value}T00:00:00Z` : value);
    if (!Number.isFinite(timestamp) || !Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== day) return null;
    return { value, timestamp };
  }

  function applyOverride(job, override) {
    if (!job || !override || job.id !== override.jobId) return;
    const confirmed = [confirmation(override.lastConfirmedOn), confirmation(override.updatedAt)]
      .filter(Boolean).sort((a, b) => a.timestamp - b.timestamp).at(-1);
    const ownerConfirmed = confirmation(job.availabilityConfirmedOn);
    // A dated owner confirmation outranks older/default API availability.
    // Pay overrides keep their existing independent rules below.
    const statusIsCurrent = !ownerConfirmed || (confirmed && confirmed.timestamp > ownerConfirmed.timestamp);
    if (allowedStatuses.has(override.status) && statusIsCurrent) {
      job.status = override.status;
      if (confirmed) job.runtimeAvailabilityConfirmedOn = confirmed.value;
    }

    if (override.rateConfirmed === false) {
      job.runtimeRateUnconfirmed = true;
      job.salary = { ...(job.salary || {}), confirmed: false };
      return;
    }

    const min = Number(override.rateMin);
    const max = Number(override.rateMax);
    if (
      override.rateConfirmed === true &&
      Number.isFinite(min) && min > 0 &&
      Number.isFinite(max) && max >= min &&
      allowedCurrencies.has(override.rateCurrency) &&
      Object.prototype.hasOwnProperty.call(periods, override.ratePeriod)
    ) {
      job.runtimeRateUnconfirmed = false;
      job.salary = {
        ...(job.salary || {}),
        min,
        max,
        currency: override.rateCurrency,
        period: periods[override.ratePeriod],
        confirmed: true
      };
    }
  }

  window.PORTAL_VACANCY_OVERRIDES_READY = (async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch(ENDPOINT, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        signal: controller.signal
      });
      if (!response.ok) return;
      const body = await response.json();
      if (body?.ok !== true || !Array.isArray(body.vacancies)) return;
      const byId = new Map(body.vacancies.map((item) => [item?.jobId, item]));
      for (const job of window.PORTAL_CONTENT?.jobs || []) {
        applyOverride(job, byId.get(job.id));
      }
    } catch (error) {
      console.warn("[kiris-jobs] live vacancy status is temporarily unavailable", error);
    } finally {
      window.clearTimeout(timeout);
    }
  })();
})();
