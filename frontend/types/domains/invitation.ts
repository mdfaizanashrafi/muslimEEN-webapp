export interface Invitation {
  id: string;
  code: string;
  inviterId: string | null;
  inviter: { email: string; name: string } | null;
  inviteeEmail: string;
  inviteeId: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}
