# Dompet Product Task List

Dokumen ini adalah backlog menyeluruh untuk merapikan aplikasi `dompet` dari kondisi sekarang menjadi produk yang flow-nya jelas. Detail audit per fitur ada di `FEATURE_LIST.md`; dokumen ini fokus pada urutan kerja.

## Prinsip Keputusan

- **Core first**: catat transaksi, wallet, log, dashboard, dan budget harus jelas dulu.
- **Hide before build**: fitur yang belum benar-benar jalan jangan ditampilkan sebagai janji ke user.
- **One source of truth**: saldo wallet, transaksi, budget, dan debt harus punya definisi yang tidak saling tabrakan.
- **Review over magic**: AI boleh membantu, tapi user tetap harus bisa mengoreksi sebelum data penting disimpan.

## Phase 0 - Product Cleanup Cepat

Tujuan: mengurangi kebingungan user tanpa rombak database besar.

- [x] Rename `Saldo Keseluruhan` menjadi `Saldo Saat Ini`.
  - Area: `src/components/dashboard/DashboardContent.tsx`
  - Alasan: saldo ini global dari wallet, bukan saldo bulan.

- [x] Tambahkan heading/scope `Ringkasan [Bulan Tahun]` untuk metrik bulanan Dashboard.
  - Area: `src/components/dashboard/DashboardContent.tsx`
  - Alasan: membedakan saldo global dan metrik periode.

- [x] Rename section Dashboard `Terbaru` menjadi `Terbaru Bulan Ini`.
  - Area: `src/components/dashboard/DashboardContent.tsx`
  - Alasan: data terbaru berasal dari bulan terpilih.

- [x] Rename tombol CSV menjadi `CSV Halaman Ini`.
  - Area: `src/components/log/LogContent.tsx`
  - Alasan: export saat ini hanya transaksi yang sedang dimuat di page client.

- [x] Hide copy notification `Batas Anggaran`.
  - Area: `src/components/settings/NotificationSettings.tsx`
  - Alasan: trigger push budget alert belum terlihat.

- [x] Hide copy notification `Laporan Bulanan`.
  - Area: `src/components/settings/NotificationSettings.tsx`
  - Alasan: monthly digest belum ada.

- [x] Ubah copy `Pengingat Utang mendekati jatuh tempo` menjadi reminder utang umum.
  - Area: `src/components/settings/NotificationSettings.tsx`
  - Alasan: model `Debt` belum punya due date.

- [x] Hide tombol `Simulasikan Cron Job` dari Settings user.
  - Area: `src/components/settings/RecurringSettings.tsx`
  - Alasan: ini developer/debug action, bukan workflow user.

- [x] Tambahkan label atau helper text bahwa saldo wallet adalah saldo aktual.
  - Area: `src/components/settings/WalletSettings.tsx`, `src/components/dashboard/DashboardContent.tsx`
  - Alasan: menghindari asumsi saldo per bulan.

## Phase 1 - Transaksi Sebagai Inti Produk

Tujuan: semua transaksi yang masuk bisa dipercaya, diedit, dan diaudit.

- [x] Ubah Chat AI dari auto-save menjadi review-before-save.
  - Area: `src/components/chat/ChatPanel.tsx`
  - Flow target: user input -> AI parse -> review card -> user confirm -> create transaction.

- [x] Review card Chat menampilkan nominal, tipe, judul, kategori, wallet, tanggal, dan notes.
  - Area: `src/components/chat/ChatPanel.tsx`, `src/components/transaction/TransactionForm.tsx`
  - Reuse: gunakan pola/form existing dari `TransactionForm`.

- [x] Chat review card harus bisa edit kategori sebelum save.
  - Area: `src/components/chat/ChatPanel.tsx`, `src/actions/core.actions.ts`
  - Alasan: AI saat ini hanya memilih `CategoryType`, bukan kategori spesifik.

- [x] Chat review card harus bisa edit wallet sebelum save.
  - Area: `src/components/chat/ChatPanel.tsx`, `src/actions/wallet.actions.ts`
  - Alasan: transaksi chat sekarang masuk wallet default.

- [x] Tambahkan action `Cancel draft` di hasil parse chat.
  - Area: `src/components/chat/ChatPanel.tsx`
  - Alasan: user harus bisa membatalkan hasil AI yang salah.

