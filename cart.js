// js/cart.js — Manajemen keranjang belanja dengan localStorage

const CART_KEY = 'lumicake_cart';

// ====== STORAGE ======
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ====== OPERASI CART ======
function tambahKeranjang(produkId, qty = 1) {
  const cart = getCart();
  const produk = PRODUK_DATA.find(p => p.id === produkId);
  if (!produk) return;

  const existing = cart.find(item => item.id === produkId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: produk.id, nama: produk.nama, harga: produk.harga, satuan: produk.satuan, gambar: produk.gambar, qty });
  }

  saveCart(cart);
  updateCartUI();
  showNotif(`🎀 "${produk.nama}" ditambahkan ke keranjang!`);

  // GA Event
  if (typeof trackEvent === 'function') {
    trackEvent('ecommerce', 'add_to_cart', produk.nama);
  }
}

function hapusItem(produkId) {
  const cart = getCart().filter(item => item.id !== produkId);
  saveCart(cart);
  updateCartUI();
  renderCartSidebar();
}

function updateQty(produkId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === produkId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
  updateCartUI();
  renderCartSidebar();
}

function kosongkanCart() {
  saveCart([]);
  updateCartUI();
  renderCartSidebar();
}

// ====== HITUNG TOTAL ======
function hitungSubtotal(cart) {
  return cart.reduce((acc, item) => acc + item.harga * item.qty, 0);
}

function formatRupiah(angka) {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

// ====== UPDATE BADGE HEADER ======
function updateCartUI() {
  const cart = getCart();
  const totalQty = cart.reduce((a, i) => a + i.qty, 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = totalQty;
}

// ====== RENDER SIDEBAR CART ======
function renderCartSidebar() {
  const cart = getCart();
  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const ongkir = 15000;

  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="cart-empty">Keranjangmu masih kosong 🥺<br/>Yuk pilih kue yang kamu suka!</p>`;
    if (cartFooter) cartFooter.classList.add('hidden');
    return;
  }

  if (cartFooter) cartFooter.classList.remove('hidden');

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.gambar}" alt="${item.nama}" onerror="this.src='images/placeholder.jpg'" />
      <div class="cart-item-info">
        <p class="cart-item-nama">${item.nama}</p>
        <p class="cart-item-harga">${formatRupiah(item.harga)} / ${item.satuan}</p>
        <div class="cart-item-qty">
          <button onclick="updateQty(${item.id}, -1)" aria-label="Kurangi">−</button>
          <span>${item.qty}</span>
          <button onclick="updateQty(${item.id}, 1)" aria-label="Tambah">+</button>
          <button class="btn-hapus" onclick="hapusItem(${item.id})" aria-label="Hapus item">🗑️</button>
        </div>
      </div>
      <p class="cart-item-total">${formatRupiah(item.harga * item.qty)}</p>
    </div>
  `).join('');

  const subtotal = hitungSubtotal(cart);
  const total = subtotal + ongkir;

  const subEl = document.getElementById('cartSubtotal');
  const totEl = document.getElementById('cartTotal');
  if (subEl) subEl.textContent = formatRupiah(subtotal);
  if (totEl) totEl.textContent = formatRupiah(total);
}

// ====== RENDER CHECKOUT ITEMS ======
function renderCheckoutItems() {
  const cart = getCart();
  const ongkir = 15000;
  const container = document.getElementById('checkoutItems');
  if (!container) return;

  container.innerHTML = cart.map(item => `
    <div class="checkout-item">
      <img src="${item.gambar}" alt="${item.nama}" onerror="this.src='images/placeholder.jpg'" />
      <div>
        <p><strong>${item.nama}</strong></p>
        <p>${item.qty} x ${formatRupiah(item.harga)}</p>
      </div>
      <p>${formatRupiah(item.harga * item.qty)}</p>
    </div>
  `).join('');

  const subtotal = hitungSubtotal(cart);
  const total = subtotal + ongkir;

  const coSub = document.getElementById('coSubtotal');
  const coTot = document.getElementById('coTotal');
  if (coSub) coSub.textContent = formatRupiah(subtotal);
  if (coTot) coTot.textContent = formatRupiah(total);
}
