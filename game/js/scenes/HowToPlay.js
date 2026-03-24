// BuildQuest: How to Play Scene — Screen 2 (Power-Ups & Obstacles)

import { POWERUPS, POWERUP_LIST, OBSTACLE_TYPES } from '../utils/Constants.js';
import PowerUp from '../entities/PowerUp.js';
import Obstacle from '../entities/Obstacle.js';
import audio from '../utils/AudioManager.js';
import { addPixelHeader, PIXEL_THEMES } from '../utils/PixelFont.js';

const DARK_BG = 0x070b14;
const ACCENT_GREEN = '#4ade80';
const ACCENT_GREEN_HEX = 0x4ade80;

export default class HowToPlay extends Phaser.Scene {
    constructor() {
        super('HowToPlay');
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

        // Generate preview textures
        this.generatePreviewTextures();

        // ── Title — 3D pixel block letters ──
        addPixelHeader(this, w / 2, 40, 'HOW TO PLAY', {
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

        // ── Objective card ──
        const objY = 108;
        this.drawCard(w / 2 - 340, objY, 680, 36);
        this.add.text(w / 2, objY + 18, 'Collect jobs, avoid obstacles, and grab power-ups to maximize your score!', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#94a3b8',
        }).setOrigin(0.5).setDepth(2);

        // ── Two-column layout ──
        const colW = 340;
        const colGap = 30;
        const totalW = colW * 2 + colGap;
        const startX = (w - totalW) / 2;
        const topY = 156;

        // === COLUMN 1: Power-Ups ===
        const col1X = startX;
        const col1H = 340;
        this.drawCard(col1X, topY, colW, col1H);

        this.add.text(col1X + colW / 2, topY + 18, 'POWER-UPS', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: ACCENT_GREEN,
        }).setOrigin(0.5).setDepth(2);

        this.add.text(col1X + colW / 2, topY + 36, 'Grab these to gain abilities', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#8b95a5',
        }).setOrigin(0.5).setDepth(2);

        const powerupInfo = [
            { id: 'opsai', name: 'OpsAI Supercharge', desc: '2x speed + 2x points', color: '#4ade80' },
            { id: 'dispatch', name: 'Smart Dispatch', desc: 'Ranks jobs by efficiency + arrow to best', color: '#FFD700' },
            { id: 'proposal', name: 'Proposal Magnet', desc: 'Magnetic pull on nearby jobs', color: '#FF6B35' },
            { id: 'reporting', name: 'Reporting Crystal', desc: 'Shows obstacle spawn zones', color: '#a78bfa' },
            { id: 'portal', name: 'Customer Portal', desc: 'Invincibility shield', color: '#22d3ee' },
            { id: 'workflow', name: 'Workflow Automator', desc: 'Clears all obstacles instantly', color: '#f472b6' },
        ];

        let py = topY + 54;
        powerupInfo.forEach((pu, i) => {
            const texKey = `powerup_${pu.id}`;
            if (this.textures.exists(texKey)) {
                const img = this.add.image(col1X + 28, py + 8, texKey).setScale(0.85).setDepth(2);
                // Animated hover/pulse on power-up icons
                this.tweens.add({
                    targets: img,
                    scaleX: { from: 0.85, to: 1.0 },
                    scaleY: { from: 0.85, to: 1.0 },
                    alpha: { from: 0.85, to: 1 },
                    duration: 1200 + i * 100,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                });
            }

            this.add.text(col1X + 52, py, pu.name, {
                fontSize: '11px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: pu.color,
            }).setDepth(2);

            this.add.text(col1X + 52, py + 15, pu.desc, {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#8b95a5',
            }).setDepth(2);

            py += 46;
        });

        // === COLUMN 2: Obstacles ===
        const col2X = startX + colW + colGap;
        const col2H = 340;
        this.drawCard(col2X, topY, colW, col2H);

