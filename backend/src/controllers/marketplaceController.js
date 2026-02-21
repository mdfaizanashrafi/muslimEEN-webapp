/**
 * Marketplace Controller
 * Handles EARN, BUILD, LIVE, PROTECT verticals
 */

const Marketplace = require('../models/Marketplace');
const logger = require('../utils/logger');

/**
 * Get marketplace items by vertical
 * GET /api/marketplace/:vertical
 */
const getItems = async (req, res, next) => {
  try {
    const { vertical } = req.params;
    const filters = req.query;

    // Validate vertical
    const validVerticals = ['earn', 'build', 'live', 'protect'];
    if (!validVerticals.includes(vertical)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_VERTICAL',
          message: 'Invalid marketplace vertical'
        }
      });
    }

    const items = await Marketplace.getByVertical(vertical, filters);

    res.json({
      success: true,
      items,
      vertical,
      filters
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single marketplace item
 * GET /api/marketplace/:vertical/:id
 */
const getItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await Marketplace.getById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Item not found'
        }
      });
    }

    res.json({
      success: true,
      item
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create marketplace item
 * POST /api/marketplace/:vertical
 */
const createItem = async (req, res, next) => {
  try {
    const { vertical } = req.params;
    const itemData = req.body;

    // Validate vertical
    const validVerticals = ['earn', 'build', 'live', 'protect'];
    if (!validVerticals.includes(vertical)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_VERTICAL',
          message: 'Invalid marketplace vertical'
        }
      });
    }

    // Set provider
    itemData.providerId = req.user.id;

    const item = await Marketplace.create(vertical, itemData);

    logger.info(`Marketplace item created: ${item.id} by ${req.user.id}`);

    res.status(201).json({
      success: true,
      item,
      message: 'Item created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update marketplace item
 * PUT /api/marketplace/:vertical/:id
 */
const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get existing item
    const existing = await Marketplace.getById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Item not found'
        }
      });
    }

    // Check ownership
    if (existing.provider.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own items'
        }
      });
    }

    const item = await Marketplace.update(id, updates);

    logger.info(`Marketplace item updated: ${id} by ${req.user.id}`);

    res.json({
      success: true,
      item,
      message: 'Item updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete marketplace item
 * DELETE /api/marketplace/:vertical/:id
 */
const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get existing item
    const existing = await Marketplace.getById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Item not found'
        }
      });
    }

    // Check ownership
    if (existing.provider.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own items'
        }
      });
    }

    await Marketplace.delete(id);

    logger.info(`Marketplace item deleted: ${id} by ${req.user.id}`);

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Invest in BUILD item
 * POST /api/marketplace/build/:id/invest
 */
const invest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const item = await Marketplace.getById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Item not found'
        }
      });
    }

    if (item.vertical !== 'build') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OPERATION',
          message: 'Investment only available for BUILD items'
        }
      });
    }

    // Check if fully funded
    if (item.raised + amount > item.seeking) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVESTMENT_EXCEEDS_GOAL',
          message: 'Investment amount exceeds remaining goal'
        }
      });
    }

    const updated = await Marketplace.incrementRaised(id, amount);

    logger.info(`Investment made: ${amount} in ${id} by ${req.user.id}`);

    res.json({
      success: true,
      item: updated,
      message: 'Investment recorded'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  invest
};
