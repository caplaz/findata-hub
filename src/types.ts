/**
 * Centralized Type Definitions
 *
 * This file exports all type definitions used across the yahoo-finance-server project.
 * It re-exports types from yahoo-finance2 library and defines custom types for
 * data structures not directly exported by the library.
 *
 * @module types
 */

// Re-export types from yahoo-finance2 library
export type {
  QuoteSummaryResult,
  AssetProfile,
  FinancialData,
  FundProfile,
  TopHoldings,
  SummaryProfile,
  RecommendationTrend,
  UpgradeDowngradeHistory,
  InsiderTransactions,
} from "yahoo-finance2/esm/src/modules/quoteSummary-iface.js";

export type {
  SearchResult,
  SearchNews,
} from "yahoo-finance2/esm/src/modules/search.js";
export type { RecommendationsBySymbolResponse } from "yahoo-finance2/esm/src/modules/recommendationsBySymbol.js";
export type {
  ChartResultArray,
  ChartOptions,
} from "yahoo-finance2/esm/src/modules/chart.js";
export type {
  HistoricalHistoryResult,
  HistoricalOptions,
} from "yahoo-finance2/esm/src/modules/historical.js";
export type { Quote } from "yahoo-finance2/esm/src/modules/quote";

// Import yahooFinance for utility types
import yahooFinance from "./yahoo";

/**
 * Utility types derived from yahoo-finance2 function signatures
 */
export type ScreenerOptions = Parameters<typeof yahooFinance.screener>[0];
export type QuoteSummaryOptions = Parameters<
  typeof yahooFinance.quoteSummary
>[1];

/**
 * Trending symbols result structure
 */
/**
 * Trending symbols result structure
 */
export interface TrendingResult {
  quotes: Array<{
    symbol: string;
    shortname?: string;
    regularMarketPrice?: number;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * Screener result structure
 */
export interface ScreenerResult {
  quotes: Array<{
    symbol: string;
    shortname?: string;
    regularMarketPrice?: number;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
    volume?: number;
    marketCap?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * Single fundamental data row (for financial statements)
 */
export interface FundamentalRow {
  date: Date;
  totalRevenue?: number;
  costOfRevenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  totalAssets?: number;
  totalLiabilitiesNetMinorityInterest?: number;
  totalStockholderEquity?: number;
  commonStockEquity?: number;
  currentAssets?: number;
  currentLiabilities?: number;
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  capitalExpenditure?: number;
  [key: string]: unknown;
}

/**
 * Array of fundamental data rows
 */
export type FundamentalsResult = FundamentalRow[];

/**
 * News article JSON structure (for scraping)
 */
export interface NewsJson {
  headline?: string;
  title?: string;
  body?: {
    items?: Array<{
      data?: {
        storyAtoms?: unknown[];
      };
    }>;
  };
}

/**
 * Story atom structure (for news content extraction)
 */
export interface StoryAtom {
  type: string;
  content: string;
}

/**
 * Summary profile with structured data
 */
export interface SummaryProfileData {
  previousClose?: { raw: number };
  marketCap?: { raw: number };
  trailingPE?: { raw: number };
  forwardPE?: { raw: number };
  [key: string]: unknown;
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}
