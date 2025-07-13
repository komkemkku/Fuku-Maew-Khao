export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🐱</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          หน้าที่คุณหาไม่พบ
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          ฟูกุไม่พบหน้าที่คุณต้องการ อาจจะถูกย้ายไปที่อื่นแล้วหรือไม่มีอยู่จริง
        </p>
        <a
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          🏠 กลับหน้าแรก
        </a>
      </div>
    </div>
  );
}
