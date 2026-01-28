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
            this.currentCharIndex--;
            this.element.textContent = currentName.substring(0, this.currentCharIndex);

            if (this.currentCharIndex === 0) {
                this.isDeleting = false;
                this.currentNameIndex = (this.currentNameIndex + 1) % this.names.length;
                setTimeout(() => this.tick(), this.pauseAfterDelete);
            } else {
                setTimeout(() => this.tick(), this.deleteSpeed);
            }
        } else {
            this.currentCharIndex++;
            this.element.textContent = currentName.substring(0, this.currentCharIndex);
            this.updateColor();

            if (this.currentCharIndex === currentName.length) {
                this.isDeleting = true;
                setTimeout(() => this.tick(), this.pauseAfterType);
            } else {
                setTimeout(() => this.tick(), this.typeSpeed);
            }
        }
    }

    updateColor() {
        const colors = {
            'Lui': '#00f5ff',
            'Kiki': '#ff6b6b',
            'Tulio': '#6bcb77',
            '... und Freunde': '#ffd93d'
        };
        const currentName = this.names[this.currentNameIndex];
        const color = colors[currentName] || '#ffd93d';
        this.element.style.color = color;
        this.element.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
    }
}

/**
 * Highscore-Manager - Verwaltet die Top 10 Liste
 */
class HighscoreManager {
    constructor() {
        this.maxEntries = 10;
        this.storageKey = 'tetris-leaderboard';
        this.leaderboard = this.load();
    }

    /**
     * Lädt die Leaderboard-Daten aus localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Fehler beim Laden der Highscores:', e);
        }
        return [];
    }

    /**
     * Speichert die Leaderboard-Daten in localStorage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.leaderboard));
        } catch (e) {
            console.error('Fehler beim Speichern der Highscores:', e);
        }
    }

    /**
     * Prüft ob ein Score in die Top 10 kommt
     */
    qualifiesForTop10(score) {
        if (score <= 0) return false;
        if (this.leaderboard.length < this.maxEntries) return true;
        return score > this.leaderboard[this.leaderboard.length - 1].score;
    }

    /**
     * Gibt die Position zurück, die ein Score bekommen würde (1-10 oder -1)
     */
    getPositionForScore(score) {
        if (score <= 0) return -1;

        for (let i = 0; i < this.leaderboard.length; i++) {
            if (score > this.leaderboard[i].score) {
                return i + 1;
            }
        }

        if (this.leaderboard.length < this.maxEntries) {
            return this.leaderboard.length + 1;
        }

        return -1;
    }

    /**
     * Fügt einen neuen Score hinzu
     */
    addScore(score, name) {
        const entry = {
            score: score,
            name: name.substring(0, 10) || 'Anonym',
            date: new Date().toISOString()
        };

        // Einfügen an der richtigen Position
        let inserted = false;
        for (let i = 0; i < this.leaderboard.length; i++) {
            if (score > this.leaderboard[i].score) {
                this.leaderboard.splice(i, 0, entry);
                inserted = true;
                break;
            }
        }

        if (!inserted && this.leaderboard.length < this.maxEntries) {
            this.leaderboard.push(entry);
        }

        // Auf maxEntries begrenzen
        this.leaderboard = this.leaderboard.slice(0, this.maxEntries);

        this.save();
        return this.getPositionForScore(score);
    }

    /**
     * Gibt den höchsten Score zurück
     */
    getTopScore() {
        return this.leaderboard.length > 0 ? this.leaderboard[0].score : 0;
    }

    /**
     * Gibt die Leaderboard-Daten zurück
     */
    getLeaderboard() {
        return this.leaderboard;
    }

    /**
     * Formatiert ein Datum für die Anzeige
     */
    formatDate(isoString) {
        try {
            const date = new Date(isoString);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear().toString().slice(-2);
            return `${day}.${month}.${year}`;
        } catch (e) {
            return '-';
        }
    }
}

