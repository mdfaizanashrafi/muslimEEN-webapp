/**
 * Connection Controller
 * HTTP request handling for network connections
 */

import { Request, Response, NextFunction } from 'express';
import { ConnectionService } from './connectionService';
import { ConnectionError } from './connectionTypes';

/**
 * Get current user's connections
 * GET /user/connections
 */
export const getCurrentUserConnections = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    const connections = await ConnectionService.getUserConnections(userId);
    
    res.json({
      success: true,
      data: connections,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending connection requests
 * GET /user/connections/pending
 */
export const getPendingConnections = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    const pending = await ConnectionService.getPendingRequests(userId);
    
    res.json({
      success: true,
      data: pending,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send connection request
 * POST /user/connections
 */
export const sendConnectionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requesterId = req.user!.id;
    const { recipientId } = req.body;
    
    await ConnectionService.sendRequest(requesterId, recipientId);
    
    res.status(201).json({
      success: true,
      message: 'Connection request sent',
    });
  } catch (error) {
    if (error instanceof ConnectionError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * Accept connection request
 * POST /user/connections/:connectionId/accept
 */
export const acceptConnectionRequest = async (
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
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * Reject connection request
 * POST /user/connections/:connectionId/reject
 */
export const rejectConnectionRequest = async (
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
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * Remove connection
 * DELETE /user/connections/:connectionId
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
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
};
