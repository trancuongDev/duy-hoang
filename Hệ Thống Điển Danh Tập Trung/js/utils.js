// ===== UTILITIES =====

// Toast notifications
const Toast = {
  show(msg, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${icons[type]} toast-icon"></i>
      <span class="toast-msg">${msg}</span>
      <button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }
};

// Clock
function startClock(el) {
  function tick() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  return setInterval(tick, 1000);
}

// Format date VN
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Giữ lại stub để không break nếu còn ref cũ
function generateQRPattern(code) { return ''; }
function renderQRCode(containerId, code) {}

// Avatar HTML
function avatarHtml(user, size = 36) {
  const color = user.avatar || getAvatarColor(user.name);
  const initials = getInitials(user.name);
  return `<div class="avatar" style="background:${color};width:${size}px;height:${size}px;font-size:${size*0.38}px">${initials}</div>`;
}

// Status badge
function statusBadge(status) {
  const map = {
    present: ['badge-success', '🟢 Có mặt'],
    late:    ['badge-warning', '🟡 Đi muộn'],
    absent:  ['badge-danger',  '🔴 Vắng'],
    pending: ['badge-gray',    '⚪ Chờ'],
  };
  const [cls, label] = map[status] || ['badge-gray', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function sessionStatusBadge(status) {
  const map = {
    open:    ['badge-success', '🟢 Đang mở'],
    closed:  ['badge-danger',  '🔴 Đã đóng'],
    pending: ['badge-warning', '🟡 Sắp diễn ra'],
  };
  const [cls, label] = map[status] || ['badge-gray', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

// Countdown timer
function startCountdown(ms, onTick, onDone) {
  let remaining = ms;
  function tick() {
    if (remaining <= 0) { onDone && onDone(); return; }
    onTick(remaining);
    remaining -= 1000;
  }
  tick();
  return setInterval(() => {
    if (remaining <= 0) { onDone && onDone(); return; }
    onTick(remaining);
    remaining -= 1000;
  }, 1000);
}

function msToMMSS(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// Confirm dialog
function showConfirmDialog(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:380px">
      <div class="modal-header">
        <h3 style="font-size:1rem;font-weight:700">${title}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <p style="color:var(--gray-600);font-size:.9rem">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost btn-sm" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
        <button class="btn btn-danger btn-sm" id="confirm-ok-btn">Xác nhận</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirm-ok-btn').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
}

// Escape HTML
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
