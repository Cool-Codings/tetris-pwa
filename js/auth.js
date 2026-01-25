/**
 * TETRIS PWA - Authentifizierung
 * Einfacher Passwortschutz für das Spiel
 */

class TetrisAuth {
    constructor() {
        // Passwort obfuskiert als Char-Codes (nicht im Klartext)
        // [65, 115, 99, 101, 97] = "Ascea"
        this._k = [65, 115, 99, 101, 97];

        // DOM-Elemente
        this.modal = document.getElementById('password-modal');
        this.form = document.getElementById('password-form');
        this.input = document.getElementById('password-input');
        this.error = document.getElementById('password-error');
        this.toggleBtn = document.getElementById('toggle-password');
        this.rememberCheckbox = document.getElementById('remember-password');
        this.gameContainer = document.getElementById('game-container');

        this.isAuthenticated = false;
        this.init();
    }

    /**
     * Initialisierung
     */
    init() {
        // Prüfe ob bereits authentifiziert (gespeichertes Token)
        const savedAuth = localStorage.getItem('tetris-auth');
        if (savedAuth && this.verifyToken(savedAuth)) {
            this.unlock();
            return;
        }

        // Spiel sperren bis Authentifizierung
        this.lock();

        // Event-Listener einrichten
        this.setupEventListeners();
    }

    /**
     * Event-Listener einrichten
     */
    setupEventListeners() {
        // Formular absenden
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.checkPassword();
        });

        // Passwort anzeigen/verbergen
        this.toggleBtn.addEventListener('click', () => {
            const isPassword = this.input.type === 'password';
            this.input.type = isPassword ? 'text' : 'password';
            this.toggleBtn.textContent = isPassword ? '🙈' : '👁️';
        });

        // Fehler ausblenden bei Eingabe
        this.input.addEventListener('input', () => {
            this.error.classList.add('hidden');
        });

        // Enter-Taste
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.checkPassword();
            }
        });
    }

    /**
     * Dekodiert das gespeicherte Passwort
     */
    _decode() {
        return String.fromCharCode.apply(null, this._k);
    }

    /**
     * Generiert ein Token für die Speicherung
     */
    generateToken(password) {
        // Einfaches Token basierend auf Passwort-Länge und Prüfsumme
        let sum = 0;
        for (let i = 0; i < password.length; i++) {
            sum += password.charCodeAt(i) * (i + 1);
        }
        return btoa(password.length + ':' + sum);
    }

    /**
     * Verifiziert ein gespeichertes Token
     */
    verifyToken(token) {
        try {
            const expected = this.generateToken(this._decode());
            return token === expected;
        } catch {
            return false;
        }
    }

    /**
     * Prüft das eingegebene Passwort
     */
    checkPassword() {
        const password = this.input.value;

        if (!password) {
            this.showError();
            return;
        }

        // Direkter Vergleich mit dekodiertem Passwort
        const correct = this._decode();

        if (password === correct) {
            // Passwort korrekt
            if (this.rememberCheckbox.checked) {
                localStorage.setItem('tetris-auth', this.generateToken(password));
            }
            this.unlock();
        } else {
            // Passwort falsch
            this.showError();
            this.input.value = '';
            this.input.focus();
        }
    }

    /**
     * Zeigt Fehlermeldung an
     */
    showError() {
        this.error.classList.remove('hidden');

        // Eingabefeld schütteln
        this.input.style.animation = 'none';
        this.input.offsetHeight; // Reflow erzwingen
        this.input.style.animation = 'shake 0.4s ease';
    }

    /**
     * Sperrt das Spiel
     */
    lock() {
        this.isAuthenticated = false;
        this.modal.classList.remove('hidden');
        this.gameContainer.classList.add('locked');
        this.input.focus();
    }

    /**
     * Entsperrt das Spiel
     */
    unlock() {
        this.isAuthenticated = true;
        this.modal.classList.add('hidden');
        this.gameContainer.classList.remove('locked');

        // Animations-Effekt für den Übergang
        this.modal.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.modal.style.animation = '';
        }, 300);
    }

    /**
     * Prüft ob authentifiziert
     */
    isUnlocked() {
        return this.isAuthenticated;
    }

    /**
     * Logout (für Debug/Testing)
     */
    logout() {
        localStorage.removeItem('tetris-auth');
        this.lock();
    }
}

// Auth-System initialisieren wenn DOM bereit
let tetrisAuth;
document.addEventListener('DOMContentLoaded', () => {
    tetrisAuth = new TetrisAuth();
});
