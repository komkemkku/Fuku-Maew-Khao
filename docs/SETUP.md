# 🐱 Fukuneko App - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [LINE Bot Configuration](#line-bot-configuration)
5. [Local Development](#local-development)
6. [Production Deployment](#production-deployment)
7. [Feature Configuration](#feature-configuration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software
- **Node.js** 18.17.0 or later
- **npm** or **yarn** package manager
- **Git** for version control
- **PostgreSQL** database (or Supabase account)

### Required Accounts
- **LINE Developers Account** - [Register here](https://developers.line.biz/)
- **Supabase Account** (recommended) - [Sign up here](https://supabase.com)
- **Vercel Account** (for deployment) - [Sign up here](https://vercel.com)

## 🌍 Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/komkemkku/Fuku-Maew-Khao.git
cd Fuku-Maew-Khao
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your actual values
nano .env.local
```

### 4. Required Environment Variables
```env
# LINE Bot (Required)
LINE_CHANNEL_SECRET="your_line_channel_secret"
LINE_CHANNEL_ACCESS_TOKEN="your_line_channel_access_token"
NEXT_PUBLIC_LIFF_ID="your_liff_id"

# Database (Required)
DATABASE_URL="postgresql://username:password@host:port/database"

# Security (Required)
MIGRATION_SECRET="secure_random_string_32_chars"
DEV_ACCESS_KEY="secure_random_string_32_chars"
CRON_API_KEY="secure_random_string_32_chars"
```

## 🗄️ Database Setup

### Option 1: Supabase (Recommended)

1. **Create New Project**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Choose organization and region (Singapore recommended)

2. **Get Database URL**
   - Go to Project Settings → Database
   - Copy the "Connection string" under "Connection pooling"
   - Replace `[YOUR-PASSWORD]` with your actual password

3. **Set up Tables**
   ```bash
   # Run migration helper (one-time setup)
   npm run dev
   # Visit: http://localhost:3000/api/migration-helper
   # Or use the migration API endpoint
   ```

### Option 2: Local PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create Database**
   ```bash
   createdb fukuneko_db
   ```

3. **Update DATABASE_URL**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/fukuneko_db"
   ```

## 🤖 LINE Bot Configuration

### 1. Create LINE Bot Channel

1. **Go to LINE Developers Console**
   - Visit [LINE Developers](https://developers.line.biz/)
   - Login or create account

2. **Create New Provider** (if needed)
   - Click "Create a new provider"
   - Enter provider name: "Fukuneko"

3. **Create Messaging API Channel**
   - Click "Create a new channel"
   - Select "Messaging API"
   - Fill in required information:
     - Channel name: "Fukuneko Financial Assistant"
     - Channel description: "Personal finance management bot"
     - Category: "Finance"
     - Subcategory: "Personal Finance"

### 2. Configure Bot Settings

1. **Basic Settings**
   - Channel ID → Copy to somewhere safe
   - Channel secret → Copy to `LINE_CHANNEL_SECRET`

2. **Messaging API Settings**
   - Issue Channel access token → Copy to `LINE_CHANNEL_ACCESS_TOKEN`
   - Webhook URL: `https://your-domain.com/api/webhook`
   - Webhook: Enable
   - Auto-reply messages: Disable
   - Greeting messages: Disable

### 3. Create LIFF App

1. **Add LIFF App**
   - Go to LIFF tab in your channel
   - Click "Add"
   - Size: Full
   - Endpoint URL: `https://your-domain.com`
   - Copy LIFF ID to `NEXT_PUBLIC_LIFF_ID`

## 🚀 Local Development

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Database Connection
```bash
# Visit migration helper
open http://localhost:3000/api/migration-helper
```

### 3. Test LINE Bot Locally

#### Using ngrok (Recommended)
```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update LINE Bot webhook URL to: https://abc123.ngrok.io/api/webhook
```

#### Using Vercel Development
```bash
# Install Vercel CLI
npm install -g vercel

# Start development with public URL
vercel dev --listen 3000
```

### 4. Verify Features
- Add bot as friend on LINE
- Send test messages
- Check console logs for any errors

## 🌐 Production Deployment

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 2. Configure Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - Select your project
   - Go to Settings → Environment Variables

2. **Add All Environment Variables**
   - Copy from your `.env.local`
   - Make sure to use production values

### 3. Update LINE Bot Webhook

1. **Update Webhook URL**
   - Go to LINE Developers Console
   - Update webhook URL to: `https://your-vercel-domain.vercel.app/api/webhook`

2. **Test Webhook**
   - Send message to bot
   - Check Vercel function logs

### 4. Configure Cron Jobs

The `vercel.json` file includes cron job configuration:
- Morning notifications: Daily at 8:00 AM
- Evening notifications: Daily at 8:00 PM  
- Weekly budget reminders: Sundays at 6:00 PM

## ⚙️ Feature Configuration

### 1. Daily Notifications

```env
# Enable/disable notifications
ENABLE_DAILY_NOTIFICATIONS="true"

# Configure timing
MORNING_NOTIFICATION_TIME="08:00"
EVENING_NOTIFICATION_TIME="20:00"
WEEKLY_NOTIFICATION_DAY="0"  # Sunday
WEEKLY_NOTIFICATION_TIME="18:00"
```

### 2. Secret Commands

```env
# Your LINE User ID (for developer commands)
DEV_LINE_USER_ID="U1234567890abcdef1234567890abcdef"

# Disable in production if needed
DISABLE_SECRET_COMMANDS="false"
```

**To get your LINE User ID:**
1. Add the bot as friend
2. Send any message
3. Check server logs for your User ID
4. Add it to environment variables

### 3. Sticker Responses

```env
# Enable feature
ENABLE_STICKER_RESPONSE="true"

# Configure response probabilities
SPECIAL_RESPONSE_CHANCE="0.3"  # 30%
STICKER_REPLY_CHANCE="0.2"     # 20%
```

### 4. Rate Limiting

```env
# Configure limits
MAX_DAILY_NOTIFICATIONS_PER_USER="3"
RATE_LIMIT_WINDOW="3600"
RATE_LIMIT_MAX_REQUESTS="100"
```

## 🧪 Testing

### 1. Unit Tests (Future)
```bash
npm run test
```

### 2. Manual Testing

#### Test Webhook
```bash
curl -X GET "https://your-domain.com/api/webhook"
```

#### Test Notifications
```bash
# Test morning notification
curl -X POST "https://your-domain.com/api/notifications?action=test&userId=YOUR_USER_ID&type=morning" \
  -H "x-api-key: YOUR_CRON_API_KEY"
```

#### Test Secret Commands
Send these messages via LINE:
- `#help` - Show all commands
- `#demo-data` - Create demo data (requires auth)
- `#status` - Show system status (requires auth)

#### Test Bot Features
- Send text messages
- Send stickers
- Send images/videos
- Check response quality

### 3. Database Testing

```bash
# Test database connection
curl -X GET "https://your-domain.com/api/migration-helper"

# Test transaction creation
# Send message like "100 ค่ากาแฟ" via LINE

# Test summary
# Send message "สรุป" via LINE
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Webhook not working
**Symptoms:** Bot doesn't respond to messages
**Solutions:**
- Check webhook URL is correct and accessible
- Verify LINE channel secret and access token
- Check server logs for errors
- Ensure webhook is enabled in LINE console

#### 2. Database connection failed
**Symptoms:** Error messages about database
**Solutions:**
- Verify DATABASE_URL is correct
- Check database server is running
- Ensure database exists and has proper permissions
- Run migration helper to create tables

#### 3. Cron jobs not running
**Symptoms:** No daily notifications
**Solutions:**
- Check Vercel cron job configuration
- Verify CRON_API_KEY is set correctly
- Check function logs in Vercel dashboard
- Ensure cron jobs are enabled in Vercel plan

#### 4. Secret commands not working
**Symptoms:** Commands return "unauthorized"
**Solutions:**
- Set DEV_LINE_USER_ID in environment variables
- Get your actual LINE User ID from logs
- Check if commands require authentication
- Verify you're in development mode

#### 5. Build failures
**Symptoms:** Deployment fails during build
**Solutions:**
- Check TypeScript errors: `npm run build`
- Verify all dependencies are installed
- Check environment variables are set
- Review build logs for specific errors

### Debug Mode

Enable detailed logging:
```env
LOG_LEVEL="debug"
ENABLE_WEBHOOK_LOGGING="true"
ENABLE_NOTIFICATION_LOGGING="true"
```

### Getting Help

1. **Check Documentation**
   - Read all `.md` files in `docs/` folder
   - Review code comments

2. **Check Logs**
   - Vercel: Function logs in dashboard
   - Local: Terminal output
   - LINE: Webhook delivery logs

3. **Common Commands**
   ```bash
   # Check build
   npm run build
   
   # Start fresh development
   rm -rf .next node_modules
   npm install
   npm run dev
   
   # Reset database (careful!)
   # Visit /api/migration-helper and run reset
   ```

## 📚 Additional Resources

- [LINE Bot SDK Documentation](https://developers.line.biz/en/docs/messaging-api/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

## 🎯 Next Steps

After successful setup:

1. **Customize Bot Personality**
   - Edit responses in `src/lib/fortune-service.ts`
   - Modify sticker responses in `src/lib/sticker-response.ts`

2. **Add More Features**
   - Financial goal tracking
   - Expense categorization improvements
   - Advanced analytics

3. **Improve User Experience**
   - Add more interactive features
   - Implement rich menus
   - Add LIFF web interface

4. **Production Optimization**
   - Set up monitoring
   - Configure error tracking
   - Optimize database queries

---

**🎉 Congratulations! Your Fukuneko bot is now ready to help users manage their finances with cuteness! 😸**
