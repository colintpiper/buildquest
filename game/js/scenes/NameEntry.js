// BuildQuest: Name Entry Scene — Capture player name + company before gameplay

import audio from '../utils/AudioManager.js';
import { addPixelHeader, PIXEL_THEMES } from '../utils/PixelFont.js';

const DARK_BG = 0x070b14;
const ACCENT_GREEN = '#4ade80';
const ACCENT_GREEN_HEX = 0x4ade80;
const GOLD_HEX = 0xfbbf24;
const GOLD_CSS = '#fbbf24';

export default class NameEntry extends Phaser.Scene {
    constructor() {
        super('NameEntry');
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Background
        this.add.rectangle(w / 2, h / 2, w, h, DARK_BG);
        this.drawAmbientGlow(w, h);
        this.drawGrid(w, h);
        this.createParticles(w, h);

        // ── Title ──
        addPixelHeader(this, w / 2, h * 0.12, 'PLAYER INFO', {
            px: 4, depth: 2, theme: PIXEL_THEMES.GOLD,
        });

        this.add.text(w / 2, h * 0.20, 'Enter your name and company to compete on the leaderboard', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#8b95a5',
        }).setOrigin(0.5);

        // ── Input fields ──
        const fieldW = 340;
        const fieldH = 44;
        const fieldX = w / 2;

        // Load saved values
        const savedName = localStorage.getItem('bq_player_name') || '';
        const savedCompany = localStorage.getItem('bq_company') || '';

        // NAME field
        const nameFieldY = h * 0.34;
        this.add.text(fieldX - fieldW / 2, nameFieldY - 22, 'YOUR NAME', {
            fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold',
            color: ACCENT_GREEN,
        }).setDepth(2);

        this.nameField = this.createInputField(fieldX, nameFieldY, fieldW, fieldH, savedName, 'Enter your name...', 20);

        // COMPANY field
        const companyFieldY = h * 0.50;
        this.add.text(fieldX - fieldW / 2, companyFieldY - 22, 'COMPANY', {
            fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold',
            color: GOLD_CSS,
        }).setDepth(2);

        this.companyField = this.createInputField(fieldX, companyFieldY, fieldW, fieldH, savedCompany, 'Enter your company...', 30);

        // ── Error text (hidden) ──
        this.errorText = this.add.text(w / 2, h * 0.61, '', {
            fontSize: '11px', fontFamily: 'monospace', color: '#f87171',
        }).setOrigin(0.5).setDepth(2).setAlpha(0);

        // ── CONTINUE button ──
        const btnY = h * 0.72;
        this.createCardButton(w / 2, btnY, 220, 46, 'CONTINUE  ▶', ACCENT_GREEN_HEX, () => {
            this.handleContinue();
        });

        // ── Skip text ──
        const skipText = this.add.text(w / 2, h * 0.82, 'Press ESC to skip', {
            fontSize: '10px', fontFamily: 'monospace', color: '#4b5563',
        }).setOrigin(0.5);

        // ── Keyboard shortcuts ──
        this.input.keyboard.on('keydown-ENTER', () => this.handleContinue());
        this.input.keyboard.on('keydown-ESC', () => {
            audio.sfxMenuSelect();
            this.scene.start('MeetTheTeam');
        });

        // Audio controls
        audio.createControls(this);

