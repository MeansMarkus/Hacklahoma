import React, { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, Text, Outlines, Billboard, Html, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// -- Constants
const TIME_THEMES = {
    day: {
        skyKey: 'day',
        textColor: '#1e293b',
        ambient: 0.9,
        directional: 1.2,
        directionalColor: '#fff4dc',
        directionalPosition: [8, 10, 6],
        stars: 0,
        fog: { color: '#cfe8ff', near: 120, far: 220 },
        mountain: {
            base: '#7fb0d8',
            shadow: '#5a86ad',
            snow: '#f6f7fb',
        },
        steps: {
            base: '#94a3b8', // Slate 400 - Stone
            traveled: '#64748b', // Slate 500
            active: '#fcd34d', // Amber 300
            reached: '#86efac', // Green 300
            emissiveActive: '#fbbf24',
            emissiveReached: '#4ade80',
        },
    },
    sunset: {
        skyKey: 'sunset',
        textColor: '#f8e7d3',
        ambient: 0.55,
        directional: 1.05,
        directionalColor: '#f7b56e',
        directionalPosition: [-6, 4, 6],
        stars: 700,
        fog: { color: '#3a2b3f', near: 7, far: 22 },
        mountain: {
            base: '#6f7f97',
            shadow: '#485368',
            snow: '#f1e3d0',
        },
        steps: {
            base: '#a8a29e', // Stone warm gray
            traveled: '#78716c', // Darker warm gray
            active: '#fbbf24',
            reached: '#fdba74',
            emissiveActive: '#f59e0b',
            emissiveReached: '#fb923c',
        },
        climberLight: { intensity: 0.35, color: '#fbd0a1' },
    },
    night: {
        skyKey: 'night',
        textColor: '#dbe4f3',
        ambient: 0.35,
        directional: 0.8,
        directionalColor: '#a5c4ff',
        directionalPosition: [6, 8, -4],
        stars: 2200,
        fog: { color: '#0b1124', near: 6, far: 20 },
        mountain: {
            base: '#2f3a52',
            shadow: '#1a2235',
            snow: '#cfd8e6',
        },
        steps: {
            base: '#475569', // Slate 600
            traveled: '#334155', // Slate 700
            active: '#60a5fa',
            reached: '#34d399',
            emissiveActive: '#3b82f6',
            emissiveReached: '#10b981',
        },
        climberLight: { intensity: 0.45, color: '#c7dbff' },
    },
}

function MountainMesh({ theme }) {
    const { geometry, material } = useMemo(() => {
        // High segment for smooth outlines/toon curves
        const geo = new THREE.ConeGeometry(3, 5, 128, 64);

        const posAttribute = geo.getAttribute('position');
        const vertex = new THREE.Vector3();
        const colors = [];

        const colorBase = new THREE.Color(theme.mountain.base);
        const colorSnow = new THREE.Color(theme.mountain.snow);
        const colorShadow = new THREE.Color(theme.mountain.shadow);

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
    }, [theme.mountain.base, theme.mountain.shadow, theme.mountain.snow]);

    return (
        <group position={[0, -2, 0]}>
            <mesh geometry={geometry} material={material} position={[0, 2.5, 0]} castShadow receiveShadow>
                <Outlines thickness={0.05} color="#1e1b4b" />
            </mesh>
        </group>
    )
}

function Staircase({ steps, doneCount, theme }) {
    return (
        <group>
            {steps.map((step, index) => {
                const isCheckpoint = step.isCheckpoint;
                const isReached = step.checkpointIndex !== -1 && step.checkpointIndex < doneCount;
                const isNext = step.checkpointIndex === doneCount;

                // Determine color
                let color = theme.steps.base;
                let emissive = '#000000';

                if (isCheckpoint) {
                    if (isReached) {
                        color = theme.steps.reached;
                        emissive = theme.steps.emissiveReached;
                    } else if (isNext) {
                        color = theme.steps.active;
                        emissive = theme.steps.emissiveActive;
                    }
                } else {
                    // Normal steps are just path color
                    if (step.overallIndex < (steps.find(s => s.checkpointIndex === doneCount)?.overallIndex || -1)) {
                        color = theme.steps.traveled; // Traveled path (darker wood)
                    }
                }

                return (
                    <group
                        key={index}
                        position={step.position}
                        rotation={step.rotation}
                    >
                        <RoundedBox
                            args={step.dims || [0.5, 0.05, 0.3]}
                            radius={0.02}
                            smoothness={4}
                            castShadow
                            receiveShadow
                        >
                            <meshToonMaterial
                                color={color}
                                emissive={emissive}
                                emissiveIntensity={0.4}
                            />
                            <Outlines thickness={0.02} color={theme.mountain.shadow} />
                        </RoundedBox>
                    </group>
                )
            })}
        </group>
    )
}

function CheckpointFlags({ steps, doneCount, tasks, activeFlagIndex, onFlagHover }) {
    // Filter out only checkpoints
    const checkpoints = steps.filter(s => s.isCheckpoint);

    // We use the parent's activeFlagIndex (for tour) or internal logic?
    // Let's use the one passed from parent which combines hover and tour.

    return (
        <group>
            {checkpoints.map((cp, i) => {
                const isReached = cp.checkpointIndex < doneCount;
                if (!isReached) return null; // Only show flags for reached checkpoints

                const task = tasks && tasks[cp.checkpointIndex]; // Get associated task

                return (
                    <group
                        key={i}
                        position={cp.position}
                        rotation={cp.rotation}
                        onPointerOver={(e) => { e.stopPropagation(); onFlagHover(i); }}
                        onPointerOut={(e) => { e.stopPropagation(); onFlagHover(null); }}
                        onClick={(e) => { e.stopPropagation(); /* Optional click logic */ }}
                    >
                        {/* Move flag slightly inward so it stands on the step */}
                        <group position={[0.35, 0.25, 0]}>
                            <mesh position={[0, 0, 0]}>
                                <cylinderGeometry args={[0.02, 0.02, 0.5]} />
                                <meshStandardMaterial color="#cbd5e1" />
                            </mesh>
                            <mesh position={[0.15, 0.15, 0]} rotation={[0, 0, 0]}>
                                <boxGeometry args={[0.3, 0.2, 0.01]} />
                                <meshStandardMaterial color={activeFlagIndex === i ? "#fbbf24" : "#34d399"} /> {/* Highlight on hover */}
                            </mesh>

                            {/* Hover Tooltip / Detail View */}
                            {activeFlagIndex === i && (
                                <Html position={[0, 0.5, 0]} center style={{ pointerEvents: 'none' }}>
                                    <div className="bg-slate-900/90 text-white p-3 rounded-lg border border-slate-700 shadow-xl backdrop-blur-md w-64 pointer-events-none select-none flex flex-col items-center gap-2 transform -translate-y-full">
                                        <div className="text-xs font-bold text-center text-emerald-400 uppercase tracking-widest mb-1">
                                            Checkpoint #{cp.checkpointIndex + 1}
                                        </div>
                                        <div className="text-sm text-center leading-tight font-medium">
                                            {task ? task.text : "Unknown Task"}
                                        </div>
                                        {task && task.photo && (
                                            <div className="mt-2 w-full flex justify-center rounded overflow-hidden">
                                                <img src={task.photo} alt="Task Proof" className="max-w-full max-h-40 object-contain rounded" />
                                            </div>
                                        )}
                                        {task && !task.photo && (
                                            <div className="text-xs text-slate-500 italic mt-1">No photo added</div>
                                        )}
                                    </div>
                                </Html>
                            )}
                        </group>
                    </group>
                )
            })}
        </group>
    )
}

// Animated Climber Component - Detailed Penguin
function Climber({ steps, targetIndex, controlsRef, isLocked, light }) {
    const groupRef = React.useRef();
    const bodyRef = React.useRef();
    const leftWingRef = React.useRef();
    const rightWingRef = React.useRef();

    // Track current position as a float index along the steps array
    // Initialize to targetIndex so we start at the right spot (teleport), 
    // instead of walking from 0 every time.
    const currentIndex = React.useRef(targetIndex);

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

                // Behind-the-Penguin Camera View
                const cameraDist = 3.5; // Distance behind
                const cameraHeight = 1.2; // Height offset

                // Calculate "behind" position based on penguin's rotation
                // The penguin's forward vector is along Z+ in its local space
                const forward = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(0, currentRotY, 0));

                // Position is currentPos - forward * dist + heightOffset
                const desiredCamPos = currentPos.clone()
                    .sub(forward.multiplyScalar(cameraDist))
                    .add(new THREE.Vector3(0, cameraHeight, 0));

                state.camera.position.lerp(desiredCamPos, 0.05);
                controlsRef.current.update();
            } else if (!isLocked && controlsRef && controlsRef.current) {
                // In free mode, smoothy lerp the target to the mountain center (0, 1, 0)
                const mountainCenter = new THREE.Vector3(0, 1, 0);

                // Only lerp the target if it's far from the mountain center
                if (controlsRef.current.target.distanceTo(mountainCenter) > 0.1) {
                    controlsRef.current.target.lerp(mountainCenter, 0.1);
                }

                // If the camera is too close (leftover from locked view), push it back
                const minFreeDistance = 8;
                const camPos = state.camera.position;
                const distToCenter = camPos.distanceTo(mountainCenter);

                if (distToCenter < minFreeDistance) {
                    const direction = camPos.clone().sub(mountainCenter).normalize();
                    const desiredCamPos = mountainCenter.clone().add(direction.multiplyScalar(minFreeDistance));
                    // Lerp position but only to ensure a minimum distance
                    state.camera.position.lerp(desiredCamPos, 0.05);
                }

                // Call update once at the end
                controlsRef.current.update();
            }
        }

        // Hopping & Waddle Animation
        if (Math.abs(diff) > 0.05) {
            // Walking/Hopping
            const time = state.clock.elapsedTime * 10;
            const hop = Math.abs(Math.sin(time)) * 0.15;
            const squash = 1.0 - Math.max(0, Math.cos(time)) * 0.1; // Squash on landing
            const stretch = 1.0 + Math.max(0, Math.sin(time)) * 0.1; // Stretch in air
            const lean = Math.sin(time * 0.5) * 0.1; // Slow side-to-side waddle lean

            if (bodyRef.current) {
                bodyRef.current.position.y = hop;
                bodyRef.current.scale.set(1 / stretch, stretch * squash, 1 / stretch);
                bodyRef.current.rotation.z = lean;
            }

            // Wing flapping synced with hop
            const flap = Math.sin(time) * 0.4;
            if (leftWingRef.current) leftWingRef.current.rotation.z = flap;
            if (rightWingRef.current) rightWingRef.current.rotation.z = -flap;
        } else {
            // Idle breathing
            const time = state.clock.elapsedTime * 2;
            const breathe = Math.sin(time) * 0.01;
            if (bodyRef.current) {
                bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, breathe, 0.1);
                bodyRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
                bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, 0, 0.1);
            }
            if (leftWingRef.current) leftWingRef.current.rotation.z = THREE.MathUtils.lerp(leftWingRef.current.rotation.z, 0, 0.1);
            if (rightWingRef.current) rightWingRef.current.rotation.z = THREE.MathUtils.lerp(rightWingRef.current.rotation.z, 0, 0.1);
        }
    });

    return (
        <group ref={groupRef}>
            <group ref={bodyRef}>
                <pointLight
                    intensity={light?.intensity ?? 0.35}
                    color={light?.color ?? '#ffffff'}
                    distance={3}
                    position={[0, 0.8, 0.4]}
                />
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
            const idealRadius = getRadius(y);

            // Replicate MountainMesh displacement logic to find surface radius
            // Mesh is at world Y = 0.5 (Group @ -2 + Mesh @ 2.5)
            // Local Y = World Y - 0.5
            const localY = y - 0.5;

            // Wave function from MountainMesh
            // const angle = Math.atan2(vertex.z, vertex.x); -> This matches our 'angle'
            const wave = Math.sin(angle * 5) * 0.15 + Math.cos(localY * 2.0) * 0.1;

            // Factor from MountainMesh
            // const factor = 1 + wave * (1.0 - (vertex.y + 2.5) / 5.0 * 0.5);
            const factor = 1 + wave * (1.0 - (localY + 2.5) / 5.0 * 0.5);

            const surfaceRadius = idealRadius * factor;

            // Offset for step attachment
            // Embed steps: center is near surfaceRadius
            const embedOffset = 0.15;

            // Add deterministic jitter
            const seed = i * 1337;
            const jitterRadial = (Math.sin(seed) * 0.5 + 0.5) * 0.1; // 0 to 0.1 variation

            const stepRadius = surfaceRadius + embedOffset + jitterRadial;

            const x = Math.cos(angle) * stepRadius;
            const z = Math.sin(angle) * stepRadius;

            const position = [x, y, z];

            // Rotate to align with radial outward direction + slight random tilt
            const jitterRotX = (Math.cos(seed * 0.5) * 0.5 - 0.25) * 0.1; // Slight pitch
            const jitterRotZ = (Math.sin(seed * 2.5) * 0.5 - 0.25) * 0.1; // Slight roll

            const rotation = [jitterRotX, -angle, jitterRotZ];

            // Size jitter
            const widthJitter = (Math.sin(seed * 3.3) * 0.5 + 0.5) * 0.1;
            const heightJitter = (Math.cos(seed * 4.1) * 0.5 + 0.5) * 0.04;
            const depthJitter = (Math.sin(seed * 5.7) * 0.5 + 0.5) * 0.1;

            generatedSteps.push({
                position,
                rotation,
                overallIndex: i,
                isCheckpoint: false,
                checkpointIndex: -1,
                // Store data for potential update if it becomes a checkpoint
                angle,
                y,
                surfaceRadius,
                dims: [0.5 + widthJitter, 0.08 + heightJitter, 0.3 + depthJitter]
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
                    const step = generatedSteps[stepIndex];
                    step.isCheckpoint = true;
                    step.checkpointIndex = k;

                    // Update position for checkpoint width (0.8)
                    // Checkpoints stick out slightly more
                    const embedOffset = 0.25;
                    const stepRadius = step.surfaceRadius + embedOffset;

                    step.position[0] = Math.cos(step.angle) * stepRadius;
                    step.position[2] = Math.sin(step.angle) * stepRadius;

                    // Larger platform
                    step.dims = [0.8, 0.12, 0.5];
                }
            }
        } else {
            // Checkpoint at the top for "Main Goal"
            const lastStep = generatedSteps[generatedSteps.length - 1];
            if (lastStep) {
                lastStep.isCheckpoint = true;
                lastStep.checkpointIndex = 0;

                const embedOffset = 0.25;
                const stepRadius = lastStep.surfaceRadius + embedOffset;

                lastStep.position[0] = Math.cos(lastStep.angle) * stepRadius;
                lastStep.position[2] = Math.sin(lastStep.angle) * stepRadius;

                lastStep.dims = [0.8, 0.12, 0.5];
            }
        }

        return generatedSteps; // Array of step objects
    }, [tasks.length]);
}

