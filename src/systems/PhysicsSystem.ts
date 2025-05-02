'use client'

import { Scene, PhysicsImpostor, Vector3, HavokPlugin } from '@babylonjs/core'

export interface PhysicsOptions {
  gravity?: Vector3
  useHavok?: boolean
}

/**
 * Physics system for handling physics simulation
 */
export class PhysicsSystem {
  private scene: Scene
  private isInitialized: boolean = false
  private options: PhysicsOptions
  
  constructor(scene: Scene, options: PhysicsOptions = {}) {
    this.scene = scene
    this.options = {
      gravity: options.gravity || new Vector3(0, -9.81, 0),
      useHavok: options.useHavok !== undefined ? options.useHavok : true
    }
  }
  
  /**
   * Initialize the physics engine
   * This needs to be called after the Havok plugin is loaded
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true
    
    try {
      if (this.options.useHavok) {
        // For Havok physics, we need to initialize the plugin
        // This requires that @babylonjs/havok is properly loaded
        try {
          // Import HavokPhysics dynamically to avoid SSR issues
          const HavokPhysics = await import('@babylonjs/havok').then(module => module.default)
            .catch(err => {
              console.warn("Failed to import Havok physics:", err);
              return null;
            });
          
          if (!HavokPhysics) {
            throw new Error("Havok physics module could not be loaded");
          }
          
          const havokInstance = await HavokPhysics()
            .catch(err => {
              console.warn("Failed to initialize Havok physics instance:", err);
              return null;
            });
            
          if (!havokInstance) {
            throw new Error("Failed to initialize Havok physics instance");
          }
          
          const havokPlugin = new HavokPlugin(true, havokInstance)
          
          // Enable physics in the scene
          this.scene.enablePhysics(this.options.gravity, havokPlugin)
          console.log("Havok physics initialized successfully")
        } catch (e) {
          console.warn("Failed to initialize Havok physics, falling back to default:", e)
          // Fall back to default physics engine
          this.scene.enablePhysics(this.options.gravity)
        }
      } else {
        // Use default physics engine
        this.scene.enablePhysics(this.options.gravity)
      }
      
      // Verify that the physics engine has the expected methods
      const physicsEngine = this.scene.getPhysicsEngine();
      if (!physicsEngine) {
        throw new Error("Physics engine not properly initialized");
      }
      
      // Check if getImpostors method exists
      if (typeof physicsEngine.getImpostors !== 'function') {
        console.warn("Physics engine does not have getImpostors method - HavokPlugin may not be fully initialized");
        // Create a dummy implementation to prevent crashes
        physicsEngine.getImpostors = () => [];
      }
      
      this.isInitialized = true
      return true
    } catch (e) {
      console.error("Failed to initialize physics engine:", e)
      // Try to continue without physics
      this.isInitialized = false
      return false
    }
  }
  
  /**
   * Add water physics effects (buoyancy, drag, etc.)
   * @param waterLevel Y position of water surface
   */
  addWaterPhysics(waterLevel: number = 0): void {
    if (!this.isInitialized) {
      console.warn("Physics engine not initialized. Call initialize() first.")
      return
    }
    
    // Make sure the physics engine exists
    const physicsEngine = this.scene.getPhysicsEngine();
    if (!physicsEngine) {
      console.warn("No physics engine available in the scene. Water physics will not be applied.")
      return;
    }
    
    // Register a before step callback to apply water physics effects
    try {
      this.scene.onBeforePhysicsObservable.add(() => {
        try {
          // Check if getImpostors() is available
          if (typeof physicsEngine.getImpostors !== 'function') {
            return; // Skip water physics if getImpostors is not available
          }
          
          // Get all physics-enabled meshes
          const physicsImpostors = physicsEngine.getImpostors() || [];
          
          physicsImpostors.forEach(impostor => {
            try {
              const mesh = impostor.object;
              const position = mesh.position;
              
              // Check if mesh is underwater
              if (position.y < waterLevel) {
                // Calculate volume submerged
                const boundingInfo = mesh.getBoundingInfo();
                const meshHeight = boundingInfo.boundingBox.maximumWorld.y - boundingInfo.boundingBox.minimumWorld.y;
                const submergedRatio = Math.min(1, Math.max(0, (waterLevel - position.y) / meshHeight));
                
                // Apply buoyancy force (proportional to submerged volume)
                // This is a simplified model assuming uniform density
                const buoyancyForce = new Vector3(0, 9.81 * submergedRatio * impostor.mass, 0);
                impostor.applyForce(buoyancyForce, mesh.getAbsolutePosition());
                
                // Apply water resistance (drag)
                const velocity = impostor.getLinearVelocity() || new Vector3(0, 0, 0);
                const dragForce = velocity.scale(-0.5 * submergedRatio);
                impostor.applyForce(dragForce, mesh.getAbsolutePosition());
              }
            } catch (e) {
              console.warn("Error processing physics impostor:", e);
            }
          });
        } catch (e) {
          console.warn("Error in water physics update:", e);
        }
      });
    } catch (e) {
      console.warn("Failed to add water physics:", e);
    }
  }
  
  /**
   * Create a physical impostor for an object
   * @param mesh Mesh to add physics to
   * @param type Type of impostor (box, sphere, etc.)
   * @param options Physics options
   */
  createImpostor(
    mesh: any, 
    type: number = PhysicsImpostor.BoxImpostor, 
    options: { mass: number, restitution: number } = { mass: 1, restitution: 0.2 }
  ): PhysicsImpostor | null {
    if (!this.isInitialized || !this.scene.getPhysicsEngine()) {
      console.warn("Physics engine not initialized. Cannot create impostor.");
      return null;
    }
    
    try {
      const impostor = new PhysicsImpostor(mesh, type, options, this.scene)
      return impostor;
    } catch (e) {
      console.error("Failed to create physics impostor:", e);
      return null;
    }
  }
  
  /**
   * Dispose of the physics system
   */
  dispose(): void {
    if (this.scene.getPhysicsEngine()) {
      this.scene.disablePhysicsEngine()
    }
    this.isInitialized = false
  }
} 