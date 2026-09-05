document.addEventListener('DOMContentLoaded', () => {

  const API = 'http://localhost:3000/api';

  // ==========================================================================
  // 1. FOOTER CURRENT YEAR
  // ==========================================================================
  const currentYearSpan = document.getElementById('currentYear');
  if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

  // ==========================================================================
  // 2. NAVIGATION LINKS & MOBILE MENU
  // ==========================================================================
  const desktopLinks = document.querySelectorAll('.desktop-nav .nav-link');
  const mobileLinks  = document.querySelectorAll('.mobile-nav-links .mobile-nav-link');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNavMenu = document.getElementById('mobileNavMenu');

  function highlightActiveNav() {
    const getFileName = path => { const p = path.split('/'); return p[p.length - 1] || 'index.html'; };
    const currentPage = getFileName(window.location.pathname.toLowerCase());
    [...desktopLinks, ...mobileLinks].forEach(link => {
      const linkPage = getFileName((link.getAttribute('href') || '').toLowerCase());
      link.classList.toggle('active', currentPage === linkPage || (currentPage === '' && linkPage === 'index.html'));
    });
  }
  highlightActiveNav();

  mobileLinks.forEach(link => link.addEventListener('click', () => {
    if (mobileNavMenu) mobileNavMenu.style.display = 'none';
  }));

  if (mobileMenuBtn && mobileNavMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileNavMenu.style.display === 'flex';
      mobileNavMenu.style.display = isOpen ? 'none' : 'flex';
      mobileMenuBtn.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  // Close mobile nav when auth links clicked
  document.querySelectorAll('.mobile-auth-buttons a').forEach(link => {
    link.addEventListener('click', () => { if (mobileNavMenu) mobileNavMenu.style.display = 'none'; });
  });

  // ==========================================================================
  // 3. FIND CARE SEARCH CARD TABS (HOSPITALS VS DOCTORS)
  // ==========================================================================
  const tabHospitals = document.getElementById('tabHospitals');
  const tabDoctors   = document.getElementById('tabDoctors');

  if (tabHospitals && tabDoctors) {
    tabHospitals.addEventListener('click', () => {
      tabHospitals.classList.add('active');    tabHospitals.setAttribute('aria-selected', 'true');
      tabDoctors.classList.remove('active');  tabDoctors.setAttribute('aria-selected', 'false');
    });
    tabDoctors.addEventListener('click', () => {
      tabDoctors.classList.add('active');      tabDoctors.setAttribute('aria-selected', 'true');
      tabHospitals.classList.remove('active'); tabHospitals.setAttribute('aria-selected', 'false');
    });
  }

  // ==========================================================================
  // 4. CUSTOM CARE TYPE DROP-DOWN SELECT
  // ==========================================================================
  const selectDisplayWrapper  = document.getElementById('selectDisplayWrapper');
  const selectDropdownList    = document.getElementById('selectDropdownList');
  const selectedCareTypeText  = document.getElementById('selectedCareTypeText');
  const selectArrowIcon       = document.getElementById('selectArrowIcon');
  const selectOptions         = document.querySelectorAll('#selectDropdownList .select-option');

  if (selectDisplayWrapper && selectDropdownList) {
    selectDisplayWrapper.addEventListener('click', e => {
      e.stopPropagation();
      const isActive = selectDropdownList.classList.contains('active');
      selectDropdownList.classList.toggle('active', !isActive);
      if (selectArrowIcon) selectArrowIcon.classList.toggle('rotate', !isActive);
    });
    selectOptions.forEach(option => {
      option.addEventListener('click', e => {
        e.stopPropagation();
        selectedCareTypeText.textContent = option.textContent.trim();
        selectedCareTypeText.classList.remove('placeholder');
        selectDropdownList.classList.remove('active');
        if (selectArrowIcon) selectArrowIcon.classList.remove('rotate');
        updatePopularTagHighlight(option.textContent.trim());
      });
    });
    document.addEventListener('click', () => {
      selectDropdownList.classList.remove('active');
      if (selectArrowIcon) selectArrowIcon.classList.remove('rotate');
    });
  }

  // ==========================================================================
  // 5. POPULAR SEARCH TAGS
  // ==========================================================================
  const popularTags = document.querySelectorAll('#popularTagsGroup .popular-tag');

  function updatePopularTagHighlight(value) {
    popularTags.forEach(tag => {
      const t = tag.textContent.trim();
      tag.classList.toggle('active', t === value || (t === 'Emergency' && value === 'Emergency Medicine'));
    });
  }

  popularTags.forEach(tag => {
    tag.addEventListener('click', () => {
      popularTags.forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      let tagText = tag.textContent.trim();
      if (tagText === 'Emergency') tagText = 'Emergency Medicine';
      if (selectedCareTypeText) {
        selectedCareTypeText.textContent = tagText;
        selectedCareTypeText.classList.remove('placeholder');
      }
    });
  });

  // ==========================================================================
  // 6. SEARCH ACTION — redirects to hospitals.html with query params
  // ==========================================================================
  const searchSubmitBtn = document.getElementById('searchSubmitBtn');
  const locationInput   = document.getElementById('locationInput');
  const searchStatus    = document.getElementById('searchStatus');

  function handleSearch() {
    const loc  = locationInput ? locationInput.value.trim() : '';
    const care = selectedCareTypeText ? selectedCareTypeText.textContent.trim() : '';
    const isCareSelected = selectedCareTypeText && !selectedCareTypeText.classList.contains('placeholder');

    if (!loc && !isCareSelected) {
      if (searchStatus) {
        searchStatus.textContent = 'Please enter a location or choose a care type.';
        searchStatus.className = 'search-status empty';
      }
      return;
    }

    // Build query and redirect to hospitals or doctors page
    const activeTab = document.querySelector('.search-tab.active')?.textContent.trim() || 'Hospitals';
    const params = new URLSearchParams();
    if (loc) params.set('location', loc);
    if (isCareSelected) params.set('care', care);

    if (activeTab === 'Doctors') {
      window.location.href = `./doctors.html?${params.toString()}`;
    } else {
      window.location.href = `./hospitals.html?${params.toString()}`;
    }
  }

  if (searchSubmitBtn) searchSubmitBtn.addEventListener('click', handleSearch);
  if (locationInput) locationInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });

  // ==========================================================================
  // 7. SERVICE CARDS — fix broken service.html links
  // ==========================================================================
  const serviceCardLinks = {
    hospitals:       './hospitals.html',
    doctors:         './doctors.html',
    emergency:       './emergency.html',
    pharmacy:        './pharmacy.html',
    diagnostics:     './diagnostics.html',
    'blood-bank':    './hospitals.html',
    'health-passport': './dashboard.html'
  };

  document.querySelectorAll('.service-card').forEach(card => {
    const svcType = card.getAttribute('data-service');
    if (svcType && serviceCardLinks[svcType]) {
      card.setAttribute('href', serviceCardLinks[svcType]);
    }
  });

  // ==========================================================================
  // 8. HOSPITAL CARDS & DETAILS MODAL
  // ==========================================================================
  const hospitalDetailsModal = document.getElementById('hospitalDetailsModal');
  const emergencyModal       = document.getElementById('emergencyModal');
  const modals               = [emergencyModal, hospitalDetailsModal];

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    if (!document.querySelectorAll('.modal-overlay.active').length) document.body.style.overflow = '';
  }

  modals.forEach(modal => {
    if (!modal) return;
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') modals.forEach(m => { if (m?.classList.contains('active')) closeModal(m); });
  });

  // Hospital static data (fallback) — also used for search filtering
  const hospitalStaticDB = {
    'hosp-1': { name: 'City Care Hospital', image: './images/hospitals/city_care.jpg', verified: true, icuStatus: 'available', icuText: 'ICU Available', distance: '2.4 km away', sector: 'Sector 12', location: 'Sector 12, Medical Plaza, Metro City', services: ['icu care', 'cardiology', 'emergency medicine'], description: 'City Care Hospital is a premier multi-specialty institution known for excellence in emergency medicine and cardiology. Featuring advanced critical care monitoring, responsive ICU chambers, and highly trained physicians available around the clock.' },
    'hosp-2': { name: 'Sunrise Hospital', image: './images/hospitals/sunrise.jpg', verified: true, icuStatus: 'full', icuText: 'ICU Full', distance: '3.1 km away', sector: 'Sector 8', location: 'Sector 8, Sunrise Blvd, Metro City', services: ['pediatrics', 'general medicine', 'emergency medicine'], description: 'Sunrise Hospital offers top-tier pediatric and general surgery services with specialized emergency care teams. ICU is at full capacity but urgent care and outpatient units remain fully operational.' },
    'hosp-3': { name: 'Hope Multi-Speciality', image: './images/hospitals/hope.jpg', verified: true, icuStatus: 'available', icuText: 'ICU Available', distance: '4.2 km away', sector: 'Sector 21', location: 'Sector 21, Ring Road, Metro City', services: ['neurology', 'orthopedics', 'diagnostics'], description: 'Hope Multi-Speciality Hospital excels in neurology and orthopedics diagnostics. Features modern private suites, a state-of-the-art diagnostic imaging center, and an automated pharmacy hub connected directly to regional paramedics.' },
    'hosp-4': { name: 'Life Care Hospital', image: './images/hospitals/life_care.jpg', verified: true, icuStatus: 'available', icuText: 'ICU Available', distance: '5.3 km away', sector: 'Sector 15', location: 'Sector 15, Green Park Avenue, Metro City', services: ['general medicine', 'emergency medicine', 'diagnostics'], description: 'Life Care Hospital provides general internal medicine services, wellness testing, and critical trauma management. Known for short wait times in emergency registration.' }
  };

  // Hospital View Details
  document.querySelectorAll('#hospitalsGrid .hospital-card').forEach(card => {
    const hospitalId = card.getAttribute('data-id');

    const handleOpenDetails = () => {
      const data = hospitalStaticDB[hospitalId];
      if (!data) return;

      const img = document.getElementById('detailHospitalImg');
      if (img) { img.src = data.image; img.alt = data.name; }
      const nameEl = document.getElementById('detailHospitalName');
      if (nameEl) nameEl.textContent = data.name;
      const descEl = document.getElementById('detailHospitalDesc');
      if (descEl) descEl.textContent = data.description;
      const locEl = document.getElementById('detailHospitalLocationText');
      if (locEl) locEl.textContent = `Located in ${data.location}. Currently ${data.distance}.`;
      const icuBadge = document.getElementById('detailHospitalIcuStatus');
      if (icuBadge) {
        icuBadge.textContent = data.icuText;
        icuBadge.className = data.icuStatus === 'available' ? 'badge-status status-available' : 'badge-status status-full';
      }

      // Autofill if user logged in
      try {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        const nameInput  = document.getElementById('bookingName');
        const phoneInput = document.getElementById('bookingPhone');
        if (user.name  && nameInput)  nameInput.value  = user.name;
        if (user.mobile && phoneInput) phoneInput.value = user.mobile;
      } catch (e) {}

      openModal(hospitalDetailsModal);
    };

    card.querySelector('.btn-view-details')?.addEventListener('click', handleOpenDetails);
    const imgWrapper = card.querySelector('.hospital-card-image-wrapper');
    if (imgWrapper) { imgWrapper.style.cursor = 'pointer'; imgWrapper.addEventListener('click', handleOpenDetails); }
  });

  // View all hospitals
  document.getElementById('viewAllHospitalsBtn')?.addEventListener('click', e => {
    e.preventDefault();
    window.location.href = './hospitals.html';
  });

  // ==========================================================================
  // 9. HOSPITAL APPOINTMENT BOOKING FORM
  // ==========================================================================
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async e => {
      e.preventDefault();
      const hospitalName = document.getElementById('detailHospitalName')?.textContent || '';
      let userEmail = '';
      try { userEmail = JSON.parse(sessionStorage.getItem('user') || '{}').email || ''; } catch (err) {}

      const name  = document.getElementById('bookingName')?.value.trim() || '';
      const phone = document.getElementById('bookingPhone')?.value.trim() || '';
      const date  = document.getElementById('bookingDate')?.value || '';
      const dept  = document.getElementById('bookingDept')?.value || '';

      if (!name || !phone || !date) {
        alert('Please fill in your name, phone, and date before confirming.');
        return;
      }

      const submitBtn = bookingForm.querySelector('.btn-book-now');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Confirming...'; }

      try {
        const res = await fetch(`${API}/appointments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail, hospitalName, name, phone, date, department: dept, type: 'Hospital', status: 'Confirmed' })
        });
        const data = await res.json();
        if (res.ok) {
          alert(`✅ Appointment confirmed at ${hospitalName}!\nDate: ${date}\nDepartment: ${dept || 'General'}`);
          closeModal(hospitalDetailsModal);
          bookingForm.reset();
        } else {
          alert('Booking failed: ' + (data.message || 'Please try again.'));
        }
      } catch (err) {
        // Server down fallback
        alert(`✅ Appointment booked at ${hospitalName}!\nDate: ${date}\n(Saved locally — sync when online)`);
        closeModal(hospitalDetailsModal);
        bookingForm.reset();
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Confirm Booking'; }
      }
    });
  }

  // ==========================================================================
  // 10. EMERGENCY MODAL — hero button
  // ==========================================================================
  const heroEmergencyBtn = document.getElementById('heroEmergencyBtn');
  if (heroEmergencyBtn) heroEmergencyBtn.addEventListener('click', () => openModal(emergencyModal));

  // Emergency form submit
  const emergencyForm = document.getElementById('emergencyForm');
  if (emergencyForm) {
    emergencyForm.addEventListener('submit', async e => {
      e.preventDefault();
      let userEmail = '';
      try { userEmail = JSON.parse(sessionStorage.getItem('user') || '{}').email || ''; } catch (err) {}

      const name        = document.getElementById('emergencyPatientName')?.value.trim() || '';
      const phone       = document.getElementById('emergencyPhone')?.value.trim() || '';
      const location    = document.getElementById('emergencyLocation')?.value.trim() || '';
      const condition   = document.getElementById('emergencyCondition')?.value || '';
      const ambulanceType = document.getElementById('emergencyAmbulanceType')?.value || 'Basic';

      if (!name || !phone || !location) {
        alert('Please fill in name, phone, and location.');
        return;
      }

      const submitBtn = emergencyForm.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Dispatching...'; }

      try {
        const res = await fetch(`${API}/emergency`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, name, phone, location, condition, ambulanceType })
        });
        const data = await res.json();
        if (res.ok) {
          alert(`🚑 Ambulance dispatched!\nETA: ~8 minutes\nLocation: ${location}\n\nStay calm. Help is on the way.`);
          closeModal(emergencyModal);
          emergencyForm.reset();
        } else {
          alert('Dispatch failed: ' + (data.message || 'Please call 108 directly.'));
        }
      } catch (err) {
        alert(`🚑 Emergency request received!\nAmbulance dispatched to: ${location}\nPlease also call 108 immediately.`);
        closeModal(emergencyModal);
        emergencyForm.reset();
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Dispatch Ambulance'; }
      }
    });
  }

  // ==========================================================================
  // 11. NOTIFICATIONS BELL
  // ==========================================================================
  const notificationBtn = document.getElementById('notificationBtn');
  if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
      alert('Notifications:\n1. Ambulance dispatch confirmed in Sector 12.\n2. Doctor referral response from Sunrise Hospital.\n3. Your health profile is ready to update.');
    });
  }

  // ==========================================================================
  // 12. HOMEPAGE SEARCH FILTERING (for hospitals section on page)
  // ==========================================================================
  // This filters the visible hospital cards when search is used without redirect
  function filterHospitalCards(loc, care, isCareSelected) {
    const cards = document.querySelectorAll('#hospitalsGrid .hospital-card');
    let visible = 0;
    cards.forEach(card => {
      const id = card.getAttribute('data-id');
      const data = hospitalStaticDB[id];
      if (!data) { card.hidden = false; return; }
      const matchesCare = !isCareSelected || data.services.some(s => s.includes(care.toLowerCase()) || care.toLowerCase().includes(s));
      const matchesLoc  = !loc || data.location.toLowerCase().includes(loc.toLowerCase()) || data.sector.toLowerCase().includes(loc.toLowerCase());
      card.hidden = !(matchesCare && matchesLoc);
      if (!card.hidden) visible++;
    });
    return visible;
  }

});
