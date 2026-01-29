/**
 * TETRIS PWA - Game Engine
 * Haupt-Spiellogik für Tetris
 */

// Tetromino-Definitionen (klassische 7 Formen)
const TETROMINOES = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: '#00f5ff'
    },
    O: {
        shape: [[1, 1], [1, 1]],
        color: '#ffd93d'
    },
    T: {
        shape: [[0, 1, 0], [1, 1, 1]],
        color: '#9b59b6'
    },
    S: {
        shape: [[0, 1, 1], [1, 1, 0]],
        color: '#6bcb77'
    },
    Z: {
        shape: [[1, 1, 0], [0, 1, 1]],
        color: '#ff6b6b'
    },
    J: {
        shape: [[1, 0, 0], [1, 1, 1]],
        color: '#3498db'
    },
    L: {
        shape: [[0, 0, 1], [1, 1, 1]],
        color: '#ff9f43'
    }
};

// Pentomino-Definitionen (8 neue Formen - werden ab Level 2 freigeschaltet)
const PENTOMINOES = {
    Plus: {
        shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
        color: '#ff69b4'  // Pink
    },
    U: {
        shape: [[1, 0, 1], [1, 1, 1]],
        color: '#00ced1'  // Türkis
    },
    W: {
        shape: [[1, 0, 0], [1, 1, 0], [0, 1, 1]],
        color: '#daa520'  // Gold
    },
    P: {
        shape: [[1, 1], [1, 1], [1, 0]],
        color: '#32cd32'  // Lime
    },
    F: {
        shape: [[0, 1, 1], [1, 1, 0], [0, 1, 0]],
        color: '#ff1493'  // Deep Pink
    },
    Y: {
        shape: [[0, 1], [1, 1], [0, 1], [0, 1]],
        color: '#7b68ee'  // Violett
    },
    V: {
        shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]],
        color: '#20b2aa'  // Seegrün
    },
    X: {
        shape: [[1, 0, 1], [0, 1, 0], [1, 0, 1]],
        color: '#ff4500'  // Orange-Rot
    }
};

// Klassische Tetrominoes (Level 1)
const TETROMINO_NAMES = Object.keys(TETROMINOES);
// Neue Pentominoes (werden ab Level 2 nacheinander freigeschaltet)
const PENTOMINO_NAMES = Object.keys(PENTOMINOES);

// Punkte-System
const POINTS = {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    TETRIS: 800,
    SOFT_DROP: 1,
    HARD_DROP: 2
};

class TetrisGame {
    constructor(canvas, nextCanvas, particleCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nextCanvas = nextCanvas;
        this.nextCtx = nextCanvas.getContext('2d');

        // Spielfeld-Dimensionen
        this.cols = 10;
        this.rows = 20;
        this.cellSize = 30;

        // Partikel-System
        this.particleSystem = new ParticleSystem(particleCanvas);

        // Spielzustand
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;

        // Timing
        this.lastDrop = 0;
        this.dropInterval = 800;  // Start bei 800ms
        this.animationId = null;

        // Callbacks
        this.onScoreUpdate = null;
        this.onLevelUpdate = null;
        this.onLinesUpdate = null;
        this.onGameOver = null;

        // Canvas-Größe setzen
        this.resizeCanvas();
    }

