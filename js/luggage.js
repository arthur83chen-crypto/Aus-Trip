/* luggage.js — Luggage list with Australia winter checklist */

const DEFAULT_LUGGAGE = [
  // 證件
  { id: 'l001', name: '護照', cat: '證件', checked: false },
  { id: 'l002', name: '澳洲簽證（ETA）', cat: '證件', checked: false },
  { id: 'l003', name: '旅遊保險', cat: '證件', checked: false },
  { id: 'l004', name: '信用卡／金融卡', cat: '證件', checked: false },
  { id: 'l005', name: '國際駕照', cat: '證件', checked: false },
  { id: 'l006', name: '行程確認信', cat: '證件', checked: false },
  { id: 'l007', name: '緊急聯絡資訊', cat: '證件', checked: false },
  // 衣物（冬季）
  { id: 'l011', name: '厚外套 / 羽絨外套', cat: '衣物', checked: false },
  { id: 'l012', name: '毛衣 / 針織衫 x3', cat: '衣物', checked: false },
  { id: 'l013', name: '長袖上衣 x4', cat: '衣物', checked: false },
  { id: 'l014', name: '長褲 x3', cat: '衣物', checked: false },
  { id: 'l015', name: '保暖內衣褲', cat: '衣物', checked: false },
  { id: 'l016', name: '厚襪子 x5', cat: '衣物', checked: false },
  { id: 'l017', name: '圍巾', cat: '衣物', checked: false },
  { id: 'l018', name: '手套', cat: '衣物', checked: false },
  { id: 'l019', name: '毛帽', cat: '衣物', checked: false },
  { id: 'l020', name: '防水運動鞋', cat: '衣物', checked: false },
  { id: 'l021', name: '拖鞋 / 便鞋', cat: '衣物', checked: false },
  { id: 'l022', name: '睡衣', cat: '衣物', checked: false },
  // 3C電子
  { id: 'l031', name: '手機 + 充電線', cat: '3C電子', checked: false },
  { id: 'l032', name: '充電寶（100Wh以下）', cat: '3C電子', checked: false },
  { id: 'l033', name: '澳洲插頭轉接器（Type I）', cat: '3C電子', checked: false },
  { id: 'l034', name: '相機 + 記憶卡', cat: '3C電子', checked: false },
  { id: 'l035', name: '耳機', cat: '3C電子', checked: false },
  { id: 'l036', name: '行動 Wi-Fi / 澳洲 SIM 卡', cat: '3C電子', checked: false },
  // 盥洗用品
  { id: 'l041', name: '牙刷 + 牙膏', cat: '盥洗用品', checked: false },
  { id: 'l042', name: '洗髮精 / 沐浴乳（旅行裝）', cat: '盥洗用品', checked: false },
  { id: 'l043', name: '保濕乳液', cat: '盥洗用品', checked: false },
  { id: 'l044', name: '防曬乳 SPF50+', cat: '盥洗用品', checked: false },
  { id: 'l045', name: '護唇膏', cat: '盥洗用品', checked: false },
  { id: 'l046', name: '濕紙巾', cat: '盥洗用品', checked: false },
  { id: 'l047', name: '快乾毛巾', cat: '盥洗用品', checked: false },
  // 藥品
  { id: 'l051', name: '感冒藥', cat: '藥品', checked: false },
  { id: 'l052', name: '腸胃藥', cat: '藥品', checked: false },
  { id: 'l053', name: '止痛藥', cat: '藥品', checked: false },
  { id: 'l054', name: '過敏藥', cat: '藥品', checked: false },
  { id: 'l055', name: 'OK繃 / 急救包', cat: '藥品', checked: false },
  // 其他
  { id: 'l061', name: '旅行收納袋', cat: '其他', checked: false },
  { id: 'l062', name: '環保購物袋', cat: '其他', checked: false },
  { id: 'l063', name: '雨傘', cat: '其他', checked: false },
  { id: 'l064', name: '旅行枕', cat: '其他', checked: false },
  { id: 'l065', name: '眼罩 + 耳塞', cat: '其他', checked: false },
  { id: 'l066', name: '澳幣現金（少量）', cat: '其他', checked: false },
];

