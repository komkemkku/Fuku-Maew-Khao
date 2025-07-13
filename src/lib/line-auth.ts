import { cookies } from 'next/headers';

export async function getLineUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('line_user_id')?.value || null;
}

export async function requireLineAuth(): Promise<string> {
  const lineUserId = await getLineUserId();
  
  if (!lineUserId) {
    throw new Error('ไม่พบการยืนยันตัวตนจาก LINE Bot');
  }
  
  return lineUserId;
}