- [x] Tambahkan feedback setelah save dengan shortcut ke Log atau edit cepat.
  - Area: `src/components/chat/ChatPanel.tsx`
  - Alasan: tetap memberi jalan koreksi setelah transaksi dibuat.

- [x] Pastikan manual transaction form tetap menjadi flow utama yang stabil.
  - Area: `src/components/transaction/TransactionForm.tsx`, `src/components/transaction/GlobalFAB.tsx`
  - Alasan: manual flow adalah fallback paling akurat.

- [x] Validasi form transaksi untuk amount invalid/NaN.
  - Area: `src/components/transaction/TransactionForm.tsx`, `src/services/transaction.service.ts`
  - Alasan: parsing input nominal manual perlu aman.

- [x] Rapikan tipe TypeScript transaksi agar tidak memakai `any`.
  - Area: `src/components/transaction/TransactionForm.tsx`, `src/components/log/LogContent.tsx`, `src/components/chat/ChatPanel.tsx`
  - Alasan: mengurangi bug kontrak data.

## Phase 2 - Wallet & Saldo

Tujuan: saldo wallet menjadi source of truth yang jelas dan tidak terasa magic.

- [x] Tentukan konsep saldo: saldo awal + mutasi transaksi + adjustment.
  - Area: product decision, `prisma/schema.prisma`
  - Output: keputusan tertulis di `FEATURE_LIST.md` atau README.

- [x] Tambahkan flow `Set Saldo Awal` untuk wallet baru.
  - Area: `src/components/settings/WalletSettings.tsx`
  - Alasan: saldo awal berbeda dari edit saldo aktual setelah transaksi berjalan.

- [x] Tambahkan flow `Adjustment Saldo` untuk wallet existing.
  - Area: `src/components/settings/WalletSettings.tsx`, `src/services/transaction.service.ts`
  - Alasan: edit saldo harus punya audit trail.

- [x] Buat kategori/system marker untuk adjustment transaction.
  - Area: `prisma/schema.prisma`, `src/services/transaction.service.ts`
  - Alasan: adjustment perlu dibedakan dari income/expense biasa.

- [x] Tampilkan riwayat adjustment di Log.
  - Area: `src/components/log/LogContent.tsx`
  - Alasan: user bisa melihat kenapa saldo berubah.

- [x] Ubah delete wallet menjadi archive/nonaktif.
  - Area: `prisma/schema.prisma`, `src/components/settings/WalletSettings.tsx`, `src/services/wallet.service.ts`
  - Alasan: delete wallet bisa merusak histori transaksi.

- [x] Tampilkan jumlah transaksi terkait sebelum wallet dihapus/diarsipkan.
  - Area: `src/components/settings/WalletSettings.tsx`, `src/repositories/transaction.repository.ts`
  - Alasan: user paham dampak aksinya.

## Phase 3 - Log Transaksi

Tujuan: Log menjadi audit trail utama yang bisa dicari dan diekspor dengan benar.

- [x] Pindahkan search Log ke server-side query.
  - Area: `src/app/(app)/log/page.tsx`, `src/services/transaction.service.ts`
  - Alasan: search client-side hanya mencari page saat ini.

- [x] Pindahkan filter tipe Log ke server-side query.
  - Area: `src/app/(app)/log/page.tsx`, `src/components/log/LogContent.tsx`, `src/services/transaction.service.ts`
  - Alasan: filter harus berlaku ke seluruh dataset.

- [x] Jadikan search/filter/page sebagai query params yang stabil.
  - Area: `src/components/log/LogContent.tsx`
  - Alasan: state bisa di-refresh, dibagikan, dan dipakai export.

- [x] Tambahkan reset filter yang membersihkan semua query.
  - Area: `src/components/log/LogContent.tsx`
  - Alasan: UX filter lebih jelas.

- [x] Putuskan export CSV: page-only atau all filtered.
  - Area: product decision
  - Opsi A: tetap page-only dengan label jelas.
  - Opsi B: server export semua hasil filter.

- [x] Jika pilih all-filtered export, buat endpoint export CSV.
  - Area: `src/app/api/...`, `src/services/transaction.service.ts`
  - Alasan: client tidak memegang semua data.

