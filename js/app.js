/* app.js — Main app bootstrap, weather, PWA, settings */

const DEPARTURE_DATE = '202ˊ-07-01'; // ← 改成你的出發日期
const TRIP_CITY = 'Sydney';

const App = (() => {

  // ── Weather ──
  async function fetchWeather() {
    const cityCoords = {
      'Sydney':         { lat: -33.8688, lon: 151.2093 },
      'Blue Mountains': { lat: -33.7139, lon: 150.3113 },
      'Kiama':          { lat: -34.6710, lon: 150.8540 },
      'Coffs Harbour':  { lat: -30.2963, lon: 153.1135 },
      'Byron Bay':      { lat: -28.6474, lon: 153.6020 },
      'Gold Coast':     { lat: -28.0167, lon: 153.4000 },
      'Brisbane':       { lat: -27.4698, lon: 153.0251 },
    };
    const { lat, lon } = cityCoords[TRIP_CITY] || cityCoords['Sydney'];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m&timezone=auto`;

    const WEATHER_CODES = {
      0:'☀️ 晴天',1:'🌤️ 大致晴朗',2:'⛅ 部分多雲',3:'☁️ 陰天',
      45:'🌫️ 霧',48:'🌫️ 霧霜',51:'🌦️ 毛毛雨（輕）',53:'🌦️ 毛毛雨',55:'🌧️ 毛毛雨（重）',
      61:'🌧️ 小雨',63:'🌧️ 中雨',65:'🌧️ 大雨',
      71:'❄️ 小雪',73:'❄️ 中雪',75:'❄️ 大雪',
      80:'🌦️ 陣雨（輕）',81:'🌦️ 陣雨',82:'⛈️ 陣雨（強）',
      95:'⛈️ 雷陣雨',96:'⛈️ 雷陣雨夾冰雹',99:'⛈️ 雷陣雨夾大冰雹',
    };

    try {
      const res = await fetch(url);
      const d   = await res.json();
      const c   = d.current;
      const code= c.weathercode;
      const desc= WEATHER_CODES[code] || '天氣未知';
      const [icon, ...rest] = desc.split(' ');
      const textDesc = rest.join(' ');

      document.getElementById('weather-icon').textContent = icon;
      document.getElementById('weather-temp').textContent = `${Math.round(c.temperature_2m)}°C`;
      document.getElementById('weather-desc').textContent = textDesc;
      document.getElementById('weather-details').innerHTML =
        `<span>體感 ${Math.round(c.apparent_temperature)}°C</span>
         <span>💧 濕度 ${c.relativehumidity_2m}%</span>
         <span>💨 風速 ${Math.round(c.windspeed_10m)} km/h</span>`;
    } catch {
      document.getElementById('weather-desc').textContent = '無法取得天氣';
    }
  }

  // ── Countdown ──
  function updateCountdown() {
    const dep  = new Date(DEPARTURE_DATE);
    const now  = new Date();
    const diff = Math.ceil((dep - now) / 86400000);
    const el   = document.getElementById('days-to-go');
    if (!el) return;
    if (diff > 0)       el.textContent = diff;
    else if (diff === 0) el.textContent = '今天出發！';
    else                el.textContent = `旅程第 ${Math.abs(diff)+1} 天`;
  }

  // ── Today's Trip on Home ──
  function updateHomeTrip() {
    const todayItems = TripModule.getTodayItems();
    const list = document.getElementById('today-trip-list');
    if (!list) return;
    if (todayItems.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <span class="empty-icon">🗺️</span>
        <p>尚未安排今日行程</p>
        <button class="btn-primary" onclick="switchTab('trip')">前往安排</button>
      </div>`;
      return;
    }
    list.innerHTML = todayItems.map(t => `
      <div class="today-trip-item">
        ${t.time ? `<span class="ttl-time">${t.time}</span>` : ''}
        <div>
          <div class="ttl-name">${t.name}</div>
          <div class="ttl-city">📍 ${t.city||''}</div>
        </div>
      </div>`).join('');
  }

  function updateHomeTab() {
    const trips = TripModule.getAll();
    const el = document.getElementById('total-spots');
    if (el) el.textContent = trips.length;
    updateHomeTrip();
    LuggageModule.updateStats();
    // Expense
    try { const { todayAud } = ExpenseModule.getStats();
      const exp = document.getElementById('today-expense');
      if (exp) exp.textContent = `A$${todayAud.toFixed(2)}`; } catch{}
  }

  function updateMoreTab() {
    document.getElementById('info-trips').textContent   = TripModule.getAll().length;
    document.getElementById('info-luggage').textContent = LuggageModule.getAll().length;
  }

  // ── Dark Mode ──
  function initDarkMode() {
    const settings = Storage.get('settings', {});
    if (settings.dark) enableDark();

    const toggle = document.getElementById('dark-toggle');
    document.getElementById('toggle-dark').addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-mode');
      if (isDark) disableDark(); else enableDark();
      Storage.set('settings', { ...Storage.get('settings',{}), dark: !isDark });
    });
  }

  function enableDark() {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
    document.getElementById('dark-toggle').classList.add('on');
    document.getElementById('expense-chart') && ExpenseModule.render();
  }
  function disableDark() {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    document.getElementById('dark-toggle').classList.remove('on');
    document.getElementById('expense-chart') && ExpenseModule.render();
  }

  // ── Export / Import ──
  function initDataTools() {
    document.getElementById('export-btn').addEventListener('click', () => {
      const data = JSON.stringify(Storage.export(), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `australia-trip-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      UI.toast('資料已匯出');
    });

    document.getElementById('import-btn-trigger').addEventListener('click', () =>
      document.getElementById('import-input').click());

    document.getElementById('import-input').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          Storage.import(data);
          TripModule.load();    TripModule.render();
          LuggageModule.load(); LuggageModule.render();
          ExpenseModule.load(); ExpenseModule.render();
          updateHomeTab();
          UI.toast('資料已匯入成功 ✓');
        } catch { UI.toast('匯入失敗，請確認 JSON 格式'); }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
      UI.confirm('確定要清除所有資料？此動作無法復原。', () => {
        ['trips','luggage','expenses'].forEach(k => Storage.remove(k));
        TripModule.load();    TripModule.render();
        LuggageModule.load(); LuggageModule.render();
        ExpenseModule.load(); ExpenseModule.render();
        updateHomeTab();
        UI.toast('資料已清除');
      });
    });
  }

  // ── PWA ──
  function initPWA() {
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      document.getElementById('install-banner').classList.remove('hidden');
    });
    document.getElementById('install-btn').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') UI.toast('App 安裝成功！');
      deferredPrompt = null;
      document.getElementById('install-banner').classList.add('hidden');
    });
    document.getElementById('install-close').addEventListener('click', () =>
      document.getElementById('install-banner').classList.add('hidden'));

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .catch(e => console.log('SW error', e));
    }
  }

  // ── Nav ──
  function initNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  // ── Hero banner city image ──
  function updateHeroBanner() {
    const trips = TripModule.getAll();
    if (trips.length > 0 && trips[0].img) {
      document.getElementById('hero-img').src = trips[0].img;
    }
  }

  // ── Init ──
  function init() {
    TripModule.load();
    LuggageModule.load();
    ExpenseModule.load();

    UI.initConfirm();
    TripModule.initEvents();
    LuggageModule.initEvents();
    ExpenseModule.initEvents();

    initNav();
    initDarkMode();
    initDataTools();
    initPWA();

    // Initial renders
    updateHomeTab();
    updateCountdown();
    fetchWeather();
    updateHeroBanner();

    // Refresh every minute
    setInterval(updateCountdown, 60000);
  }

  return { init, updateHomeTab, updateMoreTab };
})();

document.addEventListener('DOMContentLoaded', App.init);
