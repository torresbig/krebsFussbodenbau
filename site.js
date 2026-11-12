const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  navigation.classList.toggle('open', open);
});
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Menü öffnen');
    navigation.classList.remove('open');
  }
});

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const heroImage = document.querySelector('.hero-image');
const processSection = document.getElementById('ablauf');
const stageFrames = [...document.querySelectorAll('.stage-frame')];
const processSteps = [...document.querySelectorAll('.process-step')];
const smoothstep = (edge0, edge1, value) => {
  const x = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
};
let scrollFrame = null;
function updateStage() {
  const bounds = processSection.getBoundingClientRect();
  const travel = bounds.height - window.innerHeight;
  const progress = travel > 0 ? Math.min(1, Math.max(0, -bounds.top / travel)) : 0;
  const position = progress * (stageFrames.length - 1);
  stageFrames.forEach((frame, index) => {
    const opacity = index === 0 ? 1 : smoothstep(index - 0.62, index - 0.38, position);
    frame.style.opacity = String(opacity);
    frame.style.setProperty('--zoom', (1.07 - 0.07 * smoothstep(index - 0.5, index + 0.5, position)).toFixed(4));
  });
  const active = Math.round(position);
  processSteps.forEach((step, index) => step.classList.toggle('is-active', index === active));
  processSection.style.setProperty('--stage-progress', progress.toFixed(4));
}
function updateScrollMotion() {
  scrollFrame = null;
  const shift = window.innerWidth > 1000 ? Math.min(window.scrollY * 0.035, 25) : 0;
  heroImage.style.setProperty('--hero-shift', `${shift}px`);
  updateStage();
}
function scheduleScrollMotion() {
  if (!motionPreference.matches && scrollFrame === null) {
    scrollFrame = requestAnimationFrame(updateScrollMotion);
  }
}
function syncMotionPreference() {
  document.documentElement.classList.toggle('motion', !motionPreference.matches);
  if (motionPreference.matches) {
    if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
    scrollFrame = null;
    heroImage.style.removeProperty('--hero-shift');
    stageFrames.forEach((frame) => {
      frame.style.removeProperty('opacity');
      frame.style.removeProperty('--zoom');
    });
    processSteps.forEach((step) => step.classList.add('is-active'));
  } else {
    scheduleScrollMotion();
  }
}
window.addEventListener('scroll', scheduleScrollMotion, { passive: true });
window.addEventListener('resize', scheduleScrollMotion);
motionPreference.addEventListener('change', syncMotionPreference);
syncMotionPreference();

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

const lightbox = document.querySelector('.lightbox');
const lightboxImage = lightbox.querySelector('img');
const gallery = document.querySelector('.gallery');
const morePhotos = [
  'IMG_2401', 'IMG_2408', 'IMG_2660', 'IMG_2977', 'IMG_2979', 'IMG_3130',
  'IMG_4136', 'IMG_4365', 'IMG_5009', 'IMG_5457', 'IMG_5462', 'IMG_5877',
  'IMG_6158', 'IMG_6205', 'IMG_6616', 'IMG_7200', 'IMG_7882', 'IMG_8869',
  'IMG_8999', 'IMG_9128', 'IMG_9354', 'IMG_9362', 'IMG_9458', 'IMG_9463',
  'IMG_9635', 'IMG_9682', 'IMG_9860', 'IMG_9916'
];
const moreButton = document.getElementById('gallery-more');
moreButton.hidden = false;
moreButton.addEventListener('click', () => {
  morePhotos.forEach((photo, index) => {
    const button = document.createElement('button');
    const image = document.createElement('img');
    const label = document.createElement('span');
    button.type = 'button';
    button.className = 'gallery-item gallery-new';
    button.style.setProperty('--i', index);
    button.dataset.image = `img/new/optimized/${photo}.jpg`;
    button.dataset.alt = `Einblick in ein Bodenprojekt, Foto ${index + 5}`;
    image.src = button.dataset.image;
    image.alt = button.dataset.alt;
    image.loading = 'lazy';
    label.textContent = `PROJEKTAUFNAHME ${String(index + 5).padStart(2, '0')} ↗`;
    button.append(image, label);
    gallery.append(button);
  });
  moreButton.hidden = true;
  gallery.querySelectorAll('.gallery-item')[4].focus();
});
gallery.addEventListener('click', (event) => {
  const button = event.target.closest('.gallery-item');
  if (!button) return;
  lightboxImage.src = button.dataset.image;
  lightboxImage.alt = button.dataset.alt;
  lightbox.querySelector('p').textContent = button.dataset.alt;
  lightbox.showModal();
});
lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});
lightbox.addEventListener('close', () => lightboxImage.removeAttribute('src'));

const form = document.getElementById('request-form');
const formSteps = [...form.querySelectorAll('.form-step')];
const backButton = document.getElementById('form-back');
const nextButton = document.getElementById('form-next');
const emailButton = document.getElementById('form-email');
const summary = document.getElementById('summary');
let currentStep = 0;

const fields = [
  ['bedarf', 'Vorhaben'], ['objekt', 'Objekt'], ['leistung', 'Gewünschte Leistung'],
  ['flaeche', 'Fläche in m²'], ['zeitraum', 'Zeitraum'], ['details', 'Weitere Informationen'],
  ['name', 'Name'], ['telefon', 'Telefon'], ['email', 'E-Mail'], ['nachricht', 'Nachricht']
];

function updateSummary() {
  const data = new FormData(form);
  summary.replaceChildren();
  fields.forEach(([name, label]) => {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const value = document.createElement('dd');
    term.textContent = label;
    value.textContent = data.get(name) || '–';
    row.append(term, value);
    summary.append(row);
  });
}

function showStep(index) {
  currentStep = index;
  formSteps.forEach((step, stepIndex) => { step.hidden = stepIndex !== index; });
  backButton.hidden = index === 0;
  nextButton.hidden = index === formSteps.length - 1;
  emailButton.hidden = index !== formSteps.length - 1;
  document.getElementById('step-counter').textContent = `SCHRITT ${index + 1} / ${formSteps.length}`;
  document.getElementById('progress-bar').style.width = `${(index + 1) / formSteps.length * 100}%`;
  if (index === formSteps.length - 1) updateSummary();
}

function nextStep() {
  const invalid = [...formSteps[currentStep].querySelectorAll('input, textarea')].find((field) => !field.checkValidity());
  if (invalid) {
    invalid.reportValidity();
    return;
  }
  showStep(currentStep + 1);
}

backButton.addEventListener('click', () => showStep(currentStep - 1));
nextButton.addEventListener('click', nextStep);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (currentStep !== formSteps.length - 1) {
    nextStep();
    return;
  }
  const data = new FormData(form);
  const body = fields.map(([name, label]) => `${label}: ${data.get(name) || '–'}`).join('\r\n');
  window.location.href = `mailto:info@krebs-fussbodenbau.de?subject=${encodeURIComponent('Projektanfrage über die Webseite')}&body=${encodeURIComponent(body)}`;
});
