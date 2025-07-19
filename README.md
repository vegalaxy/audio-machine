# Audio Machine

Hand-controlled arpeggiator, drum machine, and audio reactive visualizer.

An interactive web app built with threejs, mediapipe computer vision, and tone.js.

- Hand #1 controls the arpeggios (raise hand to raise pitch, pinch to change volume)
- Hand #2 controls the drums (raise different fingers to change the pattern)

## Requirements

- Modern web browser with WebGL support
- Camera access enabled for hand tracking

## Technologies

- **MediaPipe** for hand tracking and gesture recognition
- **Three.js** for audio reactive visual rendering
- **Tone.js** for synthesizer sounds
- **HTML5 Canvas** for visual feedback
- **JavaScript** for real-time interaction

## Setup for Development

```bash
# Clone this repository
git clone https://github.com/vegalaxy/audio-machine.git

# Navigate to the project directory
cd audio-machine

# Serve with your preferred method (example using Python)
python -m http.server
```

Then navigate to `http://localhost:8000` in your browser.

## Usage

1. Allow camera access when prompted
2. Raise your hands in front of the camera
3. **Left hand**: Controls arpeggios - move up/down to change pitch, pinch fingers to control volume
4. **Right hand**: Controls drums - raise different fingers to trigger different drum patterns

## License

MIT License

## Credits

- Three.js - https://threejs.org/
- MediaPipe - https://mediapipe.dev/
- Tone.js - https://tonejs.github.io/
