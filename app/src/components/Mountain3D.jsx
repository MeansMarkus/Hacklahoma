import React, { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, Text, Outlines, Billboard } from '@react-three/drei'
import * as THREE from 'three'

// -- Constants
const MOUNTAIN_COLOR = '#60a5fa' // Lighter Cartoon Blue
const MOUNTAIN_ACCENT = '#bfdbfe'
const STEP_COLOR = '#8B4513' // SaddleBrown
const STEP_ACTIVE_COLOR = '#facc15' // Cartoon Yellow
const STEP_REACHED_COLOR = '#4ade80' // Cartoon Green

function MountainMesh() {
    const { geometry, material } = useMemo(() => {
        // High segment for smooth outlines/toon curves
        const geo = new THREE.ConeGeometry(3, 5, 128, 64);

        const posAttribute = geo.getAttribute('position');
        const vertex = new THREE.Vector3();
        const colors = [];

        const colorBase = new THREE.Color(MOUNTAIN_COLOR);
        const colorSnow = new THREE.Color('#ffffff'); // Pure white
        const colorShadow = new THREE.Color('#2563eb'); // Dark Blue Shadow

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);

            // Cartoon displacement: Soft, large waves. No jagged noise.
            const angle = Math.atan2(vertex.z, vertex.x);
            // Simple curvy distortion
            const wave = Math.sin(angle * 5) * 0.15 + Math.cos(vertex.y * 2.0) * 0.1;

            const radius = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
            if (radius > 0.1) {
                // Taper effect + wave
                const factor = 1 + wave * (1.0 - (vertex.y + 2.5) / 5.0 * 0.5);
                vertex.x *= factor;
                vertex.z *= factor;
            }

            // Write back
            posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);

            // Cartoon Color Logic: Sharp Bands
            const snowThreshold = 1.0 + Math.sin(angle * 3) * 0.2;

            let finalColor;
            if (vertex.y > snowThreshold) {
                finalColor = colorSnow;
            } else {
                if (vertex.y < -1.0) {
                    finalColor = colorShadow;
                } else {
                    finalColor = colorBase;
                }
            }
            colors.push(finalColor.r, finalColor.g, finalColor.b);
        }

        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geo.computeVertexNormals();

        const mat = new THREE.MeshToonMaterial({
            vertexColors: true,
        });

        return { geometry: geo, material: mat };
    }, []);

    return (
        <group position={[0, -2, 0]}>
            <mesh geometry={geometry} material={material} position={[0, 2.5, 0]} castShadow receiveShadow>
                <Outlines thickness={0.05} color="#1e1b4b" />
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
                        color = '#b45309'; // Traveled path (darker wood)
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

// Animated Climber Component - Detailed Penguin
function Climber({ steps, targetIndex, controlsRef, isLocked }) {
    const groupRef = React.useRef();
    const bodyRef = React.useRef();
    const leftWingRef = React.useRef();
    const rightWingRef = React.useRef();

    // Track current position as a float index along the steps array
    const currentIndex = React.useRef(0);

    useFrame((state, delta) => {
        if (!steps || steps.length === 0) return;

        // Smoothly interpolate current index to target index
        const speed = 2.0; // Steps per second
        const diff = targetIndex - currentIndex.current;

        // If difference is small, snap to target
        if (Math.abs(diff) < 0.05) {
            currentIndex.current = targetIndex;
        } else {
            // Move towards target
            const move = Math.sign(diff) * Math.min(Math.abs(diff), speed * delta * 15); // Adjust multiplier for desired speed
            currentIndex.current += move;
        }

        // Calculate Position and Rotation based on intermediate index
        const idxString = Math.floor(currentIndex.current);
        const idxNext = Math.min(idxString + 1, steps.length - 1);
        const fraction = currentIndex.current - idxString;

        const stepA = steps[Math.max(0, Math.min(idxString, steps.length - 1))];
        const stepB = steps[Math.max(0, Math.min(idxNext, steps.length - 1))];

        if (!stepA || !stepB) return;

        // Lerp position
        const posA = new THREE.Vector3(...stepA.position);
        const posB = new THREE.Vector3(...stepB.position);
        const currentPos = posA.lerp(posB, fraction);

        // Helper to lerp rotation (Euler) roughly
        // Ideally we use Quaternions but for simple Y-rotation this works if no wrapping issues
        const rotA = stepA.rotation[1];
        let rotB = stepB.rotation[1];

        // Handle wrapping? The spiral just rotates continuously, so typical linear lerp on Y is fine 
        // unless it crosses PI/-PI boundary weirdly.
        // Given the generation logic "rotation = [0, -angle, 0]", angle increases monotonically. 
        // But -angle decreases monotonically. No wrapping jump issues usually.
        const currentRotY = rotA + (rotB - rotA) * fraction;

        // Apply to group
        if (groupRef.current) {
            groupRef.current.position.set(currentPos.x, currentPos.y + 0.05, currentPos.z);
            groupRef.current.rotation.set(0, currentRotY, 0);

            // Camera Tracking ONLY if locked
            if (isLocked && controlsRef && controlsRef.current) {
                // Look slightly above the penguin's feet
                const lookAtPos = new THREE.Vector3(currentPos.x, currentPos.y + 0.5, currentPos.z);
                controlsRef.current.target.lerp(lookAtPos, 0.1);

                // Orbital Camera Movement
                // Calculate angle of penguin relative to center (0,0)
                const angle = Math.atan2(currentPos.x, currentPos.z);

                // Desired camera position: offset by radius + distance, at the same angle
                const dist = 8; // Distance from center
                const heightOffset = 2; // Height relative to penguin

                // We want the camera to be "behind" and "outward" or just "outward"
                // Let's place it at the same angle to look AT the mountain face the penguin is on
                const camX = Math.sin(angle) * dist;
                const camZ = Math.cos(angle) * dist;
                const camY = currentPos.y + heightOffset;

                const desiredCamPos = new THREE.Vector3(camX, camY, camZ);
                state.camera.position.lerp(desiredCamPos, 0.05);

                controlsRef.current.update();
            } else if (!isLocked && controlsRef && controlsRef.current) {
                // In free mode, we don't force camera position, but we might want to ensure controls are usable
                // (OrbitControls handles itself)
            }
        }

        // Waddle Animation
        if (Math.abs(diff) > 0.05) {
            // Walking
            const time = state.clock.elapsedTime * 15;
            const waddle = Math.sin(time) * 0.1;
            const bounce = Math.abs(Math.cos(time)) * 0.05;

            if (bodyRef.current) {
                bodyRef.current.rotation.z = waddle;
                bodyRef.current.position.y = bounce;
            }
        } else {
            // Idle breathing
            const time = state.clock.elapsedTime * 2;
            const breathe = Math.sin(time) * 0.01;
            if (bodyRef.current) {
                bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, 0, 0.1);
                bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, breathe, 0.1);
            }
        }
    });

    return (
        <group ref={groupRef}>
            <group ref={bodyRef}>
                <group rotation={[0, 0, 0]}> {/* Face forward relative to path */}

                    {/* -- DETAILED PENGUIN MESH -- */}

                    {/* Main Body (Egg-ish) */}
                    <mesh position={[0, 0.25, 0]} scale={[1, 1.3, 1]}>
                        <sphereGeometry args={[0.16, 32, 32]} />
                        <meshToonMaterial color="#1a1a1a" />
                    </mesh>

                    {/* Belly (White Patch) */}
                    <mesh position={[0, 0.22, 0.12]} scale={[0.9, 1.1, 0.5]}>
                        <sphereGeometry args={[0.13, 32, 32]} />
                        <meshToonMaterial color="white" />
                    </mesh>

                    {/* Head */}
                    <mesh position={[0, 0.48, 0]}>
                        <sphereGeometry args={[0.11, 32, 32]} />
                        <meshToonMaterial color="#1a1a1a" />
                    </mesh>

                    {/* Eyes */}
                    <group position={[0, 0.48, 0.09]}>
                        {/* Left Eye */}
                        <mesh position={[-0.04, 0.02, 0]}>
                            <sphereGeometry args={[0.03]} />
                            <meshToonMaterial color="white" />
                        </mesh>
                        <mesh position={[-0.04, 0.02, 0.025]}>
                            <sphereGeometry args={[0.01]} />
                            <meshStandardMaterial color="black" />
                        </mesh>

                        {/* Right Eye */}
                        <mesh position={[0.04, 0.02, 0]}>
                            <sphereGeometry args={[0.03]} />
                            <meshToonMaterial color="white" />
                        </mesh>
                        <mesh position={[0.04, 0.02, 0.025]}>
                            <sphereGeometry args={[0.01]} />
                            <meshStandardMaterial color="black" />
                        </mesh>
                    </group>

                    {/* Beak */}
                    <mesh position={[0, 0.46, 0.11]} rotation={[0.2, 0, 0]}>
                        <coneGeometry args={[0.03, 0.08, 16]} />
                        <meshToonMaterial color="#f97316" />
                    </mesh>

                    {/* Wings */}
                    <group position={[-0.14, 0.35, 0]} ref={leftWingRef}>
                        <mesh position={[0, -0.1, 0]} rotation={[0, 0, 0.2]} scale={[0.2, 1, 0.5]}>
                            <sphereGeometry args={[0.12]} />
                            <meshToonMaterial color="#1a1a1a" />
                        </mesh>
                    </group>
                    <group position={[0.14, 0.35, 0]} ref={rightWingRef}>
                        <mesh position={[0, -0.1, 0]} rotation={[0, 0, -0.2]} scale={[0.2, 1, 0.5]}>
                            <sphereGeometry args={[0.12]} />
                            <meshToonMaterial color="#1a1a1a" />
                        </mesh>
                    </group>

                    {/* Feet */}
                    <group position={[0, 0.05, 0]}>
                        <mesh position={[-0.08, 0, 0.05]}>
                            <boxGeometry args={[0.08, 0.03, 0.12]} />
                            <meshToonMaterial color="#f97316" />
                        </mesh>
                        <mesh position={[0.08, 0, 0.05]}>
                            <boxGeometry args={[0.08, 0.03, 0.12]} />
                            <meshToonMaterial color="#f97316" />
                        </mesh>
                    </group>
                </group>
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

            const x = Math.cos(angle) * (radius + 0.6); // Start slightly outside surface
            const z = Math.sin(angle) * (radius + 0.6);

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

function Scene({ tasks, goal, isLocked }) {
    const controlsRef = useRef()
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
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <MountainMesh />

            <Staircase steps={steps} doneCount={doneCount} />
            <CheckpointFlags steps={steps} doneCount={doneCount} />

            <Climber steps={steps} targetIndex={targetStepIndex} controlsRef={controlsRef} isLocked={isLocked} />

            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <Billboard
                    follow={true}
                    lockX={false}
                    lockY={false}
                    lockZ={false} // Lock the rotation on the z axis (default=false)
                >
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
                </Billboard>
            </Float>

            {/* Orbit controls limited to keep mountain in view */}
            <OrbitControls
                ref={controlsRef}
                enablePan={false}
                minDistance={5}
                maxDistance={15}
                maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
                autoRotate={!isLocked} // Auto rotate in free mode for fun? Or just false. Let's keep false.
                autoRotateSpeed={0.5}
            />
        </group>
    )
}

export default function Mountain3D({ goal, tasks, onPhotoUpdate }) {
    const [isLocked, setIsLocked] = useState(true);

    return (
        <div className="absolute inset-0 z-0" style={{ width: '100%', height: '100%', background: '#0a0a15' }}>
            {/* Camera Toggle Button */}
            <button
                onClick={() => setIsLocked(!isLocked)}
                className="absolute bottom-6 left-6 z-10 px-4 py-2 bg-slate-800/80 text-white rounded-full 
                           backdrop-blur-sm border border-slate-600 hover:bg-slate-700 transition-colors
                           font-semibold text-sm shadow-lg flex items-center gap-2"
            >
                {isLocked ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-400">
                            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                        </svg>
                        Tracking Climber
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-sky-400">
                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 8.201 2.372 9.336 6.404.336.884.062 1.834-.664 2.186A10.004 10.004 0 0110 17c-4.257 0-8.201-2.372-9.336-6.41zM3.5 10a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" clipRule="evenodd" />
                        </svg>
                        Free View
                    </>
                )}
            </button>

            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2, 8], fov: 50 }}>
                <color attach="background" args={['#0f172a']} />
                <Scene tasks={tasks} goal={goal} isLocked={isLocked} />
            </Canvas>
        </div>
    )
}
