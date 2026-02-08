import React, { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Float, Text } from '@react-three/drei'
import * as THREE from 'three'

// -- Constants
const MOUNTAIN_COLOR = '#475569'
const MOUNTAIN_ACCENT = '#94a3b8'
const STEP_COLOR = '#334155'
const STEP_ACTIVE_COLOR = '#fbbf24' // Selection/Next
const STEP_REACHED_COLOR = '#34d399' // Completed

function MountainMesh() {
    return (
        <group position={[0, -2, 0]}>
            {/* Main Peak */}
            <mesh position={[0, 2.5, 0]}>
                <coneGeometry args={[3, 5, 32]} /> {/* Smooth cone */}
                <meshStandardMaterial color={MOUNTAIN_COLOR} roughness={0.8} />
            </mesh>
            {/* Snow Cap */}
            <mesh position={[0, 3.8, 0]}>
                <coneGeometry args={[0.8, 1.2, 32]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
            </mesh>
        </group>
    )
}

function Staircase({ steps, doneCount }) {
    return (
        <group>
            {steps.map((step, index) => {
                const isCheckpoint = step.isCheckpoint;
                const isReached = step.checkpointIndex !== -1 && step.checkpointIndex < doneCount;
                const isNext = step.checkpointIndex === doneCount;

                // Determine color
                let color = STEP_COLOR;
                let emissive = '#000000';

                if (isCheckpoint) {
                    if (isReached) {
                        color = STEP_REACHED_COLOR;
                        emissive = '#059669';
                    } else if (isNext) {
                        color = STEP_ACTIVE_COLOR;
                        emissive = '#d97706';
                    }
                } else {
                    // Normal steps are just path color
                    if (step.overallIndex < (steps.find(s => s.checkpointIndex === doneCount)?.overallIndex || -1)) {
                        color = '#475569'; // Traveled path
                    }
                }

                return (
                    <mesh
                        key={index}
                        position={step.position}
                        rotation={step.rotation}
                        castShadow
                        receiveShadow
                    >
                        {/* Checkpoints are slightly larger platforms */}
                        <boxGeometry args={[isCheckpoint ? 0.8 : 0.5, 0.05, isCheckpoint ? 0.5 : 0.3]} />
                        <meshStandardMaterial
                            color={color}
                            emissive={emissive}
                            emissiveIntensity={0.5}
                            roughness={0.6}
                        />
                    </mesh>
                )
            })}
        </group>
    )
}

function CheckpointFlags({ steps, doneCount }) {
    // Filter out only checkpoints
    const checkpoints = steps.filter(s => s.isCheckpoint);

    return (
        <group>
            {checkpoints.map((cp, i) => {
                const isReached = cp.checkpointIndex < doneCount;
                if (!isReached) return null; // Only show flags for reached checkpoints

                return (
                    <group key={i} position={cp.position} rotation={cp.rotation}>
                        {/* Move flag slightly inward so it stands on the step */}
                        <group position={[-0.2, 0.25, 0]}>
                            <mesh position={[0, 0, 0]}>
                                <cylinderGeometry args={[0.02, 0.02, 0.5]} />
                                <meshStandardMaterial color="#cbd5e1" />
                            </mesh>
                            <mesh position={[0.15, 0.15, 0]} rotation={[0, 0, 0]}>
                                <boxGeometry args={[0.3, 0.2, 0.01]} />
                                <meshStandardMaterial color="#34d399" />
                            </mesh>
                        </group>
                    </group>
                )
            })}
        </group>
    )
}

function Climber({ position, rotation }) {
    // 3D Penguin / Character
    return (
        <group position={[position[0], position[1] + 0.05, position[2]]} rotation={rotation || [0, 0, 0]}>
            <group rotation={[0, 0, 0]}> {/* Face forward relative to path (Box Z is Tangent, Penguin faces Z) */}
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
                {/* Beak */}
                <mesh position={[0, 0.35, 0.1]} rotation={[0.2, 0, 0]}>
                    <coneGeometry args={[0.04, 0.1, 8]} />
                    <meshStandardMaterial color="#ea580c" />
                </mesh>
            </group>
        </group>
    )
}

// Hook to generate the spiral staircase path
function useStaircasePath(tasks) {
    return useMemo(() => {
        const generatedSteps = [];

        const startY = -2.0;
        const endY = 2.5; // Stop before the very pointy tip

        const baseRadius = 3.0; // At Y=-2

        // Function to get radius at world Y
        const getRadius = (y) => {
            // Linear interpolation
            // y goes from -2 to 3 (range 5)
            const t = (y - startY) / (3 - startY); // Normalised height relative to full cone
            return baseRadius * (1 - t);
        };

        const totalRotations = 3;
        const totalAngle = Math.PI * 2 * totalRotations;

        // Count tasks
        const taskCount = tasks.length;

        // Steps calculation
        const stepsPerRotation = 30;
        const totalSteps = Math.ceil(totalRotations * stepsPerRotation);

        for (let i = 0; i <= totalSteps; i++) {
            const t = i / totalSteps; // 0 to 1
            const angle = t * totalAngle;

            // Current height
            const y = startY + t * (endY - startY);
            const radius = getRadius(y);

            const x = Math.cos(angle) * (radius + 0.2); // Start slightly outside surface
            const z = Math.sin(angle) * (radius + 0.2);

            const position = [x, y, z];
            // Rotate to align with radial outward direction
            const rotation = [0, -angle, 0];

            generatedSteps.push({
                position,
                rotation,
                overallIndex: i,
                isCheckpoint: false,
                checkpointIndex: -1
            });
        }

        // Map checkpoints
        if (tasks.length > 0) {
            // Distribute checkpoints evenly
            for (let k = 0; k < tasks.length; k++) {
                // k=0 -> First checkpoint
                // k=N-1 -> Last checkpoint (Summit)
                const stepIndex = Math.floor(((k + 1) / tasks.length) * (generatedSteps.length - 1));

                if (generatedSteps[stepIndex]) {
                    generatedSteps[stepIndex].isCheckpoint = true;
                    generatedSteps[stepIndex].checkpointIndex = k;
                }
            }
        } else {
            // Checkpoint at the top for "Main Goal"
            const lastStep = generatedSteps[generatedSteps.length - 1];
            if (lastStep) {
                lastStep.isCheckpoint = true;
                lastStep.checkpointIndex = 0;
            }
        }

        return generatedSteps; // Array of step objects
    }, [tasks.length]);
}

function Scene({ tasks, goal }) {
    const steps = useStaircasePath(tasks);

    // Determine climber position
    const doneCount = tasks.filter(t => t.done).length;

    let targetStepIndex = 0;

    if (doneCount > 0) {
        // Find the step that corresponds to limiting checkpoint
        const checkpointStep = steps.find(s => s.checkpointIndex === doneCount - 1);
        if (checkpointStep) {
            targetStepIndex = checkpointStep.overallIndex;
        } else {
            targetStepIndex = steps.length - 1;
        }
    }

    const currentStep = steps[targetStepIndex] || steps[0];

    return (
        <group>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <MountainMesh />

            <Staircase steps={steps} doneCount={doneCount} />
            <CheckpointFlags steps={steps} doneCount={doneCount} />

            <Climber position={currentStep.position} rotation={currentStep.rotation} />

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
