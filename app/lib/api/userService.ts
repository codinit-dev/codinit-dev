interface UserRegistrationData {
  id?: string;
  fullName: string;
  email: string;
  appVersion: string;
  platform: string;
  emailOptIn: boolean;
}

interface RegistrationResponse {
  success: boolean;
  type?: 'registration' | 'signin' | 'verification_resent';
  userId?: string;
  error?: string;
  message?: string;
}

interface EmailVerificationRequest {
  token: string;
}

interface EmailVerificationResponse {
  success: boolean;
  userId?: string;
  error?: string;
  message?: string;
}

class UserService {
  private _baseUrl = '/api/v1';

  async registerUser(userData: UserRegistrationData): Promise<RegistrationResponse> {
    try {
      const response = await fetch(`${this._baseUrl}/register-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = (await response.json()) as RegistrationResponse;

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error('Registration API error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async verifyEmail(token: string): Promise<EmailVerificationResponse> {
    try {
      const response = await fetch(`${this._baseUrl}/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = (await response.json()) as EmailVerificationResponse;

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error('Email verification API error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async updateUser(userId: string, updates: Partial<UserRegistrationData>): Promise<RegistrationResponse> {
    try {
      const response = await fetch(`${this._baseUrl}/update-user`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, ...updates }),
      });

      const data = (await response.json()) as RegistrationResponse;

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error('Update user API error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }
}

export const userService = new UserService();
export type { UserRegistrationData, RegistrationResponse, EmailVerificationRequest, EmailVerificationResponse };
