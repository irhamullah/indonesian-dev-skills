# Instalasi Stack VPS (Laravel & Node.js)

**Pain Point:** Stack dasar (PHP/Node.js, database, Nginx) harus dipasang ulang setiap kali bikin VPS baru.

Perintah instalasi untuk fresh Ubuntu VPS (22.04 atau 20.04). Untuk hardening server dulu → `initial-server-setup.md`.

---

## Laravel Stack

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

---

## Node.js Stack

```bash
# 1. Install Node.js LTS (saat ini 26.x — cek nodejs.org untuk LTS terbaru)
curl -fsSL https://deb.nodesource.com/setup_26.x | sudo -E bash -
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

## Checklist

- [ ] PHP 8.2 + extensions terpasang (opsi Laravel)
- [ ] Composer terpasang di `/usr/local/bin/composer`
- [ ] MySQL terpasang dan `mysql_secure_installation` selesai
- [ ] Database + user aplikasi dibuat
- [ ] Nginx terpasang
- [ ] Redis terpasang dan enabled (opsi Laravel)
- [ ] Node.js LTS + PM2 terpasang (opsi Node.js)
- [ ] PostgreSQL terpasang (kalau dipakai)
