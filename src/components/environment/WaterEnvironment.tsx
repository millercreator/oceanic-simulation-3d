'use client'

import { 
  Scene, 
  Vector3, 
  Color3, 
  StandardMaterial, 
  MeshBuilder, 
  Texture, 
  Mesh,
  DynamicTexture,
  PointLight
} from '@babylonjs/core'

export interface WaterEnvironmentProps {
  scene: Scene
  size?: number
  depth?: number
}

export class WaterEnvironment {
  private scene: Scene
  private waterSurface: Mesh
  private underwaterFog: boolean = true
  private size: number
  private depth: number

  constructor(props: WaterEnvironmentProps) {
    this.scene = props.scene
    this.size = props.size || 1000
    this.depth = props.depth || 1000
    
    this.createWaterSurface()
    this.createSeafloor()
    this.createUnderwaterFog()
    this.createUnderwaterLighting()
    this.createUnderwaterParticles()
  }

  private createWaterSurface(): void {
    // Create water material
    const waterMaterial = new StandardMaterial("waterMaterial", this.scene)
    waterMaterial.diffuseColor = new Color3(0, 0.3, 0.7)
    waterMaterial.alpha = 0.6
    waterMaterial.specularColor = new Color3(0.5, 0.5, 0.5)
    waterMaterial.emissiveColor = new Color3(0, 0.1, 0.2)
    
    // Add some simple animated texture for water surface
    try {
      // Create dynamic texture for simple water animation
      const textureResolution = 256
      const waterTexture = new DynamicTexture("waterTexture", textureResolution, this.scene)
      const textureContext = waterTexture.getContext()
      
      // Update water texture in render loop
      let time = 0
      this.scene.onBeforeRenderObservable.add(() => {
        time += 0.01
        textureContext.clearRect(0, 0, textureResolution, textureResolution)
        
        // Draw some simple wave patterns
        textureContext.fillStyle = "rgba(255, 255, 255, 0.2)"
        
        for (let i = 0; i < 10; i++) {
          const x = (Math.sin(time + i) * 0.5 + 0.5) * textureResolution
          const y = (Math.cos(time * 0.7 + i) * 0.5 + 0.5) * textureResolution
          const size = 5 + Math.sin(time * 0.3 + i) * 3
          
          textureContext.beginPath()
          textureContext.arc(x, y, size, 0, Math.PI * 2)
          textureContext.fill()
        }
        
        waterTexture.update()
      })
      
      waterMaterial.diffuseTexture = waterTexture
      waterMaterial.useAlphaFromDiffuseTexture = true
    } catch (e) {
      console.warn("Could not create dynamic water texture", e)
    }
    
    // Create water surface mesh
    this.waterSurface = MeshBuilder.CreateGround(
      "waterSurface",
      { width: this.size, height: this.size },
      this.scene
    )
    this.waterSurface.material = waterMaterial
    this.waterSurface.position.y = 0
  }

  private createSeafloor(): void {
    // Create seafloor material
    const seafloorMaterial = new StandardMaterial("seafloorMaterial", this.scene)
    seafloorMaterial.diffuseColor = new Color3(0.3, 0.2, 0.1)
    seafloorMaterial.specularColor = new Color3(0.1, 0.1, 0.1)
    
    // Create seafloor mesh
    const seafloor = MeshBuilder.CreateGround(
      "seafloor",
      { width: this.size, height: this.size, subdivisions: 50 },
      this.scene
    )
    
    // Add some randomness to the seafloor
    const vertexData = seafloor.getVerticesData("position")
    if (vertexData) {
      for (let i = 0; i < vertexData.length; i += 3) {
        if (i % 3 === 1) { // Only modify Y values
          // Add random height with some noise patterns
          const x = vertexData[i - 1]
          const z = vertexData[i + 1]
          
          // Simple noise function based on position
          const noise = 
            Math.sin(x * 0.1) * Math.cos(z * 0.1) * 5 +
            Math.sin(x * 0.01) * Math.cos(z * 0.01) * 20 +
            Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5
          
          vertexData[i] = noise - this.depth // Set depth below water
        }
      }
      seafloor.updateVerticesData("position", vertexData)
    }
    
    seafloor.material = seafloorMaterial
  }

  private createUnderwaterFog(): void {
    // Create underwater fog effect
    if (this.underwaterFog) {
      this.scene.fogMode = Scene.FOGMODE_EXP
      this.scene.fogColor = new Color3(0, 0.1, 0.2)
      this.scene.fogDensity = 0.01
    }
  }

  private createUnderwaterLighting(): void {
    // Create underwater lighting effects
    // Dim blue light from above (sunlight through water)
    const sunlight = new PointLight("sunlight", new Vector3(0, 10, 0), this.scene)
    sunlight.diffuse = new Color3(0.2, 0.3, 0.5)
    sunlight.intensity = 0.5
    
    // Ambient light for underwater scene
    this.scene.ambientColor = new Color3(0, 0.05, 0.1)
  }

  private createUnderwaterParticles(): void {
    // This would be implemented with a particle system
    // But for simplicity, we'll defer this implementation
    // Particles would represent floating debris, small organisms, etc.
  }

  /**
   * Updates water effects based on camera position (above/below water)
   * @param cameraPosition Current camera position
   */
  public update(cameraPosition: Vector3): void {
    const isUnderwater = cameraPosition.y < 0
    
    // Adjust fog density based on depth
    if (this.underwaterFog) {
      // Increase fog density as we go deeper
      const depthFactor = Math.min(1, Math.max(0, -cameraPosition.y / 100))
      this.scene.fogDensity = 0.005 + depthFactor * 0.03
    }
    
    // Set water surface transparency based on camera position
    const waterMaterial = this.waterSurface.material as StandardMaterial
    if (waterMaterial) {
      // Make water more transparent when underwater
      waterMaterial.alpha = isUnderwater ? 0.3 : 0.7
    }
  }
} 