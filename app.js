'use strict';

const $ = selector => document.querySelector(selector);
const cards = [...document.querySelectorAll('.product')];
const categories = { classic: 'Cocoa Classics', signature: 'Signature Flavours', crunch: 'Crunch Collection' };
const descriptions = {
  milk: 'Creamy, mellow and instantly likeable. An easy favourite for sharing, thoughtful gifts and everyday celebrations.',
  dark: 'Smooth, deep and beautifully balanced. A timeless cocoa character for moments that call for a richer bite.',
  'extra-dark': 'A bold, intense cocoa character with a lingering finish. A little indulgence for the devoted chocolate lover.',
  fusion: 'A hand-marbled swirl of bold and creamy chocolate, finished with a striking look and a playful bite.',
  paan: 'A familiar paan-inspired flavour in a playful chocolate form. A colourful addition to your gifting selection or tasting tray.',
  butterscotch: 'Chocolate meets golden butterscotch pieces for a sweet, satisfying crunch. A little texture in every indulgent bite.',
  'choco-crunch': 'A chocolate favourite with a crisp, crunchy texture. Made for anyone who likes a little extra bite with their chocolate.'
};
const products = Object.fromEntries(cards.map(card => [card.dataset.id, {
  id: card.dataset.id,
  name: card.querySelector('h3').textContent,
  category: categories[card.dataset.type],
  price: Number(card.dataset.price),
  image: card.querySelector('img').getAttribute('src'),
  description: descriptions[card.dataset.id]
}]));
const currency = value => `₹${value.toLocaleString('en-IN')}`;
const tray = {};
const storageKey = 'chocoluxe-tasting-tray-v1';
let currentProduct = null;
let quantity = 1;
let activeFilter = 'all';

// Product prices always come from the catalogue, never from stored browser data.
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  Object.keys(products).forEach(id => {
    if (Number.isSafeInteger(saved?.[id]) && saved[id] > 0 && saved[id] <= 999) tray[id] = saved[id];
  });
} catch { /* Private browsing or invalid saved data must not block the catalogue. */ }

function trayTotals() {
  return Object.entries(tray).reduce((totals, [id, count]) => ({
    count: totals.count + count,
    price: totals.price + products[id].price * count
  }), { count: 0, price: 0 });
}

function updateTray() {
  const total = trayTotals();
  $('#headerCount').textContent = total.count;
  $('#headerTray').setAttribute('aria-label', `View tasting tray, ${total.count} boxes`);
  $('#tray').hidden = total.count === 0;
  cards.forEach(card => { card.querySelector('.quick-add').disabled = (tray[card.dataset.id] || 0) >= 999; });
  $('#traySummary').textContent = `${total.count} box${total.count === 1 ? '' : 'es'} · ${currency(total.price)}`;
  try { localStorage.setItem(storageKey, JSON.stringify(tray)); } catch { /* Storage is optional. */ }
}

function applyCollection() {
  const sort = $('#sortProducts').value;
  const ordered = [...cards];
  if (sort !== 'featured') ordered.sort((a, b) => sort === 'price-asc'
    ? Number(a.dataset.price) - Number(b.dataset.price)
    : Number(b.dataset.price) - Number(a.dataset.price));
  ordered.forEach(card => {
    card.hidden = activeFilter !== 'all' && card.dataset.type !== activeFilter;
    $('#products').insertBefore(card, $('.collection-card'));
  });
  const visibleCount = cards.filter(card => !card.hidden).length;
  $('#resultCount').textContent = activeFilter === 'all'
    ? `Showing all ${visibleCount} flavours`
    : `${categories[activeFilter]} · ${visibleCount} flavours`;
  $('.collection-card').hidden = activeFilter !== 'all';
}

