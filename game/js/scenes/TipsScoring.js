// BuildQuest: Tips & Scoring Scene (How to Play — Screen 3)

import Job from '../entities/Job.js';
import audio from '../utils/AudioManager.js';
import { addPixelHeader, PIXEL_THEMES } from '../utils/PixelFont.js';

const DARK_BG = 0x070b14;
const ACCENT_GREEN = '#4ade80';
const ACCENT_GREEN_HEX = 0x4ade80;

export default class TipsScoring extends Phaser.Scene {
    constructor() {
        super('TipsScoring');
    }

    create(data) {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        this.character = data?.character || null;

        // Background
        this.add.rectangle(w / 2, h / 2, w, h, DARK_BG);
        this.drawAmbientGlow(w, h);
        this.drawGrid(w, h);
        this.createParticles(w, h);

        // ── Title — 3D pixel block letters ──
        addPixelHeader(this, w / 2, 40, 'TIPS & SCORING', {
            px: 4, depth: 2, theme: PIXEL_THEMES.SUBTLE,
        });

        // ── Controls bar — at top under title ──
        const ctrlY = 66;
        this.drawCard(w / 2 - 300, ctrlY, 600, 36);
        this.add.text(w / 2, ctrlY + 18, '↑ ↓ ← →  or  W A S D  to move   •   Tap to move on mobile', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#64748b',
        }).setOrigin(0.5).setDepth(2);

        // Page indicator

        // Generate job preview texture
        if (!this.textures.exists('job_preview')) {
            const g = this.make.graphics({ add: false });
            Job.prototype.drawWorkOrder.call({ value: 600 }, g);
            g.generateTexture('job_preview', 30, 33);
            g.destroy();
        }

        // ── Two-column layout ──
        const colW = 340;
        const colGap = 30;
        const totalW = colW * 2 + colGap;
        const startX = (w - totalW) / 2;
        const topY = 108;

        // === LEFT COLUMN: How Scoring Works ===
        const col1X = startX;
        const col1H = 400;
        this.drawCard(col1X, topY, colW, col1H);

        this.add.text(col1X + colW / 2, topY + 22, 'HOW SCORING WORKS', {
            fontSize: '14px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#facc15',
        }).setOrigin(0.5).setDepth(2);

        // Job clipboard icon — animated bob
        if (this.textures.exists('job_preview')) {
            const jobIcon = this.add.image(col1X + colW / 2, topY + 56, 'job_preview').setScale(1.4).setDepth(2);
            this.tweens.add({
                targets: jobIcon,
                y: { from: jobIcon.y - 3, to: jobIcon.y + 3 },
                duration: 1400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
            this.add.text(col1X + colW / 2, topY + 82, '$600', {
                fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: ACCENT_GREEN,
            }).setOrigin(0.5).setDepth(2);
        }

        const scoringItems = [
            { label: 'Collect Jobs', text: 'Stand on work orders to complete them.\nHigher value jobs = more points.', color: ACCENT_GREEN },
            { label: 'Profit Margin', text: 'Starts at 100%. Drops when hit or over\ntime. Higher margin = bigger score.', color: '#facc15' },
            { label: 'Streaks', text: 'Collect jobs without getting hit for\nstreak bonus multipliers.', color: '#f97316' },
            { label: 'First-Time Fix', text: 'Complete jobs without taking any\ndamage for a 1.5x bonus.', color: '#60a5fa' },
        ];

        let sy = topY + 104;
        scoringItems.forEach((item, i) => {
            // Number indicator — animated fade in
            const numText = this.add.text(col1X + 24, sy, `${i + 1}.`, {
                fontSize: '14px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: item.color,
            }).setDepth(2).setAlpha(0);

            this.tweens.add({
                targets: numText,
                alpha: 1,
                x: { from: col1X + 14, to: col1X + 24 },
                duration: 400,
                delay: 200 + i * 150,
                ease: 'Power2',
            });

            this.add.text(col1X + 46, sy, item.label, {
                fontSize: '13px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#e2e8f0',
            }).setDepth(2);

            this.add.text(col1X + 24, sy + 20, item.text, {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#8b95a5',
                lineSpacing: 4,
            }).setDepth(2);

            sy += 68;
        });

        // === RIGHT COLUMN: Strategy Tips ===
        const col2X = startX + colW + colGap;
        const col2H = 400;
        this.drawCard(col2X, topY, colW, col2H);

        this.add.text(col2X + colW / 2, topY + 22, 'STRATEGY TIPS', {
            fontSize: '14px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#60a5fa',
        }).setOrigin(0.5).setDepth(2);

        const tips = [
            { icon: '⚡', label: 'Speed Matters', text: 'Finish levels quickly. The clock is\nalways ticking down your margin.' },
            { icon: '🛡', label: 'Use Power-Ups', text: 'Grab power-ups strategically. Shield\nwhen surrounded, magnet near clusters.' },
            { icon: '📈', label: 'Levels Scale Up', text: 'Each level adds more obstacles and\nfaster enemies. Plan your routes.' },
            { icon: '🎯', label: 'Pick Your Tech', text: 'Each tech has unique stats. You\nalready picked yours — good call.' },
            { icon: '💡', label: 'Stay Moving', text: 'Standing still makes you an easy\ntarget for Callbacks that chase you.' },
        ];

        let ty = topY + 48;
        tips.forEach((tip, i) => {
            // Animated emoji icons
            const iconText = this.add.text(col2X + 20, ty, tip.icon, {
                fontSize: '18px',
            }).setDepth(2);

            this.tweens.add({
                targets: iconText,
                scaleX: { from: 1, to: 1.15 },
                scaleY: { from: 1, to: 1.15 },
                duration: 1000 + i * 100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: i * 200,
            });

            this.add.text(col2X + 48, ty + 2, tip.label, {
                fontSize: '13px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#e2e8f0',
            }).setDepth(2);

            this.add.text(col2X + 48, ty + 22, tip.text, {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#8b95a5',
                lineSpacing: 4,
            }).setDepth(2);

            ty += 68;
        });

        // ── Navigation ──
        const btnY = h - 50;
        // Main continue button — centered
        this.createCardButton(w / 2, btnY, 200, 40, 'PLAY!  ▶', ACCENT_GREEN_HEX, () => {
            this.scene.start('Game', { character: this.character });
        });

        // Back link — subtle text
        const backText = this.add.text(w / 2 - 180, btnY, '◀  BACK', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#6b7580',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        backText.on('pointerover', () => backText.setColor(ACCENT_GREEN));
        backText.on('pointerout', () => backText.setColor('#4b5563'));
        backText.on('pointerdown', () => this.scene.start('HowToPlay', { character: this.character }));

        // Keyboard
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('Game', { character: this.character }));
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('Game', { character: this.character }));
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('HowToPlay', { character: this.character }));

