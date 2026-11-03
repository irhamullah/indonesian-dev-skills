# Nginx Reverse Proxy Configuration

**Pain Point #3:** Nginx reverse proxy untuk Node.js tricky, sering error atau websocket tidak work.

Complete guide untuk reverse proxy Node.js, WebSocket support, dan load balancing.

---

## Basic Reverse Proxy (Node.js)

```nginx
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
        
        # Forward real client IP
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Key headers explained:**

| Header | Purpose |
|--------|---------|
| `proxy_http_version 1.1` | Required for WebSocket |
| `Upgrade` & `Connection` | Enable WebSocket upgrade |
| `Host` | Preserve original domain |
| `X-Real-IP` | Pass client's real IP to app |
| `X-Forwarded-For` | Chain of proxy IPs |
| `X-Forwarded-Proto` | http or https |

---

## With SSL (Production Setup)

```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

# HTTPS with reverse proxy
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard headers
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files (optional - serve directly from Nginx)
    location /static/ {
        alias /var/www/nodejs-app/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint (bypass proxy)
    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

## WebSocket Configuration

For apps using Socket.io, WebSocket, or SSE:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # ... SSL config ...

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket upgrade
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Longer timeouts for WebSocket
        proxy_read_timeout 86400s;  # 24 hours
        proxy_send_timeout 86400s;
    }
}
```

**Test WebSocket:**

```javascript
// In your Node.js app
app.get('/test-ws', (req, res) => {
    console.log('Headers received:', req.headers);
    res.json({
        upgrade: req.headers.upgrade,
        connection: req.headers.connection,
        realIP: req.headers['x-real-ip'],
    });
});
```

---

## Multiple Node.js Apps (Different Ports)

```nginx
# App 1: Main website
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        # ... proxy headers ...
    }
}

# App 2: API
server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        # ... proxy headers ...
    }
}

