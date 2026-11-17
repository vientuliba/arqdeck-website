import { t } from './i18n.js';

function announce(status, key) {
  status.dataset.i18n = key;
  status.textContent = '';
  setTimeout(() => { status.textContent = t(key); });
}

/** Replace only this handler when a purchasing system is ready. No ordering state is stored. */
export function purchasePlaceholder(button) {
  const status = document.getElementById(button.getAttribute('aria-describedby'));
  announce(status, 'purchase.upcoming');
}
document.querySelectorAll('[data-purchase]').forEach(button => button.addEventListener('click', () => purchasePlaceholder(button)));

/** Public download configuration. Set url to a real file in /downloads/ when released.
 * Metadata is optional and must describe the actual published file. No purchase/account dependencies.
 */
export const softwareRelease = { url: null, filename: null, information: null };
const download = document.getElementById('software-download');
const upcoming = document.getElementById('software-upcoming');
if (softwareRelease.url) {
  download.href = softwareRelease.url;
  download.download = softwareRelease.filename || '';
  download.hidden = false;
  upcoming.hidden = true;
  const state = document.getElementById('software-state');
  if (softwareRelease.information) {
    state.removeAttribute('data-i18n');
    state.textContent = softwareRelease.information;
  } else {
    state.dataset.i18n = 'software.available';
    state.textContent = t('software.available');
  }
} else {
  upcoming.addEventListener('click', () => {
    const status = document.getElementById('software-status');
    announce(status, 'software.upcoming');
  });
}
// Keep the accessible menu name in the selected language and reflect its open state.
const toggle = document.querySelector('.nav__toggle');
function updateMenuLabel() {
  const label = t(toggle.getAttribute('aria-expanded') === 'true' ? 'menu.close' : 'menu.open');
  if (toggle.getAttribute('aria-label') !== label) toggle.setAttribute('aria-label', label);
}
new MutationObserver(updateMenuLabel).observe(toggle, { attributes: true, attributeFilter: ['aria-expanded', 'aria-label'] });
document.addEventListener('arqdeck:languagechange', updateMenuLabel);
// Keep keyboard and assistive-technology navigation inside the open mobile sheet.
new MutationObserver(() => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  document.querySelector('main').inert = open;
  document.querySelector('footer').inert = open;
  if (open) document.querySelector('.nav__links a')?.focus({ preventScroll: true });
}).observe(toggle, { attributes: true, attributeFilter: ['aria-expanded'] });

// Local file pages cannot load ES modules. Keep their essential navigation native;
// the HTTP preview and deployed site load the original visual/motion modules.
if (window.location.protocol === 'file:') {
  const navigation = document.querySelector('header.nav');
  const setMenuOpen = open => {
    navigation.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-locked', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('path')?.setAttribute('d', open ? 'M4 4l14 14M18 4L4 18' : 'M2 7h18M2 15h18');
    updateMenuLabel();
  };
  toggle.addEventListener('click', () => setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      toggle.focus();
    }
  });
} else {
  for (const source of ['assets/taste/system.js', 'assets/taste/layout/layout.js', 'assets/taste/motion/motion.js']) {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = new URL(source, document.baseURI).href;
    document.body.append(script);
  }
}
