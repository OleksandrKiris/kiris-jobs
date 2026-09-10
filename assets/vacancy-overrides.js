(function () {
  "use strict";

  const ENDPOINT = "https://candidate-form-flow.lovable.app/api/public/vacancies";
  const allowedStatuses = new Set(["open", "paused", "closed"]);
  const allowedCurrencies = new Set(["PLN", "EUR"]);
  const periods = { hour: "час", month: "месяц" };

  function validDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
  }

  function applyOverride(job, override) {
    if (!job || !override || job.id !== override.jobId) return;
    if (allowedStatuses.has(override.status)) job.status = override.status;

    const confirmedOn = validDate(override.lastConfirmedOn);
    if (confirmedOn) job.updatedAt = confirmedOn;

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
