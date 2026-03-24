// BuildQuest: Boot Scene — generates all textures programmatically

import { COLORS, TILE_SIZE, MAP } from '../utils/Constants.js';
import { generateAllThemeTextures } from '../utils/ThemeTextures.js';

export default class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Show loading bar
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.add.rectangle(w / 2, h / 2, w, h, COLORS.BG_DARK);

        const barW = 300;
        const barH = 20;
        const barX = (w - barW) / 2;
        const barY = h / 2 + 20;

        const bg = this.add.rectangle(w / 2, barY + barH / 2, barW, barH, COLORS.BG_DARK).setOrigin(0.5);
        const fill = this.add.rectangle(barX, barY, 0, barH, COLORS.ACCENT_GREEN).setOrigin(0, 0);

        const title = this.add.text(w / 2, h / 2 - 40, 'BUILDQUEST', {
            fontSize: '28px',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#4ade80',
        }).setOrigin(0.5);

        const subtitle = this.add.text(w / 2, h / 2 - 10, 'Loading...', {
            fontSize: '14px',
            fontFamily: "'Inter', sans-serif",
            color: '#ffffff',
            alpha: 0.6,
        }).setOrigin(0.5);
        subtitle.setAlpha(0.6);

        // Simulate loading progress
        this.load.on('progress', (value) => {
            fill.width = barW * value;
        });
    }

    create() {
        this.generateMapTextures();
        generateAllThemeTextures(this);
        this.generateLogo();
        this.showSplash();
    }

    showSplash() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Clear loading screen
        this.children.removeAll(true);

        // Dark background
        this.add.rectangle(w / 2, h / 2, w, h, 0x050a0e);

        // ── Twinkling star particles (NES/SNES style) ──
        const stars = [];
        for (let i = 0; i < 40; i++) {
            const sx = Phaser.Math.Between(10, w - 10);
            const sy = Phaser.Math.Between(10, h - 10);
            const size = Phaser.Math.Between(2, 4);
            const baseAlpha = Phaser.Math.FloatBetween(0.3, 0.5);
            const star = this.add.rectangle(sx, sy, size, size, 0xFFFFFF, baseAlpha).setDepth(11);
            stars.push(star);
            this.tweens.add({
                targets: star,
                alpha: { from: baseAlpha, to: Phaser.Math.FloatBetween(0.7, 1.0) },
                duration: Phaser.Math.Between(500, 1200),
                delay: Phaser.Math.Between(0, 500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }

        // ── CRT scanlines overlay ──
        const scanlines = this.add.graphics().setAlpha(0).setDepth(10);
        scanlines.fillStyle(0x000000, 0.12);
        for (let sy = 0; sy < h; sy += 2) {
            scanlines.fillRect(0, sy, w, 1);
        }
        this.tweens.add({
            targets: scanlines, alpha: 1,
            duration: 600, ease: 'Cubic.easeOut',
        });

        // Subtle radial glow behind logo — starts invisible, fades in
        const glow = this.add.graphics().setAlpha(0);
        glow.fillStyle(0x00AF66, 0.06);
        glow.fillCircle(w / 2, h / 2 - 20, 160);
        glow.fillStyle(0x00AF66, 0.03);
        glow.fillCircle(w / 2, h / 2 - 20, 260);

        // Horizontal logo layout: chevron on left + "BuildOps" text on right
        const logoScale = 0.7;
        const chevronW = 100 * logoScale;
        const gap = 12;
        const textWidth = 210;
        const totalW = chevronW + gap + textWidth;
        const startX = w / 2 - totalW / 2;

        // Chevron logo — starts scaled down and invisible
        const chevronX = startX + chevronW / 2;
        const chevronY = h / 2 - 20;
        const logo = this.add.image(chevronX, chevronY, 'logo_large')
            .setScale(0.4).setAlpha(0);

        // "BuildOps" text — Helvetica bold, pixelated, with stencil splits on O, p, s
        const textX = startX + chevronW + gap;
        const brandText = this.add.text(textX, chevronY, 'BuildOps', {
            fontSize: '40px', fontFamily: 'Helvetica, Arial, sans-serif', fontStyle: 'bold',
            color: '#FFFFFF', resolution: 1,
        }).setOrigin(0, 0.5).setAlpha(0);

        // Stencil splits — measure character positions
        const measure = (str) => {
            const t = this.add.text(0, -100, str, {
                fontSize: '40px', fontFamily: 'Helvetica, Arial, sans-serif', fontStyle: 'bold',
                resolution: 1,
            });
            const mw = t.width;
            t.destroy();
            return mw;
        };
        const buildW = measure('Build');
        const buildOW = measure('BuildO');
        const buildOpW = measure('BuildOp');
        const buildOpsW = measure('BuildOps');

        const stencilBg = 0x050a0e;
        const cutW = 3;
        const cutH = 44;
        const oCx = (buildW + buildOW) / 2 - 1;
        const pCx = (buildOW + buildOpW) / 2 - 1;
        const sCx = (buildOpW + buildOpsW) / 2 - 1;

        const cutRects = [oCx, pCx, sCx].map(cx => {
            return this.add.rectangle(textX + cx, chevronY, cutW, cutH, stencilBg).setAlpha(0);
        });

        // "presents" text below
        const presentsText = this.add.text(w / 2, chevronY + 50, 'presents', {
            fontSize: '13px', fontFamily: 'monospace',
            color: '#9ca3af', resolution: 2,
        }).setOrigin(0.5).setAlpha(0);

        // ── Screen flash on appearance (classic retro "power on") ──
        const flash = this.add.rectangle(w / 2, h / 2, w, h, 0xFFFFFF, 0).setDepth(20);
        this.tweens.add({
            targets: flash,
            alpha: { from: 0.4, to: 0 },
            duration: 500, delay: 150,
            ease: 'Cubic.easeOut',
        });

        // === Animation sequence ===

        // 1. Fade in glow
        this.tweens.add({
            targets: glow, alpha: 1,
            duration: 800, ease: 'Cubic.easeOut',
        });

        // 2. Chevron scales up and fades in
        this.tweens.add({
            targets: logo, alpha: 1, scale: logoScale,
            duration: 700, delay: 200, ease: 'Back.easeOut',
        });

        // 3. "BuildOps" text + stencil cuts fade in from right
        this.tweens.add({
            targets: [brandText, ...cutRects], alpha: 1,
            duration: 600, delay: 500, ease: 'Cubic.easeOut',
            onStart: () => {
                brandText.x = textX + 30;
                cutRects.forEach(r => r.x += 30);
            },
        });
        this.tweens.add({
            targets: brandText, x: textX,
            duration: 600, delay: 500, ease: 'Cubic.easeOut',
        });
        cutRects.forEach((r, i) => {
            const finalX = textX + [oCx, pCx, sCx][i];
            this.tweens.add({
                targets: r, x: finalX,
                duration: 600, delay: 500, ease: 'Cubic.easeOut',
            });
        });

        // 4. "presents" fades in
        this.tweens.add({
            targets: presentsText, alpha: 0.8,
            duration: 500, delay: 1100, ease: 'Cubic.easeOut',
        });

        // 5. Gentle pulse on the chevron
        this.tweens.add({
            targets: logo, scale: logoScale * 1.05,
            duration: 800, delay: 1200,
            yoyo: true, ease: 'Sine.easeInOut',
        });

        // Hold splash for 3.5s then fade out to Menu
        const allTargets = [logo, brandText, ...cutRects, presentsText, glow, scanlines, ...stars];
        setTimeout(() => {
            if (!this.scene.isActive()) return;
            this.tweens.add({
                targets: allTargets,
                alpha: 0,
                duration: 500,
                ease: 'Cubic.easeIn',
                onComplete: () => {
                    this.scene.start('Menu');
                },
            });
        }, 3500);

        // Skip on click/tap/key (after grace period to avoid accidental skips)
        const skip = () => {
            this.tweens.killAll();
            this.scene.start('Menu');
        };
        setTimeout(() => {
            if (!this.scene.isActive()) return;
            this.input.once('pointerdown', skip);
            this.input.keyboard.once('keydown', skip);
        }, 500);
    }

    generateMapTextures() {
        const S = TILE_SIZE;

        // ── Floor tile A — Zelda-style stone slab ──
        this.generateFloorA(S);

        // ── Floor tile B — alternate stone with moss ──
        this.generateFloorB(S);

        // ── Floor tile C — cracked stone variant ──
        this.generateFloorC(S);

        // ── Floor tile D — drain grate accent ──
        this.generateFloorD(S);

        // ── Wall tile — brick pattern with depth ──
        this.generateWallTile(S);

        // ── Wall top cap — beveled edge visible from above ──
        this.generateWallTop(S);

        // ── Shadow overlays for wall-adjacent floor tiles ──
        this.generateShadows(S);

        // Equipment decorations
        this.generateEquipment();
    }

    generateFloorA(S) {
        const g = this.make.graphics({ add: false });
        // Base stone color
        g.fillStyle(0x131d32);
        g.fillRect(0, 0, S, S);
        // Mortar lines (grid pattern like stone slabs)
        g.fillStyle(0x0c1422, 0.8);
        g.fillRect(0, 0, S, 1);       // top mortar
        g.fillRect(0, 0, 1, S);       // left mortar
        g.fillRect(S - 1, 0, 1, S);   // right mortar
        g.fillRect(0, S - 1, S, 1);   // bottom mortar
        // Stone surface variation — subtle lighter patches
        g.fillStyle(0x172440, 0.4);
        g.fillRect(3, 3, 12, 10);
        g.fillStyle(0x162240, 0.3);
        g.fillRect(17, 15, 11, 13);
        // Tiny speckles for texture
        g.fillStyle(0x1a2a48, 0.5);
        g.fillRect(5, 5, 2, 1);
        g.fillRect(22, 8, 1, 2);
        g.fillRect(14, 20, 2, 1);
        g.fillRect(8, 26, 1, 1);
        // Dark spots (wear marks)
        g.fillStyle(0x0a1020, 0.3);
        g.fillRect(10, 12, 3, 2);
        g.fillRect(24, 22, 2, 3);
        g.generateTexture('tile_floor', S, S);
        g.destroy();
    }

    generateFloorB(S) {
        const g = this.make.graphics({ add: false });
        g.fillStyle(0x101a2c);
        g.fillRect(0, 0, S, S);
        // Mortar
        g.fillStyle(0x0b1320, 0.7);
        g.fillRect(0, 0, S, 1);
        g.fillRect(0, 0, 1, S);
        g.fillRect(S - 1, 0, 1, S);
        g.fillRect(0, S - 1, S, 1);
        // Surface variation
        g.fillStyle(0x152038, 0.4);
        g.fillRect(6, 6, 14, 8);
        g.fillStyle(0x141e35, 0.3);
        g.fillRect(2, 18, 10, 10);
        // Moss/growth patches (green tint — BuildOps brand tie-in)
        g.fillStyle(0x0a3322, 0.25);
        g.fillRect(22, 2, 6, 4);
        g.fillRect(24, 4, 4, 3);
        g.fillStyle(0x0c3d28, 0.2);
        g.fillRect(1, 24, 5, 5);
        g.fillRect(3, 27, 3, 3);
        // Speckles
        g.fillStyle(0x1a2a48, 0.4);
        g.fillRect(12, 14, 1, 2);
        g.fillRect(20, 6, 2, 1);
        g.fillRect(7, 22, 1, 1);
        g.generateTexture('tile_floor2', S, S);
        g.destroy();
    }

    generateFloorC(S) {
        const g = this.make.graphics({ add: false });
        g.fillStyle(0x121c30);
        g.fillRect(0, 0, S, S);
        // Mortar
        g.fillStyle(0x0b1320, 0.7);
        g.fillRect(0, 0, S, 1);
        g.fillRect(0, 0, 1, S);
        g.fillRect(S - 1, 0, 1, S);
        g.fillRect(0, S - 1, S, 1);
        // Crack pattern — diagonal line
        g.fillStyle(0x0a1020, 0.6);
        g.fillRect(6, 4, 1, 3);
        g.fillRect(7, 6, 1, 2);
        g.fillRect(8, 7, 2, 1);
        g.fillRect(10, 8, 1, 3);
        g.fillRect(11, 10, 1, 2);
        g.fillRect(12, 11, 2, 1);
        g.fillRect(14, 12, 1, 3);
        // Second smaller crack
        g.fillStyle(0x0a1020, 0.4);
        g.fillRect(20, 18, 1, 3);
        g.fillRect(21, 20, 2, 1);
        g.fillRect(23, 21, 1, 2);
        // Surface variation
        g.fillStyle(0x162240, 0.3);
        g.fillRect(16, 2, 10, 8);
        g.fillStyle(0x152038, 0.35);
        g.fillRect(2, 16, 12, 10);
        g.generateTexture('tile_floor3', S, S);
        g.destroy();
    }

    generateFloorD(S) {
        const g = this.make.graphics({ add: false });
        g.fillStyle(0x111a2e);
        g.fillRect(0, 0, S, S);
        // Mortar
        g.fillStyle(0x0b1320, 0.7);
        g.fillRect(0, 0, S, 1);
        g.fillRect(0, 0, 1, S);
        g.fillRect(S - 1, 0, 1, S);
        g.fillRect(0, S - 1, S, 1);
        // Drain grate in center
        g.fillStyle(0x0a1020);
        g.fillRect(8, 8, 16, 16);
        // Grate bars
        g.fillStyle(0x2a3a55);
        g.fillRect(8, 8, 16, 2);
        g.fillRect(8, 22, 16, 2);
        g.fillRect(8, 8, 2, 16);
        g.fillRect(22, 8, 2, 16);
        // Inner bars
        g.fillStyle(0x1e2e4a);
        g.fillRect(12, 10, 1, 12);
        g.fillRect(16, 10, 1, 12);
        g.fillRect(20, 10, 1, 12);
        g.fillRect(10, 13, 12, 1);
        g.fillRect(10, 17, 12, 1);
        g.fillRect(10, 21, 12, 1);
        g.generateTexture('tile_floor4', S, S);
        g.destroy();
    }

    generateWallTile(S) {
        const g = this.make.graphics({ add: false });
        // Base wall color
        g.fillStyle(0x1e2845);
        g.fillRect(0, 0, S, S);

        // Brick pattern — 2 rows of bricks per tile
        const brickH = 7;
        const mortarW = 1;

        // Row 1 — full bricks, offset 0
        g.fillStyle(0x243252);
        g.fillRect(0, 0, 15, brickH);
        g.fillRect(16, 0, 16, brickH);
        // Brick highlight (top edge)
        g.fillStyle(0x2c3a5e, 0.5);
        g.fillRect(0, 0, 15, 1);
        g.fillRect(16, 0, 16, 1);
        // Brick shadow (bottom edge)
        g.fillStyle(0x161e38, 0.5);
        g.fillRect(0, brickH - 1, 15, 1);
        g.fillRect(16, brickH - 1, 16, 1);

        // Mortar between rows
        g.fillStyle(0x141c34, 0.6);
        g.fillRect(0, brickH, S, mortarW);

        // Row 2 — half-brick offset
        const y2 = brickH + mortarW;
        g.fillStyle(0x222e4e);
        g.fillRect(0, y2, 7, brickH);
        g.fillRect(8, y2, 16, brickH);
        g.fillRect(25, y2, 7, brickH);
        g.fillStyle(0x2a3658, 0.5);
        g.fillRect(0, y2, 7, 1);
        g.fillRect(8, y2, 16, 1);
        g.fillRect(25, y2, 7, 1);
        g.fillStyle(0x161e38, 0.5);
        g.fillRect(0, y2 + brickH - 1, 7, 1);
        g.fillRect(8, y2 + brickH - 1, 16, 1);
        g.fillRect(25, y2 + brickH - 1, 7, 1);

        // Mortar
        g.fillStyle(0x141c34, 0.6);
        g.fillRect(0, y2 + brickH, S, mortarW);

        // Row 3 — same as row 1
        const y3 = y2 + brickH + mortarW;
        g.fillStyle(0x243252);
        g.fillRect(0, y3, 15, brickH);
        g.fillRect(16, y3, 16, brickH);
        g.fillStyle(0x2c3a5e, 0.5);
        g.fillRect(0, y3, 15, 1);
        g.fillRect(16, y3, 16, 1);
        g.fillStyle(0x161e38, 0.5);
        g.fillRect(0, y3 + brickH - 1, 15, 1);
        g.fillRect(16, y3 + brickH - 1, 16, 1);

        // Mortar
        g.fillStyle(0x141c34, 0.6);
        g.fillRect(0, y3 + brickH, S, mortarW);

        // Row 4 — fill remaining space
        const y4 = y3 + brickH + mortarW;
        g.fillStyle(0x222e4e);
        g.fillRect(0, y4, 7, S - y4);
        g.fillRect(8, y4, 16, S - y4);
        g.fillRect(25, y4, 7, S - y4);
        g.fillStyle(0x2a3658, 0.5);
        g.fillRect(0, y4, 7, 1);
        g.fillRect(8, y4, 16, 1);
        g.fillRect(25, y4, 7, 1);

        // Vertical mortar lines
        g.fillStyle(0x141c34, 0.5);
        g.fillRect(15, 0, mortarW, brickH);
        g.fillRect(7, y2, mortarW, brickH);
        g.fillRect(24, y2, mortarW, brickH);
        g.fillRect(15, y3, mortarW, brickH);
        g.fillRect(7, y4, mortarW, S - y4);
        g.fillRect(24, y4, mortarW, S - y4);

        // Outer border
        g.lineStyle(1, 0x121a30, 0.4);
        g.strokeRect(0, 0, S, S);

        g.generateTexture('tile_wall', S, S);
        g.destroy();
    }

    generateWallTop(S) {
        const g = this.make.graphics({ add: false });
        // Same brick but with a highlighted top cap
        g.fillStyle(0x1e2845);
        g.fillRect(0, 0, S, S);
        // Cap highlight — beveled top edge
        g.fillStyle(0x2e3e60);
        g.fillRect(0, 0, S, 4);
        g.fillStyle(0x364870, 0.6);
        g.fillRect(0, 0, S, 2);
        // Shadow below cap
        g.fillStyle(0x141c34, 0.4);
        g.fillRect(0, 4, S, 2);
        // Brick pattern on remaining area
        g.fillStyle(0x222e4e);
        g.fillRect(0, 6, 15, 10);
        g.fillRect(16, 6, 16, 10);
        g.fillStyle(0x243252);
        g.fillRect(0, 17, 7, 8);
        g.fillRect(8, 17, 16, 8);
        g.fillRect(25, 17, 7, 8);
        g.fillStyle(0x222e4e);
        g.fillRect(0, 26, 15, 6);
        g.fillRect(16, 26, 16, 6);
        // Mortar
        g.fillStyle(0x141c34, 0.5);
        g.fillRect(0, 16, S, 1);
        g.fillRect(0, 25, S, 1);
        g.fillRect(15, 6, 1, 10);
        g.fillRect(7, 17, 1, 8);
        g.fillRect(24, 17, 1, 8);
        g.fillRect(15, 26, 1, 6);
        g.generateTexture('tile_wall_top', S, S);
        g.destroy();
    }

    generateShadows(S) {
        // Shadow cast downward from wall (placed on floor tile below wall)
        const gDown = this.make.graphics({ add: false });
        for (let i = 0; i < 8; i++) {
            gDown.fillStyle(0x000000, 0.12 * (1 - i / 8));
            gDown.fillRect(0, i, S, 1);
        }
        gDown.generateTexture('shadow_down', S, S);
        gDown.destroy();

        // Shadow cast rightward from wall
        const gRight = this.make.graphics({ add: false });
        for (let i = 0; i < 8; i++) {
            gRight.fillStyle(0x000000, 0.10 * (1 - i / 8));
            gRight.fillRect(i, 0, 1, S);
        }
        gRight.generateTexture('shadow_right', S, S);
        gRight.destroy();

        // Corner shadow (down + right)
        const gCorner = this.make.graphics({ add: false });
        for (let i = 0; i < 8; i++) {
            const a = 0.10 * (1 - i / 8);
            gCorner.fillStyle(0x000000, a);
            gCorner.fillRect(0, i, S, 1);
            gCorner.fillRect(i, 0, 1, S);
        }
        gCorner.generateTexture('shadow_corner', S, S);
        gCorner.destroy();
    }

    generateEquipment() {
        const S = TILE_SIZE;
        const cx = S / 2;
        const cy = S / 2;

        // ── HVAC Unit — fan turbine with rotation arrows (BuildOps HVAC icon) ──
        const hvacG = this.make.graphics({ add: false });
        // Metal casing
        hvacG.fillStyle(0x1a2844);
        hvacG.fillRect(0, 0, S, S);
        hvacG.fillStyle(0x1e3050);
        hvacG.fillRect(2, 2, S - 4, S - 4);
        // Casing bevel
        hvacG.fillStyle(0x243858, 0.6);
        hvacG.fillRect(2, 2, S - 4, 2);
        hvacG.fillRect(2, 2, 2, S - 4);
        hvacG.fillStyle(0x141e38, 0.6);
        hvacG.fillRect(2, S - 4, S - 4, 2);
        hvacG.fillRect(S - 4, 2, 2, S - 4);
        // Fan circle
        hvacG.lineStyle(2, 0x2a4060);
        hvacG.strokeCircle(cx, cy, 11);
        hvacG.fillStyle(0x162440);
        hvacG.fillCircle(cx, cy, 10);
        // Fan blades (4 blades radiating from center)
        hvacG.fillStyle(0x3a5a7a, 0.7);
        hvacG.fillRect(cx - 1, cy - 9, 3, 8);  // top blade
        hvacG.fillRect(cx - 1, cy + 1, 3, 8);  // bottom blade
        hvacG.fillRect(cx - 9, cy - 1, 8, 3);  // left blade
        hvacG.fillRect(cx + 1, cy - 1, 8, 3);  // right blade
        // Center hub
        hvacG.fillStyle(0x4a6a8a);
        hvacG.fillCircle(cx, cy, 3);
        hvacG.fillStyle(0x2a4060);
        hvacG.fillCircle(cx, cy, 1);
        // Rotation arrow hint (green accent)
        hvacG.fillStyle(0x00AF66, 0.5);
        hvacG.fillRect(cx + 6, cy - 8, 2, 1);
        hvacG.fillRect(cx + 7, cy - 7, 2, 1);
        // Corner screws
        hvacG.fillStyle(0x3a5070);
        hvacG.fillCircle(5, 5, 1.5);
        hvacG.fillCircle(S - 5, 5, 1.5);
        hvacG.fillCircle(5, S - 5, 1.5);
        hvacG.fillCircle(S - 5, S - 5, 1.5);
        hvacG.generateTexture('equip_hvac', S, S);
        hvacG.destroy();

        // ── Electrical Panel — lightning bolt motif (BuildOps Electrical icon) ──
        const panelG = this.make.graphics({ add: false });
        panelG.fillStyle(0x1a2540);
        panelG.fillRect(0, 0, S, S);
        // Panel body with recessed front
        panelG.fillStyle(0x162038);
        panelG.fillRect(3, 3, S - 6, S - 6);
        // Panel inner face
        panelG.fillStyle(0x1a2844);
        panelG.fillRect(5, 5, S - 10, S - 10);
        // Bevel highlight
        panelG.fillStyle(0x243858, 0.4);
        panelG.fillRect(3, 3, S - 6, 1);
        panelG.fillRect(3, 3, 1, S - 6);
        // Breaker switches in 2 columns
        for (let i = 0; i < 3; i++) {
            // Left column (red = off)
            panelG.fillStyle(0xBB3333);
            panelG.fillRect(7, 7 + i * 7, 5, 4);
            panelG.fillStyle(0x992222);
            panelG.fillRect(7, 7 + i * 7, 5, 1);
            // Right column (green = on)
            panelG.fillStyle(0x00AF66);
            panelG.fillRect(20, 7 + i * 7, 5, 4);
            panelG.fillStyle(0x008C52);
            panelG.fillRect(20, 7 + i * 7, 5, 1);
        }
        // Lightning bolt symbol (center-bottom)
        panelG.fillStyle(0xFFAE11, 0.7);
        panelG.fillRect(cx, S - 10, 3, 1);
        panelG.fillRect(cx - 1, S - 9, 3, 1);
        panelG.fillRect(cx - 2, S - 8, 4, 1);
        panelG.fillRect(cx - 1, S - 7, 3, 1);
        panelG.fillRect(cx, S - 6, 3, 1);
        // Warning label
        panelG.fillStyle(0xFFAE11, 0.3);
        panelG.fillRect(13, 7, 5, 3);
        panelG.generateTexture('equip_panel', S, S);
        panelG.destroy();

        // ── Commercial Rooftop Unit (RTU) — heavy-duty package HVAC ──
        const pipeG = this.make.graphics({ add: false });
        pipeG.fillStyle(0x0f1628);
        pipeG.fillRect(0, 0, S, S);
        // Curb/mounting base (steel I-beam rails)
        pipeG.fillStyle(0x3a4450);
        pipeG.fillRect(2, S - 5, S - 4, 5);
        pipeG.fillStyle(0x4a5460, 0.6);
        pipeG.fillRect(2, S - 5, S - 4, 1);
        // Main cabinet body (heavy gauge steel, beige/gray commercial look)
        pipeG.fillStyle(0x8a8a78);
        pipeG.fillRect(2, 8, S - 4, S - 13);
        // Top cap (darker steel hood)
        pipeG.fillStyle(0x5a5a50);
        pipeG.fillRect(2, 6, S - 4, 6);
        pipeG.fillStyle(0x6a6a60, 0.5);
        pipeG.fillRect(2, 6, S - 4, 2);
        // Intake louvers (left half — stacked horizontal slats)
        pipeG.fillStyle(0x3a3a30);
        for (let ly = 14; ly < S - 8; ly += 3) {
            pipeG.fillRect(4, ly, 18, 1);
        }
        // Louver housing border
        pipeG.lineStyle(1, 0x6a6a5a, 0.5);
        pipeG.strokeRect(3, 13, 20, S - 21);
        // Exhaust fan section (right half — circular fan behind grille)
        pipeG.fillStyle(0x2a2a24);
        pipeG.fillRect(25, 13, 19, S - 21);
        // Fan guard circle
        pipeG.lineStyle(1, 0x5a5a50, 0.7);
        pipeG.strokeCircle(34, cy + 2, 8);
        // Fan blades (3-blade commercial fan)
        pipeG.fillStyle(0x6a7a6a, 0.8);
        pipeG.fillRect(33, cy - 5, 2, 6);  // top blade
        pipeG.fillRect(29, cy + 3, 5, 2);  // bottom-left blade
        pipeG.fillRect(36, cy + 3, 5, 2);  // bottom-right blade
        // Fan hub
        pipeG.fillStyle(0x8a8a7a);
        pipeG.fillCircle(34, cy + 2, 2);
        // Service access panel (right side, with handle)
        pipeG.fillStyle(0x7a7a6a, 0.4);
        pipeG.fillRect(25, S - 12, 18, 4);
        // Panel latch/handle
        pipeG.fillStyle(0xaaaaaa);
        pipeG.fillRect(30, S - 11, 4, 2);
        // Electrical conduit (top)
        pipeG.fillStyle(0x5a6a7e);
        pipeG.fillRect(8, 4, 3, 5);
        pipeG.fillRect(8, 4, 12, 2);
        // Refrigerant lines (copper, coming out top)
        pipeG.fillStyle(0xcc8844);
        pipeG.fillRect(S - 10, 2, 2, 7);
        pipeG.fillRect(S - 7, 2, 2, 7);
        // Status LED
        pipeG.fillStyle(0x00AF66, 0.9);
        pipeG.fillRect(6, S - 8, 2, 2);
        // LED glow
        pipeG.fillStyle(0x00AF66, 0.15);
        pipeG.fillCircle(7, S - 7, 4);
        // Nameplate sticker
        pipeG.fillStyle(0xffffff, 0.12);
        pipeG.fillRect(5, S - 12, 12, 3);
        pipeG.generateTexture('equip_pipe', S, S);
        pipeG.destroy();

        // ── Ductwork — metallic duct with rivets and BuildOps green band ──
        const ductG = this.make.graphics({ add: false });
        ductG.fillStyle(0x0f1628);
        ductG.fillRect(0, 0, S, S);
        // Duct body
        ductG.fillStyle(0x6a7a8c);
        ductG.fillRect(0, 6, S, 20);
        // Top face highlight
        ductG.fillStyle(0x8a9aac);
        ductG.fillRect(0, 6, S, 3);
        // Bottom shadow
        ductG.fillStyle(0x4a5a6c);
        ductG.fillRect(0, 23, S, 3);
        // Seam lines
        ductG.fillStyle(0x5a6a7c, 0.6);
        ductG.fillRect(0, 15, S, 1);
        // Rivets along top and bottom
        ductG.fillStyle(0x5a6a7c);
        for (let rx = 3; rx < S; rx += 7) {
            ductG.fillCircle(rx, 9, 1.5);
            ductG.fillCircle(rx, 22, 1.5);
        }
        // BuildOps green identification band
        ductG.fillStyle(0x00AF66, 0.35);
        ductG.fillRect(0, 13, S, 3);
        // Airflow arrows
        ductG.fillStyle(0x8a9aac, 0.3);
        ductG.fillRect(8, 16, 4, 1);
        ductG.fillRect(11, 15, 1, 3);
        ductG.fillRect(20, 16, 4, 1);
        ductG.fillRect(23, 15, 1, 3);
        ductG.generateTexture('equip_duct', S, S);
        ductG.destroy();

        // ── Toolbox — red/orange with BuildOps construction motif ──
        const tbG = this.make.graphics({ add: false });
        tbG.fillStyle(0x0f1628);
        tbG.fillRect(0, 0, S, S);
        // Shadow under toolbox
        tbG.fillStyle(0x000000, 0.2);
        tbG.fillRect(5, S - 4, S - 10, 4);
        // Box body
        tbG.fillStyle(0xBB2211);
        tbG.fillRect(4, 12, S - 8, S - 16);
        // Body shading
        tbG.fillStyle(0x991A0E, 0.4);
        tbG.fillRect(4, S - 8, S - 8, 4);
        // Lid
        tbG.fillStyle(0xDD3322);
        tbG.fillRect(3, 9, S - 6, 5);
        // Lid highlight
        tbG.fillStyle(0xEE5544, 0.4);
        tbG.fillRect(3, 9, S - 6, 1);
        // Handle with ergonomic grip
        tbG.fillStyle(0x444444);
        tbG.fillRect(11, 4, S - 22, 3);
        tbG.fillRect(11, 4, 2, 6);
        tbG.fillRect(S - 13, 4, 2, 6);
        // Handle grip (rubber)
        tbG.fillStyle(0x333333);
        tbG.fillRect(13, 4, S - 26, 2);
        // Latch
        tbG.fillStyle(0xDDAA00);
        tbG.fillRect(cx - 2, 14, 5, 3);
        tbG.fillStyle(0xBB8800);
        tbG.fillRect(cx - 2, 14, 5, 1);
        // Tool silhouettes on side (wrench outline)
        tbG.fillStyle(0xAA2211, 0.3);
        tbG.fillRect(7, 18, 1, 6);
        tbG.fillRect(7, 18, 3, 1);
        tbG.fillRect(7, 23, 3, 1);
        tbG.generateTexture('equip_toolbox', S, S);
        tbG.destroy();

        // ── Barrel — industrial drum with hazard stripe ──
        const barrelG = this.make.graphics({ add: false });
        barrelG.fillStyle(0x0f1628);
        barrelG.fillRect(0, 0, S, S);
        // Shadow
        barrelG.fillStyle(0x000000, 0.15);
        barrelG.fillRect(6, S - 3, S - 10, 3);
        // Barrel body (slightly curved — wider in middle)
        barrelG.fillStyle(0x3a4e62);
        barrelG.fillRect(7, 4, S - 14, S - 8);
        barrelG.fillRect(6, 8, S - 12, S - 16);
        // Highlight stripe (left side of barrel = light source)
        barrelG.fillStyle(0x5a6e82, 0.4);
        barrelG.fillRect(7, 4, 3, S - 8);
        // Shadow on right
        barrelG.fillStyle(0x2a3e52, 0.4);
        barrelG.fillRect(S - 10, 4, 3, S - 8);
        // Top/bottom rims
        barrelG.fillStyle(0x4e6276);
        barrelG.fillRect(7, 3, S - 14, 3);
        barrelG.fillRect(7, S - 6, S - 14, 3);
        // Rim highlight
        barrelG.fillStyle(0x6a7e92, 0.5);
        barrelG.fillRect(7, 3, S - 14, 1);
        barrelG.fillRect(7, S - 6, S - 14, 1);
        // Metal bands
        barrelG.fillStyle(0x5a6e82);
        barrelG.fillRect(6, 10, S - 12, 2);
        barrelG.fillRect(6, S - 12, S - 12, 2);
        // Hazard stripe
        barrelG.fillStyle(0xDDAA00, 0.7);
        barrelG.fillRect(9, 16, S - 18, 4);
        barrelG.fillStyle(0x000000, 0.3);
        barrelG.fillRect(11, 16, 2, 4);
        barrelG.fillRect(15, 16, 2, 4);
        barrelG.fillRect(19, 16, 2, 4);
        barrelG.generateTexture('equip_barrel', S, S);
        barrelG.destroy();

        // ── Condensing Unit — rooftop HVAC condenser with refrigerant lines ──
        const gearG = this.make.graphics({ add: false });
        gearG.fillStyle(0x0f1628);
        gearG.fillRect(0, 0, S, S);
        // Shadow under unit
        gearG.fillStyle(0x000000, 0.2);
        gearG.fillRect(4, S - 3, S - 8, 3);
        // Main condenser body (boxy outdoor unit shape)
        gearG.fillStyle(0x4a5a6c);
        gearG.fillRect(4, 8, S - 8, S - 12);
        // Body highlight (left face)
        gearG.fillStyle(0x5a6a7c, 0.5);
        gearG.fillRect(4, 8, 3, S - 12);
        // Body shadow (right face)
        gearG.fillStyle(0x3a4a5c, 0.5);
        gearG.fillRect(S - 7, 8, 3, S - 12);
        // Top grille/vent (where fan exhausts)
        gearG.fillStyle(0x3a4a5c);
        gearG.fillRect(6, 8, S - 12, 4);
        // Fan grille slots
        gearG.fillStyle(0x1a2a3c);
        for (let i = 0; i < 5; i++) {
            gearG.fillRect(8 + i * 6, 9, 4, 2);
        }
        // Fan circle visible through grille
        gearG.lineStyle(1, 0x6a8a9c, 0.6);
        gearG.strokeCircle(cx, 10, 6);
        // Fan blade hints
        gearG.fillStyle(0x7a9aac, 0.5);
        gearG.fillRect(cx - 1, 6, 2, 4);
        gearG.fillRect(cx - 3, 9, 6, 2);
        // Side louver vents (condenser fins)
        gearG.fillStyle(0x5a6a7c, 0.6);
        for (let vy = 14; vy < S - 8; vy += 3) {
            gearG.fillRect(6, vy, S - 12, 1);
        }
        // Refrigerant lines (copper pipes on right side)
        gearG.fillStyle(0xcc8844);
        gearG.fillRect(S - 5, 14, 2, 16);
        gearG.fillRect(S - 3, 14, 2, 16);
        // Pipe insulation (black)
        gearG.fillStyle(0x222222);
        gearG.fillRect(S - 5, 18, 4, 2);
        // Service panel indicator (green LED)
        gearG.fillStyle(0x00AF66, 0.8);
        gearG.fillRect(8, S - 8, 2, 2);
        // Manufacturer label
        gearG.fillStyle(0xffffff, 0.15);
        gearG.fillRect(14, S - 9, 12, 3);
        // Base mounting feet
        gearG.fillStyle(0x3a4a5c);
        gearG.fillRect(6, S - 4, 4, 2);
        gearG.fillRect(S - 10, S - 4, 4, 2);
        gearG.generateTexture('equip_gear', S, S);
        gearG.destroy();

        // ── Fire safety equipment (BuildOps Fire Life Safety icon) ──
        const fireG = this.make.graphics({ add: false });
        fireG.fillStyle(0x0f1628);
        fireG.fillRect(0, 0, S, S);
        // Extinguisher body
        fireG.fillStyle(0xCC2222);
        fireG.fillRect(10, 8, 12, 18);
        // Cylinder curve highlight
        fireG.fillStyle(0xDD4444, 0.4);
        fireG.fillRect(10, 8, 3, 18);
        // Top valve
        fireG.fillStyle(0x444444);
        fireG.fillRect(12, 4, 8, 5);
        // Nozzle
        fireG.fillStyle(0x333333);
        fireG.fillRect(20, 5, 6, 2);
        fireG.fillRect(24, 5, 2, 6);
        // Pressure gauge
        fireG.fillStyle(0xFFFFFF, 0.4);
        fireG.fillCircle(cx, 6, 2);
        // Label
        fireG.fillStyle(0xFFFFFF, 0.3);
        fireG.fillRect(12, 14, 8, 4);
        // Base
        fireG.fillStyle(0x444444);
        fireG.fillRect(9, 26, 14, 2);
        fireG.generateTexture('equip_fire', S, S);
        fireG.destroy();
    }

    generateLogo() {
        // BuildOps triple-chevron logo — pixel art version
        // Uses wider-than-tall ratio (~1.25:1) matching the real logo proportions

        // Large version for menu (~1.28:1 ratio, wider than square)
        const lgW = 100, lgH = 78;
        const g = this.make.graphics({ add: false });
        this.drawChevronLogo(g, lgW, lgH);
        g.generateTexture('logo_large', lgW, lgH);
        g.destroy();

        // Small version for in-game branding
        const smW = 31, smH = 27;
        const gs = this.make.graphics({ add: false });
        this.drawChevronLogo(gs, smW, smH);
        gs.generateTexture('logo_small', smW, smH);
        gs.destroy();
    }

    drawChevronLogo(g, w, h) {
        // 3 green chevrons with flat vertical edges on left/right (badge shape)
        // Arms terminate at visible boundaries — matching BuildOps logo
        const green = 0x00AF66; // BuildOps Precision Green
        const cx = w / 2;
        const leftX = w * 0.10;          // left vertical boundary
        const rightX = w * 0.90;         // right vertical boundary
        const armSpan = cx - leftX;      // horizontal distance from edge to center

        // Derive vertical proportions from height
        // 3 bands + 2 gaps + arm drop = total height
        const bandH = h * 0.19;          // vertical thickness of each band
        const gapH = h * 0.07;           // vertical gap between bands
        const armV = h - 3 * bandH - 2 * gapH; // remaining space is the arm drop

        for (let i = 0; i < 3; i++) {
            // Upper V vertex (top boundary of band at center)
            const upperVtx = armV + i * (bandH + gapH);
            // Lower V vertex (bottom boundary of band at center)
            const lowerVtx = upperVtx + bandH;

            // At left/right edges, the V-lines are higher by armV
            const upperEdge = upperVtx - armV;
            const lowerEdge = lowerVtx - armV;

            g.fillStyle(green);
            g.beginPath();
            // Lower boundary: left-edge → vertex → right-edge
            g.moveTo(leftX, lowerEdge);
            g.lineTo(cx, lowerVtx);
            g.lineTo(rightX, lowerEdge);
            // Upper boundary (reverse): right-edge → vertex → left-edge
            g.lineTo(rightX, upperEdge);
            g.lineTo(cx, upperVtx);
            g.lineTo(leftX, upperEdge);
            g.closePath();
            g.fillPath();
        }
    }
}
