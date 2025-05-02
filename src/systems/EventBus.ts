/**
 * Simple Event Bus implementation for component communication
 * This follows the observer pattern described in the project documentation
 */
export class EventBus {
  private listeners: Map<string, Function[]> = new Map()
  
  /**
   * Subscribe to an event
   * @param event Event name
   * @param callback Function to call when event is published
   * @returns Unsubscribe function
   */
  subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)?.push(callback)
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index !== -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }
  
  /**
   * Publish an event
   * @param event Event name
   * @param data Data to pass to subscribers
   */
  publish(event: string, data?: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach(callback => callback(data))
    }
  }
  
  /**
   * Clear all listeners for an event
   * @param event Event name, or undefined to clear all events
   */
  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }
}

// Create singleton instance
export const eventBus = new EventBus() 