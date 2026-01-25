/**
 * TETRIS PWA - Steuerung
 * Tastatur und Touch-Steuerung
 */

class GameControls {
    constructor(game) {
        this.game = game;

        // Touch-Variablen
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isSwiping = false;
        this.swipeThreshold = 30;
        this.tapThreshold = 200; // ms

        // Wiederholung für gehaltene Tasten
        this.keyRepeatInterval = null;
        this.keyRepeatDelay = 150;
        this.activeKey = null;

        this.init();
    }

    init() {
        this.setupKeyboard();
        this.setupTouchButtons();
        this.setupSwipeControls();
    }

    /**
     * Tastatur-Steuerung einrichten
     */
    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (!this.game.isRunning || this.game.isPaused) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.startKeyRepeat('left', () => this.game.move(-1));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.startKeyRepeat('right', () => this.game.move(1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.startKeyRepeat('down', () => this.game.softDrop());
                    break;
                case 'ArrowUp':
                case ' ':
                    e.preventDefault();
                    this.game.rotate();
                    break;
                case 'Shift':
                    e.preventDefault();
                    this.game.hardDrop();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            const keyMap = {
                'ArrowLeft': 'left',
                'ArrowRight': 'right',
                'ArrowDown': 'down'
            };

            if (keyMap[e.key] === this.activeKey) {
                this.stopKeyRepeat();
            }
        });
    }

    /**
     * Tastenwiederhohlung starten
     */
    startKeyRepeat(key, action) {
        if (this.activeKey === key) return;

        this.stopKeyRepeat();
        this.activeKey = key;
        action();

        this.keyRepeatInterval = setInterval(() => {
            if (this.game.isRunning && !this.game.isPaused) {
                action();
            }
        }, this.keyRepeatDelay);
    }

    /**
     * Tastenwiederhohlung stoppen
     */
    stopKeyRepeat() {
        if (this.keyRepeatInterval) {
            clearInterval(this.keyRepeatInterval);
            this.keyRepeatInterval = null;
        }
        this.activeKey = null;
    }

    /**
     * Touch-Button-Steuerung einrichten
     */
    setupTouchButtons() {
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnRotate = document.getElementById('btn-rotate');
        const btnDown = document.getElementById('btn-down');

        // Hilfsfunktion für Touch-Events
        const addTouchEvents = (btn, action, repeat = false) => {
            let repeatInterval = null;

            const startAction = (e) => {
                e.preventDefault();
                if (!this.game.isRunning || this.game.isPaused) return;

                action();
                soundManager.click();

                if (repeat) {
                    repeatInterval = setInterval(() => {
                        if (this.game.isRunning && !this.game.isPaused) {
                            action();
                        }
                    }, 100);
                }
            };

            const stopAction = () => {
                if (repeatInterval) {
                    clearInterval(repeatInterval);
                    repeatInterval = null;
                }
            };

            btn.addEventListener('touchstart', startAction, { passive: false });
            btn.addEventListener('touchend', stopAction);
            btn.addEventListener('touchcancel', stopAction);

            // Auch Maus-Events für Desktop-Testing
            btn.addEventListener('mousedown', startAction);
            btn.addEventListener('mouseup', stopAction);
            btn.addEventListener('mouseleave', stopAction);
        };

        addTouchEvents(btnLeft, () => this.game.move(-1), true);
        addTouchEvents(btnRight, () => this.game.move(1), true);
        addTouchEvents(btnRotate, () => this.game.rotate(), false);
        addTouchEvents(btnDown, () => this.game.softDrop(), true);
    }

    /**
     * Swipe-Steuerung auf dem Canvas einrichten
     */
    setupSwipeControls() {
        const canvas = this.game.canvas;

        canvas.addEventListener('touchstart', (e) => {
            if (!this.game.isRunning || this.game.isPaused) return;

            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.touchStartTime = Date.now();
            this.isSwiping = false;
        }, { passive: true });

        canvas.addEventListener('touchmove', (e) => {
            if (!this.game.isRunning || this.game.isPaused) return;
            e.preventDefault();

            const touch = e.touches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;

            // Horizontaler Swipe
            if (Math.abs(deltaX) > this.swipeThreshold && !this.isSwiping) {
                this.isSwiping = true;
                if (deltaX > 0) {
                    this.game.move(1);
                } else {
                    this.game.move(-1);
                }
                this.touchStartX = touch.clientX;
            }

            // Vertikaler Swipe nach unten (Soft Drop)
            if (deltaY > this.swipeThreshold && !this.isSwiping) {
                this.isSwiping = true;
                this.game.softDrop();
                this.touchStartY = touch.clientY;
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            if (!this.game.isRunning || this.game.isPaused) return;

            const touchDuration = Date.now() - this.touchStartTime;

            // Tap zum Drehen (kurzer Touch ohne viel Bewegung)
            if (touchDuration < this.tapThreshold && !this.isSwiping) {
                this.game.rotate();
            }

            this.isSwiping = false;
        }, { passive: true });

        // Doppeltap für Hard Drop
        let lastTap = 0;
        canvas.addEventListener('touchend', (e) => {
            if (!this.game.isRunning || this.game.isPaused) return;

            const now = Date.now();
            if (now - lastTap < 300 && !this.isSwiping) {
                this.game.hardDrop();
            }
            lastTap = now;
        }, { passive: true });
    }

    /**
     * Steuerung deaktivieren
     */
    destroy() {
        this.stopKeyRepeat();
    }
}
