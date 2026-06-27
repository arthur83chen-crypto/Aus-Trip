// 🧠 核心全域狀態：單一資料源 (Single Source of Truth)
const store = {
  trips: [],
  bags: {
    "證件": [
      { text: "護照與簽證", done: false },
      { text: "國際駕照", done: false }
    ],
    "電子用品": [
      { text: "萬國轉接頭", done: false },
      { text: "行動電源", done: false }
    ],
    "衣物": [{ text: "防風外套", done: false }],
    "盥洗用品": [{ text: "旅行牙刷組", done: false }],
    "常備藥": [{ text: "暈車藥", done: false }],
    "其他": [{ text: "太陽眼鏡", done: false }]
  }
};

let editMode = null; // 紀錄正在編輯的景點 id

const defaultTrips = [
  {
    day: 1, date: "2026/07/02", city: "Sydney", banner: "images/banner/sydney.jpg",
    places: [
      { id: 1001, time: "11:30", title: "Sydney Fish Market", note: "大啖生蠔與龍蝦海鮮。", img: "images/places/fishmarket.jpg" },
      { id: 1002, time: "15:00", title: "Sydney Opera House", note: "世界文化遺產拍照點。", img: "images/places/opera-house.jpg" }
    ]
  },
  {
    day: 2, date: "2026/07/03", city: "Blue Mountains", banner: "images/banner/blue-mountains.jpg",
    places: [
      { id: 1003, time: "09:00", title: "Scenic World", note: "體驗全世界最陡的森林鐵道纜車。", img: "images/places/scenic-world.jpg" }
    ]
  }
];

// 💾 載入與儲存模組
function loadData() {
  const cache = localStorage.getItem("appData");
  if (cache) {
    try {
      const parsed = JSON.parse(cache);
      store.trips = parsed.trips || [];
      store.bags = parsed.bags || store.bags;
    } catch (e) {
      console.error("Data corrupted, fall back to defaults.", e);
      store.trips = JSON.parse(JSON.stringify(defaultTrips));
    }
  } else {
    store.trips = JSON.parse(JSON.stringify(defaultTrips));
    saveData();
  }
}

function saveData() {
  localStorage.setItem("appData", JSON.stringify(store));
}

function normalizeDays() {
  store.trips = store.trips.filter(d => d.places.length > 0);
  store.trips.sort((a, b) => a.day - b.day);
  store.trips.forEach((d, i) => { d.day = i + 1; });
}

// 🗺️ 行程渲染模組
function renderTrips(keyword = "") {
  const container = document.getElementById("tripContainer");
  container.innerHTML = "";
  const cleanKey = keyword.trim().toLowerCase();

  store.trips.forEach(dayGroup => {
    let filteredPlaces = dayGroup.places.filter(p => 
      p.title.toLowerCase().includes(cleanKey) || p.note.toLowerCase().includes(cleanKey)
    );

    if (cleanKey !== "" && filteredPlaces.length === 0) return;
    filteredPlaces.sort((a, b) => a.time.localeCompare(b.time));

    let dayCard = document.createElement("div");
    dayCard.className = "dayCard";
    dayCard.setAttribute("data-day", dayGroup.day);

    let placesHTML = "";
    filteredPlaces.forEach(p => {
      placesHTML += `
        <div class="place" data-id="${p.id}">
          <img class="placeImage" src="${p.img || 'images/places/fishmarket.jpg'}">
          <div class="placeInfo" onclick="editPlace(${p.id})">
            <div class="placeTime">${p.time}</div>
            <div class="placeTitle">${p.title}</div>
            <div class="placeNote">${p.note}</div>
          </div>
          <button class="delBtn" onclick="deletePlace(event, ${p.id})">🗑</button>
        </div>`;
    });

    // 🛡️ Banner 防空字串短路失效的雙重安全防禦
    const safeBanner = (dayGroup.banner && dayGroup.banner.trim() !== '') ? dayGroup.banner : 'images/banner/sydney.jpg';

    dayCard.innerHTML = `
      <img class="dayImage" src="${safeBanner}">
      <div class="dayContent" data-day="${dayGroup.day}">
        <div class="dayTop">
          <div class="dayBadge">Day ${dayGroup.day}</div>
          <div class="dayDate">${dayGroup.date}</div>
        </div>
        ${placesHTML}
      </div>`;
    container.appendChild(dayCard);
  });

  if (cleanKey === "") initSortable();
}

