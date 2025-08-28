# WAHA WhatsApp Integration Setup Guide

This guide will help you configure the WAHA (WhatsApp HTTP API) integration for the Layanan service notifications.

## ✅ **Solution Found!** 

### 🔑 Authentication Method
**WAHA uses `X-API-Key` header authentication, not Bearer tokens.**

### ✅ Correct Configuration
Your `.env` file is correctly configured:

```env
# WAHA Configuration  
VITE_WAHA_URL="http://34.83.178.21:3000"
VITE_WAHA_API_KEY="admin"  # ✅ Correct API key
VITE_WAHA_SESSION="default"
```

### ✅ Server Status Verified
- **Connection**: ✅ Working with X-API-Key authentication
- **Session Status**: ✅ "WORKING" (ready to send messages)
- **WhatsApp Connected**: ✅ "Riza ibnu Seno" (6285740563586@c.us)

### 🔄 Apply Changes
**The WAHA service has been updated to use the correct authentication method.**

1. **Restart your development server** (if not already done):
   ```bash
   npm run dev
   ```

2. **Test the connection** in the admin dashboard:
   - Navigate to `http://localhost:8081/admin`
   - Go to "Layanan" tab
   - Use "Test Connection" button
   - Should now show ✅ "Connected" status

## 🚨 Current Issue Solution

**Error**: `401 (Unauthorized)` when testing WAHA connection
**Cause**: The WAHA API key is not properly configured

## 🔧 Quick Fix

### Step 1: Use the Correct WAHA API Key

Based on your WAHA server environment variables, the API key is: **`admin`**

### Step 2: Verify Environment Configuration

Your `.env` file should contain:

```env
# WAHA Configuration
VITE_WAHA_URL="http://34.83.178.21:3000"
VITE_WAHA_API_KEY="admin"  # ✅ This is the correct API key
VITE_WAHA_SESSION="default"
```

### Step 3: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

**The server should now be accessible at `http://localhost:8081`**

## 📋 Complete WAHA Configuration

Your `.env` file should contain:

```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="vncabxtxbiqaoluxprlh"
VITE_SUPABASE_PUBLISHABLE_KEY="your_supabase_key"
VITE_SUPABASE_URL="https://vncabxtxbiqaoluxprlh.supabase.co"

# WAHA Configuration
VITE_WAHA_URL="http://34.83.178.21:3000"
VITE_WAHA_API_KEY="admin"  # ✅ Correct API key from server
VITE_WAHA_SESSION="default"
```

## 🧪 Testing the Integration

### 1. Test Connection
1. Navigate to `/admin` in your web app
2. Go to the "Layanan" tab
3. Use the "Test Connection" button in the WAHA Test Panel
4. Should show "Connected" status

### 2. Test Message Sending
1. Enter a valid Indonesian phone number (08xxxxxxxxx)
2. Click "Send Test Message"
3. Check WhatsApp for the test notification

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. 401 Unauthorized Error
- **Problem**: Invalid or missing API key
- **Solution**: Replace `"your_waha_api_key"` with actual API key
- **Check**: API key should not contain quotes when copied

#### 2. 404 Not Found Error
- **Problem**: Wrong WAHA server URL or endpoint
- **Solution**: Verify WAHA server is running at `34.83.178.21:3000`
- **Check**: Test URL directly in browser

#### 3. Network/Connection Error
- **Problem**: Cannot reach WAHA server
- **Solution**: Check server status and network connectivity
- **Check**: Ping `34.83.178.21` to test connectivity

#### 4. 500 Internal Server Error
- **Problem**: WAHA server internal issue
- **Solution**: Check WAHA server logs and restart if needed
- **Check**: Contact server administrator

## 🖥️ WAHA Server Information

### Server Details
- **URL**: `http://34.83.178.21:3000`
- **API Key**: `admin`
- **Dashboard Enabled**: ✅ Yes
- **CORS Enabled**: ✅ Yes (Origin: `*`)

### Dashboard Access
- **URL**: `http://34.83.178.21:3000`
- **Username**: `admin`
- **Password**: `admin123`

### Server Environment
```
WAHA_API_KEY=admin
WAHA_DASHBOARD_ENABLED=true
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=admin123
WAHA_CORS_ENABLED=true
WAHA_CORS_ORIGIN=*
WHATSAPP_DEFAULT_ENGINE=WEBJS
```

## 📱 WhatsApp Session Setup

### Ensuring WhatsApp Session is Active

1. **Access WAHA Dashboard**: `http://34.83.178.21:3000`
2. **Check Session Status**: Look for "default" session
3. **Start Session** if not running:
   - Click "Start" on the default session
   - Scan QR code with WhatsApp
   - Wait for "WORKING" status

### Session Management
- **Session Name**: `default` (configured in .env)
- **Status**: Should be "WORKING" for message sending
- **QR Code**: Scan with WhatsApp app to authenticate

## 🔐 Security Best Practices

### API Key Security
- **Never commit** API keys to version control
- **Use environment variables** for sensitive data
- **Rotate API keys** regularly for security
- **Restrict access** to production API keys

### Server Security
- **Use HTTPS** in production environments
- **Implement rate limiting** for API endpoints
- **Monitor API usage** for unusual activity
- **Backup configurations** regularly

## 📊 Message Flow Architecture

```
Mobile App → Service Request → Supabase Database
                ↓                    ↓
        Admin Updates Status    Notification Trigger
                ↓                    ↓
        WAHA Service ←─────── Auto Send WhatsApp
                ↓
        WhatsApp User ← Message Delivered
```

## 🎯 Expected Behavior After Setup

### Automatic Notifications
1. **New Request**: User receives confirmation via WhatsApp
2. **Status Update**: User gets notified when status changes
3. **Document Ready**: User receives pickup instructions
4. **Operator Notes**: Custom messages from admin

### Admin Features
1. **Connection Test**: Green "Connected" status
2. **Test Messages**: Successful delivery to test numbers
3. **Live Notifications**: Real-time sending on status updates
4. **Error Handling**: Clear error messages for issues

## 📞 Support

### If Issues Persist:
1. **Check WAHA server logs** for detailed error messages
2. **Verify network connectivity** between app and WAHA server
3. **Test API endpoints** directly using tools like Postman
4. **Review WAHA documentation** for API changes

### Contact Information:
- **WAHA Documentation**: Available at server dashboard
- **Server Administrator**: Contact for server-level issues
- **Development Team**: For application-level problems

---

## ✅ Success Checklist

- [ ] WAHA API key updated in `.env` file
- [ ] Development server restarted
- [ ] Connection test shows "Connected" status
- [ ] Test message successfully sent to WhatsApp
- [ ] WhatsApp session is "WORKING" status
- [ ] Automatic notifications working on status updates

Once all items are checked, your WAHA integration is fully functional! 🎉