        // Audio controls
        audio.createControls(this);
    }

    // ── Helpers (shared style) ──

    drawAmbientGlow(w, h) {
        const gfx = this.add.graphics();
        const greenSteps = 12;
        for (let i = greenSteps; i >= 0; i--) {
            const r = (Math.max(w, h) * 0.6) * (i / greenSteps);
            const alpha = 0.04 * (1 - i / greenSteps);
            gfx.fillStyle(ACCENT_GREEN_HEX, alpha);
            gfx.fillCircle(w * 0.55, h * 0.35, r);
        }
        const blueSteps = 10;
        for (let i = blueSteps; i >= 0; i--) {
            const r = (Math.max(w, h) * 0.5) * (i / blueSteps);
            const alpha = 0.03 * (1 - i / blueSteps);
            gfx.fillStyle(0x3b82f6, alpha);
            gfx.fillCircle(w * 0.3, h * 0.7, r);
        }
    }

    drawGrid(w, h) {
        const g = this.add.graphics();
        g.lineStyle(1, 0xffffff, 0.015);
        const spacing = 60;
        for (let x = 0; x <= w; x += spacing) g.lineBetween(x, 0, x, h);
        for (let y = 0; y <= h; y += spacing) g.lineBetween(0, y, w, y);
    }

    drawCard(x, y, w, h) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0xffffff, 0.03);
        gfx.fillRoundedRect(x, y, w, h, 14);
        gfx.lineStyle(1, 0xffffff, 0.06);
        gfx.strokeRoundedRect(x, y, w, h, 14);
        gfx.setDepth(1);
    }

    createCardButton(cx, cy, bw, bh, label, borderColor, onClick) {
        const gfx = this.add.graphics().setDepth(2);
        const drawNormal = () => {
            gfx.clear();
            gfx.fillStyle(0xffffff, 0.03);
            gfx.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 12);
            gfx.lineStyle(1, borderColor, 0.35);
            gfx.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 12);
        };
        const drawHover = () => {
            gfx.clear();
            gfx.fillStyle(0xffffff, 0.06);
            gfx.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 12);
            gfx.lineStyle(1.5, borderColor, 0.6);
            gfx.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 12);
        };
        drawNormal();

        const zone = this.add.rectangle(cx, cy, bw, bh, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        const cssColor = borderColor === ACCENT_GREEN_HEX ? ACCENT_GREEN : '#94a3b8';
        const txt = this.add.text(cx, cy, label, {
            fontSize: '12px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: cssColor,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            alpha: { from: 1, to: 0.4 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        zone.on('pointerover', () => { audio.sfxMenuHover(); drawHover(); txt.setColor('#ffffff'); });
        zone.on('pointerout', () => { drawNormal(); txt.setColor(cssColor); });
        zone.on('pointerdown', () => { audio.sfxMenuSelect(); onClick(); });
    }

    createParticles(w, h) {
        for (let i = 0; i < 12; i++) {
            const x = Phaser.Math.Between(0, w);
            const y = Phaser.Math.Between(0, h);
            const size = Phaser.Math.Between(1, 2);
            const dot = this.add.circle(x, y, size, ACCENT_GREEN_HEX, Phaser.Math.FloatBetween(0.08, 0.25));
            this.floatParticle(dot, w, h);
        }
    }

    floatParticle(dot, w, h) {
        this.tweens.add({
            targets: dot,
            y: -20,
            alpha: 0,
            duration: Phaser.Math.Between(6000, 14000),
            delay: Phaser.Math.Between(0, 3000),
            onComplete: () => {
                dot.setPosition(Phaser.Math.Between(0, w), h + 10);
                dot.setAlpha(Phaser.Math.FloatBetween(0.08, 0.25));
                this.floatParticle(dot, w, h);
            },
        });
    }
}
