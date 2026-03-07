/**
 * Auth Service Tests Index
 * Barrel file to run all auth tests together
 */

// Import all auth test files to run them together
import './login.test';
import './register.test';
import './logout.test';
import './getCurrentUser.test';
import './validateInvitation.test';
import './errors.test';
import './formatters.test';

describe('AuthService - All Tests', () => {
  // This describe block serves as a container for all imported auth tests
  // Individual test files are imported above and will run as part of this suite
});
