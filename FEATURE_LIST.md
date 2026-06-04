# Dompet Feature List & Product Audit

Dokumen ini memetakan fitur yang saat ini ada di project `dompet`, berdasarkan route, komponen UI, action, service, dan schema Prisma. Tujuannya membantu menentukan fitur mana yang perlu dipertahankan, dirapikan, digabung, atau dibuang.

## Ringkasan Status

| Area | Status | Catatan singkat |
| --- | --- | --- |
| Auth | Aktif | Login/register dan proteksi route sudah ada. |
| Chat pencatatan transaksi | Aktif, flow belum lengkap | Bisa parse teks/gambar via AI dan langsung simpan transaksi, tapi user tidak bisa review/edit sebelum simpan. |
| Pencatatan manual | Aktif | FAB membuka form transaksi manual. Flow lebih jelas daripada chat. |
| Wallet/dompet | Aktif | Dompet memengaruhi saldo dan transaksi. Perlu definisi jelas antara saldo manual vs saldo hasil transaksi. |
| Dashboard | Aktif | Menampilkan saldo wallet, metrik bulanan, chart, budget, dan transaksi terbaru. Beberapa label perlu dijaga agar tidak ambigu. |
| Log transaksi | Aktif | Riwayat, search client-side, filter tipe, filter tanggal server-side, pagination, edit/delete, export CSV. |
| Kategori | Aktif | CRUD kategori tersedia. Type kategori memengaruhi dashboard, AI category mapping, dan budget. |
| Budget bulanan | Aktif sebagian | Bisa set budget bulan ini per kategori dan tampil di dashboard, tapi setting hanya untuk bulan berjalan. |
| Debt/utang | Aktif sebagian | Debt otomatis dibuat dari metadata AI, bisa ditandai lunas, tapi tidak ada form manual atau due date. |
| Push notification | Aktif teknis, klaim fitur berlebih | Subscription tersedia, debt reminder cron tersedia. UI menyebut budget alert dan monthly report, tetapi implementasinya belum terlihat. |
| Recurring transaction | Aktif sebagian | CRUD dan cron processor ada, tetapi jadwal detail belum terhubung penuh ke form. |
| AI feedback sarkas | Aktif bersyarat | Muncul saat transaksi expense punya budget kategori. Perannya belum jelas di UX keseluruhan. |
| PWA | Aktif teknis | Manifest, icons, service worker push, dan next-pwa ada. |

## Navigasi Utama

| Route | Nama UI | Fungsi |
| --- | --- | --- |
| `/` | Chat | Layar utama untuk mencatat transaksi lewat bahasa natural atau upload gambar. |
| `/dashboard` | Dashboard | Ringkasan saldo, pemasukan/pengeluaran bulanan, distribusi, tren, budget, dan transaksi terbaru. |
| `/log` | Log | Daftar transaksi mentah dengan pencarian, filter, edit, delete, pagination, dan CSV export. |
| `/settings` | Settings | Profil, notifikasi, kategori, dompet, recurring, utang, budget, info app. |
| `/login` | Login | Login user. |
| `/register` | Register | Registrasi user. |

## Fitur Detail

### 1. Auth & Session

**Yang ada**

- Login dan register di route auth.
- NextAuth route di `/api/auth/[...nextauth]`.
- Middleware melindungi `/dashboard`, `/log`, `/settings`, dan API push.

**Status flow**

- Cukup jelas sebagai fondasi.
- Belum terlihat fitur profile management selain kartu profil read-only di Settings.

**Rekomendasi**

- Pertahankan.
- Jika ingin sederhana, Settings profile cukup read-only dulu.

### 2. Chat AI Untuk Catat Transaksi

**Yang ada**

- Input teks natural language.
- Upload gambar struk/kwitansi.
- AI parsing menghasilkan `amount`, `title`, `type`, `categorySuggested`, `notes`, `isDebt`, `debtorName`.
- Setelah parse sukses, transaksi langsung dibuat.
- Metadata AI disimpan di transaksi.

**Masalah flow**

- Tidak ada tahap review sebelum data disimpan. Kalau AI salah nominal/kategori/wallet, user harus cari transaksi di Log lalu edit.
- Chat tidak meminta wallet atau kategori spesifik. Kalau tidak ada wallet, sistem membuat default wallet otomatis.
- Category hanya dipilih dari type AI, bukan nama kategori user yang spesifik.
- Upload gambar langsung disimpan juga, tidak ada konfirmasi.

**Rekomendasi**

- Jadikan chat sebagai "draft transaction" dulu: parse -> tampilkan kartu review -> user pilih wallet/kategori -> simpan.
- Kalau tetap mau zero friction, minimal tambahkan undo atau edit cepat setelah transaksi dibuat.
- Pertimbangkan apakah chat perlu jadi layar utama atau cukup shortcut, karena flow manual saat ini lebih deterministik.

