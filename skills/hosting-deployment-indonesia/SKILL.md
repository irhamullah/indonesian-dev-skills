---
name: hosting-deployment-indonesia
description: Use when deploying Laravel or Node.js to Indonesian VPS (IDCloudHost, Niagahoster, Rumahweb, Biznet Gio) or shared hosting with cPanel. Triggers on "deploy Laravel", "setup VPS", "Nginx reverse proxy", "Supervisor queue worker", "Let's Encrypt SSL", "database backup", "deploy ke IDCloudHost", "setup cPanel", "zero downtime deployment"
---

# Hosting & Deployment Indonesia

## Overview

Deploy aplikasi Laravel atau Node.js ke VPS Indonesia (IDCloudHost, Niagahoster, Rumahweb, Biznet Gio) atau shared hosting dengan cPanel. Skill ini mengatasi pain points utama: Supervisor config yang selalu lupa, SSL renewal yang gagal, Nginx reverse proxy, dan database backup yang sering skip.

**Two workflows:**
- **Primary:** VPS deployment (full control, Nginx + Supervisor)
- **Alternative:** Shared hosting cPanel deployment

## When to Use

- Ketika deploy Laravel atau Node.js ke VPS Indonesia
- Ketika setup Nginx reverse proxy untuk Node.js
- Ketika setup Supervisor untuk Laravel queue workers
- Ketika setup SSL Let's Encrypt + auto-renewal
- Ketika setup database backup automation
- Ketika deploy ke shared hosting dengan cPanel
- Ketika butuh zero-downtime deployment
- Ketika lupa command/config untuk server setup

**Jangan pakai kalau:**
- Deploy ke cloud platform (AWS, GCP, Azure) - different workflow
- Docker/Kubernetes deployment - different tooling
- Serverless deployment - no server management

## Core Principles

### Prinsip 1: Automate Everything

Manual deployment = error-prone. Automate dengan scripts.

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

### Prinsip 2: Separate Concerns

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

### Prinsip 3: Non-Root User for Applications

Never run apps as root. Create dedicated user.

```bash
# Bad: Run as root
sudo php artisan queue:work

# Good: Dedicated user
adduser --disabled-password --gecos "" deploy
sudo -u deploy php artisan queue:work
```

## Workflow: VPS Deployment (Primary)

### Step 1: Initial Server Setup

Fresh VPS dari IDCloudHost/Niagahoster/Rumahweb biasanya:
- OS: Ubuntu 22.04 atau 20.04
- Root access via SSH
- No firewall configured
- No swap

**Checklist:**

```bash
# 1. Login sebagai root
ssh root@your-vps-ip

# 2. Update system
apt update && apt upgrade -y

# 3. Create non-root user
adduser deploy
usermod -aG sudo deploy

# 4. Setup SSH key for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# 5. Disable root SSH login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# 6. Setup firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 7. Create swap (if not exists)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
```

**Verify:**
```bash
# Test SSH as deploy user
ssh deploy@your-vps-ip
sudo apt update  # Should work
```

See `references/initial-server-setup.md` for detailed hardening.

---

### Step 2: Install Stack (Laravel or Node.js)

#### Option A: Laravel Stack

```bash
# 1. Install PHP 8.2 + extensions
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-mbstring \
  php8.2-xml php8.2-curl php8.2-zip php8.2-mysql php8.2-gd \
  php8.2-redis php8.2-bcmath

# 2. Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# 3. Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Create database
sudo mysql -e "CREATE DATABASE laravel_app;"
sudo mysql -e "CREATE USER 'laravel'@'localhost' IDENTIFIED BY 'strong-password';"
sudo mysql -e "GRANT ALL ON laravel_app.* TO 'laravel'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 4. Install Nginx
sudo apt install -y nginx

# 5. Install Redis (for queues/cache)
sudo apt install -y redis-server
sudo systemctl enable redis-server
```

#### Option B: Node.js Stack

