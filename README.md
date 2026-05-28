# 📦 StockManager — Warehouse Management System (WMS)

StockManager, modern depo operasyonlarını, gerçek zamanlı envanter hareketlerini, satın alma siparişlerini, akıllı bildirimleri ve gelişmiş raporlamayı yöneten modern ve yüksek performanslı bir **Full-Stack Depo Yönetim Sistemidir (WMS)**.

StockManager is a modern, high-performance **Full-Stack Warehouse Management System (WMS)** that handles warehouse operations, real-time inventory tracking, purchase orders, smart notifications, and advanced analytics.

---

## 🚀 Teknolojiler / Technologies

Proje, modern ve endüstri standardı teknolojilerle yapılandırılmış monorepo (Turborepo) mimarisine sahiptir:

The project features a clean monorepo architecture built with enterprise-grade tech:

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![tRPC](https://img.shields.io/badge/tRPC-2574C4?style=for-the-badge&logo=trpc&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-CC0000?style=for-the-badge&logo=redis&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Turbo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## ✨ Özellikler / Features

*   **🔒 Auth & Yetkilendirme (RBAC):** NextAuth v5 ile güvenli kimlik doğrulama, `SUPER_ADMIN` ve `PERSONNEL` rolleri.
*   **📦 Ürün Kataloğu & Otomatik SKU:** Otomatik SKU kodlaması, barkod yönetimi ve görsel envanter.
*   **📊 Gerçek Zamanlı Stok Takibi:** Depo, koridor, raf ve kutu bazlı detaylı stok lokasyonları. Socket.io ile anlık envanter güncellemeleri.
*   **🔔 Düşük Stok Alarmları:** BullMQ entegrasyonu ile arka planda çalışan ve kritik seviyedeki ürünler için anlık bildirim fırlatan worker sistemi.
*   **🚚 Tedarikçi & Sipariş Yönetimi:** Tedarikçi puanlama sistemi, DRAFT → SENT → PARTIAL → RECEIVED → CANCELLED durum akışına sahip satın alma sipariş yönetimi.
*   **📥 Gelişmiş Excel/CSV Import:** Hata doğrulama önizlemeli toplu ürün ve stok hareketi yükleme, şablon indirme.
*   **📈 Dashboard & Analitik:** Recharts kütüphanesi ile anlık doluluk oranları, stok hareket trend grafikleri ve PDF/Excel formatlarında dışa aktarma (export).
*   **⚡ Performans & Güvenlik:** API rate limiting, XSS koruması (HTML sanitization), dynamic import ve Error Boundary.

---

## 🛠️ Kurulum / Installation

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları takip edin:

Follow these steps to run the project locally on your machine:

### 1. Projeyi Klonlayın / Clone the Project
```bash
git clone https://github.com/kilicseyit/stock-manager.git
cd stock-manager
```

### 2. Bağımlılıkları Yükleyin / Install Dependencies
```bash
pnpm install
```

### 3. Çevre Değişkenlerini Ayarlayın / Setup Environment Variables
Kök dizindeki `.env.example` dosyasını kopyalayarak `apps/web/.env` ve `apps/web/.env.local` dosyalarını oluşturun.
Copy `.env.example` to create `apps/web/.env` and `apps/web/.env.local`.

### 4. Altyapıyı Başlatın (Docker) / Start Infrastructure (Docker)
PostgreSQL ve Redis veritabanlarını başlatmak için:
To spin up PostgreSQL and Redis:
```bash
docker-compose up -d
```

### 5. Veritabanı Şemasını ve Başlangıç Verilerini Yükleyin / Migrate and Seed DB
```bash
# Veritabanı tablolarını oluşturun
npx prisma migrate dev

# Başlangıç test verilerini yükleyin (Seed)
npx prisma db seed
```

### 6. Uygulamayı Başlatın / Start the Application
Uygulamayı geliştirme modunda çalıştırmak için:
To run the project in development mode:
```bash
pnpm dev
```
Uygulama varsayılan olarak **http://localhost:3000** adresinde çalışmaya başlayacaktır.
The app will run at **http://localhost:3000**.

---

## 📸 Ekran Görüntüleri / Screenshots

*Görseller geliştirme aşaması sonunda buraya eklenecektir / Screenshots will be added here at the end of the development phase.*

---

## 📄 Lisans / License

Bu proje **MIT** lisansı altında lisanslanmıştır.
This project is licensed under the **MIT** License.
