'use client'

import React, { useEffect, useState } from 'react'
import { Submarine } from '../submarine/Submarine'

interface SubmarineControlPanelProps {
  submarine?: Submarine
  onThrottleChange?: (value: number) => void
  onRudderChange?: (value: number) => void
  onBallastChange?: (value: number) => void
  onViewToggle?: () => void
}

export default function SubmarineControlPanel({
  submarine,
  onThrottleChange,
  onRudderChange,
  onBallastChange,
  onViewToggle
}: SubmarineControlPanelProps) {
  const [throttle, setThrottle] = useState(0)
  const [rudder, setRudder] = useState(0)
  const [ballast, setBallast] = useState(50)
  const [depth, setDepth] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [oxygen, setOxygen] = useState(100)
  const [fuel, setFuel] = useState(100)
  const [power, setPower] = useState(100)
  
  // Sync state with submarine instance if provided
  useEffect(() => {
    if (submarine) {
      setThrottle(submarine.throttlePosition)
      setRudder(submarine.rudderPosition)
      setBallast(submarine.ballastLevel)
    }
  }, [submarine])
  
  // Update every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (submarine) {
        // In a full implementation, we would get these values from the submarine
        setDepth(Math.abs(submarine.position.y))
        setSpeed(Math.abs(throttle / 10))
        
        // Simulate resource consumption
        const consumptionRate = Math.abs(throttle) / 1000
        setOxygen(prev => Math.max(0, prev - consumptionRate * 0.5))
        setFuel(prev => Math.max(0, prev - consumptionRate))
        setPower(prev => Math.max(0, prev - consumptionRate * 0.3))
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [submarine, throttle])
  
  // Handle control changes
  const handleThrottleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setThrottle(value)
    if (submarine) submarine.throttlePosition = value
    if (onThrottleChange) onThrottleChange(value)
  }
  
  const handleRudderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setRudder(value)
    if (submarine) submarine.rudderPosition = value
    if (onRudderChange) onRudderChange(value)
  }
  
  const handleBallastChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setBallast(value)
    if (submarine) submarine.ballastLevel = value
    if (onBallastChange) onBallastChange(value)
  }
  
  const handleViewToggle = () => {
    if (onViewToggle) onViewToggle()
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 bg-opacity-70 text-white p-4 flex flex-col">
      {/* Main control panel */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-center">
          <h3 className="text-xl font-bold">Depth</h3>
          <p className="text-2xl">{depth.toFixed(1)}m</p>
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-bold">Speed</h3>
          <p className="text-2xl">{speed.toFixed(1)} knots</p>
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-bold">Heading</h3>
          <p className="text-2xl">045°</p>
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-bold">Pitch</h3>
          <p className="text-2xl">0.0°</p>
        </div>
        
        <div className="flex gap-2">
          <div className="text-center">
            <h3 className="text-sm">O₂</h3>
            <div className="w-6 h-16 bg-gray-700 rounded-sm relative">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-sm transition-all duration-300"
                style={{ height: `${oxygen}%` }}
              />
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-sm">Fuel</h3>
            <div className="w-6 h-16 bg-gray-700 rounded-sm relative">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-yellow-500 rounded-sm transition-all duration-300"
                style={{ height: `${fuel}%` }}
              />
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-sm">Power</h3>
            <div className="w-6 h-16 bg-gray-700 rounded-sm relative">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-sm transition-all duration-300"
                style={{ height: `${power}%` }}
              />
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleViewToggle}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded"
        >
          Toggle View
        </button>
      </div>
      
      {/* Controls section */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="throttle" className="block mb-1">Throttle ({throttle}%)</label>
          <input
            id="throttle"
            type="range"
            min="-100"
            max="100"
            value={throttle}
            onChange={handleThrottleChange}
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="rudder" className="block mb-1">Rudder ({rudder}°)</label>
          <input
            id="rudder"
            type="range"
            min="-100"
            max="100"
            value={rudder}
            onChange={handleRudderChange}
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="ballast" className="block mb-1">Ballast ({ballast}%)</label>
          <input
            id="ballast"
            type="range"
            min="0"
            max="100"
            value={ballast}
            onChange={handleBallastChange}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Key controls help */}
      <div className="mt-2 text-xs text-gray-300">
        <p>Controls: W/S: Throttle | A/D: Rudder | Q/E: Ballast | Space: Surface | Tab: Toggle View</p>
      </div>
    </div>
  )
} 