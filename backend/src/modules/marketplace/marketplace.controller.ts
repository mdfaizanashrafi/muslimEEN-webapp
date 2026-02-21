/**
 * Marketplace Controller
 * Handles EARN, BUILD, LIVE, PROTECT verticals
 */

import { Request, Response, NextFunction } from 'express';
import { MarketplaceItem, MarketplaceFilter, Vertical } from './marketplace.types';
import * as marketplaceService from './marketplace.service';
import logger from '../../utils/logger';
import db from '../../config/database';

/**
 * Get marketplace items by vertical
 * GET /api/marketplace/:vertical
 */
export async function getItems(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { vertical } = req.params;
    const filters = req.query as unknown as MarketplaceFilter;

    // Validate vertical
    if (!marketplaceService.isValidVertical(vertical)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_VERTICAL',
          message: 'Invalid marketplace vertical'
        }
      });
      return;
    }

    const { query, params } = marketplaceService.buildFilterQuery(filters);
    
    // Execute query with vertical as first param
    const result = await db.query(query, [vertical, ...params.slice(0, -2)]);
    
    const items = result.rows.map(row => marketplaceService.formatItem(row));

    res.json({
      success: true,
      items,
      vertical,
      filters
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single marketplace item
 * GET /api/marketplace/:vertical/:id
 */
export async function getItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const query = marketplaceService.buildGetByIdQuery();
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Item not found'
        }
      });
      return;
    }

    const item = marketplaceService.formatItem(result.rows[0]);

    res.json({
      success: true,
      item
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create marketplace item
 * POST /api/marketplace/:vertical
 */
export async function createItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { vertical } = req.params;
    const itemData = req.body;

    // Validate vertical
    if (!marketplaceService.isValidVertical(vertical)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_VERTICAL',
          message: 'Invalid marketplace vertical'
        }
      });
      return;
    }

    // Set provider
    itemData.providerId = (req as Request & { user: { id: string } }).user.id;

    const { query, params } = marketplaceService.buildCreateQuery(vertical as Vertical, itemData);
    const result = await db.query(query, params);
    const item = marketplaceService.formatItem(result.rows[0]);

    logger.info(`Marketplace item created: ${item?.id} by ${(req as Request & { user: { id: string } }).user.id}`);

    res.status(201).json({
      success: true,
      item,
      message: 'Item created successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update marketplace item
 * PUT /api/marketplace/:vertical/:id
 */
export async function updateItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get existing item
    const getQuery = marketplaceService.buildGetByIdQuery();
    const existingResult = await db.query(getQuery, [id]);

    if (existingResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Item not found'
        }
      });
      return;
    }

    const existing = marketplaceService.formatItem(existingResult.rows[0]);

    // Check ownership
    if (existing?.provider.id !== (req as Request & { user: { id: string } }).user.id) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own items'
        }
      });
      return;
    }

    const updateQueryResult = marketplaceService.buildUpdateQuery(id, updates);

    if (!updateQueryResult) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_VALID_FIELDS',
          message: 'No valid fields to update'
        }
      });
      return;
    }

    const { query, params } = updateQueryResult;
    const result = await db.query(query, params);
    const item = marketplaceService.formatItem(result.rows[0]);

    logger.info(`Marketplace item updated: ${id} by ${(req as Request & { user: { id: string } }).user.id}`);

    res.json({
      success: true,
      item,
      message: 'Item updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete marketplace item
 * DELETE /api/marketplace/:vertical/:id
 */
export async function deleteItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Get existing item
    const getQuery = marketplaceService.buildGetByIdQuery();
    const existingResult = await db.query(getQuery, [id]);

    if (existingResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Item not found'
        }
      });
      return;
    }

    const existing = marketplaceService.formatItem(existingResult.rows[0]);

    // Check ownership
    if (existing?.provider.id !== (req as Request & { user: { id: string } }).user.id) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own items'
        }
      });
      return;
    }

    const query = marketplaceService.buildDeleteQuery();
    await db.query(query, [id]);

    logger.info(`Marketplace item deleted: ${id} by ${(req as Request & { user: { id: string } }).user.id}`);

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Invest in BUILD item
 * POST /api/marketplace/build/:id/invest
 */
export async function invest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const getQuery = marketplaceService.buildGetByIdQuery();
    const result = await db.query(getQuery, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Item not found'
        }
      });
      return;
    }

    const item = marketplaceService.formatItem(result.rows[0]);

    if (item?.vertical !== 'build') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OPERATION',
          message: 'Investment only available for BUILD items'
        }
      });
      return;
    }

    // Check if fully funded
    const validation = marketplaceService.validateInvestment(
      item.raised || 0,
      item.seeking || 0,
      amount
    );

    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error
      });
      return;
    }

    const updateQuery = marketplaceService.buildIncrementRaisedQuery();
    const updateResult = await db.query(updateQuery, [id, amount]);
    const updated = marketplaceService.formatItem(updateResult.rows[0]);

    logger.info(`Investment made: ${amount} in ${id} by ${(req as Request & { user: { id: string } }).user.id}`);

    res.json({
      success: true,
      item: updated,
      message: 'Investment recorded'
    });
  } catch (error) {
    next(error);
  }
}