- [x] Tambahkan empty state yang membedakan tidak ada data vs filter tidak cocok.
  - Area: `src/components/log/LogContent.tsx`
  - Alasan: user tahu apakah perlu tambah transaksi atau ubah filter.

## Phase 4 - Dashboard

Tujuan: Dashboard memberi insight yang tepat tanpa scope yang rancu.

- [x] Pisahkan visual area `Saldo Saat Ini` dan `Ringkasan Bulanan`.
  - Area: `src/components/dashboard/DashboardContent.tsx`
  - Alasan: global vs bulanan tidak bercampur.

- [x] Tambahkan metric `Net Bulan Ini`.
  - Area: `src/actions/dashboard.actions.ts`, `src/components/dashboard/DashboardContent.tsx`
  - Alasan: menggantikan kebutuhan melihat `income - expense` bulanan tanpa menyebutnya saldo keseluruhan.

- [x] Putuskan chart distribusi by category type atau category name.
  - Area: product decision
  - Opsi A: by type untuk ringkasan kasar.
  - Opsi B: by category name untuk insight praktis.

- [x] Jika pilih by category name, ubah aggregate dashboard.
  - Area: `src/actions/dashboard.actions.ts`
  - Alasan: chart menjadi lebih informatif.

- [x] Tambahkan empty state chart yang lebih jelas saat belum ada expense.
  - Area: `src/components/charts/ExpenseDonutChart.tsx`, `src/components/dashboard/DashboardContent.tsx`
  - Alasan: chart kosong tidak terasa rusak.

- [x] Pastikan trend pengeluaran mengakumulasi harian sesuai ekspektasi.
  - Area: `src/actions/dashboard.actions.ts`, `src/components/charts/SpendingTrendChart.tsx`
  - Alasan: perlu jelas apakah trend harian per hari atau cumulative.

- [x] Tambahkan loading/error state dashboard yang lebih informatif.
  - Area: `src/app/(app)/dashboard/loading.tsx`, `src/components/dashboard/DashboardContent.tsx`
  - Alasan: saat data gagal, user butuh konteks.

## Phase 5 - Budget

Tujuan: budget menjadi fitur bulanan yang jelas dan bisa dikelola.

- [ ] Tambahkan month/year picker di Budget Settings.
  - Area: `src/components/settings/BudgetSettings.tsx`, `src/app/(app)/settings/page.tsx`
  - Alasan: budget saat ini hanya bulan berjalan.

- [ ] Tampilkan daftar budget bulan terpilih.
  - Area: `src/components/settings/BudgetSettings.tsx`
  - Alasan: user melihat semua budget yang sudah diatur.

- [ ] Tambahkan edit budget eksplisit.
  - Area: `src/components/settings/BudgetSettings.tsx`, `src/actions/core.actions.ts`
  - Alasan: saat ini edit tersirat dari memilih kategori.

- [ ] Tambahkan delete budget.
  - Area: `src/actions/core.actions.ts`, `src/services/budget.service.ts`, `src/repositories/budget.repository.ts`
  - Alasan: user harus bisa menghapus budget yang tidak relevan.

- [ ] Tambahkan validasi budget amount.
  - Area: `src/components/settings/BudgetSettings.tsx`, `src/services/budget.service.ts`
  - Alasan: nominal kosong/NaN harus ditolak.

- [ ] Putuskan apakah budget alert push benar-benar akan dibuat.
  - Area: product decision
  - Opsi A: hide selamanya.
  - Opsi B: trigger saat transaksi membuat spent melewati 80%.

- [ ] Jika buat budget alert, implement trigger saat create/update transaction.
  - Area: `src/services/transaction.service.ts`, `src/services/push.service.ts`
  - Alasan: alert harus muncul saat crossing threshold, bukan sekadar copy UI.

## Phase 6 - Kategori

Tujuan: kategori menjadi struktur yang cocok untuk multi-user dan AI.

- [ ] Putuskan kategori global atau per user.
  - Area: product decision, `prisma/schema.prisma`
  - Alasan: schema sekarang `Category.name` unique global.

- [ ] Jika kategori per user, tambah `userId` pada Category.
  - Area: `prisma/schema.prisma`, migration
  - Alasan: user berbeda bisa punya kategori dengan nama sama.

