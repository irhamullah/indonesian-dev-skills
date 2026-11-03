# Database Backup Automation

**Pain Point #4:** Sering skip database backup, atau backup manual jadi lupa.

Quick automation guide untuk MySQL/PostgreSQL backup dengan retention policy.

---

## MySQL Backup Script

```bash
#!/bin/bash
# /usr/local/bin/backup-mysql.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/deploy/backups/mysql"
DB_NAME="laravel_app"
DB_USER="laravel"
DB_PASS="your-password"
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u$DB_USER -p$DB_PASS \
  --single-transaction \
  --quick \
  --lock-tables=false \
  $DB_NAME | gzip > $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz

# Delete old backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: db_backup_$TIMESTAMP.sql.gz"
```

**Setup:**

```bash
sudo chmod +x /usr/local/bin/backup-mysql.sh

# Test
sudo -u deploy /usr/local/bin/backup-mysql.sh

# Cron (daily 2 AM)
crontab -e -u deploy
0 2 * * * /usr/local/bin/backup-mysql.sh >> /home/deploy/backups/backup.log 2>&1
```

---

## PostgreSQL Backup

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/deploy/backups/postgresql"
DB_NAME="laravel_app"
DB_USER="laravel"
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

# Backup
PGPASSWORD=$DB_PASS pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz

# Cleanup
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
```

---

## Restore Procedure

```bash
# MySQL restore
gunzip < db_backup_20261103_020000.sql.gz | mysql -u laravel -p laravel_app

# PostgreSQL restore
gunzip < db_backup_20261103_020000.sql.gz | psql -U laravel laravel_app
```

---

## Upload to Cloud Storage (rclone)

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure (Google Drive, Dropbox, S3, etc.)
rclone config

# Add to backup script:
rclone copy $BACKUP_DIR remote:backups/database --max-age 7d
```

---

## Checklist

- [ ] Backup script created and executable
- [ ] Test backup manually
- [ ] Cron job configured
- [ ] Retention policy set (7 days recommended)
- [ ] Test restore procedure
- [ ] Optional: Cloud storage configured
- [ ] Monitor backup logs regularly