/**
 * Haupt-Applikation
 */
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
        this.finalScoreDisplay = document.getElementById('final-score-value');
        this.soundIcon = document.getElementById('sound-icon');
        this.soundText = document.getElementById('sound-text');

        // Highscore-Elemente
        this.nameInputSection = document.getElementById('name-input-section');
        this.playerNameInput = document.getElementById('player-name-input');
        this.saveScoreButton = document.getElementById('save-score-button');
        this.startLeaderboardList = document.getElementById('start-leaderboard-list');
        this.gameoverLeaderboardList = document.getElementById('gameover-leaderboard-list');

        // Spiel initialisieren
        this.game = null;
        this.controls = null;
        this.highscoreManager = new HighscoreManager();
        this.pendingScore = null;
        this.newEntryPosition = -1;

        this.init();
    }

    init() {
        // Leaderboard anzeigen
        this.renderLeaderboard(this.startLeaderboardList);

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

        // Score speichern Button
        this.saveScoreButton.addEventListener('click', () => {
            this.savePlayerScore();
        });

        // Enter-Taste im Namensfeld
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.savePlayerScore();
            }
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

    /**
     * Rendert die Leaderboard-Liste
     */
    renderLeaderboard(container, highlightPosition = -1) {
        const leaderboard = this.highscoreManager.getLeaderboard();

        if (leaderboard.length === 0) {
            container.innerHTML = '<div class="leaderboard-empty">Noch keine Highscores!</div>';
            return;
        }

        container.innerHTML = leaderboard.map((entry, index) => {
            const isHighlighted = (index + 1) === highlightPosition;
            return `
                <div class="leaderboard-entry ${isHighlighted ? 'highlight' : ''}">
                    <span class="leaderboard-rank">${index + 1}.</span>
                    <span class="leaderboard-score">${entry.score.toLocaleString()}</span>
                    <span class="leaderboard-name">${this.escapeHtml(entry.name)}</span>
                    <span class="leaderboard-date">${this.highscoreManager.formatDate(entry.date)}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Escaped HTML-Sonderzeichen
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Speichert den Spieler-Score
     */
    savePlayerScore() {
        if (this.pendingScore === null) return;

        const name = this.playerNameInput.value.trim() || 'Anonym';
        this.newEntryPosition = this.highscoreManager.addScore(this.pendingScore, name);

        // UI aktualisieren
        this.nameInputSection.classList.add('hidden');
        this.renderLeaderboard(this.gameoverLeaderboardList, this.newEntryPosition);

        // Pending Score löschen
        this.pendingScore = null;

        soundManager.click();
    }

    updateSoundButton() {
        this.soundIcon.textContent = soundManager.enabled ? '🔊' : '🔇';
        this.soundText.textContent = soundManager.enabled ? 'Sound An' : 'Sound Aus';
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        this.screens[screenName].classList.add('active');
    }

    startGame() {
        this.showScreen('game');

        this.game = new TetrisGame(
            this.gameCanvas,
            this.nextCanvas,
            this.particleCanvas
        );

        setTimeout(() => {
            this.game.resizeCanvas();

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

            this.controls = new GameControls(this.game);
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

        // Leaderboard aktualisieren
        this.renderLeaderboard(this.startLeaderboardList);
    }

    handleGameOver(score) {
        // Score anzeigen
        this.finalScoreDisplay.textContent = score.toLocaleString();

        // Prüfen ob Top 10
        const qualifies = this.highscoreManager.qualifiesForTop10(score);

        if (qualifies) {
            // Namenseingabe anzeigen
            this.pendingScore = score;
            this.playerNameInput.value = '';
            this.nameInputSection.classList.remove('hidden');
            this.newEntryPosition = -1;

            // Leaderboard ohne Highlight anzeigen
            this.renderLeaderboard(this.gameoverLeaderboardList);

            // Focus auf Namensfeld
            setTimeout(() => this.playerNameInput.focus(), 100);
        } else {
            // Nur Leaderboard anzeigen
            this.nameInputSection.classList.add('hidden');
            this.renderLeaderboard(this.gameoverLeaderboardList);
        }

        // Game Over Screen anzeigen
        this.screens.gameOver.classList.add('active');
    }

    handleResize() {
        if (this.game && this.game.isRunning) {
            this.game.resizeCanvas();
            this.game.draw();
        }
    }
}

// App starten wenn DOM bereit ist
document.addEventListener('DOMContentLoaded', () => {
    window.tetrisApp = new TetrisApp();
});
