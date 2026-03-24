// BuildQuest: Meet the Team Scene — How to Play Screen 1 (Character Introductions)

import { CHARACTERS, STAT_COLORS } from '../utils/Constants.js';
import audio from '../utils/AudioManager.js';
import { addPixelHeader, PIXEL_THEMES } from '../utils/PixelFont.js';

const DARK_BG = 0x070b14;
const ACCENT_GREEN = '#4ade80';
const ACCENT_GREEN_HEX = 0x4ade80;

// BuildOps persona narratives tied to each character
const CHARACTER_NARRATIVES = [
    {
        id: 'hvac',
        title: 'HVAC TECH',
        tagline: 'Keep it cool under pressure',
        narrative: 'Backbone of every commercial\njob. Balanced stats for any\ndispatch.',
        persona: 'Field Technician',
        accentColor: '#f97316',
        accentHex: 0xf97316,
    },
    {
        id: 'electrician',
        title: 'ELECTRICIAN',
        tagline: 'Fastest hands in the field',
        narrative: 'Lightning-quick repairs and\ntop-tier fix speed. Built for\nspeed runners.',
        persona: 'Service Pro',
        accentColor: '#fbbf24',
        accentHex: 0xfbbf24,
    },
    {
        id: 'plumber',
        title: 'PLUMBER',
        tagline: 'Built tough for the long haul',
        narrative: 'Maximum health means more\nroom for error. Push through\nthe toughest levels.',
        persona: 'Heavy Hitter',
        accentColor: '#dc2626',
        accentHex: 0xdc2626,
    },
    {
        id: 'pm',
        title: 'PROJECT MANAGER',
        tagline: 'Boost your whole operation',
        narrative: 'The strategic pick. Extended\npower-up durations turn buffs\ninto game changers.',
        persona: 'Operations Lead',
        accentColor: '#60a5fa',
        accentHex: 0x60a5fa,
    },
];

