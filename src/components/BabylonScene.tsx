'use client'

import { useEffect, useRef } from 'react'
import { 
  Engine, 
  Scene, 
  FreeCamera, 
  Vector3, 
  HemisphericLight, 
  MeshBuilder,
  Color3,
  StandardMaterial,
  CubeTexture,
  Texture,
  ShadowGenerator,
  DirectionalLight,
  Mesh,
  AbstractMesh,
  PhysicsImpostor
} from '@babylonjs/core'

export interface BabylonSceneProps {
  antialias?: boolean;
  engineOptions?: any;
  adaptToDeviceRatio?: boolean;
  sceneOptions?: any;
  onRender?: (scene: Scene) => void;
  onSceneReady?: (scene: Scene) => void;
}

export default function BabylonScene(props: BabylonSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const { 
    antialias = true, 
    engineOptions, 
    adaptToDeviceRatio = true, 
    sceneOptions = {}, 
    onRender,
    onSceneReady 
  } = props

  useEffect(() => {
    if (!canvasRef.current) return
    
    // Create engine
    const engine = new Engine(canvasRef.current, antialias, engineOptions, adaptToDeviceRatio)
    
    // Create scene
    const scene = new Scene(engine, sceneOptions)
    
    // Always create a default camera first to avoid "No camera defined" error
    const defaultCamera = new FreeCamera('defaultCamera', new Vector3(0, 5, -10), scene)
    defaultCamera.setTarget(Vector3.Zero())
    defaultCamera.attachControl(canvasRef.current, true)
    
    // Setup default scene if onSceneReady not provided
    if (typeof onSceneReady === 'function') {
      onSceneReady(scene)
    } else {
      // Default scene setup
      // Camera is already created above
      
      // Create light
      const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
      light.intensity = 0.7
      
      // Create simple water-like plane
      const waterMaterial = new StandardMaterial("waterMaterial", scene)
      waterMaterial.diffuseColor = new Color3(0, 0.5, 0.8)
      waterMaterial.alpha = 0.8
      waterMaterial.specularColor = new Color3(0.2, 0.2, 0.2)
      
      const waterPlane = MeshBuilder.CreateGround("waterPlane", {width: 100, height: 100}, scene)
      waterPlane.material = waterMaterial
      
      // Create a simple submarine mesh
      const subMaterial = new StandardMaterial("subMaterial", scene)
      subMaterial.diffuseColor = new Color3(0.8, 0.3, 0.1)
      
      const sub = MeshBuilder.CreateCapsule("submarine", {
        radius: 1,
        height: 3,
        orientation: Vector3.Right()
      }, scene)
      sub.material = subMaterial
      sub.position.y = 2
    }
    
    // Ensure there's an active camera before rendering
    if (!scene.activeCamera) {
      console.warn("No active camera was set. Using the default camera.")
      scene.activeCamera = scene.cameras[0];
    }
    
    // Run render loop
    engine.runRenderLoop(() => {
      if (typeof onRender === 'function') {
        onRender(scene)
      }
      
      // Double check there's an active camera before rendering
      if (scene.activeCamera) {
        scene.render()
      } else {
        console.error("No camera defined for scene. Cannot render.")
      }
    })
    
    // Handle window resize
    const handleResize = () => {
      engine.resize()
    }
    
    window.addEventListener('resize', handleResize)
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize)
      engine.dispose()
    }
  }, [antialias, engineOptions, adaptToDeviceRatio, sceneOptions, onRender, onSceneReady])
  
  return <canvas ref={canvasRef} style={{width: '100%', height: '100vh'}} />
} 