# Supervisor Queue Worker Configuration

**Pain Point #1:** Selalu lupa config Supervisor untuk Laravel queue workers.

Complete guide untuk setup, troubleshoot, dan advanced configurations.

---

## Basic Configuration

### Single Queue, Single Worker

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/laravel-app/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deploy
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/laravel-app/storage/logs/worker.log
stopwaitsecs=3600
```

**Field explanations:**

| Field | Purpose |
|-------|---------|
| `process_name` | Unique name per process (with counter) |
| `command` | Full path to artisan + queue:work command |
| `autostart=true` | Start workers on boot |
| `autorestart=true` | Restart if worker dies |
| `stopasgroup=true` | Stop all child processes when stopping |
| `killasgroup=true` | Kill all child processes if timeout |
| `user=deploy` | Run as non-root user |
| `numprocs=2` | Number of worker processes |
| `stdout_logfile` | Where to log output |
| `stopwaitsecs=3600` | Wait 1 hour before killing (for long jobs) |

---

## Multiple Queues with Priority

```ini
[program:laravel-worker-high]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/laravel-app/artisan queue:work redis --queue=high --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deploy
numprocs=3
redirect_stderr=true
stdout_logfile=/var/www/laravel-app/storage/logs/worker-high.log
stopwaitsecs=3600

[program:laravel-worker-default]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/laravel-app/artisan queue:work redis --queue=default --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deploy
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/laravel-app/storage/logs/worker-default.log
stopwaitsecs=3600

[program:laravel-worker-low]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/laravel-app/artisan queue:work redis --queue=low --sleep=5 --tries=2 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deploy
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/laravel-app/storage/logs/worker-low.log
stopwaitsecs=3600
```

**Dispatch jobs to specific queues:**

```php
// High priority
ProcessPayment::dispatch($order)->onQueue('high');

// Default queue
SendEmail::dispatch($user);

// Low priority
GenerateReport::dispatch()->onQueue('low');
```

---

## Group Configuration

```ini
[group:laravel-workers]
programs=laravel-worker-high,laravel-worker-default,laravel-worker-low
priority=999
```

**Commands:**

```bash
# Start all workers
sudo supervisorctl start laravel-workers:*

# Stop all workers
sudo supervisorctl stop laravel-workers:*

# Restart all workers
sudo supervisorctl restart laravel-workers:*

# Status
sudo supervisorctl status laravel-workers:*
```

---

## Horizon Configuration (Alternative)

Kalau pakai Laravel Horizon:

```ini
[program:laravel-horizon]
process_name=%(program_name)s
command=php /var/www/laravel-app/artisan horizon
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deploy
redirect_stderr=true
stdout_logfile=/var/www/laravel-app/storage/logs/horizon.log
stopwaitsecs=3600
```

**Note:** Horizon manages worker processes internally, jadi cuma butuh 1 Supervisor config.

---

## Management Commands

### Essential Commands

```bash
# Read configuration changes
sudo supervisorctl reread

# Apply configuration changes
sudo supervisorctl update

# Start specific worker
sudo supervisorctl start laravel-worker:laravel-worker_00

# Start all workers
sudo supervisorctl start laravel-worker:*

# Stop workers
sudo supervisorctl stop laravel-worker:*

# Restart workers (after code deploy)
sudo supervisorctl restart laravel-worker:*

# View status
sudo supervisorctl status

# View logs (tail)
sudo supervisorctl tail -f laravel-worker:laravel-worker_00

# Clear logs
sudo supervisorctl clear laravel-worker:*
```

### After Code Deployment

```bash
# 1. Restart workers to load new code
sudo supervisorctl restart laravel-worker:*

# 2. Verify workers running
sudo supervisorctl status

# 3. Check logs for errors
sudo supervisorctl tail -f laravel-worker:laravel-worker_00
```

---

## Common Issues

### Issue 1: Workers Not Starting

**Symptoms:**
```bash
sudo supervisorctl status
# laravel-worker:laravel-worker_00  FATAL    Exited too quickly
```

**Debug:**

```bash
# Check logs
sudo supervisorctl tail laravel-worker:laravel-worker_00

# Common causes:
# - Wrong PHP path
# - Wrong artisan path
# - Permission issues
# - Missing .env file
# - Redis connection failed
```

**Fix:**

```bash
# Verify command works manually
cd /var/www/laravel-app
php artisan queue:work redis --once

# If works, issue is with Supervisor config
# Check paths are absolute
which php  # Use this path in config
pwd  # Use full path to artisan
```

### Issue 2: Workers Running Old Code

**Symptoms:**
- Code deployed tapi bug lama masih muncul
- Workers tidak pakai code baru

**Cause:**
Workers perlu restart setelah deploy untuk load new code.

**Fix:**

```bash
# Always restart workers after deploy
sudo supervisorctl restart laravel-worker:*
```

Add to deploy script:

```bash
#!/bin/bash
git pull
composer install
php artisan migrate --force
php artisan config:cache

