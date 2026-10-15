# MERIDIAN

Kaydırmayla ilerleyen sinematik bir 3D yolculuk sunan, etkileşimli havacılık ve uzay konsept sitesi. Yörünge düzenlerini keşfedin ve uzay aracını animasyonlu kamera geçişleriyle inceleyin.

[English README](README.md) · Ana dokümantasyon İngilizcedir.

![MERIDIAN masaüstü açılış ekranı](docs/screenshots/desktop-hero.png)

## Deneyim

- Kalkış, manifesto, yörünge sistemleri, zaman çizelgesi, teknoloji, uzay aracı, istatistikler, hikâyeler ve dönüş bölümleri boyunca kaydırın.
- **ORBIT 01–03** seçenekleriyle yörünge düzenlerini ayrı ayrı inceleyin ve açıklamalarını okuyun.
- **Radiator Array**, **Docking Ring** veya **Main Bus** ile uzay aracının parçalarına odaklanın. Kamera dışarıdan bir yay izler; seçili parçalar hafifçe ayrılır.
- **Resume Journey**, bulunduğunuz kaydırma konumundaki tura döner. Aynı seçeneğe tekrar basmak da seçimi kaldırır.
- Klavye veya dokunmatik ekranla kullanın. Azaltılmış hareket tercihi açıkken inceleme görünümleri mekânsal animasyon olmadan değişir.

## Ekran görüntüleri

Gerçek tarayıcıdan alınan **1440 × 900** masaüstü ve **390 × 844** mobil görüntüler. Bunlar görünür ekran alanını gösterir; kaydırma ve seçim efektlerini uygulamayı çalıştırarak deneyebilirsiniz.

### Masaüstü

![Masaüstünde seçili yörünge düzeni](docs/screenshots/desktop-orbits.png)

![Masaüstünde kenetlenme halkası incelemesi](docs/screenshots/desktop-spacecraft.png)

### Mobil

<p>
  <img src="docs/screenshots/mobile-hero.png" width="260" alt="MERIDIAN mobil açılış ekranı" />
  <img src="docs/screenshots/mobile-orbits.png" width="260" alt="Mobilde seçili yörünge düzeni" />
  <img src="docs/screenshots/mobile-spacecraft.png" width="260" alt="Mobilde kenetlenme halkası incelemesi" />
</p>

## Yerelde çalıştırma

**Node.js 20.9 veya üzeri** ve `package.json` içinde sabitlenen **pnpm 12.8.1** sürümünü kullanın. Mevcut ön yüz için ortam değişkeni veya harici servis anahtarı gerekmez.

```bash
pnpm install
pnpm dev
```

[localhost:3000](http://localhost:3000) adresini açın.

Üretim derlemesini çalıştırmak için:

```bash
pnpm build
pnpm start
```

## Teknolojiler

| Alan | Araçlar |
| --- | --- |
| Uygulama | Next.js 16 App Router, React 19, TypeScript |
| 3D | Three.js, React Three Fiber, Drei, postprocessing |
| Hareket | GSAP, Lenis, Framer Motion |
| Durum ve stil | Zustand, CSS, Tailwind CSS 4 |
| Doğrulama | Playwright, axe-core, ESLint, Lighthouse CI |

## Proje yapısı

```text
app/                    App Router girişleri ve sayfa düzeni
components/canvas/      3D sahne, kamera, geometri ve efektler
components/sections/    Sayfa bölümleri ve inceleme kontrolleri
components/ui/          Ortak arayüz öğeleri
data/                   Metinler, inceleme açıklamaları ve içerik
hooks/ lib/ store/      Ortak davranışlar ve uygulama durumu
styles/ shaders/        Stiller ve shader kaynakları
e2e/                    Tarayıcı testleri ve görsel referanslar
docs/screenshots/       README masaüstü ve mobil görüntüleri
```

## Kontroller

```bash
pnpm lint
pnpm typecheck
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright dört yapılandırma kullanır: masaüstü, mobil ve ikisinin azaltılmış hareket sürümleri. Gerektiğinde üretim sunucusunu başlatır; CI dışında mevcut sunucuyu kullanabilir. Görsel referanslar her yapılandırmada on bölümü kapsar; bu regresyon görüntülerinde dinamik canvas gizlenir. README görüntüleri gerçek 3D sahneyi içerir.

Son etkileşim doğrulamasında **44 kontrol geçti**, **4 beklenen atlama** oldu. Ayrıca **4 görsel proje / 40 bölüm referansı**, üretim derlemesi, lint ve TypeScript kontrolleri geçti. Bu sonuçlar doğrulanan sürüme aittir; değişikliklerden sonra komutları yeniden çalıştırın.

## Lisans

[MIT](LICENSE) © 2026 Ayberk Arda. Üçüncü taraf bağımlılıklar kendi lisanslarını korur.
