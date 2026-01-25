/**
 * TETRIS PWA - Partikel-Effekt-System
 * Erzeugt bunte Partikel-Effekte beim Löschen von Zeilen
 */

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 6 + 3;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8 - 2;
        this.gravity = 0.15;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.015;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3;
    }

    update() {
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
        this.size *= 0.98;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.life;

        // Glühender Effekt
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.isAnimating = false;
    }

    /**
     * Setzt Canvas-Größe
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    /**
     * Erzeugt Partikel-Explosion für gelöschte Zeilen
     */
    explodeRows(rows, cellSize, colors) {
        const particlesPerCell = 4;

        rows.forEach(row => {
            for (let col = 0; col < 10; col++) {
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;
                const color = colors[col] || this.getRandomColor();

                for (let i = 0; i < particlesPerCell; i++) {
                    this.particles.push(new Particle(x, y, color));
                }
            }
        });

        if (!this.isAnimating) {
            this.animate();
        }
    }

    /**
     * Erzeugt Konfetti-Effekt (z.B. bei Tetris oder Level-Up)
     */
    confetti(x, y, count = 50) {
        const colors = ['#00f5ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#9b59b6', '#ff9f43'];

        for (let i = 0; i < count; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particle = new Particle(x, y, color);
            particle.speedX = (Math.random() - 0.5) * 15;
            particle.speedY = (Math.random() - 0.5) * 15 - 5;
            particle.size = Math.random() * 8 + 4;
            this.particles.push(particle);
        }

        if (!this.isAnimating) {
            this.animate();
        }
    }

    /**
     * Zufällige Farbe für Partikel
     */
    getRandomColor() {
        const colors = ['#00f5ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#9b59b6', '#ff9f43'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Animations-Loop
     */
    animate() {
        this.isAnimating = true;

        // Canvas löschen
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Partikel aktualisieren und zeichnen
        this.particles = this.particles.filter(particle => {
            particle.update();
            particle.draw(this.ctx);
            return !particle.isDead();
        });

        // Weiter animieren wenn noch Partikel vorhanden
        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.isAnimating = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Alle Partikel löschen
     */
    clear() {
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