### 3. Pencatatan Manual

**Yang ada**

- Global FAB membuka `TransactionForm`.
- User mengisi tipe, judul, nominal, kategori, dompet, tanggal, dan catatan.
- Digunakan juga untuk edit transaksi di Log.
- Create/update transaksi mengubah saldo wallet.

**Status flow**

- Ini flow paling jelas untuk pencatatan transaksi.
- Butuh kategori dan dompet sudah ada agar form enak dipakai.

**Rekomendasi**

- Pertahankan sebagai primary fallback.
- Bisa jadi standar UX, lalu chat diarahkan untuk mengisi form ini otomatis.

### 4. Wallet / Dompet

**Yang ada**

- CRUD dompet di Settings.
- Dompet punya `balance`.
- Transaksi income menambah saldo wallet, expense mengurangi saldo wallet.
- Delete/edit transaksi melakukan revert/apply balance.
- Dashboard menampilkan breakdown saldo per wallet.

**Masalah flow**

- Saldo wallet bisa diset manual dari Settings, tapi transaksi juga mengubah saldo. Ini valid, tapi perlu konsep: "saldo saat ini" vs "rekonsiliasi".
- Kalau user mengubah saldo manual setelah banyak transaksi, tidak ada audit trail adjustment.
- Delete wallet membuat transaksi kehilangan referensi wallet, tetapi saldo efek historisnya tidak dijelaskan ke user.

**Rekomendasi**

- Pertahankan.
- Tambahkan konsep "adjustment transaction" atau "set saldo awal" agar perubahan saldo tidak terasa magic.
- Jelaskan di UI bahwa saldo wallet adalah saldo aktual, bukan saldo per bulan.

**Keputusan Phase 2**

- Saldo wallet adalah source of truth saldo aktual.
- Wallet baru memakai `Set Saldo Awal`; nominal awal dicatat sebagai transaksi sistem `WALLET_INITIAL_BALANCE`.
- Wallet existing memakai `Adjustment Saldo`; selisih saldo dicatat sebagai transaksi sistem `WALLET_ADJUSTMENT`.
- Transaksi sistem adjustment tampil di Log sebagai riwayat audit dan tidak diedit/dihapus dari Log.
- Delete wallet diganti menjadi archive/nonaktif supaya histori transaksi tetap menyimpan referensi dompet.

### 5. Dashboard

**Yang ada**

- Picker bulan/tahun.
- Saldo keseluruhan dari total wallet.
- Total pemasukan dan pengeluaran bulan terpilih.
- Jumlah transaksi bulan terpilih.
- Donut distribusi expense berdasarkan type kategori.
- Tren pengeluaran harian bulan terpilih.
- Progress budget per kategori.
- Transaksi terbaru bulan terpilih.

**Masalah flow**

- Dashboard mencampur scope global dan scope bulanan. Saldo keseluruhan global, sedangkan metrik lain bulanan.
- Donut chart mengelompokkan berdasarkan `CategoryType`, bukan nama kategori. Ini bisa terlalu kasar.
- "Terbaru" hanya dari bulan terpilih, bukan terbaru secara global.

**Rekomendasi**

- Pertahankan dengan label scope yang eksplisit.
- Gunakan section title seperti "Saldo Saat Ini" dan "Ringkasan Juni 2026".
- Pertimbangkan chart kategori by category name untuk insight yang lebih berguna.

**Keputusan Phase 4**

- Dashboard memisahkan area `Saldo Aktual` dari `Ringkasan [Bulan Tahun]`.
- Ringkasan bulanan menampilkan `Masuk`, `Keluar`, dan `Net`.
- Chart distribusi pengeluaran memakai nama kategori, bukan hanya `CategoryType`.
- Tren pengeluaran adalah akumulasi harian dalam bulan terpilih.
- Empty, loading, dan error state dibuat lebih eksplisit.

### 6. Log Transaksi

**Yang ada**

- List transaksi paginated 20 item.
- Filter tanggal via query param.
- Search title/notes client-side untuk halaman yang sedang dimuat.
- Filter tipe client-side.
- Expand detail transaksi.
- Edit/delete transaksi.
- Export CSV dari transaksi yang sedang dimuat.

**Masalah flow**

- Search dan filter tipe hanya berlaku pada page saat ini, bukan seluruh database.
- CSV export hanya mengekspor transaksi yang sedang ada di client, bukan semua hasil filter server.
- Edit transaksi baru memuat kategori/wallet saat edit dibuka; bisa terasa delay.

**Rekomendasi**

