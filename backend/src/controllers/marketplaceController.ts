/**
 * Marketplace Controller
 * Handles marketplace items for all verticals (work, earn, build, protect)
 */

import { Request, Response, NextFunction } from 'express';
import Marketplace from '../models/Marketplace';


export const getItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { vertical } = req.params;
    const items = await Marketplace.getByVertical(vertical, req.query);
    res.json({ success: true, items });
  } catch (error) { next(error); }
};

export const getItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const item = await Marketplace.getById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } });
      return;
    }
    res.json({ success: true, item });
  } catch (error) { next(error); }
};

export const createItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { vertical } = req.params;
    const item = await Marketplace.create(vertical, {
      ...req.body,
      providerId: req.user!.id
    });
    res.status(201).json({ success: true, item });
  } catch (error) { next(error); }
};

export const updateItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const item = await Marketplace.update(req.params.id, req.body);
    res.json({ success: true, item });
  } catch (error) { next(error); }
};

export const deleteItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await Marketplace.delete(req.params.id);
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) { next(error); }
};

export const invest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount } = req.body;
    const item = await Marketplace.incrementRaised(req.params.id, amount);
    res.json({ success: true, item, message: 'Investment recorded' });
  } catch (error) { next(error); }
};
