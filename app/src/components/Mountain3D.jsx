import React, { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Float, Text, Outlines, Billboard, Html, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import PhotoModal from './PhotoModal'

// -- Constants
// -- Constants
const MOUNTAIN_SLOTS = [
    new THREE.Vector3(-86, 0, -62),
    new THREE.Vector3(-28, 0, -92),
    new THREE.Vector3(44, 0, -74),
    new THREE.Vector3(92, 0, -18),
    new THREE.Vector3(70, 0, 64),
    new THREE.Vector3(10, 0, 94),
    new THREE.Vector3(-66, 0, 74),
    new THREE.Vector3(-98, 0, 18),
    new THREE.Vector3(0, 0, -10),
]

const TIME_THEMES = {
    day: {
        skyKey: 'day',
        textColor: '#2b2a25',
        ambient: 0.92,
        directional: 1.25,
        directionalColor: '#ffe2b2',
        directionalPosition: [8, 10, 6],
        stars: 0,
        starsSpeed: 0,
        fog: { color: '#f3e8d6', near: 95, far: 260 },
        ground: {
            base: '#efe3cf',
            edge: '#e2d3bd',
            shadow: 'rgba(15, 23, 42, 0.18)',
        },
        distant: {
            base: '#cbb99f',
            snow: '#fbf6ec',
        },
        mountain: {
            base: '#c7b59e',
            shadow: '#a6927c',
            snow: '#fbf6ec',
        },
        atmosphere: {
            haze1: 0.14,
            haze2: 0.08,
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
        ambient: 0.6,
        directional: 1.1,
        directionalColor: '#ffb562',
        directionalPosition: [-6, 4, 6],
        stars: 700,
        starsSpeed: 0.6,
        // Warm haze that catches golden light
        fog: { color: '#f1a36b', near: 85, far: 240 },
        ground: {
            base: '#6a5860',
            edge: '#7a646d',
            shadow: 'rgba(10, 10, 20, 0.28)',
        },
        distant: {
            base: '#6a5068',
            snow: '#f7e6d4',
        },
        mountain: {
            base: '#7a6574',
            shadow: '#5a4654',
            snow: '#f7e6d4',
        },
        atmosphere: {
            haze1: 0.22,
            haze2: 0.12,
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
        ambient: 0.48,
        directional: 0.85,
        directionalColor: '#b9c9ff',
        directionalPosition: [6, 8, -4],
        stars: 2200,
        starsSpeed: 0.45,
        fog: { color: '#17133a', near: 75, far: 250 },
        ground: {
            base: '#1a1f3a',
            edge: '#242a4c',
            shadow: 'rgba(2, 6, 23, 0.45)',
        },
        distant: {
            base: '#2a2b55',
            snow: '#d9d9f3',
        },
        mountain: {
            base: '#323562',
            shadow: '#1f2147',
            snow: '#d9d9f3',
        },
        atmosphere: {
            haze1: 0.18,
            haze2: 0.1,
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

function clamp01(v) {
    return Math.max(0, Math.min(1, v))
}

function smoothstep(edge0, edge1, x) {
    const t = clamp01((x - edge0) / (edge1 - edge0))
    return t * t * (3 - 2 * t)
}

function makeSeedInt(seed) {
    if (typeof seed === 'number' && Number.isFinite(seed)) return Math.floor(seed)
    if (typeof seed === 'string') {
        let h = 2166136261
        for (let i = 0; i < seed.length; i++) {
            h ^= seed.charCodeAt(i)
            h = Math.imul(h, 16777619)
        }
        return h >>> 0
    }
    return 1337
}

function hashToUnitFloat(n) {
    const x = Math.sin(n) * 43758.5453123
    return x - Math.floor(x)
}

function getGroundHeight(x, z, seedInt) {
    const r = Math.sqrt(x * x + z * z)

    // Keep the gameplay area near the mountain flatter/cleaner.
    // Keep the area near world origin slightly cleaner; mountains are placed in slots elsewhere.
    const clear = smoothstep(6.0, 12.0, r)

    const w1 = Math.sin(x * 0.08 + z * 0.03)
    const w2 = Math.cos(z * 0.07 - x * 0.02)
    const w3 = Math.sin((x + z) * 0.045)

    // Grid-based jitter for "low poly" feel if desired, or smooth noise
    // Using floor to lock it to a grid makes it look blocky/low-poly if resolution is low,
    // but here we are sampling per vertex so it just adds noise.
    const jitter = (hashToUnitFloat(seedInt + Math.floor(x * 2) * 31 + Math.floor(z * 2) * 17) - 0.5)

    return (w1 * 0.18 + w2 * 0.14 + w3 * 0.10 + jitter * 0.06) * clear
}

function cubicBezierVec3(p0, p1, p2, p3, t) {
    const it = 1 - t
    const it2 = it * it
    const t2 = t * t

    // (1-t)^3 p0 + 3(1-t)^2 t p1 + 3(1-t) t^2 p2 + t^3 p3
    const a = it2 * it
    const b = 3 * it2 * t
    const c = 3 * it * t2
    const d = t2 * t

    return new THREE.Vector3(
        p0.x * a + p1.x * b + p2.x * c + p3.x * d,
        p0.y * a + p1.y * b + p2.y * c + p3.y * d,
        p0.z * a + p1.z * b + p2.z * c + p3.z * d,
    )
}

function getMountainParams(seed) {
    const seedInt = makeSeedInt(seed)
    const phase = hashToUnitFloat(seedInt + 11) * Math.PI * 2
    const freqA = 4 + Math.floor(hashToUnitFloat(seedInt + 17) * 5)
    const freqB = 1.4 + hashToUnitFloat(seedInt + 23) * 2.6
    const ampA = 0.10 + hashToUnitFloat(seedInt + 29) * 0.10
    const ampB = 0.06 + hashToUnitFloat(seedInt + 31) * 0.08
    const snowBias = (hashToUnitFloat(seedInt + 37) - 0.5) * 0.25

    return { phase, freqA, freqB, ampA, ampB, snowBias }
}

function Landscape({ theme, seed }) {
    // World seed: keep landscape stable so camera travel reads as moving through space.
    const seedInt = useMemo(() => makeSeedInt('world-v1'), [])

    const groundGeometry = useMemo(() => {
        // Subtle, polished elevation changes (minimalist render)
        const geo = new THREE.PlaneGeometry(320, 320, 180, 180)
        geo.rotateX(-Math.PI / 2)
        const pos = geo.getAttribute('position')

        const base = new THREE.Color(theme.ground?.base || '#c9d8e6')
        const edge = new THREE.Color(theme.ground?.edge || '#b3c4d6')
        const colors = []

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i)
            const z = pos.getZ(i)

            const y = getGroundHeight(x, z, seedInt)
            pos.setY(i, y)

            // Gentle color variation by height + distance (no texture detail)
            const r = Math.sqrt(x * x + z * z)
            const h = clamp01((y + 0.25) / 0.9)
            const d = smoothstep(20, 150, r)
            const c = base.clone().lerp(edge, 0.35 * d + 0.25 * h)
            colors.push(c.r, c.g, c.b)
        }

        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
        geo.computeVertexNormals()
        return geo
    }, [seedInt, theme.ground?.base, theme.ground?.edge])

    const Peaks = useMemo(() => {
        // More realistic mountain ranges: Grouped clusters instead of random scatter
        const rng = (k) => hashToUnitFloat(seedInt * 99991 + k * 7919)
        const ranges = []

        // Create 3 main ranges in the distance
        const rangeCount = 3
        for (let r = 0; r < rangeCount; r++) {
            const rangeAngle = (r / rangeCount) * Math.PI * 2 + (rng(r) * 1.5)
            const dist = 140 + rng(r + 10) * 80
            const count = 15 + Math.floor(rng(r + 20) * 10)

            for (let i = 0; i < count; i++) {
                // Spread hills along a line perpendicular to the center
                const spread = (rng(i + 100) - 0.5) * 120
                const depth = (rng(i + 200) - 0.5) * 30

                // Position relative to range center
                const cx = Math.cos(rangeAngle) * dist
                const cz = Math.sin(rangeAngle) * dist

                // Perpendicular vector
                const px = -Math.sin(rangeAngle)
                const pz = Math.cos(rangeAngle)

                const x = cx + px * spread + Math.cos(rangeAngle) * depth
                const z = cz + pz * spread + Math.sin(rangeAngle) * depth

                const h = 15 + rng(i + 300) * 35 // Much taller, more majestic
                const rad = 12 + rng(i + 400) * 18 // Wider bases

                // Varying styles: some sharp, some broad
                const sharpness = 0.5 + rng(i + 500) * 0.5

                ranges.push({ x, z, h, rad, sharpness })
            }
        }
        return ranges
    }, [seedInt])

    const baseColor = theme.distant?.base || theme.mountain.base
    const snowColor = theme.distant?.snow || theme.mountain.snow

    return (
        <group position={[0, -2.02, 0]}>
            <mesh geometry={groundGeometry} receiveShadow>
                <meshStandardMaterial vertexColors roughness={0.92} metalness={0.0} />
            </mesh>

            <Trees theme={theme} seedInt={seedInt} />

            {/* Distant peaks - Realistic Ranges */}
            <group>
                {Peaks.map((p, i) => (
                    <group key={i} position={[p.x, -2, p.z]}>
                        {/* Main mountain body */}
                        <mesh position={[0, p.h * 0.5, 0]} castShadow receiveShadow>
                            <coneGeometry args={[p.rad, p.h, 7, 1]} />{/* Low poly look */}
                            <meshToonMaterial color={baseColor} />
                        </mesh>
                        {/* Snow cap */}
                        <mesh position={[0, p.h * 0.8, 0]}>
                            <coneGeometry args={[p.rad * 0.45, p.h * 0.4, 7, 1]} />
                            <meshToonMaterial color={snowColor} />
                        </mesh>
                    </group>
                ))}
            </group>

            {/* Atmospheric perspective / haze band */}
            <group position={[0, 6.5, -58]}>
                <mesh>
                    <planeGeometry args={[460, 88]} />
                    <meshBasicMaterial color={theme.fog.color} transparent opacity={theme.atmosphere?.haze1 ?? 0.18} depthWrite={false} />
                </mesh>
            </group>
        </group>
    )
}

function Trees({ theme, seedInt }) {
    const meshRef = useRef()

    // Generate tree data once
    const { count, serverData } = useMemo(() => {
        const _count = 400
        const _data = []
        const rng = (k) => hashToUnitFloat(seedInt * 7331 + k * 1993)

        for (let i = 0; i < _count; i++) {
            // Random position in a large area
            const angle = rng(i) * Math.PI * 2
            const r = 25 + rng(i + 1) * 110 // Start at 25m (clearering center) out to 135m

            const x = Math.cos(angle) * r
            const z = Math.sin(angle) * r

            // Get height from the shared landscape function
            const y = getGroundHeight(x, z, seedInt)

            // Scale variation
            const scale = 0.8 + rng(i + 2) * 0.8

            // Rotation
            const rotY = rng(i + 3) * Math.PI * 2

            _data.push({ position: [x, y, z], scale, rotation: [0, rotY, 0] })
        }
        return { count: _count, serverData: _data }
    }, [seedInt])

    // Update instances
    useMemo(() => {
        if (!meshRef.current) return
        const tempObj = new THREE.Object3D()

        for (let i = 0; i < count; i++) {
            const d = serverData[i]
            tempObj.position.set(...d.position)
            tempObj.rotation.set(...d.rotation)
            tempObj.scale.set(d.scale, d.scale, d.scale)
            tempObj.updateMatrix()
            meshRef.current.setMatrixAt(i, tempObj.matrix)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    }, [count, serverData]) // Actually this needs to run inside a useEffect or LayoutEffect to catch the ref, but regular useMemo implies render-time. 
    // Better: use useLayoutEffect to update the mesh when data changes.

    React.useLayoutEffect(() => {
        if (meshRef.current) {
            const tempObj = new THREE.Object3D()
            for (let i = 0; i < count; i++) {
                const d = serverData[i]
                tempObj.position.set(...d.position)
                tempObj.rotation.set(...d.rotation)
                tempObj.scale.set(d.scale, d.scale, d.scale)
                tempObj.updateMatrix()
                meshRef.current.setMatrixAt(i, tempObj.matrix)
            }
            meshRef.current.instanceMatrix.needsUpdate = true
        }
    }, [count, serverData])

    // Tree Colors based on theme
    const treeColor = theme.ground.base === '#efe3cf' ? '#2d4c3b' : // Day: Green
        theme.ground.base === '#6a5860' ? '#3d2e38' : // Sunset: Dark Purple/Brown
            '#162638'; // Night: Dark Blue/Black

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]} castShadow receiveShadow>
            <coneGeometry args={[0.8, 2.5, 5]} />
            <meshToonMaterial color={treeColor} />
        </instancedMesh>
    )
}

function BaseGrounding({ theme }) {
    return (
        <group position={[0, -2.02, 0]}>
            {/* Base blending ring + contact shadow (clean separation, helps gameplay readability) */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <ringGeometry args={[15.5, 40, 96]} />
                <meshStandardMaterial
                    color={theme.ground?.edge || '#b3c4d6'}
                    roughness={0.98}
                    metalness={0}
                    opacity={0.75}
                    transparent
                />
            </mesh>
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[3.7, 64]} />
                <meshBasicMaterial color={theme.ground?.shadow || 'rgba(15, 23, 42, 0.18)'} transparent opacity={0.55} />
            </mesh>
        </group>
    )
}

function MountainMesh({ theme, seed }) {
    const { geometry, material } = useMemo(() => {
        // High segment for smooth outlines/toon curves
        const geo = new THREE.ConeGeometry(3, 5, 128, 64);

        const { phase, freqA, freqB, ampA, ampB, snowBias } = getMountainParams(seed)

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
            // Seeded curvy distortion so each mountain is distinct.
            const wave = Math.sin(angle * freqA + phase) * ampA + Math.cos(vertex.y * freqB + phase * 0.6) * ampB;

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
            const snowThreshold = 1.0 + snowBias + Math.sin(angle * (3 + (freqA % 3))) * 0.18;

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
    }, [theme.mountain.base, theme.mountain.shadow, theme.mountain.snow, seed]);

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

function CheckpointFlags({ steps, doneCount, tasks, activeFlagIndex, onFlagHover, onPhotoUpdate, onEditPhoto }) {
    // Filter out only checkpoints
    const checkpoints = steps.filter(s => s.isCheckpoint);

    return (
        <group>
            {checkpoints.map((cp, i) => {
                const isReached = cp.checkpointIndex < doneCount;
                if (!isReached) return null; // Only show flags for reached checkpoints

                // If summit is reached, hide the last flag (penguin is holding it)
                const isSummit = tasks && doneCount === tasks.length;
                if (isSummit && i === checkpoints.length - 1) return null;

                const task = tasks && tasks[cp.checkpointIndex]; // Get associated task

                return (
                    <group
                        key={i}
                        position={cp.position}
                        rotation={cp.rotation}
                        onPointerOver={(e) => { e.stopPropagation(); onFlagHover(i); }}
                        onPointerOut={(e) => { e.stopPropagation(); onFlagHover(null); }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (task) {
                                onEditPhoto(task.id, task.photo);
                            }
                        }}
                    >
                        {/* Move flag slightly inward so it stands on the step */}
                        <group position={[0.35, 0.25, 0]}>
                            <mesh position={[0, 0, 0]}>
                                <cylinderGeometry args={[0.02, 0.02, 0.5]} />
                                <meshStandardMaterial color="#cbd5e1" />
                            </mesh>
                            <mesh position={[0.15, 0.15, 0]} rotation={[0, 0, 0]}>
                                <boxGeometry args={[0.3, 0.2, 0.01]} />
                                <meshStandardMaterial color={activeFlagIndex === i ? "#fbbf24" : "#34d399"} />
                            </mesh>

                            {/* Hover Tooltip / Detail View */}
                            {activeFlagIndex === i && (
                                <Html position={[0, 0.5, 0]} center style={{ pointerEvents: 'none' }}>
                                    <div className="bg-slate-900/90 text-white p-3 rounded-lg border border-slate-700 shadow-xl backdrop-blur-md w-64 flex flex-col items-center gap-2 transform -translate-y-full">
                                        <div className="text-xs font-bold text-center text-emerald-400 uppercase tracking-widest mb-1">
                                            Checkpoint #{cp.checkpointIndex + 1}
                                        </div>
                                        <div className="text-sm text-center leading-tight font-medium">
                                            {task ? task.text : "Unknown Task"}
                                        </div>
                                        {(() => {
                                            console.log('[CheckpointFlags] Rendering tooltip for task:', task?.id, 'has photo:', !!task?.photo, 'photo length:', task?.photo?.length)
                                            return task && task.photo ? (
                                                <div className="mt-2 w-full flex justify-center rounded overflow-hidden">
                                                    <img src={task.photo} alt="Task Proof" className="max-w-full max-h-40 object-contain rounded" />
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-xs text-slate-400 italic">
                                                    Click flag to add photo
                                                </div>
                                            )
                                        })()}
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
function Climber({ steps, targetIndex, controlsRef, isLocked, light, suspendCamera, origin, isTouring, isSummitReached }) {
    const groupRef = React.useRef();
    const bodyRef = React.useRef();
    const leftWingRef = React.useRef();
    const rightWingRef = React.useRef();

    // Track current position as a float index along the steps array
    const currentIndex = React.useRef(targetIndex);

    // If we jump from near summit to bottom (e.g. tour start), snap current index
    // Teleport logic: If touring and jumping down significantly (e.g. start of tour), snap instantly
    React.useEffect(() => {
        if (isTouring && currentIndex.current > targetIndex + 10) {
            currentIndex.current = targetIndex;
        }
    }, [isTouring, targetIndex]);

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

            // Camera Tracking ONLY if locked (unless a scene transition is running)
            if (!suspendCamera && isLocked && controlsRef && controlsRef.current) {
                // Look slightly above the penguin's feet
                const lookAtPos = new THREE.Vector3(
                    currentPos.x + (origin?.x || 0),
                    currentPos.y + 0.5,
                    currentPos.z + (origin?.z || 0)
                );
                controlsRef.current.target.lerp(lookAtPos, 0.1);

                // Orbital Camera Movement:
                // Strictly follow the penguin's orbital path.
                const angle = Math.atan2(currentPos.x, currentPos.z);

                const dist = 8; // Distance from center
                const heightOffset = 2.0; // Height relative to penguin

                const camX = Math.sin(angle) * dist + (origin?.x || 0);
                const camZ = Math.cos(angle) * dist + (origin?.z || 0);
                const camY = currentPos.y + heightOffset;

                const desiredCamPos = new THREE.Vector3(camX, camY, camZ);
                state.camera.position.lerp(desiredCamPos, 0.05);
                controlsRef.current.update();
            } else if (!suspendCamera && !isLocked && controlsRef && controlsRef.current) {
                // In free mode, keep orbit centered on the active mountain slot.
                const mountainCenter = new THREE.Vector3(origin?.x || 0, 1, origin?.z || 0);
                controlsRef.current.target.lerp(mountainCenter, 0.1);
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

                    {/* Held Flag (Only if Summit Reached) */}
                    {isSummitReached && (
                        <group position={[0.25, 0.45, 0.2]} rotation={[0, 0, -0.3]}>
                            <mesh position={[0, 0.25, 0]}>
                                <cylinderGeometry args={[0.01, 0.01, 0.5]} />
                                <meshStandardMaterial color="#cbd5e1" />
                            </mesh>
                            <mesh position={[0.12, 0.4, 0]} rotation={[0, 0, 0]}>
                                <boxGeometry args={[0.24, 0.16, 0.01]} />
                                <meshStandardMaterial color="#fbbf24" />
                            </mesh>
                        </group>
                    )}
                </group>
            </group>
        </group>
    )
}

// Hook to generate the spiral staircase path
function useStaircasePath(tasks, seed) {
    return useMemo(() => {
        const generatedSteps = [];
        const { phase, freqA, freqB, ampA, ampB } = getMountainParams(seed)

        const startY = -1.8;
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
            const wave = Math.sin(angle * freqA + phase) * ampA + Math.cos(localY * freqB + phase * 0.6) * ampB;

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
    }, [tasks.length, seed]);
}

function Scene({ tasks, goal, isLocked, mountainId, timeOfDay, isTouring, tourIndex, isAutomatedTour, onTourIndexUpdate, onAutomatedTourEnd, onPhotoUpdate, onEditPhoto }) {
    const controlsRef = useRef()
    const { camera } = useThree()
    const steps = useStaircasePath(tasks, mountainId || 'default');
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

    // Place each mountain in a deterministic "slot" on the landscape so switching reads as travel.
    const mountainOrigin = useMemo(() => {
        const seedInt = makeSeedInt(mountainId || 'default')
        // Use predefined slots
        const slots = MOUNTAIN_SLOTS
        const idx = Math.floor(hashToUnitFloat(seedInt + 101) * slots.length)
        const base = slots[idx]
        const jitterX = (hashToUnitFloat(seedInt + 202) - 0.5) * 10
        const jitterZ = (hashToUnitFloat(seedInt + 303) - 0.5) * 10
        return new THREE.Vector3(base.x + jitterX, 0, base.z + jitterZ)
    }, [mountainId])

    // Seeded camera transition when switching mountains (makes it feel like a new scene)
    const cameraTransitionRef = useRef({
        active: false,
        t: 0,
        duration: 1.65,
        fromPos: new THREE.Vector3(),
        toPos: new THREE.Vector3(),
        fromTarget: new THREE.Vector3(),
        toTarget: new THREE.Vector3(),
        c1: new THREE.Vector3(),
        c2: new THREE.Vector3(),
    })

    const didInitCameraRef = useRef(false)

    const transitionCounterRef = useRef(0)

    React.useEffect(() => {
        if (!camera) return
        if (!controlsRef.current) return

        if (!didInitCameraRef.current) {
            const seedInt = makeSeedInt(mountainId || 'default')
            const a = hashToUnitFloat(seedInt + 1234) * Math.PI * 2
            const dist = 10.5 + hashToUnitFloat(seedInt + 2222) * 3.5
            const height = 2.2 + hashToUnitFloat(seedInt + 3333) * 1.5
            const center = new THREE.Vector3(mountainOrigin.x, 1, mountainOrigin.z)

            camera.position.set(
                mountainOrigin.x + Math.sin(a) * dist,
                height,
                mountainOrigin.z + Math.cos(a) * dist
            )
            controlsRef.current.target.copy(center)
            controlsRef.current.update()
            didInitCameraRef.current = true
        }

        const seedInt = makeSeedInt(mountainId || 'default')
        transitionCounterRef.current += 1
        // Add a little non-determinism so repeating the same switch doesn't look identical.
        // Still ends at the same final pose for the chosen mountain.
        const nonce = (Date.now() & 0xffff) ^ (transitionCounterRef.current * 1103515245)
        const v = (k) => hashToUnitFloat(seedInt + nonce + k * 7919)
        const a = hashToUnitFloat(seedInt + 1234) * Math.PI * 2
        const dist = 10.5 + hashToUnitFloat(seedInt + 2222) * 3.5
        const height = 2.2 + hashToUnitFloat(seedInt + 3333) * 1.5
        const center = new THREE.Vector3(mountainOrigin.x, 1, mountainOrigin.z)

        // Capture current
        cameraTransitionRef.current.fromPos.copy(camera.position)
        cameraTransitionRef.current.fromTarget.copy(controlsRef.current.target)

        // Target pose varies per mountain: orbit angle + subtle dolly
        cameraTransitionRef.current.toPos.set(
            mountainOrigin.x + Math.sin(a) * dist,
            height,
            mountainOrigin.z + Math.cos(a) * dist
        )
        cameraTransitionRef.current.toTarget.copy(center)

        // Build a wide "travel across the landscape" path.
        // We create a sideways sweep (perpendicular to the travel direction) plus a slight lift.
        const tr = cameraTransitionRef.current
        const up = new THREE.Vector3(0, 1, 0)
        const dir = new THREE.Vector3().subVectors(tr.toPos, tr.fromPos)
        const dirFlat = new THREE.Vector3(dir.x, 0, dir.z)
        const dirFlatLen = dirFlat.length()
        if (dirFlatLen > 1e-3) dirFlat.divideScalar(dirFlatLen)

        const side = new THREE.Vector3().crossVectors(up, dirFlat).normalize()
        const sweepSign = v(1) > 0.5 ? 1 : -1
        const sweep = (6 + v(2) * 8) * sweepSign
        const lift = 0.75 + v(3) * 1.05
        const push = 3.5 + v(4) * 5.5
        const settlePull = 1.2 + v(5) * 2.8

        tr.duration = 1.35 + v(6) * 0.75

        // Control points: start nudges sideways + up, then finish with a smaller sideways drift.
        tr.c1.copy(tr.fromPos)
            .addScaledVector(dirFlat, push)
            .addScaledVector(side, sweep)
            .addScaledVector(up, lift)

        tr.c2.copy(tr.toPos)
            .addScaledVector(dirFlat, -settlePull)
            .addScaledVector(side, sweep * (0.25 + v(7) * 0.25))
            .addScaledVector(up, lift * (0.25 + v(8) * 0.25))

        cameraTransitionRef.current.t = 0
        cameraTransitionRef.current.active = true
    }, [camera, mountainId, mountainOrigin.x, mountainOrigin.z])

    // -- State
    const [hoveredFlagIndex, setHoveredFlagIndex] = useState(null);
    const [tourOverrideTarget, setTourOverrideTarget] = useState(null);

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

    const currentStep = steps[targetStepIndex] || steps[0];

    useFrame((state, delta) => {
        // Automated ascent logic
        if (isTouring && isAutomatedTour && !cameraTransitionRef.current.active) {
            // Calculate next target first to ensure sync
            const current = tourOverrideTarget === null ? 0 : tourOverrideTarget;
            const speed = steps.length / 18; // covers the whole mountain in ~18 seconds
            let next = current + delta * speed;

            if (next >= steps.length - 1) {
                next = steps.length - 1;
                onAutomatedTourEnd();
            }

            setTourOverrideTarget(next);

            // Update tourIndex (checkpoint sync) as we pass them
            const floorIdx = Math.floor(next);
            const currentStep = steps[floorIdx];
            if (currentStep && currentStep.isCheckpoint && currentStep.checkpointIndex !== tourIndex) {
                onTourIndexUpdate(currentStep.checkpointIndex);
            }
        }

        if (cameraTransitionRef.current.active && controlsRef.current && camera) {
            const tr = cameraTransitionRef.current
            tr.t = Math.min(1, tr.t + delta / tr.duration)
            // Ease in/out for a cinematic feel
            const eased = tr.t * tr.t * (3 - 2 * tr.t)

            // Camera travels along a Bezier curve (reads like crossing the landscape)
            const p = cubicBezierVec3(tr.fromPos, tr.c1, tr.c2, tr.toPos, eased)
            camera.position.copy(p)

            // Keep the gaze stable: ease toward the mountain center, but with a tiny leading motion.
            // This avoids jerky target changes while the camera is moving quickly.
            const lead = 0.10
            const leadTarget = new THREE.Vector3().lerpVectors(tr.fromTarget, tr.toTarget, Math.min(1, eased + lead))
            controlsRef.current.target.lerp(leadTarget, 0.9)
            controlsRef.current.update()

            if (tr.t >= 1) {
                tr.active = false
            }
        }

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
                shadow-mapSize={[1024, 1024]}
                shadow-bias={-0.00025}
                shadow-camera-near={1}
                shadow-camera-far={90}
                shadow-camera-left={-28}
                shadow-camera-right={28}
                shadow-camera-top={28}
                shadow-camera-bottom={-28}
            />
            <fog ref={fogRef} attach="fog" args={[theme.fog.color, theme.fog.near, theme.fog.far]} />
            {theme.stars > 0 ? (
                <Stars
                    radius={120}
                    depth={60}
                    count={theme.stars}
                    factor={4}
                    saturation={0}
                    fade
                    speed={theme.starsSpeed ?? 0.6}
                />
            ) : null}

            <Landscape theme={theme} seed={mountainId || 'default'} />

            {/* Active mountain + gameplay elements live at a slot on the landscape */}
            <group position={[mountainOrigin.x, 0, mountainOrigin.z]}>
                <BaseGrounding theme={theme} />

                <MountainMesh theme={theme} seed={mountainId || 'default'} />

                <Staircase steps={steps} doneCount={doneCount} theme={theme} />
                <CheckpointFlags
                    steps={steps}
                    doneCount={doneCount}
                    tasks={tasks}
                    activeFlagIndex={hoveredFlagIndex}
                    onFlagHover={setHoveredFlagIndex}
                    onPhotoUpdate={onPhotoUpdate}
                    onEditPhoto={onEditPhoto}
                />

                <Climber
                    key={mountainId} // Forces remount on mountain switch -> Teleport
                    steps={steps}
                    targetIndex={targetStepIndex}
                    controlsRef={controlsRef}
                    isLocked={isLocked || isTouring}
                    light={theme.climberLight}
                    origin={mountainOrigin}
                    isTouring={isTouring}
                    isSummitReached={doneCount === tasks.length && tasks.length > 0}
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
            </group>

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

            {/* Victory Tour UI Overlay - REMOVED from Scene */}

            {/* Replay Button Overlay - REMOVED from Scene */}
        </group>
    )
}

export default function Mountain3D({ goal, tasks, onPhotoUpdate, mountainId, timeOfDay = 'night' }) {
    const [isLocked, setIsLocked] = useState(true);
    const theme = TIME_THEMES[timeOfDay] || TIME_THEMES.night

    // Photo editing state (lifted outside Canvas)
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editingTaskPhoto, setEditingTaskPhoto] = useState(null);

    // Helper to resize image
    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (event) => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    let width = img.width
                    let height = img.height
                    const MAX_SIZE = 1024

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width
                            width = MAX_SIZE
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height
                            height = MAX_SIZE
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx.drawImage(img, 0, 0, width, height)
                    resolve(canvas.toDataURL('image/jpeg', 0.8))
                }
                img.src = event.target.result
            }
            reader.readAsDataURL(file)
        })
    }

    const handlePhotoReplace = async (e) => {
        const file = e.target.files?.[0]
        if (!file || !editingTaskId) return

        console.log('[Mountain3D] Starting photo upload for task:', editingTaskId)

        try {
            const resizedBase64 = await resizeImage(file)
            console.log('[Mountain3D] Image resized, calling onPhotoUpdate')

            onPhotoUpdate(editingTaskId, resizedBase64)
            setEditingTaskPhoto(resizedBase64)

            console.log('[Mountain3D] Photo updated, modal will stay open')
        } catch (err) {
            console.error("Image resize failed", err)
        }
    }

    const handleEditPhoto = (taskId, photo) => {
        console.log('[Mountain3D] handleEditPhoto called - taskId:', taskId, 'has existing photo:', !!photo)
        setEditingTaskId(taskId);
        setEditingTaskPhoto(photo);
    }

    const handleClosePhotoModal = () => {
        setEditingTaskId(null);
        setEditingTaskPhoto(null);
    }

    const handleRemovePhoto = () => {
        if (editingTaskId) {
            onPhotoUpdate(editingTaskId, null);
            handleClosePhotoModal();
        }
    }

    // -- Victory Tour Logic (Lifted State)
    const [isTouring, setIsTouring] = useState(false);
    const [tourIndex, setTourIndex] = useState(0);
    const [isAutomatedTour, setIsAutomatedTour] = useState(false);

    const doneCount = tasks.filter(t => t.done).length;

    // Start tour when summit reached (ONLY if just completed)
    const prevDoneCountRef = useRef(0);
    const prevMountainIdRef = useRef(mountainId);

    React.useEffect(() => {
        const prevDoneCount = prevDoneCountRef.current;
        const prevMountainId = prevMountainIdRef.current;

        // Trigger ONLY if we hit 100% on THIS mountain, and we weren't there before
        // AND we didn't just switch mountains (which would artificially change doneCount)
        if (tasks.length > 0 && doneCount === tasks.length) {
            if (prevDoneCount < tasks.length && mountainId === prevMountainId) {
                if (!isTouring) {
                    setIsTouring(true);
                    setTourIndex(0);
                    setIsAutomatedTour(true);
                }
            }
        } else {
            setIsTouring(false);
            setIsAutomatedTour(false);
        }

        // Update refs for next render
        prevDoneCountRef.current = doneCount;
        prevMountainIdRef.current = mountainId;
    }, [doneCount, tasks.length, mountainId, isTouring]);

    // Manual Navigation Handlers
    const handleNext = React.useCallback(() => {
        setIsAutomatedTour(false);
        if (tourIndex < tasks.length - 1) {
            setTourIndex(prev => prev + 1);
        }
    }, [tourIndex, tasks.length]);

    const handlePrev = React.useCallback(() => {
        setIsAutomatedTour(false);
        if (tourIndex > 0) {
            setTourIndex(prev => prev - 1);
        }
    }, [tourIndex]);

    const handleExitTour = React.useCallback(() => {
        setIsTouring(false);
        setIsAutomatedTour(false);
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

    return (
        <div className="absolute inset-0 z-0" style={{ width: '100%', height: '100%' }}>
            <div className="sky-stack" data-time={theme.skyKey}>
                <div className="sky-layer sky-day" />
                <div className="sky-layer sky-sunset" />
                <div className="sky-layer sky-night" />
                <div className="sky-clouds" />
                <div className="sky-stars" />
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

            {/* Victory Tour UI Overlay - MOVED OUTSIDE CANVAS */}
            {isTouring && (
                <div className="absolute bottom-6 right-6 z-20 flex items-center gap-4 bg-slate-900/90 p-4 rounded-2xl border border-amber-500/30 shadow-2xl backdrop-blur-md pointer-events-auto">
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
                        className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-bold uppercase tracking-wide transition border border-rose-500/20"
                    >
                        Exit
                    </button>
                </div>
            )}

            {/* Replay Button Overlay - MOVED OUTSIDE CANVAS */}
            {!isTouring && tasks.length > 0 && doneCount === tasks.length && (
                <div className="absolute bottom-6 right-6 z-20">
                    <button
                        onClick={() => {
                            setIsTouring(true);
                            setTourIndex(0);
                            setIsAutomatedTour(true);
                        }}
                        className="bg-amber-400 text-slate-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl hover:bg-amber-300 transition-all pointer-events-auto border border-amber-300 flex items-center gap-2 active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9.555 7.168A1 1 0 0 0 8 8v4a1 1 0 0 0 1.555.832l3-2a1 1 0 0 0 0-1.664l-3-2Z" clipRule="evenodd" />
                        </svg>
                        Watch Victory Lap
                    </button>
                </div>
            )}

            <div className="relative z-10 h-full w-full">
                <Canvas
                    shadows
                    dpr={[1, 2]}
                    camera={{ position: [0, 2, 8], fov: 50 }}
                    gl={{ alpha: true }}
                >
                    <Scene
                        tasks={tasks}
                        goal={goal}
                        isLocked={isLocked}
                        mountainId={mountainId}
                        timeOfDay={timeOfDay}
                        isTouring={isTouring}
                        tourIndex={tourIndex}
                        isAutomatedTour={isAutomatedTour}
                        onTourIndexUpdate={setTourIndex}
                        onAutomatedTourEnd={() => setIsAutomatedTour(false)}
                        onPhotoUpdate={onPhotoUpdate}
                        onEditPhoto={handleEditPhoto}
                    />
                </Canvas>
            </div>

            {/* Photo Modal - Rendered Outside Canvas */}
            {editingTaskId && (
                <PhotoModal
                    photo={editingTaskPhoto}
                    onClose={handleClosePhotoModal}
                    onRemove={handleRemovePhoto}
                    onReplace={handlePhotoReplace}
                />
            )}
        </div>
    )
}
