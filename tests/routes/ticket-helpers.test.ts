/**
 * Ticket Helper Functions Tests
 * Unit tests for internal helper functions in ticket routes
 * @module tests/routes/ticket-helpers.test
 */

import { Response } from "express";
import { handleTicketError } from "../../src/routes/ticket";

// Mock the logger to capture log calls
const mockLogs: any[] = [];
jest.mock("../../src/utils/logger", () => ({
  log: (...args: any[]) => {
    mockLogs.push(args);
  },
}));

describe("Ticket Helper Functions", () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockLogs.length = 0;
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("handleTicketError", () => {
    test("should return 404 for invalid symbol errors", () => {
      const error = new Error("Quote not found for symbol: INVALID");

      handleTicketError(mockResponse as Response, "INVALID", "test", error);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Symbol 'INVALID' not found or invalid",
      });
      expect(mockLogs.length).toBe(1);
      expect(mockLogs[0]).toEqual([
        "error",
        "Ticket test endpoint error for INVALID: Quote not found for symbol: INVALID",
        error,
      ]);
    });

    test("should return 404 for fundamentals not found errors", () => {
      const error = new Error("No fundamentals data found for symbol: INVALID");

      handleTicketError(mockResponse as Response, "INVALID", "info", error);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Symbol 'INVALID' not found or invalid",
      });
    });

    test("should return 404 for additional error patterns", () => {
      const error = new Error("Missing required query parameter");

      handleTicketError(mockResponse as Response, "TEST", "news", error, [
        "Missing required query parameter",
      ]);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Symbol 'TEST' not found or invalid",
      });
    });

    test("should return 500 for other server errors", () => {
      const error = new Error("Network timeout");

      handleTicketError(mockResponse as Response, "AAPL", "info", error);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Network timeout",
      });
    });

    test("should handle non-Error objects", () => {
      const error = "String error";

      handleTicketError(mockResponse as Response, "TEST", "endpoint", error);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "String error",
      });
    });

    test("should log with correct format", () => {
      const error = new Error("Test error");

      handleTicketError(mockResponse as Response, "SYMBOL", "custom", error);

      expect(mockLogs[0]).toEqual([
        "error",
        "Ticket custom endpoint error for SYMBOL: Test error",
        error,
      ]);
    });

    test("should combine default and additional error patterns", () => {
      const error = new Error("Custom error pattern");

      handleTicketError(mockResponse as Response, "TEST", "endpoint", error, [
        "Custom error pattern",
      ]);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });
});
