# Gaming & Esport Portal - Deploy di Vercel

Versi project ini dirancang khusus untuk deploy lewat **GitHub + Vercel**, jauh lebih simpel dibanding setup manual di VPS (tidak perlu PM2, Nginx, reverse proxy, atau SSL manual — semua otomatis).

## Struktur Project

```
gaming-esport-vercel/
├─ api/
│  ├─ games/
│  │  ├─ index.js          -> GET /api/games
│  │  └─ [id].js           -> GET /api/games/:id
│  └─ esports/
│     ├─ matches/
│     │  └─ [videogame].js -> GET /api/esports/matches/:videogame
│     └─ teams/
│        └─ [videogame].js -> GET /api/esports/teams/:videogame
├─ public/
│  ├─ index.html
│  └─ app.js
├─ package.json
├─ vercel.json
└─ .env.example
```

Setiap file di folder `api/` otomatis menjadi 1 endpoint serverless function di Vercel — tidak perlu Express/server manual.

## Langkah 1: Push ke GitHub

1. Buat repository baru di https://github.com/new (misal nama: `gaming-esport-portal`)
2. Di folder project ini, jalankan di terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - gaming esport portal"
   git branch -M main
   git remote add origin https://github.com/USERNAME/gaming-esport-portal.git
   git push -u origin main
   ```
   (Ganti `USERNAME` dengan username GitHub Anda)

## Langkah 2: Deploy ke Vercel

1. Buka https://vercel.com, daftar/login (bisa pakai akun GitHub langsung)
2. Klik **"Add New..."** -> **"Project"**
3. Pilih repository `gaming-esport-portal` yang baru di-push
4. Klik **Import**
5. Sebelum klik Deploy, buka bagian **Environment Variables**, tambahkan:
   - `RAWG_API_KEY` = (API key RAWG Anda)
   - `PANDASCORE_API_KEY` = (API key PandaScore Anda)
6. Klik **Deploy**
7. Tunggu 1-2 menit, Vercel akan memberi URL otomatis seperti `gaming-esport-portal.vercel.app`

## Langkah 3: Hubungkan ke Domain Sendiri

1. Di dashboard project Vercel, buka tab **Settings** -> **Domains**
2. Ketik domain Anda, misal `esport.berandaku.site`, klik **Add**
3. Vercel akan menampilkan instruksi DNS (biasanya CNAME record)
4. Buka **Cloudflare** -> DNS -> Add record:
   - Type: `CNAME`
   - Name: `esport`
   - Target: `cname.vercel-dns.com` (sesuai yang diberikan Vercel)
   - Proxy status: **DNS only** (abu-abu) saat verifikasi awal
5. Tunggu beberapa menit sampai Vercel menandai domain **Verified** dan SSL otomatis aktif

## Testing

- `https://esport.berandaku.site/` -> tampilan frontend (katalog game + jadwal esport)
- `https://esport.berandaku.site/api/games` -> data JSON mentah dari RAWG
- `https://esport.berandaku.site/api/esports/matches/lol` -> data JSON jadwal LoL dari PandaScore

## Keuntungan Dibanding VPS Manual

- Tidak perlu install Node.js/PM2/Nginx di server manapun
- SSL otomatis & gratis selamanya
- Auto-deploy setiap kali push ke GitHub (`git push` -> otomatis update live)
- Frontend & backend 1 domain -> tidak perlu atur CORS/reverse proxy
- Gratis untuk traffic skala kecil-menengah (hobby plan Vercel)

## Update Project ke Depannya

Setiap mau update code, cukup:
```bash
git add .
git commit -m "update fitur X"
git push
```
Vercel otomatis build & deploy ulang dalam hitungan detik.
