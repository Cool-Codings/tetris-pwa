/**
 * TETRIS PWA - Sound System
 * Moderne Sounds mit Web Audio API und Sprachausgabe
 */

class SoundManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.initialized = false;
        this.voiceEnabled = true;

        // Amerikanisch klingende Sprüche für Zeilen-Clears
        this.singleLinePhrases = ['Nice!', 'Good!', 'Yeah!', 'Cool!', 'Sweet!'];
        this.doubleLinePhrases = ['Two rows!', 'Double!', 'Great!', 'Awesome!', 'Nice combo!'];
        this.tripleLinePhrases = ['Triple!', 'Fantastic!', 'Amazing!', 'Incredible!', 'Three rows!'];
        this.tetrisPhrases = ['TETRIS!', 'Perfect!', 'Excellent!', 'Outstanding!', 'Legendary!'];
        this.levelUpPhrases = ['Level up!', 'Next level!', 'Keep going!', 'Faster now!'];
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

            // Lade englische Stimme wenn verfügbar
            if ('speechSynthesis' in window) {
                speechSynthesis.onvoiceschanged = () => {
                    this.loadVoice();
                };
                this.loadVoice();
            }
        } catch (e) {
            console.warn('Web Audio API nicht verfügbar:', e);
            this.enabled = false;
        }
    }

    /**
     * Lädt eine englische Stimme
     */
    loadVoice() {
        const voices = speechSynthesis.getVoices();
        // Bevorzuge US-englische Stimmen
        this.voice = voices.find(v => v.lang === 'en-US') ||
            voices.find(v => v.lang.startsWith('en')) ||
            voices[0];
    }

    /**
     * Aktiviert/Deaktiviert Sound
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Spielt einen modernen Synthesizer-Ton
     */
    playTone(frequency, duration, type = 'sine', volume = 0.3, attack = 0.01, decay = 0.1) {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Oszillator erstellen
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Filter für wärmeren Sound
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.Q.setValueAtTime(1, now);

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);

        // ADSR Envelope für moderneren Sound
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + attack);
        gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + attack + decay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    /**
     * Spielt einen Akkord
     */
    playChord(frequencies, duration, volume = 0.2) {
        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, duration, 'sine', volume / frequencies.length);
            }, i * 20);
        });
    }

    /**
     * Spricht einen Text mit amerikanischer Stimme
     */
    speak(text) {
        if (!this.enabled || !this.voiceEnabled || !('speechSynthesis' in window)) return;

        // Unterbreche vorherige Ansage
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voice;
        utterance.rate = 1.1;  // Etwas schneller
        utterance.pitch = 1.0;
        utterance.volume = 0.8;

        speechSynthesis.speak(utterance);
    }

    /**
     * Wählt zufälligen Spruch aus Array
     */
    randomPhrase(phrases) {
        return phrases[Math.floor(Math.random() * phrases.length)];
    }

    /**
     * Sound beim Bewegen eines Steins - subtiler Klick
     */
    move() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.03);

        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

        oscillator.start(now);
        oscillator.stop(now + 0.03);
    }

    /**
     * Sound beim Drehen - Swoosh
     */
    rotate() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.Q.setValueAtTime(2, now);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.08);

        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }

    /**
     * Sound beim Landen - Dumpfer Aufprall
     */
    land() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Tiefer Thump
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();

        osc1.connect(gain1);
        gain1.connect(this.audioContext.destination);

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(150, now);
        osc1.frequency.exponentialRampToValueAtTime(50, now + 0.1);

        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc1.start(now);
        osc1.stop(now + 0.12);

        // Noise für Impact
        this.playNoise(0.05, 0.1);
    }

    /**
     * Noise Generator für Impact-Sounds
     */
    playNoise(duration, volume) {
        if (!this.audioContext) return;

        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }

        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 500;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

        noise.start();
    }

    /**
     * Sound beim Löschen einer Zeile mit Sprachausgabe
     */
    clearLine(linesCleared = 1) {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Schimmernder Sweep-Sound
        for (let i = 0; i < linesCleared; i++) {
            setTimeout(() => {
                const freq = 400 + (i * 150);
                this.playTone(freq, 0.3, 'sine', 0.25, 0.02, 0.05);
                this.playTone(freq * 1.5, 0.25, 'triangle', 0.15, 0.02, 0.05);
            }, i * 80);
        }

        // Sprachausgabe basierend auf Anzahl der Zeilen
        setTimeout(() => {
            switch (linesCleared) {
                case 1:
                    this.speak(this.randomPhrase(this.singleLinePhrases));
                    break;
                case 2:
                    this.speak(this.randomPhrase(this.doubleLinePhrases));
                    break;
                case 3:
                    this.speak(this.randomPhrase(this.tripleLinePhrases));
                    break;
                case 4:
                    // Tetris - extra episch!
                    this.playTetrisSound();
                    this.speak(this.randomPhrase(this.tetrisPhrases));
                    break;
            }
        }, linesCleared * 80 + 100);
    }

    /**
     * Epischer Tetris-Sound
     */
    playTetrisSound() {
        const now = this.audioContext.currentTime;

        // Aufsteigender Akkord
        const notes = [523, 659, 784, 1047]; // C, E, G, C
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.4, 'sine', 0.2, 0.01, 0.1);
                this.playTone(freq * 2, 0.3, 'triangle', 0.1, 0.01, 0.1);
            }, i * 60);
        });

        // Shimmer
        setTimeout(() => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.playTone(1500 + Math.random() * 500, 0.1, 'sine', 0.1);
                }, i * 30);
            }
        }, 250);
    }

    /**
     * Sound bei Level-Up mit Sprachausgabe
     */
    levelUp() {
        if (!this.enabled || !this.audioContext) return;

        // Triumphaler aufsteigender Sound
        const notes = [392, 494, 587, 784]; // G, B, D, G
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.25, 'sine', 0.2, 0.01, 0.05);
                this.playTone(freq * 1.5, 0.2, 'triangle', 0.1, 0.01, 0.05);
            }, i * 100);
        });

        // Fanfare-Ende
        setTimeout(() => {
            this.playChord([784, 988, 1175], 0.4, 0.25);
        }, 400);

        // Sprachausgabe
        setTimeout(() => {
            this.speak(this.randomPhrase(this.levelUpPhrases));
        }, 500);
    }

    /**
     * Sound bei Game Over
     */
    gameOver() {
        if (!this.enabled || !this.audioContext) return;

        // Trauriger absteigender Sound
        const notes = [400, 350, 300, 250, 200];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.4, 'sawtooth', 0.15, 0.02, 0.1);
            }, i * 200);
        });

        // Tiefer Boom am Ende
        setTimeout(() => {
            this.playTone(60, 0.8, 'sine', 0.3, 0.01, 0.2);
            this.playNoise(0.3, 0.15);
        }, 1000);

        // Sprachausgabe
        setTimeout(() => {
            this.speak('Game over!');
        }, 1200);
    }

    /**
     * Sound beim Schnell-Drop - Whoosh + Impact
     */
    hardDrop() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Schneller Whoosh
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.15);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);

        // Impact
        setTimeout(() => {
            this.playTone(60, 0.15, 'sine', 0.35, 0.001, 0.02);
            this.playNoise(0.08, 0.15);
        }, 100);
    }

    /**
     * UI-Klick Sound - Soft Click
     */
    click() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

        osc.start(now);
        osc.stop(now + 0.04);
    }
}

// Globale Sound-Manager Instanz
const soundManager = new SoundManager();
