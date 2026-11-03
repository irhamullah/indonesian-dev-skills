# SSL Let's Encrypt Setup & Troubleshooting

**Pain Point #2:** SSL renewal kadang gagal, atau setup awal error.

Complete guide untuk setup, auto-renewal, dan troubleshooting Let's Encrypt SSL.

---

## Quick Setup (Happy Path)

```bash
# 1. Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 2. Obtain certificate (auto-configure Nginx)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Email: admin@yourdomain.com
# - Agree to terms: Y
# - Share email: N (optional)
# - Redirect HTTP to HTTPS: 2 (Yes)

# 3. Test auto-renewal
sudo certbot renew --dry-run

# Done! Certificate valid for 90 days, auto-renews.
```

---

## Manual Nginx Configuration

Kalau `--nginx` plugin tidak work atau mau manual control:

```bash
# 1. Obtain certificate only (don't modify Nginx)
sudo certbot certonly --webroot -w /var/www/laravel-app/public -d yourdomain.com -d www.yourdomain.com

# Certificate saved at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# 2. Update Nginx config manually
sudo nano /etc/nginx/sites-available/laravel-app
```

**Nginx SSL config:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/laravel-app/public;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (optional but recommended)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Rest of your config...
    index index.php index.html;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

```bash
# 3. Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## Auto-Renewal Setup

Certbot automatically installs systemd timer untuk renewal.

### Verify Auto-Renewal

```bash
# Check timer status
sudo systemctl status certbot.timer

# Should show:
# Active: active (waiting)
# Trigger: Next renewal check

# Check timer schedule
sudo systemctl list-timers | grep certbot

# Test renewal (dry run)
sudo certbot renew --dry-run

# Output should show:
# Congratulations, all simulated renewals succeeded
```

### Manual Renewal

```bash
# Force renewal (if certificate expires soon)
sudo certbot renew

# Force renewal even if not due
sudo certbot renew --force-renewal

# Renew specific domain only
sudo certbot renew --cert-name yourdomain.com
```

---

## Troubleshooting

### Issue 1: DNS Not Pointing to Server

**Error:**

```
Failed authorization procedure. yourdomain.com (http-01): 
urn:ietf:params:acme:error:dns :: DNS problem: NXDOMAIN looking up A for yourdomain.com
```

**Cause:** Domain belum pointing ke VPS IP.

**Fix:**

```bash
# 1. Check DNS
dig yourdomain.com +short
# Should return your VPS IP

# If not, update DNS A record:
# Type: A
# Name: @
# Value: your-vps-ip
# TTL: 3600

# Type: A  
# Name: www
# Value: your-vps-ip
# TTL: 3600

# 2. Wait for DNS propagation (5-60 minutes)
# 3. Retry certbot
```

### Issue 2: Port 80 Not Accessible

**Error:**

```
Failed authorization procedure. yourdomain.com (http-01): 
urn:ietf:params:acme:error:connection :: Connection refused
```

**Cause:** Firewall blocking port 80.

**Fix:**

```bash
# Check firewall
sudo ufw status

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Or manually
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check Nginx listening
sudo netstat -tlnp | grep :80
# Should show nginx listening on 0.0.0.0:80

# If not running
sudo systemctl start nginx
```

### Issue 3: Webroot Not Found

**Error:**

```
The requested nginx plugin does not appear to be installed
```

**Fix:**

```bash
# Use webroot method instead
sudo certbot certonly --webroot -w /var/www/laravel-app/public -d yourdomain.com -d www.yourdomain.com

# Make sure webroot path exists and accessible
ls -la /var/www/laravel-app/public
```

### Issue 4: Too Many Failed Attempts

**Error:**

```
Error: urn:ietf:params:acme:error:rateLimited
```

**Cause:** Let's Encrypt rate limit (5 failed attempts per hour).

**Fix:**

```bash
# Wait 1 hour
# Or use staging environment for testing
sudo certbot --nginx -d yourdomain.com --staging

