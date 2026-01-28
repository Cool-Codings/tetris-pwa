/**
 * TETRIS PWA - Haupt-Applikation
 * Verbindet alle Komponenten und verwaltet den Spielzustand
 */

/**
 * Typewriter-Effekt für den Titel
 */
class TitleTypewriter {
    constructor(element, names) {
        this.element = element;
        this.names = names;
        this.currentNameIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
        this.typeSpeed = 150;
        this.deleteSpeed = 100;
        this.pauseAfterType = 2000;
        this.pauseAfterDelete = 500;

        this.start();
    }

    start() {
        this.tick();
    }

    tick() {
        const currentName = this.names[this.currentNameIndex];

        if (this.isDeleting) {
            // Buchstaben löschen
            this.currentCharIndex--;
            this.element.textContent = currentName.substring(0, this.currentCharIndex);

            if (this.currentCharIndex === 0) {
                // Fertig mit Löschen, nächster Name
                this.isDeleting = false;
                this.currentNameIndex = (this.currentNameIndex + 1) % this.names.length;
                setTimeout(() => this.tick(), this.pauseAfterDelete);
            } else {
                setTimeout(() => this.tick(), this.deleteSpeed);
            }
        } else {
            // Buchstaben tippen
            this.currentCharIndex++;
            this.element.textContent = currentName.substring(0, this.currentCharIndex);

            // Farbe basierend auf Namen ändern
            this.updateColor();

            if (this.currentCharIndex === currentName.length) {
                // Fertig mit Tippen, Pause dann löschen
                this.isDeleting = true;
                setTimeout(() => this.tick(), this.pauseAfterType);
            } else {
                setTimeout(() => this.tick(), this.typeSpeed);
            }
        }
    }

    updateColor() {
        // Verschiedene Farben für verschiedene Namen
        const colors = {
            'Lui': '#00f5ff',           // Cyan
            'Kiki': '#ff6b6b',          // Pink/Rot
            'Tulio': '#6bcb77',         // Grün
            '... und Freunde': '#ffd93d' // Gelb
        };
        const currentName = this.names[this.currentNameIndex];
        const color = colors[currentName] || '#ffd93d';
        this.element.style.color = color;
        this.element.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
    }
}

class TetrisApp {
    constructor() {
        // DOM-Elemente
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            pause: document.getElementById('pause-screen'),
            gameOver: document.getElementById('gameover-screen')
        };

        // Canvas-Elemente
        this.gameCanvas = document.getElementById('game-canvas');
        this.nextCanvas = document.getElementById('next-canvas');
        this.particleCanvas = document.getElementById('particle-canvas');

        // UI-Elemente
        this.scoreDisplay = document.getElementById('score');
        this.levelDisplay = document.getElementById('level');
        this.linesDisplay = document.getElementById('lines');
        this.highscoreDisplay = document.getElementById('highscore-value');
        this.finalScoreDisplay = document.getElementById('final-score-value');
        this.newHighscoreElement = document.getElementById('new-highscore');
        this.soundIcon = document.getElementById('sound-icon');
        this.soundText = document.getElementById('sound-text');

        // Spiel initialisieren
        this.game = null;
        this.controls = null;
        this.highscore = this.loadHighscore();

