import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <span className="text-8xl">😿</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          หน้าที่คุณค้นหาไม่พบ
        </h1>
        <p className="text-gray-600 mb-8">
          ฟูกุขออภัยด้วยนะ! หน้าที่คุณตามหาอาจถูกย้ายหรือไม่มีอยู่จริง
        </p>
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🏠 กลับไปหน้าแรก
          </Link>
          <br />
          <Link 
            href="/dashboard"
            className="inline-block bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
          >
            📊 ไป Dashboard
          </Link>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <p>💡 ลองเช็คที่ LINE Bot ของเราดูนะ!</p>
        </div>
      </div>
    </div>
  )
}
