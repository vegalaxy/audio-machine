function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
import * as THREE from 'three';
// A class to create and manage a waveform visualizer using Tone.Analyser
export var WaveformVisualizer = /*#__PURE__*/ function() {
    "use strict";
    function WaveformVisualizer(scene, analyser, canvasWidth, canvasHeight) {
        _class_call_check(this, WaveformVisualizer);
        this.scene = scene;
        this.analyser = analyser;
        this.mesh = null;
        this.bufferLength = this.analyser.size;
        this.dataArray = new Float32Array(this.bufferLength);
        this.smoothedDataArray = new Float32Array(this.bufferLength); // For smoothing
        // Visual properties
        this.smoothingFactor = 0.4; // How much to smooth the wave (0.0 - 1.0)
        this.width = canvasWidth * 0.8; // Occupy 80% of the screen width
        this.height = 450; // The vertical amplitude of the wave
        this.yPosition = 0; // The vertical center of the wave
        this.baseThickness = 5.0; // Minimum thickness when inactive
        this.maxThickness = 60.0; // Maximum thickness when fully active
        this.currentThickness = this.baseThickness; // Current dynamic thickness
        this.currentColor = new THREE.Color('#00ffff'); // Start with cyberpunk cyan
        this.targetColor = new THREE.Color('#00ffff');
        this.uniforms = {
            solidColor: {
                value: this.currentColor
            },
            time: { value: 0 },
            glowIntensity: { value: 1.0 }
        };
        
        // Cyberpunk color palette
        this.cyberpunkColors = [
            '#00ffff', // Cyan
            '#ff0080', // Hot pink
            '#8000ff', // Purple
            '#00ff80', // Neon green
            '#ff8000', // Orange
            '#0080ff', // Electric blue
            '#ff0040', // Neon red
            '#40ff00'  // Lime green
        ];
        this.colorIndex = 0;
        this.time = 0;
        this._createVisualizer();
    }
    _create_class(WaveformVisualizer, [
        {
            key: "_createVisualizer",
            value: function _createVisualizer() {
                var material = new THREE.ShaderMaterial({
                    uniforms: this.uniforms,
                    vertexShader: "\n                varying vec2 vUv;\n                void main() {\n                    vUv = uv;\n                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n                }\n            ",
                    fragmentShader: `
                        uniform vec3 solidColor;
                        uniform float time;
                        uniform float glowIntensity;
                        varying vec2 vUv;
                        
                        void main() {
                            // Cyberpunk glow effect
                            float glow = sin(time * 3.0 + vUv.x * 10.0) * 0.3 + 0.7;
                            vec3 glowColor = solidColor * glow * glowIntensity;
                            
                            // Add edge glow
                            float edgeGlow = 1.0 - abs(vUv.y - 0.5) * 2.0;
                            edgeGlow = pow(edgeGlow, 2.0);
                            
                            gl_FragColor = vec4(glowColor + edgeGlow * solidColor * 0.5, 0.9);
                        }
                    `,
                    transparent: true,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending
                });
                var geometry = new THREE.BufferGeometry();
                var positions = new Float32Array(this.bufferLength * 2 * 3);
                var uvs = new Float32Array(this.bufferLength * 2 * 2);
                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
                var indices = [];
                for(var i = 0; i < this.bufferLength - 1; i++){
                    var p1 = i * 2; // top-left
                    var p2 = p1 + 1; // bottom-left
                    var p3 = (i + 1) * 2; // top-right
                    var p4 = p3 + 1; // bottom-right
                    indices.push(p1, p2, p3);
                    indices.push(p2, p4, p3);
                }
                geometry.setIndex(indices);
                this.mesh = new THREE.Mesh(geometry, material);
                this.scene.add(this.mesh);
                this.updatePosition(window.innerWidth, window.innerHeight);
            }
        },
        {
            // Call this from the main animation loop
            key: "update",
            value: function update() {
                if (!this.analyser || !this.mesh) return;
                
                // Update time for shader animation
                this.time += 0.016; // Assuming 60fps
                this.uniforms.time.value = this.time;
                // Smoothly interpolate the current color towards the target color
                this.currentColor.lerp(this.targetColor, 0.05);
                var newArray = this.analyser.getValue();
                if (_instanceof(newArray, Float32Array)) {
                    this.dataArray.set(newArray);
                }
                
                // Calculate average amplitude from the audio data
                var avgAmplitude = 0;
                for (var i = 0; i < this.dataArray.length; i++) {
                    avgAmplitude += Math.abs(this.dataArray[i]);
                }
                avgAmplitude /= this.dataArray.length;
                
                // Auto-cycle through cyberpunk colors when there's low audio activity
                if (avgAmplitude < 0.01) {
                    // Slowly cycle through colors when inactive
                    if (Math.floor(this.time * 0.5) % 120 === 0) { // Change every 2 seconds
                        this.colorIndex = (this.colorIndex + 1) % this.cyberpunkColors.length;
                        this.targetColor.set(this.cyberpunkColors[this.colorIndex]);
                    }
                } else {
                    // Reactive color changes based on audio when active
                    const colorIndex = Math.floor((avgAmplitude * 10 + this.time * 0.1) % this.cyberpunkColors.length);
                    this.targetColor.set(this.cyberpunkColors[colorIndex]);
                }
                
                // Audio-reactive glow
                this.uniforms.glowIntensity.value = 1.0 + avgAmplitude * 2.0;
                
                // Dynamic thickness based on audio activity
                var targetThickness = this.baseThickness + (avgAmplitude * 10) * (this.maxThickness - this.baseThickness);
                // Smooth the thickness changes
                this.currentThickness = this.currentThickness * 0.85 + targetThickness * 0.15;
                var positions = this.mesh.geometry.attributes.position.array;
                var uvs = this.mesh.geometry.attributes.uv.array;
                var startX = -this.width / 2;
                var xStep = this.width / (this.bufferLength - 1);
                var halfThickness = this.currentThickness / 2;
                for(var i = 0; i < this.bufferLength; i++){
                    // Apply exponential smoothing
                    this.smoothedDataArray[i] = this.smoothingFactor * this.dataArray[i] + (1 - this.smoothingFactor) * this.smoothedDataArray[i];
                    var x = startX + i * xStep;
                    var y = this.yPosition + this.smoothedDataArray[i] * this.height;
                    // Set top and bottom vertices for the ribbon
                    var vertexIndex = i * 2 * 3;
                    positions[vertexIndex] = x;
                    positions[vertexIndex + 1] = y + halfThickness;
                    positions[vertexIndex + 2] = 2;
                    positions[vertexIndex + 3] = x;
                    positions[vertexIndex + 4] = y - halfThickness;
                    positions[vertexIndex + 5] = 2;
                    // Set UVs
                    var uvIndex = i * 2 * 2;
                    uvs[uvIndex] = i / (this.bufferLength - 1); // U coordinate
                    uvs[uvIndex + 1] = 1.0; // V for top vertex
                    uvs[uvIndex + 2] = i / (this.bufferLength - 1); // U coordinate
                    uvs[uvIndex + 3] = 0.0; // V for bottom vertex
                }
                this.mesh.geometry.attributes.position.needsUpdate = true;
                this.mesh.geometry.attributes.uv.needsUpdate = true;
                this.mesh.geometry.computeBoundingSphere();
            }
        },
        {
            key: "updateColor",
            value: function updateColor(newColor) {
                // Manual color update - cycle to next cyberpunk color
                if (this.cyberpunkColors) {
                    this.colorIndex = (this.colorIndex + 1) % this.cyberpunkColors.length;
                    this.targetColor.set(this.cyberpunkColors[this.colorIndex]);
                }
            }
        },
        {
            // Call this on window resize
            key: "updatePosition",
            value: function updatePosition(canvasWidth, canvasHeight) {
                this.width = canvasWidth * 0.8;
                this.yPosition = -canvasHeight / 2 + 250; // Position it higher, above the drum beat indicators
            }
        },
        {
            // Clean up Three.js resources
            key: "dispose",
            value: function dispose() {
                if (this.mesh) {
                    this.scene.remove(this.mesh);
                    if (this.mesh.geometry) this.mesh.geometry.dispose();
                    if (this.mesh.material) this.mesh.material.dispose();
                }
            }
        }
    ]);
    return WaveformVisualizer;
}();