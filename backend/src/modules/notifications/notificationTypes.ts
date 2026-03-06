/**
 * Notification Module Types
 */

export interface Notification {
  id?: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: Date;
}