```bash
# 1. Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Install PM2 (process manager)
sudo npm install -g pm2

# 3. Install Nginx
sudo apt install -y nginx

# 4. Install MySQL (if needed)
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Or PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

---

### Step 3: Nginx Configuration

#### Laravel Configuration

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/laravel-app

# Paste this config:
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/laravel-app/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/laravel-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Node.js Reverse Proxy

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/nodejs-app

# Paste this config:
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/nodejs-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

See `references/nginx-reverse-proxy.md` for advanced configs.

---

### Step 4: SSL Setup with Let's Encrypt

```bash
# 1. Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# 2. Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Enter email for renewal notifications
# Agree to terms
# Select: Redirect HTTP to HTTPS

# 3. Test auto-renewal
sudo certbot renew --dry-run

# 4. Setup auto-renewal cron (already done by certbot)
sudo systemctl status certbot.timer
```

**Common Issues:**
- Domain not pointing to VPS → Update DNS A record
- Port 80/443 blocked → Check firewall: `sudo ufw status`
- Nginx test fails → Check config: `sudo nginx -t`

See `references/ssl-letsencrypt.md` for troubleshooting.

---

### Step 5: Application Deployment

#### Laravel Deployment

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

#### Node.js Deployment with PM2

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

### Step 6: Supervisor Queue Workers (Laravel)

**Pain Point #1: Selalu lupa config Supervisor**

```bash
# 1. Install Supervisor
sudo apt install -y supervisor

# 2. Create worker config
sudo nano /etc/supervisor/conf.d/laravel-worker.conf

# Paste this config:
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/laravel-app/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deploy
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/laravel-app/storage/logs/worker.log
stopwaitsecs=3600

# 3. Start worker
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*

# 4. Check status
sudo supervisorctl status
```

**Common commands:**
```bash
# Restart workers (after code deploy)
sudo supervisorctl restart laravel-worker:*

# Stop workers
sudo supervisorctl stop laravel-worker:*

# View logs
tail -f /var/www/laravel-app/storage/logs/worker.log
```

See `references/supervisor-config.md` for advanced configs (multiple queues, priorities).

---

### Step 7: Database Backup Automation

**Pain Point #4: Sering skip database backup**

```bash
# 1. Create backup script
sudo nano /usr/local/bin/backup-database.sh

# Paste this script:
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/deploy/backups"
DB_NAME="laravel_app"
DB_USER="laravel"
DB_PASS="strong-password"
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz

# Delete old backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: db_backup_$TIMESTAMP.sql.gz"

# Make executable
sudo chmod +x /usr/local/bin/backup-database.sh

# 2. Test backup
sudo -u deploy /usr/local/bin/backup-database.sh

# 3. Setup cron (daily at 2 AM)
sudo crontab -e -u deploy

# Add this line:
0 2 * * * /usr/local/bin/backup-database.sh >> /home/deploy/backups/backup.log 2>&1
```

**Optional: Upload to cloud storage**
```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure (e.g., Google Drive, Dropbox)
rclone config

# Add to backup script:
rclone copy $BACKUP_DIR remote:backups/database
```

See `references/database-backup.md` for restore procedures.

---

### Step 8: Zero-Downtime Deployment

```bash
# Create deployment script
nano ~/deploy.sh

# Paste this script:
#!/bin/bash
set -e

REPO_URL="https://github.com/your-repo/laravel-app.git"
APP_DIR="/var/www/laravel-app"
BRANCH="main"

echo "Starting deployment..."

# 1. Pull latest code
cd $APP_DIR
git fetch origin $BRANCH
git reset --hard origin/$BRANCH

# 2. Install dependencies
composer install --no-dev --optimize-autoloader --no-interaction

# 3. Run migrations
php artisan migrate --force

# 4. Clear and cache
php artisan config:clear
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 5. Restart queue workers
sudo supervisorctl restart laravel-worker:*

# 6. Reload PHP-FPM (graceful reload, no downtime)
sudo systemctl reload php8.2-fpm

echo "Deployment completed!"

# Make executable
chmod +x ~/deploy.sh
```

**For Node.js:**
```bash
#!/bin/bash
set -e

