import * as THREE from 'three';

export class CyberpunkBackground {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.gridMesh = null;
        this.time = 0;
        
        this.createGrid();
        this.setupLighting();
    }
    
    createGrid() {
        // Create a cyberpunk grid floor
        const gridSize = 100;
        const divisions = 50;
        
        const geometry = new THREE.PlaneGeometry(gridSize * 20, gridSize * 20, divisions, divisions);
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                gridColor: { value: new THREE.Color(0x00ffff) },
                backgroundColor: { value: new THREE.Color(0x000011) }
            },
            vertexShader: `
                varying vec2 vUv;
                uniform float time;
                
                void main() {
                    vUv = uv;
                    
                    vec3 pos = position;
                    
                    // Subtle wave animation
                    pos.z += sin(pos.x * 0.01 + time) * 2.0 + cos(pos.y * 0.01 + time * 0.7) * 1.5;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 gridColor;
                uniform vec3 backgroundColor;
                varying vec2 vUv;
                
                void main() {
                    vec2 grid = abs(fract(vUv * 20.0) - 0.5) / fwidth(vUv * 20.0);
                    float line = min(grid.x, grid.y);
                    
                    // Animated grid intensity
                    float intensity = 1.0 - min(line, 1.0);
                    intensity *= (sin(time * 2.0) * 0.3 + 0.7);
                    
                    // Distance fade
                    float dist = length(vUv - 0.5);
                    intensity *= 1.0 - smoothstep(0.3, 0.7, dist);
                    
                    vec3 color = mix(backgroundColor, gridColor, intensity);
                    gl_FragColor = vec4(color, intensity * 0.8);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.gridMesh = new THREE.Mesh(geometry, material);
        this.gridMesh.rotation.x = -Math.PI / 2;
        this.gridMesh.position.y = -500;
        this.scene.add(this.gridMesh);
    }
    
    setupLighting() {
        // Remove default lighting and add cyberpunk lighting
        this.scene.children = this.scene.children.filter(child => !(child instanceof THREE.Light));
        
        // Ambient cyberpunk glow
        const ambientLight = new THREE.AmbientLight(0x001122, 0.3);
        this.scene.add(ambientLight);
        
        // Neon accent lights
        const light1 = new THREE.PointLight(0x00ffff, 1, 1000);
        light1.position.set(-200, 200, 200);
        this.scene.add(light1);
        
        const light2 = new THREE.PointLight(0xff0080, 1, 1000);
        light2.position.set(200, 200, -200);
        this.scene.add(light2);
        
        const light3 = new THREE.PointLight(0x8000ff, 0.8, 800);
        light3.position.set(0, 300, 0);
        this.scene.add(light3);
        
        // Set dark cyberpunk background
        this.scene.background = new THREE.Color(0x000011);
        this.scene.fog = new THREE.Fog(0x000022, 500, 2000);
    }
    
    update(deltaTime, audioData) {
        if (!this.gridMesh) return;
        
        this.time += deltaTime;
        this.gridMesh.material.uniforms.time.value = this.time;
        
        // Audio-reactive grid color
        if (audioData && audioData.length > 0) {
            const avgAmplitude = audioData.reduce((sum, val) => sum + Math.abs(val), 0) / audioData.length;
            const intensity = 0.5 + avgAmplitude * 2.0;
            
            // Cycle through cyberpunk colors
            const hue = (this.time * 0.1 + avgAmplitude) % 1.0;
            const color = new THREE.Color().setHSL(hue, 1.0, intensity);
            this.gridMesh.material.uniforms.gridColor.value = color;
        }
    }
    
    dispose() {
        if (this.gridMesh) {
            this.scene.remove(this.gridMesh);
            this.gridMesh.geometry.dispose();
            this.gridMesh.material.dispose();
        }
    }
}