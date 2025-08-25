// const API_BASE_URL = 'http://127.0.0.1:5000';
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ai-crm2-backend2.onrender.com'
  : 'http://127.0.0.1:5000';
interface LoginRequest {
  email: string;
  password: string;
}

interface TenantProfile {
  tenant_id: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
  last_login?: string;
}
interface RegisterRequest {
  email: string;
  password: string;
  tenant_name?: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface User {
  id: string;
  email: string;
  tenant_id: string;
  created_at?: string;
  status?: string;
  role?: 'admin' | 'tenant';  // ADD THIS LINE
}

interface LoginResponse {
  token: string;
  user: User;
}

class ApiClient {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || data.detail || response.statusText || 'Invalid credentials',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  public getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try localStorage first, fallback to cookie
  return localStorage.getItem('auth_token') || 
         document.cookie.split(';')
           .find(cookie => cookie.trim().startsWith('auth_token='))
           ?.split('=')[1] || null;
}

  private setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  // Decode JWT to get user data
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Store in localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_id', payload.user_id);
    localStorage.setItem('tenant_id', payload.tenant_id);
    
    // Also keep cookie for compatibility
    document.cookie = `auth_token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=strict`;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
  }
}


  private clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  
  // Clear localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('tenant_id');
  
  // Clear cookie
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
    }

    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse> {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse> {
    return this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse> {
    return this.makeRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async googleAuth(credential: string): Promise<ApiResponse<LoginResponse>> {
  const response = await this.makeRequest<LoginResponse>('/auth/google-auth', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });

  if (response.success && response.data?.token) {
    this.setAuthToken(response.data.token);
  }

  return response;
}

  // async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
  //   const token = this.getAuthToken();
    
  //   if (!token) {
  //     return {
  //       success: false,
  //       error: 'No authentication token found',
  //     };
  //   }

  //   return this.makeRequest<{ user: User }>('/auth/me', {
  //     method: 'GET',
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });
  // }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
  const token = this.getAuthToken();
  
  if (!token) {
    return {
      success: false,
      error: 'No authentication token found',
    };
  }

  try {
    // Decode token to check type
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check if it's a tenant token
    if (payload.type === 'tenant_access') {
      // Use tenant endpoint
      const response = await this.makeRequest<{ tenant: TenantProfile }>('/api/tenant-auth/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.success && response.data?.tenant) {
        // Transform tenant data to match User interface
        const tenantData = response.data.tenant;
        return {
          success: true,
          data: {
            user: {
              id: tenantData.tenant_id,
              email: tenantData.email,
              tenant_id: tenantData.tenant_id,
              status: tenantData.status,
              created_at: tenantData.created_at,
              role: 'tenant'  // ADD THIS LINE
            }
          }
        };
      }
      
      return { success: false, error: 'Failed to get tenant profile' };
    } else {
      // Regular admin token - use existing endpoint
      return this.makeRequest<{ user: User }>('/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to decode token',
    };
  }
}
  async validateToken(): Promise<ApiResponse<{ valid: boolean; user_id?: string; tenant_id?: string }>> {
    const token = this.getAuthToken();
    
    if (!token) {
      return {
        success: false,
        error: 'No token found',
      };
    }

    return this.makeRequest('/auth/validate-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  logout(): void {
    this.clearAuthToken();
  }

  isAuthenticated(): boolean {
    return this.getAuthToken() !== null;
  }
}

export const apiClient = new ApiClient();
export type { User, LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest };