(() => {
  'use strict';

  const app = document.getElementById('app');
  const CFG = window.RECRUITMENT_CONFIG;
  if (!app || !CFG) return;

  document.documentElement.classList.add('ui-v11');

  const PRIORITY_LANGUAGES = new Set(['pl', 'uk', 'ru', 'en', 'ka', 'az', 'tr', 'uz']);
  const STEP_ICONS = ['☎', '◎', '▣', '↗'];
  let scheduled = false;

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhance();
    });
  }

  function decorateLanguages() {
    app.querySelectorAll('.language-card[data-language]').forEach((card) => {
      const code = String(card.dataset.language || '').toLowerCase();
      if (PRIORITY_LANGUAGES.has(code)) card.classList.add('ui-priority-language');
      if (!card.querySelector('.ui-language-code')) {
        const badge = document.createElement('span');
        badge.className = 'ui-language-code';
        badge.textContent = code.toUpperCase();
        badge.setAttribute('aria-hidden', 'true');
        card.appendChild(badge);
      }
    });
  }

  function contactMarkup(person) {
    return `
      <span class="ui-contact-stack">
        <span class="ui-contact-email">${person.email}</span>
        <span class="ui-contact-phone">${person.phone || ''}</span>
        <span class="ui-channel-dots" aria-hidden="true">
          <span class="ui-channel-dot">E</span><span class="ui-channel-dot">WA</span>
          <span class="ui-channel-dot">TG</span><span class="ui-channel-dot">VI</span>
        </span>
      </span>`;
  }

  function decorateRecruiters() {
    app.querySelectorAll('.recruiter-card[data-recruiter]').forEach((card) => {
      const person = CFG.recruiters.find((item) => item.id === card.dataset.recruiter);
      const small = card.querySelector('small');
      if (!person || !small || small.dataset.uiV11 === 'true') return;
      small.dataset.uiV11 = 'true';
      small.innerHTML = contactMarkup(person);
    });

    const selectedId = app.querySelector('.recruiter-card[data-recruiter]')?.dataset.recruiter;
    const state = (() => {
      try { return JSON.parse(localStorage.getItem(CFG.storageKey)); } catch { return null; }
    })();
    const person = CFG.recruiters.find((item) => item.id === state?.recruiterId)
      || CFG.recruiters.find((item) => item.id === selectedId);
    if (!person) return;

    app.querySelectorAll('.selected-recruiter small, .recipient small, .delivery-recipient-card em').forEach((element) => {
      if (element.dataset.uiV11 === 'true') return;
      element.dataset.uiV11 = 'true';
      element.innerHTML = `<span class="ui-contact-email">${person.email}</span><span class="ui-contact-phone">${person.phone || ''}</span>`;
    });
  }

  function decorateStepper() {
    const stepper = app.querySelector('.stepper');
    const strong = stepper?.querySelector('.stepper-meta strong');
    if (!strong || strong.dataset.uiV11 === 'true') return;
    strong.dataset.uiV11 = 'true';
    const match = strong.textContent.match(/\d+/);
    const step = Math.max(1, Math.min(4, Number(match?.[0]) || 1));
    const icon = document.createElement('span');
    icon.className = 'ui-current-step-icon';
    icon.textContent = STEP_ICONS[step - 1];
    icon.setAttribute('aria-hidden', 'true');
    strong.prepend(icon);
  }

  function makeReviewAccordions() {
    app.querySelectorAll('.review-section').forEach((section, index) => {
      const heading = section.querySelector(':scope > h2');
      if (!heading || heading.dataset.uiV11 === 'true') return;
      heading.dataset.uiV11 = 'true';
      heading.setAttribute('role', 'button');
      heading.setAttribute('tabindex', '0');
      const collapsed = index > 0;
      section.classList.toggle('ui-collapsed', collapsed);
      heading.setAttribute('aria-expanded', String(!collapsed));
      const toggle = () => {
        const next = !section.classList.contains('ui-collapsed');
        section.classList.toggle('ui-collapsed', next);
        heading.setAttribute('aria-expanded', String(!next));
      };
      heading.addEventListener('click', toggle);
      heading.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggle();
      });
    });
  }

  function decorateDelivery() {
    const primary = app.querySelector('.delivery-share-primary');
    if (!primary) return;
    const textColumn = primary.querySelector('span:nth-child(2)');
    if (!textColumn) return;
    let badge = textColumn.querySelector('.ui-file-count-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'ui-file-count-badge';
      textColumn.appendChild(badge);
    }
    const countText = app.querySelector('[data-delivery-file-count]')?.textContent?.trim();
    badge.textContent = countText || '0';
  }

  function enhance() {
    decorateLanguages();
    decorateRecruiters();
    decorateStepper();
    makeReviewAccordions();
    decorateDelivery();
  }

  const observer = new MutationObserver(schedule);
  observer.observe(app, { childList: true, subtree: true, characterData: true });
  schedule();
})();
