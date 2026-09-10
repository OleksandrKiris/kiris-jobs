(function () {
  "use strict";

  const content = window.PORTAL_CONTENT;
  const i18n = window.PortalI18n;
  const jobs = content.jobs || [];
  const profile = content.profile || {};
  const housing = content.housingLocations || {};
  const state = { query: "", country: "", feature: "", openJobId: "" };
  const lightboxState = {
    items: [],
    index: 0,
    trigger: null,
    pointerStartX: null
  };
  const directPathMatch = location.pathname.match(/\/vacancies\/([^/]+)\/?$/);
  const directJobId = directPathMatch ? decodeURIComponent(directPathMatch[1]) : "";
  const CATALOG_COPY = {
    ru: { allConditions: "Все условия", housing: "Жильё", noExperience: "Без опыта", pairs: "Для пар", official: "Официально", hoursExample: "Пример за 200 ч" },
    uk: { allConditions: "Усі умови", housing: "Житло", noExperience: "Без досвіду", pairs: "Для пар", official: "Офіційно", hoursExample: "Приклад за 200 год" },
    pl: { allConditions: "Wszystkie warunki", housing: "Zakwaterowanie", noExperience: "Bez doświadczenia", pairs: "Dla par", official: "Legalnie", hoursExample: "Przykład za 200 godz." },
    en: { allConditions: "All conditions", housing: "Housing", noExperience: "No experience", pairs: "Couples", official: "Official contract", hoursExample: "Example for 200 h" },
    az: { allConditions: "Bütün şərtlər", housing: "Yaşayış yeri", noExperience: "Təcrübəsiz", pairs: "Cütlüklər üçün", official: "Rəsmi", hoursExample: "200 saat üçün nümunə" },
    ka: { allConditions: "ყველა პირობა", housing: "საცხოვრებელი", noExperience: "გამოცდილების გარეშე", pairs: "წყვილებისთვის", official: "ოფიციალურად", hoursExample: "მაგალითი 200 საათზე" },
    id: { allConditions: "Semua kondisi", housing: "Tempat tinggal", noExperience: "Tanpa pengalaman", pairs: "Untuk pasangan", official: "Resmi", hoursExample: "Contoh untuk 200 jam" },
    es: { allConditions: "Todas las condiciones", housing: "Alojamiento", noExperience: "Sin experiencia", pairs: "Para parejas", official: "Contrato oficial", hoursExample: "Ejemplo por 200 h" },
    fil: { allConditions: "Lahat ng kondisyon", housing: "Tirahan", noExperience: "Walang karanasan", pairs: "Para sa magkapareha", official: "Opisyal", hoursExample: "Halimbawa sa 200 oras" },
    ne: { allConditions: "सबै सर्तहरू", housing: "आवास", noExperience: "अनुभव नचाहिने", pairs: "जोडीका लागि", official: "आधिकारिक", hoursExample: "२०० घण्टाको उदाहरण" },
    hy: { allConditions: "Բոլոր պայմանները", housing: "Բնակարան", noExperience: "Առանց փորձի", pairs: "Զույգերի համար", official: "Պաշտոնական", hoursExample: "Օրինակ՝ 200 ժամի համար" }
  };
  const VACANCY_FRESHNESS_DAYS = 60;
  const FUNNEL_API_URL = "https://candidate-form-flow.lovable.app/api/public/funnel";

  const $ = (id) => document.getElementById(id);
  const escapeHTML = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const catalogCopy = (key) => CATALOG_COPY[i18n.locale]?.[key] || CATALOG_COPY.en[key] || key;

  function trackFunnel(event, jobId = "") {
    const key = `kiris-funnel:${event}:${jobId || "catalog"}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Aggregate metrics remain optional when browser storage is unavailable.
    }
    fetch(FUNNEL_API_URL, {
      method: "POST",
      credentials: "omit",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, jobId, locale: i18n.locale })
    }).catch(() => {});
  }

  function countryCode(job) {
    const format = String(job.format || "").toLowerCase();
    if (format.includes("польш")) return "PL";
    if (format.includes("венгр")) return "HU";
    if (format.includes("бельг")) return "BE";
    return "EU";
  }

  function localized(job) {
    return i18n.job(job);
  }

  function effectiveStatus(job) {
    if (job?.status !== "open" || !job.updatedAt) return job?.status || "verify";
    const checkedAt = Date.parse(`${job.updatedAt}T23:59:59Z`);
    const expiresAt = checkedAt + VACANCY_FRESHNESS_DAYS * 24 * 60 * 60 * 1000;
    return Number.isFinite(checkedAt) && Date.now() > expiresAt ? "verify" : "open";
  }

  function canApply(job) {
    return ["open", "verify"].includes(effectiveStatus(job));
  }

  function statusLabel(job) {
    const labels = {
      open: "ui.recruitmentOpen",
      verify: "ui.recruitmentVerify",
      paused: "ui.recruitmentPaused",
      closed: "ui.recruitmentClosed"
    };
    return i18n.t(labels[effectiveStatus(job)] || labels.verify);
  }

  function salary(job) {
    const value = localized(job).salary || {};
    const min = Number(value.min);
    const max = Number(value.max);
    if (!Number.isFinite(min) && !Number.isFinite(max)) {
      return value.display || value.note || i18n.t("ui.rateNeedsConfirmation");
    }
    const number = (amount) => new Intl.NumberFormat(i18n.localeTag(), {
      minimumFractionDigits: amount % 1 ? 2 : 0,
      maximumFractionDigits: 2
    }).format(amount);
    const range = Number.isFinite(min) && Number.isFinite(max) && min !== max
      ? `${number(min)}–${number(max)}`
      : number(Number.isFinite(min) ? min : max);
    const periodLabels = {
      "час": {
        ru: "час", uk: "год", pl: "godz.", en: "hour", az: "saat", ka: "საათი",
        id: "jam", es: "hora", fil: "oras", ne: "घण्टा", hy: "ժամ"
      },
      "месяц": {
        ru: "месяц", uk: "місяць", pl: "mies.", en: "month", az: "ay", ka: "თვე",
        id: "bulan", es: "mes", fil: "buwan", ne: "महिना", hy: "ամիս"
      }
    };
    const period = periodLabels[value.period]?.[i18n.locale] || value.period || "";
    const rate = `${range} ${value.currency || ""}${period ? ` / ${period}` : ""}`.trim();
    return `${rate} · ${i18n.t("ui.grossShort")}`;
  }

  function salaryExample(job) {
    const value = localized(job).salary || {};
    if (value.period !== "час") return "";
    const min = Number(value.min);
    const max = Number(value.max);
    if (!Number.isFinite(min) && !Number.isFinite(max)) return "";
    const format = (amount) => new Intl.NumberFormat(i18n.localeTag(), {
      maximumFractionDigits: 0
    }).format(amount * 200);
    const range = Number.isFinite(min) && Number.isFinite(max) && min !== max
      ? `${format(min)}–${format(max)}`
      : format(Number.isFinite(min) ? min : max);
    return `${catalogCopy("hoursExample")}: ≈ ${range} ${value.currency || ""} · ${i18n.t("ui.grossShort")}`;
  }

  function jobBenefitFlags(job) {
    const result = [];
    if ((job.housingLocations || []).length) result.push("housing");
    if (String(job.level || "").toLocaleLowerCase("ru").includes("без опыта")) result.push("noExperience");
    if ((job.candidates || []).some((item) => String(item).toLocaleLowerCase("ru").includes("пар"))) result.push("pairs");
    if (/официально|umowa o pracę/i.test(String(job.contract || ""))) result.push("official");
    return result;
  }

  function jobBenefits(job) {
    return jobBenefitFlags(job).map(catalogCopy).slice(0, 4);
  }

  function publicJobUrl(job) {
    const url = new URL(`vacancies/${encodeURIComponent(job.id)}/`, new URL("./", document.baseURI));
    url.searchParams.set("lang", i18n.locale);
    const source = new URL(location.href).searchParams.get("src");
    if (source) url.searchParams.set("src", source);
    return url.toString();
  }

  function catalogUrl() {
    const url = new URL("./", document.baseURI);
    url.searchParams.set("lang", i18n.locale);
    const source = new URL(location.href).searchParams.get("src");
    if (source) url.searchParams.set("src", source);
    return url.toString();
  }

  function applicationUrl(job) {
    const url = new URL(publicJobUrl(job));
    url.searchParams.set("apply", "1");
    return url.toString();
  }

  function housingEntries(job) {
    return (job.housingLocations || [])
      .map((key) => [key, housing[key]])
      .filter(([, location]) => location?.photoCount);
  }

  function photoUrl(key, index) {
    return `assets/housing/${key}/${key}-${String(index + 1).padStart(2, "0")}.webp`;
  }

  function photoThumbnailUrl(key, index) {
    return `assets/housing-thumbs/${key}/${key}-${String(index + 1).padStart(2, "0")}.webp`;
  }

  function card(job) {
    const view = localized(job);
    const jobUrl = publicJobUrl(job);
    const cardAction = i18n.t("ui.viewOffer");
    const accessibleLabel = `${cardAction}: ${view.title}`;
    const benefits = jobBenefits(job);
    return `
      <article class="job-card" data-job-id="${escapeHTML(job.id)}" data-status="${escapeHTML(effectiveStatus(job))}">
        <a class="job-card-link job-open" href="${escapeHTML(jobUrl)}" data-open-job="${escapeHTML(job.id)}" aria-label="${escapeHTML(accessibleLabel)}">
          <div class="job-card-body">
            <div class="job-card-copy">
              <div class="job-tags">
                <span class="job-status">${escapeHTML(statusLabel(job))}</span>
              </div>
              <h2>${escapeHTML(view.title)}</h2>
              ${benefits.length ? `<div class="job-benefit-tags">${benefits.map((item) => `<span>${escapeHTML(item)}</span>`).join("")}</div>` : ""}
            </div>
            <dl class="job-card-facts">
              <div class="job-card-salary"><dt class="sr-only">${escapeHTML(i18n.t("ui.grossSalary"))}</dt><dd>${escapeHTML(salary(job))}</dd></div>
              <div class="job-card-location"><dt class="sr-only">${escapeHTML(i18n.t("ui.countryLocation"))}</dt><dd>${escapeHTML(view.location)}</dd></div>
            </dl>
            <span class="primary-button">
              ${escapeHTML(cardAction)}<span aria-hidden="true">→</span>
            </span>
          </div>
        </a>
      </article>
    `;
  }

  function openJobCount() {
    return jobs.filter(canApply).length;
  }

  function catalogDate() {
    const value = String(content.site?.lastUpdated || "");
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return value;
    return new Intl.DateTimeFormat(i18n.localeTag(), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(new Date(year, month - 1, day));
  }

  function resetFilters() {
    state.query = "";
    state.country = "";
    state.feature = "";
    $("job-search").value = "";
    renderCountryFilter();
    renderFeatureFilter();
    renderJobs();
    $("job-search").focus({ preventScroll: true });
  }

  function visibleJobs() {
    const query = state.query.trim().toLocaleLowerCase(i18n.localeTag());
    const statusPriority = { open: 0, verify: 1, paused: 2, closed: 3 };
    const originalOrder = new Map(jobs.map((job, index) => [job.id, index]));
    return jobs.filter((job) => {
      if (state.country && countryCode(job) !== state.country) return false;
      if (state.feature && !jobBenefitFlags(job).includes(state.feature)) return false;
      if (!query) return true;
      const view = localized(job);
      return [
        view.title,
        view.subtitle,
        view.company,
        view.category,
        view.level,
        view.format,
        view.location,
        view.summary
      ].join(" ").toLocaleLowerCase(i18n.localeTag()).includes(query);
    }).sort((first, second) => (
      (statusPriority[effectiveStatus(first)] ?? 1) - (statusPriority[effectiveStatus(second)] ?? 1)
      || originalOrder.get(first.id) - originalOrder.get(second.id)
    ));
  }

  function renderCountryFilter() {
    const container = $("country-filter");
    const codes = [...new Set(jobs.map(countryCode))];
    container.innerHTML = [
      { value: "", label: i18n.t("ui.allCountries") },
      ...codes.map((code) => ({ value: code, label: i18n.countryName(code) }))
    ].map((item) => `
      <button
        type="button"
        data-country-filter="${escapeHTML(item.value)}"
        aria-pressed="${String(state.country === item.value)}"
        class="${state.country === item.value ? "is-active" : ""}"
      >${escapeHTML(item.label)}</button>
    `).join("");
    container.setAttribute("aria-label", i18n.t("ui.allCountries"));
  }

  function renderFeatureFilter() {
    const container = $("feature-filter");
    if (!container) return;
    const options = ["", "housing", "noExperience", "pairs", "official"];
    container.innerHTML = options.map((value) => `
      <button
        type="button"
        data-feature-filter="${escapeHTML(value)}"
        aria-pressed="${String(state.feature === value)}"
        class="${state.feature === value ? "is-active" : ""}"
      >${escapeHTML(value ? catalogCopy(value) : catalogCopy("allConditions"))}</button>
    `).join("");
    container.setAttribute("aria-label", i18n.t("ui.conditions"));
  }

  function renderJobs() {
    const result = visibleJobs();
    const available = result.filter(canApply);
    const other = result.filter((job) => !canApply(job));
    const otherJobs = $("other-jobs");
    $("job-grid").innerHTML = available.map(card).join("");
    $("job-grid").setAttribute("aria-busy", "false");
    $("other-job-grid").innerHTML = other.map(card).join("");
    $("other-job-count").textContent = String(other.length);
    otherJobs.hidden = other.length === 0;
    if (other.length && !available.length && (state.query || state.country || state.feature)) otherJobs.open = true;
    $("result-count").textContent = `${i18n.t("ui.found")}: ${available.length}`;
    $("empty-state").hidden = result.length > 0;
    $("job-total").textContent = String(openJobCount());
  }

  function list(items) {
    return `<ul>${(items || []).map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`;
  }

  function housingGallery(job) {
    const entries = housingEntries(job);
    if (!entries.length) return "";
    return `
      <section class="vacancy-section housing-section">
        <div class="section-title">
          <p>${escapeHTML(i18n.t("ui.conditions"))}</p>
          <h3>${escapeHTML(i18n.t("ui.housingPhotos"))}</h3>
        </div>
        <div class="housing-list">
          ${entries.map(([key, location], index) => `
            <details class="housing-location"${index === 0 ? " open" : ""}>
              <summary><strong>${escapeHTML(location.name)}</strong><span>${location.photoCount} ${escapeHTML(i18n.t("ui.photos"))}</span></summary>
              <div class="housing-grid">
                ${Array.from({ length: location.photoCount }, (_, photoIndex) => `
                  <a href="${escapeHTML(photoUrl(key, photoIndex))}" target="_blank" rel="noopener noreferrer">
                    <img src="${escapeHTML(photoThumbnailUrl(key, photoIndex))}" alt="${escapeHTML(`${location.name} · ${photoIndex + 1}`)}" width="480" height="320" loading="lazy" decoding="async">
                  </a>
                `).join("")}
              </div>
            </details>
          `).join("")}
        </div>
      </section>
    `;
  }

  function detail(job, options = {}) {
    const view = localized(job);
    const headingId = options.page ? "job-page-title" : "job-dialog-title";
    const applyUrl = applicationUrl(job);
    const applicationOpen = canApply(job);
    return `
      <article class="vacancy-detail" data-status="${escapeHTML(effectiveStatus(job))}">
        <header class="vacancy-hero">
          <div class="vacancy-hero-copy">
            <div class="job-tags">
              <span>${escapeHTML(view.format)}</span>
              <span>${escapeHTML(view.category)}</span>
              <span class="job-status">${escapeHTML(statusLabel(job))}</span>
            </div>
            <h2 id="${headingId}">${escapeHTML(view.title)}</h2>
            <p>${escapeHTML(job.company)} · ${escapeHTML(view.subtitle || "")}</p>
          </div>
        </header>

        <div class="vacancy-layout">
          <div class="vacancy-main">
            <section class="vacancy-section vacancy-summary">
              <p>${escapeHTML(view.summary)}</p>
              <div class="skill-list">${(view.skills || []).map((skill) => `<span>${escapeHTML(skill)}</span>`).join("")}</div>
            </section>

            ${(view.benefits || []).length ? `
              <section class="vacancy-section">
                <div class="section-title"><p>${escapeHTML(i18n.t("ui.details"))}</p><h3>${escapeHTML(i18n.t("ui.conditions"))}</h3></div>
                <div class="condition-grid">${view.benefits.map((item) => `<p>${escapeHTML(item)}</p>`).join("")}</div>
              </section>
            ` : ""}

            <section class="vacancy-section vacancy-columns">
              <div><h3>${escapeHTML(i18n.t("ui.responsibilities"))}</h3>${list(view.responsibilities)}</div>
              <div><h3>${escapeHTML(i18n.t("ui.required"))}</h3>${list(view.required)}</div>
            </section>

            ${housingGallery(job)}
          </div>

          <aside class="vacancy-sidebar">
            <div class="vacancy-apply-bar">
              ${applicationOpen
                ? `<a class="primary-button" href="${escapeHTML(applyUrl)}" data-apply-job="${escapeHTML(job.id)}">${escapeHTML(i18n.t("ui.takeSurvey"))}</a>`
                : `<strong class="vacancy-application-unavailable">${escapeHTML(statusLabel(job))}</strong>`}
            </div>
            <dl class="vacancy-facts">
              <div><dt>${escapeHTML(i18n.t("ui.grossSalary"))}</dt><dd>${escapeHTML(salary(job))}</dd><small>${escapeHTML(view.salary?.note || "")}</small>${salaryExample(job) ? `<small class="vacancy-salary-example">${escapeHTML(salaryExample(job))}</small>` : ""}</div>
              <div><dt>${escapeHTML(i18n.t("ui.countryLocation"))}</dt><dd>${escapeHTML(view.format)} · ${escapeHTML(view.location)}</dd></div>
              <div><dt>${escapeHTML(i18n.t("ui.contract"))}</dt><dd>${escapeHTML(view.contract)}</dd></div>
              <div><dt>${escapeHTML(i18n.t("ui.suitableFor"))}</dt><dd>${escapeHTML((view.candidates || []).join(" · "))}</dd></div>
            </dl>
            <p class="vacancy-status-note">${escapeHTML(view.statusNote || "")}</p>
          </aside>
        </div>
      </article>
    `;
  }

  function openJob(jobId) {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;
    state.openJobId = job.id;
    $("job-dialog-content").innerHTML = detail(job);
    const dialog = $("job-dialog");
    if (!dialog.open) dialog.showModal();
    dialog.querySelector(".dialog-panel")?.scrollTo({ top: 0 });
  }

  function renderDirectVacancy() {
    const section = $("direct-vacancy");
    const container = $("direct-vacancy-content");
    const job = jobs.find((item) => item.id === directJobId);
    const isDirectPage = Boolean(directJobId && job);
    document.body.classList.toggle("direct-vacancy-page", isDirectPage);
    section.hidden = !isDirectPage;
    if (!isDirectPage) {
      container.innerHTML = "";
      return;
    }
    const view = localized(job);
    document.title = `${view.title} · ${job.company} · Kiris Jobs`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", view.summary || view.subtitle || view.title);
    const socialTitle = document.querySelector('meta[property="og:title"]');
    if (socialTitle) socialTitle.setAttribute("content", document.title);
    const socialDescription = document.querySelector('meta[property="og:description"]');
    if (socialDescription) socialDescription.setAttribute("content", view.summary || view.subtitle || view.title);
    state.openJobId = job.id;
    $("direct-vacancy-back").href = catalogUrl();
    $("application-page-back").href = publicJobUrl(job);
    container.innerHTML = detail(job, { page: true });
  }

  function closeDialog(dialog) {
    if (dialog?.open) dialog.close();
  }

  function ensureHousingLightbox() {
    if ($("housing-lightbox")) return $("housing-lightbox");
    const dialog = document.createElement("dialog");
    dialog.id = "housing-lightbox";
    dialog.className = "housing-lightbox";
    dialog.innerHTML = `
      <div class="housing-lightbox-shell">
        <header class="housing-lightbox-header">
          <strong data-housing-lightbox-title></strong>
          <button type="button" data-housing-lightbox-close aria-label="">×</button>
        </header>
        <div class="housing-lightbox-stage">
          <button type="button" class="housing-lightbox-nav is-previous" data-housing-lightbox-previous aria-label="">←</button>
          <img data-housing-lightbox-image src="" alt="" draggable="false">
          <button type="button" class="housing-lightbox-nav is-next" data-housing-lightbox-next aria-label="">→</button>
        </div>
        <footer class="housing-lightbox-footer">
          <span data-housing-lightbox-counter></span>
        </footer>
      </div>
    `;
    document.body.append(dialog);

    dialog.querySelector("[data-housing-lightbox-close]")?.addEventListener("click", () => closeDialog(dialog));
    dialog.querySelector("[data-housing-lightbox-previous]")?.addEventListener("click", () => moveHousingPhoto(-1));
    dialog.querySelector("[data-housing-lightbox-next]")?.addEventListener("click", () => moveHousingPhoto(1));
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveHousingPhoto(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveHousingPhoto(1);
      } else if (event.key === "Home") {
        event.preventDefault();
        lightboxState.index = 0;
        renderHousingLightbox();
      } else if (event.key === "End") {
        event.preventDefault();
        lightboxState.index = Math.max(0, lightboxState.items.length - 1);
        renderHousingLightbox();
      }
    });
    dialog.addEventListener("close", () => {
      if (lightboxState.trigger?.isConnected) lightboxState.trigger.focus({ preventScroll: true });
    });

    const stage = dialog.querySelector(".housing-lightbox-stage");
    stage?.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") lightboxState.pointerStartX = event.clientX;
    });
    stage?.addEventListener("pointerup", (event) => {
      if (event.pointerType !== "touch" || lightboxState.pointerStartX == null) return;
      const distance = event.clientX - lightboxState.pointerStartX;
      lightboxState.pointerStartX = null;
      if (Math.abs(distance) >= 42) moveHousingPhoto(distance > 0 ? -1 : 1);
    });
    stage?.addEventListener("pointercancel", () => {
      lightboxState.pointerStartX = null;
    });
    return dialog;
  }

  function renderHousingLightbox() {
    const dialog = ensureHousingLightbox();
    const item = lightboxState.items[lightboxState.index];
    if (!item) return;
    const total = lightboxState.items.length;
    dialog.setAttribute("aria-label", i18n.t("ui.housingPhotos"));
    const image = dialog.querySelector("[data-housing-lightbox-image]");
    image.src = item.href;
    image.alt = item.alt;
    dialog.querySelector("[data-housing-lightbox-title]").textContent = item.location;
    dialog.querySelector("[data-housing-lightbox-counter]").textContent = i18n.t("ui.photoCounter", {
      current: lightboxState.index + 1,
      total
    });
    const closeButton = dialog.querySelector("[data-housing-lightbox-close]");
    const previousButton = dialog.querySelector("[data-housing-lightbox-previous]");
    const nextButton = dialog.querySelector("[data-housing-lightbox-next]");
    closeButton.setAttribute("aria-label", i18n.t("ui.close"));
    previousButton.setAttribute("aria-label", i18n.t("ui.previousPhoto"));
    nextButton.setAttribute("aria-label", i18n.t("ui.nextPhoto"));
    previousButton.hidden = total < 2;
    nextButton.hidden = total < 2;
  }

  function moveHousingPhoto(delta) {
    const total = lightboxState.items.length;
    if (total < 2) return;
    lightboxState.index = (lightboxState.index + delta + total) % total;
    renderHousingLightbox();
  }

  function openHousingLightbox(trigger) {
    const gallery = trigger.closest(".housing-grid");
    if (!gallery) return;
    const location = trigger.closest(".housing-location")?.querySelector("summary strong")?.textContent || "";
    const links = [...gallery.querySelectorAll("a")];
    lightboxState.items = links.map((link) => ({
      href: link.href,
      alt: link.querySelector("img")?.alt || location,
      location
    }));
    lightboxState.index = Math.max(0, links.indexOf(trigger));
    lightboxState.trigger = trigger;
    const dialog = ensureHousingLightbox();
    renderHousingLightbox();
    if (!dialog.open) dialog.showModal();
    dialog.querySelector("[data-housing-lightbox-close]")?.focus({ preventScroll: true });
  }

  function renderStatic() {
    document.documentElement.lang = i18n.locale;
    $("profile-name").textContent = profile.name;
    $("profile-hours").textContent = profile.workHours;
    $("recruiter-name").textContent = profile.name;
    $("recruiter-hours").textContent = profile.workHours;
    $("whatsapp-link").href = profile.whatsapp;
    $("footer-whatsapp").href = profile.whatsapp;
    $("safety-whatsapp").href = profile.whatsapp;
    $("empty-whatsapp").href = profile.whatsapp;
    $("jobs-link").href = catalogUrl();
    $("brand-home").href = catalogUrl();
    $("catalog-date").dateTime = content.site?.lastUpdated || "";
    $("catalog-date").textContent = catalogDate();
    if (directJobId) {
      $("job-total").textContent = String(openJobCount());
      renderDirectVacancy();
    } else {
      renderCountryFilter();
      renderFeatureFilter();
      renderJobs();
    }
    if (state.openJobId && $("job-dialog").open) openJob(state.openJobId);
    if ($("housing-lightbox")?.open) renderHousingLightbox();
  }

  function bind() {
    document.querySelector(".catalog-filters")?.addEventListener("submit", (event) => {
      event.preventDefault();
    });
    $("job-search").addEventListener("input", (event) => {
      state.query = event.target.value;
      renderJobs();
    });
    $("reset-filters").addEventListener("click", resetFilters);
    document.addEventListener("click", (event) => {
      const housingPhoto = event.target.closest(".housing-grid a");
      const countryButton = event.target.closest("[data-country-filter]");
      const featureButton = event.target.closest("[data-feature-filter]");
      const openButton = event.target.closest("[data-open-job]");
      const applyButton = event.target.closest("[data-apply-job]");
      const closeButton = event.target.closest("[data-close-dialog]");
      if (countryButton) {
        state.country = countryButton.dataset.countryFilter || "";
        renderCountryFilter();
        renderJobs();
        return;
      }
      if (featureButton) {
        state.feature = featureButton.dataset.featureFilter || "";
        renderFeatureFilter();
        renderJobs();
        return;
      }
      if (housingPhoto) {
        event.preventDefault();
        openHousingLightbox(housingPhoto);
        return;
      }
      if (openButton && directJobId) event.preventDefault();
      if (applyButton) {
        const job = jobs.find((item) => item.id === applyButton.dataset.applyJob);
        if (!canApply(job)) {
          event.preventDefault();
          return;
        }
        if (directJobId) return;
        event.preventDefault();
        closeDialog($("job-dialog"));
        window.PortalApplication?.open(applyButton.dataset.applyJob);
      }
      if (closeButton) closeDialog(closeButton.closest("dialog"));
    });
    document.querySelectorAll("dialog").forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog(dialog);
      });
    });
    window.addEventListener("portal:toast", (event) => {
      const toast = $("toast");
      toast.textContent = event.detail?.message || "";
      toast.hidden = false;
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => { toast.hidden = true; }, 2600);
    });
    window.addEventListener("portal:funnel", (event) => {
      const name = event.detail?.event;
      if (["application_start", "application_complete"].includes(name)) {
        trackFunnel(name, event.detail?.jobId || "");
      }
    });
    i18n.subscribe(renderStatic);
  }

  function openDeepLink() {
    if (directJobId) {
      if (new URL(location.href).searchParams.get("apply") === "1") {
        const job = jobs.find((item) => item.id === directJobId);
        if (!canApply(job)) return;
        document.body.classList.add("standalone-application-page");
        $("application-page-back").hidden = false;
        window.PortalApplication?.open(directJobId, { standalone: true });
      }
      return;
    }
    const hashMatch = location.hash.match(/^#job=(.+)$/);
    const id = hashMatch?.[1];
    if (id) openJob(decodeURIComponent(id));
  }

  function ensureAppStyles() {
    document.querySelectorAll('link[rel="stylesheet"][data-app-style]').forEach((link) => {
      if (link.sheet || link.dataset.styleRetry === "1") return;
      link.dataset.styleRetry = "1";
      const retryUrl = new URL(link.href, window.location.href);
      retryUrl.searchParams.set("retry", Date.now().toString());
      link.href = retryUrl.toString();
    });
  }

  function registerCandidateServiceWorker() {
    if (!("serviceWorker" in navigator)
      || (location.protocol !== "https:"
        && location.hostname !== "localhost"
        && location.hostname !== "127.0.0.1")) return;

    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController || refreshing) return;
      if (document.body.classList.contains("standalone-application-page")
        || document.querySelector(".application-modal[open]")) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" })
      .then((registration) => {
        registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        registration.update().catch(() => {});
      })
      .catch(() => {});
  }

  function init() {
    i18n.init();
    ensureHousingLightbox();
    bind();
    renderStatic();
    trackFunnel("catalog_view", directJobId);
    openDeepLink();
    ensureAppStyles();
    registerCandidateServiceWorker();
  }

  init();
})();
