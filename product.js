'use strict';

const catalog = {
  dark: {
    id: 'dark',
    name: 'Dark',
    category: 'Classic',
    description: 'Smooth, deep and beautifully balanced. A timeless cocoa character for moments that call for a richer bite.',
    prices: { 200: 165, 400: 328 },
    image: { 200: 'dark.png', 400: 'Dark 400.png' }
  },
  'extra-dark': {
    id: 'extra-dark',
    name: 'Extra Dark',
    category: 'Classic',
    description: 'A bold, intense cocoa character with a lingering finish for the devoted chocolate lover.',
    prices: { 200: 180, 400: 364 },
    image: { 200: 'extra dark.png', 400: 'Extra dark 400.png' }
  },
  milk: {
    id: 'milk',
    name: 'Milk',
    category: 'Classic',
    description: 'Creamy, mellow and instantly likeable. A classic chocolate comfort for gifting and everyday indulgence.',
    prices: { 200: 155, 400: 308 },
    image: { 200: 'milk.png', 400: 'milk 400.png' }
  },
  fusion: {
    id: 'fusion',
    name: 'Fusion Bite',
    category: 'Signature',
    description: 'A playful blend of rich chocolate and layered flavour notes designed to surprise and delight.',
    prices: { 200: 155, 400: 308 },
    image: { 200: 'fusion bite.png', 400: 'fusion 400.png' }
  },
  paan: {
    id: 'paan',
    name: 'Paan',
    category: 'Signature',
    description: 'A refreshing paan-inspired flavour with a vibrant finish and an unmistakably memorable character.',
    prices: { 200: 166, 400: 332 },
    image: { 200: 'pan.jpg', 400: 'Pan 400.png' }
  },
  butterscotch: {
    id: 'butterscotch',
    name: 'Butterscotch',
    category: 'Crunch',
    description: 'Golden butterscotch notes meet smooth chocolate and a satisfying crunch in every bite.',
    prices: { 200: 156, 400: 312 },
    image: { 200: 'butterscoch.png', 400: 'butter scoch 400.png' }
  },
  'choco-crunch': {
    id: 'choco-crunch',
    name: 'Choco Crunch',
    category: 'Crunch',
    description: 'Crisp, crunchy and rich with a deep cocoa finish built for lovers of texture and bite.',
    prices: { 200: 158, 400: 316 },
    image: { 200: 'choco crunch.jpg', 400: 'choco crunch 400.png' }
  }
};

const currency = value => `₹${Number(value).toLocaleString('en-IN')}`;
const params = new URLSearchParams(window.location.search);
const defaultProduct = 'milk';
const productId = catalog[params.get('id')] ? params.get('id') : defaultProduct;
const selectedSize = ['200', '400'].includes(params.get('size')) ? params.get('size') : '200';
const product = catalog[productId];
const tray = JSON.parse(localStorage.getItem('chocoluxe-tray-v1') || '{}');

let activeSlide = 0;
let dragStartX = 0;

function renderGallery() {
  const slides = [product.image[selectedSize] || product.image[200], 'fssai image.png'];
  const track = document.getElementById('galleryTrack');
  const dots = document.getElementById('galleryDots');

  track.innerHTML = slides.map((src, index) => {
    const alt = index === 0 ? `${product.name} ${selectedSize}g chocolate box` : 'FSSAI certified chocolate product';
    return `<div class="gallery-slide"><img src="${src}" alt="${alt}" /></div>`;
  }).join('');

  track.style.transform = `translateX(-${activeSlide * 100}%)`;

  dots.innerHTML = slides.map((_, index) => {
    const cls = index === activeSlide ? 'gallery-dot is-active' : 'gallery-dot';
    return `<button class="${cls}" type="button" aria-label="Show slide ${index + 1}" data-index="${index}"></button>`;
  }).join('');

  dots.querySelectorAll('.gallery-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      activeSlide = Number(dot.dataset.index);
      renderGallery();
    });
  });
}

function renderProduct() {
  if (!product) {
    window.location.href = 'index.html';
    return;
  }

  const image = product.image[selectedSize] || product.image[200];
  document.getElementById('detailCategory').textContent = product.category;
  document.getElementById('detailName').textContent = product.name;
  document.getElementById('detailDescription').textContent = product.description;
  document.getElementById('detailPrice').textContent = currency(product.prices[selectedSize] || product.prices[200]);

  document.querySelectorAll('.size-tab').forEach(button => {
    const isActive = button.dataset.size === selectedSize;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  renderGallery();
}

document.querySelectorAll('.size-tab').forEach(button => {
  button.addEventListener('click', () => {
    const nextSize = button.dataset.size;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('id', productId);
    nextUrl.searchParams.set('size', nextSize);
    window.location.href = nextUrl.toString();
  });
});

document.getElementById('detailAdd').addEventListener('click', () => {
  tray[productId] = (tray[productId] || 0) + 1;
  localStorage.setItem('chocoluxe-tray-v1', JSON.stringify(tray));
  window.location.href = 'index.html';
});

const gallery = document.querySelector('.gallery');
if (gallery) {
  gallery.addEventListener('pointerdown', event => {
    dragStartX = event.clientX;
  });

  gallery.addEventListener('pointerup', event => {
    const delta = event.clientX - dragStartX;
    if (Math.abs(delta) > 35) {
      activeSlide = delta < 0
        ? Math.min(activeSlide + 1, 1)
        : Math.max(activeSlide - 1, 0);
      renderGallery();
    }
  });
}

renderProduct();
