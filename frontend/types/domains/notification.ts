export interface Notification {
  id: string;
  type: 'connection_request' | 'endorsement' | 'trust_score' | 'message' | 'verification';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    trustScore: number;
  };
}