function openProduct(card) {
  currentProduct = products[card.dataset.id];
  quantity = 1;
  $('#modalImage').src = currentProduct.image;
  $('#modalImage').alt = `${currentProduct.name} chocolates and ChocoLuxe gift box`;
  $('#modalCategory').textContent = currentProduct.category;
  $('#modalTitle').textContent = currentProduct.name;
  $('#modalCopy').textContent = currentProduct.description;
  $('#modalPrice').textContent = currency(currentProduct.price);
  updateQuantity();
  $('#productDialog').showModal();
}

function updateQuantity() {
  $('#qtyValue').textContent = quantity;
  $('#minus').disabled = quantity === 1;
  $('#plus').disabled = quantity === 999;
  $('#addButton').disabled = (tray[currentProduct.id] || 0) + quantity > 999;
  $('#addButton').textContent = $('#addButton').disabled
    ? 'Maximum 999 boxes per flavour'
    : `Add ${quantity} box${quantity === 1 ? '' : 'es'} · ${currency(quantity * currentProduct.price)}`;
}

function createQuantityButton(label, text, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.textContent = text;
  button.addEventListener('click', handler);
  return button;
}

function renderTray() {
  const container = $('#trayItems');
  container.replaceChildren();
  Object.entries(tray).forEach(([id, count]) => {
    const product = products[id];
    const item = document.createElement('div');
    item.className = 'tray-item';
    const image = document.createElement('img');
    image.src = product.image;
    image.alt = product.name;
    const info = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = product.name;
    const price = document.createElement('p');
    price.textContent = `${currency(product.price)} / box`;
    const controls = document.createElement('div');
    controls.className = 'qty';
    const decrease = createQuantityButton(`Decrease ${product.name} boxes`, '−', () => changeTray(id, -1));
    const output = document.createElement('output');
    output.textContent = count;
    output.setAttribute('aria-label', `${product.name} box quantity`);
    const increase = createQuantityButton(`Increase ${product.name} boxes`, '+', () => changeTray(id, 1));
    increase.disabled = count >= 999;
    controls.append(decrease, output, increase);
    info.append(title, price, controls);
    const end = document.createElement('div');
    const subtotal = document.createElement('p');
    subtotal.className = 'tray-item-total';
    subtotal.textContent = currency(product.price * count);
    const remove = createQuantityButton(`Remove ${product.name}`, 'Remove', () => {
      delete tray[id]; updateTray(); renderTray();
      $('#announcement').textContent = `${product.name} removed from your tray.`;
      $('#trayDialog .close').focus();
    });
    remove.className = 'remove-item';
    end.append(subtotal, remove);
    item.append(image, info, end);
    container.append(item);
  });
  const totals = trayTotals();
  if (!totals.count) {
    const empty = document.createElement('p');
    empty.className = 'tray-empty';
    empty.textContent = 'Your tray is waiting for a little joy. Explore the collection and add your favourite flavours.';
    container.append(empty);
  }
  $('#traySubtotal').textContent = currency(totals.price);
  $('#whatsappOrder').hidden = totals.count === 0;
  const lines = Object.entries(tray).map(([id, count]) =>
    `${count} x ${products[id].name} — ${currency(products[id].price)} per box = ${currency(products[id].price * count)}`);
  const message = ['Hello ChocoLuxe, I would like to enquire about this selection:', '', ...lines, '',
    `Total: ${totals.count} boxes`, `Wholesale product subtotal: ${currency(totals.price)}`,
    'Please confirm availability, delivery and packaging options.'].join('\n');
  $('#whatsappOrder').href = `https://wa.me/919974157344?text=${encodeURIComponent(message)}`;
}

function changeTray(id, amount) {
  const next = tray[id] + amount;
  if (next > 999) return;
  if (next <= 0) delete tray[id]; else tray[id] = next;
  updateTray();
  renderTray();
  const buttons = [...$('#trayItems').querySelectorAll('button')];
  const target = buttons.find(button => button.getAttribute('aria-label') === `${amount > 0 ? 'Increase' : 'Decrease'} ${products[id].name} boxes`);
  (target && !target.disabled ? target : $('#trayDialog .close')).focus();
  $('#announcement').textContent = `${products[id].name}: ${next} boxes in your tray.`;
}

