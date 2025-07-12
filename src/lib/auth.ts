interface User {
  id: string;
  lineUserId: string;
  name: string;
  email?: string;
  pictureUrl?: string;
  subscription?: string;
}

// LINE authentication service
export class AuthService {
  private static readonly STORAGE_KEY = 'fuku_neko_user';
  
  // Demo users for development (fallback)
  private static readonly DEMO_USERS: User[] = [
    {
      id: 'demo_user_123',
      lineUserId: 'demo_user_123',
      name: 'สมชาย แมวน้อย',
      email: 'somchai@example.com'
    },
    {
      id: 'demo_user_456', 
      lineUserId: 'demo_user_456',
      name: 'สมหญิง ฟูกุ',
      email: 'somying@example.com'
    },
    {
      id: 'demo_user_789',
      lineUserId: 'demo_user_789',
      name: 'วิไล นางแมว',
      email: 'wilai@example.com'
    }
  ];

  // Initialize LINE LIFF
  static async initializeLiff(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    try {
      const liff = (window as any).liff; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!liff) {
        console.warn('LINE LIFF not available, using demo mode');
        return false;
      }

      await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID });
      return liff.isLoggedIn();
    } catch (error) {
      console.error('LIFF initialization failed:', error);
      return false;
    }
  }

  // Login with LINE
  static async loginWithLine(): Promise<User | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const liff = (window as any).liff; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!liff) {
        console.warn('LINE LIFF not available');
        return null;
      }

      if (!liff.isLoggedIn()) {
        liff.login();
        return null;
      }

      // Get access token and verify with our API
      const accessToken = liff.getAccessToken();
      const response = await fetch('/api/line-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      });

      if (!response.ok) {
        throw new Error('LINE authentication failed');
      }

      const { user } = await response.json();
      this.setCurrentUser(user);
      return user;

    } catch (error) {
      console.error('LINE login error:', error);
      return null;
    }
  }

  // Get current user from localStorage or LINE
  static async getCurrentUser(): Promise<User | null> {
    if (typeof window === 'undefined') return null;
    
    // Try to get from localStorage first
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        // Verify user still exists in database
        const verifyResponse = await fetch(`/api/line-auth?lineUserId=${user.lineUserId}`);
        if (verifyResponse.ok) {
          return user;
        } else {
          // User not found, clear storage
          this.logout();
        }
      } catch (error) {
        console.error('Error verifying stored user:', error);
        this.logout();
      }
    }

    // Try LINE authentication
    const lineUser = await this.loginWithLine();
    if (lineUser) {
      return lineUser;
    }

    // Fallback to demo mode for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Using demo mode for development');
      const defaultUser = this.DEMO_USERS[0];
      this.setCurrentUser(defaultUser);
      return defaultUser;
    }

    return null;
  }

  // Set current user in localStorage
  static setCurrentUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  // Login with demo user (for development)
  static loginAsUser(userId: string): User | null {
    const user = this.DEMO_USERS.find(u => u.lineUserId === userId);
    if (user) {
      this.setCurrentUser(user);
      return user;
    }
    return null;
  }

  // Get all demo users (for development)
  static getDemoUsers(): User[] {
    return this.DEMO_USERS;
  }

  // Logout
  static async logout(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    // Clear localStorage
    localStorage.removeItem(this.STORAGE_KEY);
    
    // Logout from LINE if available
    try {
      const liff = (window as any).liff; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (liff && liff.isLoggedIn()) {
        liff.logout();
      }
    } catch {
      console.log('LINE logout not available');
    }
  }

  // Check if running in LINE environment
  static isInLineApp(): boolean {
    if (typeof window === 'undefined') return false;
    const liff = (window as any).liff; // eslint-disable-line @typescript-eslint/no-explicit-any
    return liff && liff.isInClient();
  }
}
