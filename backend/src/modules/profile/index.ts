/**
 * Profile Module
 * 
 * Responsibilities:
 * - Profile data management (bio, location, skills, industry)
 * - Profile visibility settings
 * - Skill endorsements
 */

// Controllers
export * as ProfileController from './controllers/ProfileController';

// Services
export * as ProfileService from './services/ProfileService';

// Repositories
export * as ProfileRepository from './repositories/ProfileRepository';

// Types
export { ProfileError, ProfileUpdateInput, UserProfile } from './services/ProfileService';
