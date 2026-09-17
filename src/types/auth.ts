import { revokeSession } from '../api/client';
import type { User } from "./user";

// =========================================================
// AUTH RESPONSE
// =========================================================

export interface AuthResponse {
  user: User;
}

// =========================================================
// LOGIN CREDENTIALS
// =========================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

// =========================================================
// SIGNUP PAYLOAD
// =========================================================

export interface SignupPayload {
  phone: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  termsVersion: string;
}

// =========================================================
// STORAGE KEYS
// =========================================================

export const STORAGE_KEY =
  import.meta.env.VITE_STORAGE_KEY || "aisha_user";

const LEGACY_STORAGE_KEY =
  "2HNC6JYg8wqRO6yNP1D8T1nFGmpTptgx";

// =========================================================
// GET CURRENT USER
// =========================================================

export const getCurrentUser = (): User | null => {
  try {
    // Check current storage first
    const storedUser = localStorage.getItem(STORAGE_KEY);

    if (storedUser) {
      return JSON.parse(storedUser) as User;
    }

    // Check legacy storage
    const legacyUser =
      localStorage.getItem(LEGACY_STORAGE_KEY);

    if (legacyUser) {
      const user = JSON.parse(legacyUser) as User;

      // Migrate legacy user to current storage
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(user)
      );

      return user;
    }

    return null;
  } catch (error) {
    console.error(
      "Failed to get current user:",
      error
    );

    return null;
  }
};

// =========================================================
// SAVE CURRENT USER
// =========================================================

export const saveCurrentUser = (
  user: User
): void => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(user)
    );

    // Keep legacy storage synchronized as well.
    // This prevents older parts of the application
    // from losing the current user data.
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify(user)
    );

    // Tell Navbar and other components that
    // the current user has been updated.
    window.dispatchEvent(
      new Event("user-updated")
    );
  } catch (error) {
    console.error(
      "Failed to save current user:",
      error
    );
  }
};

// =========================================================
// CLEAR CURRENT USER
// =========================================================

export const clearCurrentUser = (): void => {
  revokeSession();
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);

    // Tell components that the user has logged out.
    window.dispatchEvent(
      new Event("user-updated")
    );
  } catch (error) {
    console.error(
      "Failed to clear current user:",
      error
    );
  }
};