# Once working, get real certificate
sudo certbot --nginx -d yourdomain.com
```

### Issue 5: Renewal Failed

**Symptoms:**
- Email notification: "Let's Encrypt certificate renewal failed"
- Certificate expired

**Debug:**

```bash
# Check renewal logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Common causes:
# 1. Nginx config changed, blocking /.well-known/
# 2. Webroot path changed
# 3. Firewall rules changed
```

**Fix for Nginx blocking .well-known:**

```nginx
# Add to server block (port 80)
location ~ /.well-known {
    allow all;
    root /var/www/laravel-app/public;
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx

# Retry renewal
sudo certbot renew
```

### Issue 6: Multiple Domains, Mixed Success

**Symptoms:**
- yourdomain.com renews successfully
- www.yourdomain.com fails

**Fix:**

```bash
# Renew each domain separately
sudo certbot renew --cert-name yourdomain.com
sudo certbot renew --cert-name www.yourdomain.com

# Or delete and re-obtain combined certificate
sudo certbot delete --cert-name yourdomain.com
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Wildcard Certificates

For subdomains (*.yourdomain.com):

```bash
# Requires DNS validation (not HTTP)
sudo apt install -y certbot python3-certbot-dns-cloudflare

# Configure Cloudflare API (if using Cloudflare DNS)
nano ~/.secrets/cloudflare.ini

# Paste:
dns_cloudflare_api_token = your-api-token

# Secure permissions
chmod 600 ~/.secrets/cloudflare.ini

# Obtain wildcard certificate
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials ~/.secrets/cloudflare.ini \
  -d yourdomain.com \
  -d "*.yourdomain.com"
```

**Supported DNS providers:**
- Cloudflare
- Route53 (AWS)
- Google Cloud DNS
- DigitalOcean
- And more...

---

## Multiple Domains on One Server

```bash
# Obtain certificate for multiple domains
sudo certbot --nginx \
  -d domain1.com -d www.domain1.com \
  -d domain2.com -d www.domain2.com
  
# Or separate certificates
sudo certbot --nginx -d domain1.com -d www.domain1.com
sudo certbot --nginx -d domain2.com -d www.domain2.com
```

---

## Certificate Management

### List Certificates

```bash
sudo certbot certificates

# Output:
# Certificate Name: yourdomain.com
#   Domains: yourdomain.com www.yourdomain.com
#   Expiry Date: 2024-03-01
#   Certificate Path: /etc/letsencrypt/live/yourdomain.com/fullchain.pem
#   Private Key Path: /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Delete Certificate

```bash
sudo certbot delete --cert-name yourdomain.com
```

### Expand Certificate (Add Domains)

```bash
# Add subdomain to existing certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com --expand
```

### Revoke Certificate

```bash
sudo certbot revoke --cert-path /etc/letsencrypt/live/yourdomain.com/cert.pem
```

---

## Renewal Hooks

Run scripts after successful renewal:

```bash
# Create renewal hook script
sudo nano /etc/letsencrypt/renewal-hooks/deploy/restart-services.sh

#!/bin/bash
# Reload Nginx
systemctl reload nginx

# Restart application (if needed)
systemctl reload php8.2-fpm

# Send notification
curl -X POST https://your-monitoring.com/ssl-renewed

# Make executable
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/restart-services.sh
```

Hooks run automatically after `certbot renew`.

---

## Monitoring & Alerts

### Check Certificate Expiry

```bash
# Check expiry date
sudo certbot certificates | grep "Expiry Date"

# Or via OpenSSL
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Alert Before Expiry

```bash
# Create monitoring script
nano ~/check-ssl-expiry.sh

#!/bin/bash
DOMAIN="yourdomain.com"
DAYS_THRESHOLD=30

EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
NOW_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt $DAYS_THRESHOLD ]; then
    echo "WARNING: SSL certificate for $DOMAIN expires in $DAYS_UNTIL_EXPIRY days!" | mail -s "SSL Alert" admin@example.com
fi

chmod +x ~/check-ssl-expiry.sh

# Add to cron (check daily)
crontab -e
0 9 * * * ~/check-ssl-expiry.sh
```

---

## Best Practices

### 1. Always Redirect HTTP to HTTPS

```nginx
# Force HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}
```

### 2. Enable HSTS

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### 3. Use Strong SSL Ciphers

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers off;
```

### 4. Test SSL Configuration

```bash
# Test SSL setup
curl -I https://yourdomain.com

# Check SSL labs rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

### 5. Backup Certificates

```bash
# Backup Let's Encrypt directory
sudo tar -czf letsencrypt-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt

# Store offsite
```

---

## Common Commands Cheat Sheet

```bash
# Obtain certificate (auto-configure Nginx)
sudo certbot --nginx -d domain.com -d www.domain.com

# Obtain certificate only (manual Nginx config)
sudo certbot certonly --webroot -w /var/www/app/public -d domain.com

# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# List certificates
sudo certbot certificates

# Delete certificate
sudo certbot delete --cert-name domain.com

# Check timer
sudo systemctl status certbot.timer

# View logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## Emergency: Certificate Expired

```bash
# 1. Check certificate status
sudo certbot certificates

# 2. Force renewal immediately
sudo certbot renew --force-renewal

# 3. If renewal fails, delete and re-obtain
sudo certbot delete --cert-name yourdomain.com
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 4. Verify SSL working
curl -I https://yourdomain.com
```

---

## Checklist

- [ ] Certbot installed
- [ ] Domain pointing to VPS IP (check with `dig`)
- [ ] Ports 80 and 443 open in firewall
- [ ] Certificate obtained successfully
- [ ] Nginx configured with SSL
- [ ] HTTP redirects to HTTPS
- [ ] Auto-renewal timer active (`systemctl status certbot.timer`)
- [ ] Dry-run renewal successful (`certbot renew --dry-run`)
- [ ] Renewal hooks configured (if needed)
- [ ] Monitoring setup (expiry alert)
- [ ] Backup of certificates made
