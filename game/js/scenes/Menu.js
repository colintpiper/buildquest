// BuildQuest: Menu Scene — Concept Deck Visual Style

import { COLORS, CSS_COLORS } from '../utils/Constants.js';
import audio from '../utils/AudioManager.js';
import { addPixelHeader, PIXEL_THEMES } from '../utils/PixelFont.js';

const DARK_BG = 0x070b14;
const ACCENT_GREEN = '#4ade80';
const ACCENT_GREEN_HEX = 0x4ade80;

export default class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
        this.particles = [];
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Initialize audio (music starts on HowToPlay)
        audio.init();

        // Deep dark background
        this.add.rectangle(w / 2, h / 2, w, h, DARK_BG);

        // Radial ambient glow — green and blue
        this.drawAmbientGlow(w, h);

        // Grid overlay
        this.drawGrid(w, h);

        // Floating particles
        this.createParticles(w, h);

        // ── BuildOps chevron logo ── (drops down from above)
        const logoY = h * 0.20;
        const logo = this.add.image(w / 2, logoY - 30, 'logo_large').setOrigin(0.5).setScale(0.55).setAlpha(0);
        this.tweens.add({
            targets: logo, alpha: 1, y: logoY,
            duration: 600, delay: 100, ease: 'Back.easeOut',
        });
        this.time.delayedCall(700, () => {
            this.tweens.add({
                targets: logo, alpha: { from: 0.85, to: 1 },
                duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
        });

        // ── "PRESS START" tag above title ── (fades in)
        const titleY = h * 0.38;
        const pressStart = this.add.text(w / 2, titleY - 60, 'P R E S S   S T A R T', {
            fontSize: '10px', fontFamily: 'monospace', color: ACCENT_GREEN, letterSpacing: 4,
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({
            targets: pressStart, alpha: 0.7,
            duration: 500, delay: 300, ease: 'Cubic.easeOut',
        });

        // ── Title "BUILD QUEST" — 3D pixel block letters ── (scales up)
        const titleContainer = this.add.container(w / 2, titleY).setAlpha(0).setScale(0.8);
        const origChildren = [...this.children.list];
        addPixelHeader(this, w / 2, titleY, 'BUILD QUEST', {
            px: 6, depth: 3, theme: PIXEL_THEMES.TITLE,
        });
        const newChildren = this.children.list.filter(c => !origChildren.includes(c));
        newChildren.forEach(c => { c.x -= w / 2; c.y -= titleY; titleContainer.add(c); });
        this.tweens.add({
            targets: titleContainer, alpha: 1, scale: 1,
            duration: 700, delay: 250, ease: 'Back.easeOut',
        });

        // ── Subtitle ── (fades in)
        const subtitle = this.add.text(w / 2, titleY + 52, 'A BuildOps Retro Gaming Experience', {
            fontSize: '12px', fontFamily: 'monospace', color: ACCENT_GREEN,
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({
            targets: subtitle, alpha: 0.6,
            duration: 500, delay: 600, ease: 'Cubic.easeOut',
        });

        // ── Pulsing pixel dots ── (staggered fade in, then pulse)
        const dotY = titleY + 80;
        const dotSize = 6;
        const dotGap = 16;
        const dots = [];
        for (let i = 0; i < 4; i++) {
            const dx = w / 2 + (i - 1.5) * dotGap;
            const dot = this.add.rectangle(dx, dotY, dotSize, dotSize, ACCENT_GREEN_HEX).setAlpha(0);
            dots.push(dot);
        }
        dots.forEach((dot, i) => {
            this.tweens.add({
                targets: dot, alpha: 0.6,
                duration: 300, delay: 700 + i * 100, ease: 'Cubic.easeOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: dot, alpha: { from: 0.3, to: 0.9 },
                        duration: 800, yoyo: true, repeat: -1, delay: i * 200, ease: 'Sine.easeInOut',
                    });
                },
            });
        });

        // ── Start button — card style ── (fades in)
        const btnY = h * 0.65;
        const btnW = 240;
        const btnH = 50;
        const btnGfx = this.add.graphics().setAlpha(0);
        btnGfx.fillStyle(0xffffff, 0.03);
        btnGfx.fillRoundedRect(w / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 14);
        btnGfx.lineStyle(1, ACCENT_GREEN_HEX, 0.35);
        btnGfx.strokeRoundedRect(w / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 14);

        const btnZone = this.add.rectangle(w / 2, btnY, btnW, btnH, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        const btnText = this.add.text(w / 2, btnY, 'START GAME', {
            fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: ACCENT_GREEN,
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [btnGfx, btnText], alpha: 1,
            duration: 500, delay: 900, ease: 'Cubic.easeOut',
        });

        // Hover: brighten border
        btnZone.on('pointerover', () => {
            audio.sfxMenuHover();
            btnGfx.clear();
            btnGfx.fillStyle(0xffffff, 0.06);
            btnGfx.fillRoundedRect(w / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 14);
            btnGfx.lineStyle(1.5, ACCENT_GREEN_HEX, 0.6);
            btnGfx.strokeRoundedRect(w / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 14);
            btnText.setColor('#ffffff');
        });
        btnZone.on('pointerout', () => {
            btnGfx.clear();
            btnGfx.fillStyle(0xffffff, 0.03);
            btnGfx.fillRoundedRect(w / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 14);
            btnGfx.lineStyle(1, ACCENT_GREEN_HEX, 0.35);
            btnGfx.strokeRoundedRect(w / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 14);
            btnText.setColor(ACCENT_GREEN);
        });
        btnZone.on('pointerdown', () => { audio.sfxMenuSelect(); this.scene.start('NameEntry'); });

        // Blink on text (starts after entrance)
        this.time.delayedCall(1400, () => {
            this.tweens.add({
                targets: btnText, alpha: { from: 1, to: 0.4 },
                duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
        });

        // Keyboard shortcuts
        this.input.keyboard.on('keydown-SPACE', () => { audio.sfxMenuSelect(); this.scene.start('NameEntry'); });
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('NameEntry'));

        // ── Leaderboard link ── (fades in)
        const lbBtnY = h * 0.74;
        const lbText = this.add.text(w / 2, lbBtnY, 'View Leaderboard', {
            fontSize: '14px', fontFamily: 'monospace', color: '#2d6b4a',
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });
        this.tweens.add({
            targets: lbText, alpha: 1,
            duration: 500, delay: 1100, ease: 'Cubic.easeOut',
        });

        lbText.on('pointerover', () => { audio.sfxMenuHover(); lbText.setColor(ACCENT_GREEN); });
        lbText.on('pointerout', () => { lbText.setColor('#2d6b4a'); });
        lbText.on('pointerdown', () => { audio.sfxMenuSelect(); this.scene.start('Leaderboard', { source: 'menu' }); });

        // ── Bottom controls ── (fade in last)
        const controlsText = this.add.text(w / 2, h * 0.94, 'Arrow Keys  /  WASD  /  Tap to Move', {
            fontSize: '10px', fontFamily: 'monospace', color: '#3a4255',
        }).setOrigin(0.5).setAlpha(0);

        const poweredText = this.add.text(w / 2, h * 0.98, 'Powered by BuildOps', {
            fontSize: '9px', fontFamily: 'monospace', color: '#262e3d',
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [controlsText, poweredText], alpha: 1,
            duration: 600, delay: 1300, ease: 'Cubic.easeOut',
        });
    }

    drawAmbientGlow(w, h) {
        const gfx = this.add.graphics();

        // Green glow — center-right
        const greenSteps = 12;
        for (let i = greenSteps; i >= 0; i--) {
            const r = (Math.max(w, h) * 0.7) * (i / greenSteps);
            const alpha = 0.04 * (1 - i / greenSteps);
            gfx.fillStyle(ACCENT_GREEN_HEX, alpha);
            gfx.fillCircle(w * 0.6, h * 0.4, r);
        }

        // Blue glow — center-left
        const blueSteps = 10;
        for (let i = blueSteps; i >= 0; i--) {
            const r = (Math.max(w, h) * 0.6) * (i / blueSteps);
            const alpha = 0.03 * (1 - i / blueSteps);
            gfx.fillStyle(0x3b82f6, alpha);
            gfx.fillCircle(w * 0.35, h * 0.6, r);
        }
    }

    drawGrid(w, h) {
        const g = this.add.graphics();
        g.lineStyle(1, 0xffffff, 0.015);
        const spacing = 60;
        for (let x = 0; x <= w; x += spacing) {
            g.lineBetween(x, 0, x, h);
        }
        for (let y = 0; y <= h; y += spacing) {
            g.lineBetween(0, y, w, y);
        }
    }

    createParticles(w, h) {
        const count = 20;
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(0, w);
            const y = Phaser.Math.Between(0, h);
            const size = Phaser.Math.Between(1, 3);
            const dot = this.add.circle(x, y, size, ACCENT_GREEN_HEX, Phaser.Math.FloatBetween(0.1, 0.35));

            // Float upward
            const duration = Phaser.Math.Between(6000, 14000);
            this.tweens.add({
                targets: dot,
                y: -20,
                alpha: 0,
                duration,
                delay: Phaser.Math.Between(0, 4000),
                onComplete: () => {
                    dot.setPosition(Phaser.Math.Between(0, w), h + 10);
                    dot.setAlpha(Phaser.Math.FloatBetween(0.1, 0.35));
                    this.floatParticle(dot, w, h);
                },
            });
        }
    }

    floatParticle(dot, w, h) {
        const duration = Phaser.Math.Between(6000, 14000);
        this.tweens.add({
            targets: dot,
            y: -20,
            alpha: 0,
            duration,
            onComplete: () => {
                dot.setPosition(Phaser.Math.Between(0, w), h + 10);
                dot.setAlpha(Phaser.Math.FloatBetween(0.1, 0.35));
                this.floatParticle(dot, w, h);
            },
        });
    }

}
