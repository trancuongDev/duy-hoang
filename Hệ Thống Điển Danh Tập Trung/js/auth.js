// ===== AUTH MODULE =====
const Auth = {
  currentUser: null,

  login(email, password) {
    const user = DB.users.find(u => u.email === email.trim().toLowerCase());
    if (!user) return { ok: false, msg: 'Không tìm thấy tài khoản Gmail này.' };
    if (user.status === 'inactive') return { ok: false, msg: 'Tài khoản đã bị khóa. Liên hệ admin.' };
    if (DB.passwords[email] !== password) return { ok: false, msg: 'Mật khẩu không đúng.' };
    this.currentUser = user;
    return { ok: true, user };
  },

  logout() {
    this.currentUser = null;
  },

  isLoggedIn() {
    return !!this.currentUser;
  },

  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }
};
