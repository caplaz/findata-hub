/**
 * API Routes module
 * Main router that combines all individual route modules
 * @module routes/index
 */

import { Router } from "express";

import financialRoutes from "./financial";
import healthRoutes from "./health";
import historyRoutes from "./history";
import holdingsRoutes from "./holdings";
import infoRoutes from "./info";
import insightsRoutes from "./insights";
import newsRoutes from "./news";
import newsReaderRouter from "./newsReader";
import quotesRoutes from "./quotes";
import recommendationsRoutes from "./recommendations";
import screenerRoutes from "./screener";
import searchRoutes from "./search";
import trendingRoutes from "./trending";

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
