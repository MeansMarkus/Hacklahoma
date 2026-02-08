import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars, Float, Text, useTexture, Detailed } from '@react-three/drei'
import * as THREE from 'three'


// -- Asset / Logic Imports (We'll reuse logic or adapt it)
// We might need to map the 2D points to 3D. 
// For now, let's create a visual representation that looks like the mountain.

// -- Constants
const MOUNTAIN_COLOR = '#475569'
const MOUNTAIN_ACCENT = '#94a3b8'
const PATH_COLOR = '#fbbf24'

function MountainMesh() {
    // A simple cone or custom geometry for the mountain
    // We'll use a displuced cone for a low-poly look
    return (
        <group position={[0, -2, 0]}>
            {/* Main Peak */}
            <mesh position={[0, 2.5, 0]}>
                <coneGeometry args={[3, 5, 4]} /> {/* Pyramid shape */}
                <meshStandardMaterial color={MOUNTAIN_COLOR} roughness={0.8} />
            </mesh>
            {/* Secondary Peak */}
            <mesh position={[2, 1, 1]}>
                <coneGeometry args={[2, 3, 4]} />
                <meshStandardMaterial color={MOUNTAIN_ACCENT} roughness={0.8} />
            </mesh>
            {/* Snow Cap */}
            <mesh position={[0, 3.8, 0]}>
                <coneGeometry args={[0.8, 1.2, 4]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
            </mesh>
        </group>
    )
}

function Ledge({ position, reached, isNext }) {
    // A platform for each task
    return (
        <group position={position}>
            <mesh>
                <boxGeometry args={[0.4, 0.05, 0.4]} />
                <meshStandardMaterial
                    color={reached ? '#34d399' : (isNext ? '#fbbf24' : '#1e293b')}
                    emissive={reached ? '#059669' : (isNext ? '#d97706' : '#000000')}
                    emissiveIntensity={0.5}
                />
            </mesh>
            {/* Pole/Flag placeholder */}
            {reached && (
                <mesh position={[0, 0.25, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.5]} />
                    <meshStandardMaterial color="#cbd5e1" />
                </mesh>
            )}
        </group>
    )
}

function Climber({ position }) {
    // 3D Penguin / Character
    return (
        <group position={[position[0], position[1] + 0.2, position[2]]}>
            {/* Body */}
            <mesh position={[0, 0.2, 0]}>
                <capsuleGeometry args={[0.1, 0.2, 4, 8]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Belly */}
            <mesh position={[0, 0.18, 0.08]} scale={[0.8, 0.6, 0.5]}>
                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial color="white" />
            </mesh>
            {/* Head/Beak hints would go here */}
            <mesh position={[0, 0.35, 0.08]} rotation={[0.2, 0, 0]}>
                <coneGeometry args={[0.04, 0.1, 8]} />
                <meshStandardMaterial color="#ea580c" />
            </mesh>
        </group>
    )
}

// Map the list of tasks to positions on the mountain
function useTaskPositions(count) {
    return useMemo(() => {
        const pos = []
        // Spiral path up the mountain
        // Radius decreases as height increases
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1 || 1)
            const angle = t * Math.PI * 4 + Math.PI // 2 full turns
            const height = -1.5 + (t * 5) // Height from -2 to 3
            const radius = 2.5 * (1 - t) + 0.5 // Radius shrinks

            const x = Math.cos(angle) * radius
            const z = Math.sin(angle) * radius
            pos.push([x, height, z])
        }
        return pos
    }, [count])
}

function Scene({ tasks, goal }) {
    const positions = useTaskPositions(tasks.length > 0 ? tasks.length : 5)

    // Determine climber position (lerp between completed tasks)
    const doneCount = tasks.filter(t => t.done).length
    const total = tasks.length

    // Ideally we lerp the climber content. For now snap to latest done or start.
    const climberIndex = Math.max(0, doneCount - 1)
    const nextIndex = doneCount < total ? doneCount : -1

    // For smoother climber visual, maybe define precise climber pos
    const climberPos = positions[Math.min(doneCount, positions.length - 1)] || [0, -2, 2]

    return (
        <group>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <MountainMesh />

            {positions.map((pos, i) => (
                <Ledge
                    key={i}
                    position={pos}
                    reached={i < doneCount}
                    isNext={i === doneCount}
                />
            ))}

            <Climber position={climberPos} />

            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <Text
                    position={[0, 4.5, 0]}
                    fontSize={0.5}
                    color="#f1f5f9"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    {goal || "Summit"}
                </Text>
            </Float>

            {/* Orbit controls limited to keep mountain in view */}
            <OrbitControls
                enablePan={false}
                minDistance={5}
                maxDistance={15}
                maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
                autoRotate={false}
            />
        </group>
    )
}

export default function Mountain3D({ goal, tasks, onPhotoUpdate }) {
    return (
        <div className="absolute inset-0 z-0" style={{ width: '100%', height: '100%', background: '#0a0a15' }}>
            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2, 8], fov: 50 }}>
                <color attach="background" args={['#0f172a']} />
                <Scene tasks={tasks} goal={goal} />
            </Canvas>
        </div>
    )
}
