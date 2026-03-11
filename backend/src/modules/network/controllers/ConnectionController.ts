/**
 * Connection Controller
 * Handles HTTP requests for network connections
 */

import { Request, Response, NextFunction } from 'express';
import * as ConnectionService from '../services/ConnectionService';
import { ConnectionError } from '../services/ConnectionService';
import { sendSuccess, sendError, sendValidationError } from '../../shared/utils/response';

/**
 * Get current user's connections
 */
export const getCurrentUserConnections = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const connections = await ConnectionService.getUserConnections(userId);

    sendSuccess(res, connections);
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending connection requests
 */
export const getCurrentUserPendingConnections = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const pending = await ConnectionService.getPendingRequests(userId);

    sendSuccess(res, pending);
  } catch (error) {
    next(error);
  }
};

/**
 * Send connection request
 */
export const sendConnectionRequestToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requesterId = req.user!.id;
    const { recipientId } = req.body;

    await ConnectionService.sendRequest(requesterId, recipientId);

    sendSuccess(res, null, 'Connection request sent', 201);
  } catch (error) {
    if (error instanceof ConnectionError) {
      sendError(res, error.code, error.message, error.statusCode);
      return;
    }
    next(error);
  }
};

/**
 * Update connection status (RESTful PATCH)
 * Handles both accept and reject
 */
export const updateConnectionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { connectionId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['accepted', 'rejected'].includes(status)) {
      sendValidationError(res, [
        'Status must be either "accepted" or "rejected"'
      ]);
      return;
    }

    if (status === 'accepted') {
      await ConnectionService.acceptRequest(connectionId, userId);
      sendSuccess(res, null, 'Connection accepted');
    } else {
      await ConnectionService.rejectRequest(connectionId, userId);
      sendSuccess(res, null, 'Connection rejected');
    }
  } catch (error) {
    if (error instanceof ConnectionError) {
      sendError(res, error.code, error.message, error.statusCode);
      return;
    }
    next(error);
  }
};

/**
 * Accept connection request (DEPRECATED - use updateConnectionStatus)
 */
export const acceptIncomingConnectionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recipientId = req.user!.id;
    const { connectionId } = req.params;

    await ConnectionService.acceptRequest(connectionId, recipientId);

    sendSuccess(res, null, 'Connection accepted');
  } catch (error) {
    if (error instanceof ConnectionError) {
      sendError(res, error.code, error.message, error.statusCode);
      return;
    }
    next(error);
  }
};

/**
 * Reject connection request (DEPRECATED - use updateConnectionStatus)
 */
export const rejectIncomingConnectionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recipientId = req.user!.id;
    const { connectionId } = req.params;

    await ConnectionService.rejectRequest(connectionId, recipientId);

    sendSuccess(res, null, 'Connection rejected');
  } catch (error) {
    if (error instanceof ConnectionError) {
      sendError(res, error.code, error.message, error.statusCode);
      return;
    }
    next(error);
  }
};

/**
 * Remove connection
 */
export const removeConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { connectionId } = req.params;

    await ConnectionService.removeConnection(connectionId, userId);

    sendSuccess(res, null, 'Connection removed');
  } catch (error) {
    if (error instanceof ConnectionError) {
      sendError(res, error.code, error.message, error.statusCode);
      return;
    }
    next(error);
  }
};
