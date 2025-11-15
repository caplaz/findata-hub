jest.mock("../src/yahoo", () => ({
  quote: jest.fn(),
  historical: jest.fn(),
  quoteSummary: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/server");

const yahooFinance = require("../src/yahoo");

describe("/health", () => {
  it("should return status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("/quote/:symbols", () => {
  it("should return quote data for single symbol", async () => {
    yahooFinance.quote.mockResolvedValue([
      { symbol: "AAPL", regularMarketPrice: 150 },
    ]);
    const res = await request(app).get("/quote/AAPL");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ symbol: "AAPL", regularMarketPrice: 150 }]);
  });

  it("should return quote data for multiple symbols", async () => {
    yahooFinance.quote.mockResolvedValue([
      { symbol: "AAPL", regularMarketPrice: 150 },
      { symbol: "GOOGL", regularMarketPrice: 2800 },
    ]);
    const res = await request(app).get("/quote/AAPL,GOOGL");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("should handle errors", async () => {
    yahooFinance.quote.mockRejectedValue(new Error("API error"));
    const res = await request(app).get("/quote/INVALID");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});

describe("/history/:symbols", () => {
  it("should return historical data for single symbol", async () => {
    yahooFinance.historical.mockResolvedValue([
      { date: "2023-01-01", close: 150 },
    ]);
    const res = await request(app).get("/history/AAPL");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([[{ date: "2023-01-01", close: 150 }]]);
  });

  it("should return historical data for multiple symbols", async () => {
    yahooFinance.historical
      .mockResolvedValueOnce([{ date: "2023-01-01", close: 150 }])
      .mockResolvedValueOnce([{ date: "2023-01-01", close: 2800 }]);
    const res = await request(app).get("/history/AAPL,GOOGL");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toEqual([{ date: "2023-01-01", close: 150 }]);
    expect(res.body[1]).toEqual([{ date: "2023-01-01", close: 2800 }]);
  });

  it("should handle partial failures", async () => {
    yahooFinance.historical
      .mockResolvedValueOnce([{ date: "2023-01-01", close: 150 }])
      .mockRejectedValueOnce(new Error("Invalid symbol"));
    const res = await request(app).get("/history/AAPL,INVALID");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([[{ date: "2023-01-01", close: 150 }], null]);
  });
});

describe("/info/:symbols", () => {
  it("should return info data for single symbol", async () => {
    yahooFinance.quoteSummary.mockResolvedValue({
      assetProfile: { name: "Apple Inc." },
    });
    const res = await request(app).get("/info/AAPL");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ assetProfile: { name: "Apple Inc." } }]);
  });

  it("should handle errors", async () => {
    yahooFinance.quoteSummary.mockRejectedValue(new Error("API error"));
    const res = await request(app).get("/info/INVALID");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([null]);
  });
});
