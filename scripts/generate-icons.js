/**
 * Einfacher PNG-Icon-Generator ohne externe Abhängigkeiten
 * Erstellt minimale PNG-Icons für die PWA
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// PNG-Helfer-Funktionen
function crc32(data) {
    let crc = -1;
    for (let i = 0; i < data.length; i++) {
        crc = crc32Table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ -1) >>> 0;
}

const crc32Table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crc32Table[i] = c;
}

function createChunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);

    const combined = Buffer.concat([typeBytes, data]);
    const crcValue = crc32(combined);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crcValue);

    return Buffer.concat([length, combined, crcBuffer]);
}

function createPNG(width, height, pixels) {
    // PNG-Signatur
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR-Chunk
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;  // Bit-Tiefe
    ihdr[9] = 6;  // Farbtyp (RGBA)
    ihdr[10] = 0; // Kompression
    ihdr[11] = 0; // Filter
    ihdr[12] = 0; // Interlace

    // Bilddaten mit Filter-Bytes
    const rawData = [];
    for (let y = 0; y < height; y++) {
        rawData.push(0); // Filter-Byte (None)
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            rawData.push(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]);
        }
    }

    // IDAT-Chunk (komprimierte Bilddaten)
    const compressed = zlib.deflateSync(Buffer.from(rawData), { level: 9 });

    // IEND-Chunk
    const iend = Buffer.alloc(0);

    return Buffer.concat([
        signature,
        createChunk('IHDR', ihdr),
        createChunk('IDAT', compressed),
        createChunk('IEND', iend)
    ]);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function lerp(a, b, t) {
    return Math.round(a + (b - a) * t);
}

function drawRoundedRect(pixels, width, x, y, w, h, r, color) {
    const { r: cr, g: cg, b: cb } = color;

    for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) {
            // Prüfe ob Pixel innerhalb des abgerundeten Rechtecks liegt
            let inside = true;

            // Ecken-Check
            const corners = [
                { cx: x + r, cy: y + r },         // oben-links
                { cx: x + w - r, cy: y + r },     // oben-rechts
                { cx: x + r, cy: y + h - r },     // unten-links
                { cx: x + w - r, cy: y + h - r }  // unten-rechts
            ];

            for (const corner of corners) {
                const inCornerArea =
                    (px < x + r && py < y + r) ||
                    (px >= x + w - r && py < y + r) ||
                    (px < x + r && py >= y + h - r) ||
                    (px >= x + w - r && py >= y + h - r);

                if (inCornerArea) {
                    const dx = px - corner.cx;
                    const dy = py - corner.cy;
                    if (dx * dx + dy * dy > r * r) {
                        inside = false;
                        break;
                    }
                }
            }

            if (inside && px >= 0 && px < width && py >= 0 && py < pixels.length / width / 4) {
                const idx = (py * width + px) * 4;
                pixels[idx] = cr;
                pixels[idx + 1] = cg;
                pixels[idx + 2] = cb;
                pixels[idx + 3] = 255;
            }
        }
    }
}

function generateIcon(size) {
    const pixels = new Uint8Array(size * size * 4);
    const scale = size / 512;

    // Hintergrund-Gradient
    const bgColor1 = hexToRgb('#1a1a2e');
    const bgColor2 = hexToRgb('#16213e');

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const t = (x + y) / (size * 2);
            const idx = (y * size + x) * 4;

            // Prüfe ob innerhalb des abgerundeten Hintergrund-Rechtecks
            const cornerRadius = Math.floor(80 * scale);
            let inside = true;

            const corners = [
                { cx: cornerRadius, cy: cornerRadius },
                { cx: size - cornerRadius, cy: cornerRadius },
                { cx: cornerRadius, cy: size - cornerRadius },
                { cx: size - cornerRadius, cy: size - cornerRadius }
            ];

            for (const corner of corners) {
                const inCornerArea =
                    (x < cornerRadius && y < cornerRadius) ||
                    (x >= size - cornerRadius && y < cornerRadius) ||
                    (x < cornerRadius && y >= size - cornerRadius) ||
                    (x >= size - cornerRadius && y >= size - cornerRadius);

                if (inCornerArea) {
                    const dx = x - corner.cx;
                    const dy = y - corner.cy;
                    if (dx * dx + dy * dy > cornerRadius * cornerRadius) {
                        inside = false;
                        break;
                    }
                }
            }

            if (inside) {
                pixels[idx] = lerp(bgColor1.r, bgColor2.r, t);
                pixels[idx + 1] = lerp(bgColor1.g, bgColor2.g, t);
                pixels[idx + 2] = lerp(bgColor1.b, bgColor2.b, t);
                pixels[idx + 3] = 255;
            } else {
                pixels[idx + 3] = 0; // Transparent
            }
        }
    }

    // Block-Definitionen
    const blocks = [
        // T-Piece (Cyan)
        { x: 156, y: 80, color: '#00f5ff' },
        { x: 96, y: 140, color: '#00f5ff' },
        { x: 156, y: 140, color: '#00f5ff' },
        { x: 216, y: 140, color: '#00f5ff' },
        // L-Piece (Orange)
        { x: 296, y: 80, color: '#ff9f43' },
        { x: 296, y: 140, color: '#ff9f43' },
        { x: 296, y: 200, color: '#ff9f43' },
        { x: 356, y: 200, color: '#ff9f43' },
        // S-Piece (Green)
        { x: 156, y: 220, color: '#6bcb77' },
        { x: 216, y: 220, color: '#6bcb77' },
        { x: 96, y: 280, color: '#6bcb77' },
        { x: 156, y: 280, color: '#6bcb77' },
        // O-Piece (Yellow)
        { x: 296, y: 280, color: '#ffd93d' },
        { x: 356, y: 280, color: '#ffd93d' },
        { x: 296, y: 340, color: '#ffd93d' },
        { x: 356, y: 340, color: '#ffd93d' },
        // I-Piece (Purple)
        { x: 96, y: 360, color: '#9b59b6' },
        { x: 156, y: 360, color: '#9b59b6' },
        { x: 216, y: 360, color: '#9b59b6' },
        { x: 276, y: 360, color: '#9b59b6' }
    ];

    const blockSize = Math.floor(56 * scale);
    const blockRadius = Math.floor(6 * scale);

    blocks.forEach(block => {
        const x = Math.floor(block.x * scale);
        const y = Math.floor(block.y * scale);
        drawRoundedRect(pixels, size, x, y, blockSize, blockSize, blockRadius, hexToRgb(block.color));
    });

    return createPNG(size, size, pixels);
}

// Icons-Verzeichnis erstellen falls nicht vorhanden
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Alle Icon-Größen generieren
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('🎮 Generiere Tetris PWA Icons...\n');

sizes.forEach(size => {
    const png = generateIcon(size);
    const filename = path.join(iconsDir, `icon-${size}.png`);
    fs.writeFileSync(filename, png);
    console.log(`✅ icon-${size}.png erstellt`);
});

// Screenshot generieren
const screenshotSize = { width: 540, height: 720 };
const screenshotPixels = new Uint8Array(screenshotSize.width * screenshotSize.height * 4);

// Hintergrund
const bgColor = hexToRgb('#1a1a2e');
for (let i = 0; i < screenshotPixels.length; i += 4) {
    screenshotPixels[i] = bgColor.r;
    screenshotPixels[i + 1] = bgColor.g;
    screenshotPixels[i + 2] = bgColor.b;
    screenshotPixels[i + 3] = 255;
}

const screenshotPng = createPNG(screenshotSize.width, screenshotSize.height, screenshotPixels);
fs.writeFileSync(path.join(iconsDir, 'screenshot-1.png'), screenshotPng);
console.log('✅ screenshot-1.png erstellt');

console.log('\n🎉 Alle Icons wurden erfolgreich generiert!');
console.log(`📁 Speicherort: ${iconsDir}`);