        this.init();
    }

    init() {
        // Highscore anzeigen
        this.highscoreDisplay.textContent = this.highscore;

        // Sound-Toggle aus localStorage laden
        const soundEnabled = localStorage.getItem('tetris-sound') !== 'false';
        soundManager.enabled = soundEnabled;
        this.updateSoundButton();

        // Typewriter-Effekt für Titel starten
        const titleNameElement = document.getElementById('title-name');
        if (titleNameElement) {
            new TitleTypewriter(titleNameElement, ['Lui', 'Kiki', 'Tulio', '... und Freunde']);
        }

        // Event-Listener einrichten
        this.setupEventListeners();

        // Bildschirmgröße überwachen
        window.addEventListener('resize', () => this.handleResize());

        // Verhindere Zoom auf Mobile
        document.addEventListener('gesturestart', (e) => e.preventDefault());
    }

    setupEventListeners() {
        // Start-Button
        document.getElementById('start-button').addEventListener('click', () => {
            soundManager.init();
            soundManager.click();
            this.startGame();
        });

        // Sound-Toggle
        document.getElementById('sound-toggle').addEventListener('click', () => {
            soundManager.init();
            const enabled = soundManager.toggle();
            localStorage.setItem('tetris-sound', enabled);
            this.updateSoundButton();
            if (enabled) soundManager.click();
        });

        // Pause-Button
        document.getElementById('pause-button').addEventListener('click', () => {
            soundManager.click();
            this.pauseGame();
        });

        // Resume-Button
        document.getElementById('resume-button').addEventListener('click', () => {
            soundManager.click();
            this.resumeGame();
        });

        // Restart-Button
        document.getElementById('restart-button').addEventListener('click', () => {
            soundManager.click();
            this.restartGame();
        });

        // Menu-Button
        document.getElementById('menu-button').addEventListener('click', () => {
            soundManager.click();
            this.goToMenu();
        });

        // Play Again Button
        document.getElementById('play-again-button').addEventListener('click', () => {
            soundManager.click();
            this.restartGame();
        });

        // Back to Menu Button
        document.getElementById('back-to-menu-button').addEventListener('click', () => {
            soundManager.click();
            this.goToMenu();
        });

        // Tastatur für Pause (ESC oder P)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (this.screens.game.classList.contains('active')) {
                    if (this.screens.pause.classList.contains('active')) {
                        this.resumeGame();
                    } else if (!this.game?.isGameOver) {
                        this.pauseGame();
                    }
                }
            }
        });
    }

    updateSoundButton() {
        this.soundIcon.textContent = soundManager.enabled ? '🔊' : '🔇';
        this.soundText.textContent = soundManager.enabled ? 'Sound An' : 'Sound Aus';
    }

    showScreen(screenName) {
        // Alle Screens ausblenden
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });

        // Gewünschten Screen anzeigen
        this.screens[screenName].classList.add('active');
    }

    startGame() {
        this.showScreen('game');

        // Spiel erstellen
        this.game = new TetrisGame(
            this.gameCanvas,
            this.nextCanvas,
            this.particleCanvas
        );

        // Canvas-Größe nach Anzeige anpassen
        setTimeout(() => {
            this.game.resizeCanvas();

            // Callbacks einrichten
            this.game.onScoreUpdate = (score) => {
                this.scoreDisplay.textContent = score;
            };
            this.game.onLevelUpdate = (level) => {
                this.levelDisplay.textContent = level;
            };
            this.game.onLinesUpdate = (lines) => {
                this.linesDisplay.textContent = lines;
            };
            this.game.onGameOver = (score) => {
                this.handleGameOver(score);
            };

            // Steuerung einrichten
            this.controls = new GameControls(this.game);

            // Spiel starten
            this.game.start();
        }, 100);
    }

    pauseGame() {
        if (this.game && !this.game.isGameOver) {
            this.game.togglePause();
            this.screens.pause.classList.add('active');
        }
    }

    resumeGame() {
        if (this.game) {
            this.game.togglePause();
            this.screens.pause.classList.remove('active');
        }
    }

    restartGame() {
        this.screens.pause.classList.remove('active');
        this.screens.gameOver.classList.remove('active');

        if (this.game) {
            this.game.stop();
        }

        this.startGame();
    }

    goToMenu() {
        if (this.game) {
            this.game.stop();
        }
        if (this.controls) {
            this.controls.destroy();
        }

        this.screens.pause.classList.remove('active');
        this.screens.gameOver.classList.remove('active');
        this.showScreen('start');

        // Highscore aktualisieren
        this.highscoreDisplay.textContent = this.highscore;
    }

    handleGameOver(score) {
        // Highscore prüfen
        const isNewHighscore = score > this.highscore;

        if (isNewHighscore) {
            this.highscore = score;
            this.saveHighscore(score);
        }

        // Game Over Screen anzeigen
        this.finalScoreDisplay.textContent = score;
        this.newHighscoreElement.classList.toggle('hidden', !isNewHighscore);
        this.screens.gameOver.classList.add('active');
    }

    handleResize() {
        if (this.game && this.game.isRunning) {
            this.game.resizeCanvas();
            this.game.draw();
        }
    }

    loadHighscore() {
        const saved = localStorage.getItem('tetris-highscore');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveHighscore(score) {
        localStorage.setItem('tetris-highscore', score.toString());
    }
}

// App starten wenn DOM bereit ist
document.addEventListener('DOMContentLoaded', () => {
    window.tetrisApp = new TetrisApp();
});
