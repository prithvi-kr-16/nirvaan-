(() => {
  const draft = { account: {}, role: '', profile: {} };
  let resetOtp = '';
  let lastTrigger = null;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[6-9]\d{9}$/;

  const normalizePhone = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(0, 10);
  };
  const validPhone = (value) => phonePattern.test(normalizePhone(value));
  const setStatus = (id, message = '', type = '') => {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = message;
    element.className = type ? 'auth-status is-' + type : 'auth-status';
  };

  // Replace these methods with Node/Express API calls. No credentials or health data are persisted in the browser.
  const API_BASE = 'http://localhost:3000/api';

  const authApi = {
    login: async (credentials) => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }
      return data;
    },
    register: async (userData) => {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }
      return data;
    },
    resetPassword: async (resetData) => {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed.');
      }
      return data;
    }
  };

  const modalMarkup = [
    '<div class="auth-modal" id="authModal" hidden aria-hidden="true">',
    '<div class="auth-modal-backdrop" data-auth-close></div>',
    '<section class="auth-modal-panel" role="dialog" aria-modal="true" aria-labelledby="authModalHeading">',
    '<button class="auth-modal-close" type="button" aria-label="Close authentication" data-auth-close>&times;</button>',
    '<div class="auth-stepper" id="authStepper" hidden><span data-step="account">Account</span><span data-step="role">Role</span><span data-step="profile">Profile</span><span data-step="complete">Complete</span></div>',
    '<div class="auth-modal-content">',
    '<section data-auth-view="login"><div class="auth-page-header"><h1>Login</h1><p>Login with your practice account</p></div>',
    '<form id="modalLoginForm" class="auth-page-form" novalidate>',
    '<div class="form-field"><span class="input-icon">👤</span><input id="loginIdentifier" type="text" placeholder="Username or +91 Phone" required /></div>',
    '<button id="loginSendOtpBtn" type="button" class="auth-btn-secondary">Send OTP</button>',
    '<div class="form-field" id="loginOtpField" style="display:none;"><span class="input-icon">🔒</span><input id="loginOtpVal" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit OTP" /></div>',
    '<p id="loginStatus" class="auth-status" role="status" aria-live="polite"></p><button class="auth-btn-solid" type="submit">LOGIN</button></form>',
    '<p class="auth-page-switch">Don&apos;t have an account? <button type="button" class="auth-switch-button" data-auth-switch="signup">Sign up</button></p></section>',
    '<section data-auth-view="signup" hidden><div class="auth-page-header"><h1>Sign Up</h1><p>Create your practice account</p></div>',
    '<form id="modalSignupForm" class="auth-page-form" novalidate>',
    '<div class="form-field"><span class="input-icon">👤</span><input id="signupName" type="text" placeholder="Username" required /></div>',
    '<div class="form-field"><span class="input-icon">📞</span><input id="signupMobile" type="tel" placeholder="+91 Phone Number" required /></div>',
    '<button id="signupSendOtpBtn" type="button" class="auth-btn-secondary">Send OTP</button>',
    '<div class="form-field" id="signupOtpField" style="display:none;"><span class="input-icon">🔒</span><input id="signupOtpVal" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit OTP" /></div>',
    '<p id="signupStatus" class="auth-status" role="status" aria-live="polite"></p><button class="auth-btn-solid" type="submit">CREATE ACCOUNT</button></form>',
    '<p class="auth-page-switch">Already have an account? <button type="button" class="auth-switch-button" data-auth-switch="login">Login</button></p>',
    '<p class="auth-page-switch" style="margin-top: 6px;"><button type="button" class="auth-switch-button" data-auth-switch="role" style="color: #64748b; text-decoration: none;">Register as Professional</button></p></section>',
    '<section data-auth-view="role" hidden><div class="auth-page-header"><h1>Select Account Type</h1><p>Register as a service provider</p></div>',
    '<div class="auth-role-grid"><button type="button" class="auth-role-card" data-role="hospital"><strong>Hospital</strong><span>NIRVAAN facilities listings.</span></button><button type="button" class="auth-role-card" data-role="blood-bank"><strong>Blood Bank</strong><span>Donation bank listings.</span></button></div>',
    '<p id="roleStatus" class="auth-status" role="status" aria-live="polite"></p><button type="button" class="auth-text-button auth-back-button" data-auth-switch="signup">Back to patient signup</button></section>',
    '<section data-auth-view="profile" hidden><div class="auth-page-header"><h1 id="profileHeading">Complete profile</h1><p id="profileSubtitle">Provide registration details.</p></div><div id="profileFormHost"></div></section>',
    '<section data-auth-view="complete" hidden><div class="auth-complete"><span class="auth-complete-mark">Done</span><h1 id="completeHeading">Account verified!</h1><p id="completeMessage">You can now use NIRVAAN.</p><button type="button" class="auth-btn-solid" data-auth-close>Continue</button></div></section>',
    '</div></section></div>'
  ].join('');

  const profileFields = {
    patient: [['Full Name', 'name', 'text', true], ['Date of Birth', 'dob', 'date', true], ['Gender', 'gender', 'select:Female|Male|Non-binary|Prefer not to say', true], ['Mobile Number', 'mobile', 'tel', true], ['Email', 'email', 'email', true], ['Blood Group', 'bloodGroup', 'select:A+|A-|B+|B-|AB+|AB-|O+|O-|Unknown', false], ['Address', 'address', 'textarea', false], ['City', 'city', 'text', true], ['State', 'state', 'text', true], ['Emergency Contact', 'emergencyContact', 'tel', false], ['Profile Photo', 'photo', 'file', false]],
    hospital: [['Hospital Name', 'hospitalName', 'text', true], ['Hospital Type', 'hospitalType', 'select:Government|Private|Trust/NGO', true], ['Registration Number', 'registrationNumber', 'text', true], ['Contact Person', 'contactPerson', 'text', true], ['Phone Number', 'mobile', 'tel', true], ['Email', 'email', 'email', true], ['Complete Address', 'address', 'textarea', true], ['City', 'city', 'text', true], ['State', 'state', 'text', true], ['PIN Code', 'pinCode', 'text', true], ['Emergency Services Available', 'emergency', 'select:Yes|No', true], ['Ambulance Available', 'ambulance', 'select:Yes|No', true], ['ICU Available', 'icu', 'select:Yes|No', true], ['Departments', 'departments', 'text', true], ['Available Facilities', 'facilities', 'text', false], ['Hospital Timings', 'timings', 'text', true], ['Website', 'website', 'url', false], ['Hospital Photos', 'photos', 'file', false]],
    'blood-bank': [['Blood Bank Name', 'bloodBankName', 'text', true], ['Registration / License Number', 'licenseNumber', 'text', true], ['Contact Person', 'contactPerson', 'text', true], ['Phone Number', 'mobile', 'tel', true], ['Email', 'email', 'email', true], ['Complete Address', 'address', 'textarea', true], ['City', 'city', 'text', true], ['State', 'state', 'text', true], ['PIN Code', 'pinCode', 'text', true], ['Operating Hours', 'hours', 'text', true], ['Available Blood Groups', 'bloodGroups', 'text', true], ['Blood Component Availability', 'components', 'text', false], ['Emergency Contact', 'emergencyContact', 'tel', true], ['License / Certificate', 'certificate', 'file', false]]
  };

  const mount = () => document.body.insertAdjacentHTML('beforeend', modalMarkup);
  const modal = () => document.getElementById('authModal');
  const resetDraft = () => { draft.account = {}; draft.role = ''; draft.profile = {}; resetOtp = ''; };
  const updateSteps = (view) => {
    const map = { signup: 1, role: 2, profile: 3, complete: 4 };
    const current = map[view] || 0;
    document.getElementById('authStepper').hidden = !current || view === 'signup' || view === 'login';
    document.querySelectorAll('[data-step]').forEach((step, index) => step.classList.toggle('active', index < current));
  };
  const showView = (view) => {
    modal().querySelectorAll('[data-auth-view]').forEach((item) => { item.hidden = item.dataset.authView !== view; });
    modal().classList.toggle('auth-modal--wide', view === 'role' || view === 'profile');
    updateSteps(view);
    if (view === 'profile') renderProfile();
  };
  const openModal = (view, trigger) => {
    lastTrigger = trigger || null;
    resetDraft();
    modal().hidden = false;
    modal().setAttribute('aria-hidden', 'false');
    document.body.classList.add('auth-modal-open');
    showView(view);
    window.setTimeout(() => modal().querySelector('[data-auth-view="' + view + '"] input, [data-auth-view="' + view + '"] button')?.focus(), 0);
  };
  const closeModal = () => {
    modal().classList.add('is-closing');
    window.setTimeout(() => {
      modal().hidden = true;
      modal().classList.remove('is-closing');
      modal().setAttribute('aria-hidden', 'true');
      document.body.classList.remove('auth-modal-open');
      lastTrigger?.focus();
    }, 180);
  };
  const passwordScore = (value) => [value.length >= 8, /[A-Z]/.test(value), /[a-z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
  const passwordValid = (value) => passwordScore(value) >= 4;

  const renderProfile = () => {
    const fields = profileFields[draft.role];
    const label = draft.role === 'blood-bank' ? 'Blood Bank' : draft.role[0].toUpperCase() + draft.role.slice(1);
    document.getElementById('profileHeading').textContent = label + ' profile';
    document.getElementById('profileSubtitle').textContent = draft.role === 'patient' ? 'Complete your patient profile. Medical records are collected separately.' : label + ' accounts require verification before public listing.';
    const valueFor = (key) => draft.profile[key] || (key === 'name' ? draft.account.name : key === 'email' ? draft.account.email : key === 'mobile' ? draft.account.mobile : '');
    const fieldHtml = ([labelText, key, type, required]) => {
      const requiredAttr = required ? ' required' : '';
      if (type === 'textarea') return '<div class="form-field"><label for="profile-' + key + '">' + labelText + '</label><textarea id="profile-' + key + '" name="' + key + '"' + requiredAttr + '>' + valueFor(key) + '</textarea></div>';
      if (type === 'file') return '<div class="form-field"><label for="profile-' + key + '">' + labelText + '</label><input id="profile-' + key + '" name="' + key + '" type="file" accept="image/*,.pdf"' + requiredAttr + ' /></div>';
      if (type.startsWith('select:')) return '<div class="form-field"><label for="profile-' + key + '">' + labelText + '</label><select id="profile-' + key + '" name="' + key + '"' + requiredAttr + '><option value="">Select</option>' + type.slice(7).split('|').map((option) => '<option' + (valueFor(key) === option ? ' selected' : '') + '>' + option + '</option>').join('') + '</select></div>';
      return '<div class="form-field"><label for="profile-' + key + '">' + labelText + '</label><input id="profile-' + key + '" name="' + key + '" type="' + type + '"' + (type === 'tel' ? ' inputmode="numeric" data-indian-phone' : '') + ' value="' + valueFor(key) + '"' + requiredAttr + ' /></div>';
    };
    document.getElementById('profileFormHost').innerHTML = '<form id="profileForm" class="auth-page-form" novalidate><div class="profile-form-grid">' + fields.map(fieldHtml).join('') + '</div><p id="profileStatus" class="auth-status" role="status" aria-live="polite"></p><div class="auth-flow-actions"><button type="button" class="auth-btn-secondary" data-auth-switch="role">Back</button><button type="submit" class="auth-btn-solid">Create Account</button></div></form>';
    document.getElementById('profileForm').addEventListener('submit', submitProfile);
    document.querySelectorAll('#profileForm [data-indian-phone]').forEach((input) => input.addEventListener('input', () => { input.value = normalizePhone(input.value); }));
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const phoneInput = form.querySelector('[data-indian-phone]');
    if (phoneInput) {
      phoneInput.value = normalizePhone(phoneInput.value);
      phoneInput.setCustomValidity(validPhone(phoneInput.value) ? '' : 'Enter a valid 10-digit Indian mobile number.');
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    form.querySelectorAll('input, select, textarea').forEach((input) => {
      if (input.type !== 'file') draft.profile[input.name] = input.value.trim();
    });
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = 'Creating account...';
    setStatus('profileStatus', 'Creating account securely...', 'success');
    try {
      await authApi.register({ account: draft.account, role: draft.role, profile: draft.profile });
      
      // Auto-login registered user
      sessionStorage.setItem('user', JSON.stringify({
        name: draft.account.name,
        email: draft.account.email,
        role: draft.role,
        mobile: draft.account.mobile
      }));
      
      document.getElementById('completeHeading').textContent = draft.role === 'patient' ? 'Account created successfully!' : 'Registration submitted!';
      document.getElementById('completeMessage').textContent = draft.role === 'patient' ? 'Your patient account is ready.' : 'Verification Pending. An administrator will review your ' + draft.role.replace('-', ' ') + ' account.';
      
      updateAuthNavbar();
      showView('complete');
    } catch (err) {
      setStatus('profileStatus', err.message, 'error');
      button.disabled = false;
      button.textContent = 'Create Account';
    }
  };

  const updateAuthNavbar = () => {
    const userStr = sessionStorage.getItem('user');
    const authContainers = document.querySelectorAll('.auth-buttons');
    const mobileAuthContainers = document.querySelectorAll('.mobile-auth-buttons');

    if (userStr) {
      const user = JSON.parse(userStr);
      authContainers.forEach(container => {
        container.innerHTML = `
          <span class="user-greeting" style="font-weight: 500; font-size: 14px; margin-right: 12px; color: var(--text-dark);">Hi, ${user.name}</span>
          <a class="btn-outline" href="./dashboard.html" style="margin-right: 8px;">Dashboard</a>
          <button class="btn-solid logout-trigger" style="cursor: pointer; padding: 10px 18px; border-radius: 6px; font-weight: 600;">Logout</button>
        `;
      });
      mobileAuthContainers.forEach(container => {
        container.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <span class="user-greeting" style="font-weight: 600; font-size: 14px; color: var(--text-dark); text-align: center;">Hi, ${user.name}</span>
            <a class="btn-outline w-full" href="./dashboard.html" style="text-align: center;">My Dashboard</a>
            <button class="btn-solid w-full logout-trigger" style="cursor: pointer; padding: 10px; border-radius: 6px; font-weight: 600; text-align: center;">Logout</button>
          </div>
        `;
      });
    } else {
      authContainers.forEach(container => {
        container.innerHTML = `
          <a class="btn-outline" href="./login.html">Login</a>
          <a class="btn-solid" href="./signup.html">Sign Up</a>
        `;
      });
      mobileAuthContainers.forEach(container => {
        container.innerHTML = `
          <a class="btn-outline w-full" href="./login.html">Login</a>
          <a class="btn-solid w-full" href="./signup.html">Sign Up</a>
        `;
      });
    }

    // Attach logout event listeners
    document.querySelectorAll('.logout-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('user');
        updateAuthNavbar();
        alert('You have logged out successfully.');
        window.location.href = './index.html';
      });
    });
  };

  const bind = () => {
    document.addEventListener('click', (event) => {
      const loginLink = event.target.closest('a[href="./login.html"]');
      const signupLink = event.target.closest('a[href="./signup.html"]');
      
      if (loginLink) {
        event.preventDefault();
        openModal('login', loginLink);
        return;
      }
      if (signupLink) {
        event.preventDefault();
        openModal('signup', signupLink);
        return;
      }

      const close = event.target.closest('[data-auth-close]');
      if (close) closeModal();
      const switcher = event.target.closest('[data-auth-switch]');
      if (switcher) showView(switcher.dataset.authSwitch);
      const roleCard = event.target.closest('[data-role]');
      if (roleCard) { draft.role = roleCard.dataset.role; showView('profile'); }
    });

    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal().hidden) closeModal(); });

    // Send OTP handler in Login
    document.getElementById('loginSendOtpBtn').addEventListener('click', () => {
      const identifier = document.getElementById('loginIdentifier').value.trim();
      const mobile = normalizePhone(identifier);
      if (!validPhone(mobile) && identifier.length < 2) {
        setStatus('loginStatus', 'Enter a valid name or 10-digit mobile number.', 'error');
        return;
      }
      resetOtp = String(Math.floor(100000 + Math.random() * 900000));
      document.getElementById('loginOtpField').style.display = 'block';
      setStatus('loginStatus', 'Practice OTP: ' + resetOtp, 'success');
    });

    // Send OTP handler in Signup
    document.getElementById('signupSendOtpBtn').addEventListener('click', () => {
      const name = document.getElementById('signupName').value.trim();
      const mobile = normalizePhone(document.getElementById('signupMobile').value);
      if (name.length < 2) { setStatus('signupStatus', 'Enter a name (at least 2 characters).', 'error'); return; }
      if (!validPhone(mobile)) { setStatus('signupStatus', 'Enter a valid 10-digit Indian mobile number.', 'error'); return; }
      
      resetOtp = String(Math.floor(100000 + Math.random() * 900000));
      document.getElementById('signupOtpField').style.display = 'block';
      setStatus('signupStatus', 'Practice OTP: ' + resetOtp, 'success');
    });
    
    // Login Submit
    document.getElementById('modalLoginForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const identifier = document.getElementById('loginIdentifier').value.trim();
      const enteredOtp = document.getElementById('loginOtpVal').value.trim();

      if (!identifier) { setStatus('loginStatus', 'Please enter your username or mobile number.', 'error'); return; }
      if (!resetOtp || enteredOtp !== resetOtp) { setStatus('loginStatus', 'Verification failed. Input the correct OTP.', 'error'); return; }

      setStatus('loginStatus', 'Signing in securely...', 'success');
      try {
        const data = await authApi.login({ identifier, password: 'OTP_VERIFIED' });
        setStatus('loginStatus', 'Login successful! Welcome to NIRVAAN.', 'success');
        sessionStorage.setItem('user', JSON.stringify(data.user));
        updateAuthNavbar();
        window.setTimeout(() => closeModal(), 1000);
      } catch (err) {
        setStatus('loginStatus', err.message, 'error');
      }
    });
    
    // Signup Submit
    document.getElementById('modalSignupForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const mobile = normalizePhone(document.getElementById('signupMobile').value);
      const enteredOtp = document.getElementById('signupOtpVal').value.trim();

      if (name.length < 2 || !validPhone(mobile)) {
        setStatus('signupStatus', 'Please enter a valid name and 10-digit mobile number.', 'error');
        return;
      }
      if (!resetOtp || enteredOtp !== resetOtp) {
        setStatus('signupStatus', 'Verification failed. Input the correct OTP.', 'error');
        return;
      }

      setStatus('signupStatus', 'Registering practice account...', 'success');
      try {
        const dummyUser = {
          account: {
            name: name,
            email: mobile + '@NIRVAAN.org',
            mobile: mobile,
            password: 'OTP_VERIFIED'
          },
          role: 'patient',
          profile: {
            name: name,
            mobile: mobile,
            email: mobile + '@NIRVAAN.org',
            city: 'Metro City',
            state: 'Metro State'
          }
        };

        await authApi.register(dummyUser);

        sessionStorage.setItem('user', JSON.stringify({
          name: name,
          email: mobile + '@NIRVAAN.org',
          role: 'patient',
          mobile: mobile
        }));

        setStatus('signupStatus', 'Sign up verified!', 'success');
        updateAuthNavbar();
        
        document.getElementById('completeHeading').textContent = 'Account created successfully!';
        document.getElementById('completeMessage').textContent = 'Your patient practice account is verified and ready.';
        showView('complete');
      } catch (err) {
        setStatus('signupStatus', err.message, 'error');
      }
    });

    document.getElementById('signupMobile').addEventListener('input', (event) => { event.target.value = normalizePhone(event.target.value); });
  };

  function highlightActiveNav() {
    const getFileName = (path) => {
      if (!path) return '';
      const clean = path.split('?')[0].split('#')[0].replace(/\\/g, '/');
      const parts = clean.split('/').filter(Boolean);
      const last = (parts[parts.length - 1] || '').toLowerCase();
      if (!last || last === 'frontend' || !last.includes('.html')) {
        return 'index.html';
      }
      return last;
    };

    const current = getFileName(window.location.pathname);
    const links = document.querySelectorAll('.desktop-nav .nav-link, .mobile-nav-links .mobile-nav-link');
    if (!links.length) return;

    let hasMatch = false;
    links.forEach(link => {
      const target = getFileName(link.getAttribute('href'));
      if (target && target === current) {
        link.classList.add('active');
        hasMatch = true;
      } else {
        link.classList.remove('active');
      }
    });

    if (!hasMatch && current === 'live-status.html') {
      links.forEach(link => {
        if (getFileName(link.getAttribute('href')) === 'find-care.html') {
          link.classList.add('active');
        }
      });
    }
  }

  mount();
  bind();
  
  // Initialize navbar and active page indicator on load
  updateAuthNavbar();
  highlightActiveNav();
  
  // Expose global methods
  window.updateAuthNavbar = updateAuthNavbar;
  window.highlightActiveNav = highlightActiveNav;
  window.getLoggedInUser = () => {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };
})();
