# BAL Notes

Bornova Anadolu Lisesi öğrencileri için not ve öğretmen sözü paylaşım platformu. Next.js App Router, Prisma, Supabase PostgreSQL, BAL ID OAuth ve private Vercel Blob kullanır.

## Yerel kurulum

1. Node.js 24 ve pnpm kullanın.
2. `.env.example` dosyasını `.env.local` olarak kopyalayıp değerleri doldurun. Hem Next.js hem Prisma CLI bu dosyayı okur.
3. Bağımlılıkları ve Prisma istemcisini hazırlayın:

   ```bash
   pnpm install
   pnpm prisma generate
   ```

4. Supabase doğrudan bağlantısıyla ilk migration'ı uygulayın:

   ```bash
   pnpm prisma migrate dev
   ```

5. Uygulamayı başlatın:

   ```bash
   pnpm dev
   ```

## BAL ID OAuth kurulumu

BAL ID'nin Supabase projesinde OAuth Server etkin olmalıdır. BAL Notes'u **confidential client** olarak kaydedin ve şu dönüş adreslerini ekleyin:

- Yerel: `http://localhost:3000/auth/callback`
- Canlı: `https://ALAN-ADINIZ/auth/callback`

`BAL_ID_ISSUER_URL` değeri `https://PROJECT_REF.supabase.co/auth/v1` biçimindedir. Uygulama authorization code + PKCE akışında `email profile` kapsamlarını ister. BAL ID erişim/yenileme token'ları BAL Notes veritabanında tutulmaz.

## Depolama ve yönetici

- Vercel'de **Private Blob** mağazası oluşturup `BLOB_READ_WRITE_TOKEN` değişkenini projeye bağlayın.
- `ADMIN_EMAILS` içine virgülle ayrılmış BAL ID e-posta adreslerini yazın.
- İlk yönetici `/admin` üzerinden her sınıf için kullanılacak dersleri ekler.
- `DATABASE_URL` port 6543 transaction pooler olmalıdır. `DIRECT_URL`, aynı fiziksel veritabanındaki BAL Notes migration geçmişini ayırmak için port 5432 ve `?schema=balnotes` kullanmalıdır.

## Görünürlük davranışı

- Taslaklar yalnızca yazar ve yöneticiler tarafından görülebilir.
- Gönderilen notların `/notlar/[id]` bağlantısı anında herkese açıktır.
- Yalnızca onaylanan notlar ana sayfa ve arama sonuçlarında görünür.
- Reddedilen notlar doğrudan bağlantıyla görünür kalır; ancak keşfette yer almaz.
- Kalıcı silme veya kullanıcı yasağı bağlantıyı ve dosyaları erişimden kaldırır.

## BAL Ödevler

Ödev uygulaması (`odevler.balogrenci.org`) artık bu depodan ayrı bir depo ve deployment olarak çalışır. Ödev tabloları aynı fiziksel veritabanının `balnotes` şemasında kalır; yönetici kimliği de BAL ID üzerinden aynı şekilde çalışır.

## Kontroller

```bash
pnpm test:run
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

TypeScript 7 npm'de en güncel sürüm olsa da mevcut `typescript-eslint` sürümü TypeScript 6/7 API'lerini henüz resmi olarak desteklemediği için proje en yeni uyumlu TypeScript 5.9 sürümüne sabitlenmiştir. Aynı nedenle ESLint, Next.js'in React eklentileriyle uyumlu en yeni 9.x sürümündedir.