// 🔥 跨天與天內高組態排序控制
function initSortable() {
  document.querySelectorAll(".dayContent").forEach(el => {
    new Sortable(el, {
      group: "shared",
      animation: 150,
      draggable: ".place",
      ghostClass: "sortable-ghost",
      onEnd: syncOrder
    });
  });
}

function syncOrder() {
  let newTrips = [];
  document.querySelectorAll(".dayContent").forEach(contentEl => {
    const currentDayNum = parseInt(contentEl.getAttribute("data-day"));
    const oldMeta = store.trips.find(d => d.day === currentDayNum);
    if (!oldMeta) return;

    let orderedPlaces = [];
    contentEl.querySelectorAll(".place").forEach(placeEl => {
      const pid = parseInt(placeEl.getAttribute("data-id"));
      let foundPlace = null;
      store.trips.forEach(d => {
        let p = d.places.find(i => i.id === pid);
        if (p) foundPlace = p;
      });
      if (foundPlace) orderedPlaces.push(foundPlace);
    });

    if (orderedPlaces.length > 0) {
      newTrips.push({ ...oldMeta, day: currentDayNum, places: orderedPlaces });
    }
  });

  store.trips = newTrips;
  normalizeDays();
  saveData();
  renderTrips();
  toast("已同步更新排序 🔁");
}

// ⚡ 快速新增
function quickAddPlace() {
  const input = document.getElementById("quickInput");
  const title = input.value.trim();
  if (!title) return;

  let dayOne = store.trips.find(d => d.day === 1);
  const item = { id: Date.now(), time: "12:00", title: title, note: "快速模式建立...", img: "" };

  if (dayOne) {
    dayOne.places.push(item);
  } else {
    store.trips.push({ day: 1, date: "2026/07/02", city: "Sydney", banner: "", places: [item] });
  }

  input.value = "";
  normalizeDays(); saveData(); renderTrips();
  toast("⚡ 快速新增成功");
}

// ✏️ 完整彈窗儲存及防污染機制
function saveTrip() {
  const dayNum = parseInt(document.getElementById("editDayNum").value) || 1;
  const rawDate = document.getElementById("editDate").value.replace(/-/g, "/");
  const city = document.getElementById("editCity").value || "Sydney";
  const title = document.getElementById("editPlace").value.trim();
  const time = document.getElementById("editTime").value || "12:00";
  const note = document.getElementById("editNote").value || "無備註。";
  const photo = document.getElementById("editPhoto").value;
  
  let banner = document.getElementById("editBanner").value.trim();
  if (!banner) banner = "images/banner/sydney.jpg"; // 阻斷污染

  if (!title) return alert("地點不能為空！");

  if (editMode) {
    let oldDay = null, placeObj = null;
    store.trips.forEach(d => {
      let f = d.places.find(p => p.id === editMode.id);
      if (f) { oldDay = d; placeObj = f; }
    });

    if (placeObj) {
      Object.assign(placeObj, { time, title, note, img: photo });
      if (oldDay.day === dayNum) {
        Object.assign(oldDay, { date: rawDate, city, banner });
      } else {
        oldDay.places = oldDay.places.filter(p => p.id !== editMode.id);
        let target = store.trips.find(d => d.day === dayNum);
        if (target) target.places.push(placeObj);
        else store.trips.push({ day: dayNum, date: rawDate, city, banner, places: [placeObj] });
      }
    }
    editMode = null;
  } else {
    const newItem = { id: Date.now(), time, title, note, img: photo };
    let target = store.trips.find(d => d.day === dayNum);
    if (target) target.places.push(newItem);
    else store.trips.push({ day: dayNum, date: rawDate, city, banner, places: [newItem] });
  }

  normalizeDays(); saveData(); renderTrips(); closeEditor();
  toast("行程已儲存 ✔");
}