- Pertahankan.
- Jika log dipakai serius, pindahkan search/type filter ke server query.
- Label export menjadi "Export halaman ini" atau ubah agar export semua hasil filter.

**Keputusan Phase 3**

- Search, filter tipe, filter tanggal, dan pagination Log memakai query params (`q`, `type`, `start`, `end`, `page`).
- Search/filter dijalankan server-side agar berlaku ke seluruh dataset, bukan hanya page client.
- Export CSV diputuskan menjadi semua hasil filter aktif via endpoint `/api/log/export`.
- Empty state dibedakan antara belum ada transaksi dan filter tidak menghasilkan data.

### 7. Kategori

**Yang ada**

- CRUD kategori di Settings.
- Type kategori: `ESSENTIAL`, `LIFESTYLE`, `INCOME`, `PROJECT`.
- Kategori dipakai transaksi, budget, dashboard, recurring, dan AI mapping.

**Masalah flow**

- Category name global unique di schema, bukan per user. Ini bisa membatasi multi-user.
- Chat AI memilih type kategori, bukan kategori user yang spesifik.
- Type `PROJECT` ada, tapi flow proyek/bisnis belum punya UI khusus.

**Rekomendasi**

- Pertahankan kategori.
- Pertimbangkan kategori per user.
- Jika `PROJECT` belum punya fungsi khusus, perlakukan sebagai kategori biasa atau hilangkan dari narasi fitur.

### 8. Budget Bulanan

**Yang ada**

- Set budget bulan berjalan per kategori expense.
- Jika budget sudah ada, input akan menampilkan nominal existing saat kategori dipilih.
- Dashboard menampilkan spent vs budget untuk bulan terpilih.
- AI feedback sarkas dapat aktif berdasarkan sisa budget kategori.

**Masalah flow**

- Settings hanya mengatur budget bulan ini, sementara Dashboard bisa melihat bulan lain.
- Tidak ada UI edit/delete budget eksplisit, hanya upsert via kategori.
- Notifikasi UI menyebut alert budget 80%, tapi implementasi push alert budget belum terlihat.

**Rekomendasi**

- Pertahankan sebagai fitur inti.
- Tambahkan month picker di Settings budget atau pindahkan budget management ke halaman khusus.
- Jangan klaim budget push alert sampai benar-benar ada trigger.

### 9. Debt / Utang

**Yang ada**

- Model `Debt`.
- Debt dibuat otomatis saat AI metadata `isDebt` true.
- Settings menampilkan unpaid debts dan tombol mark as paid.
- Cron debt reminder mengirim push reminder untuk semua user.

**Masalah flow**

- Tidak ada form manual untuk membuat debt.
- Tidak ada due date, padahal UI/README menyiratkan reminder jatuh tempo.
- "Utang" bisa berarti user meminjam atau user membayari orang lain, tapi data model hanya `debtorName`.
- Mark as paid tidak membuat transaksi pembayaran balik dan tidak mengubah saldo wallet.

**Rekomendasi**

- Kalau belum mau bangun serius, sederhanakan menjadi "Piutang tercatat dari chat".
- Jika dipertahankan, tambahkan direction, due date, status, dan payment transaction flow.
- Hindari menyebut jatuh tempo sampai field `dueDate` ada.

### 10. Recurring Transaction

**Yang ada**

- CRUD recurring transaction di Settings.
- Frequency daily/weekly/monthly/yearly.
- Cron endpoint `/api/cron/recurring`.
- Processor membuat transaksi saat due dan update `lastRunAt`.
- Tombol play di Settings menjalankan cron manual.

**Masalah flow**

- Form hanya mengisi `startDate` dan `frequency`; field `dayOfMonth`, `dayOfWeek`, dan `endDate` tidak tersedia.
- Untuk monthly/yearly, schedule real bergantung fallback selisih hari, bukan konfigurasi yang user pahami.
- Tombol "Simulasikan Cron Job" adalah alat developer tapi muncul di Settings user.
- GET cron bisa dipanggil dari browser jika `CRON_SECRET` tidak diset.

**Rekomendasi**

- Untuk user-facing app, sembunyikan tombol run cron.
- Tambahkan schedule summary yang jelas: "berjalan setiap tanggal X".
- Jika tidak mau kompleks, batasi ke monthly dengan tanggal tetap.

### 11. Push Notification

**Yang ada**

- UI enable/disable push subscription.
- API subscribe/unsubscribe.
- Service worker push.
- Debt reminder cron mengirim notification.
- README menjelaskan setup VAPID dan cron.

**Masalah flow**

