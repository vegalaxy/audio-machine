import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = null;
        this.particleCount = 2000;
        this.time = 0;
        
        this.createParticles();
    }
    
    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        const sizes = new Float32Array(this.particleCount);
        
        // Cyberpunk color palette
        const cyberpunkColors = [
            new THREE.Color(0x00ffff), // Cyan
            new THREE.Color(0xff0080), // Hot pink
            new THREE.Color(0x8000ff), // Purple
            new THREE.Color(0x00ff80), // Neon green
            new THREE.Color(0xff8000), // Orange
            new THREE.Color(0x0080ff), // Electric blue
        ];
        
        for (let i = 0; i < this.particleCount; i++) {
            // Spread particles in a large 3D space
            positions[i * 3] = (Math.random() - 0.5) * 4000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
            
            // Random cyberpunk colors
            const color = cyberpunkColors[Math.floor(Math.random() * cyberpunkColors.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Random sizes
            sizes[i] = Math.random() * 3 + 1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    
                    vec3 pos = position;
                    
                    // Floating motion
                    pos.x += sin(time * 0.5 + position.y * 0.01) * 20.0;
                    pos.y += cos(time * 0.3 + position.x * 0.01) * 15.0;
                    pos.z += sin(time * 0.4 + position.x * 0.005) * 10.0;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
                    
                    // Glowing effect
                    alpha *= 0.8;
                    
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    update(deltaTime, audioData) {
        if (!this.particles) return;
        
        this.time += deltaTime;
        this.particles.material.uniforms.time.value = this.time;
        
        // Audio-reactive particle movement
        if (audioData && audioData.length > 0) {
            const avgAmplitude = audioData.reduce((sum, val) => sum + Math.abs(val), 0) / audioData.length;
            this.particles.rotation.y += avgAmplitude * 0.1;
            this.particles.rotation.x += avgAmplitude * 0.05;
        }
        
        // Slow rotation
        this.particles.rotation.y += 0.001;
    }
    
    dispose() {
        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
    }
}