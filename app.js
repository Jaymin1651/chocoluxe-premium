'use strict';

const productCatalog = {
  dark: {
    name: 'Dark',
    tag: 'Classic',
    description: 'Smooth, rich and beautifully balanced with a gentle finish.',
    prices: { 200: 165, 400: 328 },
    image: { 200: 'dark.png', 400: 'Dark 400.png' }
  },
  'extra-dark': {
    name: 'Extra Dark',
    tag: 'Classic',
    description: 'Bold, intense and elegantly bitter with a lingering cocoa finish.',
    prices: { 200: 180, 400: 364 },
    image: { 200: 'extra dark.png', 400: 'Extra dark 400.png' }
  },
  milk: {
    name: 'Milk',
    tag: 'Classic',
    description: 'Creamy, smooth and loved by every chocolate lover.',
    prices: { 200: 155, 400: 308 },
    image: { 200: 'milk.png', 400: 'milk 400.png' }
  },
  fusion: {
    name: 'Fusion Bite',
    tag: 'Signature',
    description: 'A playful blend of rich chocolate and layered flavour notes.',
    prices: { 200: 155, 400: 308 },
    image: { 200: 'fusion bite.png', 400: 'fusion 400.png' }
  },
  paan: {
    name: 'Paan',
    tag: 'Signature',
    description: 'A refreshing paan-inspired flavour with a vibrant finish.',
    prices: { 200: 166, 400: 332 },
    image: { 200: 'pan.jpg', 400: 'Pan 400.png' }
  },
  butterscotch: {
    name: 'Butterscotch',
    tag: 'Crunch',
    description: 'Golden butterscotch notes meet smooth chocolate and a satisfying crunch.',
    prices: { 200: 156, 400: 312 },
    image: { 200: 'butterscoch.png', 400: 'butter scoch 400.png' }
  },
  'choco-crunch': {
    name: 'Choco Crunch',
    tag: 'Crunch',
    description: 'Crisp, crunchy and rich with a deep cocoa finish.',
    prices: { 200: 158, 400: 316 },
    image: { 200: 'choco crunch.jpg', 400: 'choco crunch 400.png' }
  }
};

const currency = value => `₹${Number(value).toLocaleString('en-IN')}`;
const productList = document.getElementById('productList');
const trayCountEl = document.getElementById('trayCount');
const trayPriceEl = document.getElementById('trayPrice');
const trayButtonHome = document.getElementById('trayButtonHome');
const topTrayCount = document.getElementById('topTrayCount');
const trayBar = document.getElementById('trayBar');
const trayAction = document.getElementById('trayAction');

function getTray() {
  return JSON.parse(localStorage.getItem('chocoluxe-tray-v1') || '{}');
}

function setTray(tray) {
  localStorage.setItem('chocoluxe-tray-v1', JSON.stringify(tray));
}

function updateTrayUi() {
  const tray = getTray();
  const keys = Object.keys(tray);
  const totalQty = keys.reduce((sum, key) => sum + Number(tray[key] || 0), 0);
  const totalPrice = keys.reduce((sum, key) => {
    const product = productCatalog[key];
    if (!product) return sum;
    return sum + Number(product.prices[200] || 0) * Number(tray[key] || 0);
  }, 0);

  trayCountEl.textContent = `${totalQty || 0} box${totalQty === 1 ? '' : 'es'}`;
  trayPriceEl.textContent = currency(totalPrice || 0);
  trayButtonHome.textContent = `Your tray ${totalQty || 0}`;
  topTrayCount.textContent = String(totalQty || 0);
  trayBar.style.display = 'flex';
}

function renderProducts() {
  const productIds = Object.keys(productCatalog);

  productList.innerHTML = productIds
    .map((id) => {
      const product = productCatalog[id];
      const primaryImage = product.image[200];
      return `
        <article class="product-card" data-id="${id}">
          <div class="product-visual">
            <img src="${primaryImage}" alt="${product.name} chocolate box" />
            <div class="fssai-badge">FSSAI<br />certified</div>
          </div>
          <div class="product-body">
            <div class="product-top">
              <span class="product-tag">${product.tag}</span>
              <div class="size-options">
                <button class="size-option active" type="button" data-id="${id}" data-size="200">200g</button>
                <button class="size-option" type="button" data-id="${id}" data-size="400">400g</button>
              </div>
            </div>

            <h3 class="product-name">${product.name}</h3>
            <p class="product-desc">${product.description}</p>

            <div class="product-footer">
              <div class="product-price">${currency(product.prices[200])}</div>
              <div class="product-actions">
                <button class="view-btn" type="button" data-id="${id}">View</button>
                <button class="add-btn-inline" type="button" data-id="${id}" aria-label="Add ${product.name}">+</button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  document.querySelectorAll('.size-option').forEach((button) => {
    button.addEventListener('click', (event) => {
      const { id, size } = event.currentTarget.dataset;
      const product = productCatalog[id];
      const card = event.currentTarget.closest('.product-card');
      const priceEl = card.querySelector('.product-price');

      card.querySelectorAll('.size-option').forEach((option) => option.classList.toggle('active', option === event.currentTarget));
      priceEl.textContent = currency(product.prices[size]);

      const newImage = product.image[size] || product.image[200];
      card.querySelector('.product-visual img').src = newImage;
    });
  });

  document.querySelectorAll('.view-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const card = button.closest('.product-card');
      const selectedSize = card.querySelector('.size-option.active')?.dataset.size || '200';
      window.location.href = `product.html?id=${encodeURIComponent(id)}&size=${selectedSize}`;
    });
  });

  document.querySelectorAll('.add-btn-inline').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const tray = getTray();
      tray[id] = (Number(tray[id]) || 0) + 1;
      setTray(tray);
      updateTrayUi();
    });
  });
}

trayAction.addEventListener('click', () => {
  window.location.href = '#collection';
});

trayButtonHome.addEventListener('click', () => {
  window.location.href = '#collection';
});

renderProducts();
updateTrayUi();

const menuButton = document.querySelector('.menu-btn');
const drawer = document.querySelector('.drawer-menu');

if (menuButton && drawer) {
  menuButton.addEventListener('click', () => {
    const next = drawer.style.display === 'block' ? 'none' : 'block';
    drawer.style.display = next;
  });
}