- UI menyebut tiga jenis notifikasi: Pengingat Utang, Batas Anggaran, Laporan Bulanan.
- Implementasi yang terlihat baru debt reminder/test notification.
- Debt reminder tidak punya due date, jadi reminder tidak benar-benar "mendekati jatuh tempo".

**Rekomendasi**

- Ubah copy UI menjadi hanya fitur yang benar-benar aktif.
- Tambahkan preference per notification type jika fiturnya dikembangkan.
- Jangan tampilkan budget/monthly notification sebagai fitur aktif sebelum ada trigger.

### 12. AI Feedback Sarkas

**Yang ada**

- Setelah expense dengan budget kategori, app memanggil AI untuk membuat feedback singkat.
- Debt transaction punya feedback khusus.

**Masalah flow**

- Feedback hanya muncul di chat setelah create transaction.
- Manual transaction tidak menampilkan feedback walaupun service bisa mengembalikan `aiFeedback`.
- Tone sarkas bisa terasa gimmick jika tidak dikontrol user.

**Rekomendasi**

- Jadikan opsional atau ubah tone ke "tegas tapi membantu".
- Jika dipertahankan, tampilkan konsisten di manual flow juga atau batasi hanya chat.

### 13. PWA

**Yang ada**

- Manifest dan icons.
- `next-pwa`.
- Service worker push.

**Masalah flow**

- Tidak terlihat onboarding install app.
- PWA lebih sebagai capability teknis daripada fitur UX.

**Rekomendasi**

- Pertahankan sebagai infra.
- Tambahkan install prompt hanya kalau target mobile memang penting.

## Fitur Yang Terlihat Nyampah / Perlu Keputusan

| Fitur | Kenapa terasa nyampah | Keputusan yang disarankan |
| --- | --- | --- |
| Budget push alert | Disebut di UI, belum terlihat trigger aktual. | Sembunyikan copy atau implementasikan trigger. |
| Monthly report notification | Disebut di UI, belum terlihat implementasi. | Sembunyikan dulu. |
| Debt due reminder | Tidak ada due date. | Tambahkan due date atau ubah copy jadi reminder utang umum. |
| Recurring run cron button | Developer tool muncul di Settings user. | Sembunyikan di production atau pindah ke admin/debug. |
| Chat auto-save | Cepat, tapi rawan salah dan flow koreksinya jauh. | Ubah ke review-before-save atau tambah undo/edit cepat. |
| PROJECT category type | Ada type, tapi tidak ada flow project/bisnis khusus. | Jadikan kategori biasa atau buat fitur project sungguhan. |
| CSV export | Export hanya page saat ini, tapi labelnya seolah general. | Rename atau ubah mekanisme export. |
| Search log | Search hanya data page saat ini. | Rename scope atau pindahkan ke server. |
| Profile card | Ada tampilan profil, tapi tidak bisa diedit. | Biarkan read-only atau tambah edit profile. |

## Prioritas Perapihan

### P0 - Bikin Produk Tidak Membingungkan

1. Rapikan copy notifikasi agar hanya menyebut fitur yang benar-benar aktif.
2. Sembunyikan tombol run cron recurring dari user biasa.
3. Perjelas scope Dashboard: saldo saat ini vs metrik bulanan.
4. Ubah chat transaction menjadi review-before-save atau sediakan undo/edit cepat.

### P1 - Bikin Fitur Inti Solid

1. Server-side search/filter untuk Log.
2. Budget management dengan month picker.
3. Wallet balance adjustment yang punya audit trail.
4. Recurring schedule yang eksplisit dan bisa dipahami user.

### P2 - Baru Tambah Fitur Lanjutan

1. Debt tracker lengkap dengan direction, due date, dan payment flow.
2. Notification preferences per tipe.
3. Monthly report sungguhan.
4. Project/business tracking jika `PROJECT` mau dipertahankan.

## Rekomendasi Struktur Produk

Kalau ingin app terasa lebih ringkas, susunan fitur inti yang paling masuk akal:

1. **Catat transaksi**: manual form dan chat-assisted draft.
2. **Dompet**: saldo aktual per akun.
3. **Log**: audit semua transaksi.
4. **Dashboard**: insight bulanan dan saldo saat ini.
5. **Budget**: batas kategori per bulan.

Fitur yang sebaiknya dianggap sekunder sampai flow-nya matang:

- Debt tracker.
- Recurring transaction.
- Push notification.
- AI sarcasm.
- Monthly report.

## Backlog Eksekusi

Feature list ini sengaja tidak menyimpan checklist eksekusi agar tidak ada dua sumber kebenaran.

Gunakan `PRODUCT_TASK_LIST.md` sebagai satu-satunya backlog/task list resmi. Jika ada task baru, update `PRODUCT_TASK_LIST.md`; jika ada temuan audit baru, update dokumen ini.