export default class MeetTheTeam extends Phaser.Scene {
    constructor() {
        super('MeetTheTeam');
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        this.selectedIndex = 0;
        this.cardHighlights = [];

        // Start menu music (only if not already playing menu track)
        audio.resume();
        if (!audio.musicPlaying || audio.currentTrack !== 'menu') {
            audio.startMusic('menu');
        }

        // Background
        this.add.rectangle(w / 2, h / 2, w, h, DARK_BG);
        this.drawAmbientGlow(w, h);
        this.drawGrid(w, h);
        this.createParticles(w, h);

        // ── Title — 3D pixel block letters ──
        addPixelHeader(this, w / 2, 40, 'SELECT YOUR TECH', {
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

        // ── Four character cards ──
        const cardW = 164;
        const cardH = 380;
        const gap = 14;
        const totalW = cardW * 4 + gap * 3;
        const startX = (w - totalW) / 2;
        const topY = 112;

        CHARACTERS.forEach((char, i) => {
            const info = CHARACTER_NARRATIVES[i];
            const cx = startX + i * (cardW + gap);

            // Selection highlight (drawn under card content, updated on select)
            const pad = 6;
            const hlGfx = this.add.graphics().setDepth(1);
            const hoverGfx = this.add.graphics().setDepth(1);
            this.cardHighlights.push({ gfx: hlGfx, hoverGfx, cx, topY, cardW, cardH, pad });

            // Card background
            this.drawCard(cx, topY, cardW, cardH);

            // Persona badge
            const badgeTxt = this.add.text(cx + cardW / 2, topY + 16, info.persona.toUpperCase(), {
                fontSize: '8px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: info.accentColor,
            }).setOrigin(0.5).setDepth(2).setAlpha(0.7);

            // Character name
            const nameText = this.add.text(cx + cardW / 2, topY + 32, info.title, {
                fontSize: '13px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: info.accentColor,
            }).setOrigin(0.5).setDepth(2);

            // Tagline
            this.add.text(cx + cardW / 2, topY + 50, info.tagline, {
                fontSize: '9px',
                fontFamily: 'monospace',
                fontStyle: 'italic',
                color: '#94a3b8',
            }).setOrigin(0.5).setDepth(2);

            // Character sprite — animated with idle bounce
            const charSprite = this.drawCharacterPreview(cx + cardW / 2, topY + 130, char);

            // Glow circle behind character — pulsing
            const glow = this.add.circle(cx + cardW / 2, topY + 130, 36, info.accentHex, 0.08).setDepth(1);
            this.tweens.add({
                targets: glow,
                alpha: { from: 0.05, to: 0.15 },
                scaleX: { from: 1, to: 1.15 },
                scaleY: { from: 1, to: 1.15 },
                duration: 1800 + i * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });

            // Narrative text
            this.add.text(cx + cardW / 2, topY + 195, info.narrative, {
                fontSize: '9px',
                fontFamily: 'monospace',
                color: '#8b95a5',
                lineSpacing: 3,
                align: 'center',
            }).setOrigin(0.5, 0).setDepth(2);

            // Stats mini-bars
            const statLabels = { SPD: 'Speed', STR: 'Health', FIX: 'Repair', BUFF: 'Boost' };
            const statNames = ['STR', 'FIX', 'SPD', 'BUFF'];
            let sy = topY + 278;

            // Divider line
            const divGfx = this.add.graphics().setDepth(2);
            divGfx.lineStyle(1, 0xffffff, 0.06);
            divGfx.lineBetween(cx + 14, sy - 8, cx + cardW - 14, sy - 8);

            statNames.forEach((stat, si) => {
                const val = char.stats[stat];
                const statColor = STAT_COLORS[stat] || STAT_COLORS.FIX;
                const animDelay = 300 + i * 150 + si * 100;
                const slideOffset = -16;

                // Label — slide in from left
                const label = this.add.text(cx + 14 + slideOffset, sy, statLabels[stat], {
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    color: '#6b7580',
                }).setDepth(2).setAlpha(0);

                this.tweens.add({
                    targets: label,
                    x: cx + 14,
                    alpha: 1,
                    duration: 350,
                    delay: animDelay,
                    ease: 'Power2',
                });

                if (stat === 'STR') {
                    // Health shown as hearts
                    const totalHearts = val;
                    let heartStr = '';
                    for (let hi = 0; hi < totalHearts; hi++) heartStr += '♥';
                    const hearts = this.add.text(cx + 56 + slideOffset, sy - 1, heartStr, {
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        letterSpacing: 2,
                        color: statColor.css,
                    }).setDepth(2).setAlpha(0);

                    this.tweens.add({
                        targets: hearts,
                        x: cx + 56,
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
                    const wrenches = this.add.text(cx + 56 + slideOffset, sy - 1, wrenchStr, {
                        fontSize: '11px',
                        letterSpacing: 2,
                    }).setDepth(2).setAlpha(0);

                    this.tweens.add({
                        targets: wrenches,
                        x: cx + 56,
                        alpha: 1,
                        duration: 400,
                        delay: animDelay + 60,
                        ease: 'Power2',
                    });
                } else {
                    // Bar background — slide in
                    const barX = cx + 56;
                    const barW = 72;
                    const barBg = this.add.rectangle(barX + barW / 2 + slideOffset, sy + 5, barW, 6, 0xffffff, 0.04)
                        .setDepth(2).setAlpha(0);

                    this.tweens.add({
                        targets: barBg,
                        x: barX + barW / 2,
                        alpha: 1,
                        duration: 350,
                        delay: animDelay + 60,
                        ease: 'Power2',
                    });

                    // Bar fill — animated width
                    const fillW = (val / 5) * barW;
                    const fill = this.add.rectangle(barX, sy + 5, 0, 6, statColor.hex).setOrigin(0, 0.5).setDepth(2);

                    this.tweens.add({
                        targets: fill,
                        width: fillW,
                        duration: 500,
                        delay: animDelay + 200,
                        ease: 'Power2',
                    });

                    // Value — fade in after bar fills
                    const numText = this.add.text(cx + cardW - 14, sy, `${val}`, {
                        fontSize: '9px',
                        fontFamily: 'monospace',
                        fontStyle: 'bold',
                        color: '#e2e8f0',
                    }).setOrigin(1, 0).setDepth(2).setAlpha(0);

                    this.tweens.add({
                        targets: numText,
                        alpha: 1,
                        duration: 300,
                        delay: animDelay + 400,
                        ease: 'Power2',
                    });
                }

                sy += 22;
            });

            // Hit zone for selection
            const hitZone = this.add.rectangle(cx + cardW / 2, topY + cardH / 2, cardW, cardH, 0x000000, 0)
                .setInteractive({ useHandCursor: true })
                .setDepth(3);

            hitZone.on('pointerover', () => {
                if (this.selectedIndex !== i) {
                    audio.sfxMenuHover();
                    const { hoverGfx, cx, topY, cardW, cardH, pad } = this.cardHighlights[i];
                    hoverGfx.clear();
                    hoverGfx.fillStyle(0xffffff, 0.04);
                    hoverGfx.fillRoundedRect(cx - pad, topY - pad, cardW + pad * 2, cardH + pad * 2, 16);
                    hoverGfx.lineStyle(1.5, 0xffffff, 0.25);
                    hoverGfx.strokeRoundedRect(cx - pad, topY - pad, cardW + pad * 2, cardH + pad * 2, 16);
                }
            });
            hitZone.on('pointerout', () => {
                this.cardHighlights[i].hoverGfx.clear();
            });
            hitZone.on('pointerdown', () => {
                if (this.selectedIndex !== i) {
                    audio.sfxMenuSelect();
                    this.cardHighlights[i].hoverGfx.clear();
                    this.selectCharacter(i);
                }
            });
        });

        // Draw initial selection highlight
        this.updateHighlight();

        // ── Next button ──
        const btnY = h - 50;
        this.createCardButton(w / 2, btnY, 200, 40, 'POWER-UPS & OBSTACLES  ▶', ACCENT_GREEN_HEX, () => {
            this.scene.start('HowToPlay', { character: CHARACTERS[this.selectedIndex] });
        });

        // Keyboard
        this.input.keyboard.on('keydown-LEFT', () => this.selectCharacter(Math.max(0, this.selectedIndex - 1)));
        this.input.keyboard.on('keydown-RIGHT', () => this.selectCharacter(Math.min(CHARACTERS.length - 1, this.selectedIndex + 1)));
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('HowToPlay', { character: CHARACTERS[this.selectedIndex] }));
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('HowToPlay', { character: CHARACTERS[this.selectedIndex] }));

        // Audio controls
        audio.createControls(this);
    }

    selectCharacter(index) {
        this.selectedIndex = index;
        this.updateHighlight();
    }

    updateHighlight() {
        this.cardHighlights.forEach(({ gfx, cx, topY, cardW, cardH, pad }, i) => {
            gfx.clear();
            if (i === this.selectedIndex) {
                gfx.fillStyle(0x4ade80, 0.05);
                gfx.fillRoundedRect(cx - pad, topY - pad, cardW + pad * 2, cardH + pad * 2, 16);
                gfx.lineStyle(2.5, 0x4ade80, 0.85);
                gfx.strokeRoundedRect(cx - pad, topY - pad, cardW + pad * 2, cardH + pad * 2, 16);
            }
        });
    }

    // ── Character preview drawing (returns container y for animation) ──
    drawCharacterPreview(x, y, char) {
        const g = this.add.graphics().setDepth(2);
        const s = 3.5;
        const ox = x - 10 * s;
        const oy = y - 12 * s;

        const r = (px, py, pw, ph, color) => {
            g.fillStyle(color);
            g.fillRect(ox + px * s, oy + py * s, pw * s, ph * s);
        };

        if (char.id === 'hvac') {
            r(4, 0, 12, 2, 0xfdba74); r(3, 2, 14, 3, 0xf97316); r(5, 1, 10, 1, 0xf97316);
            r(5, 5, 10, 6, 0xfed7aa); r(6, 7, 2, 2, 0x1e293b); r(7, 7, 1, 1, 0xffffff);
            r(12, 7, 2, 2, 0x1e293b); r(12, 7, 1, 1, 0xffffff);
            r(8, 9, 4, 1, 0xfca5a5); r(8, 10, 4, 1, 0xfbbf24);
            r(4, 11, 12, 6, 0x3b82f6); r(5, 14, 10, 3, 0x2563eb);
            r(9, 12, 1, 1, 0x88ccff); r(8, 13, 3, 1, 0x88ccff); r(9, 14, 1, 1, 0x88ccff);
            r(2, 11, 2, 6, 0x3b82f6); r(16, 11, 2, 6, 0x3b82f6);
            r(0, 9, 3, 3, 0x2244aa); r(0, 9, 3, 1, 0x4488cc); r(1, 10, 1, 1, 0xffffff);
            r(0, 12, 1, 4, 0xdd2222); r(2, 12, 1, 4, 0x2266cc); r(1, 12, 1, 3, 0xfbbf24);
            r(5, 17, 10, 1, 0x92400e); r(9, 17, 2, 1, 0xfbbf24);
            r(3, 16, 2, 2, 0x7a5a2e); r(15, 16, 2, 2, 0x7a5a2e);
            r(5, 18, 4, 4, 0x1e3a5f); r(11, 18, 4, 4, 0x1e3a5f);
            r(5, 22, 4, 2, 0x78350f); r(11, 22, 4, 2, 0x78350f);
        } else if (char.id === 'electrician') {
            r(4, 0, 12, 2, 0xfde68a); r(3, 2, 14, 3, 0xfbbf24); r(5, 1, 10, 1, 0xfbbf24);
            r(9, 1, 1, 1, 0xff6600); r(8, 2, 1, 1, 0xff6600); r(9, 3, 1, 1, 0xff6600);
            r(5, 5, 10, 6, 0xd4a574); r(6, 7, 2, 2, 0x1e293b); r(7, 7, 1, 1, 0xffffff);
            r(12, 7, 2, 2, 0x1e293b); r(12, 7, 1, 1, 0xffffff);
            r(8, 9, 4, 1, 0xfca5a5); r(8, 10, 4, 1, 0xd4a574);
            r(4, 11, 12, 6, 0x22c55e); r(5, 14, 10, 3, 0x16a34a);
            r(9, 12, 2, 1, 0xfef08a); r(8, 13, 2, 1, 0xfef08a); r(9, 14, 2, 1, 0xfef08a);
            r(2, 11, 2, 6, 0x22c55e); r(16, 11, 2, 6, 0x22c55e);
            r(0, 11, 1, 5, 0xcc4444); r(2, 11, 1, 5, 0xcc4444);
            r(0, 14, 1, 2, 0xaa2222); r(2, 14, 1, 2, 0xaa2222);
            r(0, 10, 3, 1, 0x8899aa); r(1, 10, 1, 1, 0xaabbcc);
            r(0, 8, 1, 2, 0x6688aa); r(2, 8, 1, 2, 0x6688aa);
            r(0, 8, 3, 1, 0xaabbcc); r(0, 7, 1, 1, 0xfef08a); r(2, 7, 1, 1, 0xfef08a);
            r(17, 8, 3, 2, 0xdd8833); r(17, 10, 3, 2, 0xcc7722);
            r(18, 12, 2, 2, 0xbb6611); r(17, 9, 1, 1, 0xeebb55);
            r(5, 17, 10, 1, 0x92400e); r(9, 17, 2, 1, 0xfbbf24);
            r(5, 18, 4, 4, 0x1e3a5f); r(11, 18, 4, 4, 0x1e3a5f);
            r(5, 22, 4, 2, 0x78350f); r(11, 22, 4, 2, 0x78350f);
        } else if (char.id === 'plumber') {
            r(5, 1, 10, 2, 0xdc2626); r(4, 3, 12, 2, 0x991b1b); r(14, 4, 4, 2, 0x991b1b);
            r(5, 5, 10, 6, 0xfed7aa); r(6, 9, 8, 2, 0x92400e);
            r(6, 7, 2, 2, 0x1e293b); r(7, 7, 1, 1, 0xffffff);
            r(12, 7, 2, 2, 0x1e293b); r(12, 7, 1, 1, 0xffffff);
            r(8, 9, 4, 1, 0xfca5a5);
            r(4, 11, 12, 6, 0x7c3aed); r(5, 13, 10, 1, 0x6d28d9); r(5, 15, 10, 1, 0x6d28d9);
            r(9, 12, 2, 1, 0x44aaff); r(8, 13, 4, 2, 0x3388dd); r(9, 15, 2, 1, 0x3388dd);
            r(1, 11, 3, 6, 0x7c3aed); r(16, 11, 3, 6, 0x7c3aed);
            r(18, 7, 2, 2, 0xaabbcc); r(18, 9, 1, 1, 0x8899aa); r(18, 9, 2, 1, 0xaabbcc);
            r(17, 8, 1, 2, 0x8899aa); r(18, 10, 2, 3, 0xcc4444);
            r(19, 13, 1, 5, 0xcc4444); r(19, 18, 1, 2, 0xaa3333); r(18, 11, 1, 1, 0xdd5555);
            r(0, 12, 2, 1, 0x6e7a8a); r(0, 11, 1, 3, 0x5a6a7a); r(0, 13, 2, 1, 0x6e7a8a);
            r(5, 17, 10, 1, 0x92400e); r(9, 17, 2, 1, 0xfbbf24);
            r(5, 18, 4, 4, 0x44403c); r(11, 18, 4, 4, 0x44403c);
            r(5, 22, 4, 2, 0x78350f); r(11, 22, 4, 2, 0x78350f);
        } else if (char.id === 'pm') {
            r(5, 1, 10, 3, 0x1e293b); r(6, 0, 8, 1, 0x1e293b);
            r(5, 4, 10, 7, 0xfed7aa); r(6, 6, 3, 2, 0xc084fc); r(11, 6, 3, 2, 0xc084fc);
            r(9, 6, 2, 1, 0x1e293b); r(7, 7, 1, 1, 0x1e293b); r(12, 7, 1, 1, 0x1e293b);
            r(8, 9, 4, 1, 0xfca5a5);
            r(4, 11, 12, 6, 0xe5e7eb); r(5, 14, 10, 3, 0xd1d5db);
            r(9, 11, 2, 6, 0x22c55e);
            r(2, 11, 2, 6, 0xe5e7eb); r(16, 11, 2, 6, 0xe5e7eb);
            r(0, 11, 2, 3, 0x1e293b); r(0, 12, 2, 1, 0x4ade80);
            r(5, 17, 10, 1, 0x374151);
            r(5, 18, 4, 4, 0x374151); r(11, 18, 4, 4, 0x374151);
            r(5, 22, 4, 2, 0x1e293b); r(11, 22, 4, 2, 0x1e293b);
        }

        // Idle bounce animation
        this.tweens.add({
            targets: g,
            y: { from: g.y, to: g.y - 4 },
            duration: 1200 + CHARACTERS.indexOf(char) * 150,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        return g;
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
            fontSize: '11px',
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

        zone.on('pointerover', () => { drawHover(); txt.setColor('#ffffff'); });
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
