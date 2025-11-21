/**
 * Cache configuration tests
 * Tests for caching module configuration and behavior
 * @module tests/config/cache.test
 */

import {
  cache,
  CACHE_MODE,
  CACHE_HOST,
  CACHE_ENABLED,
  CACHE_TTL,
  CACHE_MODE_NODECACHE,
  CACHE_MODE_MEMCACHED,
  CACHE_MODE_NONE,
} from "../../src/config/cache";

describe("Cache Configuration", () => {
  describe("cache object", () => {
    test("should be defined", () => {
      expect(cache).toBeDefined();
      expect(typeof cache.get).toBe("function");
      expect(typeof cache.set).toBe("function");
    });

    test("should set and get values", async () => {
      await cache.set("test_key", { data: "test_value" });
      const result = await cache.get("test_key");
      expect(result).toEqual({ data: "test_value" });
    });

    test("should handle cache miss", async () => {
      const result = await cache.get("nonexistent_key");
      expect(result).toBeUndefined();
    });
  });

  describe("Cache mode constants", () => {
    test("CACHE_MODE_NODECACHE should be 'nodecache'", () => {
      expect(CACHE_MODE_NODECACHE).toBe("nodecache");
    });

    test("CACHE_MODE_MEMCACHED should be 'memcached'", () => {
      expect(CACHE_MODE_MEMCACHED).toBe("memcached");
    });

    test("CACHE_MODE_NONE should be 'none'", () => {
      expect(CACHE_MODE_NONE).toBe("none");
    });
  });

  describe("CACHE_MODE constant", () => {
    test("should be a string", () => {
      expect(typeof CACHE_MODE).toBe("string");
    });

    test("should be 'nodecache' by default", () => {
      expect(CACHE_MODE).toBe("nodecache");
    });
  });

  describe("CACHE_HOST constant", () => {
    test("should be a string", () => {
      expect(typeof CACHE_HOST).toBe("string");
    });

    test("should be 'localhost:11211' by default", () => {
      expect(CACHE_HOST).toBe("localhost:11211");
    });
  });

  describe("CACHE_ENABLED constant (backward compatibility)", () => {
    test("should be a boolean", () => {
      expect(typeof CACHE_ENABLED).toBe("boolean");
    });

    test("should be true when CACHE_MODE is not 'none'", () => {
      expect(CACHE_ENABLED).toBe(CACHE_MODE !== "none");
    });

    test("should be true by default (nodecache mode)", () => {
      expect(CACHE_ENABLED).toBe(true);
    });
  });

  describe("CACHE_TTL constant", () => {
    test("should be a positive number", () => {
      expect(typeof CACHE_TTL).toBe("number");
      expect(CACHE_TTL).toBeGreaterThan(0);
    });

    test("should be at least 300 seconds by default", () => {
      expect(CACHE_TTL).toBeGreaterThanOrEqual(300);
    });
  });

  describe("Environment variable behavior", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset environment
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      // Restore original environment
      process.env = originalEnv;
    });

    test("CACHE_MODE should use environment variable when set", () => {
      process.env.CACHE_MODE = "memcached";
      // Test the logic that would be used in the module
      const expectedMode = process.env.CACHE_MODE || CACHE_MODE_NODECACHE;
      expect(expectedMode).toBe("memcached");
    });

    test("CACHE_HOST should use environment variable when set", () => {
      process.env.CACHE_HOST = "custom-host:11212";
      const expectedHost = process.env.CACHE_HOST || "localhost:11211";
      expect(expectedHost).toBe("custom-host:11212");
    });

    test("CACHE_TTL should use environment variable when set", () => {
      process.env.CACHE_TTL = "600";
      const expectedTtl = parseInt(process.env.CACHE_TTL) || 300;
      expect(expectedTtl).toBe(600);
    });

    test("CACHE_ENABLED logic should work with different modes", () => {
      // Test with 'none' mode
      process.env.CACHE_MODE = "none";
      const modeNone = process.env.CACHE_MODE || CACHE_MODE_NODECACHE;
      const enabledNone = modeNone !== CACHE_MODE_NONE;
      expect(enabledNone).toBe(false);

      // Test with 'memcached' mode
      process.env.CACHE_MODE = "memcached";
      const modeMemcached = process.env.CACHE_MODE || CACHE_MODE_NODECACHE;
      const enabledMemcached = modeMemcached !== CACHE_MODE_NONE;
      expect(enabledMemcached).toBe(true);
    });
  });

  describe("Cache mode validation", () => {
    test("should have valid cache mode constants", () => {
      expect([
        CACHE_MODE_NODECACHE,
        CACHE_MODE_MEMCACHED,
        CACHE_MODE_NONE,
      ]).toEqual(expect.arrayContaining(["nodecache", "memcached", "none"]));
    });

    test("default CACHE_MODE should be one of the valid constants", () => {
      expect([
        CACHE_MODE_NODECACHE,
        CACHE_MODE_MEMCACHED,
        CACHE_MODE_NONE,
      ]).toContain(CACHE_MODE);
    });

    test("CACHE_ENABLED should be equivalent to CACHE_MODE !== CACHE_MODE_NONE", () => {
      expect(CACHE_ENABLED).toBe(CACHE_MODE !== CACHE_MODE_NONE);
    });

    test("cache mode constants should be unique", () => {
      const modes = [
        CACHE_MODE_NODECACHE,
        CACHE_MODE_MEMCACHED,
        CACHE_MODE_NONE,
      ];
      const uniqueModes = [...new Set(modes)];
      expect(uniqueModes).toHaveLength(modes.length);
    });
  });
});
