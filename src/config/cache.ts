/**
 * Caching configuration module
 * Provides cache instance and configuration for the application
 * Supports multiple cache backends: NodeCache (in-memory), Memcached, or disabled
 */

import NodeCache from "node-cache";
import Memcached from "memcached";

/**
 * Cache mode constants
 */
const CACHE_MODE_NODECACHE = "nodecache";
const CACHE_MODE_MEMCACHED = "memcached";
const CACHE_MODE_NONE = "none";

/**
 * Cache mode from environment.
 * Options: 'nodecache' (default), 'memcached', 'none'
 */
const CACHE_MODE = process.env.CACHE_MODE || CACHE_MODE_NODECACHE;

/**
 * Cache host for memcached (default: localhost:11211)
 */
const CACHE_HOST = process.env.CACHE_HOST || "localhost:11211";

/**
 * Cache TTL (Time To Live) in seconds from environment or default.
 * Default: 300 seconds (5 minutes)
 */
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300;

/**
 * Cache enabled flag for backward compatibility.
 * @deprecated Use CACHE_MODE instead
 */
const CACHE_ENABLED = CACHE_MODE !== CACHE_MODE_NONE;

/**
 * Unified cache interface
 */
interface CacheInterface {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
}

/**
 * No-op cache implementation for when caching is disabled
 */
class NoOpCache implements CacheInterface {
  async get(): Promise<any> {
    return undefined;
  }

  async set(): Promise<void> {
    // Do nothing
  }
}

/**
 * Memcached wrapper to match our interface
 */
class MemcachedCache implements CacheInterface {
  private client: Memcached;

  constructor(host: string) {
    this.client = new Memcached(host);
  }

  async get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, ttl || CACHE_TTL, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

/**
 * NodeCache wrapper to match our interface
 */
class NodeCacheWrapper implements CacheInterface {
  private cache: NodeCache;

  constructor(ttl: number) {
    this.cache = new NodeCache({ stdTTL: ttl });
  }

  async get(key: string): Promise<any> {
    return this.cache.get(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.cache.set(key, value, ttl);
  }
}

/**
 * Cache instance based on CACHE_MODE
 */
let cache: CacheInterface;

switch (CACHE_MODE.toLowerCase()) {
  case CACHE_MODE_MEMCACHED:
    cache = new MemcachedCache(CACHE_HOST);
    break;
  case CACHE_MODE_NONE:
    cache = new NoOpCache();
    break;
  case CACHE_MODE_NODECACHE:
  default:
    cache = new NodeCacheWrapper(CACHE_TTL);
    break;
}

export {
  cache,
  CACHE_MODE,
  CACHE_HOST,
  CACHE_ENABLED,
  CACHE_TTL,
  CACHE_MODE_NODECACHE,
  CACHE_MODE_MEMCACHED,
  CACHE_MODE_NONE,
};
