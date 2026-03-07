/**
 * Verification Service
 * Orchestrates user verification workflows
 * Coordinates biometric, witness, and business verification
 * 
 * This file now serves as a barrel export for backward compatibility.
 * Each verification type has been split into its own service file following SRP.
 */

// Barrel exports for backward compatibility
export * from './BiometricVerificationService';
export * from './WitnessVerificationService';
export * from './BusinessVerificationService';
export * from './VerificationError';
