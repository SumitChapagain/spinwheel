// ================= STORAGE & CONFIG =================
const STORAGE_KEYS = {
  auth: 'spinwheel_auth',
  school: 'spinwheel_school',
  wheel: 'spinwheel_wheel',
  stats: 'spinwheel_stats'
};

const DEFAULT_CREDENTIALS = {
  user: { username: 'user', password: 'user123' },
  admin: { username: 'admin', password: 'admin123' }
};

const DEFAULT_WHEEL = [
  { label: 'Eraser', percentage: 16 },
  { label: 'Pen', percentage: 5 },
  { label: 'Pencil', percentage: 5 },
  { label: 'Try Again', percentage: 47 },
  { label: 'Sharpner', percentage: 16 },
  { label: 'Chocofun', percentage: 11 }
];

const PIE_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#5956E9', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'];

// ================= HELPERS =================
function getSchoolConfig() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEYS.school));
    return d || { name: 'My School', logo: 'https://via.placeholder.com/100?text=Logo' };
  } catch {
    return { name: 'My School', logo: 'https://via.placeholder.com/100?text=Logo' };
  }
}

function saveSchoolConfig(config) {
  localStorage.setItem(STORAGE_KEYS.school, JSON.stringify(config));
}

function getWheelConfig() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEYS.wheel));
    if (d && Array.isArray(d.items) && d.items.length > 0) return d;
  } catch {}
  return { items: JSON.parse(JSON.stringify(DEFAULT_WHEEL)) };
}

function saveWheelConfigToStorage(config) {
  localStorage.setItem(STORAGE_KEYS.wheel, JSON.stringify(config));
}

function getStats() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEYS.stats));
    return d || {};
  } catch {
    return {};
  }
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
}

// ================= AUTH =================
function login(username, password, role) {
  const cred = DEFAULT_CREDENTIALS[role];
  if (cred && username === cred.username && password === cred.password) {
    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify({ role, loggedIn: true }));
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.auth);
  showScreen('loginScreen');
}

function getAuth() {
  try {
    const a = JSON.parse(localStorage.getItem(STORAGE_KEYS.auth));
    return a?.loggedIn ? a : null;
  } catch {
    return null;
  }
}

// ================= SCREENS =================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');

  if (id === 'userScreen') initUserView();
  if (id === 'adminScreen') initAdminView();
}

// ================= LOGIN =================
document.addEventListener('DOMContentLoaded', () => {
  const auth = getAuth();
  if (auth) {
    showScreen(auth.role === 'admin' ? 'adminScreen' : 'userScreen');
  } else {
    showScreen('loginScreen');
  }

  document.querySelectorAll('.role-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.role-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('loginRole').value = btn.dataset.role;
    });
  });

  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const role = document.getElementById('loginRole').value;
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (login(username, password, role)) {
      showScreen(role === 'admin' ? 'adminScreen' : 'userScreen');
    } else {
      alert('Invalid username or password');
    }
  });
});

// ================= USER VIEW =================
let chartUser = null;
let currentRotationUser = 0;

function initUserView() {
  const school = getSchoolConfig();
  document.getElementById('userSchoolName').textContent = school.name;
  document.getElementById('userSchoolLogo').src = school.logo;

  const wheelConfig = getWheelConfig();
  const prizes = wheelConfig.items.map(i => i.label);
  const weights = wheelConfig.items.map(i => i.percentage);
  const colors = PIE_COLORS.slice(0, prizes.length);

  const canvas = document.getElementById('wheelUser');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (chartUser) chartUser.destroy();

  chartUser = new Chart(canvas, {
    plugins: [ChartDataLabels],
    type: 'pie',
    data: {
      labels: prizes,
      datasets: [{
        backgroundColor: colors,
        data: prizes.map(() => 1),
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 0 },
      plugins: {
        tooltip: false,
        legend: { display: false },
        datalabels: {
          color: '#fff',
          formatter: (_, ctx) => ctx.chart.data.labels[ctx.dataIndex],
          font: { size: 14, weight: 'bold' },
          anchor: 'center',
          align: 'center',
          rotation: ctx => {
            const meta = ctx.chart.getDatasetMeta(0).data[ctx.dataIndex];
            const mid = meta.startAngle + (meta.endAngle - meta.startAngle) / 2;
            return mid * (180 / Math.PI) + 90;
          }
        }
      }
    }
  });

  const spinBtn = document.getElementById('spinBtnUser');
  const wheelInner = document.getElementById('wheelCircleUser');
  const resultMsg = document.getElementById('resultMsgUser');

  spinBtn.onclick = () => spinWheelUser(prizes, weights, wheelInner, spinBtn, resultMsg);
  updateStatsUser();
}

function spinWheelUser(prizes, weights, wheelInner, spinBtn, resultMsg) {
  spinBtn.disabled = true;
  resultMsg.textContent = 'Spinning...';
  wheelInner.classList.add('spinning');

  try {
    new Audio('images/spin_sound.mp3').play().catch(() => {});
  } catch {}

  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let r = Math.random() * total;
  let targetIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      targetIndex = i;
      break;
    }
  }

  const degPerSlice = 360 / prizes.length;
  const targetAngle = targetIndex * degPerSlice + degPerSlice * 0.5;
  const pointerPos = 90;
  const targetFinal = (360 + pointerPos - targetAngle) % 360;
  const fullSpins = 5 + Math.floor(Math.random() * 3);
  const finalRot = fullSpins * 360 + targetFinal;
  const dist = finalRot - (currentRotationUser % 360);
  currentRotationUser += dist;

  wheelInner.style.transform = `rotate(${currentRotationUser}deg)`;

  wheelInner.addEventListener('transitionend', function handler() {
    wheelInner.removeEventListener('transitionend', handler);
    spinBtn.disabled = false;
    wheelInner.classList.remove('spinning');

    const eff = currentRotationUser % 360;
    const angleAtPointer = (360 - eff + 90) % 360;
    const idx = Math.floor(angleAtPointer / degPerSlice) % prizes.length;
    const winner = prizes[idx];

    resultMsg.style.transform = 'scale(1.15)';
    resultMsg.style.color = 'var(--gold)';
    resultMsg.textContent = `🎊 Result: ${winner} 🎊`;
    setTimeout(() => {
      resultMsg.style.transform = '';
      resultMsg.style.color = '';
    }, 500);

    const stats = getStats();
    stats[winner] = (stats[winner] || 0) + 1;
    saveStats(stats);
    updateStatsUser();

    document.getElementById('popupResult').textContent = winner;
    document.getElementById('popup').classList.add('show');
    fireConfetti();
    try {
      new Audio(winner === 'Try Again' ? 'images/loose.mp3' : 'images/victory.mp3').play().catch(() => {});
    } catch {}
  }, { once: true });
}

