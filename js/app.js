// js/app.js — Logika utama Lumicake by Kay

// ====== STATE ======
let filterKategori = 'semua';
let searchQuery = '';
let maxHarga = 5000000;
let sortBy = 'default';
let modalQty = 1;
let modalProdukId = null;

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
  renderProduk();
  updateCartUI();
  initEvents();
  initSmoothScroll();
  initHeaderScroll();
});

// ====== RENDER PRODUK ======
function renderProduk() {
  const grid = document.getElementById('produkGrid');
  const noProduk = document.getElementById('noProduk');
  if (!grid) return;

  let list = PRODUK_DATA.filter(p => {
    const cocokKategori = filterKategori === 'semua' || p.kategori === filterKategori;
    const cocokSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    const cocokHarga = p.harga <= maxHarga;
    return cocokKategori && cocokSearch && cocokHarga;
  });

  // Sorting
  if (sortBy === 'harga-asc') list.sort((a, b) => a.harga - b.harga);
  else if (sortBy === 'harga-desc') list.sort((a, b) => b.harga - a.harga);
  else if (sortBy === 'nama-asc') list.sort((a, b) => a.nama.localeCompare(b.nama));

  if (list.length === 0) {
    grid.innerHTML = '';
    noProduk?.classList.remove('hidden');
    return;
  }

  noProduk?.classList.add('hidden');
  grid.innerHTML = list.map(p => `
    <article class="produk-card" data-id="${p.id}" data-kategori="${p.kategori}">
      <div class="produk-img" onclick="bukaModal(${p.id})" role="button" tabindex="0" aria-label="Lihat detail ${p.nama}">
        <img src="${p.gambar}" alt="${p.nama}" loading="lazy" onerror="this.src='placeholder.jpg'" />
        ${p.badge ? `<span class="badge ${p.badgeClass}">${p.badge}</span>` : ''}
      </div>
      <div class="produk-info">
        <p class="produk-kategori">${labelKategori(p.kategori)}</p>
        <h3 onclick="bukaModal(${p.id})" role="button" tabindex="0">${p.nama}</h3>
        <p class="produk-desc">${p.deskripsi}</p>
        <p class="produk-harga">Rp ${p.harga.toLocaleString('id-ID')} <span>/ ${p.satuan}</span></p>
        <div class="produk-actions">
          <button class="btn-detail" onclick="bukaModal(${p.id})">Lihat Detail</button>
          <button class="btn-cart" onclick="tambahKeranjang(${p.id})">+ Keranjang</button>
        </div>
      </div>
    </article>
  `).join('');
}

function labelKategori(k) {
  const map = {
    cakes:   '🎂 Cakes',
    wedding: '💍 Wedding Cakes',
    cupcake: '🧁 Cupcakes',
    pastry:  '🍞 Pastry & Bread',
    cookies: '🍪 Cookies & Sweet Treats'
  };
  return map[k] || k;
}

// ====== EVENTS ======
function initEvents() {
  // Kategori filter
  document.querySelectorAll('.kategori-card').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.kategori-card').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterKategori = btn.dataset.filter;
      renderProduk();
      if (typeof trackEvent === 'function') trackEvent('filter', 'kategori', filterKategori);
    });
  });

  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(e => {
      searchQuery = e.target.value;
      renderProduk();
    }, 300));
  }

  // Sort
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      sortBy = e.target.value;
      renderProduk();
    });
  }

  // Harga range
  const hargaRange = document.getElementById('maxHarga');
  const hargaLabel = document.getElementById('hargaLabel');
  if (hargaRange) {
    hargaRange.addEventListener('input', e => {
      maxHarga = parseInt(e.target.value);
      hargaLabel.textContent = `Rp ${maxHarga.toLocaleString('id-ID')}`;
      renderProduk();
    });
  }

  // Cart open/close
  document.getElementById('cartBtn')?.addEventListener('click', bukaCart);
  document.getElementById('cartClose')?.addEventListener('click', tutupCart);
  document.getElementById('cartOverlay')?.addEventListener('click', tutupCart);

  // Checkout
  document.getElementById('btnCheckout')?.addEventListener('click', () => {
    if (getCart().length === 0) { showNotif('Keranjang masih kosong! 🥺'); return; }
    tutupCart();
    bukaCheckout();
  });

  document.getElementById('backFromCheckout')?.addEventListener('click', tutupCheckout);
  document.getElementById('btnClearCart')?.addEventListener('click', () => {
    if (confirm('Kosongkan semua keranjang?')) kosongkanCart();
  });

  // Payment
  document.getElementById('btnPay')?.addEventListener('click', prosesCheckout);

  // Modal close
  document.getElementById('modalClose')?.addEventListener('click', tutupModal);
  document.getElementById('modalOverlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) tutupModal();
  });

  // Modal qty
  document.getElementById('qtyMinus')?.addEventListener('click', () => {
    modalQty = Math.max(1, modalQty - 1);
    document.getElementById('qtyValue').textContent = modalQty;
  });
  document.getElementById('qtyPlus')?.addEventListener('click', () => {
    modalQty++;
    document.getElementById('qtyValue').textContent = modalQty;
  });
  document.getElementById('modalAddCart')?.addEventListener('click', () => {
    if (modalProdukId) {
      tambahKeranjang(modalProdukId, modalQty);
      tutupModal();
    }
  });

  // Success close
  document.getElementById('successClose')?.addEventListener('click', () => {
    document.getElementById('successOverlay')?.classList.add('hidden');
    tutupCheckout();
  });

  // Mobile nav toggle
  document.getElementById('navToggle')?.addEventListener('click', () => {
    document.getElementById('mainNav')?.classList.toggle('open');
  });

  // Keyboard accessibility
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      tutupModal();
      tutupCart();
    }
  });
}