function openTray() {
  renderTray();
  $('#trayDialog').showModal();
}

cards.forEach(card => {
  card.querySelector('.quick').addEventListener('click', () => openProduct(card));
  card.querySelector('.photo-open').addEventListener('click', () => openProduct(card));
  card.querySelector('.quick-add').addEventListener('click', () => addSelection(card.dataset.id, 1));
});
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  document.querySelectorAll('.filter').forEach(filter => {
    const active = filter === button;
    filter.classList.toggle('active', active);
    filter.setAttribute('aria-pressed', String(active));
  });
  applyCollection();
}));
$('#sortProducts').addEventListener('change', applyCollection);
$('#minus').addEventListener('click', () => { quantity = Math.max(1, quantity - 1); updateQuantity(); });
$('#plus').addEventListener('click', () => { quantity = Math.min(999, quantity + 1); updateQuantity(); });
$('#addButton').addEventListener('click', () => {
  if (!currentProduct || (tray[currentProduct.id] || 0) + quantity > 999) return;
  addSelection(currentProduct.id, quantity);
  $('#productDialog').close();
});
$('#headerTray').addEventListener('click', openTray);
$('#trayButton').addEventListener('click', openTray);
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
}));
updateTray();

// Shortcuts use the same catalogue prices and quantity limits as the product dialog.
let toastTimer;
function addSelection(id, count) {
  if (!products[id] || !Number.isSafeInteger(count) || count < 1 || (tray[id] || 0) + count > 999) return;
  tray[id] = (tray[id] || 0) + count;
  updateTray();
  $('#toastMessage').textContent = `${count} × ${products[id].name} added to your tray`;
  $('#trayToast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#trayToast').hidden = true; }, 4500);
}
$('#toastReview').addEventListener('click', () => { $('#trayToast').hidden = true; openTray(); });

const moodMatches = {
  comfort: { ids: ['milk', 'fusion'], text: 'Soft, creamy favourites for a comforting little moment.' },
  bold: { ids: ['dark', 'extra-dark'], text: 'A deeper cocoa character for your bolder side.' },
  adventure: { ids: ['paan', 'fusion'], text: 'A playful twist when you want something a little different.' },
  crunch: { ids: ['butterscotch', 'choco-crunch'], text: 'A satisfying crunch with your chocolate indulgence.' }
};
function selectMood(mood) {
  const selection = moodMatches[mood];
  $('#finderSummary').textContent = selection.text;
  document.querySelectorAll('[data-mood]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.mood === mood));
  });
  $('#finderResults').replaceChildren();
  selection.ids.forEach(id => {
    const product = products[id];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'flavour-match';
    button.setAttribute('aria-label', `Discover ${product.name}, ${currency(product.price)} per box`);
    const image = document.createElement('img');
    image.src = product.image;
    image.alt = '';
    const copy = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = product.name;
    const price = document.createElement('small');
    price.textContent = `${currency(product.price)} / box`;
    copy.append(name, price);
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    button.append(image, copy, arrow);
    button.addEventListener('click', () => openProduct(cards.find(card => card.dataset.id === id)));
    $('#finderResults').append(button);
  });
}
document.querySelectorAll('[data-mood]').forEach(button => button.addEventListener('click', () => selectMood(button.dataset.mood)));
selectMood('comfort');
$('#flavourFinder').hidden = false;

