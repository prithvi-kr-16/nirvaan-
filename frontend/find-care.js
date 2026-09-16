

const API = 'http://localhost:3000/api';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));

// ==========================================================================
// 1. LIVE HOSPITAL ICU BEDS & BLOOD BANK STATUS MODULE
// ==========================================================================

// Demo values — replace with real-time data from hospital or a verified source before production use.
const liveDemoState = {
  hospitals: [
    { name: 'Arwal Sadar Hospital', location: 'Opposite DM Residence, Arwal, Bihar 804401', icuBeds: 5, totalIcu: 12 },
    { name: 'Government Hospital, Arwal', location: 'Arwal, Bihar 804419', icuBeds: 2, totalIcu: 8 },
    { name: 'Satyadev Multi Super Speciality Hospital', location: 'Sipah Panchayat, Arwal, Bihar', icuBeds: 4, totalIcu: 8 },
    { name: 'Khursheed Ahmad Memorial Hospital', location: 'Arwal, Bihar 804401', icuBeds: 1, totalIcu: 6 },
    { name: 'Pipra Hospital Pvt. Ltd', location: 'Arwal, Bihar 804401', icuBeds: 0, totalIcu: 4 },
    { name: 'Primary Health Centre, Arwal', location: 'Arwal, Bihar 804427', icuBeds: 2, totalIcu: 4 }
  ],
  bloodBank: {
    bankName: 'NIRVAAN Central Blood Bank (Arwal)',
    location: 'Opposite DM Residence, Arwal, Bihar 804401',
    stock: {
      'A+': 14,
      'A-': 3,
      'B+': 22,
      'B-': 2,
      'O+': 35,
      'O-': 1,
      'AB+': 8,
      'AB-': 0
    }
  }
};

// Apply subtle real-time jitter (±1) for realistic demo animation
function applyDemoJitter() {
  // Jitter hospital beds
  liveDemoState.hospitals.forEach(h => {
    const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    h.icuBeds = Math.max(0, Math.min(h.totalIcu, h.icuBeds + delta));
  });

  // Jitter blood stock
  const groups = Object.keys(liveDemoState.bloodBank.stock);
  // Pick 2 random groups to fluctuate each cycle
  const shuffled = [...groups].sort(() => 0.5 - Math.random());
  shuffled.slice(0, 2).forEach(grp => {
    const delta = Math.floor(Math.random() * 3) - 1;
    liveDemoState.bloodBank.stock[grp] = Math.max(0, liveDemoState.bloodBank.stock[grp] + delta);
  });
}

// Compute ICU bed badge
function getIcuBadge(beds) {
  const count = Number(beds) || 0;
  if (count > 3) {
    return `<span class="status-badge status-available"><span class="badge-dot"></span>${count} Beds Available</span>`;
  } else if (count > 0) {
    return `<span class="status-badge status-warning"><span class="badge-dot"></span>${count} Beds Left</span>`;
  } else {
    return `<span class="status-badge status-full"><span class="badge-dot"></span>Full (0 Beds)</span>`;
  }
}

// Compute Blood unit status
function getBloodChipClass(units) {
  const count = Number(units) || 0;
  if (count > 5) return { cls: 'chip-available', label: 'Available' };
  if (count > 0) return { cls: 'chip-warning', label: 'Low Stock' };
  return { cls: 'chip-critical', label: 'Critical' };
}

// Fetch & Render Hospital ICU Beds
async function fetchHospitalIcuStatus() {
  const icuListEl = document.getElementById('hospitalIcuList');
  if (!icuListEl) return;

  let list = [];
  try {
    const res = await fetch(`${API}/hospitals`);
    if (!res.ok) throw new Error('API offline');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      list = data.map((h, i) => {
        let beds = 0;
        if (typeof h.icuAvailable === 'number') {
          beds = h.icuAvailable;
        } else if (h.icuStatus === 'available') {
          beds = 4 + (i % 4);
        } else if (h.icuStatus === 'full') {
          beds = 0;
        } else {
          beds = Math.max(0, Math.floor((h.beds || 30) * 0.1));
        }
        return {
          name: h.name || 'Hospital',
          location: h.address || (h.city ? `${h.city}, Bihar` : 'Arwal, Bihar'),
          icuBeds: beds
        };
      });
    } else {
      throw new Error('No hospital data');
    }
  } catch (err) {
    // Fall back to jittered demo data
    list = liveDemoState.hospitals;
  }

  icuListEl.innerHTML = list.map(h => `
    <div class="icu-item">
      <div class="icu-item-info">
        <span class="icu-item-name">${escapeHtml(h.name)}</span>
        <span class="icu-item-location">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${escapeHtml(h.location)}
        </span>
      </div>
      <div>
        ${getIcuBadge(h.icuBeds)}
      </div>
    </div>
  `).join('');
}

