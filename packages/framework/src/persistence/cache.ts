/**
 * Cache interface for storing and retrieving data
 * Supports both synchronous (localStorage) and asynchronous (OPFS) storage backends
 */
export interface CacheProvider {
  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache (must be JSON-serializable)
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Delete a value from the cache
   * @param key The cache key
   */
  delete(key: string): Promise<void>;
}

/**
 * localStorage-based cache provider
 * Synchronous operations wrapped in Promises for interface compatibility
 */
export class LocalStorageCacheProvider implements CacheProvider {
  private prefix: string;

  constructor(prefix: string = "") {
    this.prefix = prefix;
  }

  async get<T>(key: string): Promise<T | null> {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    try {
      const fullKey = this.prefix + key;
      const cachedData = localStorage.getItem(fullKey);
      if (!cachedData) {
        return null;
      }
      return JSON.parse(cachedData) as T;
    } catch (e) {
      console.warn("Failed to parse cached data:", e);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    try {
      const fullKey = this.prefix + key;
      localStorage.setItem(fullKey, JSON.stringify(value));
    } catch (e) {
      console.warn("Failed to save cached data:", e);
    }
  }

  async delete(key: string): Promise<void> {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
    } catch (e) {
      console.warn("Failed to delete cached data:", e);
    }
  }
}

/**
 * OPFS-based cache provider
 * Uses the Origin Private File System API for persistent storage
 */
export class OPFSCacheProvider implements CacheProvider {
  private root: FileSystemDirectoryHandle | null = null;
  private prefix: string;
  private cacheDir: string;

  constructor(prefix: string = "", cacheDir: string = "cache") {
    this.prefix = prefix;
    this.cacheDir = cacheDir;
  }

  private async getRoot(): Promise<FileSystemDirectoryHandle> {
    if (!this.root) {
      const storageRoot = await navigator.storage.getDirectory();
      this.root = await storageRoot.getDirectoryHandle(this.cacheDir, {
        create: true,
      });
    }
    return this.root;
  }

  private getFileName(key: string): string {
    // Sanitize key to be a valid filename
    // Replace invalid characters with underscores
    const sanitized = key.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `${this.prefix}${sanitized}.json`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const root = await this.getRoot();
      const fileName = this.getFileName(key);

      try {
        const fileHandle = await root.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const text = await file.text();
        return JSON.parse(text) as T;
      } catch (e) {
        // File doesn't exist or can't be read
        return null;
      }
    } catch (e) {
      console.warn("Failed to get cached data from OPFS:", e);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const root = await this.getRoot();
      const fileName = this.getFileName(key);

      const fileHandle = await root.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(value));
      await writable.close();
    } catch (e) {
      console.warn("Failed to save cached data to OPFS:", e);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const root = await this.getRoot();
      const fileName = this.getFileName(key);

      try {
        await root.removeEntry(fileName);
      } catch (e) {
        // File doesn't exist, ignore
      }
    } catch (e) {
      console.warn("Failed to delete cached data from OPFS:", e);
    }
  }
}

/**
 * Default cache provider instance
 * Uses OPFS as the default storage backend
 */
export const defaultCache: CacheProvider = new OPFSCacheProvider();

/**
 * Create a cache provider instance
 * @param type The type of cache provider to create
 * @param prefix Optional prefix for cache keys
 * @returns A cache provider instance
 */
export function createCacheProvider(
  type: "localStorage" | "opfs" = "opfs",
  prefix: string = ""
): CacheProvider {
  if (type === "localStorage") {
    return new LocalStorageCacheProvider(prefix);
  }
  return new OPFSCacheProvider(prefix);
}
