(() => {
  'use strict';

  const app = document.getElementById('app');
  if (!app) return;

  document.documentElement.classList.add('ui-v9');

  const TAP_FIELDS = Object.freeze({
    messenger: {
      className: 'ui-options-messenger',
      icons: { whatsapp: 'WA', viber: 'VI', telegram: 'TG', phone: '☎', other: '＋' }
    },
    inPoland: {
      className: 'ui-options-binary',
      icons: { yes: '✓', no: '×' }
    },
    job: {
      className: 'ui-options-jobs',
      icons: {
        greenhouse: '🌿', packing: '📦', warehouse: '▦', production: '⚙',
        cleaning: '✦', driver: '🚚', technical: '🔧', other: '＋'
      }
    },
    start: {
      className: 'ui-options-timing',
      icons: { now: '⚡', d7: '7', d14: '14', d30: '30', later: '…' }
    },
    shift: {
      className: 'ui-options-compact',
      icons: { yes: '✓', no: '×', depends: '≈' }
    },
    housing: {
      className: 'ui-options-binary',
      icons: { yes: '⌂', no: '—' }
    }
  });

  const STEP_ICONS = Object.freeze(['☎', '◎', '▣', '↗']);
  let scheduled = false;

  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      enhance();
    });
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function enhanceTapSelect(select, settings) {
    if (!select || select.dataset.uiV9Enhanced === 'true') return;
    select.dataset.uiV9Enhanced = 'true';
    select.classList.add('ui-native-select');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    const field = select.closest('.field');
    if (field) field.classList.add('ui-tap-field');

    const group = createElement('div', `ui-tap-options ${settings.className || ''}`);
    group.setAttribute('role', 'group');
    const label = field?.querySelector('label, .fieldset-title')?.textContent?.trim();
    if (label) group.setAttribute('aria-label', label);

    const buttons = [];
    [...select.options].filter((option) => option.value).forEach((option) => {
      const button = createElement('button', 'ui-option-card');
      button.type = 'button';
      button.dataset.value = option.value;
      button.setAttribute('aria-pressed', 'false');

      const icon = createElement('span', 'ui-option-icon', settings.icons?.[option.value] || '•');
      icon.setAttribute('aria-hidden', 'true');
      const text = createElement('span', 'ui-option-text', option.textContent.trim());
      const check = createElement('span', 'ui-option-check', '✓');
      check.setAttribute('aria-hidden', 'true');
      button.append(icon, text, check);
      group.append(button);
      buttons.push(button);
    });

    const sync = () => {
      buttons.forEach((button) => {
        const active = button.dataset.value === select.value;
        button.classList.toggle('selected', active);
        button.setAttribute('aria-pressed', String(active));
      });
      field?.classList.toggle('is-complete', Boolean(select.value));
      group.classList.toggle('has-error', Boolean(field?.querySelector('.error:not(:empty)')));
    };

    group.addEventListener('click', (event) => {
      const button = event.target.closest('.ui-option-card');
      if (!button) return;
      select.value = button.dataset.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
    });
    select.addEventListener('change', sync);
    select.insertAdjacentElement('afterend', group);
    sync();
  }

  function enhanceTextField(control) {
    if (!control || control.dataset.uiV9Field === 'true') return;
    control.dataset.uiV9Field = 'true';
    const field = control.closest('.field');
    if (!field) return;

    const sync = () => {
      const value = control.type === 'checkbox' ? control.checked : String(control.value || '').trim();
      field.classList.toggle('is-complete', Boolean(value));
    };
    control.addEventListener('input', sync);
    control.addEventListener('change', sync);

    if (control.matches('input:not([type="checkbox"]):not([type="radio"])')) {
      control.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || event.isComposing) return;
        const focusable = [...app.querySelectorAll('input:not([type="hidden"]), textarea, select, button')]
          .filter((element) => !element.disabled && element.offsetParent !== null && !element.classList.contains('ui-native-select'));
        const index = focusable.indexOf(control);
        const next = focusable.slice(index + 1).find((element) => !element.matches('[data-action="back"], [data-action="language"], [data-action="recruiter"]'));
        if (next && !next.matches('textarea')) {
          event.preventDefault();
          next.focus({ preventScroll: true });
          next.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
    sync();
  }

  function enhanceStepHeader() {
    const title = app.querySelector('.screen-title');
    const stepText = app.querySelector('.stepper-meta strong')?.textContent?.trim();
    if (!title || !stepText || title.previousElementSibling?.classList.contains('ui-step-heading')) return;

    const step = Math.max(1, Math.min(4, Number.parseInt(stepText, 10) || 1));
    const heading = createElement('div', 'ui-step-heading');
    const icon = createElement('span', 'ui-step-icon', STEP_ICONS[step - 1]);
    icon.setAttribute('aria-hidden', 'true');
    const number = createElement('span', 'ui-step-number', stepText);
    heading.append(icon, number);
    title.insertAdjacentElement('beforebegin', heading);
  }

  function enhanceLanding() {
    const card = app.querySelector(':scope > .card');
    if (!card) return;
    card.classList.toggle('ui-language-screen', Boolean(card.querySelector('.fast-language-grid')));
    card.classList.toggle('ui-recruiter-screen', Boolean(card.querySelector('.recruiter-grid') && !card.querySelector('.stepper')));
    card.classList.toggle('ui-form-screen', Boolean(card.querySelector('.stepper')));
    card.classList.toggle('ui-review-screen', Boolean(card.querySelector('.review-sections')));
  }

  function enhanceButtons() {
    const sendButton = app.querySelector('.send-button');
    if (sendButton && !sendButton.querySelector('.ui-button-arrow')) {
      const arrow = createElement('span', 'ui-button-arrow', '→');
      arrow.setAttribute('aria-hidden', 'true');
      sendButton.append(arrow);
    }
  }

  function enhanceReviewSections() {
    app.querySelectorAll('.review-section').forEach((section, index) => {
      section.dataset.sectionIndex = String(index + 1);
    });
  }

  function enhance() {
    enhanceLanding();
    Object.entries(TAP_FIELDS).forEach(([id, settings]) => enhanceTapSelect(app.querySelector(`#${id}`), settings));
    app.querySelectorAll('.field input, .field textarea').forEach(enhanceTextField);
    enhanceStepHeader();
    enhanceButtons();
    enhanceReviewSections();
  }

  const observer = new MutationObserver(scheduleEnhance);
  observer.observe(app, { childList: true, subtree: true });
  enhance();
})();