function editPlace(id) {
  let dayObj = null, placeObj = null;
  store.trips.forEach(d => {
    let f = d.places.find(p => p.id === id);
    if (f) { dayObj = d; placeObj = f; }
  });
  if (!placeObj) return;

  editMode = { id };
  document.getElementById("editDayNum").value = dayObj.day;
  document.getElementById("editDate").value = dayObj.date.replaceAll("/", "-");
  document.getElementById("editCity").value = dayObj.city;
  document.getElementById("editPlace").value = placeObj.title;
  document.getElementById("editTime").value = placeObj.time;
  document.getElementById("editNote").value = placeObj.note;
  document.getElementById("editBanner").value = dayObj.banner;
  document.getElementById("editPhoto").value = placeObj.img;
  document.getElementById("editModal").style.display = "flex";
}

function deletePlace(e, id) {
  e.stopPropagation();
  if (!confirm("確定移除此行程？")) return;
  store.trips.forEach(d => { d.places = d.places.filter(p => p.id !== id); });
  normalizeDays(); saveData(); renderTrips();
}

// 🧳 行李控制模組
function renderBag() {
  const container = document.getElementById("bagContainer");
  container.innerHTML = "";

  Object.keys(store.bags).forEach(category => {
    const items = store.bags[category];
    let html = `<div class="bagCard"><h3>${category}</h3><div>`;
    
    items.forEach((item, i) => {
      html += `
        <div class="bagItem">
          <label class="bagItemLeft ${item.done ? 'done' : ''}">
            <input type="checkbox" ${item.done ? "checked" : ""} onchange="toggleBag('${category}', ${i})">
            <span>${item.text}</span>
          </label>
          <span class="bagItemDel" onclick="deleteBagItem('${category}', ${i})">✕</span>
        </div>`;
    });

    html += `</div></div>`;
    container.innerHTML += html;
  });
}

function toggleBag(category, index) {
  store.bags[category][index].done = !store.bags[category][index].done;
  saveData();
  renderBag();
}

function addBagItem() {
  const cat = document.getElementById("bagCategorySelect").value;
  const input = document.getElementById("bagInput");
  const text = input.value.trim();
  if (!text) return;

  store.bags[cat].push({ text, done: false });
  input.value = "";
  saveData(); renderBag();
  toast("已加到行李清單 🧳");
}

function deleteBagItem(category, index) {
  store.bags[category].splice(index, 1);
  saveData(); renderBag();
}

// 📦 SPA 分頁系統切換
const tabs = document.querySelectorAll(".tab");
const pages = [
  document.getElementById("page-home"),
  document.getElementById("page-home"),
  document.getElementById("page-bag"),
  document.getElementById("page-money"),
  document.getElementById("page-more")
];

tabs.forEach((tab, index) => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    pages.forEach(p => p.classList.remove("active"));

    const fab = document.getElementById("editButton");

    if (index === 0 || index === 1) {
      document.getElementById("page-home").classList.add("active");
      fab.style.display = "flex";
    } else {
      fab.style.display = "none"; // 非行程頁隱藏編輯按鈕
      if (index === 2) {
        document.getElementById("page-bag").classList.add("active");
        renderBag();
      } else if (index === 3) {
        document.getElementById("page-money").classList.add("active");
      } else if (index === 4) {
        document.getElementById("page-more").classList.add("active");
      }
    }
  };
});

// 🛠️ PWA 裝載提示控制
let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("pwaBanner").style.display = "flex";
});

function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choice => {
    if (choice.outcome === "accepted") console.log("User installed PWA");
    document.getElementById("pwaBanner").style.display = "none";
  });
}

// 通用常規 UI 互動
document.getElementById("searchBox").addEventListener("input", e => renderTrips(e.target.value));
document.getElementById("editButton").onclick = () => {
  editMode = null;
  document.getElementById("editDayNum").value = "";
  document.getElementById("editDate").value = new Date().toISOString().split('T')[0];
  document.getElementById("editCity").value = "";
  document.getElementById("editPlace").value = "";
  document.getElementById("editNote").value = "";
  document.getElementById("editBanner").value = "";
  document.getElementById("editPhoto").value = "";
  document.getElementById("editModal").style.display = "flex";
};
function closeEditor() { document.getElementById("editModal").style.display = "none"; }
function toast(text) {
  let t = document.getElementById("toast"); t.innerHTML = text; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

// 🚀 初始化開機啟動
window.onload = () => {
  loadData();
  normalizeDays();
  renderTrips();
  
  // 註冊 Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
      .then(() => console.log("PWA Service Worker 已就緒"))
      .catch(err => console.error("SW 註冊失敗", err));
  }
};
