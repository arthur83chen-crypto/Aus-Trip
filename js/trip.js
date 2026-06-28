/* trip.js — Itinerary CRUD + drag-drop + render */

const CITY_IMAGES = {
  'Sydney':          'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=700&q=80&auto=format',
  'Opera House':     'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=700&q=80&auto=format',
  'Harbour Bridge':  'https://images.unsplash.com/photo-1524293581917-878a6d017c71?w=700&q=80&auto=format',
  'Fish Market':     'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=700&q=80&auto=format',
  'Blue Mountains':  'https://images.unsplash.com/photo-1548278155-2e65e0b32e64?w=700&q=80&auto=format',
  'Three Sisters':   'https://images.unsplash.com/photo-1549735777-87d0d3b58a7e?w=700&q=80&auto=format',
  'Scenic World':    'https://images.unsplash.com/photo-1548278155-2e65e0b32e64?w=700&q=80&auto=format',
  'Kiama':           'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=700&q=80&auto=format',
  'Blowhole':        'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=700&q=80&auto=format',
  'Coffs Harbour':   'https://images.unsplash.com/photo-1550687692-d2e4f12c5afe?w=700&q=80&auto=format',
  'Byron Bay':       'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&q=80&auto=format',
  'Gold Coast':      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=700&q=80&auto=format',
  'Brisbane':        'https://images.unsplash.com/photo-1546268060-2592ff93ee24?w=700&q=80&auto=format',
  'Bondi':           'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=700&q=80&auto=format',
  'The Rocks':       'https://images.unsplash.com/photo-1553697388-94e804e2f0f6?w=700&q=80&auto=format',
};

const CITY_EMOJI = {
  'Sydney': '🏙️', 'Blue Mountains': '🏔️', 'Kiama': '🌊',
  'Coffs Harbour': '🦛', 'Byron Bay': '🏄', 'Gold Coast': '🌴', 'Brisbane': '☀️'
};

