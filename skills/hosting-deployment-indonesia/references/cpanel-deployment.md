# cPanel Shared Hosting Deployment

**Pain Point #7:** Deploy Laravel/Node.js di shared hosting cPanel berbeda dari VPS.

Quick guide untuk shared hosting Indonesia (IDCloudHost, Niagahoster, Rumahweb).

---

## Laravel on cPanel

### Setup via Git Deploy

```bash
# 1. cPanel → Git Version Control → Create
Repository URL: https://github.com/user/laravel-app.git
Branch: main
Clone Path: /home/username/repositories/laravel-app

# 2. After clone, setup symlinks
cd ~/repositories/laravel-app

# Symlink public folder to public_html
ln -s ~/repositories/laravel-app/public ~/public_html/yourdomain.com

# Or move contents
cp -r public/* ~/public_html/yourdomain.com/
```

### Setup via FTP/File Manager

```bash
# 1. Upload to: ~/repositories/laravel-app
# 2. Create .htaccess in public_html
nano ~/public_html/.htaccess
```

**Alternatif layout:** upload langsung ke `~/public_html/yourdomain.com` (tanpa symlink), lalu sesuaikan path cron scheduler di bawah.

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

**Alternatif rewrite (langsung ke `public/`):**

```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} !^/public/
RewriteRule ^(.*)$ /public/$1 [L,QSA]
```

### Install Composer Dependencies

```bash
# SSH to cPanel
ssh username@yourdomain.com

cd ~/repositories/laravel-app

# Install Composer locally (if not available)
curl -sS https://getcomposer.org/installer | php
php composer.phar install --no-dev --optimize-autoloader

# Or use system composer (if available)
composer install --no-dev
```

### Database Setup

```bash
# cPanel → MySQL Databases
# 1. Create database: username_laravel
# 2. Create user: username_laravel
# 3. Add user to database (all privileges)

# Edit .env
nano .env

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=username_laravel
DB_USERNAME=username_laravel
DB_PASSWORD=your-password
```

### Run Migrations

```bash
cd ~/repositories/laravel-app
php artisan migrate --force
php artisan key:generate
php artisan config:cache
```

### Laravel Scheduler (Cron Job)

```bash
# cPanel → Cron Jobs
# Add new cron:

# Every minute
* * * * * cd /home/username/repositories/laravel-app && php artisan schedule:run >> /dev/null 2>&1
```

**Kalau project di-upload langsung ke `public_html/yourdomain.com`:**

```bash
# Every minute
* * * * * cd /home/username/public_html/yourdomain.com && php artisan schedule:run >> /dev/null 2>&1
```

### SSL Setup

```bash
# cPanel → SSL/TLS Status
# Click "Run AutoSSL" for your domain
# Wait 5-10 minutes for certificate issuance
```

---

## Node.js on cPanel

⚠️ **Limited Support** - Most shared hosting tidak support Node.js dengan baik.

### If "Setup Node.js App" Available

```bash
# cPanel → Setup Node.js App
Node.js Version: 18 or 20
Application Mode: Production
Application Root: /home/username/nodejs-app
Application URL: https://yourdomain.com
Application Startup File: app.js

# Setup
npm install
# Start button will start the app
```

### If Not Available

**Workaround options:**
1. Switch to VPS untuk Node.js
2. Use serverless (Vercel, Netlify, Railway)
3. Contact hosting support untuk Node.js support

---

## Common cPanel Issues

### Issue 1: 500 Internal Server Error

**Debug:**

```bash
# Check error logs
tail -f ~/logs/yourdomain.com-error_log
```

**Common causes:**
- Wrong .htaccess
- Wrong file permissions (should be 644 for files, 755 for folders)
- PHP version mismatch

**Fix:**

```bash
# Fix permissions
find ~/repositories/laravel-app -type f -exec chmod 644 {} \;
find ~/repositories/laravel-app -type d -exec chmod 755 {} \;
chmod -R 775 ~/repositories/laravel-app/storage
chmod -R 775 ~/repositories/laravel-app/bootstrap/cache
```

### Issue 2: Composer Out of Memory

**Fix:**

```bash
# Increase PHP memory limit for CLI
php -d memory_limit=-1 composer.phar install --no-dev
```

### Issue 3: Laravel Scheduler Not Running

**Verify cron:**

```bash
# cPanel → Cron Jobs
# Check if cron exists and path is correct

# Test manually
cd ~/repositories/laravel-app
php artisan schedule:run

# Check output
cat storage/logs/laravel.log
```

---

## File Manager Deployment (Manual)

### Laravel

```
1. Upload entire project to ~/repositories/laravel-app
2. Exclude: node_modules, .git, storage/*, .env
3. Create .env from .env.example
4. SSH: composer install, php artisan migrate
5. Setup cron for scheduler
6. Point domain to public folder
```

### Static Site (HTML/React/Vue Build)

```
1. Build locally: npm run build
2. Upload dist/ contents to ~/public_html/yourdomain.com/
3. Done
```

---

## Deployment Checklist (cPanel)

- [ ] Project uploaded (Git or FTP)
- [ ] Composer dependencies installed
- [ ] .env configured (database credentials)
- [ ] Database created via cPanel
- [ ] Migrations run
- [ ] Storage permissions set (775)
- [ ] Laravel scheduler cron job added
- [ ] Domain pointing to correct folder
- [ ] SSL certificate installed (AutoSSL)
- [ ] Test application accessible
- [ ] Check error logs for issues

---

## Limitations vs VPS

| Feature | VPS | cPanel Shared Hosting |
|---------|-----|----------------------|
| **Root access** | ✅ Yes | ❌ No |
| **Custom software** | ✅ Any | ❌ Limited (PHP, MySQL only) |
| **Laravel queues** | ✅ Supervisor | ⚠️ Cron only (not real-time) |
| **Node.js** | ✅ Full support | ⚠️ Limited/None |
| **WebSocket** | ✅ Yes | ❌ Usually blocked |
| **Performance** | ✅ Dedicated | ⚠️ Shared resources |
| **Cost** | $5-20/mo | $2-10/mo |

**Recommendation:** Start dengan shared hosting untuk simple Laravel apps, upgrade ke VPS kalau butuh queues, WebSocket, atau Node.js.

---

## Quick Tips

- Use Git Deploy (cPanel feature) untuk deployment lebih mudah
- Always check PHP version (cPanel → Select PHP Version)
- Storage permissions penting (775 untuk storage/ dan bootstrap/cache/)
- Cron jobs untuk Laravel scheduler harus setiap menit
- AutoSSL gratis, gunakan untuk semua domain
- Backup database sebelum update major
