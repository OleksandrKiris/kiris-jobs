(function () {
  "use strict";

  const i18n = window.PortalI18n;
  const dialog = document.getElementById("application-dialog");
  const container = document.getElementById("application-dialog-content");
  const copy = {
    ru: ["Загрузка анкеты…", "Не удалось загрузить анкету. Проверьте подключение и повторите попытку.", "Повторить"],
    uk: ["Завантаження анкети…", "Не вдалося завантажити анкету. Перевірте з’єднання та спробуйте ще раз.", "Спробувати ще раз"],
    pl: ["Ładowanie formularza…", "Nie udało się wczytać formularza. Sprawdź połączenie i spróbuj ponownie.", "Spróbuj ponownie"],
    en: ["Loading questionnaire…", "Could not load the questionnaire. Check your connection and try again.", "Try again"],
    az: ["Anket yüklənir…", "Anketi yükləmək mümkün olmadı. İnternet bağlantısını yoxlayın və yenidən cəhd edin.", "Yenidən cəhd edin"],
    ka: ["ანკეტა იტვირთება…", "ანკეტის ჩატვირთვა ვერ მოხერხდა. შეამოწმეთ ინტერნეტკავშირი და სცადეთ ხელახლა.", "ხელახლა ცდა"],
    id: ["Memuat formulir…", "Formulir tidak dapat dimuat. Periksa koneksi internet dan coba lagi.", "Coba lagi"],
    es: ["Cargando el formulario…", "No se pudo cargar el formulario. Comprueba la conexión e inténtalo de nuevo.", "Volver a intentar"],
    fil: ["Nilo-load ang talatanungan…", "Hindi ma-load ang talatanungan. Suriin ang koneksyon at subukang muli.", "Subukang muli"],
    ne: ["फारम लोड हुँदै छ…", "फारम लोड हुन सकेन। इन्टरनेट जडान जाँचेर फेरि प्रयास गर्नुहोस्।", "फेरि प्रयास गर्नुहोस्"],
    hy: ["Հարցաթերթիկը բեռնվում է…", "Չհաջողվեց բեռնել հարցաթերթիկը։ Ստուգեք ինտերնետ կապը և նորից փորձեք։", "Փորձել նորից"]
  };
  let modulePromise = null;
  let attempt = 0;
  let pending = null;
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  function renderStatus() {
    if (!pending) return;
    const [loading, failed, retry] = copy[i18n.locale] || copy.en;
    container.innerHTML = `
      <section class="application-header application-load-status">
        <h2 id="application-step-title" tabindex="-1">${escapeHTML(i18n.t("form.title"))}</h2>
        <p role="${pending.failed ? "alert" : "status"}">${escapeHTML(pending.failed ? failed : loading)}</p>
        ${pending.failed ? `<button class="button button-primary" type="button" data-retry-application>${escapeHTML(retry)}</button>` : ""}
      </section>`;
    container.querySelector("[data-retry-application]")?.addEventListener("click", () => {
      if (pending) open(pending.jobId, pending.options);
    });
  }

  function loadApplication() {
    if (window.PortalApplication) return Promise.resolve(window.PortalApplication);
    if (!modulePromise) {
      const retry = attempt++;
      const suffix = retry ? `&retry=${retry}` : "";
      modulePromise = import(`./application-form.js?v=${window.PORTAL_ASSET_VERSION}${suffix}`)
        .then(() => {
          if (typeof window.PortalApplication?.open !== "function") throw new Error("Application module unavailable");
          return window.PortalApplication;
        }).catch((error) => {
          modulePromise = null;
          throw error;
        });
    }
    return modulePromise;
  }

  async function open(jobId = "", options = {}) {
    if (!dialog || !container) return;
    const request = { jobId, options, failed: false };
    pending = request;
    renderStatus();
    if (!dialog.open) {
      if (options.standalone) dialog.show();
      else dialog.showModal();
    }
    container.querySelector("h2")?.focus();
    try {
      const application = await loadApplication();
      // Closing the loading screen or choosing another vacancy cancels this opening.
      if (pending !== request || !dialog.open) return;
      application.open(jobId, options);
      pending = null;
    } catch {
      if (pending !== request || !dialog.open) return;
      request.failed = true;
      renderStatus();
      container.querySelector("[data-retry-application]")?.focus();
    }
  }

  dialog?.addEventListener("close", () => { pending = null; });
  i18n.subscribe(renderStatus);
  window.PortalApplicationLoader = { open };
})();