const TripModule = (() => {
  let trips = [];
  let editingId = null;
  let dragSrcId = null;
  let searchQuery = '';

  function load()  { trips = Storage.get('trips', []); }
  function save()  { Storage.set('trips', trips); }
  function getAll(){ return trips; }

  function getDefaultImage(name, city) {
    const combined = (name + ' ' + city).toLowerCase();
    for (const [key, url] of Object.entries(CITY_IMAGES)) {
      if (combined.includes(key.toLowerCase())) return url;
    }
    return CITY_IMAGES[city] || CITY_IMAGES['Sydney'];
  }

  function add(data) {
    const item = { ...data, id: Date.now().toString() };
    if (!item.img) item.img = getDefaultImage(item.name, item.city);
    trips.push(item);
    sort();
    save();
    return item;
  }

  function update(id, data) {
    const idx = trips.findIndex(t => t.id === id);
    if (idx < 0) return;
    if (!data.img) data.img = getDefaultImage(data.name, data.city);
    trips[idx] = { ...trips[idx], ...data };
    sort();
    save();
  }

  function remove(id) {
    trips = trips.filter(t => t.id !== id);
    save();
  }

  function sort() {
    trips.sort((a, b) => {
      if (a.day !== b.day) return Number(a.day) - Number(b.day);
      return (a.time || '').localeCompare(b.time || '');
    });
  }

  // ── Drag & Drop ──
  function enableDrag(card, id) {
    card.draggable = true;
    card.addEventListener('dragstart', e => {
      dragSrcId = id;
      setTimeout(() => card.classList.add('dragging'), 0);
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.trip-card').forEach(c => c.classList.remove('drag-over'));
    });
    card.addEventListener('dragover', e => {
      e.preventDefault();
      if (dragSrcId !== id) card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', e => {
      e.preventDefault();
      card.classList.remove('drag-over');
      if (dragSrcId && dragSrcId !== id) {
        const srcIdx = trips.findIndex(t => t.id === dragSrcId);
        const dstIdx = trips.findIndex(t => t.id === id);
        if (srcIdx < 0 || dstIdx < 0) return;
        const [moved] = trips.splice(srcIdx, 1);
        // adopt day of target for cross-day drag
        moved.day = trips[dstIdx < srcIdx ? dstIdx : dstIdx - 1]?.day || moved.day;
        trips.splice(dstIdx, 0, moved);
        save();
        render();
        App.updateHomeTab();
      }
    });
  }

  // ── Render ──
  function render() {
    const list = document.getElementById('trip-list');
    if (!list) return;

    const filtered = searchQuery
      ? trips.filter(t =>
          t.name.toLowerCase().includes(searchQuery) ||
          (t.city||'').toLowerCase().includes(searchQuery) ||
          (t.note||'').toLowerCase().includes(searchQuery))
      : trips;

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <span class="empty-icon">🗺️</span>
        <p>${searchQuery ? '找不到符合的景點' : '尚未新增任何行程'}</p>
        ${!searchQuery ? '<button class="btn-primary" id="empty-add-trip">＋ 新增第一個景點</button>' : ''}
      </div>`;
      document.getElementById('empty-add-trip')?.addEventListener('click', openAddModal);
      return;
    }

    // Group by day
    const days = {};
    filtered.forEach(t => { (days[t.day] = days[t.day]||[]).push(t); });

    list.innerHTML = Object.keys(days).sort((a,b)=>Number(a)-Number(b)).map(day => {
      const items = days[day];
      const dateStr = items[0].date ? ` · ${items[0].date}` : '';
      const cityStr = items[0].city ? ` ${CITY_EMOJI[items[0].city]||'📍'} ${items[0].city}` : '';
      return `<div class="day-group">
        <div class="day-group-header">Day ${day}${dateStr}${cityStr}</div>
        ${items.map(t => renderCard(t)).join('')}
      </div>`;
    }).join('');

    // Bind events & drag
    filtered.forEach(t => {
      const card = list.querySelector(`[data-id="${t.id}"]`);
      if (!card) return;
      enableDrag(card, t.id);
      card.querySelector('.tc-edit')?.addEventListener('click', () => openEditModal(t.id));
      card.querySelector('.tc-del')?.addEventListener('click', () => confirmDelete(t.id));
      const mapBtn = card.querySelector('.tc-map');
      if (mapBtn && t.map) mapBtn.addEventListener('click', () => window.open(t.map, '_blank'));
      else if (mapBtn && !t.map) {
        const q = encodeURIComponent(`${t.name} ${t.city||''} Australia`);
        mapBtn.addEventListener('click', () => window.open(`https://maps.google.com/?q=${q}`, '_blank'));
      }
    });
  }

  function renderCard(t) {
    const imgHtml = t.img
      ? `<img class="trip-card-img" src="${t.img}" alt="${t.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const placeholder = `<div class="trip-card-img-placeholder" ${t.img ? 'style="display:none"' : ''}>${CITY_EMOJI[t.city]||'📍'}</div>`;
    return `<div class="trip-card" data-id="${t.id}">
      ${imgHtml}${placeholder}
      <div class="trip-card-body">
        <div class="trip-card-row1">
          <span class="trip-card-name">${t.name}</span>
          ${t.time ? `<span class="trip-card-time">${t.time}</span>` : ''}
        </div>
        <div class="trip-card-city">📍 ${t.city||''}${t.date ? ' · '+t.date : ''}</div>
        ${t.note ? `<div class="trip-card-note">${t.note}</div>` : ''}
        <div class="trip-card-actions">
          <button class="tc-btn tc-edit">✏️ 編輯</button>
          <button class="tc-btn tc-map">🗺 地圖</button>
          <button class="tc-btn tc-del">🗑</button>
        </div>
      </div>
    </div>`;
  }

  // ── Modal ──
  function openAddModal() {
    editingId = null;
    document.getElementById('trip-modal-title').textContent = '新增行程';
    document.getElementById('f-day').value = '';
    document.getElementById('f-date').value = '';
    document.getElementById('f-city').value = 'Sydney';
    document.getElementById('f-name').value = '';
    document.getElementById('f-time').value = '';
    document.getElementById('f-note').value = '';
    document.getElementById('f-img').value = '';
    document.getElementById('f-map').value = '';
    document.getElementById('f-img-preview').classList.add('hidden');
    document.getElementById('trip-modal-overlay').classList.remove('hidden');
    document.getElementById('f-name').focus();
  }

  function openEditModal(id) {
    const t = trips.find(x => x.id === id);
    if (!t) return;
    editingId = id;
    document.getElementById('trip-modal-title').textContent = '編輯行程';
    document.getElementById('f-day').value = t.day||'';
    document.getElementById('f-date').value = t.date||'';
    document.getElementById('f-city').value = t.city||'Sydney';
    document.getElementById('f-name').value = t.name||'';
    document.getElementById('f-time').value = t.time||'';
    document.getElementById('f-note').value = t.note||'';
    document.getElementById('f-img').value = t.img||'';
    document.getElementById('f-map').value = t.map||'';
    updateImgPreview(t.img);
    document.getElementById('trip-modal-overlay').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('trip-modal-overlay').classList.add('hidden');
  }

  function saveModal() {
    const name = document.getElementById('f-name').value.trim();
    const day  = document.getElementById('f-day').value.trim();
    if (!name || !day) { UI.toast('請填寫天數和景點名稱'); return; }
    const data = {
      day:  parseInt(day),
      date: document.getElementById('f-date').value,
      city: document.getElementById('f-city').value,
      name,
      time: document.getElementById('f-time').value,
      note: document.getElementById('f-note').value.trim(),
      img:  document.getElementById('f-img').value.trim(),
      map:  document.getElementById('f-map').value.trim(),
    };
    if (editingId) { update(editingId, data); UI.toast('行程已更新'); }
    else           { add(data);              UI.toast('行程已新增'); }
    closeModal();
    render();
    App.updateHomeTab();
  }

  function confirmDelete(id) {
    UI.confirm('確定要刪除這個景點？', () => {
      remove(id); render(); App.updateHomeTab(); UI.toast('已刪除');
    });
  }

  function updateImgPreview(url) {
    const prev = document.getElementById('f-img-preview');
    if (!url) { prev.classList.add('hidden'); return; }
    prev.classList.remove('hidden');
    prev.innerHTML = `<img src="${url}" onerror="this.parentNode.classList.add('hidden')" />`;
  }

  function initEvents() {
    document.getElementById('add-trip-btn').addEventListener('click', openAddModal);
    document.getElementById('trip-modal-close').addEventListener('click', closeModal);
    document.getElementById('trip-modal-cancel').addEventListener('click', closeModal);
    document.getElementById('trip-modal-save').addEventListener('click', saveModal);
    document.getElementById('f-img').addEventListener('input', e => updateImgPreview(e.target.value));
    document.getElementById('trip-search').addEventListener('input', e => {
      searchQuery = e.target.value.toLowerCase().trim();
      render();
    });
  }

  return { load, save, getAll, render, initEvents, getTodayItems() {
    const today = new Date().toISOString().slice(0,10);
    return trips.filter(t => t.date === today).slice(0,5);
  }};
})();
