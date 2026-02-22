/**
 * Invitation Controller
 * Handles invitation creation and management
 */

import { Response, NextFunction } from 'express';
import Invitation from '../models/Invitation';
import { AuthenticatedRequest } from '../types';

export const getInvitations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const invitations = await Invitation.getByInviter(req.user!.id);
    res.json({ success: true, invitations });
  } catch (error) { next(error); }
};

export const createInvitation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const invitation = await Invitation.create(req.user!.id, req.body.email);
    res.status(201).json({ success: true, invitation });
  } catch (error) { next(error); }
};

export const revokeInvitation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await Invitation.revoke(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Invitation revoked' });
  } catch (error) { next(error); }
};

export const getRemainingCount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const count = await Invitation.countPendingByInviter(req.user!.id);
    res.json({ success: true, remaining: count });
  } catch (error) { next(error); }
};

export const validateInvitation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await Invitation.validate(req.params.code);
    res.json({ success: result.valid, ...result });
  } catch (error) { next(error); }
};
