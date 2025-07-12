'use client';

import { useState } from 'react';
import Link from 'next/link';

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="sm:hidden p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
        aria-label="เปิดเมนู"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="fixed inset-0 bg-black opacity-50" onClick={closeMenu}></div>
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-lg transform transition-transform">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🐱</span>
                  <h1 className="text-lg font-bold text-gray-900">ฟูกุแมวขาว</h1>
                </div>
                <button
                  onClick={closeMenu}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <nav className="p-4">
              <div className="space-y-4">
                <Link
                  href="/dashboard"
                  onClick={closeMenu}
                  className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  📊 แดชบอร์ด
                </Link>
                
                <Link
                  href="/transactions"
                  onClick={closeMenu}
                  className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  📝 รายการทั้งหมด
                </Link>
                
                <Link
                  href="/categories"
                  onClick={closeMenu}
                  className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  📂 จัดการหมวดหมู่
                </Link>
                
                <Link
                  href="/budget"
                  onClick={closeMenu}
                  className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  🎯 ตั้งงบประมาณ
                </Link>
                
                <hr className="my-4" />
                
                <button
                  onClick={closeMenu}
                  className="block w-full text-left px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                  💎 อัปเกรด Premium
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
