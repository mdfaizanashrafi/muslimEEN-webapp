/**
 * Islamic Finance Models - Barrel Exports
 * Following Single Responsibility Principle (SRP)
 * 
 * This file provides backward compatibility by re-exporting
 * the individual model classes from their dedicated files.
 */

const { Sadaqah } = require('./sadaqah');
const { Waqf } = require('./waqf');
const { QardHasan } = require('./qardHasan');
const { ZakatCalculator } = require('../services/ZakatCalculator');

module.exports = {
  Sadaqah,
  Waqf,
  QardHasan,
  ZakatCalculator
};
