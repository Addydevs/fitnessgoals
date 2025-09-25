import NetInfo from '@react-native-community/netinfo';
import { OfflineQueue } from './cache';

export class NetworkManager {
  private static isConnected = true;
  private static listeners: ((isConnected: boolean) => void)[] = [];

  static initialize() {
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected ?? false;
      
  // ...removed console.log...
      
      // Notify listeners
      this.listeners.forEach(listener => listener(this.isConnected));
      
      // Process offline queue when coming back online
      if (!wasConnected && this.isConnected) {
        this.processOfflineOperations();
      }
    });
  }

  static isOnline(): boolean {
    return this.isConnected;
  }

  static addListener(callback: (isConnected: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  static async withNetworkCheck<T>(
    operation: () => Promise<T>,
    offlineCallback?: () => T | Promise<T>
  ): Promise<T> {
    if (!this.isConnected) {
      if (offlineCallback) {
        return await offlineCallback();
      }
      throw new Error('No internet connection available');
    }

    try {
      return await operation();
    } catch (error) {
      // If operation fails and might be network-related, check connection
      const currentState = await NetInfo.fetch();
      if (!currentState.isConnected) {
        this.isConnected = false;
        if (offlineCallback) {
          return await offlineCallback();
        }
        throw new Error('Lost internet connection during operation');
      }
      throw error;
    }
  }

  private static async processOfflineOperations() {
  // ...removed console.log...
    
    await OfflineQueue.processQueue(async (operation) => {
      try {
        // Process different types of offline operations
        switch (operation.type) {
          case 'save_profile':
            // Re-attempt profile save
            const { SupabaseService } = await import('./supabase');
            await SupabaseService.saveUserProfile(operation.data);
            return true;
          
          case 'save_message':
            // Re-attempt message save
            const { SupabaseService: MessageService } = await import('./supabase');
            await MessageService.saveChatMessage(operation.data.type, operation.data.content);
            return true;
          
          default:
            console.warn('[Network] Unknown offline operation type:', operation.type);
            return false;
        }
      } catch (error) {
        console.error('[Network] Failed to process offline operation:', error);
        return false;
      }
    });
  }
}

// Initialize network monitoring
NetworkManager.initialize();