const LuggageModule = (() => {
  let items = [];

  function load() {
    items = Storage.get('luggage', null);
    if (!items || items.length === 0) {
      items = JSON.parse(JSON.stringify(DEFAULT_LUGGAGE));
      Storage.set('luggage', items);
    }
  }
  function save() { Storage.set('luggage', items); }
  function getAll(){ return items; }

  function toggle(id) {
    const item = items.find(i => i.id === id);
    if (item) { item.checked = !item.checked; save(); render(); updateStats(); }
  }

  function add(name, cat) {
    const item = { id: 'lu' + Date.now(), name, cat, checked: false };
    items.push(item);
    save(); render(); updateStats();
  }

  function remove(id) {
    items = items.filter(i => i.id !== id);
    save(); render(); updateStats();
  }

  function updateStats() {
    const total = items.length;
    const done  = items.filter(i => i.checked).length;
    const pct   = total ? Math.round(done/total*100) : 0;
    document.getElementById('lug-total').textContent = total;
    document.getElementById('lug-done').textContent  = done;
    document.getElementById('lug-pct').textContent   = pct + '%';
    const bar = document.getElementById('lug-progress-bar');
    if (bar) bar.style.width = pct + '%';
    // Home tab
    const homeBar = document.getElementById('home-luggage-bar');
    const homeLbl = document.getElementById('home-luggage-label');
    if (homeBar) homeBar.style.width = pct + '%';
    if (homeLbl) homeLbl.textContent = `${done} / ${total} 件已打包`;
  }

  function render() {
    const list = document.getElementById('luggage-list');
    if (!list) return;
    const cats = {};
    items.forEach(i => { (cats[i.cat] = cats[i.cat]||[]).push(i); });

    const CAT_ICON = { '證件':'🪪', '衣物':'👕', '3C電子':'📱', '盥洗用品':'🪥', '藥品':'💊', '其他':'📦' };
    list.innerHTML = Object.keys(cats).map(cat => `
      <div class="lug-category-header">${CAT_ICON[cat]||'📦'} ${cat}</div>
      ${cats[cat].map(i => `
        <div class="lug-item ${i.checked?'checked':''}">
          <div class="lug-check ${i.checked?'checked':''}" data-lug-toggle="${i.id}">${i.checked?'✓':''}</div>
          <span class="lug-name ${i.checked?'checked':''}">${i.name}</span>
          <button class="lug-del" data-lug-del="${i.id}">✕</button>
        </div>`).join('')}
    `).join('');

    list.querySelectorAll('[data-lug-toggle]').forEach(el =>
      el.addEventListener('click', () => toggle(el.dataset.lugToggle)));
    list.querySelectorAll('[data-lug-del]').forEach(el =>
      el.addEventListener('click', () => {
        UI.confirm('確定要刪除此項目？', () => remove(el.dataset.lugDel));
      }));
    updateStats();
  }

  function initEvents() {
    document.getElementById('add-luggage-btn').addEventListener('click', () => {
      document.getElementById('lug-name').value = '';
      document.getElementById('lug-cat').value  = '其他';
      document.getElementById('luggage-modal-overlay').classList.remove('hidden');
      document.getElementById('lug-name').focus();
    });
    document.getElementById('lug-modal-close').addEventListener('click', () =>
      document.getElementById('luggage-modal-overlay').classList.add('hidden'));
    document.getElementById('lug-modal-cancel').addEventListener('click', () =>
      document.getElementById('luggage-modal-overlay').classList.add('hidden'));
    document.getElementById('lug-modal-save').addEventListener('click', () => {
      const name = document.getElementById('lug-name').value.trim();
      const cat  = document.getElementById('lug-cat').value;
      if (!name) { UI.toast('請填寫物品名稱'); return; }
      add(name, cat);
      document.getElementById('luggage-modal-overlay').classList.add('hidden');
      UI.toast('已新增：' + name);
    });
  }

  return { load, getAll, render, initEvents, updateStats };
})();
