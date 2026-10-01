// ===== STUDENT MODULE =====
const Student = {
  activeTab: 'dashboard',
  timers: [],

  navItems: [
    { key: 'dashboard',  icon: 'house',          label: 'Tổng quan' },
    { key: 'schedule',   icon: 'calendar-days',  label: 'Lịch học' },
    { key: 'history',    icon: 'clock-rotate-left', label: 'Lịch sử điểm danh' },
    { key: 'classes',    icon: 'book-open',       label: 'Lớp học của tôi' },
  ],

  render(page) {
    this.activeTab = page || 'dashboard';
    this.clearTimers();
    const sidebar = renderSidebar(this.navItems, this.activeTab);
    let content = '';
    switch (this.activeTab) {
      case 'dashboard': content = this.renderDashboard(); break;
      case 'schedule':  content = this.renderSchedule();  break;
      case 'history':   content = this.renderHistory();   break;
      case 'classes':   content = this.renderClasses();   break;
      default: content = this.renderDashboard();
    }
    const topbar = renderTopbar('Học viên', 'Hệ thống điểm danh');
    document.getElementById('app').innerHTML = `
      <div id="page-app">
        ${sidebar}
        <div class="main-content">
          ${topbar}
          <div class="page-content">${content}</div>
        </div>
      </div>
    `;
    this.afterRender();
  },

  afterRender() {
    const clockEl = document.getElementById('topbar-clock');
    if (clockEl) this.timers.push(startClock(clockEl));
  },

  clearTimers() {
    this.timers.forEach(t => clearInterval(t));
    this.timers = [];
  },

  renderDashboard() {
    const user = Auth.currentUser;
    const stats = getStudentStats(user.id);
    const todaySessions = getTodaySessions(user.id, 'student');

    const greeting = () => {
      const h = new Date().getHours();
      if (h < 12) return 'Chào buổi sáng';
      if (h < 18) return 'Chào buổi chiều';
      return 'Chào buổi tối';
    };

    const sessionsHtml = todaySessions.length === 0
      ? `<div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i><p>Hôm nay không có buổi học nào.</p></div>`
      : todaySessions.map(s => this.renderSessionCard(s, user)).join('');

    return `
      <div style="max-width:720px">
        <div style="margin-bottom:24px">
          <h1 style="font-size:1.4rem;font-weight:800;color:var(--gray-900)">${greeting()}, ${user.name.split(' ').pop()} 👋</h1>
          <p style="color:var(--gray-500);font-size:.9rem;margin-top:4px">Hôm nay, ${new Date().toLocaleDateString('vi-VN', {weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})}</p>
        </div>

        <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
          <div class="stat-card primary">
            <div class="stat-label"><i class="fa-solid fa-calendar-check" style="margin-right:4px"></i> Buổi học</div>
            <div class="stat-value">${stats.total}</div>
            <div class="stat-sub">Tổng số buổi</div>
          </div>
          <div class="stat-card success">
            <div class="stat-label"><i class="fa-solid fa-circle-check" style="margin-right:4px"></i> Có mặt</div>
            <div class="stat-value">${stats.present}</div>
            <div class="stat-sub">Buổi đã điểm danh</div>
          </div>
          <div class="stat-card ${stats.rate >= 80 ? 'success' : stats.rate >= 60 ? 'warning' : 'danger'}">
            <div class="stat-label"><i class="fa-solid fa-percent" style="margin-right:4px"></i> Chuyên cần</div>
            <div class="stat-value">${stats.rate}%</div>
            <div class="stat-sub">${stats.rate >= 80 ? 'Xuất sắc' : stats.rate >= 60 ? 'Cần cố gắng' : 'Nguy hiểm'}</div>
          </div>
        </div>

        <div class="section-header">
          <div class="section-title"><i class="fa-solid fa-book-open"></i> Buổi học hôm nay</div>
          <span class="badge badge-info">${todaySessions.length} buổi</span>
        </div>
        ${sessionsHtml}
      </div>
    `;
  },

  renderSessionCard(session, user) {
    const cls = getClassById(session.classId);
    const attended = hasAttended(session.id, user.id);
    const meetLink = cls ? cls.meetLink : '#';

    let statusSection = '';
    if (session.status === 'open' && !attended) {
      statusSection = `
        <div class="session-card-actions">
          <button class="btn btn-primary" onclick="Student.startAttendance('${session.id}')">
            <i class="fa-solid fa-fingerprint"></i> Điểm danh
          </button>
          <a href="${meetLink}" target="_blank" class="btn btn-outline">
            <i class="fa-brands fa-google"></i> Vào Google Meet
          </a>
        </div>
      `;
    } else if (attended) {
      statusSection = `
        <div class="session-card-actions">
          <span class="badge badge-success" style="font-size:.85rem;padding:8px 14px"><i class="fa-solid fa-check"></i> Đã điểm danh</span>
          <a href="${meetLink}" target="_blank" class="btn btn-outline btn-sm">
            <i class="fa-brands fa-google"></i> Vào lớp
          </a>
        </div>
      `;
    } else if (session.status === 'closed') {
      statusSection = `<div class="session-card-actions"><span class="badge badge-danger" style="padding:8px 14px">🔴 Đã đóng điểm danh</span></div>`;
    } else {
      statusSection = `
        <div class="session-card-actions">
          <span class="badge badge-warning" style="font-size:.85rem;padding:8px 14px">🟡 Chưa mở điểm danh</span>
          <a href="${meetLink}" target="_blank" class="btn btn-outline btn-sm">
            <i class="fa-brands fa-google"></i> Vào lớp
          </a>
        </div>
      `;
    }

    return `
      <div class="session-card">
        <div class="session-card-header">
          <div>
            <div class="session-card-title">📚 ${escHtml(session.title)}</div>
            <div class="session-card-meta">
              <span><i class="fa-regular fa-calendar"></i> ${formatDate(session.date)}</span>
              <span><i class="fa-regular fa-clock"></i> ${session.startTime} – ${session.endTime}</span>
            </div>
          </div>
          ${sessionStatusBadge(session.status)}
        </div>
        ${statusSection}
      </div>
    `;
  },

  startAttendance(sessionId) {
    const session = getSessionById(sessionId);
    const user = Auth.currentUser;
    if (!session) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'attend-modal';
    overlay.innerHTML = `
      <div class="modal" style="max-width:440px">
        <div class="modal-header">
          <h3 style="font-weight:800">🔐 Xác nhận điểm danh</h3>
          <button class="modal-close" onclick="document.getElementById('attend-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="confirm-field"><span>Họ tên</span><span>${escHtml(user.name)}</span></div>
          <div class="confirm-field"><span>Gmail</span><span>${escHtml(user.email)}</span></div>
          <div class="confirm-field"><span>Buổi học</span><span>${escHtml(session.title)}</span></div>
          <div class="confirm-field"><span>Thời gian</span><span id="confirm-time">${formatDateTime()}</span></div>
          <div style="margin-top:20px;text-align:center">
            <p style="font-size:.88rem;color:var(--gray-600);margin-bottom:10px">Nhập mã điểm danh (4 chữ số)</p>
            <div class="otp-input-group">
              <input type="text" maxlength="1" class="otp-input" id="otp-0" oninput="otpNext(this, 0)" onkeydown="otpBack(event, 0)" inputmode="numeric" />
              <input type="text" maxlength="1" class="otp-input" id="otp-1" oninput="otpNext(this, 1)" onkeydown="otpBack(event, 1)" inputmode="numeric" />
              <input type="text" maxlength="1" class="otp-input" id="otp-2" oninput="otpNext(this, 2)" onkeydown="otpBack(event, 2)" inputmode="numeric" />
              <input type="text" maxlength="1" class="otp-input" id="otp-3" oninput="otpNext(this, 3)" onkeydown="otpBack(event, 3)" inputmode="numeric" />
            </div>
            <div id="otp-error" style="color:var(--danger);font-size:.83rem;min-height:18px;margin-top:4px"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('attend-modal').remove()">Hủy</button>
          <button class="btn btn-primary" onclick="Student.confirmAttendance('${sessionId}')">
            <i class="fa-solid fa-check"></i> Xác nhận
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('otp-0').focus();

    // Update time every second
    const t = setInterval(() => {
      const el = document.getElementById('confirm-time');
      if (el) el.textContent = formatDateTime();
      else clearInterval(t);
    }, 1000);
  },

  confirmAttendance(sessionId) {
    const code = [0,1,2,3].map(i => document.getElementById('otp-' + i).value).join('');
    const errEl = document.getElementById('otp-error');
    const session = getSessionById(sessionId);
    const user = Auth.currentUser;

    if (code.length < 4) {
      errEl.textContent = 'Vui lòng nhập đủ 4 chữ số.';
      return;
    }
    if (code !== session.code) {
      errEl.textContent = '❌ Mã không đúng. Vui lòng kiểm tra lại.';
      [0,1,2,3].forEach(i => { document.getElementById('otp-' + i).value = ''; });
      document.getElementById('otp-0').focus();
      return;
    }
    if (hasAttended(sessionId, user.id)) {
      errEl.textContent = '⚠️ Bạn đã điểm danh buổi này rồi.';
      return;
    }

    const checkInTime = formatDateTime();
    DB.attendance.push({
      id: 'a' + Date.now(),
      sessionId, userId: user.id,
      checkInTime, status: 'present',
      ip: '192.168.1.' + Math.floor(Math.random()*50 + 10),
      device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
    });

    document.getElementById('attend-modal').remove();
    this.showSuccessScreen(session, checkInTime);
  },

  showSuccessScreen(session, time) {
    const cls = getClassById(session.classId);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px;text-align:center">
        <div class="modal-body" style="padding:32px 28px">
          <div class="success-icon">✅</div>
          <h2 style="color:var(--success);font-size:1.4rem;font-weight:800;margin:12px 0 6px">ĐIỂM DANH THÀNH CÔNG</h2>
          <p style="color:var(--gray-500);font-size:.9rem">Bạn đã được ghi nhận tham gia.</p>
          <div class="success-details" style="display:block;margin:20px 0">
            <p>⏰ <strong>${time}</strong></p>
            <p>📚 <strong>${escHtml(session.title)}</strong></p>
            ${cls ? `<p>🔗 <a href="${cls.meetLink}" target="_blank" style="color:var(--primary)">Vào lớp Google Meet</a></p>` : ''}
          </div>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
            ${cls ? `<a href="${cls.meetLink}" target="_blank" class="btn btn-primary"><i class="fa-brands fa-google"></i> Vào lớp</a>` : ''}
            <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove();Student.render('dashboard')">
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    Toast.show('Điểm danh thành công!', 'success');
  },

  renderSchedule() {
    const user = Auth.currentUser;
    const classes = getClassesForStudent(user.id);
    const allSessions = DB.sessions
      .filter(s => classes.map(c => c.id).includes(s.classId))
      .sort((a, b) => b.date.localeCompare(a.date));

    return `
      <div style="max-width:800px">
        <div class="section-header">
          <div class="section-title"><i class="fa-solid fa-calendar-days"></i> Lịch học</div>
        </div>
        ${allSessions.map(s => {
          const cls = getClassById(s.classId);
          const attended = hasAttended(s.id, user.id);
          return `
            <div class="session-card">
              <div class="session-card-header">
                <div>
                  <div class="session-card-title">${escHtml(s.title)}</div>
                  <div class="session-card-meta">
                    <span><i class="fa-regular fa-calendar"></i> ${formatDate(s.date)}</span>
                    <span><i class="fa-regular fa-clock"></i> ${s.startTime} – ${s.endTime}</span>
                    <span><i class="fa-solid fa-chalkboard"></i> ${cls ? cls.name : ''}</span>
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                  ${sessionStatusBadge(s.status)}
                  ${attended ? `<span class="badge badge-success"><i class="fa-solid fa-check"></i> Đã điểm danh</span>` : s.status === 'closed' ? `<span class="badge badge-danger">Vắng</span>` : ''}
                </div>
              </div>
              ${s.status === 'open' && !attended
                ? `<button class="btn btn-primary btn-sm" onclick="Student.startAttendance('${s.id}')"><i class="fa-solid fa-fingerprint"></i> Điểm danh ngay</button>`
                : ''
              }
            </div>
          `;
        }).join('')}
        ${allSessions.length === 0 ? `<div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i><p>Chưa có lịch học nào.</p></div>` : ''}
      </div>
    `;
  },

  renderHistory() {
    const user = Auth.currentUser;
    const classes = getClassesForStudent(user.id);
    const classIds = classes.map(c => c.id);
    const sessions = DB.sessions.filter(s => classIds.includes(s.classId));

    let rows = sessions.map(s => {
      const attend = DB.attendance.find(a => a.sessionId === s.id && a.userId === user.id);
      const cls = getClassById(s.classId);
      return { session: s, attend, cls };
    }).sort((a, b) => b.session.date.localeCompare(a.session.date));

    let totalSessions = rows.length;
    let presentCount = rows.filter(r => r.attend && r.attend.status === 'present').length;
    let lateCount = rows.filter(r => r.attend && r.attend.status === 'late').length;
    let absentCount = totalSessions - presentCount - lateCount;
    let rate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 0;

    return `
      <div style="max-width:900px">
        <div class="section-header">
          <div class="section-title"><i class="fa-solid fa-clock-rotate-left"></i> Lịch sử điểm danh</div>
        </div>
        <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
          <div class="stat-card primary"><div class="stat-label">Tổng buổi</div><div class="stat-value">${totalSessions}</div></div>
          <div class="stat-card success"><div class="stat-label">Có mặt</div><div class="stat-value">${presentCount}</div></div>
          <div class="stat-card warning"><div class="stat-label">Đi muộn</div><div class="stat-value">${lateCount}</div></div>
          <div class="stat-card danger"><div class="stat-label">Vắng</div><div class="stat-value">${absentCount}</div></div>
        </div>
        <div class="card">
          <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:.9rem;font-weight:600;color:var(--gray-700)">Tỷ lệ chuyên cần</span>
            <strong style="color:${rate>=80?'var(--success)':rate>=60?'var(--warning)':'var(--danger)'}">${rate}%</strong>
          </div>
          <div class="progress-bar"><div class="progress-fill ${rate>=80?'success':rate>=60?'warning':'danger'}" style="width:${rate}%"></div></div>
        </div>
        <div class="card" style="margin-top:16px">
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Buổi học</th><th>Lớp</th><th>Ngày</th><th>Giờ vào</th><th>Trạng thái</th></tr></thead>
              <tbody>
                ${rows.map(({ session: s, attend, cls }) => `
                  <tr>
                    <td style="font-weight:600">${escHtml(s.title)}</td>
                    <td>${cls ? escHtml(cls.name) : ''}</td>
                    <td>${formatDate(s.date)}</td>
                    <td>${attend ? attend.checkInTime : '–'}</td>
                    <td>${attend ? statusBadge(attend.status) : statusBadge('absent')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderClasses() {
    const user = Auth.currentUser;
    const classes = getClassesForStudent(user.id);
    return `
      <div style="max-width:720px">
        <div class="section-header">
          <div class="section-title"><i class="fa-solid fa-book-open"></i> Lớp học của tôi</div>
          <span class="badge badge-primary">${classes.length} lớp</span>
        </div>
        ${classes.map(cls => {
          const teacher = getUserById(cls.teacherId);
          const classSessions = getSessionsForClass(cls.id);
          const myAttend = classSessions.filter(s => hasAttended(s.id, user.id)).length;
          const rate = classSessions.length > 0 ? Math.round((myAttend/classSessions.length)*100) : 0;
          return `
            <div class="card" style="margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
                <div>
                  <h3 style="font-size:1.05rem;font-weight:700;color:var(--gray-900)">${escHtml(cls.name)}</h3>
                  <p style="font-size:.85rem;color:var(--gray-500);margin-top:4px">
                    <i class="fa-solid fa-chalkboard-user"></i> ${teacher ? teacher.name : 'N/A'}
                  </p>
                </div>
                <span class="badge ${cls.status === 'active' ? 'badge-success' : 'badge-gray'}">${cls.status === 'active' ? 'Đang học' : 'Đã kết thúc'}</span>
              </div>
              <div style="display:flex;gap:20px;font-size:.85rem;color:var(--gray-600);margin-bottom:12px;flex-wrap:wrap">
                <span><i class="fa-solid fa-users"></i> ${cls.studentCount} học viên</span>
                <span><i class="fa-solid fa-calendar"></i> ${cls.schedule.join(', ')}</span>
              </div>
              <div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:4px">
                  <span>Chuyên cần</span><strong>${rate}%</strong>
                </div>
                <div class="progress-bar"><div class="progress-fill ${rate>=80?'success':rate>=60?'warning':'danger'}" style="width:${rate}%"></div></div>
              </div>
              ${cls.meetLink ? `<a href="${cls.meetLink}" target="_blank" class="btn btn-outline btn-sm"><i class="fa-brands fa-google"></i> Vào Google Meet</a>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};

// OTP input helpers
function otpNext(input, idx) {
  input.value = input.value.replace(/\D/g, '');
  if (input.value && idx < 3) {
    document.getElementById('otp-' + (idx + 1)).focus();
  }
  document.getElementById('otp-error').textContent = '';
}
function otpBack(e, idx) {
  if (e.key === 'Backspace' && !e.target.value && idx > 0) {
    document.getElementById('otp-' + (idx - 1)).focus();
  }
}
