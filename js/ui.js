/* ui.js — Toast, confirm, tab switching */

const UI = (() => {
  let confirmCb = null;

  function toast(msg, duration = 2500) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = `fadeInOut ${duration}ms forwards`;
    setTimeout(() => el.classList.add('hidden'), duration);
  }

  function confirm(msg, cb) {
    confirmCb = cb;
    document.getElementById('confirm-msg').textContent = msg;
    document.getElementById('confirm-overlay').classList.remove('hidden');
  }

  function initConfirm() {
    document.getElementById('confirm-ok').addEventListener('click', () => {
      document.getElementById('confirm-overlay').classList.add('hidden');
      if (confirmCb) { confirmCb(); confirmCb = null; }
    });
    document.getElementById('confirm-cancel').addEventListener('click', () => {
      document.getElementById('confirm-overlay').classList.add('hidden');
      confirmCb = null;
    });
    document.getElementById('confirm-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('confirm-overlay')) {
        document.getElementById('confirm-overlay').classList.add('hidden');
        confirmCb = null;
      }
    });
  }

  return { toast, confirm, initConfirm };
})();

function switchTab(tabName) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tabName)?.classList.add('active');
  document.querySelector(`.nav-btn[data-tab="${tabName}"]`)?.classList.add('active');
  // Trigger render on switch
  if (tabName === 'trip')    TripModule.render();
  if (tabName === 'luggage') { LuggageModule.render(); LuggageModule.updateStats(); }
  if (tabName === 'expense') ExpenseModule.render();
  if (tabName === 'more')    App.updateMoreTab();
}
