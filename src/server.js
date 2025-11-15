const express = require("express");
const rateLimit = require("express-rate-limit");
const yahooFinance = require("./yahoo");

const app = express();
app.use(express.json());

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Quote endpoint - supports multiple symbols (comma-separated)
app.get("/quote/:symbols", async (req, res) => {
  try {
    const symbols = req.params.symbols.split(",");
    const data = await yahooFinance.quote(symbols);
    // yahoo-finance2 returns array for multiple, handles invalid as undefined
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// History endpoint - supports multiple symbols (comma-separated)
app.get("/history/:symbols", async (req, res) => {
  try {
    const symbols = req.params.symbols.split(",");
    const { period = "1y", interval = "1d" } = req.query;
    const promises = symbols.map((symbol) =>
      yahooFinance.historical(symbol, { period, interval })
    );
    const results = await Promise.allSettled(promises);
    const data = results.map((result) =>
      result.status === "fulfilled" ? result.value : null
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Info endpoint - supports multiple symbols (comma-separated)
app.get("/info/:symbols", async (req, res) => {
  try {
    const symbols = req.params.symbols.split(",");
    const promises = symbols.map((symbol) =>
      yahooFinance.quoteSummary(symbol, {
        modules: ["assetProfile", "summaryProfile"],
      })
    );
    const results = await Promise.allSettled(promises);
    const data = results.map((result) =>
      result.status === "fulfilled" ? result.value : null
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
