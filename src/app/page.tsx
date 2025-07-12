import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - สีฟ้าเป็นหลัก */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400 rounded-full"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-blue-300 rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-blue-200 rounded-full"></div>
        </div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center mb-12 sm:mb-16">
            <div className="mb-6">
              <span className="text-6xl sm:text-8xl">🐱</span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-blue-900 mb-6 leading-tight">
              ฟูกุแมวขาว
            </h1>
            <p className="text-xl sm:text-2xl text-blue-700 mb-8 max-w-3xl mx-auto">
              แอปจัดการเงินส่วนตัวที่น่ารักที่สุด พร้อมแมวน้อยช่วยดูแลการเงินของคุณ 💕
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                เริ่มใช้งานฟรี 🐾
              </Link>
              <button className="px-8 py-4 border-2 border-blue-300 text-blue-600 rounded-full text-lg font-semibold hover:bg-blue-50 transition-all duration-300 hover:scale-105">
                ดูตัวอย่าง 👀
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - สีขาวเป็นหลัก */}
      <div className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              ทำไมต้อง <span className="text-blue-600">ฟูกุแมวขาว</span>?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              เพราะเราเข้าใจว่าการจัดการเงินควรจะง่ายและสนุก เหมือนเล่นกับแมวน้อย
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - สีฟ้า */}
            <div className="group bg-blue-50 border border-blue-100 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">ติดตามรายรับ-รายจ่าย</h3>
                <p className="text-blue-700">
                  บันทึกเงินเข้า-ออกแบบอัตโนมัติ พร้อมแมวน้อยคอยเตือนเมื่อจ่ายเกิน
                </p>
              </div>
            </div>

            {/* Feature 2 - สีขาว */}
            <div className="group bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">รายงานสวยๆ</h3>
                <p className="text-gray-600">
                  ดูสถิติการเงินแบบกราฟสีสวย เข้าใจง่าย พร้อมคำแนะนำจากแมวที่ปรึกษา
                </p>
              </div>
            </div>

            {/* Feature 3 - สีชมพู */}
            <div className="group bg-pink-50 border border-pink-100 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-pink-900 mb-2">ตั้งเป้าหมาย</h3>
                <p className="text-pink-700">
                  กำหนดเป้าการออม แมวน้อยจะคอยเชียร์และให้กำลังใจตลอดการเดินทาง
                </p>
              </div>
            </div>

            {/* Feature 4 - สีฟ้า */}
            <div className="group bg-blue-50 border border-blue-100 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">ปลอดภัย 100%</h3>
                <p className="text-blue-700">
                  ข้อมูลการเงินของคุณปลอดภัยเหมือนแมวที่หลับในกล่องที่แข็งแรงที่สุด
                </p>
              </div>
            </div>

            {/* Feature 5 - สีชมพู */}
            <div className="group bg-pink-50 border border-pink-100 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">💬</span>
                </div>
                <h3 className="text-xl font-bold text-pink-900 mb-2">LINE Bot</h3>
                <p className="text-pink-700">
                  บันทึกรายจ่ายผ่าน LINE ได้เลย แค่พิมพ์ &ldquo;กินข้าว 50 บาท&rdquo; แมวก็เข้าใจ
                </p>
              </div>
            </div>

            {/* Feature 6 - สีขาว */}
            <div className="group bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🎨</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">UI น่ารัก</h3>
                <p className="text-gray-600">
                  ออกแบบมาให้ใช้งานสนุก ดูแล้วอยากจัดการเงินทุกวัน เหมือนเล่นเกม
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section - สีชมพูเป็นหลัก */}
      <div className="py-16 sm:py-20 bg-gradient-to-br from-pink-50 to-pink-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pink-900 mb-4">
              แผนการใช้งาน
            </h2>
            <p className="text-lg sm:text-xl text-pink-700 max-w-2xl mx-auto">
              เลือกแผนที่เหมาะกับคุณ เริ่มฟรีได้เลย ไม่มีเงื่อนไขซ่อนเร้น
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan - สีขาว */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">🐱</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">แมวน้อย</h3>
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  ฟรี
                  <span className="text-sm text-gray-500 font-normal">/เดือน</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3">✓</span>
                  บันทึกรายรับ-รายจ่าย
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3">✓</span>
                  รายงานพื้นฐาน
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3">✓</span>
                  เป้าหมายการออม 3 รายการ
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3">✓</span>
                  LINE Bot
                </li>
              </ul>
              <button className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300">
                ใช้งานฟรี
              </button>
            </div>

            {/* Pro Plan - สีชมพู (แนะนำ) */}
            <div className="bg-pink-500 border border-pink-600 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                แนะนำ
              </div>
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">🐾</div>
                <h3 className="text-2xl font-bold text-white mb-2">แมวโปร</h3>
                <div className="text-3xl font-bold text-white mb-4">
                  ฿99
                  <span className="text-sm text-pink-100 font-normal">/เดือน</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-white">
                  <span className="text-yellow-300 mr-3">✓</span>
                  ทุกอย่างในแผนฟรี
                </li>
                <li className="flex items-center text-white">
                  <span className="text-yellow-300 mr-3">✓</span>
                  รายงานแบบละเอียด
                </li>
                <li className="flex items-center text-white">
                  <span className="text-yellow-300 mr-3">✓</span>
                  เป้าหมายไม่จำกัด
                </li>
                <li className="flex items-center text-white">
                  <span className="text-yellow-300 mr-3">✓</span>
                  แจ้งเตือนอัจฉริยะ
                </li>
                <li className="flex items-center text-white">
                  <span className="text-yellow-300 mr-3">✓</span>
                  ส่งออกข้อมูล
                </li>
              </ul>
              <button className="w-full py-3 bg-white text-pink-600 rounded-full font-semibold hover:bg-pink-50 transition-all duration-300">
                อัปเกรดเลย
              </button>
            </div>

            {/* Premium Plan - สีฟ้า */}
            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-8">
                <div className="text-4xl mb-4">👑</div>
                <h3 className="text-2xl font-bold text-blue-900 mb-2">แมวราชา</h3>
                <div className="text-3xl font-bold text-blue-900 mb-4">
                  ฿199
                  <span className="text-sm text-blue-600 font-normal">/เดือน</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-blue-700">
                  <span className="text-green-500 mr-3">✓</span>
                  ทุกอย่างในแผนโปร
                </li>
                <li className="flex items-center text-blue-700">
                  <span className="text-green-500 mr-3">✓</span>
                  AI วิเคราะห์การเงิน
                </li>
                <li className="flex items-center text-blue-700">
                  <span className="text-green-500 mr-3">✓</span>
                  คำแนะนำส่วนบุคคล
                </li>
                <li className="flex items-center text-blue-700">
                  <span className="text-green-500 mr-3">✓</span>
                  สนับสนุนลำดับความสำคัญ
                </li>
                <li className="flex items-center text-blue-700">
                  <span className="text-green-500 mr-3">✓</span>
                  ปรึกษาผู้เชี่ยวชาญ
                </li>
              </ul>
              <button className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all duration-300">
                เป็นราชาเลย
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section - สีฟ้าเป็นหลัก */}
      <div className="py-16 sm:py-20 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full"></div>
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              พร้อมที่จะมีแมวช่วยจัดการเงินแล้วหรือยัง? 🐱💕
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              เริ่มต้นการเดินทางสู่เสรีภาพทางการเงินกับแมวน้อยที่น่ารักที่สุด
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:bg-blue-50"
              >
                เริ่มใช้งานฟรี ตอนนี้เลย! 🚀
              </Link>
              <button className="px-8 py-4 border-2 border-white text-white rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300">
                ดูวิธีใช้งาน 📖
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - สีขาวเป็นหลัก */}
      <footer className="bg-white border-t border-gray-200 text-gray-600 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">เกี่ยวกับเรา</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-blue-600 transition-colors">เรื่องราวของเรา</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">ทีมงาน</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">ติดต่อเรา</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">ผลิตภัณฑ์</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-pink-600 transition-colors">คุณสมบัติ</a></li>
                <li><a href="#" className="hover:text-pink-600 transition-colors">ราคา</a></li>
                <li><a href="#" className="hover:text-pink-600 transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">สนับสนุน</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-blue-600 transition-colors">ศูนย์ช่วยเหลือ</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">คำถามที่พบบ่อย</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">รายงานปัญหา</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold mb-4">ติดตาม</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-pink-600 transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-pink-600 transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-pink-600 transition-colors">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p>&copy; 2024 ฟูกุแมวขาว. สงวนลิขสิทธิ์ทุกประการ. Made with 💕 for cat lovers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
