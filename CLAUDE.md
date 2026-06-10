# CLAUDE.md — WMS Project Memory
# Claude Code (claude.ai/code) için proje belleği
# Proje kökünde CLAUDE.md olarak kayıt et

## BU NEDIR?
Warehouse Management System — depo operasyonlarını yöneten full-stack uygulama.
CV portfolio projesi, production-grade mimari ile geliştirilmekte.

## MEVCUT DURUM
Aşağıdaki bölümü her fazı bitirdikçe güncelle:

### Tamamlanan Fazlar
- [x] FAZ 1: Temel altyapı (Auth, RBAC, Layout, Theme, Seed) tamamlandı
- [x] FAZ 2: Ürün & kategori yönetimi tamamlandı
- [x] FAZ 3: Gerçek zamanlı envanter takibi tamamlandı
- [x] FAZ 4: Düşük stok bildirimleri tamamlandı
- [x] FAZ 5: Tedarikçi & sipariş yönetimi tamamlandı
- [x] FAZ 6: Dashboard & analitik tamamlandı
- [x] FAZ 7: Excel/CSV import-export (Gelişmiş) tamamlandı
- [ ] FAZ 8: Performans & production
- [x] FAZ 9-A: ABC/XYZ Envanter Sınıflandırma Analizi tamamlandı

### Aktif Faz: FAZ 9 — Portfolyo Özellikleri
Bu uygulama GitHub ve LinkedIn portfolyosu için yapılıyor. Sıradaki özellikler:

| # | Özellik | Durum | Notlar |
|---|---------|-------|--------|
| 1 | ABC/XYZ Analizi | ✅ Tamamlandı | `analytics.getAbcXyzAnalysis`, `src/lib/abcXyzAnalysis.ts`, 9 unit test |
| 2 | Email bildirim şablonları | ✅ Tamamlandı | React Email, 4 template, DB özelleştirme, admin yönetim sayfası, 35 unit test |
| 3 | Lot/seri no izlenebilirliği | ⏳ Bekliyor | batchNumber var, hareket boyunca takip yok |
| 4 | PWA | ⏳ Bekliyor | Next.js manifest + service worker |
| 5 | Toplu işlem (bulk) | ⏳ Bekliyor | UI checkbox + bulk action bar |
| 6 | Özelleştirilebilir dashboard | ✅ Tamamlandı | DB'ye per-user layout kayıt (kpiWidgets, mainWidgets, widgetSizes) |

### Email Şablonları Teknik Detay
- Templates: `apps/web/src/lib/email-templates/` — `LowStockAlert`, `WeeklyReport`, `OrderCreated`, `WelcomeEmail`
- Dispatcher: `apps/web/src/lib/email.ts` — `sendLowStockAlert`, `sendWeeklyReport`, `sendOrderCreatedEmail`, `sendWelcomeEmail`
- Testler: `apps/web/src/__tests__/emailTemplates.test.tsx` — 25 test, `react-dom/server` ile render
- Paket: `@react-email/components` + `@react-email/render`

### ABC/XYZ Teknik Detay
- Router: `apps/web/src/server/routers/analytics.ts` → `getAbcXyzAnalysis`
- Utility: `apps/web/src/lib/abcXyzAnalysis.ts` (saf fonksiyon, test edilebilir)
- UI: `apps/web/src/app/(dashboard)/raporlar/page.tsx` → yeni 'abcxyz' sekmesi
- Testler: `apps/web/src/__tests__/abcXyzAnalysis.test.ts` — `pnpm test` ile çalışır
- Jest config: `apps/web/jest.config.ts`

## BANA BİR GÖREV VERİRKEN ŞUNU YAP
Tam dosya içeriği gönderme. Bunun yerine şunu söyle:

> "apps/web/server/routers/products.ts dosyasındaki
>  getAll prosedürüne category filter ekle.
>  Mevcut input: { search?: string, page: number }
>  Eklenecek: categoryId?: string
>  Prisma query'yi güncelle, cache'i invalide et."

Ben hangi dosyaları etkileyeceğimi kendim bilirim.

## TOKEN TASARRUFU — ÖNEMLİ
Benimle çalışırken şunları asla yapma:
- Tüm schema.prisma dosyasını kopyalama (sadece değişen model)
- Component'in tamamını gönderme (sadece değişen fonksiyon/section)
- Birden fazla özelliği tek seferde isteme

Bunun yerine şunu yap:
- "X dosyasının Y fonksiyonunu güncelle: [ne değişsin]"
- "Z için yeni bir tRPC prosedürü ekle: input [A], output [B]"
- "W bileşenine şu prop eklensin: [prop adı ve tipi]"

## VERİTABANI ERİŞİMİ
Prisma client: packages/db/src/index.ts'ten import et
Migration: npx prisma migrate dev --name <açıklayıcı-isim>
Seed: npx prisma db seed

## ORTAM DEĞİŞKENLERİ
Gerekli değişkenler .env.example dosyasında.
Asla .env dosyası oluşturma veya içini doldurma.

## TEST ETME
- Unit: `pnpm test` (jest + ts-jest, `apps/web/` içinde)
- Test dosyaları: `apps/web/src/__tests__/` klasörü
- E2E: Playwright (tests/ klasörü)
- Yeni özellik = yeni test dosyası
- Algoritma mantığı önce `src/lib/` altında saf utility'e çıkar, sonra test yaz