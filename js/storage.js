/* storage.js — LocalStorage helpers */
const Storage = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn('Storage full', e); }
  },
  remove(key) { localStorage.removeItem(key); },
  export() {
    return {
      trips: Storage.get('trips', []),
      luggage: Storage.get('luggage', []),
      expenses: Storage.get('expenses', []),
      settings: Storage.get('settings', {}),
      exportedAt: new Date().toISOString()
    };
  },
  import(data) {
    if (data.trips)   Storage.set('trips', data.trips);
    if (data.luggage) Storage.set('luggage', data.luggage);
    if (data.expenses)Storage.set('expenses', data.expenses);
    if (data.settings)Storage.set('settings', data.settings);
  }
};
