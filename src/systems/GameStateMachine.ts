import { eventBus } from './EventBus'

/**
 * Available game states
 */
export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

/**
 * Interface for state handlers
 */
export interface StateHandler {
  /**
   * Called when entering the state
   */
  enter(): void
  
  /**
   * Called when exiting the state
   */
  exit(): void
  
  /**
   * Called on each update while in this state
   * @param deltaTime Time since last update in seconds
   */
  update(deltaTime: number): void
}

/**
 * Abstract base class for state handlers with default implementations
 */
export abstract class BaseStateHandler implements StateHandler {
  enter(): void {}
  exit(): void {}
  update(deltaTime: number): void {}
}

/**
 * Game State Machine for managing game states
 */
export class GameStateMachine {
  private currentState: GameState = GameState.MENU
  private handlers: Map<GameState, StateHandler> = new Map()
  
  /**
   * Constructor - sets up default state
   * @param initialState Optional initial state, defaults to MENU
   */
  constructor(initialState: GameState = GameState.MENU) {
    this.currentState = initialState
  }
  
  /**
   * Register a handler for a specific state
   * @param state The game state
   * @param handler The handler for that state
   */
  registerHandler(state: GameState, handler: StateHandler): void {
    this.handlers.set(state, handler)
  }
  
  /**
   * Change to a new game state
   * @param newState The state to change to
   */
  changeState(newState: GameState): void {
    if (this.currentState === newState) return
    
    // Publish state change event before changing state
    eventBus.publish('state:changing', {
      from: this.currentState,
      to: newState
    })
    
    // Exit current state
    const currentHandler = this.handlers.get(this.currentState)
    if (currentHandler) {
      currentHandler.exit()
    }
    
    // Change state
    const oldState = this.currentState
    this.currentState = newState
    
    // Enter new state
    const newHandler = this.handlers.get(newState)
    if (newHandler) {
      newHandler.enter()
    }
    
    // Publish state changed event
    eventBus.publish('state:changed', {
      from: oldState,
      to: newState
    })
  }
  
  /**
   * Update the current state
   * @param deltaTime Time since last update in seconds
   */
  update(deltaTime: number): void {
    const handler = this.handlers.get(this.currentState)
    if (handler) {
      handler.update(deltaTime)
    }
  }
  
  /**
   * Get the current state
   */
  get state(): GameState {
    return this.currentState
  }
}

// Export a singleton instance
export const gameStateMachine = new GameStateMachine() 