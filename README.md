# İş Takibi — Emin & Emre

Emin ve Emre için kişisel Kanban iş takip uygulaması. Next.js 14, Tailwind CSS, dnd-kit ve Supabase ile yapılmıştır.

## Özellikler

- 🗂 **3 Sütunlu Kanban**: Emin / Emre / Ortak
- 🖱 **Drag & Drop**: Görevleri sütunlar arasında sürükle-bırak
- 📝 **Wizard**: 4 adımlı görev oluşturma formu
- ✅ **Kontrol Listesi**: Alt görevler ve ilerleme takibi
- 🔔 **Bildirimler**: Gecikme ve hatırlatma bildirimleri
- 🏷 **Etiketler**: Görev sınıflandırma
- 📅 **Son Tarih**: Görsel gecikme uyarıları
- 💾 **Offline First**: Supabase olmadan da çalışır (localStorage)

## Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Ortam değişkenlerini ayarla (isteğe bağlı - Supabase için)
cp .env.local.example .env.local
# .env.local dosyasını düzenle

# 3. Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda `http://localhost:3000` aç.

## Dosya Yapısı

```
app/
  page.tsx              → Dashboard (Kanban board)
  tasks/
    new/page.tsx        → Yeni görev wizard (4 adım)
    [id]/page.tsx       → Görev detay & düzenleme
  layout.tsx

components/
  TaskCard.tsx          → Sürüklenebilir görev kartı
  TaskWizard.tsx        → Adım adım form
  Column.tsx            → Kanban sütunu (Emin/Emre/Ortak)
  NotificationBell.tsx  → Bildirim paneli
  ui/                   → shadcn/ui bileşenleri

lib/
  supabase.ts           → Supabase client + tipler
  tasks.ts              → Görev CRUD (localStorage)
  notifications.ts      → Push bildirim helpers

supabase/
  migrations/
    001_create_tasks.sql  → Veritabanı şeması
  functions/
    send-reminders/       → Hatırlatma Edge Function
```

## Supabase Kurulumu (İsteğe Bağlı)

1. [supabase.com](https://supabase.com)'da proje oluştur
2. `supabase/migrations/001_create_tasks.sql` dosyasını SQL Editor'da çalıştır
3. Project Settings > API'den URL ve anon key'i kopyala
4. `.env.local` dosyasına yapıştır

### Edge Function Deploy (Otomatik Hatırlatmalar)

```bash
# Supabase CLI kurulu olmalı
supabase functions deploy send-reminders

# Cron job ekle (her gün 09:00)
# Supabase Dashboard > Database > Cron Jobs
```

## Teknolojiler

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **dnd-kit** (drag & drop)
- **Supabase** (veritabanı + edge functions)
- **date-fns** (tarih işlemleri)
- **Syne + DM Sans** (font)
