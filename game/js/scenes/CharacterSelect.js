// BuildQuest: Character Select Scene

import { COLORS, CSS_COLORS, CHARACTERS, STAT_COLORS } from '../utils/Constants.js';
import audio from '../utils/AudioManager.js';
import { addPixelHeader, PIXEL_THEMES } from '../utils/PixelFont.js';

export default class CharacterSelect extends Phaser.Scene {
    constructor() {
        super('CharacterSelect');
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        this.selectedIndex = 0;

        // Background
        this.add.rectangle(w / 2, h / 2, w, h, COLORS.MIDNIGHT_GREEN);

        // Title — 3D pixel block letters (green face)
        addPixelHeader(this, w / 2, h * 0.08, 'SELECT YOUR TECH', {
            px: 4, depth: 2, theme: PIXEL_THEMES.LEVEL,
        });

        // Character cards
        this.cards = [];
        this.cardBgs = [];
        const cardWidth = 160;
        const cardHeight = 320;
        const totalWidth = CHARACTERS.length * cardWidth + (CHARACTERS.length - 1) * 16;
        const startX = (w - totalWidth) / 2 + cardWidth / 2;

        CHARACTERS.forEach((char, i) => {
            const cx = startX + i * (cardWidth + 16);
            const cy = h * 0.5;

            // Card background
            const bg = this.add.rectangle(cx, cy, cardWidth, cardHeight, 0x1a1a2e, 0.9)
                .setStrokeStyle(2, i === 0 ? COLORS.FOCUS_GREEN : 0x333355)
                .setInteractive({ useHandCursor: true });

            this.cardBgs.push(bg);

            // Character name
            this.add.text(cx, cy - cardHeight / 2 + 20, char.name, {
                fontSize: '13px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: CSS_COLORS.FOCUS_GREEN,
            }).setOrigin(0.5);

            // Type
            this.add.text(cx, cy - cardHeight / 2 + 38, char.description, {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: CSS_COLORS.OPS_ORANGE,
            }).setOrigin(0.5);

            // Character preview (larger)
            this.drawCharacterPreview(cx, cy - 50, char);

            // Stats — full labels
            const statLabels = { SPD: 'Speed', STR: 'Health', FIX: 'Repair', BUFF: 'Boost' };
            const statNames = ['STR', 'FIX', 'SPD', 'BUFF'];
            const statStartY = cy + 50;

            statNames.forEach((stat, si) => {
                const sy = statStartY + si * 28;
                const animDelay = 200 + i * 120 + si * 100;
                const slideOffset = -20;

                // Label — slide in from left
                const label = this.add.text(cx - 65 + slideOffset, sy, statLabels[stat] || stat, {
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: '#AAAACC',
                }).setOrigin(0, 0.5).setAlpha(0);

                this.tweens.add({
                    targets: label,
                    x: cx - 65,
                    alpha: 1,
                    duration: 350,
                    delay: animDelay,
                    ease: 'Power2',
                });

                const val = char.stats[stat];

                const statColor = STAT_COLORS[stat] || STAT_COLORS.FIX;

                if (stat === 'STR') {
                    // Health shown as hearts
                    const totalHearts = val;
                    let heartStr = '';
                    for (let hi = 0; hi < totalHearts; hi++) heartStr += '♥';
                    const hearts = this.add.text(cx - 10 + slideOffset, sy, heartStr, {
                        fontSize: '16px',
                        fontFamily: 'monospace',
                        letterSpacing: 2,
                        color: statColor.css,
                    }).setOrigin(0, 0.5).setAlpha(0);

                    this.tweens.add({
                        targets: hearts,
                        x: cx - 10,
                        alpha: 1,
                        duration: 400,
                        delay: animDelay + 60,
                        ease: 'Power2',
                    });
                } else if (stat === 'FIX') {
                    // Repair shown as wrenches
                    const totalWrenches = val;
                    let wrenchStr = '';
                    for (let wi = 0; wi < totalWrenches; wi++) wrenchStr += '🔧';
                    const wrenches = this.add.text(cx - 10 + slideOffset, sy, wrenchStr, {
                        fontSize: '13px',
                        letterSpacing: 3,
                    }).setOrigin(0, 0.5).setAlpha(0);

                    this.tweens.add({
                        targets: wrenches,
                        x: cx - 10,
                        alpha: 1,
                        duration: 400,
                        delay: animDelay + 60,
                        ease: 'Power2',
                    });
                } else {
                    // Stat bar — uses distinct stat color
                    const barX = cx - 10;
                    const barW = 60;

                    const barBg = this.add.rectangle(barX + barW / 2 + slideOffset, sy, barW, 10, 0x333355)
                        .setOrigin(0.5).setAlpha(0);

                    this.tweens.add({
                        targets: barBg,
                        x: barX + barW / 2,
                        alpha: 1,
                        duration: 350,
                        delay: animDelay + 60,
                        ease: 'Power2',
                    });

                    const fillW = (val / 5) * barW;
                    const fill = this.add.rectangle(barX, sy, 0, 8, statColor.hex).setOrigin(0, 0.5);

                    this.tweens.add({
                        targets: fill,
                        width: fillW,
                        duration: 500,
                        delay: animDelay + 200,
                        ease: 'Power2',
                    });

                    const numText = this.add.text(barX + barW + 8, sy, `${val}`, {
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        fontStyle: 'bold',
                        color: '#FFFFFF',
                    }).setOrigin(0, 0.5).setAlpha(0);

                    this.tweens.add({
                        targets: numText,
                        alpha: 1,
                        duration: 300,
                        delay: animDelay + 400,
                        ease: 'Power2',
                    });
                }
            });

            // Click handler
            bg.on('pointerdown', () => this.selectCharacter(i));
            bg.on('pointerover', () => {
                if (this.selectedIndex !== i) bg.setStrokeStyle(2, COLORS.OPS_ORANGE);
            });
            bg.on('pointerout', () => {
                if (this.selectedIndex !== i) bg.setStrokeStyle(2, 0x333355);
            });

            this.cards.push({ bg, char });
        });

        // Go button — glassmorphism card style
        const goY = h * 0.86;
        const goBtnW = 200;
        const goBtnH = 40;
        const goGfx = this.add.graphics();
        const drawGoNormal = () => {
            goGfx.clear();
            goGfx.fillStyle(0xffffff, 0.03);
            goGfx.fillRoundedRect(w / 2 - goBtnW / 2, goY - goBtnH / 2, goBtnW, goBtnH, 12);
            goGfx.lineStyle(1, 0x4ade80, 0.35);
            goGfx.strokeRoundedRect(w / 2 - goBtnW / 2, goY - goBtnH / 2, goBtnW, goBtnH, 12);
        };
        const drawGoHover = () => {
            goGfx.clear();
            goGfx.fillStyle(0xffffff, 0.06);
            goGfx.fillRoundedRect(w / 2 - goBtnW / 2, goY - goBtnH / 2, goBtnW, goBtnH, 12);
            goGfx.lineStyle(1.5, 0x4ade80, 0.6);
            goGfx.strokeRoundedRect(w / 2 - goBtnW / 2, goY - goBtnH / 2, goBtnW, goBtnH, 12);
        };
        drawGoNormal();

        this.goBtn = this.add.rectangle(w / 2, goY, goBtnW, goBtnH, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        this.goText = this.add.text(w / 2, goY, 'DISPATCH!', {
            fontSize: '12px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#4ade80',
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.goText,
            alpha: { from: 1, to: 0.4 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        this.goBtn.on('pointerover', () => { audio.sfxMenuHover(); drawGoHover(); this.goText.setColor('#ffffff'); });
        this.goBtn.on('pointerout', () => { drawGoNormal(); this.goText.setColor('#4ade80'); });
        this.goBtn.on('pointerdown', () => this.startGame());

        // Keyboard navigation
        this.input.keyboard.on('keydown-LEFT', () => {
            this.selectCharacter(Math.max(0, this.selectedIndex - 1));
        });
        this.input.keyboard.on('keydown-RIGHT', () => {
            this.selectCharacter(Math.min(CHARACTERS.length - 1, this.selectedIndex + 1));
        });
        this.input.keyboard.on('keydown-ENTER', () => this.startGame());
        this.input.keyboard.on('keydown-SPACE', () => this.startGame());

        // Audio controls
        audio.createControls(this);
    }

    drawCharacterPreview(x, y, char) {
        const g = this.add.graphics();
        const s = 4; // scale: 20x24 concept art * 4 = 80x96 preview
        // offset so the character is centered on (x, y)
        const ox = x - 10 * s; // center horizontally (20/2 = 10)
        const oy = y - 12 * s; // center vertically (24/2 = 12)

        // Use the same drawCharacter from Player — inline the same logic here
        // helper: fill a rectangle in "SVG pixels" mapped to real pixels
        const r = (px, py, pw, ph, color) => {
            g.fillStyle(color);
            g.fillRect(ox + px * s, oy + py * s, pw * s, ph * s);
        };

        if (char.id === 'hvac') {
            // Hard hat
            r(4, 0, 12, 2, 0xfdba74);
            r(3, 2, 14, 3, 0xf97316);
            r(5, 1, 10, 1, 0xf97316);
            // Face
            r(5, 5, 10, 6, 0xfed7aa);
            r(6, 7, 2, 2, 0x1e293b);
            r(7, 7, 1, 1, 0xffffff);
            r(12, 7, 2, 2, 0x1e293b);
            r(12, 7, 1, 1, 0xffffff);
            r(8, 9, 4, 1, 0xfca5a5);
            r(8, 10, 4, 1, 0xfbbf24);
            // Shirt (blue)
            r(4, 11, 12, 6, 0x3b82f6);
            r(5, 14, 10, 3, 0x2563eb);
            // Snowflake/fan patch
            r(9, 12, 1, 1, 0x88ccff);
            r(8, 13, 3, 1, 0x88ccff);
            r(9, 14, 1, 1, 0x88ccff);
            // Arms
            r(2, 11, 2, 6, 0x3b82f6);
            r(16, 11, 2, 6, 0x3b82f6);
            // Manifold gauge set (left hand)
            r(0, 9, 3, 3, 0x2244aa);
            r(0, 9, 3, 1, 0x4488cc);
            r(1, 10, 1, 1, 0xffffff);
            r(0, 12, 1, 4, 0xdd2222);   // red hose
            r(2, 12, 1, 4, 0x2266cc);   // blue hose
            r(1, 12, 1, 3, 0xfbbf24);   // yellow hose
            // Tool pouches
            r(5, 17, 10, 1, 0x92400e);
            r(9, 17, 2, 1, 0xfbbf24);
            r(3, 16, 2, 2, 0x7a5a2e);
            r(15, 16, 2, 2, 0x7a5a2e);
            // Pants & boots
            r(5, 18, 4, 4, 0x1e3a5f);
            r(11, 18, 4, 4, 0x1e3a5f);
            r(5, 22, 4, 2, 0x78350f);
            r(11, 22, 4, 2, 0x78350f);

        } else if (char.id === 'electrician') {
            // Cap with lightning badge
            r(4, 0, 12, 2, 0xfde68a);
            r(3, 2, 14, 3, 0xfbbf24);
            r(5, 1, 10, 1, 0xfbbf24);
            r(9, 1, 1, 1, 0xff6600);
            r(8, 2, 1, 1, 0xff6600);
            r(9, 3, 1, 1, 0xff6600);
            // Face
            r(5, 5, 10, 6, 0xd4a574);
            r(6, 7, 2, 2, 0x1e293b);
            r(7, 7, 1, 1, 0xffffff);
            r(12, 7, 2, 2, 0x1e293b);
            r(12, 7, 1, 1, 0xffffff);
            r(8, 9, 4, 1, 0xfca5a5);
            r(8, 10, 4, 1, 0xd4a574);
            // Shirt (green) with lightning bolt
            r(4, 11, 12, 6, 0x22c55e);
            r(5, 14, 10, 3, 0x16a34a);
            r(9, 12, 2, 1, 0xfef08a);
            r(8, 13, 2, 1, 0xfef08a);
            r(9, 14, 2, 1, 0xfef08a);
            // Arms
            r(2, 11, 2, 6, 0x22c55e);
            r(16, 11, 2, 6, 0x22c55e);
            // Wire cutters (left hand)
            r(0, 11, 1, 5, 0xcc4444);   // left handle
            r(2, 11, 1, 5, 0xcc4444);   // right handle
            r(0, 14, 1, 2, 0xaa2222);
            r(2, 14, 1, 2, 0xaa2222);
            r(0, 10, 3, 1, 0x8899aa);   // hinge
            r(1, 10, 1, 1, 0xaabbcc);
            r(0, 8, 1, 2, 0x6688aa);    // blades
            r(2, 8, 1, 2, 0x6688aa);
            r(0, 8, 3, 1, 0xaabbcc);
            r(0, 7, 1, 1, 0xfef08a);    // sparks
            r(2, 7, 1, 1, 0xfef08a);
            // Wire coil (right shoulder)
            r(17, 8, 3, 2, 0xdd8833);
            r(17, 10, 3, 2, 0xcc7722);
            r(18, 12, 2, 2, 0xbb6611);
            r(17, 9, 1, 1, 0xeebb55);
            // Belt, pants, boots
            r(5, 17, 10, 1, 0x92400e);
            r(9, 17, 2, 1, 0xfbbf24);
            r(5, 18, 4, 4, 0x1e3a5f);
            r(11, 18, 4, 4, 0x1e3a5f);
            r(5, 22, 4, 2, 0x78350f);
            r(11, 22, 4, 2, 0x78350f);

        } else if (char.id === 'plumber') {
            // Backwards cap
            r(5, 1, 10, 2, 0xdc2626);
            r(4, 3, 12, 2, 0x991b1b);
            r(14, 4, 4, 2, 0x991b1b);
            // Face + beard
            r(5, 5, 10, 6, 0xfed7aa);
            r(6, 9, 8, 2, 0x92400e);
            r(6, 7, 2, 2, 0x1e293b);
            r(7, 7, 1, 1, 0xffffff);
            r(12, 7, 2, 2, 0x1e293b);
            r(12, 7, 1, 1, 0xffffff);
            r(8, 9, 4, 1, 0xfca5a5);
            // Shirt (purple) with water droplet
            r(4, 11, 12, 6, 0x7c3aed);
            r(5, 13, 10, 1, 0x6d28d9);
            r(5, 15, 10, 1, 0x6d28d9);
            r(9, 12, 2, 1, 0x44aaff);
            r(8, 13, 4, 2, 0x3388dd);
            r(9, 15, 2, 1, 0x3388dd);
            // Big arms
            r(1, 11, 3, 6, 0x7c3aed);
            r(16, 11, 3, 6, 0x7c3aed);
            // Large pipe wrench (right hand)
            r(18, 7, 2, 2, 0xaabbcc);   // upper jaw
            r(18, 9, 1, 1, 0x8899aa);
            r(18, 9, 2, 1, 0xaabbcc);   // lower jaw
            r(17, 8, 1, 2, 0x8899aa);
            r(18, 10, 2, 3, 0xcc4444);  // handle (red)
            r(19, 13, 1, 5, 0xcc4444);
            r(19, 18, 1, 2, 0xaa3333);
            r(18, 11, 1, 1, 0xdd5555);
            // Pipe section (left hand)
            r(0, 12, 2, 1, 0x6e7a8a);
            r(0, 11, 1, 3, 0x5a6a7a);
            r(0, 13, 2, 1, 0x6e7a8a);
            // Belt, pants, boots
            r(5, 17, 10, 1, 0x92400e);
            r(9, 17, 2, 1, 0xfbbf24);
            r(5, 18, 4, 4, 0x44403c);
            r(11, 18, 4, 4, 0x44403c);
            r(5, 22, 4, 2, 0x78350f);
            r(11, 22, 4, 2, 0x78350f);

        } else if (char.id === 'pm') {
            r(5, 1, 10, 3, 0x1e293b);
            r(6, 0, 8, 1, 0x1e293b);
            r(5, 4, 10, 7, 0xfed7aa);
            r(6, 6, 3, 2, 0xc084fc);
            r(11, 6, 3, 2, 0xc084fc);
            r(9, 6, 2, 1, 0x1e293b);
            r(7, 7, 1, 1, 0x1e293b);
            r(12, 7, 1, 1, 0x1e293b);
            r(8, 9, 4, 1, 0xfca5a5);
            r(4, 11, 12, 6, 0xe5e7eb);
            r(5, 14, 10, 3, 0xd1d5db);
            r(9, 11, 2, 6, 0x22c55e);
            r(2, 11, 2, 6, 0xe5e7eb);
            r(16, 11, 2, 6, 0xe5e7eb);
            r(0, 11, 2, 3, 0x1e293b);
            r(0, 12, 2, 1, 0x4ade80);
            r(5, 17, 10, 1, 0x374151);
            r(5, 18, 4, 4, 0x374151);
            r(11, 18, 4, 4, 0x374151);
            r(5, 22, 4, 2, 0x1e293b);
            r(11, 22, 4, 2, 0x1e293b);
        }
    }

    selectCharacter(index) {
        this.selectedIndex = index;
        this.cardBgs.forEach((bg, i) => {
            bg.setStrokeStyle(2, i === index ? COLORS.FOCUS_GREEN : 0x333355);
        });
    }

    startGame() {
        audio.sfxDispatch();
        audio.stopMusic();
        this.scene.start('Game', { character: CHARACTERS[this.selectedIndex] });
    }
}
