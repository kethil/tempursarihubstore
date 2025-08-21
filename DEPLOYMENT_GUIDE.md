# Complete Deployment Guide: Tempursari Hub

This comprehensive guide covers deploying your web app to a server, building an Android APK, and publishing to Google Play Store.

## Table of Contents
1. [Web App Deployment](#web-app-deployment)
2. [Android APK Build](#android-apk-build)
3. [Google Play Store Publishing](#google-play-store-publishing)
4. [Production Optimization](#production-optimization)
5. [Maintenance & Updates](#maintenance--updates)

---

## 1. Web App Deployment

### Prerequisites
- Your server (34.83.178.21) with SSH access
- Node.js 18+ installed on server
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

### Step 1: Server Preparation

```bash
# Connect to your server
ssh username@34.83.178.21

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Web Server)
sudo apt install nginx -y

# Install Git
sudo apt install git -y
```

### Step 2: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/tempursari-hub
sudo chown $USER:$USER /var/www/tempursari-hub

# Clone your repository
cd /var/www/tempursari-hub
git clone https://github.com/yourusername/tempursari-hub.git .

# Install dependencies
npm install

# Create production environment file
cp env.example .env
nano .env
```

**Configure your `.env` file:**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://vncabxtxbiqaoluxprlh.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# WAHA Configuration
VITE_WAHA_URL=http://34.83.178.21:3000
VITE_WAHA_API_KEY=your_waha_api_key
VITE_WAHA_SESSION=default
```

### Step 3: Build Production Application

```bash
# Build for production
npm run build

# Test the build locally
npm run preview
```

### Step 4: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tempursari-hub
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain
    # server_name 34.83.178.21;  # Use this if no domain
    
    root /var/www/tempursari-hub/dist;
    index index.html index.htm;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

**Enable the site:**
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tempursari-hub /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 5: Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 6: Setup Deployment Script

```bash
# Create deployment script
nano /var/www/tempursari-hub/deploy.sh
```

**Deployment Script:**
```bash
#!/bin/bash
echo "🚀 Starting deployment..."

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Restart Nginx
sudo systemctl reload nginx

echo "✅ Deployment completed!"
```

```bash
# Make script executable
chmod +x /var/www/tempursari-hub/deploy.sh
```

---

## 2. Android APK Build

### Prerequisites
- Android Studio installed
- Java 11+ installed
- Android SDK configured

### Step 1: Setup Capacitor for Android

```bash
# In your local development environment
cd /path/to/your/tempursari-hub

# Install Capacitor CLI
npm install -g @capacitor/cli

# Add Android platform
npx cap add android

# Sync web assets
npx cap sync android
```

### Step 2: Configure Android App

**Update `capacitor.config.ts`:**
```typescript
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.tempursari.hub',
  appName: 'Tempursari Hub',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
  },
};

export default config;
```

**Configure Android app details in `android/app/src/main/res/values/strings.xml`:**
```xml
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">Tempursari Hub</string>
    <string name="title_activity_main">Tempursari Hub</string>
    <string name="package_name">com.tempursari.hub</string>
    <string name="custom_url_scheme">com.tempursari.hub</string>
</resources>
```

### Step 3: Build Production Web App

```bash
# Build optimized web app
npm run build

# Sync with Android
npx cap sync android
```

### Step 4: Configure App Icons and Splash Screen

**Generate app icons (1024x1024 PNG):**
- Create app icon: `android/app/src/main/res/mipmap-*/ic_launcher.png`
- Use online generators like: https://romannurik.github.io/AndroidAssetStudio/

**Configure splash screen:**
- Add splash image: `android/app/src/main/res/drawable/splash.png`

### Step 5: Build APK

**Method 1: Using Android Studio**
```bash
# Open Android project
npx cap open android

# In Android Studio:
# 1. Build → Generate Signed Bundle/APK
# 2. Choose APK
# 3. Create new keystore or use existing
# 4. Build Release APK
```

**Method 2: Command Line**
```bash
# Navigate to android directory
cd android

# Build release APK
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

### Step 6: Create Keystore (First time only)

```bash
# Generate keystore
keytool -genkey -v -keystore tempursari-hub-release-key.keystore -alias tempursari-hub -keyalg RSA -keysize 2048 -validity 10000

# Store keystore securely and remember the passwords!
```

**Create `android/gradle.properties`:**
```properties
MYAPP_RELEASE_STORE_FILE=tempursari-hub-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=tempursari-hub
MYAPP_RELEASE_STORE_PASSWORD=your_store_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

**Update `android/app/build.gradle`:**
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## 3. Google Play Store Publishing

### Step 1: Google Play Console Setup

1. **Create Google Play Developer Account:**
   - Go to https://play.google.com/console
   - Pay $25 one-time registration fee
   - Complete account verification

2. **Create New Application:**
   - Click "Create app"
   - Choose app name: "Tempursari Hub"
   - Select "App" (not Game)
   - Choose "Free" or "Paid"
   - Accept policies

### Step 2: App Information

**Main Store Listing:**
```
App Name: Tempursari Hub
Short Description: Sistem layanan administrasi desa digital untuk masyarakat Tempursari

Full Description:
Tempursari Hub adalah aplikasi layanan administrasi desa yang memudahkan masyarakat dalam mengajukan berbagai surat keterangan dan dokumen resmi. 

Fitur utama:
🏛️ Layanan Surat Keterangan (KTP, Domisili, Usaha, dll)
📱 Tracking status permohonan real-time
💬 Notifikasi WhatsApp otomatis
📋 Interface yang mudah digunakan
🔒 Keamanan data terjamin

Layanan yang tersedia:
• Surat Pengantar KTP
• Surat Keterangan Domisili  
• Surat Keterangan Usaha
• Surat Keterangan Tidak Mampu
• Surat Keterangan Belum Menikah
• Surat Pengantar Nikah
• Surat Keterangan Kematian
• Surat Keterangan Kelahiran

Hubungi kami untuk informasi lebih lanjut tentang layanan administrasi desa.
```

**App Category:** Productivity
**Content Rating:** Everyone
**Contact Details:** Your email and website

### Step 3: Graphics Assets

**Required Images:**
- **App Icon:** 512x512 PNG (high-res)
- **Feature Graphic:** 1024x500 PNG
- **Screenshots:** 
  - Phone: 2-8 screenshots (16:9 or 9:16 ratio)
  - Tablet: 1-8 screenshots (optional)

**Create Screenshots:**
- Home screen
- Service selection
- Form filling
- Status tracking
- Results/completion

### Step 4: App Content

**Privacy Policy:**
Create a privacy policy and host it on your website. Example content:
```
Privacy Policy for Tempursari Hub

This app collects:
- Personal information for service requests (Name, NIK, Phone)
- Documents uploaded for processing
- Usage analytics

Data is stored securely and used only for service processing.
Contact: admin@tempursari-hub.com
```

**Target Audience:** 
- Primary: Adults (18+)
- Content: General audience

### Step 5: Release Management

**App Bundle vs APK:**
- **Recommended:** Upload App Bundle (AAB) instead of APK
- **Build AAB:**
```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

**Release Track:**
1. **Internal Testing:** For team testing
2. **Closed Testing:** For limited users
3. **Open Testing:** Public beta
4. **Production:** Live release

### Step 6: Upload and Review

1. **Upload App Bundle/APK:**
   - Go to "Release management" → "App releases"
   - Choose track (Production for live release)
   - Upload AAB/APK file

2. **Release Notes:**
```
Version 1.0.0
🎉 Peluncuran awal Tempursari Hub!

✨ Fitur baru:
• Pengajuan surat keterangan online
• Tracking status real-time  
• Notifikasi WhatsApp otomatis
• Interface yang user-friendly

📱 Mulai gunakan layanan digital desa sekarang!
```

3. **Review and Publish:**
   - Complete all required sections
   - Submit for review
   - Review typically takes 1-3 days

---

## 4. Production Optimization

### Web Performance

**1. Enable Compression:**
```bash
# Already configured in Nginx above
```

**2. Optimize Images:**
```bash
# Install image optimization tools
npm install -D @squoosh/lib imagemin-webp

# Add to build process or optimize manually
```

**3. Bundle Analysis:**
```bash
# Analyze bundle size
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/assets/*.js
```

### Android Optimization

**1. Enable Proguard (Code Shrinking):**
```gradle
// In android/app/build.gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

**2. Split APKs by Architecture:**
```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include "arm64-v8a", "armeabi-v7a", "x86", "x86_64"
            universalApk true
        }
    }
}
```

### Security

**1. Environment Variables:**
```bash
# Never commit sensitive data
# Use environment-specific configs
```

**2. API Security:**
```bash
# Implement rate limiting
# Use HTTPS only
# Validate all inputs
```

---

## 5. Maintenance & Updates

### Automated Deployment

**GitHub Actions Workflow (`.github/workflows/deploy.yml`):**
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/tempursari-hub
          ./deploy.sh
```

### Update Process

**1. Web App Updates:**
```bash
# On server
cd /var/www/tempursari-hub
./deploy.sh
```

**2. Android App Updates:**
```bash
# Build new version
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease

# Upload to Play Console
# Increment version code in android/app/build.gradle
```

### Monitoring

**1. Server Monitoring:**
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor logs
sudo tail -f /var/log/nginx/access.log
```

**2. App Analytics:**
- Google Analytics
- Firebase Analytics
- Play Console statistics

---

## Quick Deployment Checklist

### Web Deployment ✅
- [ ] Server setup and dependencies installed
- [ ] Repository cloned and configured
- [ ] Environment variables set
- [ ] Application built successfully
- [ ] Nginx configured and running
- [ ] SSL certificate installed (optional)
- [ ] Domain pointing to server
- [ ] WAHA integration tested

### Android Build ✅
- [ ] Capacitor configured
- [ ] App icons and splash screen added
- [ ] Keystore created and secured
- [ ] APK/AAB built successfully
- [ ] App tested on device
- [ ] Performance optimized

### Google Play Publishing ✅
- [ ] Google Play Developer account created
- [ ] App listing completed
- [ ] Screenshots and graphics uploaded
- [ ] Privacy policy published
- [ ] App bundle uploaded
- [ ] Release notes written
- [ ] App submitted for review

---

## Support & Troubleshooting

### Common Issues

**1. Build Errors:**
```bash
# Clear cache
npm run clean
rm -rf node_modules package-lock.json
npm install
```

**2. Android Build Issues:**
```bash
# Clean Android build
cd android
./gradlew clean
cd .. && npx cap sync android
```

**3. Deployment Issues:**
```bash
# Check Nginx status
sudo systemctl status nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### Getting Help

- **Web Issues:** Check browser developer tools
- **Android Issues:** Check Android Studio logcat
- **Play Store:** Google Play Console help center
- **General:** Stack Overflow, GitHub issues

---

🎉 **Congratulations!** You now have a complete guide to deploy your Tempursari Hub application to production, build Android APKs, and publish to Google Play Store.

Remember to test thoroughly at each step and keep backups of important files like keystores and environment configurations.
