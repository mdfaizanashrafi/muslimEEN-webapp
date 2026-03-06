/**
 * Connection Controller
 * Handles HTTP requests for network connections
 */

import { Request, Response, NextFunction } from 'express';
import * as ConnectionService from '../services/ConnectionService';
import { ConnectionError } from '../services/ConnectionService';

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

    res.json(connections);
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

    res.json(pending);
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

    res.json({
      success: true,
      message: 'Connection request sent',
    });
  } catch (error) {
    if (error instanceof ConnectionError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
};

/**
 * Accept connection request
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

    res.json({
      success: true,
      message: 'Connection accepted',
    });
  } catch (error) {
    if (error instanceof ConnectionError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
};

/**
 * Reject connection request
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

    res.json({
      success: true,
      message: 'Connection rejected',
    });
  } catch (error) {
    if (error instanceof ConnectionError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
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

    res.json({
      success: true,
      message: 'Connection removed',
    });
  } catch (error) {
    if (error instanceof ConnectionError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
};
