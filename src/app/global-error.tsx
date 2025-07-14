'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🙀</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">เกิดข้อผิดพลาด</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              ฟูกุเจออุปสรรคเล็กน้อย
            </h2>
            <p className="text-gray-600 mb-8 max-w-md">
              เกิดข้อผิดพลาดขึ้น กรุณาลองใหม่อีกครั้งหรือกลับหน้าแรก
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={reset}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🔄 ลองใหม่
              </button>
              <a
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🏠 กลับหน้าแรก
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
