'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileNavigation() {
  const pathname = usePathname();

  const navItems = [
    { name: 'ภาพรวม', href: '/dashboard', icon: 'chart-bar' },
    { name: 'หมวดหมู่', href: '/categories', icon: 'folder' },
    { name: 'ประวัติ', href: '/transactions', icon: 'clipboard' },
    { name: 'ตั้งค่า', href: '/settings', icon: 'cog' },
  ];

  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.JSX.Element } = {
      'chart-bar': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      'folder': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      'clipboard': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      'gem': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      'cog': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    };
    return iconMap[iconName] || iconMap['chart-bar'];
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex bg-white shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Fuku Neko
            </Link>
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Header - Simple */}
      <div className="lg:hidden bg-white shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-center px-4 h-16">
          <div className="flex items-center">
            <div className="text-xl mr-2">🐱</div>
            <Link href="/" className="text-xl font-bold text-blue-600">
              Fuku Neko
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile - Centered */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="flex justify-center">
          <div className="grid grid-cols-4 max-w-md w-full h-16">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center text-xs font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <span className="mb-1">{getIcon(item.icon)}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Spacer for bottom navigation */}
      <div className="lg:hidden h-16"></div>
    </>
  );
}