function updateStatsUser() {
  const config = getWheelConfig();
  const prizes = config.items.map(i => i.label);
  const stats = getStats();
  const sorted = Object.entries(stats)
    .filter(([p]) => prizes.includes(p) && stats[p] > 0)
    .map(([prize, count]) => ({ prize, count }))
    .sort((a, b) => b.count - a.count);

  const tbody = document.querySelector('#statsTableUser tbody');
  if (!tbody) return;
  tbody.innerHTML = sorted.length === 0
    ? '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No spins yet!</td></tr>'
    : sorted.map((item, i) => `<tr><td>${i + 1}</td><td>${item.prize}</td><td><strong>${item.count}</strong></td></tr>`).join('');
}

// ================= ADMIN VIEW =================
function initAdminView() {
  const school = getSchoolConfig();
  document.getElementById('adminSchoolName').textContent = school.name;
  document.getElementById('adminSchoolNameInput').value = school.name;
  document.getElementById('adminSchoolLogo').src = school.logo;
  document.getElementById('adminSchoolLogoPreview').src = school.logo;

  renderWheelItems();
  updateStatsAdmin();

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1))?.classList.add('active');
    });
  });

  document.getElementById('adminLogoInput').addEventListener('change', e => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onload = ev => {
        const src = ev.target?.result;
        document.getElementById('adminSchoolLogo').src = src;
        document.getElementById('adminSchoolLogoPreview').src = src;
      };
      r.readAsDataURL(f);
    }
  });
}

function renderWheelItems() {
  const config = getWheelConfig();
  const list = document.getElementById('wheelItemsList');
  list.innerHTML = config.items.map((item, i) => `
    <div class="wheel-item-row" data-idx="${i}">
      <span class="color-dot" style="background:${PIE_COLORS[i % PIE_COLORS.length]}"></span>
      <input type="text" value="${escapeHtml(item.label)}" placeholder="Item name" />
      <input type="number" min="0" max="100" value="${item.percentage}" placeholder="%" />
      <span class="percent-suffix">%</span>
      <button type="button" class="btn-remove" onclick="removeWheelItem(${i})">Remove</button>
    </div>
  `).join('');
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function addWheelItem() {
  const config = getWheelConfig();
  config.items.push({ label: 'New Item', percentage: 10 });
  saveWheelConfigToStorage(config);
  renderWheelItems();
}

function removeWheelItem(idx) {
  const config = getWheelConfig();
  if (config.items.length <= 2) {
    alert('You need at least 2 items on the wheel.');
    return;
  }
  config.items.splice(idx, 1);
  saveWheelConfigToStorage(config);
  renderWheelItems();
}

function saveBranding() {
  const name = document.getElementById('adminSchoolNameInput').value.trim() || 'My School';
  const logo = document.getElementById('adminSchoolLogoPreview').src;
  saveSchoolConfig({ name, logo });
  document.getElementById('adminSchoolName').textContent = name;
  alert('Branding saved!');
}

function saveWheelConfig() {
  const rows = document.querySelectorAll('.wheel-item-row');
  const items = [];
  let total = 0;
  for (const row of rows) {
    const labelInput = row.querySelector('input[type="text"]');
    const percInput = row.querySelector('input[type="number"]');
    const label = (labelInput?.value || 'Item').trim();
    const p = Math.max(0, Math.min(100, parseInt(percInput?.value, 10) || 0));
    total += p;
    items.push({ label, percentage: p });
  }

  const errEl = document.getElementById('percentError');
  if (Math.abs(total - 100) > 1) {
    errEl.textContent = `Percentages total ${total}%. They must equal 100%.`;
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';

  saveWheelConfigToStorage({ items });
  alert('Wheel updated!');
}

function resetStats() {
  if (!confirm('Reset all win statistics?')) return;
  saveStats({});
  updateStatsAdmin();
  alert('Statistics reset.');
}

function updateStatsAdmin() {
  const config = getWheelConfig();
  const prizes = config.items.map(i => i.label);
  const stats = getStats();
  const sorted = Object.entries(stats)
    .filter(([p]) => prizes.includes(p) && stats[p] > 0)
    .map(([prize, count]) => ({ prize, count }))
    .sort((a, b) => b.count - a.count);

  const tbody = document.querySelector('#statsTableAdmin tbody');
  if (!tbody) return;
  tbody.innerHTML = sorted.length === 0
    ? '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No spins yet!</td></tr>'
    : sorted.map((item, i) => `<tr><td>${i + 1}</td><td>${item.prize}</td><td><strong>${item.count}</strong></td></tr>`).join('');
}

// ================= POPUP =================
function closePopup() {
  document.getElementById('popup').classList.remove('show');
}

function fireConfetti() {
  let end = Date.now() + 3000;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