cd /var/www/nodejs-app
git pull origin main
npm ci --production
npm run build
pm2 reload ecosystem.config.js --update-env
echo "Deployment completed!"
```

See `references/zero-downtime-deployment.md` for advanced strategies (blue-green, canary).

---

## Workflow: Shared Hosting cPanel (Alternative)

### Laravel on cPanel

```bash
# 1. Upload via Git Deploy (if available)
# cPanel → Git Version Control → Create
# Repository URL, branch, path

# 2. Or upload via FTP/File Manager
# Upload to: public_html/yourdomain.com

# 3. Setup .htaccess in public_html
nano public_html/.htaccess

RewriteEngine On
RewriteCond %{REQUEST_URI} !^/public/
RewriteRule ^(.*)$ /public/$1 [L,QSA]

# 4. Setup database via cPanel
# MySQL Databases → Create database, user, grant privileges

# 5. Configure .env
# File Manager → Edit .env

# 6. Run Composer via SSH (if available)
cd public_html/yourdomain.com
composer install --no-dev

# 7. Run migrations
php artisan migrate --force

# 8. Setup Laravel Scheduler via Cron Jobs
# cPanel → Cron Jobs → Add:
# Every minute: cd /home/username/public_html/yourdomain.com && php artisan schedule:run >> /dev/null 2>&1

# 9. SSL via cPanel
# cPanel → SSL/TLS Status → Run AutoSSL
```

### Node.js on cPanel

⚠️ **Limited support** - Most shared hosting tidak support Node.js dengan baik.

**Workaround:**
- Use cPanel "Setup Node.js App" feature (if available)
- Or switch to VPS untuk Node.js projects

See `references/cpanel-deployment.md` for full guide.

---

## Anti-Patterns

### ❌ **Running as Root**

```bash
# Bad
sudo php artisan queue:work  # Running as root!

# Good
sudo -u deploy php artisan queue:work
# Or via Supervisor with user=deploy
```

### ❌ **No Process Manager for Node.js**

```bash
# Bad
node app.js &  # Dies on SSH disconnect, no restart

# Good
pm2 start app.js --name myapp
pm2 save
pm2 startup
```

### ❌ **Hardcoded Credentials**

```bash
# Bad
DB_PASSWORD=secret123  # Committed to Git!

# Good
DB_PASSWORD=  # Empty in .env.example
# Set actual password on server, never commit
```

### ❌ **No Backup**

```bash
# Bad: No backup, data loss inevitable

# Good: Automated daily backup + offsite storage
```

## Verification

- [ ] Initial server setup complete (non-root user, firewall, SSH hardened)
- [ ] Stack installed (PHP/Node.js, database, Nginx)
- [ ] Nginx configured dan tested (`sudo nginx -t`)
- [ ] SSL certificate obtained dan auto-renewal working
- [ ] Application deployed dan accessible
- [ ] Queue workers running (Laravel - check `sudo supervisorctl status`)
- [ ] Database backup automated (check cron, test restore)
- [ ] Deploy script created dan tested
- [ ] Logs accessible dan monitored
- [ ] DNS pointing to VPS dengan correct A record

## References

Skill-specific references:

- `references/supervisor-config.md` - Supervisor queue worker configuration (pain #1)
- `references/ssl-letsencrypt.md` - SSL Let's Encrypt troubleshooting (pain #2)
- `references/nginx-reverse-proxy.md` - Nginx reverse proxy Node.js (pain #3)
- `references/database-backup.md` - Database backup & restore (pain #4)
- `references/initial-server-setup.md` - Server hardening checklist (pain #5)
- `references/zero-downtime-deployment.md` - Deployment strategies (pain #6)
- `references/cpanel-deployment.md` - cPanel deployment guide (pain #7)

## Related Skills

- `security-and-hardening` - Untuk server security audit
- `observability-and-instrumentation` - Untuk monitoring & logging
- `ci-cd-and-automation` - Untuk automated deployment pipelines
