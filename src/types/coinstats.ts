/**
 * CoinStats API Type Definitions
 *
 * This file contains all TypeScript interfaces and types for the CoinStats API integration.
 * These types define the structure of cryptocurrency data returned by the CoinStats API.
 *
 * @module types/coinstats
 */

// ============================================================================
// CoinStats API Types
// ============================================================================

/**
 * CoinStats API pagination metadata
 */
export interface CoinStatsMeta {
  page: number;
  limit: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * CoinStats cryptocurrency coin data
 */
export interface CoinStatsCoin {
  id: string;
  icon: string;
  name: string;
  symbol: string;
  rank: number;
  price: number;
  priceBtc: number;
  volume: number;
  marketCap: number;
  availableSupply: number;
  totalSupply: number;
  fullyDilutedValuation: number;
  priceChange1h: number;
  priceChange1d: number;
  priceChange1w: number;
  websiteUrl?: string;
  redditUrl?: string;
  twitterUrl?: string;
  contractAddress?: string | null;
  contractAddresses?: string[];
  decimals?: number;
  explorers?: string[];
  liquidityScore?: number;
  volatilityScore?: number;
  marketCapScore?: number;
  riskScore?: number;
  avgChange?: number;
}

/**
 * CoinStats API response for coins endpoint
 */
export interface CoinStatsResponse {
  meta: CoinStatsMeta;
  result: CoinStatsCoin[];
}

/**
 * CoinStats market data structure for global cryptocurrency market statistics
 */
export interface CoinStatsMarketData {
  marketCap: number;
  volume: number;
  btcDominance: number;
  marketCapChange: number;
  volumeChange: number;
  btcDominanceChange: number;
}

/**
 * CoinStats BTC dominance data point
 */
export interface CoinStatsBtcDominanceDataPoint {
  timestamp: number;
  btcDominance: number;
}

/**
 * CoinStats BTC dominance response
 */
export interface CoinStatsBtcDominanceResponse {
  data: CoinStatsBtcDominanceDataPoint[];
}

/**
 * CoinStats Fear and Greed index data point
 */
export interface CoinStatsFearGreedDataPoint {
  value: number;
  value_classification: string;
  timestamp: number;
  update_time?: string;
}

/**
 * CoinStats Fear and Greed response
 */
export interface CoinStatsFearGreedResponse {
  name: string;
  now: CoinStatsFearGreedDataPoint;
  yesterday: CoinStatsFearGreedDataPoint;
  lastWeek: CoinStatsFearGreedDataPoint;
}

/**
 * CoinStats Rainbow Chart data point
 */
export interface CoinStatsRainbowChartDataPoint {
  price: string;
  time: string;
}

/**
 * CoinStats Rainbow Chart response (array of data points)
 */
export type CoinStatsRainbowChartResponse = CoinStatsRainbowChartDataPoint[];

/**
 * CoinStats news coin data associated with news articles
 */
export interface CoinStatsNewsCoin {
  coinKeyWords: string;
  coinPercent: number;
  coinTitleKeyWords: string;
  coinNameKeyWords: string;
  coinIdKeyWords: string;
}

/**
 * CoinStats news article data
 */
export interface CoinStatsNewsArticle {
  id: string;
  feedDate: number;
  source: string;
  title: string;
  isFeatured: boolean;
  link: string;
  sourceLink: string;
  imgUrl: string;
  reactionsCount: Record<string, number>;
  reactions: string[];
  shareURL: string;
  relatedCoins: string[];
  content: boolean;
  bigImg: boolean;
  searchKeyWords: string[];
  description?: string;
  coins: CoinStatsNewsCoin[];
}

/**
 * CoinStats news response (array of news articles)
 */
export type CoinStatsNewsResponse = CoinStatsNewsArticle[];
