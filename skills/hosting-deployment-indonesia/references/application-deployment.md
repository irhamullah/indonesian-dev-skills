# Application Deployment (Laravel & Node.js)

**Pain Point:** Langkah deploy aplikasi (clone, dependency, `.env`, migrate, cache, process manager) mudah terlewat satu per satu.

Panduan deploy aplikasi ke VPS. Untuk strategi tanpa downtime → `zero-downtime-deployment.md`. Untuk shared hosting → `cpanel-deployment.md`.

---

## Manual vs Script

Manual deployment = error-prone. Automate dengan script.

```bash
# Bad: Manual deployment setiap kali
ssh user@server
cd /var/www/app
git pull
composer install
php artisan migrate
php artisan config:cache
# ... (lupa step apa lagi?)

# Good: Deploy script
./deploy.sh production
# Script handle semua steps + rollback on error
```

---

## Laravel Deployment

```bash
# 1. Clone repository
cd /var/www
sudo mkdir laravel-app
sudo chown deploy:deploy laravel-app
cd laravel-app
git clone https://github.com/your-repo/laravel-app.git .

# 2. Install dependencies
composer install --no-dev --optimize-autoloader

# 3. Setup environment
cp .env.example .env
nano .env

# Update:
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
DB_DATABASE=laravel_app
DB_USERNAME=laravel
DB_PASSWORD=strong-password

# 4. Generate app key
php artisan key:generate

# 5. Run migrations
php artisan migrate --force

# 6. Cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 7. Set permissions
sudo chown -R deploy:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

---

## Node.js Deployment with PM2

```bash
# 1. Clone repository
cd /var/www
sudo mkdir nodejs-app
sudo chown deploy:deploy nodejs-app
cd nodejs-app
git clone https://github.com/your-repo/nodejs-app.git .

# 2. Install dependencies
npm ci --production

# 3. Setup environment
cp .env.example .env
nano .env

# Update production values
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:pass@localhost/dbname

# 4. Build (if TypeScript or needs build step)
npm run build

# 5. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Copy the command PM2 shows and run it
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

**ecosystem.config.js** example:

```javascript
module.exports = {
  apps: [{
    name: 'nodejs-app',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

---

## Environment-specific Config (Jangan Hardcode)

Environment-specific config di `.env`, never hardcode.

```bash
# Bad: Hardcode di config
'database' => [
    'host' => '127.0.0.1',  // What if prod DB different?
    'password' => 'secret123',  // Credentials in code!
]

# Good: Environment variables
'database' => [
    'host' => env('DB_HOST', '127.0.0.1'),
    'password' => env('DB_PASSWORD'),
]
```

**Kredensial di `.env`:**

```bash
# Bad
DB_PASSWORD=secret123  # Committed to Git!

# Good
DB_PASSWORD=  # Empty in .env.example
# Set actual password on server, never commit
```

---

## Checklist

- [ ] Repository ter-clone ke `/var/www/<app>`
- [ ] Dependency terpasang (`composer install --no-dev` / `npm ci --production`)
- [ ] `.env` production terisi (APP_ENV, APP_DEBUG, APP_URL, database)
- [ ] `php artisan key:generate` dijalankan (Laravel)
- [ ] Migrasi dijalankan dengan `--force`
- [ ] Config/route/view cache dibuat (Laravel)
- [ ] Permission `storage` dan `bootstrap/cache` 775 (Laravel)
- [ ] Build step dijalankan (Node.js/TypeScript)
- [ ] PM2 start + `pm2 save` + `pm2 startup` (Node.js)
- [ ] Tidak ada kredensial yang ter-commit
