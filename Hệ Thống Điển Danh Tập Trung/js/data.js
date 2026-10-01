// ===== MOCK DATABASE =====
const DB = {
  users: [
    {
      id: 'u1',
      name: 'Admin Hệ Thống',
      email: 'admin@gmail.com',
      phone: '',
      role: 'admin',
      status: 'active',
      classes: [],
      joinDate: new Date().toISOString().split('T')[0],
      avatar: '#6366f1'
    }
  ],

  passwords: {
    'admin@gmail.com': 'admin123'
  },

  classes: [],
  sessions: [],
  attendance: [],
  warnings: []
};

// ===== HELPER FUNCTIONS =====
function getUserById(id)              { return DB.users.find(u => u.id === id); }
function getClassById(id)             { return DB.classes.find(c => c.id === id); }
function getSessionById(id)           { return DB.sessions.find(s => s.id === id); }
function getAttendanceForSession(sid) { return DB.attendance.filter(a => a.sessionId === sid); }
function getAttendanceForUser(uid)    { return DB.attendance.filter(a => a.userId === uid); }
function getSessionsForClass(cid)     { return DB.sessions.filter(s => s.classId === cid); }
function getClassesForTeacher(tid)    { return DB.classes.filter(c => c.teacherId === tid); }

function getClassesForStudent(studentId) {
  const user = getUserById(studentId);
  if (!user) return [];
  return DB.classes.filter(c => user.classes.includes(c.id));
}

function getTodaySessions(userId, role) {
  const today = new Date().toISOString().split('T')[0];
  if (role === 'student') {
    const user = getUserById(userId);
    return DB.sessions.filter(s => s.date === today && user && user.classes.includes(s.classId));
  } else if (role === 'teacher') {
    const teacherClasses = getClassesForTeacher(userId).map(c => c.id);
    return DB.sessions.filter(s => s.date === today && teacherClasses.includes(s.classId));
  }
  return DB.sessions.filter(s => s.date === today);
}

function getStudentStats(userId) {
  const user = getUserById(userId);
  if (!user) return { total: 0, present: 0, rate: 0 };
  const sessionIds = DB.sessions
    .filter(s => user.classes.includes(s.classId) && s.status === 'closed')
    .map(s => s.id);
  const total = sessionIds.length;
  const present = DB.attendance.filter(a =>
    sessionIds.includes(a.sessionId) &&
    a.userId === userId &&
    (a.status === 'present' || a.status === 'late')
  ).length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
  return { total, present, rate };
}

function hasAttended(sessionId, userId) {
  return DB.attendance.some(a => a.sessionId === sessionId && a.userId === userId);
}

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function getAvatarColor(name) {
  const colors = ['#4f46e5','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#14b8a6','#6366f1'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