function Scene({ tasks, goal, isLocked, mountainId, timeOfDay }) {
    const controlsRef = useRef()
    const steps = useStaircasePath(tasks);
    const theme = useMemo(() => TIME_THEMES[timeOfDay] || TIME_THEMES.night, [timeOfDay])
    const ambientRef = useRef()
    const directionalRef = useRef()
    const fogRef = useRef()
    const targetLightColor = useMemo(() => new THREE.Color(theme.directionalColor), [theme.directionalColor])
    const targetFogColor = useMemo(() => new THREE.Color(theme.fog.color), [theme.fog.color])
    const targetDirPos = useMemo(
        () => new THREE.Vector3(...theme.directionalPosition),
        [theme.directionalPosition]
    )

    // -- State
    const [hoveredFlagIndex, setHoveredFlagIndex] = useState(null);
    const [tourOverrideTarget, setTourOverrideTarget] = useState(null);
    const [isTouring, setIsTouring] = useState(false);

    // Determine climber position (normal logic)
    const doneCount = tasks.filter(t => t.done).length;

    // Calculate normal target
    let normalTargetStepIndex = 0;
    if (doneCount > 0) {
        const checkpointStep = steps.find(s => s.checkpointIndex === doneCount - 1);
        if (checkpointStep) normalTargetStepIndex = checkpointStep.overallIndex;
        else normalTargetStepIndex = steps.length - 1;
    }

    // Actual target is override (during tour) or normal
    const targetStepIndex = isTouring && tourOverrideTarget !== null ? tourOverrideTarget : normalTargetStepIndex;

    // -- Victory Tour Logic
    const [tourIndex, setTourIndex] = useState(0);

    // Start tour when summit reached
    React.useEffect(() => {
        if (tasks.length > 0 && doneCount === tasks.length) {
            if (!isTouring) {
                setIsTouring(true);
                setTourIndex(0);
            }
        } else {
            setIsTouring(false);
        }
    }, [doneCount, tasks.length]);

    // Sync tour state with visual targets
    React.useEffect(() => {
        if (isTouring) {
            const step = steps.find(s => s.checkpointIndex === tourIndex);
            if (step) {
                setTourOverrideTarget(step.overallIndex);
                // Delay showing popup slightly for travel time
                const timer = setTimeout(() => setHoveredFlagIndex(tourIndex), 500);
                return () => clearTimeout(timer);
            }
        } else {
            setTourOverrideTarget(null);
            setHoveredFlagIndex(null);
        }
    }, [isTouring, tourIndex, steps]);

    // Manual Navigation Handlers
    const handleNext = React.useCallback(() => {
        if (tourIndex < tasks.length - 1) {
            setHoveredFlagIndex(null); // Hide briefly
            setTourIndex(prev => prev + 1);
        }
    }, [tourIndex, tasks.length]);

    const handlePrev = React.useCallback(() => {
        if (tourIndex > 0) {
            setHoveredFlagIndex(null);
            setTourIndex(prev => prev - 1);
        }
    }, [tourIndex]);

    const handleExitTour = React.useCallback(() => {
        setIsTouring(false);
    }, []);

    // Keyboard Navigation
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isTouring) return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                handleNext();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                handlePrev();
            } else if (e.key === 'Escape') {
                handleExitTour();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTouring, handleNext, handlePrev, handleExitTour]);

    const currentStep = steps[targetStepIndex] || steps[0];

    useFrame(() => {
        if (ambientRef.current) {
            ambientRef.current.intensity = THREE.MathUtils.lerp(
                ambientRef.current.intensity,
                theme.ambient,
                0.08
            );
        }
        if (directionalRef.current) {
            directionalRef.current.intensity = THREE.MathUtils.lerp(
                directionalRef.current.intensity,
                theme.directional,
                0.08
            );
            directionalRef.current.color.lerp(targetLightColor, 0.08);
            directionalRef.current.position.lerp(targetDirPos, 0.08);
        }
        if (fogRef.current) {
            fogRef.current.near = THREE.MathUtils.lerp(fogRef.current.near, theme.fog.near, 0.08);
            fogRef.current.far = THREE.MathUtils.lerp(fogRef.current.far, theme.fog.far, 0.08);
            fogRef.current.color.lerp(targetFogColor, 0.08);
        }
    });

    return (
        <group>
            <ambientLight ref={ambientRef} intensity={theme.ambient} />
            <directionalLight
                ref={directionalRef}
                position={theme.directionalPosition}
                intensity={theme.directional}
                color={theme.directionalColor}
                castShadow
            />
            <fog ref={fogRef} attach="fog" args={[theme.fog.color, theme.fog.near, theme.fog.far]} />
            {theme.stars > 0 ? (
                <Stars radius={100} depth={50} count={theme.stars} factor={4} saturation={0} fade speed={1} />
            ) : null}

            <MountainMesh theme={theme} />

            <Staircase steps={steps} doneCount={doneCount} theme={theme} />
            <CheckpointFlags
                steps={steps}
                doneCount={doneCount}
                tasks={tasks}
                activeFlagIndex={hoveredFlagIndex}
                onFlagHover={setHoveredFlagIndex}
            />

            <Climber
                key={mountainId} // Forces remount on mountain switch -> Teleport
                steps={steps}
                targetIndex={targetStepIndex}
                controlsRef={controlsRef}
                isLocked={isLocked} // Master control for camera lock
                light={theme.climberLight}
            />

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
                        color={theme.textColor}
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
                autoRotate={false} // Disable auto rotate to give user full control in free mode
                autoRotateSpeed={0.5}
            />

            {/* Victory Tour UI */}
            {isTouring && (
                <Html fullscreen style={{ pointerEvents: 'none' }}>
                    <div className="absolute inset-0 flex items-end justify-center pb-12 pointer-events-none">
                        <div className="flex items-center gap-4 bg-slate-900/90 p-4 rounded-2xl border border-amber-500/30 shadow-2xl backdrop-blur-md pointer-events-auto">
                            <button
                                onClick={handlePrev}
                                disabled={tourIndex === 0}
                                className="p-2 rounded-full hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-white transition"
                                title="Previous Checkpoint"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <div className="flex flex-col items-center min-w-[120px]">
                                <span className="text-amber-400 font-bold uppercase tracking-widest text-xs">Victory Tour</span>
                                <span className="text-white font-mono text-sm">
                                    {tourIndex + 1} / {tasks.length}
                                </span>
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={tourIndex === tasks.length - 1}
                                className="p-2 rounded-full hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-white transition"
                                title="Next Checkpoint"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <div className="w-px h-8 bg-slate-700 mx-2" />

                            <button
                                onClick={handleExitTour}
                                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold uppercase tracking-wide transition"
                            >
                                Exit
                            </button>
                        </div>
                    </div>
                </Html>
            )}
        </group>
    )
}

