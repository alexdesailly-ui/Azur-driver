/* ===== Azur Driver — interactions ===== */

// === Configuration — à personnaliser ===
const CONFIG = {
  // Lien WhatsApp : peut être un code QR (wa.me/qr/XXXX) ou un numéro (33612345678)
  whatsappLink: 'https://wa.me/qr/L3OQ2PIJX6EIF1',
  // Numéro de téléphone affichable (laisser vide pour masquer le bouton appel)
  phoneNumber: '+33 6 99 18 22 70',
  // Délai minimum de réservation (en heures)
  minBookingHours: 24,
};

// === Utilitaires ===
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// === Année dynamique ===
$('#year').textContent = new Date().getFullYear();

// === Lien d'appel téléphonique ===
const phoneLink = $('#phoneLink');
if (phoneLink) {
  if (CONFIG.phoneNumber) {
    phoneLink.href = `tel:${CONFIG.phoneNumber.replace(/\s/g, '')}`;
    phoneLink.textContent = `Appeler ${CONFIG.phoneNumber}`;
  } else {
    phoneLink.style.display = 'none';
  }
}

// === Liens WhatsApp ===
function buildWhatsappUrl(message = '') {
  // Base : URL complète OU numéro brut (33612345678)
  const raw = CONFIG.whatsappLink || '';
  const base = raw.startsWith('http') ? raw : `https://wa.me/${raw}`;
  const defaultMsg = "Bonjour Azur Driver, j'aimerais des informations.";
  const text = encodeURIComponent(message || defaultMsg);
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}text=${text}`;
}
$$('[data-whatsapp]').forEach(link => {
  link.href = buildWhatsappUrl();
  link.target = '_blank';
  link.rel = 'noopener';
});

// === Nav scroll state + mobile toggle ===
const nav = $('#nav');
const navToggle = $('.nav-toggle');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

navToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});
$$('.nav-links a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  navToggle?.classList.remove('open');
}));

// === Effet curseur sur les cartes services ===
$$('.service-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// === Reveal au scroll ===
const revealEls = $$('.section-head, .service-card, .vehicle-text, .vehicle-visual, .booking-form, .contact-card');
revealEls.forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

// === Date input — bornes (minimum 24h à l'avance) ===
const dateInput = $('#date');
const timeInput = $('#time');
function setDateBounds() {
  const min = new Date(Date.now() + CONFIG.minBookingHours * 3600 * 1000);
  const yyyy = min.getFullYear();
  const mm = String(min.getMonth() + 1).padStart(2, '0');
  const dd = String(min.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;
}
setDateBounds();

// === Soumission du formulaire ===
const form = $('#bookingForm');
const note = $('#formNote');

form.addEventListener('submit', e => {
  e.preventDefault();
  note.classList.remove('error');
  note.textContent = '';

  // Validation native
  if (!form.checkValidity()) {
    note.classList.add('error');
    note.textContent = 'Merci de compléter tous les champs requis.';
    form.reportValidity();
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());

  // Validation 24h
  const pickupAt = new Date(`${data.date}T${data.time}`);
  const minTime = Date.now() + CONFIG.minBookingHours * 3600 * 1000;
  if (isNaN(pickupAt.getTime())) {
    note.classList.add('error');
    note.textContent = 'Date ou heure invalide.';
    return;
  }
  if (pickupAt.getTime() < minTime) {
    note.classList.add('error');
    note.textContent = `La réservation doit être effectuée au moins ${CONFIG.minBookingHours} heures à l'avance.`;
    return;
  }

  // Construction du message WhatsApp
  const dateFmt = pickupAt.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const timeFmt = pickupAt.toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit'
  });

  const lines = [
    'Bonjour Azur Driver,',
    "j'aimerais réserver une course :",
    '',
    `• Nom : ${data.name}`,
    `• Téléphone : ${data.phone}`,
    `• Prise en charge : ${data.pickup}`,
    `• Destination : ${data.dropoff}`,
    `• Date : ${dateFmt}`,
    `• Heure : ${timeFmt}`,
    `• Passagers : ${data.passengers}`,
    `• Bagages : ${data.luggage}`,
  ];
  if (data.notes && data.notes.trim()) {
    lines.push(`• Informations : ${data.notes.trim()}`);
  }
  lines.push('', 'Merci de me confirmer la disponibilité.');

  const url = buildWhatsappUrl(lines.join('\n'));

  note.textContent = 'Redirection vers WhatsApp…';
  window.open(url, '_blank', 'noopener');
});

// === Fallback images ===
// Si une photo distante ne charge pas, marque le conteneur pour afficher un
// dégradé de remplacement (CSS) — pas d'image cassée visible.
$$('.gallery-item img, .vehicle-photo').forEach(img => {
  img.addEventListener('error', () => {
    img.closest('.gallery-item, .vehicle-card')?.classList.add('img-fallback');
    img.remove();
  }, { once: true });
});

// === Consentement cookies ===
(() => {
  const STORAGE_KEY = 'azur_cookie_consent';
  const VERSION = '1';
  const banner = $('#cookieBanner');
  if (!banner) return;

  const acceptBtn = $('#cookieAccept');
  const refuseBtn = $('#cookieRefuse');
  const moreBtn = $('#cookieMore');
  const details = $('#cookieDetails');
  const reopenBtn = $('#cookieReopen');

  function show() {
    banner.hidden = false;
    requestAnimationFrame(() => banner.setAttribute('data-visible', 'true'));
  }
  function hide() {
    banner.removeAttribute('data-visible');
    setTimeout(() => { banner.hidden = true; }, 600);
  }
  function save(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        v: VERSION,
        choice: value,
        ts: Date.now(),
      }));
    } catch (_) { /* localStorage indisponible — silence */ }
  }
  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data.v === VERSION ? data.choice : null;
    } catch (_) { return null; }
  }

  // Affichage initial si aucun choix enregistré
  if (!read()) show();

  acceptBtn.addEventListener('click', () => { save('accepted'); hide(); });
  refuseBtn.addEventListener('click', () => { save('refused'); hide(); });

  moreBtn.addEventListener('click', () => {
    const open = details.hidden;
    details.hidden = !open;
    moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    moreBtn.textContent = open ? 'Réduire' : 'En savoir plus';
  });

  reopenBtn?.addEventListener('click', e => {
    e.preventDefault();
    show();
  });
})();
