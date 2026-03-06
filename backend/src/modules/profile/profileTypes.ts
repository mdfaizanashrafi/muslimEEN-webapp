/**
 * Profile Module Types
 */

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio?: string;
  location?: string;
  industry?: string;
  skills: string[];
  endorsements: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ProfileUpdateInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  industry?: string;
  skills?: string[];
}

export class ProfileError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ProfileError';
  }
}
