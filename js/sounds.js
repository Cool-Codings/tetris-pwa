/**
 * TETRIS PWA - Sound System
 * Erzeugt Sounds mit der Web Audio API (keine externen Dateien nötig)
 */

class SoundManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.initialized = false;
    }

    /**
     * Initialisiert den Audio-Kontext (muss nach User-Interaktion aufgerufen werden)
     */
    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('Audio initialisiert');
        } catch (e) {
            console.warn('Web Audio API nicht verfügbar:', e);
            this.enabled = false;
        }
    }

    /**
     * Aktiviert/Deaktiviert Sound
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Spielt einen Ton mit bestimmter Frequenz und Dauer
     */
    playTone(frequency, duration, type = 'square', volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    /**
     * Sound beim Bewegen eines Steins
     */
    move() {
        this.playTone(200, 0.05, 'square', 0.1);
    }

    /**
     * Sound beim Drehen eines Steins
     */
    rotate() {
        this.playTone(400, 0.1, 'sine', 0.2);
    }

    /**
     * Sound beim Landen eines Steins
     */
    land() {
        this.playTone(150, 0.15, 'triangle', 0.3);
    }

    /**
     * Sound beim Löschen einer Zeile
     */
    clearLine(linesCleared = 1) {
        const baseFreq = 523; // C5

        // Mehr Zeilen = höherer und längerer Sound
        for (let i = 0; i < linesCleared; i++) {
            setTimeout(() => {
                this.playTone(baseFreq + (i * 100), 0.2, 'sine', 0.3);
            }, i * 100);
        }

        // Bonus-Sound für Tetris (4 Zeilen)
        if (linesCleared === 4) {
            setTimeout(() => {
                this.playTone(784, 0.3, 'sine', 0.4); // G5
                setTimeout(() => this.playTone(988, 0.4, 'sine', 0.4), 100); // B5
            }, 400);
        }
    }

    /**
     * Sound bei Level-Up
     */
    levelUp() {
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.15, 'sine', 0.3);
            }, i * 100);
        });
    }

    /**
     * Sound bei Game Over
     */
    gameOver() {
        const notes = [392, 349, 330, 294]; // G4, F4, E4, D4
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.3, 'sawtooth', 0.2);
            }, i * 200);
        });
    }

    /**
     * Sound beim Schnell-Drop
     */
    hardDrop() {
        this.playTone(100, 0.1, 'triangle', 0.4);
        setTimeout(() => this.playTone(80, 0.15, 'triangle', 0.3), 50);
    }

    /**
     * UI-Klick Sound
     */
    click() {
        this.playTone(600, 0.05, 'sine', 0.15);
    }
}

// Globale Sound-Manager Instanz
const soundManager = new SoundManager();
