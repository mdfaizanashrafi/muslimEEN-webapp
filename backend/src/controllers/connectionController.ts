/**
 * Connection Controller
 * HTTP request handling for user connection operations
 * Responsibilities: Extract HTTP data, delegate to ConnectionService, format responses
 */

import { Request, Response, NextFunction } from 'express';
import * as ConnectionService from '../services/ConnectionService';
import logger from '../utils/logger';

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
