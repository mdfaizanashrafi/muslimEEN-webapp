/**
 * Verification Module Types
 * Interfaces for verification requests and responses
 */

export interface BiometricChallengeResponse {
  success: boolean;
  challenge: string;
  message: string;
}

export interface BiometricCompleteRequest {
  credential: string;
}

export interface BiometricCompleteResponse {
  success: boolean;
  message: string;
}

export interface WitnessVerificationRequest {
  witnessIds: string[];
}

export interface WitnessVerificationResponse {
  success: boolean;
  message: string;
}

export interface WitnessApproveRequest {
  userId: string;
}

export interface WitnessApproveResponse {
  success: boolean;
  message: string;
}

export interface BusinessVerificationRequest {
  documents: string[];
}

export interface BusinessVerificationResponse {
  success: boolean;
  message: string;
}

export interface BusinessApproveRequest {
  userId: string;
}

export interface BusinessApproveResponse {
  success: boolean;
  message: string;
}

export interface VerificationStatus {
  emailVerified: boolean;
  biometricVerified: boolean;
  twoWitnessVerified: boolean;
  businessVerified: boolean;
}

export interface VerificationStatusResponse {
  success: boolean;
  tier: string;
  badges: string[];
  progress: VerificationStatus;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// Database types
export interface WitnessRow {
  id: string;
  trust_score: number;
  verification_tier: string;
  is_witness_eligible: boolean;
}

export interface WitnessRequestRow {
  user_id: string;
  witness_id: string;
  status: 'pending' | 'approved' | 'rejected';
  witnessed_at?: Date;
}

export interface ApprovedCountRow {
  approved_count: string;
}
