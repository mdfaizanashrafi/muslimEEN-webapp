export interface Connection {
  id: string;
  name: string;
  title: string;
  trustScore: number;
  verified: boolean;
  mutualConnections: number;
  badges: string[];
}
