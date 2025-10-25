# Deployment Guide - VPS Deployment with GitHub

Complete guide for deploying Kissan Ghar Dashboard to VPS where N8N is already running.

---

## 🎯 Deployment Overview

**Target Environment:**
- VPS with N8N already installed and running
- GitHub repository for code management
- Production PostgreSQL database
- PM2 for process management
- Nginx for reverse proxy
- SSL/HTTPS enabled

**Deployment Strategy:**
```
GitHub Repository → VPS via Git Pull → Build → Run with PM2 → Nginx Proxy → Public Access
```

---

## 📋 Prerequisites Checklist

### On VPS (What you need)

- [ ] SSH access to VPS
- [ ] Root or sudo access
- [ ] N8N already running (✅ You have this)
- [ ] Domain name (optional but recommended)
- [ ] VPS with at least 2GB RAM, 2 CPU cores

### On Local Machine

- [ ] Git installed
- [ ] GitHub account with repository
- [ ] SSH key for GitHub
- [ ] SSH access configured to VPS

---

## 🚀 Deployment Approach: Best Practices

### Recommended Architecture

```
Internet (HTTPS)
    ↓
Nginx (Port 80/443)
    ├── / → React Frontend (static files)
    ├── /api → Express Backend (Port 4000)
    └── /n8n → N8N (existing)
    
Backend (Port 4000)
    ↓
PostgreSQL (Port 5432)

PM2 Process Manager
    ├── backend (Express)
    └── (N8N already managed)
```

---

## 📁 Part 1: Prepare GitHub Repository

### Step 1.1: Create GitHub Repository

```bash
# On your local machine
cd "E:\Clients Work\kissan Ghar\Kissan Ghar Dashboard"

# Initialize git (if not already)
git init

# Create .gitignore
cat > .gitignore << EOL
# Node modules
node_modules/
client/node_modules/
server/node_modules/

# Environment variables
.env
server/.env
.env.local
.env.production

# Build output
client/dist/
client/build/

# Uploads and generated videos (DO NOT commit)
server/uploads/*
!server/uploads/.gitkeep
generated_videos/*
!generated_videos/.gitkeep

# Logs
*.log
npm-debug.log*
logs/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Temporary files
*.swp
*.swo
*~

# Database dumps
*.sql.backup
backup.sql

# PM2
.pm2/
EOL

# Create .gitkeep files for directories
mkdir -p server/uploads generated_videos
touch server/uploads/.gitkeep
touch generated_videos/.gitkeep

# Add all files
git add .

# Commit
git commit -m "Initial commit: Kissan Ghar Dashboard"

# Create repository on GitHub (via web interface)
# Then add remote and push
git remote add origin https://github.com/yourusername/kissan-ghar-dashboard.git
git branch -M main
git push -u origin main
```

### Step 1.2: Create Production Branch (Optional)

```bash
# Create production branch
git checkout -b production
git push -u origin production
```

---

## 🖥️ Part 2: VPS Initial Setup

### Step 2.1: Connect to VPS

```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### Step 2.2: Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version   # Should be 18+
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL (if not installed)
sudo apt install -y postgresql postgresql-contrib

# Install Nginx (if not installed)
sudo apt install -y nginx

# Install Git (if not installed)
sudo apt install -y git
```

### Step 2.3: Create Application Directory

```bash
# Create directory for application
sudo mkdir -p /var/www/kissan-ghar
sudo chown -R $USER:$USER /var/www/kissan-ghar
cd /var/www/kissan-ghar
```

---

## 📥 Part 3: Clone and Setup Application

### Step 3.1: Clone Repository

```bash
cd /var/www/kissan-ghar

# Clone from GitHub
git clone https://github.com/yourusername/kissan-ghar-dashboard.git .

# Or use SSH (recommended)
git clone git@github.com:yourusername/kissan-ghar-dashboard.git .

# Checkout production branch (if using)
git checkout production
```

### Step 3.2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
npm install multer uuid  # Missing dependencies

# Install client dependencies
cd ../client
npm install

# Return to root
cd /var/www/kissan-ghar
```

---

## 🗄️ Part 4: Setup PostgreSQL Database

### Step 4.1: Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE kissan_ghar_production;
CREATE USER kissanghar WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE kissan_ghar_production TO kissanghar;
\q
```

### Step 4.2: Import Schema

```bash
cd /var/www/kissan-ghar

# Import schema
psql -U kissanghar -d kissan_ghar_production -f schema.sql

# Run migrations
cd server
npm run migrate

# Import seed data (optional)
npm run import-data
```

### Step 4.3: Configure PostgreSQL for Production

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Find and set:
# listen_addresses = 'localhost'
# max_connections = 100

# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add line (if not exists):
# local   all             kissanghar                              md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## ⚙️ Part 5: Configure Application

### Step 5.1: Update Database Configuration

```bash
cd /var/www/kissan-ghar/server

# Edit db.js for production
nano db.js
```