        // Focus name field by default if empty
        if (!savedName) {
            this.time.delayedCall(200, () => this.focusField(this.nameField));
        }
    }

    handleContinue() {
        const name = this.nameField.value.trim();
        const company = this.companyField.value.trim();

        if (!name || !company) {
            this.showError('Please enter both your name and company');
            return;
        }

        // Save to localStorage
        localStorage.setItem('bq_player_name', name);
        localStorage.setItem('bq_company', company);

        audio.sfxMenuSelect();
        this.cleanupInputs();
        this.scene.start('MeetTheTeam');
    }

    showError(msg) {
        this.errorText.setText(msg).setAlpha(1);
        this.tweens.add({
            targets: this.errorText,
            alpha: 0,
            duration: 300,
            delay: 2000,
            ease: 'Power2',
        });
    }

    // ── HTML Input overlay system ──

    createInputField(cx, cy, fw, fh, initialValue, placeholder, maxLen) {
        // Phaser visual wrapper (card-style)
        const gfx = this.add.graphics().setDepth(2);
        const drawNormal = () => {
            gfx.clear();
            gfx.fillStyle(0xffffff, 0.05);
            gfx.fillRoundedRect(cx - fw / 2, cy - fh / 2, fw, fh, 10);
            gfx.lineStyle(1, 0xffffff, 0.12);
            gfx.strokeRoundedRect(cx - fw / 2, cy - fh / 2, fw, fh, 10);
        };
        const drawFocused = () => {
            gfx.clear();
            gfx.fillStyle(0xffffff, 0.08);
            gfx.fillRoundedRect(cx - fw / 2, cy - fh / 2, fw, fh, 10);
            gfx.lineStyle(1.5, ACCENT_GREEN_HEX, 0.5);
            gfx.strokeRoundedRect(cx - fw / 2, cy - fh / 2, fw, fh, 10);
        };
        drawNormal();

        // Phaser text display (shows current value)
        const displayText = this.add.text(cx - fw / 2 + 16, cy, initialValue || placeholder, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: initialValue ? '#e2e8f0' : '#4b5563',
        }).setOrigin(0, 0.5).setDepth(3);

        // Hidden HTML input element
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = maxLen;
        input.value = initialValue;
        input.placeholder = placeholder;
        input.autocomplete = 'off';
        input.autocapitalize = 'words';
        Object.assign(input.style, {
            position: 'absolute',
            opacity: '0',
            pointerEvents: 'none',
            width: '1px',
            height: '1px',
            top: '-9999px',
            left: '-9999px',
        });
        document.body.appendChild(input);

        // Sync input → display
        input.addEventListener('input', () => {
            const val = input.value;
            displayText.setText(val || placeholder);
            displayText.setColor(val ? '#e2e8f0' : '#4b5563');
        });

        input.addEventListener('focus', () => drawFocused());
        input.addEventListener('blur', () => drawNormal());

        // Click on Phaser card → focus HTML input
        const zone = this.add.rectangle(cx, cy, fw, fh, 0x000000, 0)
            .setInteractive({ useHandCursor: true }).setDepth(4);

        zone.on('pointerdown', () => {
            input.style.pointerEvents = 'auto';
            input.focus();
            // Re-hide after focus established
            this.time.delayedCall(50, () => {
                input.style.pointerEvents = 'none';
            });
        });

        // Store reference for cleanup and value access
        const field = {
            input,
            displayText,
            gfx,
            zone,
            get value() { return input.value; },
        };

        // Track for cleanup
        if (!this._htmlInputs) this._htmlInputs = [];
        this._htmlInputs = this._htmlInputs || [];
        this._htmlInputs.push(input);

        return field;
    }

    focusField(field) {
        if (field && field.input) {
            field.input.style.pointerEvents = 'auto';
            field.input.focus();
            this.time.delayedCall(50, () => {
                field.input.style.pointerEvents = 'none';
            });
        }
    }

    cleanupInputs() {
        if (this._htmlInputs) {
            this._htmlInputs.forEach(input => {
                if (input.parentNode) input.parentNode.removeChild(input);
            });
            this._htmlInputs = [];
        }
    }

    shutdown() {
        this.cleanupInputs();
    }

    // ── Shared visual helpers ──

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
            fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
            color: cssColor,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            alpha: { from: 1, to: 0.4 },
            duration: 900, yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut',
        });

        zone.on('pointerover', () => { audio.sfxMenuHover(); drawHover(); txt.setColor('#ffffff'); });
        zone.on('pointerout', () => { drawNormal(); txt.setColor(cssColor); });
        zone.on('pointerdown', () => { audio.sfxMenuSelect(); onClick(); });
    }

    drawAmbientGlow(w, h) {
        const gfx = this.add.graphics();
        const goldSteps = 12;
        for (let i = goldSteps; i >= 0; i--) {
            const r = (Math.max(w, h) * 0.6) * (i / goldSteps);
            const alpha = 0.03 * (1 - i / goldSteps);
            gfx.fillStyle(GOLD_HEX, alpha);
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

    createParticles(w, h) {
        for (let i = 0; i < 12; i++) {
            const x = Phaser.Math.Between(0, w);
            const y = Phaser.Math.Between(0, h);
            const size = Phaser.Math.Between(1, 2);
            const dot = this.add.circle(x, y, size, GOLD_HEX, Phaser.Math.FloatBetween(0.08, 0.25));
            this.floatParticle(dot, w, h);
        }
    }

    floatParticle(dot, w, h) {
        this.tweens.add({
            targets: dot,
            y: -20, alpha: 0,
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
