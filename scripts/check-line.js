#!/usr/bin/env node

/**
 * LINE Bot Health Checker
 * ตรวจสอบการเชื่อมต่อ LINE Bot และ webhook
 */

const https = require('https');
require('dotenv').config();

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function checkLineBot() {
  console.log('🤖 Checking LINE Bot Configuration...\n');
  
  // Check environment variables
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  
  if (!channelAccessToken) {
    console.log('❌ LINE_CHANNEL_ACCESS_TOKEN not found');
    return false;
  }
  
  if (!channelSecret) {
    console.log('❌ LINE_CHANNEL_SECRET not found');
    return false;
  }
  
  console.log('✅ Environment variables found');
  
  // Test LINE API connection
  console.log('\n📡 Testing LINE API Connection...');
  
  try {
    const response = await makeRequest('https://api.line.me/v2/bot/info', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      console.log('✅ LINE API connection successful');
      console.log(`📍 Bot ID: ${response.data.userId}`);
      console.log(`📍 Basic ID: ${response.data.basicId}`);
      console.log(`📍 Display Name: ${response.data.displayName}`);
      console.log(`📍 Picture URL: ${response.data.pictureUrl || 'Not set'}`);
    } else {
      console.log(`❌ LINE API Error: ${response.statusCode}`);
      console.log(`📄 Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ LINE API Connection Failed: ${error.message}`);
    return false;
  }
  
  // Test quota information
  console.log('\n📊 Checking API Quota...');
  
  try {
    const quotaResponse = await makeRequest('https://api.line.me/v2/bot/message/quota', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`
      }
    });
    
    if (quotaResponse.statusCode === 200) {
      console.log('✅ Quota information retrieved');
      console.log(`📈 Type: ${quotaResponse.data.type}`);
      console.log(`📈 Value: ${quotaResponse.data.value || 'Unlimited'}`);
    } else {
      console.log(`⚠️  Could not retrieve quota: ${quotaResponse.statusCode}`);
    }
  } catch (error) {
    console.log(`⚠️  Quota check failed: ${error.message}`);
  }
  
  // Test message consumption
  console.log('\n💬 Checking Message Usage...');
  
  try {
    const consumptionResponse = await makeRequest('https://api.line.me/v2/bot/message/quota/consumption', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`
      }
    });
    
    if (consumptionResponse.statusCode === 200) {
      console.log('✅ Usage information retrieved');
      console.log(`📊 Total Usage: ${consumptionResponse.data.totalUsage || 0}`);
    } else {
      console.log(`⚠️  Could not retrieve usage: ${consumptionResponse.statusCode}`);
    }
  } catch (error) {
    console.log(`⚠️  Usage check failed: ${error.message}`);
  }
  
  // Check webhook URL if available
  console.log('\n🌐 Webhook Configuration:');
  
  const webhookUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/webhook`
    : process.env.WEBHOOK_URL;
    
  if (webhookUrl) {
    console.log(`📍 Webhook URL: ${webhookUrl}`);
    
    try {
      const webhookResponse = await makeRequest(webhookUrl, {
        method: 'GET'
      });
      
      if (webhookResponse.statusCode === 200 || webhookResponse.statusCode === 405) {
        console.log('✅ Webhook endpoint is accessible');
      } else {
        console.log(`⚠️  Webhook returned: ${webhookResponse.statusCode}`);
      }
    } catch (error) {
      console.log(`⚠️  Webhook test failed: ${error.message}`);
    }
  } else {
    console.log('⚠️  Webhook URL not configured');
  }
  
  // Test message sending capability (if dev user ID provided)
  const devUserId = process.env.DEV_LINE_USER_ID;
  
  if (devUserId) {
    console.log('\n📤 Testing Message Sending...');
    
    try {
      const testMessage = {
        to: devUserId,
        messages: [{
          type: 'text',
          text: `🧪 Bot Health Check - ${new Date().toLocaleString('th-TH')}\n\n✅ All systems operational!`
        }]
      };
      
      const sendResponse = await makeRequest('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${channelAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testMessage)
      });
      
      if (sendResponse.statusCode === 200) {
        console.log('✅ Test message sent successfully');
        console.log('📱 Check your LINE app for the test message');
      } else {
        console.log(`❌ Message sending failed: ${sendResponse.statusCode}`);
        console.log(`📄 Response: ${JSON.stringify(sendResponse.data, null, 2)}`);
      }
    } catch (error) {
      console.log(`❌ Message sending error: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  DEV_LINE_USER_ID not set - skipping message test');
  }
  
  console.log('\n📊 LINE Bot Health Summary:');
  console.log('✅ Configuration: Valid');
  console.log('✅ API Connection: Working');
  console.log('✅ Bot Information: Retrieved');
  console.log('🤖 LINE Bot is ready for use!');
  
  return true;
}

// Run the check
checkLineBot().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