        this.add.text(col2X + colW / 2, topY + 18, 'OBSTACLES', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#f87171',
        }).setOrigin(0.5).setDepth(2);

        this.add.text(col2X + colW / 2, topY + 36, 'Avoid these or lose health', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#8b95a5',
        }).setOrigin(0.5).setDepth(2);

        const obstacleInfo = [
            { id: 'change_order', name: 'Change Order', desc: 'Bounces around in straight lines.\nFast and unpredictable.', color: '#f87171' },
            { id: 'callback', name: 'Callback', desc: 'Slowly chases you. Hard to shake\nonce it locks on.', color: '#fb7185' },
            { id: 'parts_delay', name: 'Parts Delay', desc: 'Stationary trap on the floor.\nFades after 5 seconds.', color: '#9ca3af' },
        ];

        let oy = topY + 54;
        obstacleInfo.forEach((ob, i) => {
            const texKey = `obstacle_${ob.id}`;
            if (this.textures.exists(texKey)) {
                const img = this.add.image(col2X + 30, oy + 12, texKey).setScale(0.5).setDepth(2);
                // Animated shake/warning on obstacle icons
                this.tweens.add({
                    targets: img,
                    x: { from: img.x - 1.5, to: img.x + 1.5 },
                    duration: 300 + i * 50,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                });
            }

            this.add.text(col2X + 54, oy, ob.name, {
                fontSize: '11px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: ob.color,
            }).setDepth(2);

            this.add.text(col2X + 54, oy + 15, ob.desc, {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#8b95a5',
                lineSpacing: 3,
            }).setDepth(2);

            oy += 64;
        });

        // Walls & Equipment section
        oy += 8;
        if (this.textures.exists('equip_hvac')) {
            const equipImg = this.add.image(col2X + 30, oy + 12, 'equip_hvac').setScale(0.5).setDepth(2);
            // Gentle rotation-like pulse
            this.tweens.add({
                targets: equipImg,
                angle: { from: -3, to: 3 },
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }

        this.add.text(col2X + 54, oy, 'Walls & Equipment', {
            fontSize: '11px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#64748b',
        }).setDepth(2);

        this.add.text(col2X + 54, oy + 15, 'Solid barriers. Navigate around\nAC units, pipes, and panels.', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#8b95a5',
            lineSpacing: 3,
        }).setDepth(2);

        // ── Next button ──
        const btnY = h - 50;
        this.createCardButton(w / 2, btnY, 200, 40, 'TIPS & SCORING  ▶', ACCENT_GREEN_HEX, () => {
            this.scene.start('TipsScoring', { character: this.character });
        });

        // Back link
        const backText = this.add.text(w / 2 - 180, btnY, '◀  BACK', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#6b7580',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        backText.on('pointerover', () => backText.setColor(ACCENT_GREEN));
        backText.on('pointerout', () => backText.setColor('#4b5563'));
        backText.on('pointerdown', () => this.scene.start('MeetTheTeam'));

        // Keyboard
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('TipsScoring', { character: this.character }));
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('TipsScoring', { character: this.character }));
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('MeetTheTeam'));

        // Audio controls
        audio.createControls(this);
    }

    // ── Generate preview textures ──

    generatePreviewTextures() {
        const puProto = PowerUp.prototype;
        POWERUP_LIST.forEach((data) => {
            const key = `powerup_${data.id}`;
            if (!this.textures.exists(key)) {
                const g = this.make.graphics({ add: false });
                puProto.drawPowerUp(g, data);
                g.generateTexture(key, 36, 36);
                g.destroy();
            }
        });

        const obProto = Obstacle.prototype;
        Object.values(OBSTACLE_TYPES).forEach((type) => {
            const key = `obstacle_${type.id}`;
            if (!this.textures.exists(key)) {
                const texSize = type.size * 3;
                const g = this.make.graphics({ add: false });
                obProto.drawObstacle(g, type, texSize);
                g.generateTexture(key, texSize, texSize);
                g.destroy();
            }
        });
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