# Restart workers
sudo supervisorctl restart laravel-worker:*
```

### Issue 3: Memory Leaks

**Symptoms:**
- Worker memory usage terus naik
- Server OOM (Out of Memory)

**Fix:**

Use `--max-time` dan `--max-jobs`:

```ini
command=php /var/www/laravel-app/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600 --max-jobs=1000
```

- `--max-time=3600` → Worker restart setelah 1 jam
- `--max-jobs=1000` → Worker restart setelah 1000 jobs

### Issue 4: Long-Running Jobs Killed

**Symptoms:**
```
Job timeout after 60 seconds
```

**Fix:**

Increase `stopwaitsecs`:

```ini
stopwaitsecs=3600  # Wait 1 hour before killing
```

Set job timeout lebih tinggi:

```php
class ProcessVideo implements ShouldQueue
{
    public $timeout = 3600;  // 1 hour timeout
    
    public function handle()
    {
        // Long running task
    }
}
```

### Issue 5: Workers Stuck

**Symptoms:**
- Workers running tapi tidak process jobs
- Queue piling up

**Debug:**

```bash
# Check worker logs
sudo supervisorctl tail -f laravel-worker:laravel-worker_00

# Check Redis
redis-cli
> LLEN queues:default
# Shows pending jobs count

# Check if worker actually running
ps aux | grep "queue:work"
```

**Fix:**

```bash
# Hard restart
sudo supervisorctl stop laravel-worker:*
sudo supervisorctl start laravel-worker:*

# If still stuck, check Redis connection
php artisan queue:failed
# Retry failed jobs
php artisan queue:retry all
```

---

## Monitoring

### Check Queue Status

```bash
# Pending jobs count
php artisan queue:monitor redis:default,redis:high,redis:low --max=100

# Failed jobs
php artisan queue:failed

# Queue stats (Horizon)
php artisan horizon:stats
```

### Log Rotation

Workers generate banyak logs. Setup rotation:

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/laravel-workers

# Paste:
/var/www/laravel-app/storage/logs/worker*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        sudo supervisorctl restart laravel-worker:* > /dev/null
    endscript
}
```

### Alert on Worker Death

```bash
# Add to monitoring script (cron every 5 min)
#!/bin/bash

WORKERS_DOWN=$(sudo supervisorctl status laravel-worker:* | grep -c "FATAL\|STOPPED")

if [ $WORKERS_DOWN -gt 0 ]; then
    # Send alert (email, Slack, etc.)
    echo "ALERT: $WORKERS_DOWN Laravel workers are down!" | mail -s "Worker Alert" admin@example.com
    
    # Auto-restart
    sudo supervisorctl start laravel-worker:*
fi
```

---

## Performance Tuning

### Optimal Worker Count

```
Workers = (CPU cores * 2) - 1

Example:
2 CPU cores → 3 workers
4 CPU cores → 7 workers
```

Adjust per queue priority:
- High priority: 50% of workers
- Default: 30% of workers
- Low priority: 20% of workers

### Sleep Time

```ini
# Fast queue (high priority)
--sleep=1  # Check every 1 second

# Normal queue
--sleep=3  # Check every 3 seconds

# Low priority
--sleep=5  # Check every 5 seconds
```

Lower sleep = higher CPU usage but faster job pickup.

### Connection Pool

If using Redis, increase connection pool:

```php
// config/database.php
'redis' => [
    'client' => 'phpredis',
    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
    ],
    'default' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', '6379'),
        'database' => env('REDIS_DB', '0'),
        'read_write_timeout' => 60,
        'persistent_connections' => true,  // Reuse connections
    ],
],
```

---

## Quick Reference

### Installation

```bash
sudo apt install supervisor
```

### File Locations

```
Config: /etc/supervisor/conf.d/laravel-worker.conf
Logs: /var/log/supervisor/
Main config: /etc/supervisor/supervisord.conf
```

### Common Commands Cheat Sheet

```bash
# Read + apply config changes
sudo supervisorctl reread && sudo supervisorctl update

# Start all
sudo supervisorctl start laravel-worker:*

# Restart all
sudo supervisorctl restart laravel-worker:*

# Status
sudo supervisorctl status

# Tail logs
sudo supervisorctl tail -f laravel-worker:laravel-worker_00
```

### Deploy Workflow

```bash
# 1. Deploy code
git pull
composer install
php artisan migrate --force

# 2. Restart workers
sudo supervisorctl restart laravel-worker:*

# 3. Verify
sudo supervisorctl status
```

---

## Checklist

- [ ] Supervisor installed (`sudo apt install supervisor`)
- [ ] Config file created (`/etc/supervisor/conf.d/laravel-worker.conf`)
- [ ] Config applied (`supervisorctl reread && supervisorctl update`)
- [ ] Workers running (`supervisorctl status`)
- [ ] Logs accessible (`supervisorctl tail`)
- [ ] Workers restart after deployment
- [ ] Log rotation configured
- [ ] Monitoring setup (alert on worker death)
- [ ] Performance tuned (worker count, sleep time)
