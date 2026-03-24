// BuildQuest: 3D Pixel Block Letter Renderer
// Shared utility for rendering retro 3D pixel text headers via Phaser Graphics textures

// Pixel font: each letter is a 5x7 grid (or 3-wide for narrow chars)
const GLYPHS = {
    'A': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    'B': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
    'C': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,1],[0,1,1,1,0]],
    'D': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
    'E': [[1,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
    'F': [[1,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],
    'G': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    'H': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    'I': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1]],
    'J': [[0,0,1,1,1],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    'K': [[1,0,0,0,1],[1,0,0,1,0],[1,0,1,0,0],[1,1,0,0,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
    'L': [[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
    'M': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    'N': [[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    'O': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    'P': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],
    'Q': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,1,0],[0,1,1,0,1]],
    'R': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
    'S': [[0,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[1,1,1,1,0]],
    'T': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
    'U': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    'V': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,1,0,1,0],[0,0,1,0,0]],
    'W': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,1,0,1],[1,1,0,1,1],[1,0,0,0,1]],
    'X': [[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1],[1,0,0,0,1]],
    'Y': [[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
    'Z': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
    '0': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,1,1],[1,0,1,0,1],[1,1,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    '1': [[0,0,1,0,0],[0,1,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0]],
    '2': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,1,1,1,1]],
    '3': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,0,1],[0,0,1,1,0],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    '4': [[0,0,0,1,0],[0,0,1,1,0],[0,1,0,1,0],[1,0,0,1,0],[1,1,1,1,1],[0,0,0,1,0],[0,0,0,1,0]],
    '5': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    '6': [[0,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    '7': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
    '8': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    '9': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[0,0,0,0,1],[0,1,1,1,0]],
    '!': [[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[0,0,0],[0,1,0]],
    ':': [[0,0,0],[0,1,0],[0,1,0],[0,0,0],[0,1,0],[0,1,0],[0,0,0]],
    '&': [[0,1,1,0,0],[1,0,0,1,0],[1,0,0,1,0],[0,1,1,0,0],[1,0,0,1,1],[1,0,0,1,0],[0,1,1,0,1]],
    ' ': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
};

// Predefined color themes
export const PIXEL_THEMES = {
    // Title screen: white face, green depth (largest)
    TITLE: {
        face: 0xFFFFFF, faceAlpha: 1,
        highlight: 0xFFFFFF, highlightAlpha: 0.35,
        shadow: 0x0a3d24, shadowDeep: 0x061a10,
        edgeRight: 0x19D979, edgeRightAlpha: 0.7,
        edgeBottom: 0x00AF66, edgeBottomAlpha: 0.6,
        glowTint: 0x4ade80,
    },
    // Game Over: red face, dark red depth
    GAME_OVER: {
        face: 0xff6b6b, faceAlpha: 1,
        highlight: 0xFFFFFF, highlightAlpha: 0.25,
        shadow: 0x4a0e0e, shadowDeep: 0x2a0505,
        edgeRight: 0xff4444, edgeRightAlpha: 0.7,
        edgeBottom: 0xcc2222, edgeBottomAlpha: 0.6,
        glowTint: 0xff4444,
    },
    // Level announcements: green face, dark depth
    LEVEL: {
        face: 0x4ade80, faceAlpha: 1,
        highlight: 0xFFFFFF, highlightAlpha: 0.3,
        shadow: 0x0a3d24, shadowDeep: 0x061a10,
        edgeRight: 0x19D979, edgeRightAlpha: 0.7,
        edgeBottom: 0x00AF66, edgeBottomAlpha: 0.6,
        glowTint: 0x4ade80,
    },
    // Subtle white: for info screen headers (HTP, Meet the Team, Tips)
    SUBTLE: {
        face: 0xFFFFFF, faceAlpha: 1,
        highlight: 0xFFFFFF, highlightAlpha: 0.25,
        shadow: 0x0a3d24, shadowDeep: 0x061a10,
        edgeRight: 0x19D979, edgeRightAlpha: 0.5,
        edgeBottom: 0x00AF66, edgeBottomAlpha: 0.4,
        glowTint: 0x4ade80,
    },
    // Gold: leaderboard
    GOLD: {
        face: 0xfbbf24, faceAlpha: 1,
        highlight: 0xFFFFFF, highlightAlpha: 0.3,
        shadow: 0x4a3200, shadowDeep: 0x2a1c00,
        edgeRight: 0xf59e0b, edgeRightAlpha: 0.7,
        edgeBottom: 0xd97706, edgeBottomAlpha: 0.6,
        glowTint: 0xfbbf24,
    },
    // White face green depth (like title but for smaller headers)
    WHITE_GREEN: {
        face: 0xFFFFFF, faceAlpha: 1,
        highlight: 0xFFFFFF, highlightAlpha: 0.35,
        shadow: 0x0a3d24, shadowDeep: 0x061a10,
        edgeRight: 0x19D979, edgeRightAlpha: 0.7,
        edgeBottom: 0x00AF66, edgeBottomAlpha: 0.6,
        glowTint: 0x4ade80,
    },
};

/**
 * Generate a Phaser texture with 3D pixel block text
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {string} texKey - Unique texture key
 * @param {string} text - Text to render (uppercase)
 * @param {object} options - { px: pixel size, depth: 3D layers, theme: PIXEL_THEMES key or custom }
 * @returns {{ width: number, height: number }} texture dimensions
 */
export function generatePixelTextTexture(scene, texKey, text, options = {}) {
    const px = options.px || 6;
    const depth = options.depth || 3;
    const theme = options.theme || PIXEL_THEMES.TITLE;
    const letterGap = options.letterGap || 2;
    const wordGap = options.wordGap || 5;

    if (scene.textures.exists(texKey)) {
        // Return cached dimensions
        const frame = scene.textures.getFrame(texKey);
        return { width: frame.width, height: frame.height };
    }

    // Calculate total width in block units
    let totalBlockW = 0;
    for (let i = 0; i < text.length; i++) {
        const glyph = GLYPHS[text[i]];
        if (!glyph) continue;
        totalBlockW += glyph[0].length;
        if (i < text.length - 1) {
            totalBlockW += (text[i] === ' ' ? wordGap : letterGap);
        }
    }

    const totalWidth = totalBlockW * px + depth * px;
    const totalHeight = 7 * px + depth * px;

    const g = scene.make.graphics({ add: false });

    let curX = 0;
    for (let ci = 0; ci < text.length; ci++) {
        const ch = text[ci];
        const glyph = GLYPHS[ch];
        if (!glyph) continue;

        const cols = glyph[0].length;
        const rows = glyph.length;

        // Draw depth layers back to front
        for (let d = depth; d >= 0; d--) {
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    if (!glyph[row][col]) continue;
                    const bx = curX * px + col * px + d * px;
                    const by = row * px + d * px;

                    if (d === 0) {
                        g.fillStyle(theme.face, theme.faceAlpha);
                        g.fillRect(bx, by, px, px);
                        // Top-left highlight
                        g.fillStyle(theme.highlight, theme.highlightAlpha);
                        g.fillRect(bx, by, px, 1);
                        g.fillRect(bx, by, 1, px);
                    } else if (d === depth) {
                        g.fillStyle(theme.shadowDeep, 1);
                        g.fillRect(bx, by, px, px);
                    } else {
                        g.fillStyle(theme.shadow, 1);
                        g.fillRect(bx, by, px, px);
                    }
                }
            }
        }

        // Edge accents on front face
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (!glyph[row][col]) continue;
                const bx = curX * px + col * px;
                const by = row * px;

                const hasRight = col < cols - 1 && glyph[row][col + 1];
                if (!hasRight) {
                    g.fillStyle(theme.edgeRight, theme.edgeRightAlpha);
                    g.fillRect(bx + px - 1, by, 1, px);
                }

                const hasBelow = row < rows - 1 && glyph[row + 1] && glyph[row + 1][col];
                if (!hasBelow) {
                    g.fillStyle(theme.edgeBottom, theme.edgeBottomAlpha);
                    g.fillRect(bx, by + px - 1, px, 1);
                }
            }
        }

        curX += cols + (ch === ' ' ? wordGap : letterGap);
    }

    g.generateTexture(texKey, totalWidth, totalHeight);
    g.destroy();

    return { width: totalWidth, height: totalHeight };
}

