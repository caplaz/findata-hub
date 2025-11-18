/**
 * API Routes module
 * Main router that combines all individual route modules
 * @module routes/index
 */

import { Router } from "express";
import healthRoutes from "./health.js";
import quotesRoutes from "./quotes.js";
import historyRoutes from "./history.js";
import infoRoutes from "./info.js";
import searchRoutes from "./search.js";
import trendingRoutes from "./trending.js";
import recommendationsRoutes from "./recommendations.js";
import insightsRoutes from "./insights.js";
import screenerRoutes from "./screener.js";
import financialRoutes from "./financial.js";
import newsRoutes from "./news.js";
import holdingsRoutes from "./holdings.js";
import newsReaderRouter from "./newsReader.js";

const router = Router();

// ============================================================================
// Mount Individual Route Modules
// ============================================================================

/**
 * Health check routes
 */
router.use("/", healthRoutes);

/**
 * Stock quotes routes
 */
router.use("/quote", quotesRoutes);

/**
 * Historical data routes
 */
router.use("/history", historyRoutes);

/**
 * Company information routes
 */
router.use("/info", infoRoutes);

/**
 * Search routes
 */
router.use("/search", searchRoutes);

/**
 * Trending symbols routes
 */
router.use("/trending", trendingRoutes);

/**
 * Stock recommendations routes
 */
router.use("/recommendations", recommendationsRoutes);

/**
 * Comprehensive insights routes
 */
router.use("/insights", insightsRoutes);

/**
 * Stock screener routes
 */
router.use("/screener", screenerRoutes);

/**
 * Financial statements routes
 */
router.use("/financial", financialRoutes);

/**
 * News routes
 */
router.use("/news", newsRoutes);

/**
 * News reader routes (additional news functionality)
 */
router.use("/news-reader", newsReaderRouter);

/**
 * ETF holdings routes
 */
router.use("/holdings", holdingsRoutes);

export default router;
