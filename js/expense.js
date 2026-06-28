/* expense.js — Expense tracker with pie chart */

const CAT_COLORS = {
  '餐飲': '#FF6B6B', '交通': '#4ECDC4', '住宿': '#45B7D1',
  '景點': '#96CEB4', '購物': '#FFEAA7', '其他': '#DDA0DD'
};
const CAT_ICON = {
  '餐飲':'🍜','交通':'🚌','住宿':'🏨','景點':'🎡','購物':'🛍','其他':'📦'
};
const TWD_RATE = 21;

const ExpenseModule = (() => {
  let expenses = [];

  function load()  { expenses = Storage.get('expenses', []); }
  function save()  { Storage.set('expenses', expenses); }
  function getAll(){ return expenses; }

  function add(data) {
    expenses.unshift({ ...data, id: Date.now().toString() });
    save(); render();
  }

  function remove(id) {
    expenses = expenses.filter(e => e.id !== id);
    save(); render();
  }

  function getStats() {
    const today = new Date().toISOString().slice(0, 10);
    const todayAud  = expenses.filter(e => e.date === today).reduce((s, e) => s + Number(e.aud), 0);
    const totalAud  = expenses.reduce((s, e) => s + Number(e.aud), 0);
    const rate      = expenses[0]?.rate || TWD_RATE;
    const totalTwd  = totalAud * rate;
    return { todayAud, totalAud, totalTwd };
  }

  function updateSummary() {
    const { todayAud, totalAud, totalTwd } = getStats();
    document.getElementById('exp-today-aud').textContent = `A$${todayAud.toFixed(2)}`;
    document.getElementById('exp-total-aud').textContent = `A$${totalAud.toFixed(2)}`;
    document.getElementById('exp-total-twd').textContent = `NT$${Math.round(totalTwd).toLocaleString()}`;
    // Home card
    const homeEl = document.getElementById('today-expense');
    if (homeEl) homeEl.textContent = `A$${todayAud.toFixed(2)}`;
    drawChart();
  }

  function drawChart() {
    const canvas = document.getElementById('expense-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (expenses.length === 0) {
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text3') || '#8E8E93';
      ctx.font = '13px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('尚無支出記錄', W / 2, H / 2);
      return;
    }

    // Aggregate by category
    const totals = {};
    expenses.forEach(e => { totals[e.cat] = (totals[e.cat] || 0) + Number(e.aud); });
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const total   = Object.values(totals).reduce((s, v) => s + v, 0);

    const cx = W / 2 - 50, cy = H / 2, r = Math.min(cx, cy) - 12;
    let startAngle = -Math.PI / 2;

    entries.forEach(([cat, val]) => {
      const slice = (val / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = CAT_COLORS[cat] || '#ccc';
      ctx.fill();
      startAngle += slice;
    });

    // Inner white circle (donut)
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    const isDark = document.body.classList.contains('dark-mode');
    ctx.fillStyle = isDark ? '#1C2F45' : '#FFFFFF';
    ctx.fill();

    // Center label
    ctx.fillStyle = isDark ? '#fff' : '#1C1C1E';
    ctx.font = `bold 15px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`A$${total.toFixed(0)}`, cx, cy);

    // Legend
    const legX = W / 2 + 30, legStartY = 30;
    ctx.textBaseline = 'alphabetic';
    entries.slice(0, 6).forEach(([cat, val], i) => {
      const y = legStartY + i * 30;
      ctx.fillStyle = CAT_COLORS[cat] || '#ccc';
      ctx.beginPath();
      ctx.arc(legX, y + 5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isDark ? '#fff' : '#1C1C1E';
      ctx.font = `12px -apple-system, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(`${cat}`, legX + 12, y + 9);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text3') || '#8E8E93';
      ctx.font = `11px -apple-system, sans-serif`;
      ctx.fillText(`A$${val.toFixed(0)} (${Math.round(val/total*100)}%)`, legX + 12, y + 22);
    });
  }

  function render() {
    updateSummary();
    const list = document.getElementById('expense-list');
    if (!list) return;

    if (expenses.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <span class="empty-icon">💰</span>
        <p>尚未記錄任何支出</p>
        <button class="btn-primary" id="empty-add-exp">＋ 新增第一筆</button>
      </div>`;
      document.getElementById('empty-add-exp')?.addEventListener('click', openModal);
      return;
    }

    list.innerHTML = expenses.map(e => `
      <div class="exp-item">
        <div class="exp-cat-icon">${CAT_ICON[e.cat]||'📦'}</div>
        <div class="exp-info">
          <div class="exp-name">${e.name}</div>
          <div class="exp-meta">${e.cat}${e.date?' · '+e.date:''}${e.note?' · '+e.note:''}</div>
        </div>
        <div class="exp-amount">
          <div class="exp-aud">A$${Number(e.aud).toFixed(2)}</div>
          <div class="exp-twd">NT$${Math.round(Number(e.aud)*Number(e.rate||TWD_RATE)).toLocaleString()}</div>
        </div>
        <button class="exp-del" data-exp-del="${e.id}">✕</button>
      </div>`).join('');

    list.querySelectorAll('[data-exp-del]').forEach(el =>
      el.addEventListener('click', () => {
        UI.confirm('確定要刪除這筆支出？', () => { remove(el.dataset.expDel); UI.toast('已刪除'); });
      }));
  }

  function openModal() {
    document.getElementById('exp-name').value  = '';
    document.getElementById('exp-aud').value   = '';
    document.getElementById('exp-rate').value  = TWD_RATE;
    document.getElementById('exp-cat').value   = '餐飲';
    document.getElementById('exp-date').value  = new Date().toISOString().slice(0,10);
    document.getElementById('exp-note').value  = '';
    document.getElementById('expense-modal-overlay').classList.remove('hidden');
    document.getElementById('exp-name').focus();
  }

  function initEvents() {
    document.getElementById('add-expense-btn').addEventListener('click', openModal);
    document.getElementById('exp-modal-close').addEventListener('click', () =>
      document.getElementById('expense-modal-overlay').classList.add('hidden'));
    document.getElementById('exp-modal-cancel').addEventListener('click', () =>
      document.getElementById('expense-modal-overlay').classList.add('hidden'));
    document.getElementById('exp-modal-save').addEventListener('click', () => {
      const name = document.getElementById('exp-name').value.trim();
      const aud  = parseFloat(document.getElementById('exp-aud').value);
      if (!name || isNaN(aud) || aud < 0) { UI.toast('請填寫名稱與金額'); return; }
      add({
        name, aud,
        rate: parseFloat(document.getElementById('exp-rate').value) || TWD_RATE,
        cat:  document.getElementById('exp-cat').value,
        date: document.getElementById('exp-date').value,
        note: document.getElementById('exp-note').value.trim()
      });
      document.getElementById('expense-modal-overlay').classList.add('hidden');
      UI.toast('支出已記錄');
    });
  }

  return { load, getAll, render, initEvents, getStats };
})();