/**
 * Add a 3D pixel text header to the scene with optional glow
 * @param {Phaser.Scene} scene
 * @param {number} x - Center x
 * @param {number} y - Center y
 * @param {string} text - Text to render (uppercase)
 * @param {object} options - { px, depth, theme, glow: boolean, glowAlpha }
 * @returns {Phaser.GameObjects.Image} the main image
 */
export function addPixelHeader(scene, x, y, text, options = {}) {
    const px = options.px || 6;
    const depth = options.depth || 3;
    const theme = options.theme || PIXEL_THEMES.TITLE;
    const showGlow = options.glow !== false;
    const depthLayer = options.depthLayer || 0;

    const texKey = `_pxhdr_${text}_${px}_${depth}`;
    generatePixelTextTexture(scene, texKey, text, { px, depth, theme });

    const img = scene.add.image(x, y, texKey).setOrigin(0.5);
    if (depthLayer) img.setDepth(depthLayer);

    if (showGlow && theme.glowTint) {
        const glowImg = scene.add.image(x, y, texKey).setOrigin(0.5)
            .setAlpha(options.glowAlpha || 0.12)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setTint(theme.glowTint);
        if (depthLayer) glowImg.setDepth(depthLayer);

        scene.tweens.add({
            targets: glowImg,
            alpha: { from: options.glowAlphaMin || 0.08, to: options.glowAlphaMax || 0.2 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        return { img, glowImg };
    }

    return { img };
}
