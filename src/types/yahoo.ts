/**
 * Yahoo Finance API Type Definitions
 *
 * This file contains all TypeScript interfaces and types for the Yahoo Finance API integration.
 * These types define the structure of financial data returned by the yahoo-finance2 library.
 *
 * @module types/yahoo
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
} from "yahoo-finance2/esm/src/modules/quoteSummary-iface";

export type {
  SearchResult,
  SearchNews,
} from "yahoo-finance2/esm/src/modules/search";
export type { RecommendationsBySymbolResponse } from "yahoo-finance2/esm/src/modules/recommendationsBySymbol";
export type {
  ChartResultArray,
  ChartOptions,
} from "yahoo-finance2/esm/src/modules/chart";
export type {
  HistoricalHistoryResult,
  HistoricalOptions,
} from "yahoo-finance2/esm/src/modules/historical";
export type { Quote } from "yahoo-finance2/esm/src/modules/quote";
export type { TrendingSymbolsResult } from "yahoo-finance2/esm/src/modules/trendingSymbols";
export type {
  ScreenerResult,
  PredefinedScreenerModules,
} from "yahoo-finance2/esm/src/modules/screener";

/**
 * Fundamentals Time Series types
 */
export type {
  FundamentalsTimeSeriesResult,
  FundamentalsTimeSeriesResults,
  FundamentalsTimeSeriesFinancialsResult,
  FundamentalsTimeSeriesBalanceSheetResult,
  FundamentalsTimeSeriesCashFlowResult,
} from "yahoo-finance2/esm/src/modules/fundamentalsTimeSeries";

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
