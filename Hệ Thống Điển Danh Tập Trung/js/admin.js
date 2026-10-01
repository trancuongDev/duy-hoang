// ===== ADMIN MODULE (bao gồm cả chức năng quản lý buổi học / điểm danh) =====
const Admin = {
  activeTab: 'dashboard',
  timers: [],
  studentFilter: { class: 'all', status: 'all', search: '' },
  historyFilter: { class: 'all', status: 'all' },

  navItems: [
    { key: 'dashboard',  icon: 'gauge-high',            label: 'Tổng quan' },
    { divider: true, label: 'Quản lý' },
    { key: 'students',   icon: 'user-graduate',          label: 'Học viên' },
    { key: 'classes',    icon: 'book-open',              label: 'Lớp học' },
    { key: 'sessions',   icon: 'calendar-days',          label: 'Buổi học' },
    { key: 'create',     icon: 'circle-plus',            label: 'Tạo buổi học' },
    { divider: true, label: 'Điểm danh' },
    { key: 'live',       icon: 'signal',                 label: 'Điểm danh Live' },
    { divider: true, label: 'Báo cáo' },
    { key: 'history',    icon: 'clock-rotate-left',      label: 'Lịch sử điểm danh' },
    { key: 'warnings',   icon: 'triangle-exclamation',   label: 'Cảnh báo' },
  ],

  render(page) {
    this.activeTab = page || 'dashboard';
    this.clearTimers();
    const sidebar = renderSidebar(this.navItems, this.activeTab);
    let content = '';
    switch (this.activeTab) {
      case 'dashboard': content = this.renderDashboard(); break;
      case 'students':  content = this.renderStudents();  break;
      case 'classes':   content = this.renderClasses();   break;
      case 'sessions':  content = this.renderSessions();  break;
      case 'create':    content = this.renderCreate();    break;
      case 'live':      content = this.renderLive();      break;
      case 'history':   content = this.renderHistory();   break;
      case 'warnings':  content = this.renderWarnings();  break;
      default: content = this.renderDashboard();
    }
    const topbar = renderTopbar('Admin', 'Quản trị hệ thống');
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
    if (this.activeTab === 'live') this.startLiveUpdates();
  },

  clearTimers() {
    this.timers.forEach(t => clearInterval(t));
    this.timers = [];
  },

  // =========================================================
  // DASHBOARD
  // =========================================================
  renderDashboard() {
    const students = DB.users.filter(u => u.role === 'student');
    const activeStudents = students.filter(u => u.status === 'active').length;
    const unreadWarnings = DB.warnings.filter(w => !w.read).length;
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = DB.sessions.filter(s => s.date === today);
    const openSessions = todaySessions.filter(s => s.status === 'open').length;

    const closedSessions = DB.sessions.filter(s => s.status === 'closed');
    const totalPossible = closedSessions.reduce((sum, s) => {
      const cls = getClassById(s.classId);
      if (!cls) return sum;
      return sum + DB.users.filter(u => u.role === 'student' && u.classes.includes(cls.id)).length;
    }, 0);
    const overallRate = totalPossible > 0 ? Math.round((DB.attendance.length / totalPossible) * 100) : 0;

    return `
      <div style="max-width:980px">
        <div style="margin-bottom:24px">
          <h1 style="font-size:1.4rem;font-weight:800;color:var(--gray-900)">Admin Dashboard 👨‍💻</h1>
          <p style="color:var(--gray-500);font-size:.9rem;margin-top:4px">
            ${new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})}
          </p>
        </div>

        <div class="big-stats-grid" style="margin-bottom:24px">
          <div class="big-stat-card">
            <div class="icon">👨‍🎓</div>
            <div class="value">${students.length}</div>
            <div class="label">Tổng học viên</div>
            <div style="font-size:.75rem;color:var(--success);margin-top:4px">${activeStudents} đang hoạt động</div>
          </div>
          <div class="big-stat-card">
            <div class="icon">📚</div>
            <div class="value">${DB.classes.length}</div>
            <div class="label">Lớp học</div>
          </div>
          <div class="big-stat-card">
            <div class="icon">📅</div>
            <div class="value">${DB.sessions.length}</div>
            <div class="label">Buổi học</div>
          </div>
          <div class="big-stat-card">
            <div class="icon">📊</div>
            <div class="value">${overallRate}%</div>
            <div class="label">Tỷ lệ chuyên cần</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
          <div class="card">
            <div class="section-title" style="margin-bottom:16px"><i class="fa-solid fa-chart-bar"></i> Tỷ lệ tham gia</div>
            ${DB.classes.length === 0
              ? `<p style="color:var(--gray-400);font-size:.85rem">Chưa có lớp học nào.</p>`
              : DB.classes.map(cls => {
                  const sessions = getSessionsForClass(cls.id).filter(s => s.status === 'closed');
                  const studentList = DB.users.filter(u => u.role === 'student' && u.classes.includes(cls.id));
                  const totalP = sessions.length * studentList.length;
                  const attended = DB.attendance.filter(a => sessions.map(s => s.id).includes(a.sessionId)).length;
                  const rate = totalP > 0 ? Math.round((attended / totalP) * 100) : 0;
                  return `
                    <div class="chart-row">
                      <span class="label">${escHtml(cls.name)}</span>
                      <div class="bar-wrap"><div class="bar" style="width:${rate}%"></div></div>
                      <span class="pct">${rate}%</span>
                    </div>
                  `;
                }).join('')
            }
          </div>

          <div class="card">
            <div class="section-title" style="margin-bottom:16px"><i class="fa-solid fa-calendar-day"></i> Hôm nay</div>
            <div class="stats-grid" style="grid-template-columns:1fr 1fr;margin-bottom:16px">
              <div class="stat-card info" style="padding:14px">
                <div class="stat-label">Buổi học</div>
                <div class="stat-value" style="font-size:1.6rem">${todaySessions.length}</div>
              </div>
              <div class="stat-card success" style="padding:14px">
                <div class="stat-label">Đang mở</div>
                <div class="stat-value" style="font-size:1.6rem">${openSessions}</div>
              </div>
            </div>
            ${unreadWarnings > 0
              ? `<div class="alert alert-warning"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>${unreadWarnings} cảnh báo</strong> chưa xem. <a href="#" onclick="App.navigate('warnings')" style="color:var(--warning);font-weight:600;font-size:.85rem">Xem ngay →</a></div></div>`
              : `<div class="alert alert-success"><i class="fa-solid fa-check-circle"></i> Không có cảnh báo mới.</div>`
            }
            <p style="font-size:.82rem;font-weight:600;color:var(--gray-600);margin:12px 0 8px">Buổi học hôm nay:</p>
            ${todaySessions.map(s => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--gray-100);font-size:.85rem">
                <span style="font-weight:600">${escHtml(s.title)}</span>
                ${sessionStatusBadge(s.status)}
              </div>
            `).join('') || '<p style="color:var(--gray-400);font-size:.85rem">Không có buổi học nào.</p>'}
          </div>
        </div>

        ${DB.warnings.filter(w => !w.read).length > 0 ? `
          <div class="card">
            <div class="section-title" style="margin-bottom:14px"><i class="fa-solid fa-triangle-exclamation" style="color:var(--warning)"></i> Cảnh báo gần đây</div>
            ${DB.warnings.filter(w => !w.read).slice(0,3).map(w => `
              <div class="warning-card">
                <i class="fa-solid fa-exclamation-circle"></i>
                <span>${escHtml(w.message)}</span>
                <span style="margin-left:auto;font-size:.75rem;color:var(--gray-400)">${formatDate(w.date)}</span>
              </div>
            `).join('')}
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('warnings')" style="margin-top:8px">Xem tất cả →</button>
          </div>
        ` : ''}
      </div>
    `;
  },

  // =========================================================
  // STUDENTS
  // =========================================================
  renderStudents() {
    const students = DB.users.filter(u => u.role === 'student');
    const f = this.studentFilter;
    let filtered = students;
    if (f.class !== 'all') filtered = filtered.filter(u => u.classes.includes(f.class));
    if (f.status !== 'all') filtered = filtered.filter(u => u.status === f.status);
    if (f.search) {
      const q = f.search.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.studentId || '').toLowerCase().includes(q)
      );
    }

    return `
      <div style="max-width:1100px">
        <div class="section-header">
          <div class="section-title"><i class="fa-solid fa-user-graduate"></i> Quản lý học viên
            <span class="badge badge-primary" style="margin-left:6px">${students.length}</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="Admin.showAddStudent()">
            <i class="fa-solid fa-user-plus"></i> Thêm học viên
          </button>
        </div>
        <div class="filter-bar">
          <div class="input-group" style="flex:1;min-width:200px;max-width:300px">
            <i class="fa-solid fa-search input-icon"></i>
            <input type="text" class="form-control" placeholder="Tìm tên, email, mã HV..."
              value="${escHtml(f.search)}"
              oninput="Admin.studentFilter.search=this.value;Admin.render('students')" />
          </div>
          <select class="form-select" style="width:auto" onchange="Admin.studentFilter.class=this.value;Admin.render('students')">
            <option value="all" ${f.class==='all'?'selected':''}>Tất cả lớp</option>
            ${DB.classes.map(c => `<option value="${c.id}" ${f.class===c.id?'selected':''}>${escHtml(c.name)}</option>`).join('')}
          </select>
          <select class="form-select" style="width:auto" onchange="Admin.studentFilter.status=this.value;Admin.render('students')">
            <option value="all" ${f.status==='all'?'selected':''}>Tất cả trạng thái</option>
            <option value="active" ${f.status==='active'?'selected':''}>Đang hoạt động</option>
            <option value="inactive" ${f.status==='inactive'?'selected':''}>Đã khóa</option>
          </select>
        </div>
        <div class="card">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr><th>Học viên</th><th>Mã HV</th><th>Gmail</th><th>SĐT</th><th>Lớp</th><th>Chuyên cần</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                ${filtered.map(u => {
                  const stats = getStudentStats(u.id);
                  const classes = DB.classes.filter(c => u.classes.includes(c.id));
                  return `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px">
                          ${avatarHtml(u, 32)}
                          <div>
                            <div style="font-weight:600;font-size:.9rem">${escHtml(u.name)}</div>
                            <div style="font-size:.75rem;color:var(--gray-400)">ĐK: ${formatDate(u.joinDate)}</div>
                          </div>
                        </div>
                      </td>
                      <td><span class="badge badge-gray">${u.studentId || 'N/A'}</span></td>
                      <td style="font-size:.85rem;color:var(--gray-600)">${escHtml(u.email)}</td>
                      <td style="font-size:.85rem">${u.phone || '–'}</td>
                      <td style="font-size:.82rem">${classes.map(c => `<span class="badge badge-info" style="margin:1px">${escHtml(c.name)}</span>`).join('') || '–'}</td>
                      <td><span style="color:${stats.rate>=80?'var(--success)':stats.rate>=60?'var(--warning)':'var(--danger)'};font-weight:700">${stats.rate}%</span></td>
                      <td><span class="badge ${u.status==='active'?'badge-success':'badge-danger'}">${u.status==='active'?'Hoạt động':'Đã khóa'}</span></td>
                      <td>
                        <div style="display:flex;gap:4px">
                          <button class="btn btn-ghost btn-sm btn-icon" title="Xem" onclick="Admin.viewStudent('${u.id}')"><i class="fa-solid fa-eye"></i></button>
                          <button class="btn btn-ghost btn-sm btn-icon" title="Sửa" onclick="Admin.editStudent('${u.id}')"><i class="fa-solid fa-pen"></i></button>
                          <button class="btn btn-ghost btn-sm btn-icon" title="${u.status==='active'?'Khóa':'Mở khóa'}"
                            onclick="Admin.toggleUserStatus('${u.id}')"
                            style="color:${u.status==='active'?'var(--warning)':'var(--success)'}">
                            <i class="fa-solid fa-${u.status==='active'?'lock':'lock-open'}"></i>
                          </button>
                          <button class="btn btn-ghost btn-sm btn-icon" title="Xóa" onclick="Admin.deleteUser('${u.id}')" style="color:var(--danger)"><i class="fa-solid fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          ${filtered.length === 0 ? `<div class="empty-state"><i class="fa-solid fa-users-slash"></i><p>Không tìm thấy học viên nào.</p></div>` : ''}
        </div>
      </div>
    `;
  },

  showAddStudent() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:500px">
        <div class="modal-header">
          <h3 style="font-weight:800">➕ Thêm học viên mới</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Họ và tên</label>
              <input type="text" class="form-control" id="add-name" placeholder="Nguyễn Văn A" />
            </div>
            <div class="form-group">
              <label class="form-label">Gmail</label>
              <input type="email" class="form-control" id="add-email" placeholder="example@gmail.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Mật khẩu</label>
              <input type="password" class="form-control" id="add-password" placeholder="Ít nhất 6 ký tự" />
            </div>
            <div class="form-group">
              <label class="form-label">Số điện thoại</label>
              <input type="tel" class="form-control" id="add-phone" placeholder="0901234567" />
            </div>
            <div class="form-group">
              <label class="form-label">Gán lớp học</label>
              <select class="form-select" id="add-class">
                <option value="">-- Chọn lớp --</option>
                ${DB.classes.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost btn-sm" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
          <button class="btn btn-primary" onclick="Admin.saveNewStudent()"><i class="fa-solid fa-check"></i> Thêm học viên</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  saveNewStudent() {
    const name = document.getElementById('add-name').value.trim();
    const email = document.getElementById('add-email').value.trim().toLowerCase();
    const password = document.getElementById('add-password').value;
    const phone = document.getElementById('add-phone').value.trim();
    const classId = document.getElementById('add-class').value;
    if (!name || !email || !password) { Toast.show('Vui lòng điền đầy đủ thông tin.', 'warning'); return; }
    if (DB.users.find(u => u.email === email)) { Toast.show('Email đã tồn tại.', 'error'); return; }
    if (password.length < 6) { Toast.show('Mật khẩu ít nhất 6 ký tự.', 'warning'); return; }
    DB.users.push({
      id: 'u' + Date.now(), name, email, phone,
      role: 'student', status: 'active',
      studentId: 'HV' + String(DB.users.filter(u => u.role === 'student').length + 1).padStart(3, '0'),
      classes: classId ? [classId] : [],
      joinDate: new Date().toISOString().split('T')[0],
      avatar: getAvatarColor(name)
    });
    DB.passwords[email] = password;
    document.querySelector('.modal-overlay').remove();
    Toast.show(`Đã thêm học viên ${name}.`, 'success');
    this.render('students');
  },

  editStudent(userId) {
    const u = getUserById(userId);
    if (!u) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:500px">
        <div class="modal-header">
          <h3 style="font-weight:800">✏️ Sửa thông tin học viên</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Họ và tên</label>
              <input type="text" class="form-control" id="edit-name" value="${escHtml(u.name)}" />
            </div>
            <div class="form-group">
              <label class="form-label">Gmail</label>
              <input type="email" class="form-control" id="edit-email" value="${escHtml(u.email)}" />
            </div>
            <div class="form-group">
              <label class="form-label">Số điện thoại</label>
              <input type="tel" class="form-control" id="edit-phone" value="${escHtml(u.phone || '')}" />
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Lớp học (giữ Ctrl để chọn nhiều)</label>
              <select class="form-select" id="edit-classes" multiple style="height:100px">
                ${DB.classes.map(c => `<option value="${c.id}" ${u.classes.includes(c.id)?'selected':''}>${escHtml(c.name)}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost btn-sm" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
          <button class="btn btn-primary" onclick="Admin.saveEditStudent('${userId}')"><i class="fa-solid fa-check"></i> Lưu thay đổi</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  saveEditStudent(userId) {
    const u = getUserById(userId);
    if (!u) return;
    const name = document.getElementById('edit-name').value.trim();
    const email = document.getElementById('edit-email').value.trim().toLowerCase();
    const phone = document.getElementById('edit-phone').value.trim();
    const selected = Array.from(document.getElementById('edit-classes').selectedOptions).map(o => o.value);
    if (!name || !email) { Toast.show('Vui lòng điền đầy đủ thông tin.', 'warning'); return; }
    const oldEmail = u.email;
    u.name = name; u.email = email; u.phone = phone; u.classes = selected;
    if (oldEmail !== email) { DB.passwords[email] = DB.passwords[oldEmail]; delete DB.passwords[oldEmail]; }
    document.querySelector('.modal-overlay').remove();
    Toast.show('Đã cập nhật thông tin học viên.', 'success');
    this.render('students');
  },

  toggleUserStatus(userId) {
    const u = getUserById(userId);
    if (!u) return;
    const action = u.status === 'active' ? 'khóa' : 'mở khóa';
    showConfirmDialog('Xác nhận', `Bạn có chắc muốn ${action} tài khoản ${u.name}?`, () => {
      u.status = u.status === 'active' ? 'inactive' : 'active';
      Toast.show(`Đã ${action} tài khoản ${u.name}.`, u.status === 'inactive' ? 'warning' : 'success');
      this.render(this.activeTab);
    });
  },

  deleteUser(userId) {
    const u = getUserById(userId);
    if (!u) return;
    showConfirmDialog('Xóa tài khoản', `Bạn có chắc muốn xóa ${u.name}? Hành động này không thể hoàn tác.`, () => {
      const idx = DB.users.findIndex(x => x.id === userId);
      if (idx > -1) DB.users.splice(idx, 1);
      delete DB.passwords[u.email];
      Toast.show(`Đã xóa ${u.name}.`, 'success');
      this.render(this.activeTab);
    });
  },

  viewStudent(userId) {
    const u = getUserById(userId);
    if (!u) return;
    const stats = getStudentStats(u.id);
    const classes = DB.classes.filter(c => u.classes.includes(c.id));
    const attendHistory = DB.attendance.filter(a => a.userId === u.id).slice(-5).reverse();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:520px;max-height:90vh;display:flex;flex-direction:column">
        <div class="modal-header">
          <h3 style="font-weight:800">👤 Hồ sơ học viên</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="overflow-y:auto">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
            ${avatarHtml(u, 60)}
            <div>
              <h3 style="font-size:1.1rem;font-weight:800">${escHtml(u.name)}</h3>
              <p style="font-size:.85rem;color:var(--gray-500)">${escHtml(u.email)}</p>
              <span class="badge ${u.status==='active'?'badge-success':'badge-danger'}" style="margin-top:4px">${u.status==='active'?'Đang hoạt động':'Đã khóa'}</span>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:18px">
            <div style="text-align:center;background:var(--gray-50);padding:12px;border-radius:var(--radius)">
              <div style="font-size:1.4rem;font-weight:800;color:var(--primary)">${stats.total}</div>
              <div style="font-size:.75rem;color:var(--gray-500)">Buổi học</div>
            </div>
            <div style="text-align:center;background:var(--gray-50);padding:12px;border-radius:var(--radius)">
              <div style="font-size:1.4rem;font-weight:800;color:var(--success)">${stats.present}</div>
              <div style="font-size:.75rem;color:var(--gray-500)">Có mặt</div>
            </div>
            <div style="text-align:center;background:var(--gray-50);padding:12px;border-radius:var(--radius)">
              <div style="font-size:1.4rem;font-weight:800;color:${stats.rate>=80?'var(--success)':stats.rate>=60?'var(--warning)':'var(--danger)'}">${stats.rate}%</div>
              <div style="font-size:.75rem;color:var(--gray-500)">Chuyên cần</div>
            </div>
          </div>
          <div style="margin-bottom:14px">
            <div class="confirm-field"><span>Mã HV</span><span>${u.studentId||'N/A'}</span></div>
            <div class="confirm-field"><span>Điện thoại</span><span>${u.phone||'–'}</span></div>
            <div class="confirm-field"><span>Ngày đăng ký</span><span>${formatDate(u.joinDate)}</span></div>
            <div class="confirm-field"><span>Lớp học</span><span>${classes.map(c=>c.name).join(', ')||'–'}</span></div>
          </div>
          <p style="font-size:.85rem;font-weight:700;color:var(--gray-700);margin-bottom:8px">Lịch sử điểm danh gần đây</p>
          ${attendHistory.map(a => {
            const s = getSessionById(a.sessionId);
            return s ? `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--gray-100);font-size:.85rem">
                <span>${escHtml(s.title)}</span>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="color:var(--gray-400)">${a.checkInTime}</span>
                  ${statusBadge(a.status)}
                </div>
              </div>
            ` : '';
          }).join('')}
          ${attendHistory.length === 0 ? '<p style="color:var(--gray-400);font-size:.85rem">Chưa có lịch sử.</p>' : ''}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  // =========================================================
  // CLASSES
  // =========================================================
  renderClasses() {
    return `
      <div style="max-width:900px">
        <div class="section-header">
          <div class="section-title"><i class="fa-solid fa-book-open"></i> Quản lý lớp học
            <span class="badge badge-primary" style="margin-left:6px">${DB.classes.length}</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="Admin.showAddClass()"><i class="fa-solid fa-plus"></i> Thêm lớp</button>
        </div>
        ${DB.classes.length === 0
          ? `<div class="empty-state"><i class="fa-solid fa-book-open"></i><p>Chưa có lớp học nào. Hãy tạo lớp đầu tiên!</p></div>`
          : DB.classes.map(cls => {
              const sessions = getSessionsForClass(cls.id);
              const students = DB.users.filter(u => u.role === 'student' && u.classes.includes(cls.id));
              const closed = sessions.filter(s => s.status === 'closed');
              const attended = DB.attendance.filter(a => closed.map(s => s.id).includes(a.sessionId)).length;
              const totalP = closed.length * students.length;
              const rate = totalP > 0 ? Math.round((attended / totalP) * 100) : 0;
              return `
                <div class="card" style="margin-bottom:16px">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
                    <div>
                      <h3 style="font-size:1.1rem;font-weight:800">${escHtml(cls.name)}</h3>
                      <p style="font-size:.85rem;color:var(--gray-500);margin-top:4px">
                        <i class="fa-solid fa-users"></i> ${students.length} học viên
                        ${cls.schedule.length ? `&nbsp;·&nbsp;<i class="fa-solid fa-calendar"></i> ${cls.schedule.join(' · ')}` : ''}
                      </p>
                      ${cls.meetLink ? `<p style="font-size:.82rem;margin-top:3px"><a href="${cls.meetLink}" target="_blank" style="color:var(--primary)"><i class="fa-brands fa-google"></i> ${cls.meetLink}</a></p>` : ''}
                    </div>
                    <span class="badge ${cls.status==='active'?'badge-success':'badge-gray'}">${cls.status==='active'?'Đang hoạt động':'Kết thúc'}</span>
                  </div>
                  <div style="display:flex;gap:20px;margin-bottom:12px;flex-wrap:wrap">
                    <div style="text-align:center;min-width:56px">
                      <div style="font-size:1.3rem;font-weight:800;color:var(--primary)">${sessions.length}</div>
                      <div style="font-size:.73rem;color:var(--gray-400)">Buổi học</div>
                    </div>
                    <div style="text-align:center;min-width:56px">
                      <div style="font-size:1.3rem;font-weight:800;color:var(--success)">${rate}%</div>
                      <div style="font-size:.73rem;color:var(--gray-400)">Chuyên cần</div>
                    </div>
                    <div style="text-align:center;min-width:56px">
                      <div style="font-size:1.3rem;font-weight:800;color:var(--info)">${students.length}</div>
                      <div style="font-size:.73rem;color:var(--gray-400)">Học viên</div>
                    </div>
                  </div>
                  <div class="progress-bar" style="margin-bottom:14px">
                    <div class="progress-fill ${rate>=80?'success':rate>=60?'warning':'danger'}" style="width:${rate}%"></div>
                  </div>
                  <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button class="btn btn-outline btn-sm" onclick="Admin.editClass('${cls.id}')"><i class="fa-solid fa-pen"></i> Sửa</button>
                    <button class="btn btn-ghost btn-sm" onclick="Admin.viewClassStudents('${cls.id}')"><i class="fa-solid fa-users"></i> Xem học viên</button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="Admin.deleteClass('${cls.id}')"><i class="fa-solid fa-trash"></i> Xóa</button>
                  </div>
                </div>
              `;
            }).join('')
        }
      </div>
    `;
  },

  showAddClass() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:500px">
        <div class="modal-header">
          <h3 style="font-weight:800">➕ Thêm lớp học mới</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">Tên lớp</label><input type="text" class="form-control" id="c-name" placeholder="VD: Toán 12" /></div>
          <div class="form-group"><label class="form-label">Link Google Meet</label><input type="url" class="form-control" id="c-meet" placeholder="https://meet.google.com/..." /></div>
          <div class="form-group"><label class="form-label">Lịch học (VD: T2 – 19:00, T5 – 19:00)</label><input type="text" class="form-control" id="c-schedule" placeholder="T2 – 19:00, T5 – 19:00" /></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost btn-sm" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
          <button class="btn btn-primary" onclick="Admin.saveNewClass()"><i class="fa-solid fa-check"></i> Tạo lớp</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  saveNewClass() {
    const name = document.getElementById('c-name').value.trim();
    const meetLink = document.getElementById('c-meet').value.trim();
    const schedule = document.getElementById('c-schedule').value.split(',').map(s => s.trim()).filter(Boolean);
    if (!name) { Toast.show('Vui lòng nhập tên lớp.', 'warning'); return; }
    DB.classes.push({ id: 'c' + Date.now(), name, teacherId: null, studentCount: 0, schedule, status: 'active', meetLink: meetLink || '', startDate: new Date().toISOString().split('T')[0] });
    document.querySelector('.modal-overlay').remove();
    Toast.show(`Đã tạo lớp ${name}.`, 'success');
    this.render('classes');
  },

  editClass(classId) {
    const cls = getClassById(classId);
    if (!cls) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:500px">
        <div class="modal-header">
          <h3 style="font-weight:800">✏️ Sửa lớp học</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">Tên lớp</label><input type="text" class="form-control" id="ec-name" value="${escHtml(cls.name)}" /></div>
          <div class="form-group"><label class="form-label">Link Google Meet</label><input type="url" class="form-control" id="ec-meet" value="${escHtml(cls.meetLink||'')}" /></div>
          <div class="form-group"><label class="form-label">Lịch học</label><input type="text" class="form-control" id="ec-schedule" value="${escHtml(cls.schedule.join(', '))}" /></div>
          <div class="form-group">
            <label class="form-label">Trạng thái</label>
            <select class="form-select" id="ec-status">
              <option value="active" ${cls.status==='active'?'selected':''}>Đang hoạt động</option>
              <option value="inactive" ${cls.status!=='active'?'selected':''}>Kết thúc</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost btn-sm" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
          <button class="btn btn-primary" onclick="Admin.saveEditClass('${classId}')"><i class="fa-solid fa-check"></i> Lưu</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  saveEditClass(classId) {
    const cls = getClassById(classId);
    if (!cls) return;
    cls.name = document.getElementById('ec-name').value.trim();
    cls.meetLink = document.getElementById('ec-meet').value.trim();
    cls.schedule = document.getElementById('ec-schedule').value.split(',').map(s => s.trim()).filter(Boolean);
    cls.status = document.getElementById('ec-status').value;
    document.querySelector('.modal-overlay').remove();
    Toast.show('Đã cập nhật lớp học.', 'success');
    this.render('classes');
  },

  deleteClass(classId) {
    const cls = getClassById(classId);
    if (!cls) return;
    showConfirmDialog('Xóa lớp học', `Xóa lớp "${cls.name}"? Dữ liệu liên quan sẽ bị xóa.`, () => {
      DB.classes.splice(DB.classes.findIndex(c => c.id === classId), 1);
      Toast.show(`Đã xóa lớp ${cls.name}.`, 'success');
      this.render('classes');
    });
  },

  viewClassStudents(classId) {
    const cls = getClassById(classId);
    const students = DB.users.filter(u => u.role === 'student' && u.classes.includes(classId));
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:560px;max-height:90vh;display:flex;flex-direction:column">
        <div class="modal-header">
          <h3 style="font-weight:800">👥 Học viên – ${escHtml(cls.name)}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="overflow-y:auto">
          ${students.map(u => {
            const stats = getStudentStats(u.id);
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--gray-100)">
                <div style="display:flex;align-items:center;gap:10px">
                  ${avatarHtml(u, 36)}
                  <div>
                    <div style="font-weight:600;font-size:.9rem">${escHtml(u.name)}</div>
                    <div style="font-size:.78rem;color:var(--gray-400)">${escHtml(u.email)}</div>
                  </div>
                </div>
                <div style="text-align:right">
                  <div style="font-weight:700;color:${stats.rate>=80?'var(--success)':stats.rate>=60?'var(--warning)':'var(--danger)'}">${stats.rate}%</div>
                  <div style="font-size:.75rem;color:var(--gray-400)">${stats.present}/${stats.total} buổi</div>
                </div>
              </div>
            `;
          }).join('')}
          ${students.length === 0 ? '<p style="color:var(--gray-400);text-align:center;padding:20px">Chưa có học viên.</p>' : ''}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  // =========================================================
  // SESSIONS – quản lý buổi học
  // =========================================================
  renderSessions() {
    const sessions = DB.sessions.sort((a, b) => b.date.localeCompare(a.date));
    return `
      <div style="max-width:980px">
        <div class="section-header">
          <div class="section-title"><i class="fa-solid fa-calendar-days"></i> Quản lý buổi học
            <span class="badge badge-primary" style="margin-left:6px">${sessions.length}</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="App.navigate('create')"><i class="fa-solid fa-plus"></i> Tạo buổi học</button>
        </div>
        ${sessions.length === 0
          ? `<div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i><p>Chưa có buổi học nào.</p></div>`
          : sessions.map(s => this.renderSessionCard(s)).join('')
        }
      </div>
    `;
  },

  renderSessionCard(session) {
    const cls = getClassById(session.classId);
    const attendList = getAttendanceForSession(session.id);
    const students = cls ? DB.users.filter(u => u.role === 'student' && u.classes.includes(cls.id)) : [];
    const presentCount = attendList.filter(a => a.status === 'present').length;
    const lateCount = attendList.filter(a => a.status === 'late').length;

    return `
      <div class="session-card">
        <div class="session-card-header">
          <div>
            <div class="session-card-title">📚 ${escHtml(session.title)}</div>
            <div class="session-card-meta">
              <span><i class="fa-regular fa-calendar"></i> ${formatDate(session.date)}</span>
              <span><i class="fa-regular fa-clock"></i> ${session.startTime} – ${session.endTime}</span>
              ${cls ? `<span><i class="fa-solid fa-chalkboard"></i> ${escHtml(cls.name)}</span>` : ''}
              <span><i class="fa-solid fa-users"></i> ${students.length} học viên</span>
            </div>
          </div>
          ${sessionStatusBadge(session.status)}
        </div>

        <div class="attend-row" style="margin-bottom:14px">
          <div class="attend-item green"><div class="attend-num">${presentCount}</div><div class="attend-label">🟢 Có mặt</div></div>
          <div class="attend-item yellow"><div class="attend-num">${lateCount}</div><div class="attend-label">🟡 Đi muộn</div></div>
          <div class="attend-item red"><div class="attend-num">${Math.max(0, students.length - presentCount - lateCount)}</div><div class="attend-label">🔴 Chưa điểm danh</div></div>
        </div>

        <div class="session-card-actions">
          ${session.status === 'pending' ? `
            <button class="btn btn-success btn-sm" onclick="Admin.openAttendance('${session.id}')">
              <i class="fa-solid fa-door-open"></i> Mở điểm danh
            </button>
          ` : ''}
          ${session.status === 'open' ? `
            <button class="btn btn-warning btn-sm" onclick="Admin.showCode('${session.id}')">
              <i class="fa-solid fa-hashtag"></i> Hiện mã
            </button>
            <button class="btn btn-danger btn-sm" onclick="Admin.closeAttendance('${session.id}')">
              <i class="fa-solid fa-door-closed"></i> Đóng điểm danh
            </button>
          ` : ''}
          <button class="btn btn-outline btn-sm" onclick="Admin.viewSessionDetail('${session.id}')">
            <i class="fa-solid fa-eye"></i> Chi tiết
          </button>
          <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="Admin.deleteSession('${session.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  },

  // =========================================================
  // CREATE SESSION
  // =========================================================
  renderCreate() {
    const today = new Date().toISOString().split('T')[0];
    return `
      <div style="max-width:560px">
        <div class="section-header">
          <div class="section-title"><i class="fa-solid fa-circle-plus"></i> Tạo buổi học mới</div>
        </div>
        <div class="card">
          <div class="form-group">
            <label class="form-label">Lớp học</label>
            <select class="form-select" id="new-class">
              <option value="">-- Chọn lớp --</option>
              ${DB.classes.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tên buổi học</label>
            <input type="text" class="form-control" id="new-title" placeholder="VD: Toán 12 – Hàm số" />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div class="form-group">
              <label class="form-label">Ngày học</label>
              <input type="date" class="form-control" id="new-date" value="${today}" />
            </div>
            <div class="form-group">
              <label class="form-label">Giờ bắt đầu</label>
              <input type="time" class="form-control" id="new-start" value="21:00" />
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div class="form-group">
              <label class="form-label">Giờ kết thúc</label>
              <input type="time" class="form-control" id="new-end" value="22:30" />
            </div>
            <div class="form-group">
              <label class="form-label">Mở điểm danh trước (phút)</label>
              <input type="number" class="form-control" id="new-open-before" value="20" min="0" max="60" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Đóng điểm danh sau khi bắt đầu (phút)</label>
            <input type="number" class="form-control" id="new-close-after" value="30" min="5" max="120" />
          </div>
          <button class="btn btn-primary btn-block btn-lg" onclick="Admin.createSession()">
            <i class="fa-solid fa-calendar-plus"></i> TẠO BUỔI HỌC
          </button>
        </div>
      </div>
    `;
  },

  createSession() {
    const classId = document.getElementById('new-class').value;
    const title = document.getElementById('new-title').value.trim();
    const date = document.getElementById('new-date').value;
    const startTime = document.getElementById('new-start').value;
    const endTime = document.getElementById('new-end').value;
    const openBefore = parseInt(document.getElementById('new-open-before').value) || 20;
    const closeAfter = parseInt(document.getElementById('new-close-after').value) || 30;

    if (!classId) { Toast.show('Vui lòng chọn lớp học.', 'warning'); return; }
    if (!title) { Toast.show('Vui lòng nhập tên buổi học.', 'warning'); return; }
    if (!date || !startTime || !endTime) { Toast.show('Vui lòng nhập đầy đủ thời gian.', 'warning'); return; }

    const [sh, sm] = startTime.split(':').map(Number);
    const toTime = (totalMin) => {
      const h = Math.floor(((totalMin % 1440) + 1440) / 60 % 24);
      const m = ((totalMin % 60) + 60) % 60;
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    };
    const baseMin = sh * 60 + sm;

    DB.sessions.push({
      id: 's' + Date.now(), classId, title, date, startTime, endTime,
      attendanceOpen: toTime(baseMin - openBefore),
      attendanceClose: toTime(baseMin + closeAfter),
      status: 'pending',
      code: generateCode(),
      codeExpiry: 0
    });
    Toast.show('Tạo buổi học thành công!', 'success');
    App.navigate('sessions');
  },

  // =========================================================
  // ATTENDANCE ACTIONS
  // =========================================================
  openAttendance(sessionId) {
    const s = getSessionById(sessionId);
    if (!s) return;
    s.status = 'open';
    s.code = generateCode();
    s.codeExpiry = Date.now() + 120000;
    Toast.show('Đã mở điểm danh!', 'success');
    this.render(this.activeTab);
  },

  closeAttendance(sessionId) {
    showConfirmDialog('Đóng điểm danh', 'Bạn có chắc muốn đóng điểm danh buổi học này?', () => {
      const s = getSessionById(sessionId);
      if (s) { s.status = 'closed'; Toast.show('Đã đóng điểm danh.', 'info'); this.render(this.activeTab); }
    });
  },

  deleteSession(sessionId) {
    showConfirmDialog('Xóa buổi học', 'Bạn có chắc muốn xóa buổi học này?', () => {
      const idx = DB.sessions.findIndex(s => s.id === sessionId);
      if (idx > -1) DB.sessions.splice(idx, 1);
      Toast.show('Đã xóa buổi học.', 'success');
      this.render('sessions');
    });
  },

  showCode(sessionId) {
    const session = getSessionById(sessionId);
    if (!session) return;
    const cls = getClassById(session.classId);
    const students = cls ? DB.users.filter(u => u.role === 'student' && u.classes.includes(cls.id)) : [];

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'code-modal';
    overlay.innerHTML = `
      <div class="modal" style="max-width:380px">
        <div class="modal-header">
          <h3 style="font-weight:800">🔑 Mã điểm danh</h3>
          <button class="modal-close" onclick="document.getElementById('code-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="text-align:center;padding:28px">
          <p style="font-size:.85rem;color:var(--gray-500);margin-bottom:8px">${escHtml(session.title)}</p>
          <div class="qr-code-num" id="code-display">${session.code}</div>
          <div class="qr-timer">⏱ Mã thay đổi sau: <span id="code-countdown">${msToMMSS(Math.max(0, session.codeExpiry - Date.now()))}</span></div>
          <div style="margin-top:8px;font-size:.9rem;color:var(--gray-600)">
            Đã điểm danh: <strong style="color:var(--success)" id="code-attend-count">${getAttendanceForSession(sessionId).length}</strong> / ${students.length}
          </div>
        </div>
        <div class="modal-footer" style="justify-content:center">
          <button class="btn btn-warning" onclick="Admin.refreshCode('${sessionId}')">
            <i class="fa-solid fa-rotate"></i> Làm mới mã
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const t = setInterval(() => {
      const el = document.getElementById('code-countdown');
      const codeEl = document.getElementById('code-display');
      const countEl = document.getElementById('code-attend-count');
      if (!el) { clearInterval(t); return; }
      const s = getSessionById(sessionId);
      const rem = s.codeExpiry - Date.now();
      if (rem <= 0) {
        s.code = generateCode(); s.codeExpiry = Date.now() + 120000;
        if (codeEl) codeEl.textContent = s.code;
        el.textContent = '02:00';
      } else {
        el.textContent = msToMMSS(rem);
      }
      if (countEl) countEl.textContent = getAttendanceForSession(sessionId).length;
    }, 1000);
    this.timers.push(t);
  },

  refreshCode(sessionId) {
    const s = getSessionById(sessionId);
    if (!s) return;
    s.code = generateCode(); s.codeExpiry = Date.now() + 120000;
    const el = document.getElementById('code-display');
    if (el) el.textContent = s.code;
    Toast.show('Đã làm mới mã.', 'success');
  },

  showQR(sessionId) {},
  refreshQR(sessionId) {},

  viewSessionDetail(sessionId) {
    const session = getSessionById(sessionId);
    if (!session) return;
    const cls = getClassById(session.classId);
    const students = cls ? DB.users.filter(u => u.role === 'student' && u.classes.includes(cls.id)) : [];
    const attendList = getAttendanceForSession(sessionId);
    const present = attendList.filter(a => a.status === 'present').length;
    const late = attendList.filter(a => a.status === 'late').length;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:600px;max-height:90vh;display:flex;flex-direction:column">
        <div class="modal-header">
          <h3 style="font-weight:800">📋 Chi tiết – ${escHtml(session.title)}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="overflow-y:auto">
          <div class="attend-row" style="margin-bottom:16px">
            <div class="attend-item green"><div class="attend-num">${present}</div><div class="attend-label">🟢 Có mặt</div></div>
            <div class="attend-item yellow"><div class="attend-num">${late}</div><div class="attend-label">🟡 Đi muộn</div></div>
            <div class="attend-item red"><div class="attend-num">${Math.max(0, students.length - present - late)}</div><div class="attend-label">🔴 Vắng</div></div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Học viên</th><th>Gmail</th><th>Giờ vào</th><th>Trạng thái</th></tr></thead>
              <tbody>
                ${students.map(u => {
                  const a = attendList.find(x => x.userId === u.id);
                  return `
                    <tr>
                      <td><div style="display:flex;align-items:center;gap:8px">${avatarHtml(u,28)} ${escHtml(u.name)}</div></td>
                      <td style="font-size:.82rem;color:var(--gray-500)">${escHtml(u.email)}</td>
                      <td>${a ? a.checkInTime : '–'}</td>
                      <td>${a ? statusBadge(a.status) : statusBadge('absent')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          ${students.length === 0 ? '<div class="empty-state" style="padding:20px"><i class="fa-solid fa-users-slash"></i><p>Chưa có học viên trong lớp này.</p></div>' : ''}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  // =========================================================
  // LIVE ATTENDANCE
  // =========================================================
  renderLive() {
    const openSessions = DB.sessions.filter(s => s.status === 'open');

    if (openSessions.length === 0) {
      return `
        <div style="max-width:600px">
          <div class="section-title" style="margin-bottom:20px"><i class="fa-solid fa-signal"></i> Điểm danh Live</div>
          <div class="empty-state">
            <i class="fa-solid fa-door-closed"></i>
            <p>Hiện không có buổi học nào đang mở điểm danh.</p>
            <button class="btn btn-primary" style="margin-top:16px" onclick="App.navigate('sessions')">Đến trang buổi học</button>
          </div>
        </div>
      `;
    }

    const session = openSessions[0];
    const cls = getClassById(session.classId);
    const students = cls ? DB.users.filter(u => u.role === 'student' && u.classes.includes(cls.id)) : [];
    const attendList = getAttendanceForSession(session.id);

    return `
      <div style="max-width:860px">
        <div class="section-header">
          <div class="section-title">
            <div class="live-dot"></div>
            Điểm danh Live – ${escHtml(session.title)}
          </div>
          ${sessionStatusBadge(session.status)}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
              <h3 style="font-size:.95rem;font-weight:700">Đã điểm danh</h3>
              <span class="badge badge-success" id="live-count">${attendList.length}/${students.length}</span>
            </div>
            <div class="student-attend-list" id="live-list">
              ${this.renderLiveList(session.id, students)}
            </div>
          </div>
          <div class="card">
            <div style="margin-bottom:14px"><h3 style="font-size:.95rem;font-weight:700">Chưa điểm danh</h3></div>
            <div class="student-attend-list" id="missing-list">
              ${this.renderMissingList(session.id, students)}
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:16px">
          <div class="attend-row">
            <div class="attend-item green"><div class="attend-num" id="live-present">${attendList.filter(a=>a.status==='present').length}</div><div class="attend-label">🟢 Có mặt</div></div>
            <div class="attend-item yellow"><div class="attend-num" id="live-late">${attendList.filter(a=>a.status==='late').length}</div><div class="attend-label">🟡 Đi muộn</div></div>
            <div class="attend-item red"><div class="attend-num" id="live-missing">${Math.max(0, students.length - attendList.length)}</div><div class="attend-label">🔴 Chưa điểm danh</div></div>
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
          <button class="btn btn-warning" onclick="Admin.showCode('${session.id}')"><i class="fa-solid fa-hashtag"></i> Hiện mã</button>
          <button class="btn btn-danger" onclick="Admin.closeAttendance('${session.id}')"><i class="fa-solid fa-door-closed"></i> Đóng điểm danh</button>
        </div>
      </div>
    `;
  },

  renderLiveList(sessionId, students) {
    const attendList = getAttendanceForSession(sessionId);
    if (attendList.length === 0) return `<div style="color:var(--gray-400);font-size:.85rem;text-align:center;padding:20px">Chưa có ai điểm danh</div>`;
    return attendList.map(a => {
      const u = getUserById(a.userId);
      if (!u) return '';
      return `
        <div class="student-attend-item">
          <div style="display:flex;align-items:center;gap:8px">
            ${avatarHtml(u, 30)}
            <div><div class="name">${escHtml(u.name)}</div><div class="time">${a.checkInTime}</div></div>
          </div>
          ${statusBadge(a.status)}
        </div>
      `;
    }).join('');
  },

  renderMissingList(sessionId, students) {
    const attendedIds = getAttendanceForSession(sessionId).map(a => a.userId);
    const missing = students.filter(u => !attendedIds.includes(u.id));
    if (missing.length === 0) return `<div style="color:var(--success);font-size:.85rem;text-align:center;padding:20px">✅ Tất cả đã điểm danh!</div>`;
    return missing.map(u => `
      <div class="student-attend-item">
        <div style="display:flex;align-items:center;gap:8px">${avatarHtml(u, 30)}<span class="name">${escHtml(u.name)}</span></div>
        <span class="badge badge-danger">Chưa điểm danh</span>
      </div>
    `).join('');
  },

  startLiveUpdates() {
    const t = setInterval(() => {
      const liveList = document.getElementById('live-list');
      if (!liveList) { clearInterval(t); return; }
      const openSession = DB.sessions.find(s => s.status === 'open');
      if (!openSession) { clearInterval(t); return; }
      const cls = getClassById(openSession.classId);
      const students = cls ? DB.users.filter(u => u.role === 'student' && u.classes.includes(cls.id)) : [];
      const attendList = getAttendanceForSession(openSession.id);

      liveList.innerHTML = this.renderLiveList(openSession.id, students);
      const missingList = document.getElementById('missing-list');
      if (missingList) missingList.innerHTML = this.renderMissingList(openSession.id, students);
      const liveCount = document.getElementById('live-count');
      if (liveCount) liveCount.textContent = `${attendList.length}/${students.length}`;
      const livePresent = document.getElementById('live-present');
      if (livePresent) livePresent.textContent = attendList.filter(a => a.status === 'present').length;
      const liveLate = document.getElementById('live-late');
      if (liveLate) liveLate.textContent = attendList.filter(a => a.status === 'late').length;
      const liveMissing = document.getElementById('live-missing');
      if (liveMissing) liveMissing.textContent = Math.max(0, students.length - attendList.length);
    }, 3000);
    this.timers.push(t);
  },

  // =========================================================
  // HISTORY
  // =========================================================
  renderHistory() {
    const f = this.historyFilter;
    let sessions = DB.sessions.filter(s => s.status === 'closed');
    if (f.class !== 'all') sessions = sessions.filter(s => s.classId === f.class);

    const rows = [];
    DB.users.filter(u => u.role === 'student').forEach(u => {
      const userSessions = sessions.filter(s => {
        const cls = getClassById(s.classId);
        return cls && u.classes.includes(cls.id);
      });
      if (userSessions.length === 0) return;
      const present = DB.attendance.filter(a => userSessions.map(s => s.id).includes(a.sessionId) && a.userId === u.id && a.status === 'present').length;
      const late = DB.attendance.filter(a => userSessions.map(s => s.id).includes(a.sessionId) && a.userId === u.id && a.status === 'late').length;
      const absent = userSessions.length - present - late;
      const rate = userSessions.length > 0 ? Math.round(((present + late) / userSessions.length) * 100) : 0;
      if (f.status === 'warning' && rate >= 70) return;
      rows.push({ u, present, late, absent, rate, total: userSessions.length });
    });

    return `
      <div style="max-width:1000px">
        <div class="section-header">
          <div class="section-title"><i class="fa-solid fa-clock-rotate-left"></i> Lịch sử điểm danh</div>
          <button class="btn btn-success btn-sm" onclick="Admin.exportCSV()"><i class="fa-solid fa-file-excel"></i> Xuất Excel</button>
        </div>
        <div class="filter-bar">
          <select class="form-select" style="width:auto" onchange="Admin.historyFilter.class=this.value;Admin.render('history')">
            <option value="all" ${f.class==='all'?'selected':''}>Tất cả lớp</option>
            ${DB.classes.map(c => `<option value="${c.id}" ${f.class===c.id?'selected':''}>${escHtml(c.name)}</option>`).join('')}
          </select>
          <select class="form-select" style="width:auto" onchange="Admin.historyFilter.status=this.value;Admin.render('history')">
            <option value="all" ${f.status==='all'?'selected':''}>Tất cả</option>
            <option value="warning" ${f.status==='warning'?'selected':''}>⚠️ Dưới 70%</option>
          </select>
        </div>
        <div class="card">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr><th>Học viên</th><th>Lớp</th><th>Có mặt</th><th>Muộn</th><th>Vắng</th><th>Tổng</th><th>Tỷ lệ</th></tr>
              </thead>
              <tbody>
                ${rows.map(({ u, present, late, absent, rate, total }) => {
                  const classes = DB.classes.filter(c => u.classes.includes(c.id) && (f.class === 'all' || c.id === f.class));
                  return `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px">
                          ${avatarHtml(u, 28)}
                          <div>
                            <div style="font-weight:600;font-size:.88rem">${escHtml(u.name)}</div>
                            <div style="font-size:.75rem;color:var(--gray-400)">${u.studentId||''}</div>
                          </div>
                        </div>
                      </td>
                      <td style="font-size:.82rem">${classes.map(c=>`<span class="badge badge-info" style="margin:1px">${escHtml(c.name)}</span>`).join('')}</td>
                      <td><span style="color:var(--success);font-weight:700">${present}</span></td>
                      <td><span style="color:var(--warning);font-weight:700">${late}</span></td>
                      <td><span style="color:var(--danger);font-weight:700">${Math.max(0,absent)}</span></td>
                      <td>${total}</td>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px">
                          <div style="flex:1;height:6px;background:var(--gray-200);border-radius:3px;min-width:60px">
                            <div style="height:100%;border-radius:3px;width:${rate}%;background:${rate>=80?'var(--success)':rate>=60?'var(--warning)':'var(--danger)'}"></div>
                          </div>
                          <span style="font-weight:700;color:${rate>=80?'var(--success)':rate>=60?'var(--warning)':'var(--danger)'}">${rate}%</span>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          ${rows.length === 0 ? '<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>Không có dữ liệu.</p></div>' : ''}
        </div>
      </div>
    `;
  },

  exportCSV() {
    const rows = [['Họ tên','Mã HV','Gmail','Lớp','Có mặt','Muộn','Vắng','Tỷ lệ']];
    DB.users.filter(u => u.role === 'student').forEach(u => {
      const sessions = DB.sessions.filter(s => { const c = getClassById(s.classId); return c && u.classes.includes(c.id) && s.status === 'closed'; });
      const present = DB.attendance.filter(a => sessions.map(s=>s.id).includes(a.sessionId) && a.userId===u.id && a.status==='present').length;
      const late = DB.attendance.filter(a => sessions.map(s=>s.id).includes(a.sessionId) && a.userId===u.id && a.status==='late').length;
      const absent = sessions.length - present - late;
      const rate = sessions.length > 0 ? Math.round(((present+late)/sessions.length)*100) : 0;
      rows.push([u.name, u.studentId||'', u.email, DB.classes.filter(c=>u.classes.includes(c.id)).map(c=>c.name).join('; '), present, late, absent, rate+'%']);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'}));
    a.download = 'diem_danh_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    Toast.show('Đã xuất file CSV!', 'success');
  },

  // =========================================================
  // WARNINGS
  // =========================================================
  renderWarnings() {
    const unread = DB.warnings.filter(w => !w.read);
    const read = DB.warnings.filter(w => w.read);
    return `
      <div style="max-width:780px">
        <div class="section-header">
          <div class="section-title"><i class="fa-solid fa-triangle-exclamation" style="color:var(--warning)"></i> Cảnh báo hệ thống</div>
          <div style="display:flex;gap:8px">
            <span class="badge badge-warning">${unread.length} chưa đọc</span>
            <button class="btn btn-ghost btn-sm" onclick="Admin.markAllRead()">Đánh dấu đã đọc</button>
          </div>
        </div>
        ${unread.length > 0 ? `
          <h3 style="font-size:.9rem;font-weight:700;color:var(--gray-600);margin-bottom:10px">🔴 Chưa đọc (${unread.length})</h3>
          ${unread.map(w => this.renderWarningCard(w)).join('')}
        ` : ''}
        ${read.length > 0 ? `
          <h3 style="font-size:.9rem;font-weight:700;color:var(--gray-400);margin-top:20px;margin-bottom:10px">✅ Đã đọc (${read.length})</h3>
          ${read.map(w => this.renderWarningCard(w, true)).join('')}
        ` : ''}
        ${DB.warnings.length === 0 ? '<div class="empty-state"><i class="fa-solid fa-check-circle" style="color:var(--success)"></i><p>Không có cảnh báo nào.</p></div>' : ''}
        <div class="card" style="margin-top:24px;padding:16px">
          <p style="font-size:.85rem;font-weight:600;color:var(--gray-700);margin-bottom:10px">⚙️ Kiểm tra tự động</p>
          <button class="btn btn-warning btn-sm" onclick="Admin.checkWarnings()"><i class="fa-solid fa-rotate"></i> Kiểm tra cảnh báo ngay</button>
        </div>
      </div>
    `;
  },

  renderWarningCard(w, muted = false) {
    const icons = { absent_streak:'⚠️', low_rate:'📉', missing_today:'🔔' };
    return `
      <div class="warning-card" style="${muted?'opacity:.6':''}">
        <span style="font-size:1.2rem">${icons[w.type]||'⚠️'}</span>
        <div style="flex:1">
          <p style="font-size:.88rem;color:${muted?'var(--gray-500)':'#92400e'};font-weight:${muted?'400':'500'}">${escHtml(w.message)}</p>
          <p style="font-size:.75rem;color:var(--gray-400);margin-top:2px">${formatDate(w.date)}</p>
        </div>
        ${!w.read ? `<button class="btn btn-ghost btn-sm" onclick="Admin.markRead('${w.id}')"><i class="fa-solid fa-check"></i></button>` : ''}
      </div>
    `;
  },

  markRead(id) { const w = DB.warnings.find(x => x.id === id); if (w) { w.read = true; this.render('warnings'); } },
  markAllRead() { DB.warnings.forEach(w => { w.read = true; }); Toast.show('Đã đánh dấu tất cả đã đọc.', 'success'); this.render('warnings'); },

  checkWarnings() {
    let newCount = 0;
    DB.users.filter(u => u.role === 'student' && u.status === 'active').forEach(u => {
      const stats = getStudentStats(u.id);
      if (stats.total > 0 && stats.rate < 70 && !DB.warnings.find(w => w.userId === u.id && w.type === 'low_rate' && !w.read)) {
        DB.warnings.push({ id: 'w'+Date.now()+u.id, userId: u.id, type: 'low_rate', message: `${u.name} có tỷ lệ chuyên cần ${stats.rate}% (dưới 70%).`, date: new Date().toISOString().split('T')[0], read: false });
        newCount++;
      }
    });
    Toast.show(newCount > 0 ? `Phát hiện ${newCount} cảnh báo mới.` : 'Không có cảnh báo mới.', newCount > 0 ? 'warning' : 'success');
    this.render('warnings');
  }
};
