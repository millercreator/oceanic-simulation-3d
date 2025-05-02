'use client'

import { useEffect, useRef, useState } from 'react'
import { 
  Scene, 
  Vector3, 
  ArcRotateCamera, 
  FreeCamera,
  KeyboardEventTypes,
  Quaternion 
} from '@babylonjs/core'
import BabylonScene from './BabylonScene'
import { Submarine } from './submarine/Submarine'
import { WaterEnvironment } from './environment/WaterEnvironment'
import SubmarineControlPanel from './ui/SubmarineControlPanel'
import { PhysicsSystem } from '../systems/PhysicsSystem'
import { eventBus } from '../systems/EventBus'
import { GameState, gameStateMachine } from '../systems/GameStateMachine'

// Define camera modes
enum CameraMode {
  FIRST_PERSON,
  THIRD_PERSON
}

export default function OceanSimulation() {
  // References to key objects
  const sceneRef = useRef<Scene | null>(null)
  const submarineRef = useRef<Submarine | null>(null)
  const waterEnvironmentRef = useRef<WaterEnvironment | null>(null)
  const physicsSystemRef = useRef<PhysicsSystem | null>(null)
  
  // Camera state
  const [cameraMode, setCameraMode] = useState<CameraMode>(CameraMode.THIRD_PERSON)

  // Function to handle scene setup
  const handleSceneReady = async (scene: Scene) => {
    sceneRef.current = scene
    
    // Ensure there's a default camera (though BabylonScene already creates one)
    if (scene.cameras.length === 0) {
      const defaultCamera = new FreeCamera("defaultCamera", new Vector3(0, 5, -10), scene);
      defaultCamera.setTarget(Vector3.Zero());
      scene.activeCamera = defaultCamera;
    }
    
    // Setup physics system with error handling
    try {
      const physicsSystem = new PhysicsSystem(scene, {
        gravity: new Vector3(0, -0.5, 0), // Reduced gravity for underwater
        useHavok: true
      });
      
      const physicsInitialized = await physicsSystem.initialize();
      if (physicsInitialized) {
        console.log("Physics system initialized successfully");
        physicsSystem.addWaterPhysics(0); // Water level at Y=0
        physicsSystemRef.current = physicsSystem;
      } else {
        console.warn("Physics system initialization failed, continuing without physics");
      }
    } catch (e) {
      console.error("Error setting up physics system:", e);
      // Continue without physics
    }
    
    // Create water environment
    try {
      const waterEnvironment = new WaterEnvironment({
        scene,
        size: 1000,
        depth: 100
      });
      waterEnvironmentRef.current = waterEnvironment;
    } catch (e) {
      console.error("Error creating water environment:", e);
    }
    
    // Create submarine
    try {
      const submarine = new Submarine({
        scene,
        position: new Vector3(0, -5, 0) // Start slightly below the surface
      });
      submarineRef.current = submarine;
    } catch (e) {
      console.error("Error creating submarine:", e);
    }
    
    // Setup camera based on mode
    try {
      setupCamera(scene);
    } catch (e) {
      console.error("Error setting up camera:", e);
      // Fallback to default camera
      const defaultCamera = scene.cameras.find(c => c.name === "defaultCamera");
      if (defaultCamera) {
        scene.activeCamera = defaultCamera;
      }
    }
    
    // Setup keyboard controls
    try {
      setupKeyboardControls(scene);
    } catch (e) {
      console.error("Error setting up keyboard controls:", e);
    }
    
    // Change game state to PLAYING
    gameStateMachine.changeState(GameState.PLAYING);
  }
  
  // Function to set up the camera
  const setupCamera = (scene: Scene) => {
    // Remove any existing cameras except the default one
    const defaultCamera = scene.cameras.find(c => c.name === "defaultCamera");
    scene.cameras.forEach(camera => {
      if (camera !== defaultCamera && camera.name !== "defaultCamera") {
        camera.dispose();
      }
    });
    
    if (!submarineRef.current) {
      console.warn("Submarine not available for camera setup, using default camera");
      return;
    }
    
    let newCamera;
    
    if (cameraMode === CameraMode.FIRST_PERSON) {
      // First person (cockpit) view
      newCamera = new FreeCamera("firstPersonCamera", new Vector3(0, 0.5, 0), scene)
      newCamera.fov = 1.0 // Narrower FOV for submarine viewport
      newCamera.minZ = 0.1
      newCamera.parent = submarineRef.current.mesh
      newCamera.rotationQuaternion = Quaternion.Identity()
    } else {
      // Third person view
      newCamera = new ArcRotateCamera(
        "thirdPersonCamera",
        Math.PI, // Alpha
        Math.PI / 3, // Beta
        15, // Radius
        submarineRef.current.position,
        scene
      )
      newCamera.lowerRadiusLimit = 5
      newCamera.upperRadiusLimit = 50
      
      try {
        const canvas = scene.getEngine().getRenderingCanvas();
        if (canvas) {
          newCamera.attachControl(canvas, true);
        }
      } catch (e) {
        console.warn("Could not attach camera control to canvas:", e);
      }
      
      newCamera.lockedTarget = submarineRef.current.mesh
    }
    
    // Set as active camera
    scene.activeCamera = newCamera;
    
    // Ensure we have a valid active camera
    if (!scene.activeCamera) {
      console.error("Failed to set active camera");
      // Fallback to default camera if available
      if (defaultCamera) {
        scene.activeCamera = defaultCamera;
      }
    }
  }
  
  // Function to handle keyboard controls
  const setupKeyboardControls = (scene: Scene) => {
    scene.onKeyboardObservable.add((kbInfo) => {
      if (!submarineRef.current) return
      
      const submarine = submarineRef.current
      
      if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
        switch (kbInfo.event.key) {
          case 'w': // Throttle forward
            submarine.throttlePosition += 5
            break
          case 's': // Throttle backward
            submarine.throttlePosition -= 5
            break
          case 'a': // Rudder left
            submarine.rudderPosition -= 5
            break
          case 'd': // Rudder right
            submarine.rudderPosition += 5
            break
          case 'q': // Ballast tanks fill (sink)
            submarine.ballastLevel += 5
            break
          case 'e': // Ballast tanks empty (rise)
            submarine.ballastLevel -= 5
            break
          case ' ': // Emergency surface
            submarine.ballastLevel = 0 // Empty ballast tanks
            break
          case 'Tab': // Toggle camera view
            setCameraMode(prevMode => 
              prevMode === CameraMode.FIRST_PERSON 
                ? CameraMode.THIRD_PERSON 
                : CameraMode.FIRST_PERSON
            )
            break
        }
      }
    })
  }
  
  // Function to handle scene rendering
  const handleSceneRender = (scene: Scene) => {
    // Ensure we have an active camera
    if (!scene.activeCamera) {
      console.warn("No active camera in render loop, attempting to restore");
      setupCamera(scene);
      return;
    }
    
    const deltaTime = scene.getEngine().getDeltaTime() / 1000
    
    // Update submarine with error handling
    if (submarineRef.current) {
      try {
        submarineRef.current.update(deltaTime);
      } catch (e) {
        console.warn("Error updating submarine:", e);
      }
    }
    
    // Update water environment with error handling
    if (waterEnvironmentRef.current && scene.activeCamera) {
      try {
        waterEnvironmentRef.current.update(scene.activeCamera.position);
      } catch (e) {
        console.warn("Error updating water environment:", e);
      }
    }
    
    // Update game state machine
    try {
      gameStateMachine.update(deltaTime);
    } catch (e) {
      console.warn("Error updating game state machine:", e);
    }
  }
  
  // Update camera when camera mode changes
  useEffect(() => {
    if (sceneRef.current) {
      try {
        setupCamera(sceneRef.current);
      } catch (e) {
        console.error("Error updating camera mode:", e);
      }
    }
  }, [cameraMode])
  
  // Handle view toggle from UI
  const handleViewToggle = () => {
    setCameraMode(prevMode => 
      prevMode === CameraMode.FIRST_PERSON 
        ? CameraMode.THIRD_PERSON 
        : CameraMode.FIRST_PERSON
    )
  }
  
  return (
    <div className="w-full h-screen relative">
      <BabylonScene
        antialias={true}
        onSceneReady={handleSceneReady}
        onRender={handleSceneRender}
      />
      <SubmarineControlPanel 
        submarine={submarineRef.current}
        onViewToggle={handleViewToggle}
      />
    </div>
  )
} 