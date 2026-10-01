// ===== SHARED COMPONENTS =====

function renderTopbar(title, subtitle) {
  const user = Auth.currentUser;
  return `
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:12px">
        <button class="sidebar-toggle" onclick="toggleSidebar()"><i class="fa-solid fa-bars"></i></button>
        <div class="topbar-title">
          <h2>${title}</h2>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
        </div>
      </div>
      <div class="topbar-right">
        <span class="topbar-time" id="topbar-clock"></span>
        <div style="display:flex;align-items:center;gap:8px">
          ${avatarHtml(user, 34)}
          <span style="font-size:.85rem;font-weight:600;color:var(--gray-700)">${user.name.split(' ').pop()}</span>
        </div>
        <button class="btn btn-ghost btn-sm btn-icon" title="Đăng xuất" onclick="App.logout()">
          <i class="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    </div>
  `;
}

function renderSidebar(navItems, activeKey) {
  const user = Auth.currentUser;
  const roleLabel = { student: '👨‍🎓 Học viên', admin: '👨‍💻 Admin' }[user.role] || user.role;
  const navHtml = navItems.map(item => {
    if (item.divider) return `<div class="sidebar-section">${item.label}</div>`;
    return `
      <div class="nav-item ${item.key === activeKey ? 'active' : ''}" onclick="App.navigate('${item.key}')">
        <i class="fa-solid fa-${item.icon}"></i>
        <span>${item.label}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span class="logo-icon">🎓</span>
          <div class="sidebar-logo-text">
            <h2>ATTENDANCE</h2>
            <p>Hệ Thống Điểm Danh</p>
          </div>
        </div>
      </div>
      <div class="sidebar-user flex items-center">
        ${avatarHtml(user, 40)}
        <div class="sidebar-user-info">
          <strong>${user.name}</strong>
          <span>${roleLabel}</span>
        </div>
      </div>
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-footer">
        <button class="btn btn-ghost btn-sm btn-block" style="color:rgba(255,255,255,.5)" onclick="App.logout()">
          <i class="fa-solid fa-right-from-bracket"></i> Đăng xuất
        </button>
      </div>
    </div>
    <div class="sidebar-overlay" id="sidebar-overlay" onclick="toggleSidebar()"></div>
  `;
}

function renderLoginPage() {
  return `
    <div id="page-login">
      <div class="login-card">
        <div class="login-logo">
          <span class="logo-icon">🎓</span>
          <h1>ATTENDANCE</h1>
          <p>Hệ Thống Điểm Danh Online</p>
        </div>
        <form id="login-form" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label">Gmail</label>
            <div class="input-group">
              <i class="fa-solid fa-envelope input-icon"></i>
              <input type="email" id="login-email" class="form-control" placeholder="example@gmail.com" required autocomplete="email" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <div class="input-group">
              <i class="fa-solid fa-lock input-icon"></i>
              <input type="password" id="login-password" class="form-control" placeholder="Nhập mật khẩu" required autocomplete="current-password" />
              <i class="fa-solid fa-eye input-icon-right" id="toggle-pw" onclick="togglePasswordVisibility()"></i>
            </div>
          </div>
          <div id="login-error" class="alert alert-danger" style="display:none;margin-bottom:12px"></div>
          <button type="submit" id="login-btn" class="btn btn-primary btn-block btn-lg">
            ĐĂNG NHẬP
          </button>
          <div style="text-align:right;margin-top:8px">
            <a class="login-forgot" onclick="showForgotPassword()">Quên mật khẩu?</a>
          </div>
        </form>
        <div class="login-demo">
          <p>🚀 Đăng nhập nhanh (Demo)</p>
          <button class="login-demo-btn" onclick="demoLogin('admin@gmail.com','admin123')">
            <span>👨‍💻</span> Admin – Admin Hệ Thống
          </button>
        </div>
      </div>
    </div>
  `;
}

function togglePasswordVisibility() {
  const pw = document.getElementById('login-password');
  const icon = document.getElementById('toggle-pw');
  if (pw.type === 'password') {
    pw.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    pw.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Đang đăng nhập...';
  setTimeout(() => {
    const result = Auth.login(email, password);
    if (result.ok) {
      App.showDashboard();
    } else {
      errEl.style.display = 'flex';
      errEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${result.msg}`;
      btn.disabled = false;
      btn.textContent = 'ĐĂNG NHẬP';
    }
  }, 600);
}

function demoLogin(email, password) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
  setTimeout(() => {
    document.getElementById('login-form').dispatchEvent(new Event('submit'));
  }, 100);
}

function showForgotPassword() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 style="font-weight:700">🔐 Quên mật khẩu</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <p style="color:var(--gray-600);font-size:.9rem;margin-bottom:16px">Nhập Gmail đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
        <div class="form-group">
          <div class="input-group">
            <i class="fa-solid fa-envelope input-icon"></i>
            <input type="email" id="forgot-email" class="form-control" placeholder="example@gmail.com" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost btn-sm" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
        <button class="btn btn-primary btn-sm" onclick="submitForgotPassword()">Gửi email</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function submitForgotPassword() {
  const email = document.getElementById('forgot-email').value;
  if (!email) { Toast.show('Vui lòng nhập Gmail.', 'warning'); return; }
  document.querySelector('.modal-overlay').remove();
  Toast.show('Đã gửi link đặt lại mật khẩu tới ' + email, 'success');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}
