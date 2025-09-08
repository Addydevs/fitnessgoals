import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class CacheManager {
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const item: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();

      if (now - item.timestamp > item.ttl) {
        // Cache expired
        await this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('[Cache] Failed to get cached item:', error);
      return null;
    }
  }

  static async set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('[Cache] Failed to cache item:', error);
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('[Cache] Failed to remove cached item:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.warn('[Cache] Failed to clear cache:', error);
    }
  }
}

export class OfflineQueue {
  private static readonly QUEUE_KEY = 'offline_queue';

  static async addOperation(operation: {
    type: string;
    data: any;
    timestamp: number;
  }): Promise<void> {
    try {
      const queue = await this.getQueue();
      queue.push(operation);
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to add operation:', error);
    }
  }

  static async getQueue(): Promise<any[]> {
    try {
      const queueJson = await AsyncStorage.getItem(this.QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.warn('[OfflineQueue] Failed to get queue:', error);
      return [];
    }
  }

  static async processQueue(
    processor: (operation: any) => Promise<boolean>
  ): Promise<void> {
    try {
      const queue = await this.getQueue();
      const remaining = [];

      for (const operation of queue) {
        try {
          const success = await processor(operation);
          if (!success) {
            remaining.push(operation);
          }
        } catch (error) {
          console.warn('[OfflineQueue] Failed to process operation:', error);
          remaining.push(operation);
        }
      }

      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(remaining));
    } catch (error) {
      console.error('[OfflineQueue] Failed to process queue:', error);
    }
  }

  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.QUEUE_KEY);
    } catch (error) {
      console.warn('[OfflineQueue] Failed to clear queue:', error);
    }
  }
}
