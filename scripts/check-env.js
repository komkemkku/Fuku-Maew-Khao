#!/usr/bin/env node

/**
 * Environment Variables Checker
 * ตรวจสอบว่า environment variables ทั้งหมดถูกตั้งค่าครบถ้วนหรือไม่
 */

const requiredVars = [
  'LINE_CHANNEL_SECRET',
  'LINE_CHANNEL_ACCESS_TOKEN', 
  'DATABASE_URL',
  'MIGRATION_SECRET',
  'DEV_ACCESS_KEY',
  'CRON_API_KEY'
];

const optionalVars = [
  'NEXT_PUBLIC_LIFF_ID',
  'DEV_LINE_USER_ID',
  'ENABLE_DAILY_NOTIFICATIONS',
  'ENABLE_STICKER_RESPONSE',
  'ENABLE_FORTUNE_SERVICE',
  'MORNING_NOTIFICATION_TIME',
  'EVENING_NOTIFICATION_TIME',
  'WEEKLY_NOTIFICATION_DAY',
  'WEEKLY_NOTIFICATION_TIME',
  'SPECIAL_RESPONSE_CHANCE',
  'STICKER_REPLY_CHANCE',
  'LOG_LEVEL'
];

console.log('🔍 Checking Environment Variables...\n');

let hasErrors = false;

// Check required variables
console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: MISSING`);
    hasErrors = true;
  } else {
    const display = varName.includes('SECRET') || varName.includes('TOKEN') || varName.includes('KEY') 
      ? '***HIDDEN***' 
      : value.length > 50 
        ? `${value.substring(0, 20)}...` 
        : value;
    console.log(`✅ ${varName}: ${display}`);
  }
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚠️  ${varName}: NOT SET (using default)`);
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});

// Environment-specific checks
console.log('\n🌍 Environment Info:');
console.log(`📍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`📍 Platform: ${process.platform}`);
console.log(`📍 Node Version: ${process.version}`);

if (process.env.VERCEL) {
  console.log(`📍 Vercel Environment: ${process.env.VERCEL_ENV || 'unknown'}`);
  console.log(`📍 Vercel URL: ${process.env.VERCEL_URL || 'not set'}`);
}

// Validation checks
console.log('\n🔧 Validation Checks:');

// Database URL format
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    console.log('✅ Database URL format: Valid PostgreSQL URL');
  } else {
    console.log('❌ Database URL format: Invalid (should start with postgresql:// or postgres://)');
    hasErrors = true;
  }
}

// LINE Channel Access Token format
if (process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (token.length > 100) {
    console.log('✅ LINE Channel Access Token: Valid format');
  } else {
    console.log('❌ LINE Channel Access Token: Too short (should be 100+ characters)');
    hasErrors = true;
  }
}

// LINE Channel Secret format  
if (process.env.LINE_CHANNEL_SECRET) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (secret.length === 32) {
    console.log('✅ LINE Channel Secret: Valid format');
  } else {
    console.log('❌ LINE Channel Secret: Invalid length (should be 32 characters)');
    hasErrors = true;
  }
}

// LIFF ID format
if (process.env.NEXT_PUBLIC_LIFF_ID) {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (liffId.includes('-')) {
    console.log('✅ LIFF ID: Valid format');
  } else {
    console.log('⚠️  LIFF ID: Unusual format (should contain hyphen)');
  }
}

// Summary
console.log('\n📊 Summary:');
if (hasErrors) {
  console.log('❌ Some required environment variables are missing or invalid.');
  console.log('📖 Please check docs/SETUP.md for configuration instructions.');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are properly configured!');
  
  const missingOptional = optionalVars.filter(varName => !process.env[varName]);
  if (missingOptional.length > 0) {
    console.log(`⚠️  ${missingOptional.length} optional variables not set (will use defaults)`);
  }
  
  console.log('🚀 Environment is ready for deployment!');
  process.exit(0);
}