**Update db.js:**
```javascript
import dotenv from 'dotenv';
import pkg from 'pg';
dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'kissanghar',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'kissan_ghar_production',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export default pool;
```

### Step 5.2: Create Production Environment File

```bash
cd /var/www/kissan-ghar/server

# Create .env file
nano .env
```

**Add production configuration:**
```env
# Server Configuration
NODE_ENV=production
PORT=4000
NODE_BASE_URL=https://yourdomain.com

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=kissanghar
DB_PASSWORD=your_secure_password_here
DB_NAME=kissan_ghar_production
DB_SSL=false

# N8N Webhooks (Update with your VPS N8N URLs)
N8N_SCRIPT_WEBHOOK_URL=https://yourdomain.com/n8n/webhook/script-generate
N8N_VIDEO_WEBHOOK_URL=https://yourdomain.com/n8n/webhook/video-generate
N8N_TITLE_WEBHOOK_URL=https://yourdomain.com/n8n/webhook/title-generate
N8N_DESCRIPTION_WEBHOOK_URL=https://yourdomain.com/n8n/webhook/description-generate
N8N_TAGS_WEBHOOK_URL=https://yourdomain.com/n8n/webhook/tags-generate
N8N_UPLOAD_WEBHOOK_URL=https://yourdomain.com/n8n/webhook/upload-video

# Security Token (Generate a secure random token)
N8N_CALLBACK_TOKEN=your_production_secure_token_here

# CORS (if frontend on different domain)
CORS_ORIGIN=https://yourdomain.com
```

**Generate secure token:**
```bash
# Generate random token
openssl rand -hex 32
```

### Step 5.3: Create Required Directories

```bash
cd /var/www/kissan-ghar

# Create directories with proper permissions
mkdir -p server/uploads
mkdir -p generated_videos
mkdir -p logs

# Set permissions
chmod 755 server/uploads
chmod 755 generated_videos
chmod 755 logs
```

---

## 🏗️ Part 6: Build Frontend

### Step 6.1: Build React App

```bash
cd /var/www/kissan-ghar/client

# Build for production
npm run build

# This creates client/dist/ folder with static files
```

### Step 6.2: Update API Base URL (if needed)

If your API is on a different domain, update:

```bash
cd /var/www/kissan-ghar/client/src/lib

nano api.ts
```

Update base URL:
```typescript
const API_BASE_URL = process.env.VITE_API_URL || '/api';
```

Then rebuild:
```bash
cd /var/www/kissan-ghar/client
npm run build
```

---

## 🚀 Part 7: Setup PM2 for Backend

### Step 7.1: Create PM2 Ecosystem File

```bash
cd /var/www/kissan-ghar

nano ecosystem.config.js
```

**Add configuration:**
```javascript
module.exports = {
  apps: [{
    name: 'kissan-ghar-backend',
    script: './server/index.js',
    cwd: '/var/www/kissan-ghar',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: '/var/www/kissan-ghar/logs/backend-error.log',
    out_file: '/var/www/kissan-ghar/logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
```

### Step 7.2: Start Application with PM2

```bash
cd /var/www/kissan-ghar

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Follow the command it outputs

# Check status
pm2 status
pm2 logs kissan-ghar-backend

# Monitor
pm2 monit
```

### Step 7.3: PM2 Useful Commands

```bash
# View logs
pm2 logs kissan-ghar-backend
pm2 logs kissan-ghar-backend --lines 100

# Restart
pm2 restart kissan-ghar-backend

# Stop
pm2 stop kissan-ghar-backend

# Delete
pm2 delete kissan-ghar-backend

# Reload (zero downtime)
pm2 reload kissan-ghar-backend

# Monitor
pm2 monit
```

---

## 🌐 Part 8: Configure Nginx

