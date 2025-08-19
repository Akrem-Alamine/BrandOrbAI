import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Sign up a new user with email and password
   */
  static async signUp({ email, password, firstName, lastName }: SignUpData): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with name
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`,
      });

      // Send email verification
      await sendEmailVerification(userCredential.user);

      return userCredential;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account');
    }
  }

  /**
   * Sign in an existing user with email and password
   */
  static async signIn({ email, password }: SignInData): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  /**
   * Send email verification
   */
  static async sendVerificationEmail(user: User): Promise<void> {
    try {
      await sendEmailVerification(user);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send verification email');
    }
  }
}
