# Initial Server Setup & Hardening

**Pain Point #5:** Lupa langkah-langkah hardening dasar setiap setup VPS baru.

Security checklist untuk fresh Ubuntu VPS.

Fresh VPS dari IDCloudHost/Niagahoster/Rumahweb biasanya: OS Ubuntu 22.04 atau 20.04, root access via SSH, no firewall configured, no swap.

---

## Quick Setup (Copy-Paste)

```bash
# 0. Login sebagai root
ssh root@your-vps-ip

# 1. Update system
apt update && apt upgrade -y

# 2. Create deploy user
adduser deploy
# atau non-interaktif: adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy

# 3. Setup SSH key
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# 4. Disable root SSH
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# 5. Setup firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 6. Create swap (2GB)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
# atau: echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# 7. Set timezone
timedatectl set-timezone Asia/Jakarta

# 8. Install fail2ban
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

## SSH Hardening

```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Change these:
Port 2222                        # Change default port (optional)
PermitRootLogin no               # Disable root login
PasswordAuthentication no        # Key-only auth
PubkeyAuthentication yes
MaxAuthTries 3                   # Limit login attempts
ClientAliveInterval 300          # Auto-disconnect idle
ClientAliveCountMax 2

# Restart SSH
systemctl restart sshd
```

**Test before disconnecting:**
```bash
# Open new terminal, test login as deploy
ssh -p 2222 deploy@your-vps-ip
# atau kalau port default 22:
ssh deploy@your-vps-ip

# Verify sudo works
sudo apt update  # Should work
```

---

## Fail2Ban Configuration

```bash
# Create jail for SSH
nano /etc/fail2ban/jail.local

[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600

# Restart fail2ban
systemctl restart fail2ban

# Check status
fail2ban-client status sshd
```

---

## Automatic Security Updates

```bash
apt install -y unattended-upgrades

# Configure
dpkg-reconfigure -plow unattended-upgrades
```

---

## Monitoring & Alerts

```bash
# Install netdata (real-time monitoring)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access: http://your-vps-ip:19999
```

---

## Checklist

- [ ] Non-root user created with sudo
- [ ] SSH key authentication working
- [ ] Password authentication disabled
- [ ] Root SSH login disabled
- [ ] Firewall enabled (ufw)
- [ ] Fail2ban installed and configured
- [ ] Swap created (2GB minimum)
- [ ] Timezone set (Asia/Jakarta)
- [ ] Automatic security updates enabled
- [ ] System fully updated
