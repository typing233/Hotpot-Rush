const AudioManager = {
    audioContext: null,
    sounds: {},
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    },
    
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    },
    
    playBoil() {
        this.playTone(150, 0.5, 'sawtooth', 0.1);
        setTimeout(() => this.playTone(160, 0.5, 'sawtooth', 0.1), 300);
    },
    
    playPop() {
        this.playTone(800, 0.1, 'sine', 0.4);
        setTimeout(() => this.playTone(1000, 0.05, 'sine', 0.2), 50);
    },
    
    playError() {
        this.playTone(200, 0.2, 'square', 0.3);
        setTimeout(() => this.playTone(150, 0.2, 'square', 0.3), 100);
    },
    
    playPowerup() {
        this.playTone(400, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(600, 0.1, 'sine', 0.3), 100);
        setTimeout(() => this.playTone(800, 0.2, 'sine', 0.3), 200);
    },
    
    playVictory() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.3, 'sine', 0.4), i * 150);
        });
    },
    
    playDefeat() {
        const notes = [400, 350, 300, 250];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.4, 'sawtooth', 0.3), i * 200);
        });
    },
    
    playCombo() {
        this.playTone(600, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(800, 0.1, 'sine', 0.3), 50);
    }
};

document.addEventListener('click', () => {
    if (AudioManager.audioContext && AudioManager.audioContext.state === 'suspended') {
        AudioManager.audioContext.resume();
    }
}, { once: true });