### Step 8.1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/kissan-ghar
```

**Add configuration:**
```nginx
# Kissan Ghar Dashboard Configuration
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Logs
    access_log /var/log/nginx/kissan-ghar-access.log;
    error_log /var/log/nginx/kissan-ghar-error.log;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Client max body size (for file uploads)
    client_max_body_size 10M;
    
    # API Backend (Express)
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # SSE configuration
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
    
    # Serve uploaded files
    location /uploads {
        alias /var/www/kissan-ghar/server/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Serve generated videos
    location /generated_videos {
        alias /var/www/kissan-ghar/generated_videos;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # React Frontend (static files)
    location / {
        root /var/www/kissan-ghar/client/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }
    
    # Static assets cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/kissan-ghar/client/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 8.2: Enable Site and Test

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/kissan-ghar /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

---

## 🔒 Part 9: Setup SSL/HTTPS (Recommended)

### Step 9.1: Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### Step 9.2: Obtain SSL Certificate

```bash
# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (recommended)

# Certbot will automatically update Nginx config
```

### Step 9.3: Auto-renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Certbot auto-renewal is set up via systemd timer
sudo systemctl status certbot.timer
```

### Step 9.4: Update Environment Variables

```bash
# Update NODE_BASE_URL to use HTTPS
nano /var/www/kissan-ghar/server/.env

# Change:
NODE_BASE_URL=https://yourdomain.com

# Restart backend
pm2 restart kissan-ghar-backend
```

---

## 🔄 Part 10: Deployment Workflow (GitHub)

### Method 1: Manual Deployment (Recommended for Beginners)

**Create deployment script:**

```bash
cd /var/www/kissan-ghar

nano deploy.sh
```

**Add script:**
```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling from GitHub..."
git pull origin main  # or production

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Build frontend
echo "🏗️ Building frontend..."
cd client
npm run build
cd ..

# Run migrations
echo "🗄️ Running database migrations..."
cd server
npm run migrate
cd ..

# Restart backend
echo "🔄 Restarting backend..."
pm2 restart kissan-ghar-backend

# Clear caches (optional)
# pm2 flush

echo "✅ Deployment complete!"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs kissan-ghar-backend"
```

**Make executable:**
```bash
chmod +x deploy.sh
```

**Deploy:**
```bash
./deploy.sh
```

---

### Method 2: GitHub Actions (Automated CI/CD)

**On GitHub, create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main, production ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to VPS
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USERNAME }}
        key: ${{ secrets.VPS_SSH_KEY }}
        script: |
          cd /var/www/kissan-ghar
          git pull origin main
          npm install
          cd server && npm install && cd ..
          cd client && npm install && npm run build && cd ..
          cd server && npm run migrate && cd ..
          pm2 restart kissan-ghar-backend
          echo "Deployment completed!"
```

**Setup GitHub Secrets:**
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add secrets:
   - `VPS_HOST`: Your VPS IP or domain
   - `VPS_USERNAME`: SSH username
   - `VPS_SSH_KEY`: Your private SSH key

**Now every push to main/production branch auto-deploys!**

---

## 🔥 Part 11: Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (IMPORTANT!)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only if external access needed)
# sudo ufw allow 5432/tcp

# Check status
sudo ufw status verbose
```

---

## 📊 Part 12: Monitoring & Maintenance

### Setup Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Setup monitoring dashboard (optional)
pm2 web
```

### Maintenance Commands

```bash
# View logs
pm2 logs kissan-ghar-backend --lines 100

# Monitor resources
pm2 monit

# Clear logs
pm2 flush

# Restart on high memory usage
pm2 restart kissan-ghar-backend

# Check disk space
df -h

# Check memory
free -h

# Check PostgreSQL connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

### Backup Strategy

**Create backup script:**
```bash
nano /var/www/kissan-ghar/backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/kissan-ghar"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U kissanghar kissan_ghar_production > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/kissan-ghar/server/uploads

# Backup generated videos
tar -czf $BACKUP_DIR/videos_$DATE.tar.gz /var/www/kissan-ghar/generated_videos

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Setup cron job:**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/kissan-ghar/backup.sh
```

---

## 🐛 Part 13: Troubleshooting

### Check Backend Status

```bash
pm2 status
pm2 logs kissan-ghar-backend
curl http://localhost:4000/health
```

### Check Nginx

```bash
sudo nginx -t
sudo systemctl status nginx
tail -f /var/log/nginx/kissan-ghar-error.log
```

### Check Database

```bash
sudo systemctl status postgresql
psql -U kissanghar -d kissan_ghar_production -c "SELECT version();"
```

### Permission Issues

```bash
sudo chown -R $USER:$USER /var/www/kissan-ghar
chmod 755 /var/www/kissan-ghar/server/uploads
chmod 755 /var/www/kissan-ghar/generated_videos
```

---

## ✅ Deployment Checklist

- [ ] VPS access configured
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Node.js installed on VPS
- [ ] PostgreSQL installed and configured
- [ ] PM2 installed
- [ ] Nginx installed
- [ ] Application cloned to VPS
- [ ] Dependencies installed
- [ ] Database created and migrated
- [ ] Environment variables configured
- [ ] Frontend built
- [ ] Backend started with PM2
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Backup script created
- [ ] Deployment script created
- [ ] Application accessible via domain
- [ ] All features tested

---

## 🎯 Quick Commands Reference

```bash
# Deploy
cd /var/www/kissan-ghar && ./deploy.sh

# Check status
pm2 status

# View logs
pm2 logs kissan-ghar-backend

# Restart
pm2 restart kissan-ghar-backend

# Database backup
pg_dump -U kissanghar kissan_ghar_production > backup.sql

# Check disk space
df -h

# Monitor processes
pm2 monit
```

---

**Deployment Complete! Your application is now running on VPS with GitHub integration! 🚀**

**Access:** https://yourdomain.com

---

**Document Version:** 1.0  
**Last Updated:** October 25, 2025  
**Estimated Deployment Time:** 1-2 hours

