/**
 * Health Routes module
 * Health check endpoints
 * @module routes/health
 */

import { Router, Request, Response } from "express";
import { log } from "../utils/logger";

const router = Router();

// ============================================================================
// Health Check Endpoint
// ============================================================================

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Verify server status and availability
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             example:
 *               status: "ok"
 */
router.get("/health", (req: Request, res: Response) => {
  log("debug", `Health check requested from ${req.ip}`);
  res.json({ status: "ok" });
});

export default router;
