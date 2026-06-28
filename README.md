# 🇦🇺 Australia Trip Pro v2.0

> 澳洲自駕旅遊助手 — Sydney → Blue Mountains → Kiama → Brisbane

## 功能

| 頁面 | 功能 |
|------|------|
| 🏠 首頁 | Hero Banner · 即時天氣 · 今日行程 · 行李進度 · 倒數天數 |
| 🗺️ 行程 | 新增/編輯/刪除 · 搜尋 · 拖曳排序 · 跨天排序 · Google Map |
| 🧳 行李 | 澳洲冬季預設清單 · 勾選 · 分類 · 完成率 · 新增/刪除 |
| 💰 記帳 | 澳幣/台幣 · 分類 · 今日/總計 · 圓餅圖 · 匯率換算 |
| 👤 更多 | 深色模式 · 匯出/匯入 JSON · 清除資料 |

## 部署至 GitHub Pages

1. 把整個專案資料夾 push 到你的 GitHub repo
2. Settings → Pages → Source: `main` branch → `/ (root)`
3. 等約 1 分鐘，即可在 `https://<你的帳號>.github.io/<repo名稱>/` 訪問

## 本機預覽

```bash
# 任何靜態伺服器皆可，例如：
npx serve .
# 或
python3 -m http.server 8080
```

> ⚠️ 直接開啟 index.html 無法測試 Service Worker，需透過 http server

## 圖示

`images/icons/` 需要放入：
- `icon-192.png`（192×192）
- `icon-512.png`（512×512）

可用 https://favicon.io 或 Canva 製作後放入。

## 天氣

使用 [Open-Meteo](https://open-meteo.com/) 免費 API，不需要 API Key。

## 自訂出發日期

編輯 `js/app.js` 第一行：
```js
const DEPARTURE_DATE = '2025-07-10'; // ← 改成你的出發日期
```

## 技術

- 純 HTML + CSS + Vanilla JS，零依賴
- PWA（Service Worker + Manifest）
- LocalStorage 持久化
- Open-Meteo 即時天氣 API
- Unsplash 免費景點圖片
