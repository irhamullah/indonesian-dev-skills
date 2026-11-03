# Zero-Downtime Deployment

**Pain Point #6:** Deploy bikin app down sebentar, user complain.

Strategies untuk deploy tanpa downtime.

---

## Laravel Deployment Script

```bash
#!/bin/bash
# ~/deploy-laravel.sh

set -e  # Exit on error

APP_DIR="/var/www/laravel-app"
BRANCH="main"

echo "🚀 Starting deployment..."

cd $APP_DIR

# 1. Enable maintenance mode (with secret bypass)
php artisan down --secret="deploy-token-$(date +%s)"
echo "Maintenance mode: ON (with bypass token)"

# 2. Pull latest code
git fetch origin $BRANCH
git reset --hard origin/$BRANCH

# 3. Install dependencies
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# 4. Clear caches
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# 5. Run migrations (zero-downtime compatible)
php artisan migrate --force

# 6. Cache configs
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 7. Restart queue workers
sudo supervisorctl restart laravel-worker:*

# 8. Reload PHP-FPM (graceful, no downtime)
sudo systemctl reload php8.2-fpm

# 9. Disable maintenance mode
php artisan up

echo "✅ Deployment completed!"
```

**Usage:**

```bash
chmod +x ~/deploy-laravel.sh
./deploy-laravel.sh

# Access during maintenance with secret:
# https://yourdomain.com/deploy-token-1730616536
```

---

## Node.js Zero-Downtime with PM2

```bash
#!/bin/bash
# ~/deploy-nodejs.sh

set -e

APP_DIR="/var/www/nodejs-app"
BRANCH="main"

echo "🚀 Starting deployment..."

cd $APP_DIR

# 1. Pull code
git fetch origin $BRANCH
git reset --hard origin/$BRANCH

# 2. Install dependencies
npm ci --production

# 3. Build (if needed)
npm run build

# 4. Reload app (zero-downtime)
pm2 reload ecosystem.config.js --update-env

echo "✅ Deployment completed!"
```

**PM2 reload vs restart:**
- `pm2 reload` → Zero-downtime (graceful reload)
- `pm2 restart` → Brief downtime

---

## Blue-Green Deployment

Two identical environments, switch traffic via symlink:

```bash
#!/bin/bash
# ~/deploy-blue-green.sh

RELEASES_DIR="/var/www/releases"
CURRENT_LINK="/var/www/current"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
NEW_RELEASE="$RELEASES_DIR/release_$TIMESTAMP"

# 1. Clone to new release directory
git clone https://github.com/user/repo.git $NEW_RELEASE
cd $NEW_RELEASE

# 2. Setup (install deps, build, etc.)
composer install --no-dev
php artisan migrate --force
php artisan config:cache

# 3. Switch symlink (atomic operation)
ln -sfn $NEW_RELEASE $CURRENT_LINK

# 4. Reload services
sudo systemctl reload php8.2-fpm
sudo supervisorctl restart laravel-worker:*

# 5. Cleanup old releases (keep last 3)
cd $RELEASES_DIR
ls -dt release_* | tail -n +4 | xargs rm -rf

echo "✅ Blue-green deployment completed!"
```

**Nginx points to symlink:**

```nginx
root /var/www/current/public;
```

**Rollback:**

```bash
# List releases
ls -ltr /var/www/releases

# Rollback to previous
ln -sfn /var/www/releases/release_20261103_020000 /var/www/current
sudo systemctl reload php8.2-fpm
```

---

## Database Migration Best Practices

### ❌ Avoid Downtime-Causing Migrations

```php
// Bad: Locks table
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn('old_column');
});

// Bad: Breaks old code immediately
Schema::table('posts', function (Blueprint $table) {
    $table->renameColumn('body', 'content');
});
```

### ✅ Zero-Downtime Migration Pattern

**Step 1:** Add new column, keep old one

```php
Schema::table('posts', function (Blueprint $table) {
    $table->text('content')->nullable();
});
```

**Step 2:** Deploy code that writes to both columns

```php
public function update(Request $request, Post $post)
{
    $post->body = $request->input('content');
    $post->content = $request->input('content');  // New column
    $post->save();
}
```

**Step 3:** Backfill data

```php
// Migration
Post::whereNull('content')->chunk(100, function ($posts) {
    foreach ($posts as $post) {
        $post->content = $post->body;
        $post->save();
    }
});
```

**Step 4:** Deploy code reading from new column

```php
public function show(Post $post)
{
    return view('post', ['body' => $post->content]);  // Use new column
}
```

**Step 5:** Drop old column (separate deploy)

```php
Schema::table('posts', function (Blueprint $table) {
    $table->dropColumn('body');
});
```

---

## Health Check Monitoring

```bash
#!/bin/bash
# ~/health-check.sh

# Check if app responding
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com)

if [ $HTTP_CODE -ne 200 ]; then
    echo "❌ Health check failed: HTTP $HTTP_CODE"
    
    # Rollback
    ln -sfn /var/www/releases/release_previous /var/www/current
    sudo systemctl reload php8.2-fpm
    
    # Alert
    curl -X POST https://hooks.slack.com/... -d '{"text":"Deployment failed, rolled back"}'
    
    exit 1
fi

echo "✅ Health check passed"
```

---

## Deployment Checklist

- [ ] Code tested locally
- [ ] Database migrations zero-downtime compatible
- [ ] Environment variables updated (if needed)
- [ ] Backup database before deploy
- [ ] Deploy script tested
- [ ] Health check after deploy
- [ ] Queue workers restarted
- [ ] Rollback plan ready
- [ ] Monitor error logs after deploy