- [ ] Update repository/service kategori untuk scope user.
  - Area: `src/repositories/category.repository.ts`, `src/services/category.service.ts`, `src/actions/core.actions.ts`
  - Alasan: data isolation.

- [ ] Update seed kategori default.
  - Area: `prisma/seed.ts`
  - Alasan: default category harus tetap ada.

- [ ] Putuskan nasib `PROJECT`.
  - Area: product decision
  - Opsi A: pertahankan sebagai kategori biasa.
  - Opsi B: buat project tracking.
  - Opsi C: hapus dari prompt AI dan dropdown.

- [ ] Jika `PROJECT` tetap ada, perjelas label dan penggunaannya.
  - Area: `src/components/settings/CategorySettings.tsx`, `src/services/ai.service.ts`
  - Alasan: tidak terasa fitur menggantung.

## Phase 7 - Debt / Piutang

Tujuan: debt tracker tidak lagi setengah jadi.

- [ ] Putuskan scope fitur: debt sederhana atau tracker lengkap.
  - Area: product decision
  - Opsi A: sederhana: piutang dari chat, mark paid.
  - Opsi B: lengkap: arah utang/piutang, due date, settlement.

- [ ] Jika sederhana, rename UI menjadi `Piutang dari Chat`.
  - Area: `src/components/settings/SettingsContent.tsx`, `src/services/ai.service.ts`
  - Alasan: sesuai implementasi sekarang yang mostly dari metadata AI.

- [ ] Jika lengkap, tambah field `direction`.
  - Area: `prisma/schema.prisma`
  - Alasan: membedakan user berutang vs orang lain berutang ke user.

- [ ] Jika lengkap, tambah field `dueDate`.
  - Area: `prisma/schema.prisma`
  - Alasan: reminder jatuh tempo butuh tanggal.

- [ ] Jika lengkap, tambah form manual create/edit debt.
  - Area: `src/components/settings/SettingsContent.tsx` atau halaman debt baru
  - Alasan: debt tidak boleh hanya bergantung pada AI.

- [ ] Jika lengkap, mark paid harus bisa membuat transaksi settlement.
  - Area: `src/services/debt.service.ts`, `src/services/transaction.service.ts`
  - Alasan: pembayaran utang/piutang memengaruhi wallet.

- [ ] Update debt reminder agar hanya mengirim untuk debt relevan.
  - Area: `src/services/debt.service.ts`, `src/app/api/cron/debt-reminders/route.ts`
  - Alasan: reminder tanpa due date/threshold mudah jadi spam.

## Phase 8 - Recurring Transaction

Tujuan: recurring menjadi jadwal yang user pahami, bukan sekadar cron teknis.

- [ ] Putuskan recurring dipertahankan atau di-hide dulu.
  - Area: product decision
  - Alasan: fiturnya belum sekuat core transaction.

- [ ] Jika dipertahankan, batasi MVP ke monthly fixed-date.
  - Area: `src/components/settings/RecurringSettings.tsx`, `src/services/recurring.service.ts`
  - Alasan: paling umum dan paling mudah dipahami.

- [ ] Tambahkan input `Tanggal jalan` untuk monthly.
  - Area: `src/components/settings/RecurringSettings.tsx`
  - Alasan: field `dayOfMonth` ada di schema tapi belum dipakai form.

- [ ] Tambahkan schedule summary.
  - Area: `src/components/settings/RecurringSettings.tsx`
  - Contoh: `Berjalan tiap tanggal 25 mulai 25 Juni 2026`.

- [ ] Tambahkan toggle active/inactive.
  - Area: `src/components/settings/RecurringSettings.tsx`, `src/actions/recurring.actions.ts`
  - Alasan: user mungkin pause tanpa delete.

- [ ] Tambahkan end date jika frequency tetap lengkap.
  - Area: `src/components/settings/RecurringSettings.tsx`, `prisma/schema.prisma`
  - Alasan: schema punya `endDate`, UI belum.

- [ ] Pastikan cron endpoint production wajib secret.
  - Area: `src/app/api/cron/recurring/route.ts`
  - Alasan: kalau `CRON_SECRET` kosong, endpoint bisa jalan tanpa auth.