// ====== CART SIDEBAR ======
function bukaCart() {
  document.getElementById('cartSidebar')?.classList.remove('hidden');
  document.getElementById('cartOverlay')?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  renderCartSidebar();
  if (typeof trackEvent === 'function') trackEvent('ui', 'open_cart', 'header');
}

function tutupCart() {
  document.getElementById('cartSidebar')?.classList.add('hidden');
  document.getElementById('cartOverlay')?.classList.add('hidden');
  document.body.style.overflow = '';
}

// ====== MODAL DETAIL ======
function bukaModal(id) {
  const p = PRODUK_DATA.find(x => x.id === id);
  if (!p) return;

  modalProdukId = id;
  modalQty = 1;

  document.getElementById('modalGambar').src = p.gambar;
  document.getElementById('modalGambar').alt = p.nama;
  document.getElementById('modalNama').textContent = p.nama;
  document.getElementById('modalDesc').textContent = p.deskripsi;
  document.getElementById('modalHarga').textContent = `Rp ${p.harga.toLocaleString('id-ID')} / ${p.satuan}`;
  document.getElementById('modalKategori').textContent = labelKategori(p.kategori);
  document.getElementById('qtyValue').textContent = '1';

  const badge = document.getElementById('modalBadge');
  badge.textContent = p.badge || '';
  badge.className = `badge ${p.badgeClass || ''}`;
  badge.style.display = p.badge ? 'inline-block' : 'none';

  document.getElementById('modalOverlay')?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (typeof trackEvent === 'function') trackEvent('product', 'view_detail', p.nama);
}

function tutupModal() {
  document.getElementById('modalOverlay')?.classList.add('hidden');
  document.body.style.overflow = '';
}

// ====== CHECKOUT ======
function bukaCheckout() {
  document.getElementById('checkoutPage')?.classList.remove('hidden');
  renderCheckoutItems();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (typeof trackEvent === 'function') trackEvent('checkout', 'begin_checkout', 'cart');
}

function tutupCheckout() {
  document.getElementById('checkoutPage')?.classList.add('hidden');
}

function prosesCheckout() {
  if (!validasiForm()) return;

  const cart = getCart();
  if (cart.length === 0) { showNotif('Keranjang kosong! 🥺'); return; }

  const orderId = 'LMC-' + Date.now().toString().slice(-6);
  document.getElementById('orderId').textContent = `ID Pesanan: ${orderId}`;
  document.getElementById('successOverlay')?.classList.remove('hidden');

  kosongkanCart();

  if (typeof trackEvent === 'function') trackEvent('checkout', 'purchase', orderId);
}

// ====== VALIDASI FORM ======
function validasiForm() {
  let valid = true;

  const nama = document.getElementById('namaLengkap')?.value.trim();
  const email = document.getElementById('emailPemesan')?.value.trim();
  const hp = document.getElementById('noHp')?.value.trim();
  const alamat = document.getElementById('alamat')?.value.trim();

  clearErrors();

  if (!nama || nama.length < 3) {
    setError('errNama', 'Nama lengkap minimal 3 karakter');
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('errEmail', 'Format email tidak valid');
    valid = false;
  }
  if (!hp || !/^08[0-9]{8,11}$/.test(hp)) {
    setError('errHp', 'Nomor HP harus diawali 08 dan 10-13 digit');
    valid = false;
  }
  if (!alamat || alamat.length < 10) {
    setError('errAlamat', 'Alamat terlalu pendek, tolong lengkapi');
    valid = false;
  }

  return valid;
}

function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function clearErrors() {
  ['errNama','errEmail','errHp','errAlamat'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  });
}

// ====== NOTIFIKASI TOAST ======
function showNotif(msg) {
  const notif = document.getElementById('notif');
  if (!notif) return;
  notif.textContent = msg;
  notif.classList.remove('hidden');
  clearTimeout(window._notifTimer);
  window._notifTimer = setTimeout(() => notif.classList.add('hidden'), 2500);
}

// ====== SMOOTH SCROLL ======
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('mainNav')?.classList.remove('open');
      }
    });
  });
}

// ====== HEADER SCROLL EFFECT ======
function initHeaderScroll() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) header?.classList.add('scrolled');
    else header?.classList.remove('scrolled');
  });
}

// ====== UTILITY ======
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