    /**
     * Canvas-Größe anpassen
     */
    resizeCanvas() {
        // Verfügbare Höhe berechnen (Game Area Container)
        const container = this.canvas.parentElement.parentElement;
        const maxHeight = container.clientHeight || 500;
        const maxWidth = container.clientWidth || 300;

        // Cell-Size basierend auf verfügbarem Platz berechnen
        // Größere Zellen erlauben für bessere Sichtbarkeit
        const cellByHeight = Math.floor((maxHeight - 10) / this.rows);
        const cellByWidth = Math.floor((maxWidth - 10) / this.cols);
        this.cellSize = Math.min(cellByHeight, cellByWidth);
        this.cellSize = Math.max(this.cellSize, 18); // Minimum 18px
        this.cellSize = Math.min(this.cellSize, 45); // Maximum 45px

        // Canvas-Größen setzen
        this.canvas.width = this.cols * this.cellSize;
        this.canvas.height = this.rows * this.cellSize;

        // Partikel-Canvas gleiche Größe
        this.particleSystem.resize(this.canvas.width, this.canvas.height);

        // Next-Piece Canvas (größer für Pentominoes - bis zu 4 Reihen, 3 Spalten)
        const nextCellSize = Math.max(12, Math.floor(this.cellSize * 0.5));
        this.nextCanvas.width = 4 * nextCellSize;
        this.nextCanvas.height = 4 * nextCellSize;

        // Neu zeichnen wenn Spiel läuft
        if (this.isRunning) {
            this.draw();
        }
    }

    /**
     * Neues Spiel starten
     */
    start() {
        // Board initialisieren
        this.board = Array.from({ length: this.rows }, () =>
            Array(this.cols).fill(null)
        );

        // Spielzustand zurücksetzen
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.isRunning = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.dropInterval = 800;  // Start bei 800ms
        this.lastDrop = performance.now();

        // Erste Steine erzeugen
        this.nextPiece = this.createPiece();
        this.spawnPiece();

        // UI aktualisieren
        this.updateUI();

        // Partikel löschen
        this.particleSystem.clear();

        // Spiel-Loop starten
        this.gameLoop();
    }

    /**
     * Gibt die verfügbaren Formen basierend auf dem Level zurück
     */
    getAvailableShapes() {
        // Level 1: nur klassische Tetrominoes
        // Ab Level 2: +1 Pentomino pro Level (bis alle 8 freigeschaltet sind)
        const unlockedPentominoes = Math.min(this.level - 1, PENTOMINO_NAMES.length);

        const available = [];

        // Alle klassischen Tetrominoes hinzufügen
        TETROMINO_NAMES.forEach(name => {
            available.push({ name, data: TETROMINOES[name] });
        });

        // Freigeschaltete Pentominoes hinzufügen
        for (let i = 0; i < unlockedPentominoes; i++) {
            const name = PENTOMINO_NAMES[i];
            available.push({ name, data: PENTOMINOES[name] });
        }

        return available;
    }

    /**
     * Erzeugt ein neues Tetromino/Pentomino
     */
    createPiece() {
        const available = this.getAvailableShapes();
        const selected = available[Math.floor(Math.random() * available.length)];
        const piece = selected.data;

        return {
            shape: piece.shape.map(row => [...row]),
            color: piece.color,
            x: Math.floor((this.cols - piece.shape[0].length) / 2),
            y: 0
        };
    }

    /**
     * Spawnt nächsten Stein
     */
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();

        // Startposition anpassen
        this.currentPiece.x = Math.floor((this.cols - this.currentPiece.shape[0].length) / 2);
        this.currentPiece.y = 0;

