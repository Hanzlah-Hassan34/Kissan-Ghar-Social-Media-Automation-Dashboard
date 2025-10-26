# VPS Deployment Steps - Execute These Commands

## Current Status: You're in /srv/kissan-ghar/Kissan-Ghar-Social-Media-Automation-Dashboard

Run these commands one by one:

## 1️⃣ Check Installed Software
```bash
node -v
npm -v
psql --version
```

## 2️⃣ If Node.js Not Installed
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
node -v
npm -v
```

## 3️⃣ If PostgreSQL Not Installed
```bash
apt update
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

## 4️⃣ Create Database
```bash
sudo -u postgres psql -c "CREATE DATABASE Kissan_ghar_automation;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '3234';"
```

## 5️⃣ Install Dependencies
```bash
# Root dependencies
npm install

# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
cd ..
```

## 6️⃣ Setup Database Schema
```bash
cd server
psql -U postgres -d Kissan_ghar_automation -f ../schema.sql
psql -U postgres -d Kissan_ghar_automation -f migrations/005_add_users_table.sql
node scripts/set-plain-password.js
cd ..
```

## 7️⃣ Import Initial Data
```bash
cd server
npm run import-data
cd ..
```

## 8️⃣ Build Frontend
```bash
cd client
npm run build
cd ..
```

## 9️⃣ Install PM2
```bash
npm install -g pm2
```

## 🔟 Start Backend
```bash
cd server
pm2 start index.js --name kissan-ghar-backend
pm2 save
pm2 startup
cd ..
```

## 1️⃣1️⃣ Check PM2 Status
```bash
pm2 status
pm2 logs kissan-ghar-backend
```

## 1️⃣2️⃣ Install Nginx (if not installed)
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

## 1️⃣3️⃣ Configure Nginx
```bash
nano /etc/nginx/sites-available/kissan-ghar
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root /srv/kissan-ghar/Kissan-Ghar-Social-Media-Automation-Dashboard/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Webhooks
    location /webhook {
        proxy_pass http://localhost:4000;
    }

    # Uploads
    location /uploads {
        alias /srv/kissan-ghar/Kissan-Ghar-Social-Media-Automation-Dashboard/server/uploads;
    }

    # Videos
    location /generated_videos {
        alias /srv/kissan-ghar/Kissan-Ghar-Social-Media-Automation-Dashboard/generated_videos;
    }
}
```

## 1️⃣4️⃣ Enable Nginx Site
```bash
ln -s /etc/nginx/sites-available/kissan-ghar /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## 1️⃣5️⃣ Check Everything
```bash
pm2 status
systemctl status nginx
systemctl status postgresql
netstat -tulpn | grep 4000
```

## 🎉 Done!
Your dashboard should now be accessible at: http://YOUR_VPS_IP

Login credentials:
- Email: waqaschohan@gmail.com
- Password: 65432