- [ ] Tambahkan logging hasil recurring yang gagal.
  - Area: `src/services/recurring.service.ts`
  - Alasan: recurring failure sulit dilacak.

## Phase 9 - Push Notification

Tujuan: notification hanya menampilkan fitur yang benar-benar jalan.

- [ ] Rapikan UI notification menjadi status subscription + debt reminder umum.
  - Area: `src/components/settings/NotificationSettings.tsx`
  - Alasan: menghapus overclaim.

- [ ] Tambahkan test notification button hanya di debug/development.
  - Area: `src/app/api/debug/send-test-notification/route.ts`, Settings optional
  - Alasan: user biasa tidak butuh debug.

- [ ] Tambahkan preference notification type jika lebih dari satu notif aktif.
  - Area: `prisma/schema.prisma`, `src/components/settings/NotificationSettings.tsx`
  - Alasan: user perlu kontrol.

- [ ] Implement budget alert hanya jika Phase 5 dipilih.
  - Area: `src/services/transaction.service.ts`, `src/services/push.service.ts`
  - Alasan: jangan bangun trigger tanpa product decision.

- [ ] Implement monthly report hanya jika Phase 12 dipilih.
  - Area: report service baru, cron route baru
  - Alasan: monthly report butuh konten dan jadwal.

## Phase 10 - Settings IA

Tujuan: Settings tidak menjadi tempat semua fitur dilempar.

- [ ] Kelompokkan Settings menjadi section yang lebih jelas.
  - Area: `src/components/settings/SettingsContent.tsx`
  - Suggested groups: Account, Finance Setup, Automation, Notifications, About.

- [ ] Pertimbangkan tabs di Settings.
  - Area: `src/components/settings/SettingsContent.tsx`
  - Alasan: halaman terlalu panjang.

- [ ] Pindahkan Budget ke halaman/section khusus jika fitur makin besar.
  - Area: optional route baru
  - Alasan: budget butuh month picker dan daftar.

- [ ] Pindahkan Recurring ke halaman/section khusus jika dipertahankan.
  - Area: optional route baru
  - Alasan: recurring punya form kompleks.

- [ ] Buat About menjadi paling bawah dan minimal.
  - Area: `src/components/settings/SettingsContent.tsx`
  - Alasan: info app bukan task utama user.

## Phase 11 - AI Behavior

Tujuan: AI membantu tanpa mengambil alih kontrol data.

- [ ] Kirim konteks kategori user ke AI parser.
  - Area: `src/services/ai.service.ts`, `src/actions/ai.actions.ts`
  - Alasan: hasil kategori lebih relevan.

- [ ] Kirim konteks wallet user ke AI parser hanya jika dibutuhkan.
  - Area: `src/services/ai.service.ts`, `src/actions/ai.actions.ts`
  - Alasan: input seperti "gopay makan 50rb" bisa dipetakan.

- [ ] Tambahkan confidence atau reason pada parse result.
  - Area: `src/services/ai.service.ts`
  - Alasan: UI bisa meminta review lebih kuat saat confidence rendah.

- [ ] Putuskan tone AI feedback.
  - Area: product decision
  - Opsi A: sarkas.
  - Opsi B: netral.
  - Opsi C: user preference.

- [ ] Jika tetap sarkas, tambahkan setting tone.
  - Area: Settings + schema/user preference
  - Alasan: tone tajam tidak cocok untuk semua user.

- [ ] Pastikan manual transaction bisa mendapatkan feedback atau sengaja tidak.
  - Area: `src/components/transaction/TransactionForm.tsx`, `src/actions/transaction.actions.ts`
  - Alasan: konsistensi UX.

## Phase 12 - Reports / Monthly Digest

Tujuan: monthly report hanya dibangun jika memang dibutuhkan.

- [ ] Putuskan apakah monthly report masuk scope v1.
  - Area: product decision
  - Alasan: ini fitur tambahan, bukan core.

- [ ] Definisikan isi monthly report.
  - Suggested content: total income, total expense, net, top categories, wallet balance, budget overrun.

- [ ] Buat service aggregate monthly report.
  - Area: service baru atau reuse dashboard action/service
  - Alasan: jangan duplikasi query dashboard jika bisa reuse.

