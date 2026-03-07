/**
 * User Controller
 * HTTP request handling for user-related operations
 * Responsibilities: Extract HTTP data, delegate to services, format responses
 */

import { Request, Response, NextFunction } from 'express';
import * as UserService from '../services/UserService';
import * as TrustScoreService from '../services/TrustScoreService';
import * as ConnectionService from '../services/ConnectionService';
import * as NotificationService from '../services/NotificationService';
import logger from '../utils/logger';

// ============================================================================
// PROFILE
// ============================================================================

/**
 * Retrieve current user's complete profile
 * GET /user/profile
 */
export const retrieveCurrentUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const userProfile = await UserService.getProfile(authenticatedUserId);

    res.json(UserService.formatProfileResponse(userProfile));
  } catch (error) {
    next(error);
  }
};

/**
 * Modify current user's profile information
 * PUT /user/profile
 */
export const modifyCurrentUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const profileUpdateData = req.body;

    const updatedUserProfile = await UserService.updateProfile(authenticatedUserId, profileUpdateData);

    res.json({
      success: true,
      user: updatedUserProfile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// TRUST SCORE
// ============================================================================

/**
 * Retrieve current user's trust score with factors
 * GET /user/trust-score
 */
export const retrieveCurrentTrustScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const currentTrustScore = await TrustScoreService.getCurrentScore(authenticatedUserId);
    const trustScoreHistory = await TrustScoreService.getHistory(authenticatedUserId);

    res.json({
      success: true,
      score: currentTrustScore,
      history: trustScoreHistory.history.slice(0, 1)[0]?.factors || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger recalculation of trust score
 * POST /user/trust-score/recalculate
 */
export const triggerTrustScoreRecalculation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const recalculationOutcome = await TrustScoreService.recalculate(authenticatedUserId);

    res.json({
      success: true,
      score: recalculationOutcome.score,
      changed: recalculationOutcome.changed,
      witnessEligibilityChanged: recalculationOutcome.witnessEligibilityChanged,
      factors: recalculationOutcome.factors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve trust score change history
 * GET /user/trust-score/history
 */
export const retrieveTrustScoreHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const scoreHistory = await TrustScoreService.getHistory(authenticatedUserId);

    res.json(scoreHistory);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CONNECTIONS
// ============================================================================

/**
 * Retrieve authenticated user's network connections
 * GET /user/connections
 */
export const retrieveUserNetworkConnections = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const userNetworkConnections = await ConnectionService.getUserConnections(authenticatedUserId);

    res.json(userNetworkConnections);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve pending connection requests for user
 * GET /user/connections/pending
 */
export const retrievePendingConnectionRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const pendingConnectionRequests = await ConnectionService.getPendingRequests(authenticatedUserId);

    res.json(pendingConnectionRequests);
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate connection request to another user
 * POST /user/connections
 */
export const initiateConnectionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requesterUserId = req.user!.id;
    const targetRecipientId = req.body.recipientId;

    await ConnectionService.sendRequest(requesterUserId, targetRecipientId);

    res.json({
      success: true,
      message: 'Connection request sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept incoming connection request
 * POST /user/connections/:connectionId/accept
 */
export const acceptConnectionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recipientUserId = req.user!.id;
    const connectionRequestId = req.params.connectionId;

    await ConnectionService.acceptRequest(connectionRequestId, recipientUserId);

    res.json({
      success: true,
      message: 'Connection request accepted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Decline incoming connection request
 * POST /user/connections/:connectionId/reject
 */
export const declineConnectionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recipientUserId = req.user!.id;
    const connectionRequestId = req.params.connectionId;

    await ConnectionService.rejectRequest(connectionRequestId, recipientUserId);

    res.json({
      success: true,
      message: 'Connection request declined',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Retrieve user's notification inbox
 * GET /user/notifications
 */
export const retrieveUserNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const { unreadOnly, limit: queryLimit, offset: queryOffset } = req.query;

    const userNotificationInbox = await NotificationService.getUserNotifications(authenticatedUserId, {
      unreadOnly: unreadOnly === 'true',
      limit: queryLimit ? parseInt(queryLimit as string, 10) : undefined,
      offset: queryOffset ? parseInt(queryOffset as string, 10) : undefined,
    });

    res.json(userNotificationInbox);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark specific notification as read
 * PUT /user/notifications/:notificationId/read
 */
export const markSingleNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;
    const notificationId = req.params.notificationId;

    await NotificationService.markAsRead(notificationId, authenticatedUserId);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all user's notifications as read
 * PUT /user/notifications/read-all
 */
export const markAllUserNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authenticatedUserId = req.user!.id;

    await NotificationService.markAllAsReadForUser(authenticatedUserId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};