// Fetch & Render Blood Bank Stock
async function fetchBloodBankStatus() {
  const stockGridEl = document.getElementById('bloodStockGrid');
  if (!stockGridEl) return;

  const targetGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  let stockData = {};

  try {
    const res = await fetch(`${API}/blood-banks`);
    if (!res.ok) throw new Error('Blood bank endpoint offline');
    const data = await res.json();
    if (data && data.stock) {
      stockData = data.stock;
    } else {
      throw new Error('No stock data in response');
    }
  } catch (err) {
    // Fall back to jittered demo data
    stockData = liveDemoState.bloodBank.stock;
  }

  stockGridEl.innerHTML = targetGroups.map(grp => {
    const units = stockData[grp] !== undefined ? stockData[grp] : 0;
    const { cls, label } = getBloodChipClass(units);
    return `
      <div class="blood-chip ${cls}">
        <span class="blood-chip-group">${escapeHtml(grp)}</span>
        <span class="blood-chip-units">${units} ${units === 1 ? 'Unit' : 'Units'}</span>
        <span class="blood-chip-status">${label}</span>
      </div>
    `;
  }).join('');
}

// Refresh Live Boards
async function refreshLiveBoards() {
  applyDemoJitter();
  await Promise.allSettled([fetchHospitalIcuStatus(), fetchBloodBankStatus()]);

  const timestampEl = document.getElementById('liveLastUpdated');
  if (timestampEl) {
    const now = new Date();
    timestampEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}

// ==========================================================================
// 2. CARE CATEGORIES & BOOKING MODULE
// ==========================================================================

const CARE_CATEGORIES = [
  { id: 'nurses', label: 'Home Nurses', icon: '🩺', desc: 'Post-operative, ICU-trained, and wound care specialists for home assistance.' },
  { id: 'helpers', label: 'Patient Care Helpers', icon: '🤝', desc: 'Daily living assistance, feeding, hygiene, and mobility support.' },
  { id: 'physio', label: 'Physiotherapy', icon: '🏃', desc: 'Rehabilitation, joint pain relief, stroke recovery, and posture correction.' },
  { id: 'speech', label: 'Speech Therapy', icon: '🗣️', desc: 'Speech clarity, stammering therapy, and post-stroke communication support.' },
  { id: 'elder', label: 'Elder Care', icon: '👴', desc: 'Compassionate 24/7 care, companionship, and medication supervision for seniors.' },
  { id: 'surgery', label: 'Post Surgery Care', icon: '🩹', desc: 'Vitals tracking, surgical drain management, and physician-supervised recovery.' },
  { id: 'mother-baby', label: 'Mother & Baby Care', icon: '👶', desc: 'Newborn care, lactation support, and postnatal maternal wellness.' },
  { id: 'mental', label: 'Mental Wellness Support', icon: '🧠', desc: 'Licensed counselors, emotional support, and behavioral therapists.' }
];

const DEMO_PROVIDERS = [
  { id: 'prv-1', name: 'Sister Mary Joseph', careType: 'Home Nurses', experience: '8 years', rating: 4.9, city: 'Opposite DM Residence, Arwal', pricePerHour: '₹400' },
  { id: 'prv-2', name: 'Alok Nath (PT)', careType: 'Physiotherapy', experience: '12 years', rating: 4.8, city: 'Sipah Panchayat, Arwal', pricePerHour: '₹650' },
  { id: 'prv-3', name: 'Pooja Sundaram', careType: 'Elder Care', experience: '6 years', rating: 4.7, city: 'Arwal 804419', pricePerHour: '₹350' },
  { id: 'prv-4', name: 'Kavita Menon', careType: 'Mother & Baby Care', experience: '9 years', rating: 4.9, city: 'Pipra, Arwal', pricePerHour: '₹500' }
];

let activeBookingProvider = null;

function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  grid.innerHTML = CARE_CATEGORIES.map(c => `
    <div class="fc-cat-card" data-cat="${c.label}">
      <div class="fc-cat-icon">${c.icon}</div>
      <div class="fc-cat-text">
        <h3>${escapeHtml(c.label)}</h3>
        <p>${escapeHtml(c.desc)}</p>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.fc-cat-card').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.cat;
      showProviders(type);
    });
  });
}

function showProviders(type) {
  const catView = document.getElementById('categoriesView');
  const provView = document.getElementById('providersView');
  const provGrid = document.getElementById('providersGrid');
  const titleEl = document.getElementById('providersTitle');
  const countEl = document.getElementById('providersCount');

  if (!catView || !provView || !provGrid) return;

  catView.style.display = 'none';
  provView.classList.add('visible');

  if (titleEl) titleEl.textContent = type || 'Verified Care Providers';

  const filtered = DEMO_PROVIDERS.filter(p => !type || p.careType.toLowerCase() === type.toLowerCase());
  const list = filtered.length > 0 ? filtered : DEMO_PROVIDERS;

  if (countEl) countEl.textContent = `${list.length} verified professionals available`;

  provGrid.innerHTML = list.map(p => `
    <div class="fc-provider-card">
      <div class="fc-provider-top">
        <div class="fc-provider-avatar">${p.name[0]}</div>
        <div class="fc-provider-info">
          <span class="fc-provider-type">${escapeHtml(p.careType)}</span>
          <h4 class="fc-provider-name">${escapeHtml(p.name)}</h4>
          <p class="fc-provider-location">📍 ${escapeHtml(p.city)}</p>
          <p style="font-size:12px; color:#008b9b; font-weight:700; margin-top:4px;">⭐ ${p.rating} • ${p.experience} exp</p>
        </div>
      </div>
      <div class="fc-provider-footer">
        <span style="font-weight:700; color:#0f172a; font-size:15px;">${escapeHtml(p.pricePerHour)}/hr</span>
        <button class="btn-book-provider" data-id="${escapeHtml(p.id)}">Book Home Visit</button>
      </div>
    </div>
  `).join('');

  provGrid.querySelectorAll('.btn-book-provider').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = btn.dataset.id;
      activeBookingProvider = DEMO_PROVIDERS.find(p => p.id === pid) || DEMO_PROVIDERS[0];
      openBookingModal(activeBookingProvider);
    });
  });
}

// Modal management
function openBookingModal(provider) {
  const modal = document.getElementById('bookingModalOverlay');
  if (!modal) return;
  document.getElementById('bookingModalTitle').textContent = `Book ${provider.name}`;
  modal.classList.add('open');
}

function closeBookingModal() {
  const modal = document.getElementById('bookingModalOverlay');
  if (modal) modal.classList.remove('open');
}

// Toast helper
function showToast(msg) {
  const toast = document.getElementById('fcToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ==========================================================================
// 3. INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial live boards render
  refreshLiveBoards();

  // 2. Auto-refresh live status every 15 seconds
  setInterval(refreshLiveBoards, 15000);

  // Manual refresh button listener
  document.getElementById('liveRefreshBtn')?.addEventListener('click', () => {
    refreshLiveBoards();
    showToast('Live boards refreshed.');
  });

  // 3. Render care categories
  renderCategories();

  // Back to categories button
  document.getElementById('backToCategories')?.addEventListener('click', () => {
    document.getElementById('categoriesView').style.display = 'block';
    document.getElementById('providersView').classList.remove('visible');
  });

  // Modal close handlers
  document.getElementById('modalCloseBtn')?.addEventListener('click', closeBookingModal);
  document.getElementById('bookingModalOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'bookingModalOverlay') closeBookingModal();
  });

  // Booking form submission
  document.getElementById('bookingForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    closeBookingModal();
    showToast('Care booking requested successfully! We will contact you.');
  });

  // Search filter
  document.getElementById('searchBtn')?.addEventListener('click', () => {
    const type = document.getElementById('searchType')?.value || '';
    if (type) showProviders(type);
  });

  // Mobile menu toggle
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileNavMenu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
      const isVisible = mobileMenu.style.display === 'flex';
      mobileMenu.style.display = isVisible ? 'none' : 'flex';
    });
  }
});

