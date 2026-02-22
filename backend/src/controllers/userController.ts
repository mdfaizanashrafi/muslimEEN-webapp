/**
 * User Controller
 * Handles user profile, connections, and notifications
 */

import { Response, NextFunction } from 'express';
import User from '../models/User';
import Connection from '../models/Connection';
import TrustScore from '../models/TrustScore';
import Notification from '../models/Notification';
import { AuthenticatedRequest } from '../types';

// Profile
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.getFullProfile(req.user!.id);
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.update(req.user!.id, req.body);
    await TrustScore.recalculate(req.user!.id);
    res.json({ success: true, user, message: 'Profile updated' });
  } catch (error) { next(error); }
};

// Trust Score
export const getTrustScore = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const trustScore = await TrustScore.recalculate(req.user!.id);
    res.json({ success: true, trustScore });
  } catch (error) { next(error); }
};

export const getTrustScoreHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const history = await User.getTrustScoreHistory(req.user!.id);
    res.json({ success: true, history });
  } catch (error) { next(error); }
};

// Connections
export const getConnections = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const connections = await Connection.getByUser(req.user!.id);
    res.json({ success: true, connections });
  } catch (error) { next(error); }
};

export const getPendingConnections = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pending = await Connection.getPendingRequests(req.user!.id);
    res.json({ success: true, pending });
  } catch (error) { next(error); }
};

export const sendConnectionRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { recipientId } = req.body;
    await Connection.create(req.user!.id, recipientId);
    res.json({ success: true, message: 'Connection request sent' });
  } catch (error) { next(error); }
};

export const acceptConnectionRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await Connection.accept(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Connection accepted' });
  } catch (error) { next(error); }
};

export const rejectConnectionRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await Connection.reject(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Connection rejected' });
  } catch (error) { next(error); }
};

// Notifications
export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notifications = await Notification.getByUser(req.user!.id);
    res.json({ success: true, notifications });
  } catch (error) { next(error); }
};

export const markNotificationRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await Notification.markAsRead(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) { next(error); }
};

export const markAllNotificationsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await Notification.markAllAsRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { next(error); }
};
