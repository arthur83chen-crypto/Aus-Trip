# 🦘 Australia Road Trip 2026 – Family Travel App V5

## 功能清單

### ✅ 已完成
- **首頁** – Hero Banner + 倒數計時 + 今日天氣 + 行程進度 + Dynamic Island
- **行程** – 14天完整行程，每景點含介紹/GPS/停車/拍照點/打卡/收藏
- **地圖** – 澳洲路線SVG地圖 + 城市列表 + Google Maps 一鍵導航
- **記帳** – AA分帳 + 代墊計算 + AUD/TWD切換 + 成員結算
- **相簿** – 景點圖鑑 + 打卡解鎖機制 + 完成率
- **任務** – 15個旅行任務 + 分類篩選 + 完成追蹤
- **旅程日誌** – 每日記錄 + 心情選擇 + 一鍵匯出
- **SOS** – 000緊急電話 + 醫院列表 + 一鍵撥號
- **PWA** – 離線使用 + 加入主畫面 + Service Worker

## 部署到 GitHub Pages

```bash
# 1. 建立 GitHub repo
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的帳號/aus-trip.git
git push -u origin main

# 2. Settings → Pages → Source: main branch
# 3. 訪問 https://你的帳號.github.io/aus-trip/
```

## 加入 iPhone 主畫面

1. Safari 打開網址
2. 點底部分享按鈕 □↑
3. 選「加入主畫面」
4. 完成！圖示會出現在桌面

## 景點列表（14天18景點）

| Day | 地點 | 景點 |
|-----|------|------|
| 1 | Sydney | Opera House, Harbour Bridge |
| 2 | Sydney | Bondi Beach, Taronga Zoo |
| 3 | Blue Mountains | Three Sisters, Scenic World |
| 4 | Canberra | War Memorial, Parliament House |
| 5 | Lakes Entrance | Ninety Mile Beach, 小鎮 |
| 6 | Wilsons Prom | National Park |
| 7 | Phillip Island | Penguin Parade, Koala Reserve |
| 8-9 | Melbourne | CBD, Federation Sq, Museum |
| 10-12 | Great Ocean Road | Bells Beach, Twelve Apostles |
| 13 | Grampians | National Park |
| 14 | Melbourne | 機場返回 |

## 技術規格
- 純 HTML/CSS/JavaScript（零依賴）
- PWA + Service Worker 離線支援
- iOS Safe Area 適配
- Dark Mode 設計
- LocalStorage 資料持久化（待加入）
