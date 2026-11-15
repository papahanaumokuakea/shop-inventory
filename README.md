# المخزن — Shop inventory app

Offline Arabic inventory app for a motorcycle / tricycle parts shop: quick sell, receipt-style stock table, deliveries, per-item pricing, one-tap backup.

- **Web app (install from Chrome):** GitHub Pages link in the repo's About box → open in Chrome → ⋮ → *Install app*.
- **APK:** `Releases → apk → shop.apk`. Rebuilt automatically on every change.
- **Data:** saved on the device (IndexedDB). Backup / restore from الإعدادات → النسخ الاحتياطي (share to Google Drive or WhatsApp).
- **Stock list:** not stored in this repo. The starter file (`shop-stock-start.json`) is shared privately and opened from the app.

Edit `web/index.html` → push to `main` → both the web app and the APK update.

`keystore/debug.keystore` is a plain Android debug key, kept fixed so each new APK installs over the previous one without wiping data.