// Visitors control the showcase themselves; photographs never change while being read.
const spotlightIds = ['butterscotch', 'paan', 'fusion'];
let spotlightIndex = 0;
function showSpotlight(index) {
  spotlightIndex = index;
  const product = products[spotlightIds[index]];
  $('#heroImage').src = product.image;
  $('#heroImage').alt = `${product.name} chocolates and ChocoLuxe gift box`;
  $('#heroName').textContent = product.name;
  $('#heroPrice').textContent = `${currency(product.price)} / box`;
  $('#heroProduct').setAttribute('aria-label', `Discover ${product.name}`);
  document.querySelectorAll('[data-slide]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.slide) === index)));
  $('.hero-photo').classList.remove('is-switching');
  void $('.hero-photo').offsetWidth;
  $('.hero-photo').classList.add('is-switching');
}
document.querySelectorAll('[data-slide]').forEach(button => button.addEventListener('click', () => showSpotlight(Number(button.dataset.slide))));
$('#nextSpotlight').addEventListener('click', () => showSpotlight((spotlightIndex + 1) % spotlightIds.length));
$('#heroProduct').addEventListener('click', () => openProduct(cards.find(card => card.dataset.id === spotlightIds[spotlightIndex])));
$('.hero-showcase').hidden = false;

let scrollFramePending = false;
function updateScrollState() {
  const travel = document.documentElement.scrollHeight - window.innerHeight;
  $('.header').style.setProperty('--scroll-progress', travel > 0 ? Math.min(1, Math.max(0, window.scrollY / travel)) : 0);
  $('.header').classList.toggle('is-scrolled', window.scrollY > 10);
  const links = [...document.querySelectorAll('.topnav a')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  let active = -1;
  sections.forEach((section, index) => { if (section.getBoundingClientRect().top <= 180) active = index; });
  links.forEach((link, index) => {
    if (index === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scrollFramePending = false;
}
window.addEventListener('scroll', () => {
  if (!scrollFramePending) { scrollFramePending = true; requestAnimationFrame(updateScrollState); }
}, { passive: true });
window.addEventListener('resize', updateScrollState);
updateScrollState();
// Scroll entrances enhance normal browser scrolling; no wheel or touch events are intercepted.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealTargets = [...document.querySelectorAll(
  '.benefits > span, .section-head, .flavour-finder, .collection-tools, .collection-meta, ' +
  '.product, .collection-card, .story-image, .story-content, .details > div, ' +
  '.order-panel, .footer-main > div, .footer-bottom'
)];
let revealObserver = null;
function revealElement(element) {
  element.classList.add('is-visible');
  revealObserver?.unobserve(element);
}
function revealAllContent() {
  revealObserver?.disconnect();
  revealTargets.forEach(revealElement);
}
function initialiseScrollEffects() {
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;
  try {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) revealElement(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -28px 0px' });
    const columns = Math.max(1, getComputedStyle($('#products')).gridTemplateColumns.split(' ').length);
    cards.forEach((card, index) => card.style.setProperty('--reveal-delay', `${(index % columns) * 75}ms`));
    document.querySelectorAll('.benefits > span, .footer-main > div').forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${(index % 4) * 60}ms`);
    });
    revealTargets.forEach(element => {
      element.classList.add('scroll-reveal');
      if (element.matches('.story-image')) element.classList.add('slide-from-left');
      if (element.matches('.story-content')) element.classList.add('slide-from-right');
      const bounds = element.getBoundingClientRect();
      // Direct links, restored scroll positions and content already onscreen remain readable.
      if (bounds.top < window.innerHeight - 28 && bounds.bottom > 0) revealElement(element);
      else revealObserver.observe(element);
    });
  } catch {
    revealAllContent();
  }
}
// Reveal immediately for keyboard navigation, even before the observer's next frame.
document.addEventListener('focusin', event => {
  const target = event.target.closest('.scroll-reveal');
  if (target) revealElement(target);
});
window.addEventListener('pageshow', event => {
  if (event.persisted) revealAllContent();
});
motionPreference.addEventListener('change', event => {
  if (event.matches) revealAllContent();
  else if (!revealObserver) initialiseScrollEffects();
});
initialiseScrollEffects();
