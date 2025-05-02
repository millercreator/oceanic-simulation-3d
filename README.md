# Oceanic Simulation 3D

An immersive underwater submarine exploration simulation built with Next.js and Babylon.js. Experience realistic submarine physics, water environments, and the challenges of navigating the mysterious depths of a vast procedurally generated ocean.

## Features

- Realistic submarine physics with momentum, inertia, and buoyancy
- Immersive underwater environment with dynamic water effects
- First-person (cockpit) and third-person viewing modes
- Resource management (oxygen, fuel, power)
- Intuitive submarine controls with keyboard and UI panels
- Scalable Entity Component System architecture

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [Babylon.js](https://www.babylonjs.com/) - 3D engine
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [TailwindCSS](https://tailwindcss.com/) - Styling

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd oceanic-simulation-3d
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Controls

- **W/S**: Forward/backward throttle
- **A/D**: Rudder left/right
- **Q/E**: Ballast control (sink/rise)
- **Space**: Emergency surface
- **Tab**: Toggle between first-person and third-person views

## Project Structure

- `/src/components`: React components
  - `/submarine`: Submarine-related components
  - `/environment`: Water and environment components
  - `/ui`: User interface components
- `/src/systems`: Game systems (physics, events, state)
- `/src/utils`: Utility functions
- `/src/shaders`: Custom GLSL shaders (for advanced water effects)
- `/src/assets`: 3D models, textures, and audio files

## License

MIT