# App 3: Admin panel
server {
    listen 443 ssl;
    server_name admin.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3002;
        # ... proxy headers ...
    }
}
```

---

## Load Balancing (Multiple Instances)

```nginx
# Define upstream (multiple Node.js instances)
upstream nodejs_backend {
    least_conn;  # or: ip_hash, round_robin (default)
    
    server localhost:3000 weight=1 max_fails=3 fail_timeout=30s;
    server localhost:3001 weight=1 max_fails=3 fail_timeout=30s;
    server localhost:3002 weight=1 max_fails=3 fail_timeout=30s;
    
    # Health check
    keepalive 64;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    location / {
        proxy_pass http://nodejs_backend;
        proxy_http_version 1.1;
        
        # Connection reuse
        proxy_set_header Connection "";
        
        # Standard headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Start multiple instances with PM2:**

```bash
pm2 start app.js -i 3  # 3 instances on different ports
```

---

## API + Frontend on Same Domain

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # API requests → Node.js backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        
        # Handle OPTIONS preflight
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Frontend (React/Vue/Next.js) → Static files
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Static assets (long cache)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Caching (API Responses)

```nginx
# Define cache path
proxy_cache_path /var/cache/nginx/api 
    levels=1:2 
    keys_zone=api_cache:10m 
    max_size=1g 
    inactive=60m 
    use_temp_path=off;

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        
        # Caching
        proxy_cache api_cache;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        proxy_cache_valid 200 10m;  # Cache 200 responses for 10 min
        proxy_cache_valid 404 1m;   # Cache 404 for 1 min
        proxy_cache_bypass $http_cache_control;  # Honor Cache-Control header
        add_header X-Cache-Status $upstream_cache_status;
        
        # Standard headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Purge cache endpoint (restricted)
    location /cache-purge {
        allow 127.0.0.1;
        deny all;
        proxy_cache_purge api_cache "$scheme$request_method$host$request_uri";
    }
}
```

**In Node.js app, set cache headers:**

```javascript
// Cache for 10 minutes
res.set('Cache-Control', 'public, max-age=600');

// Don't cache
res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
```

---

## Rate Limiting

```nginx
# Define rate limit zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    location / {
        # Apply rate limit
        limit_req zone=api_limit burst=20 nodelay;
        limit_req_status 429;
        
        # Return custom 429 response
        error_page 429 = @rate_limit_exceeded;
        
        proxy_pass http://localhost:3000;
        # ... proxy headers ...
    }
    
    location @rate_limit_exceeded {
        default_type application/json;
        return 429 '{"error":"Too many requests","retry_after":1}';
    }
}
```

**Rate limit meanings:**

- `rate=10r/s` → 10 requests per second average
- `burst=20` → Allow burst up to 20 requests
- `nodelay` → Don't delay requests within burst

---

## Troubleshooting

### Issue 1: 502 Bad Gateway

**Cause:** Node.js app not running or wrong port.

**Debug:**

```bash
# Check Node.js running
pm2 status
# or
ps aux | grep node

# Check port listening
sudo netstat -tlnp | grep :3000

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log
```

**Fix:**

```bash
# Start Node.js app
pm2 start app.js
pm2 save

# Verify listening on correct port
curl http://localhost:3000
```

### Issue 2: WebSocket Connection Failed

**Symptoms:**
```
WebSocket connection to 'wss://yourdomain.com/socket.io/' failed
```

**Debug:**

```bash
# Check Nginx config has WebSocket headers
sudo nginx -T | grep -A 5 "Upgrade"

# Should see:
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection 'upgrade';
```

**Fix:**

Add WebSocket configuration (see above), reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

**In Node.js, get real IP:**

```javascript
// Express.js
app.set('trust proxy', 1);

app.get('/', (req, res) => {
    const realIP = req.headers['x-real-ip'] || req.ip;
    console.log('Real client IP:', realIP);
});
```

### Issue 3: Slow Response Times

**Cause:** Timeout too short or no keepalive.

**Fix:**

Increase timeouts:

```nginx
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
```

Enable keepalive:

```nginx
upstream nodejs_backend {
    server localhost:3000;
    keepalive 64;
}

location / {
    proxy_pass http://nodejs_backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";  # Reuse connections
}
```

### Issue 4: Static Files Not Loading

**Symptoms:**
- CSS/JS 404 errors
- Assets served from wrong path

**Fix:**

Serve static files directly from Nginx (faster):

```nginx
# Static assets bypass Node.js
location /static/ {
    alias /var/www/nodejs-app/public/;
    expires 30d;
    access_log off;
}

# Dynamic routes go to Node.js
location / {
    proxy_pass http://localhost:3000;
    # ...
}
```

### Issue 5: CORS Errors

**Fix in Nginx:**

```nginx
location /api/ {
    # CORS headers
    add_header Access-Control-Allow-Origin $http_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials true always;
    
    # Preflight
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin $http_origin;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 204;
    }
    
    proxy_pass http://localhost:3000;
    # ...
}
```

---

## Performance Tuning

### Enable HTTP/2

```nginx
listen 443 ssl http2;  # Add http2
```

### Enable Gzip Compression

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript 
           application/json application/javascript application/xml+rss 
           application/rss+xml font/truetype font/opentype 
           application/vnd.ms-fontobject image/svg+xml;
gzip_disable "msie6";
```

### Buffer Sizes

```nginx
# Increase buffer sizes for large requests/responses
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;
client_max_body_size 100M;  # Max upload size
```

### Connection Limits

```nginx
# Limit concurrent connections per IP
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
    location / {
        limit_conn conn_limit 10;  # Max 10 concurrent connections
        proxy_pass http://localhost:3000;
    }
}
```

---

## Security Best Practices

### 1. Hide Nginx Version

```nginx
http {
    server_tokens off;
}
```

### 2. Block Bad User Agents

```nginx
map $http_user_agent $bad_bot {
    default 0;
    ~*sqlmap 1;
    ~*nikto 1;
    ~*bot 1;
}

server {
    if ($bad_bot) {
        return 403;
    }
}
```

### 3. Prevent Clickjacking

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
```

### 4. XSS Protection

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### 5. Rate Limiting (See above)

---

## Monitoring

### Enable Access Logs

```nginx
access_log /var/log/nginx/nodejs-app-access.log combined;
error_log /var/log/nginx/nodejs-app-error.log warn;
```

### Log Response Times

```nginx
log_format timed_combined '$remote_addr - $remote_user [$time_local] '
    '"$request" $status $body_bytes_sent '
    '"$http_referer" "$http_user_agent" '
    '$request_time $upstream_response_time';

access_log /var/log/nginx/nodejs-app-access.log timed_combined;
```

### Monitor with Status Page

```nginx
server {
    listen 127.0.0.1:8080;
    
    location /nginx_status {
        stub_status;
        access_log off;
    }
}
```

```bash
# Check status
curl http://127.0.0.1:8080/nginx_status
```

---

## Quick Reference

### Test Configuration

```bash
# Test config syntax
sudo nginx -t

# Show full config (with includes)
sudo nginx -T
```

### Reload vs Restart

```bash
# Reload (graceful, no downtime)
sudo systemctl reload nginx

# Restart (brief downtime)
sudo systemctl restart nginx
```

### View Logs

```bash
# Error log
sudo tail -f /var/log/nginx/error.log

# Access log
sudo tail -f /var/log/nginx/access.log

# Specific site
sudo tail -f /var/log/nginx/nodejs-app-access.log
```

---

## Checklist

- [ ] Nginx installed and running
- [ ] Config file created (`/etc/nginx/sites-available/nodejs-app`)
- [ ] Symlink created (`/etc/nginx/sites-enabled/nodejs-app`)
- [ ] WebSocket headers included (if needed)
- [ ] SSL configured (Let's Encrypt)
- [ ] HTTP redirects to HTTPS
- [ ] Real client IP forwarded (`X-Real-IP`, `X-Forwarded-For`)
- [ ] Security headers added
- [ ] Timeouts configured appropriately
- [ ] Rate limiting enabled (if public API)
- [ ] Logs accessible
- [ ] Monitoring setup (status page, log rotation)
- [ ] Config tested (`nginx -t`) and reloaded
