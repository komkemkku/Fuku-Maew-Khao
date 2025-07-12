// 🧪 ฟังก์ชันสำหรับทดสอบ LINE Bot ในโหมด development

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function testLineBot() {
  const testCases = [
    {
      name: 'บันทึกรายจ่าย - รูปแบบ 1',
      message: '50 ค่ากาแฟ',
      expected: 'บันทึกรายจ่าย 50 บาท หมวดหมู่ อาหาร/เครื่องดื่ม'
    },
    {
      name: 'บันทึกรายจ่าย - รูปแบบ 2', 
      message: 'ค่าน้ำมัน 500 บาท',
      expected: 'บันทึกรายจ่าย 500 บาท หมวดหมู่ การเดินทาง'
    },
    {
      name: 'ดูสรุป',
      message: 'สรุป',
      expected: 'แสดงสถิติรายเดือน'
    },
    {
      name: 'ช่วยเหลือ',
      message: 'ช่วยเหลือ',
      expected: 'แสดงวิธีใช้งาน'
    }
  ];

  console.log('🧪 เริ่มทดสอบ LINE Bot...\n');

  for (const testCase of testCases) {
    console.log(`📝 ${testCase.name}`);
    console.log(`   ข้อความ: "${testCase.message}"`);
    
    try {
      // สร้าง mock request
      const mockBody = {
        events: [{
          type: 'message',
          message: {
            type: 'text',
            text: testCase.message
          },
          source: {
            type: 'user',
            userId: 'test-user-123'
          },
          replyToken: 'test-reply-token'
        }]
      };

      // เรียก webhook ผ่าน curl
      const curlCommand = `curl -s -X POST http://localhost:3002/api/webhook \\
        -H "Content-Type: application/json" \\
        -H "x-line-signature: test-signature" \\
        -w "%{http_code}" \\
        -d '${JSON.stringify(mockBody).replace(/'/g, "'\\''")}' 2>/dev/null`;

      const { stdout, stderr } = await execAsync(curlCommand);
      
      // ดึง status code จาก curl response
      const statusCode = stdout.slice(-3);
      
      if (statusCode === '200') {
        console.log(`   ✅ ส่งข้อความสำเร็จ (Status: ${statusCode})`);
      } else {
        console.log(`   ❌ เกิดข้อผิดพลาด (Status: ${statusCode})`);
        if (stderr) console.log(`   Error details: ${stderr}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
    
    console.log(`   🎯 คาดหวัง: ${testCase.expected}\n`);
  }

  console.log('🎉 ทดสอบเสร็จสิ้น!');
}

// เรียกใช้ทดสอบถ้ารันไฟล์นี้โดยตรง
if (require.main === module) {
  testLineBot().catch(console.error);
}

module.exports = { testLineBot };
