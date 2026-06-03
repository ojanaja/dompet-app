# AI Read First

Dokumen ini adalah entry point wajib untuk AI/agent sebelum mengeksekusi task di project `dompet`.

## Urutan Baca Wajib

1. `AGENTS.md`
   - Aturan repo paling tinggi.
   - Wajib ikuti instruksi Next.js lokal dan DRY architecture rules.

2. `docs/AI_READ_FIRST.md`
   - Dokumen ini.
   - Menjelaskan urutan baca, sumber kebenaran, dan cara memilih task.

3. `FEATURE_LIST.md`
   - Inventory fitur dan audit produk.
   - Gunakan untuk memahami fitur yang ada, status flow, dan fitur yang perlu dipertahankan/dirapikan/dihide.

4. `PRODUCT_TASK_LIST.md`
   - Satu-satunya backlog/task list resmi.
   - Gunakan untuk memilih phase dan task yang akan dieksekusi.
   - Update checklist setelah task selesai.

5. Dokumentasi Next.js lokal di `node_modules/next/dist/docs/`
   - Wajib baca guide yang relevan sebelum mengubah kode Next.js.
   - Project ini memakai Next.js 16 dan tidak boleh diasumsikan sama dengan versi lama.

## Sumber Kebenaran

- **Audit fitur**: `FEATURE_LIST.md`
- **Backlog eksekusi**: `PRODUCT_TASK_LIST.md`
- **Aturan agent/repo**: `AGENTS.md`
- **Dokumentasi framework**: `node_modules/next/dist/docs/`

Jangan menambahkan checklist task baru ke `FEATURE_LIST.md`. Jika ada pekerjaan baru, masukkan ke `PRODUCT_TASK_LIST.md`.

## Workflow Eksekusi

Sebelum mengubah kode:

1. Baca task terkait di `PRODUCT_TASK_LIST.md`.
2. Baca konteks fitur terkait di `FEATURE_LIST.md`.
3. Cari implementasi existing dengan `rg` atau file search.
4. Reuse repository, service, utility, action, dan component yang sudah ada.
5. Baca dokumen Next.js lokal yang relevan.
6. Baru lakukan edit terarah.

Setelah mengubah kode:

1. Jalankan pengecekan paling relevan.
2. Jika task UI/frontend, verifikasi render lewat dev server/browser bila tersedia.
3. Update checklist di `PRODUCT_TASK_LIST.md`.
4. Jangan update checklist di `FEATURE_LIST.md`.
5. Laporkan test yang berhasil dan yang tidak bisa dijalankan.

## Cara Memilih Task

Default urutan eksekusi:

1. Selesaikan phase berjalan di `PRODUCT_TASK_LIST.md`.
2. Jangan lompat ke phase lanjutan jika masih ada task core yang belum selesai, kecuali user meminta eksplisit.
3. Untuk fitur yang masih berstatus `Decide`, jangan implementasikan opsi besar tanpa keputusan produk.
4. Untuk fitur yang overclaim atau belum matang, prefer `hide` dulu daripada membangun fitur baru besar.

## Catatan Produk

MVP yang disarankan:

- Auth.
- Manual transaction.
- Chat-assisted transaction dengan review.
- Wallet saldo aktual.
- Log transaksi dengan filter/search benar.
- Dashboard dengan scope jelas.
- Budget bulanan dasar.
- Kategori.

Fitur yang harus diperlakukan sekunder sampai ada keputusan:

- Debt tracker lengkap.
- Recurring transaction.
- Budget push alert.
- Monthly report.
- AI sarcasm preference.
- Project/business tracking.