        // Game Over Check
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.gameOver();
        }

        this.drawNextPiece();
    }

    /**
     * Kollisions-Erkennung
     */
    checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;

                    // Grenzen prüfen
                    if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                        return true;
                    }

                    // Kollision mit anderen Steinen
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Bewegt Stein nach links/rechts
     */
    move(direction) {
        if (!this.isRunning || this.isPaused || this.isGameOver) return false;

        const newX = this.currentPiece.x + direction;

        if (!this.checkCollision(newX, this.currentPiece.y, this.currentPiece.shape)) {
            this.currentPiece.x = newX;
            soundManager.move();
            this.draw();
            return true;
        }
        return false;
    }

    /**
     * Dreht den aktuellen Stein
     */
    rotate() {
        if (!this.isRunning || this.isPaused || this.isGameOver) return false;

        const shape = this.currentPiece.shape;
        const rows = shape.length;
        const cols = shape[0].length;

        // Rotierte Matrix erstellen
        const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                rotated[col][rows - 1 - row] = shape[row][col];
            }
        }

        // Wall-Kick: Versuche verschiedene Positionen
        const kicks = [0, -1, 1, -2, 2];
        for (const kick of kicks) {
            if (!this.checkCollision(this.currentPiece.x + kick, this.currentPiece.y, rotated)) {
                this.currentPiece.shape = rotated;
                this.currentPiece.x += kick;
                soundManager.rotate();
                this.draw();
                return true;
            }
        }
        return false;
    }

    /**
     * Soft Drop - Stein fällt schneller
     */
    softDrop() {
        if (!this.isRunning || this.isPaused || this.isGameOver) return false;

        if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
            this.currentPiece.y++;
            this.score += POINTS.SOFT_DROP;
            this.updateUI();
            this.draw();
            return true;
        }
        return false;
    }

    /**
     * Hard Drop - Stein fällt sofort nach unten
     */
    hardDrop() {
        if (!this.isRunning || this.isPaused || this.isGameOver) return;

        let dropDistance = 0;
        while (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
            this.currentPiece.y++;
            dropDistance++;
        }

        this.score += dropDistance * POINTS.HARD_DROP;
        soundManager.hardDrop();
        this.lockPiece();
    }

    /**
     * Stein fixieren und neue Zeilen prüfen
     */
    lockPiece() {
        const { shape, color, x, y } = this.currentPiece;

        // Stein zum Board hinzufügen
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardY = y + row;
                    if (boardY >= 0) {
                        this.board[boardY][x + col] = color;
                    }
                }
            }
        }

        soundManager.land();

        // Vollständige Zeilen prüfen und löschen
        this.clearLines();

        // Nächsten Stein spawnen
        this.spawnPiece();
        this.draw();
    }

    /**
     * Vollständige Zeilen finden und löschen
     */
    clearLines() {
        const clearedRows = [];
        const rowColors = [];

        // Vollständige Zeilen finden
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== null)) {
                clearedRows.push(row);
                rowColors.push([...this.board[row]]);
            }
        }

        if (clearedRows.length > 0) {
            // Partikel-Effekt für jede Zeile
            clearedRows.forEach((row, index) => {
                this.particleSystem.explodeRows([row], this.cellSize, rowColors[index]);
            });

            // Sound abspielen
            soundManager.clearLine(clearedRows.length);

            // Zeilen entfernen und neue hinzufügen
            clearedRows.forEach(row => {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.cols).fill(null));
            });

            // Punkte berechnen
            const points = this.calculatePoints(clearedRows.length);
            this.score += points * this.level;
            this.lines += clearedRows.length;

            // Level-Up prüfen
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                // Geschwindigkeit: 800ms bei Level 1, -100ms pro Level, min 100ms
                this.dropInterval = Math.max(100, 800 - (this.level - 1) * 100);
                soundManager.levelUp();

                // Konfetti bei Level-Up
                this.particleSystem.confetti(
                    this.canvas.width / 2,
                    this.canvas.height / 2,
                    30
                );
            }

            // Tetris-Bonus Konfetti
            if (clearedRows.length === 4) {
                this.particleSystem.confetti(
                    this.canvas.width / 2,
                    this.canvas.height / 2,
                    80
                );
            }

            this.updateUI();
        }
    }

    /**
     * Punkte für gelöschte Zeilen berechnen
     */
    calculatePoints(lines) {
        switch (lines) {
            case 1: return POINTS.SINGLE;
            case 2: return POINTS.DOUBLE;
            case 3: return POINTS.TRIPLE;
            case 4: return POINTS.TETRIS;
            default: return 0;
        }
    }

    /**
     * Automatischer Fall
     */
    drop() {
        if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
            this.currentPiece.y++;
            this.draw();
        } else {
            this.lockPiece();
        }
    }

    /**
     * Haupt-Spielschleife
     */
    gameLoop(timestamp = 0) {
        if (!this.isRunning) return;

        if (!this.isPaused && !this.isGameOver) {
            // Automatischer Fall
            if (timestamp - this.lastDrop > this.dropInterval) {
                this.drop();
                this.lastDrop = timestamp;
            }
        }

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    /**
     * Pause umschalten
     */
    togglePause() {
        if (this.isGameOver) return;

        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.lastDrop = performance.now();
        }
        return this.isPaused;
    }

    /**
     * Spiel beenden
     */
    gameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        soundManager.gameOver();

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.onGameOver) {
            this.onGameOver(this.score);
        }
    }

    /**
     * Spiel komplett stoppen
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    /**
     * UI-Callbacks aufrufen
     */
    updateUI() {
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        if (this.onLevelUpdate) this.onLevelUpdate(this.level);
        if (this.onLinesUpdate) this.onLinesUpdate(this.lines);
    }

    /**
     * Spielfeld zeichnen
     */
    draw() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;

        // Canvas löschen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Gitter zeichnen
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }

        // Board zeichnen
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col]) {
                    this.drawCell(ctx, col, row, this.board[row][col]);
                }
            }
        }

        // Ghost-Piece zeichnen
        if (this.currentPiece) {
            this.drawGhostPiece();

            // Aktuellen Stein zeichnen
            const { shape, color, x, y } = this.currentPiece;
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        this.drawCell(ctx, x + col, y + row, color);
                    }
                }
            }
        }
    }

    /**
     * Ghost-Piece (Vorschau wo Stein landet)
     */
    drawGhostPiece() {
        if (!this.currentPiece) return;

        let ghostY = this.currentPiece.y;
        while (!this.checkCollision(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) {
            ghostY++;
        }

        const { shape, color, x } = this.currentPiece;
        const ctx = this.ctx;

        ctx.globalAlpha = 0.3;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawCell(ctx, x + col, ghostY + row, color);
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Einzelne Zelle zeichnen
     */
    drawCell(ctx, x, y, color) {
        const cellSize = this.cellSize;
        const padding = 2;
        const radius = 4;

        const px = x * cellSize + padding;
        const py = y * cellSize + padding;
        const size = cellSize - padding * 2;

        // Schatten/Glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;

        // Abgerundetes Rechteck
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(px, py, size, size, radius);
        ctx.fill();

        // Highlight (oben links)
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.roundRect(px + 2, py + 2, size - 4, size / 3, radius - 1);
        ctx.fill();

        // Schatten zurücksetzen
        ctx.shadowBlur = 0;
    }

    /**
     * Nächsten Stein zeichnen
     */
    drawNextPiece() {
        const ctx = this.nextCtx;
        // Cell-Size für Next-Canvas berechnen (basierend auf größter Dimension)
        const nextCellSize = Math.min(this.nextCanvas.width, this.nextCanvas.height) / 4;

        // Canvas löschen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (!this.nextPiece) return;

        const { shape, color } = this.nextPiece;

        // Zentrieren im Canvas
        const pieceWidth = shape[0].length * nextCellSize;
        const pieceHeight = shape.length * nextCellSize;
        const offsetX = (this.nextCanvas.width - pieceWidth) / 2;
        const offsetY = (this.nextCanvas.height - pieceHeight) / 2;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawNextCell(ctx, offsetX + col * nextCellSize, offsetY + row * nextCellSize, nextCellSize, color);
                }
            }
        }
    }

    /**
     * Zelle für Next-Piece zeichnen (mit eigener Größe)
     */
    drawNextCell(ctx, x, y, size, color) {
        const padding = 1;
        const radius = 3;

        ctx.shadowBlur = 5;
        ctx.shadowColor = color;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x + padding, y + padding, size - padding * 2, size - padding * 2, radius);
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}
