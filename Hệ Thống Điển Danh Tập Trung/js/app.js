// ===== MAIN APP =====
const App = {
  currentPage: null,

  init() {
    this.render();
  },

  render() {
    if (!Auth.isLoggedIn()) {
      document.getElementById('app').innerHTML = renderLoginPage();
    } else {
      this.showDashboard();
    }
  },

  showDashboard() {
    const user = Auth.currentUser;
    this.currentPage = 'dashboard';
    if (user.role === 'student') Student.render('dashboard');
    else Admin.render('dashboard');
  },

  navigate(page) {
    const user = Auth.currentUser;
    if (!user) return;
    this.currentPage = page;
    if (user.role === 'student') Student.render(page);
    else Admin.render(page);

    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
  },

  logout() {
    showConfirmDialog('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', () => {
      Auth.logout();
      document.getElementById('app').innerHTML = renderLoginPage();
      Toast.show('Đã đăng xuất thành công.', 'info');
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
