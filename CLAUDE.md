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

### Aktif Faz: FAZ 8
Şu an üzerinde çalışılan özellik: Performans & production optimizasyonları

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
- Unit: jest + @testing-library/react
- E2E: Playwright (tests/ klasörü)
- Yeni özellik = yeni test dosyası