- [ ] Buat UI preview report.
  - Area: route/section baru
  - Alasan: user bisa melihat sebelum push/email.

- [ ] Buat cron monthly report jika notification dipilih.
  - Area: API cron baru, `src/services/push.service.ts`
  - Alasan: report harus dikirim otomatis.

## Phase 13 - Technical Quality

Tujuan: kode lebih mudah dirawat setelah fitur dipilih.

- [ ] Jalankan dan rapikan full lint.
  - Area: seluruh `src`
  - Catatan: saat ini lint gagal karena banyak `any`, hook rules, dan unused import.

- [ ] Ganti `any` di repository/service/action bertahap.
  - Area: `src/repositories`, `src/services`, `src/actions`
  - Alasan: kontrak data lebih aman.

- [ ] Rapikan hook lint di Settings components.
  - Area: `src/components/settings/*`
  - Alasan: beberapa effect memanggil state update pattern yang dilint React.

- [ ] Pindahkan query aggregate besar ke service khusus jika makin kompleks.
  - Area: `src/actions/dashboard.actions.ts`
  - Alasan: server action dashboard sudah memuat banyak logic.

- [ ] Tambahkan unit/integration test untuk transaction balance mutation.
  - Area: `src/services/transaction.service.ts`, test setup baru
  - Alasan: saldo wallet adalah fitur kritikal.

- [ ] Tambahkan test untuk delete/update transaction revert/apply balance.
  - Area: `src/services/transaction.service.ts`
  - Alasan: bug di sini langsung merusak saldo.

- [ ] Tambahkan test untuk recurring due calculation jika fitur dipertahankan.
  - Area: `src/services/recurring.service.ts`
  - Alasan: jadwal recurring rawan edge case.

- [ ] Tambahkan docs env setup.
  - Area: `README.md`
  - Alasan: README sekarang terlalu fokus push notification.

- [ ] Pindahkan push setup detail ke docs terpisah.
  - Area: `docs/PUSH_NOTIFICATIONS.md`
  - Alasan: README lebih bersih.

## Phase 14 - Possible Removals

Fitur di bawah ini layak dihapus atau di-hide jika tidak ingin dikembangkan dalam waktu dekat.

- [ ] Remove/hide monthly report notification claim.
  - Alasan: belum ada implementasi.

- [ ] Remove/hide budget push alert claim.
  - Alasan: belum ada trigger.

- [ ] Remove/hide recurring transaction dari Settings jika tidak masuk MVP.
  - Alasan: flow schedule belum matang.

- [ ] Remove/hide debt tracker jika tidak mau tambah due date/direction/payment flow.
  - Alasan: sekarang hanya separuh fitur.

- [ ] Remove `PROJECT` dari prompt/dropdown jika tidak ada project tracking.
  - Alasan: menghindari kategori yang tidak punya fungsi jelas.

- [ ] Remove/disable AI sarcasm jika tone produk ingin lebih serius.
  - Alasan: bisa mengganggu trust untuk aplikasi finansial.

## Recommended Execution Order

1. **Phase 0**: cleanup copy dan hide fitur overclaim.
2. **Phase 1**: ubah chat menjadi review-before-save.
3. **Phase 2**: bereskan konsep wallet/saldo.
4. **Phase 3**: jadikan Log search/filter/export benar.
5. **Phase 4-5**: rapikan Dashboard dan Budget.
6. **Phase 6**: putuskan kategori per user dan nasib `PROJECT`.
7. **Phase 7-9**: pilih apakah Debt, Recurring, Push dikembangkan atau di-hide.
8. **Phase 10-13**: rapikan IA Settings, AI behavior, report, dan technical quality.

## MVP v1 Scope Yang Disarankan

Untuk rilis yang terasa bersih, cukup pertahankan:

- Auth.
- Manual transaction.
- Chat-assisted transaction dengan review.
- Wallet saldo aktual.
- Log transaksi dengan filter/search benar.
- Dashboard dengan scope jelas.
- Budget bulanan dasar.
- Kategori.

Tunda atau hide:

- Debt tracker lengkap.
- Recurring transaction.
- Budget push alert.
- Monthly report.
- AI sarcasm preference.
- Project/business tracking.
