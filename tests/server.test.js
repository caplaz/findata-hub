import { jest } from "@jest/globals";

// Mock the yahoo module before importing app
const mockYahooFinance = {
  quoteSummary: jest.fn(),
  chart: jest.fn(),
};

jest.unstable_mockModule("../src/yahoo.js", () => ({
  default: mockYahooFinance,
}));

import request from "supertest";
import app from "../src/server.js";

describe("/health", () => {
  it("should return status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("/quote/:symbols", () => {
  afterEach(() => {
    mockYahooFinance.quoteSummary.mockClear();
  });

  it("should return quote data for single symbol", async () => {
    mockYahooFinance.quoteSummary.mockResolvedValue({
      symbol: "AAPL",
      regularMarketPrice: 150,
    });
    const res = await request(app).get("/quote/AAPL");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("AAPL");
  });

  it("should return quote data for multiple symbols", async () => {
    mockYahooFinance.quoteSummary
      .mockResolvedValueOnce({ symbol: "AAPL", regularMarketPrice: 150 })
      .mockResolvedValueOnce({ symbol: "GOOGL", regularMarketPrice: 2800 });
    const res = await request(app).get("/quote/AAPL,GOOGL");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("AAPL");
    expect(res.body).toHaveProperty("GOOGL");
  });

  it("should handle errors gracefully", async () => {
    mockYahooFinance.quoteSummary.mockRejectedValue(new Error("API error"));
    const res = await request(app).get("/quote/INVALID");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("INVALID");
    expect(res.body.INVALID).toHaveProperty("error");
  });
});

describe("/history/:symbols", () => {
  beforeEach(() => {
    mockYahooFinance.chart.mockReset();
  });

  it("should return historical data for single symbol", async () => {
    mockYahooFinance.chart.mockResolvedValueOnce({
      quotes: [{ date: "2023-01-01", close: 150 }],
    });
    const res = await request(app).get("/history/AAPL");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(Array.isArray(res.body[0])).toBe(true);
  });

  it("should return historical data for multiple symbols", async () => {
    mockYahooFinance.chart
      .mockResolvedValueOnce({ quotes: [{ date: "2023-01-01", close: 150 }] })
      .mockResolvedValueOnce({ quotes: [{ date: "2023-01-01", close: 2800 }] });
    const res = await request(app).get("/history/AAPL,GOOGL");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it("should handle partial failures", async () => {
    mockYahooFinance.chart
      .mockResolvedValueOnce({ quotes: [{ date: "2023-01-01", close: 150 }] })
      .mockRejectedValueOnce(new Error("Invalid symbol"));
    const res = await request(app).get("/history/AAPL,INVALID");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[1]).toBeNull();
  });
});

describe("/info/:symbols", () => {
  afterEach(() => {
    mockYahooFinance.quoteSummary.mockClear();
  });

  it("should return info data for single symbol", async () => {
    mockYahooFinance.quoteSummary.mockResolvedValue({
      assetProfile: { name: "Apple Inc." },
    });
    const res = await request(app).get("/info/AAPL");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should handle errors gracefully", async () => {
    mockYahooFinance.quoteSummary.mockRejectedValue(new Error("API error"));
    const res = await request(app).get("/info/INVALID");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([null]);
  });
});
