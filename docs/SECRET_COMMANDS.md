# Secret Commands Documentation

ไฟล์นี้เป็นคู่มือการใช้งานคำสั่งลับ (Secret Commands) สำหรับ Fukuneko App

## ภาพรวม

ระบบคำสั่งลับถูกออกแบบมาเพื่อการทดสอบและ development โดยให้ผู้พัฒนาสามารถทดสอบฟีเจอร์ต่างๆ ได้อย่างรวดเร็ว

## การติดตั้งและใช้งาน

### 1. เพิ่ม Environment Variables

เพิ่มตัวแปรต่อไปนี้ใน `.env.local`:

```env
# LINE User ID ของ Developer (สำหรับคำสั่งที่ต้องการ auth)
DEV_LINE_USER_ID=your_line_user_id_here

# Access Key สำหรับ Demo Data API
DEV_ACCESS_KEY=your_secret_key_here
```

### 2. Import Secret Commands Service

ใน `line-service.ts` เพิ่ม import:

```typescript
import { SecretCommandsService } from './secret-commands';
```

### 3. เพิ่มการตรวจสอบคำสั่งลับใน processUserMessage

```typescript
// ตรวจสอบคำสั่งลับก่อน
if (SecretCommandsService.isSecretCommand(text)) {
  return await SecretCommandsService.processSecretCommand(text, userId);
}
```

## รายการคำสั่งลับ

### 🛠️ คำสั่งข้อมูลทดสอบ

#### `#demo-data` หรือ `#dev-create-demo-data`
- **หน้าที่**: สร้างข้อมูลทดสอบ (Demo transactions)
- **สิทธิ์**: ต้องการ Developer Auth
- **ตัวอย่างข้อมูล**:
  - รายจ่าย: ข้าวผัดกะเพรา (-350), กาแฟเย็น (-50), ค่า BTS (-1200)
  - รายรับ: เงินเดือน (+5000)
  - หมวดหมู่: อาหาร, เครื่องดื่ม, การเดินทาง, รายได้

#### `#clear-data` หรือ `#dev-clear-all-data`
- **หน้าที่**: ลบข้อมูลทั้งหมดของผู้ใช้
- **สิทธิ์**: ต้องการ Developer Auth
- **คำเตือน**: จะลบรายการทั้งหมด ใช้ด้วยความระมัดระวัง

### 🎯 คำสั่งทดสอบระบบ

#### `#test-welcome` หรือ `#dev-test-welcome`
- **หน้าที่**: ทดสอบข้อความต้อนรับผู้ใช้ใหม่
- **สิทธิ์**: ไม่ต้องการ Auth
- **ผลลัพธ์**: แสดงข้อความต้อนรับแบบสุ่ม

#### `#upgrade-premium` หรือ `#demo-premium`
- **หน้าที่**: อัปเกรดเป็น Premium (สำหรับทดสอบ)
- **สิทธิ์**: ไม่ต้องการ Auth
- **ระยะเวลา**: 12 เดือน

### 📊 คำสั่งตรวจสอบระบบ

#### `#status` หรือ `#system-status`
- **หน้าที่**: ดูสถานะระบบและข้อมูลผู้ใช้
- **สิทธิ์**: ต้องการ Developer Auth
- **ข้อมูลที่แสดง**:
  - User ID
  - Subscription Plan
  - จำนวน Transactions
  - จำนวน Categories
  - Environment Mode

#### `#help` หรือ `#dev-help`
- **หน้าที่**: ดูรายการคำสั่งลับทั้งหมด
- **สิทธิ์**: ไม่ต้องการ Auth

## การจัดการสิทธิ์

### Development Mode
- ในโหมด `NODE_ENV=development` ทุกคนสามารถใช้คำสั่งที่ต้องการ auth ได้

### Production Mode
- เฉพาะ User ID ที่อยู่ใน `DEV_LINE_USER_IDS` เท่านั้นที่สามารถใช้คำสั่งที่ต้องการ auth ได้

## การเพิ่มคำสั่งใหม่

### ตัวอย่างการเพิ่มคำสั่งกำหนดเอง:

```typescript
SecretCommandsService.addCustomCommand('CUSTOM_COMMAND', {
  commands: ['#custom', '#my-command'],
  description: 'คำอธิบายคำสั่ง',
  requiresAuth: true,
  handler: async (userId: string, params?: string[]) => {
    // ลอจิกของคำสั่ง
    return [{
      type: 'text',
      text: 'ผลลัพธ์ของคำสั่ง'
    }];
  }
});
```

## ความปลอดภัย

### Best Practices:
1. **อย่าแชร์ DEV_ACCESS_KEY**: เก็บเป็นความลับ
2. **จำกัดสิทธิ์**: เพิ่มเฉพาะ User ID ที่เชื่อถือได้
3. **ลบคำสั่งลับใน Production**: ถ้าไม่จำเป็น
4. **Monitor Usage**: ตรวจสอบการใช้งานคำสั่งลับ

### การปิดคำสั่งลับใน Production:

เพิ่มตัวแปรใน environment:
```env
DISABLE_SECRET_COMMANDS=true
```

แล้วเพิ่มการตรวจสอบใน code:
```typescript
if (process.env.DISABLE_SECRET_COMMANDS === 'true') {
  return null; // ไม่ประมวลผลคำสั่งลับ
}
```

## การ Debug

### การตรวจสอบ Log:
```typescript
console.log('Secret command executed:', {
  command: text,
  userId: userId,
  timestamp: new Date().toISOString()
});
```

### การตรวจสอบสิทธิ์:
```typescript
const isAuth = SecretCommandsService.isAuthorizedUser(userId);
console.log('User authorization status:', isAuth);
```

## FAQ

### Q: คำสั่งลับไม่ทำงาน?
A: ตรวจสอบ:
1. Environment variables ถูกต้องหรือไม่
2. User ID อยู่ใน authorized list หรือไม่ (สำหรับคำสั่งที่ต้องการ auth)
3. Database connection ปกติหรือไม่

### Q: จะเพิ่ม Developer User ID ใหม่ได้อย่างไร?
A: แก้ไข `DEV_LINE_USER_ID` ใน environment variables หรือเพิ่มใน `DEV_USER_IDS` array

### Q: คำสั่งใดต้องการ auth บ้าง?
A: คำสั่งที่มี `requiresAuth: true`:
- `#demo-data`
- `#clear-data` 
- `#status`

## ผู้ติดต่อ

หากมีปัญหาหรือข้อสงสัย ติดต่อทีมพัฒนา
