# Implementation Plan: 'dompet'
**AI-Powered Personal Finance PWA**

## 1. Project Overview
'dompet' adalah asisten perencana dan pelacak keuangan personal berbasis Progressive Web App (PWA) yang dioptimalkan untuk ekosistem iOS. Sistem ini fokus pada pengalaman pengguna tanpa hambatan (*zero friction*) melalui chat pintar (Natural Language & OCR), AI budgeting proaktif, dan antarmuka analitik bergaya premium (*glassmorphism*).

**Tech Stack:**
- **Frontend / Fullstack Framework:** Next.js (App Router) dengan `next-pwa`
- **Styling & UI:** Tailwind CSS, Framer Motion (untuk animasi transisi)
- **Database & ORM:** PostgreSQL dengan Prisma ORM
- **Visualisasi Data:** Nivo / Recharts
- **Kecerdasan Buatan:** OpenAI API / Gemini API (NLP & Vision)
- **Deployment:** Docker & Docker Compose (Self-hosted di Windows Local Server via SSH)

---

## 2. Timeline & Milestones (7-Day Plan)

### Day 1: Setup & Infrastructure
**Fokus:** Membangun fondasi framework dan environment lokal.
- [ ] Inisialisasi proyek Next.js (App Router, TypeScript, Tailwind CSS).
- [ ] Konfigurasi module `next-pwa` untuk dukungan instalasi iOS dan fungsionalitas offline/cache dasar.
- [ ] Setup `docker-compose.yml` untuk menjalankan instance PostgreSQL secara lokal.
- [ ] Inisialisasi Prisma ORM dan koneksi awal ke database lokal.

### Day 2: Database Schema & API Core
**Fokus:** Desain struktur data dan konektivitas backend.
- [ ] Desain Prisma Schema: `User`, `Transaction`, `Category`, `Budget`, `Debt`.
- [ ] Jalankan database migration (`prisma migrate dev`).
- [ ] Buat Server Actions / API Routes untuk operasi CRUD dasar pada entitas di atas.
- [ ] Inisialisasi *seed data* untuk testing pengembangan.

### Day 3: Smart Input & AI Parser
**Fokus:** Otak dari sistem pencatatan keuangan otomatis.
- [ ] Integrasi SDK OpenAI / Gemini API (untuk teks dan Vision OCR).
- [ ] Rancang *system prompt* yang kokoh untuk mem-parsing input bahasa natural ("makan siang 50rb") menjadi objek JSON terstruktur.
- [ ] Bangun komponen UI Chatbot Interaktif sebagai layar utama pencatatan (Smart Input).
- [ ] Pengujian fungsionalitas *text-to-JSON* dan *image-to-JSON*.

### Day 4: Core UI & Glassmorphism
**Fokus:** Pengalaman visual (*App Feel*) bertaraf premium.
- [ ] Terapkan sistem desain bertema Glassmorphism (efek *backdrop-blur*, transparansi, gradien lembut) menggunakan Tailwind CSS.
- [ ] Setup *routing* halaman dan navigasi spesifik PWA (Bottom Navigation Bar & Header yang responsif).
- [ ] Implementasikan animasi pergantian halaman dan interaksi tombol menggunakan Framer Motion.
- [ ] Optimasi UX untuk *mobile-first* dan *Safe Area* pada perangkat iOS.

### Day 5: Visualisasi Data & Console Log
**Fokus:** Analitik dan pelaporan (*reporting*).
- [ ] Instalasi dan setup pustaka visualisasi grafik (Nivo atau Recharts).
- [ ] Bangun UI Dashboard untuk menampilkan ringkasan pengeluaran (Donut Chart untuk alokasi budget, Line Chart untuk tren).
- [ ] Bangun UI "Console-Style Data Log": Tampilan riwayat transaksi berbasis tabel mentah (tabular) kecepatan tinggi, tanpa grafis visual, khusus untuk memantau data transaksi raw dan skor/kalkulasi metrik AI.

### Day 6: Advanced Logic, Debt & Push Notif
**Fokus:** Fungsionalitas cerdas sekunder dan retensi pengguna.
- [ ] Terapkan logika AI *Context-Aware*: Pemisahan pengeluaran kebutuhan esensial versus *lifestyle*, lengkap dengan logika *feedback*/teguran sarkas jika budget *lifestyle* menipis.
- [ ] Bangun algoritma *Split Bill* dan pencatatan utang-piutang (*Debt Tracker*).
- [ ] Integrasi fungsionalitas multi-currency dan pengelompokan berbasis tag/hashtag (#startup).
- [ ] Setup *Service Worker* lanjutan dan registrasi *Web Push Notifications* untuk *reminder* tagihan berulang.

### Day 7: Deployment & Polishing
**Fokus:** Transisi ke *environment* production dan QA.
- [ ] Tulis `Dockerfile` untuk aplikasi Next.js dan ratakan konfigurasi dengan container PostgreSQL di `docker-compose.yml` final.
- [ ] Lakukan pengujian dan simulasi build production di mesin lokal.
- [ ] Siapkan server Windows target (setup *passwordless SSH* dan Docker env).
- [ ] Deploy kode ke server target via remote SSH.
- [ ] Uji coba QA secara komprehensif langsung melalui PWA yang diinstal pada perangkat iOS.
- [ ] Dokumentasi prosedur *backup* dan *maintenance*.

---

## 3. Direktori Struktur (Draft)
```text
dompet/
├── app/                  # Next.js App Router (Pages & API)
├── components/           # Reusable UI (Chat, Charts, Glassmorphism components)
├── lib/                  # Utilities (AI Prompts, Formatters, API Clients)
├── prisma/               # Database Schema & Migrations
├── public/               # Static assets & PWA Manifest
├── docker-compose.yml    # Infrastruktur database & deployment
├── Dockerfile            # Next.js Containerization
└── tailwind.config.ts    # Desain sistem & warna
```