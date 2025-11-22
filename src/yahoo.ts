/**
 * Yahoo Finance API client configuration
 * Configured instance of yahoo-finance2 library with optimized settings
 *
 * @module yahoo
 */

import YahooFinance from "yahoo-finance2";

/**
 * Configured Yahoo Finance API client
 * Suppresses survey notices and disables validation error logging for cleaner operation
 */
const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
  validation: {
    logErrors: false,
    logOptionsErrors: false,
  },
});

export default yahooFinance;