export default function Mountain3D({ goal, tasks, onPhotoUpdate, mountainId, timeOfDay = 'night' }) {
    const [isLocked, setIsLocked] = useState(true);
    const theme = TIME_THEMES[timeOfDay] || TIME_THEMES.night

    return (
        <div className="absolute inset-0 z-0" style={{ width: '100%', height: '100%' }}>
            <div className="sky-stack" data-time={theme.skyKey}>
                <div className="sky-layer sky-day" />
                <div className="sky-layer sky-sunset" />
                <div className="sky-layer sky-night" />
                <div className="sky-noise" />
                <div className="sky-vignette" />
            </div>
            {/* Camera Toggle Button */}
            <button
                onClick={() => setIsLocked(!isLocked)}
                className="absolute bottom-6 left-6 z-20 px-4 py-2 bg-slate-800/80 text-white rounded-full 
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

            <div className="relative z-10 h-full w-full">
                <Canvas
                    shadows
                    dpr={[1, 2]}
                    camera={{ position: [0, 2, 8], fov: 50 }}
                    gl={{ alpha: true }}
                >
                    <Scene tasks={tasks} goal={goal} isLocked={isLocked} mountainId={mountainId} timeOfDay={timeOfDay} />
                </Canvas>
            </div>
        </div>
    )
}
