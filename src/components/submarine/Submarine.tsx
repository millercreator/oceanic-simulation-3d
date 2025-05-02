'use client'

import { 
  Scene, 
  Mesh, 
  MeshBuilder, 
  Vector3, 
  StandardMaterial, 
  Color3, 
  PhysicsImpostor
} from '@babylonjs/core'

export interface SubmarineProps {
  scene: Scene
  position?: Vector3
}

export class Submarine {
  private scene: Scene
  private submarine: Mesh
  private hull: Mesh
  private tower: Mesh
  private propeller: Mesh
  private _position: Vector3
  
  // Submarine characteristics
  private _ballastLevel: number = 50 // 0-100 where 0 is empty (max buoyancy) and 100 is full (negative buoyancy)
  private _throttlePosition: number = 0 // -100 to 100 where negative is reverse
  private _rudderPosition: number = 0 // -100 to 100 where negative is left
  
  constructor(props: SubmarineProps) {
    this.scene = props.scene
    this._position = props.position || new Vector3(0, 0, 0)
    
    // Create main submarine hull
    this.hull = MeshBuilder.CreateCapsule(
      "submarineHull", 
      {
        radius: 1,
        height: 5,
        orientation: Vector3.Right()
      }, 
      this.scene
    )
    
    // Create conning tower (sail)
    this.tower = MeshBuilder.CreateCylinder(
      "submarineTower", 
      {
        height: 1.5,
        diameter: 0.8,
      }, 
      this.scene
    )
    this.tower.position = new Vector3(0, 1, 0)
    
    // Create propeller
    this.propeller = MeshBuilder.CreateCylinder(
      "propeller",
      {
        height: 0.2,
        diameter: 0.8,
      },
      this.scene
    )
    this.propeller.position = new Vector3(-2.5, 0, 0)
    this.propeller.rotation.z = Math.PI / 2
    
    // Create materials
    const hullMaterial = new StandardMaterial("submarineHullMaterial", this.scene)
    hullMaterial.diffuseColor = new Color3(0.2, 0.2, 0.3)
    hullMaterial.specularColor = new Color3(0.3, 0.3, 0.4)
    
    const towerMaterial = new StandardMaterial("submarineTowerMaterial", this.scene)
    towerMaterial.diffuseColor = new Color3(0.15, 0.15, 0.25)
    
    const propellerMaterial = new StandardMaterial("propellerMaterial", this.scene)
    propellerMaterial.diffuseColor = new Color3(0.6, 0.4, 0.1)
    
    this.hull.material = hullMaterial
    this.tower.material = towerMaterial
    this.propeller.material = propellerMaterial
    
    // Create parent mesh and attach components
    this.submarine = new Mesh("submarine", this.scene)
    this.hull.parent = this.submarine
    this.tower.parent = this.submarine
    this.propeller.parent = this.submarine
    
    // Set initial position
    this.submarine.position = this._position
    
    // Apply physics if available
    this.applyPhysics();
  }

  /**
   * Apply physics to the submarine
   * Separated to allow retry if needed
   */
  private applyPhysics(): void {
    try {
      if (this.scene.getPhysicsEngine()) {
        this.submarine.physicsImpostor = new PhysicsImpostor(
          this.submarine, 
          PhysicsImpostor.BoxImpostor, 
          { mass: 100, restitution: 0.2 }, 
          this.scene
        )
      }
    } catch (e) {
      console.warn("Failed to apply physics to submarine:", e);
      // Submarine will continue without physics
    }
  }
  
  /**
   * Update submarine position and physics based on controls and environment
   * @param deltaTime Time since last update in seconds
   */
  public update(deltaTime: number): void {
    // Rotate propeller based on throttle
    this.propeller.rotation.x += this._throttlePosition * deltaTime * 0.1
    
    // Apply forces based on controls if physics enabled
    if (this.submarine.physicsImpostor) {
      try {
        // Apply forward force based on throttle
        const forwardForce = new Vector3(this._throttlePosition * 10, 0, 0)
        this.submarine.physicsImpostor.applyForce(forwardForce, this.submarine.position)
        
        // Apply turning force based on rudder
        const turningTorque = new Vector3(0, this._rudderPosition * 5, 0)
        this.submarine.physicsImpostor.applyTorque(turningTorque)
        
        // Apply buoyancy force based on ballast
        // 50 is neutral buoyancy, below 50 rises, above 50 sinks
        const buoyancyForce = new Vector3(0, (50 - this._ballastLevel) * 20, 0)
        this.submarine.physicsImpostor.applyForce(buoyancyForce, this.submarine.position)
      } catch (e) {
        console.warn("Error applying physics forces:", e);
      }
    } else {
      // Simplified movement without physics
      const speed = this._throttlePosition * deltaTime * 0.05;
      // Create a movement vector based on submarine's forward direction
      const forward = new Vector3(1, 0, 0);
      // Apply rotation based on rudder
      this.submarine.rotate(Vector3.Up(), this._rudderPosition * deltaTime * 0.001);
      // Apply translation based on throttle
      const direction = forward.applyRotationQuaternion(this.submarine.rotationQuaternion || Quaternion.Identity());
      this.submarine.position.addInPlace(direction.scale(speed));
      
      // Apply ballast effect (simple up/down movement)
      const buoyancyEffect = (50 - this._ballastLevel) * deltaTime * 0.01;
      this.submarine.position.y += buoyancyEffect;
    }
  }
  
  // Getter and setter for ballast level
  get ballastLevel(): number {
    return this._ballastLevel
  }
  
  set ballastLevel(value: number) {
    this._ballastLevel = Math.max(0, Math.min(100, value))
  }
  
  // Getter and setter for throttle position
  get throttlePosition(): number {
    return this._throttlePosition
  }
  
  set throttlePosition(value: number) {
    this._throttlePosition = Math.max(-100, Math.min(100, value))
  }
  
  // Getter and setter for rudder position
  get rudderPosition(): number {
    return this._rudderPosition
  }
  
  set rudderPosition(value: number) {
    this._rudderPosition = Math.max(-100, Math.min(100, value))
  }
  
  // Getter for submarine mesh
  get mesh(): Mesh {
    return this.submarine
  }
  
  // Getter for position
  get position(): Vector3 {
    return this.submarine.position
  }
  
  // Setter for position
  set position(value: Vector3) {
    this.submarine.position = value
  }
} 