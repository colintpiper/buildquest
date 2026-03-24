// BuildQuest: Game Over Scene — Animated Reveal with Tier Ladder

import { COLORS, CSS_COLORS, TIERS } from '../utils/Constants.js';
import audio from '../utils/AudioManager.js';
import leaderboardAPI from '../utils/LeaderboardAPI.js';
import { addPixelHeader, PIXEL_THEMES } from '../utils/PixelFont.js';

const DARK_BG = 0x070b14;
const ACCENT_GREEN = '#4ade80';
const ACCENT_GREEN_HEX = 0x4ade80;

const TIER_GRADIENTS = {
    'Apprentice':           { from: 0x6b7280, to: 0x9ca3af, cssFrom: '#6b7280', cssTo: '#9ca3af' },
    'Journeyman':           { from: 0x2563eb, to: 0x60a5fa, cssFrom: '#2563eb', cssTo: '#60a5fa' },
    'Lead Tech':            { from: 0x16a34a, to: 0x4ade80, cssFrom: '#16a34a', cssTo: '#4ade80' },
    'Foreman':              { from: 0x9333ea, to: 0xc084fc, cssFrom: '#9333ea', cssTo: '#c084fc' },
    'Superintendent':       { from: 0xea580c, to: 0xfb923c, cssFrom: '#ea580c', cssTo: '#fb923c' },
    'Master Contractor':    { from: 0xdc2626, to: 0xf87171, cssFrom: '#dc2626', cssTo: '#f87171' },
    'Operations Director':  { from: 0xca8a04, to: 0xfacc15, cssFrom: '#ca8a04', cssTo: '#facc15' },
    'BuildOps Legend':      { from: 0xfbbf24, to: 0xfef08a, cssFrom: '#fbbf24', cssTo: '#fef08a' },
};

// Log-scale position for progress bar (same as before)
const LOG_BASE = 1000;
const LOG_MAX = 2000000;
function scoreToBarPct(s) {
    if (s <= 0) return 0;
    if (s <= LOG_BASE) return (s / LOG_BASE) * 0.05;
    return 0.05 + 0.95 * (Math.log(s / LOG_BASE) / Math.log(LOG_MAX / LOG_BASE));
}

export default class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.summary = data.summary;
        this.characterData = data.character;
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Deep dark background
        this.add.rectangle(w / 2, h / 2, w, h, DARK_BG);

        // Ambient glow
        this.drawAmbientGlow(w, h);

        // Grid overlay
        this.drawGrid(w, h);

        // Floating particles
        this.createParticles(w, h);

        // ── GAME OVER title — 3D pixel block letters (red) ──
        const titleY = h * 0.08;
        addPixelHeader(this, w / 2, titleY, 'GAME OVER', {
            px: 5, depth: 3, theme: PIXEL_THEMES.GAME_OVER,
        });

        // ── Tier badge — large, starts hidden ──
        this.tierBadgeText = this.add.text(w / 2, h * 0.165, '', {
            fontSize: '22px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#9ca3af',
            letterSpacing: 4,
        }).setOrigin(0.5).setAlpha(0);

        // ── Gradient progress bar ──
        this.drawProgressBar(w / 2, h * 0.215, 716);

        // ── Two-column layout ──
        const contentTop = h * 0.26;
        const contentBottom = h - 100;
        const contentH = contentBottom - contentTop;
        const leftX = 36;
        const rightX = w - 36 - 210;
        const leftW = rightX - leftX - 20;

        // Left: Score card
        this.drawCard(leftX, contentTop, leftW, contentH);

        // Right: Tier ladder card
        this.drawCard(rightX, contentTop, 210, contentH);

        // ── Score counter (starts at 0) ──
        const cardPadX = leftX + 26;
        const cardPadRight = leftX + leftW - 26;
        const rowH = contentH / 8; // 8 rows (1 big + 7 stats) but we have 7 items

        // Calculate row positions — evenly distributed
        const rowCount = 7;
        const rowStartY = contentTop + 18;
        const rowSpacing = (contentH - 36) / rowCount;

        // TOTAL SCORE row — always visible but counter starts at 0
        const scoreRowY = rowStartY + rowSpacing * 0.5;
        this.add.text(cardPadX, scoreRowY, 'TOTAL SCORE', {
            fontSize: '16px', fontFamily: 'monospace', color: '#9ca3af',
        }).setOrigin(0, 0.5);
        this.scoreCounterText = this.add.text(cardPadRight, scoreRowY, '0', {
            fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold', color: ACCENT_GREEN,
        }).setOrigin(1, 0.5);

        // Divider after TOTAL SCORE
        const divGfx = this.add.graphics();
        divGfx.lineStyle(1, 0xffffff, 0.07);
        divGfx.lineBetween(cardPadX, scoreRowY + rowSpacing * 0.45, cardPadRight, scoreRowY + rowSpacing * 0.45);
        divGfx.setDepth(2);

        // Stats rows — hidden initially, will cascade in
        const stats = [
            { label: 'Profit Margin', value: `${this.summary.profitMargin}%` },
            { label: 'Revenue Per Tech', value: `$${this.summary.revenuePerTech.toLocaleString()}` },
            { label: 'First-Time Fix Rate', value: `${this.summary.firstTimeFixRate}%` },
            { label: 'Best Streak', value: `${this.summary.bestStreak}x` },
            { label: 'Jobs Completed', value: `${this.summary.jobsCompleted}` },
            { label: 'Levels Completed', value: `${this.summary.wavesCompleted}` },
        ];

        this.statRows = [];
        stats.forEach((stat, i) => {
            const y = rowStartY + rowSpacing * (i + 1.5);
            const label = this.add.text(cardPadX, y, stat.label, {
                fontSize: '12px', fontFamily: 'monospace', color: '#9ca3af',
            }).setOrigin(0, 0.5).setAlpha(0);
            const value = this.add.text(cardPadRight, y, stat.value, {
                fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#e2e8f0',
            }).setOrigin(1, 0.5).setAlpha(0);

            // Divider
            if (i < stats.length - 1) {
                const dg = this.add.graphics();
                dg.lineStyle(1, 0xffffff, 0.04);
                dg.lineBetween(cardPadX, y + rowSpacing * 0.45, cardPadRight, y + rowSpacing * 0.45);
                dg.setDepth(2).setAlpha(0);
                this.statRows.push({ label, value, divider: dg });
            } else {
                this.statRows.push({ label, value });
            }
        });

        // ── Right: Tier ladder ──
        this.buildTierLadder(rightX, contentTop, 210, contentH);

        // ── Single button — VIEW LEADERBOARD (hidden initially) ──
        const btnY = h - 40;
        this.leaderboardBtn = this.createCardButton(w / 2, btnY, 240, 44, '🏆  VIEW LEADERBOARD', 0xfbbf24, () => {
            const playerName = localStorage.getItem('bq_player_name') || '';
            this.scene.start('Leaderboard', { justSubmitted: true, playerName, source: 'game' });
        });
        this.leaderboardBtn.container.setAlpha(0);

        // Keyboard — SPACE/ENTER now go to leaderboard (the primary action)
        this.input.keyboard.on('keydown-SPACE', () => {
            const playerName = localStorage.getItem('bq_player_name') || '';
            this.scene.start('Leaderboard', { justSubmitted: true, playerName, source: 'game' });
        });
        this.input.keyboard.on('keydown-ENTER', () => {
            const playerName = localStorage.getItem('bq_player_name') || '';
            this.scene.start('Leaderboard', { justSubmitted: true, playerName, source: 'game' });
        });

        // Audio controls
        audio.createControls(this);

        // ── Auto-submit score to leaderboard (fire-and-forget) ──
        this.autoSubmitScore();

        // ── START THE ANIMATION SEQUENCE ──
        this.lastTierIndex = -1;
        this.tickCounter = 0;
        this.time.delayedCall(400, () => this.startScoreAnimation());
    }

    // ── ANIMATION ENGINE ──

    startScoreAnimation() {
        const finalScore = this.summary.score;
        const duration = 2500; // ms
        const startTime = this.time.now;

        // Score tick SFX throttle
        let lastTickTime = 0;

        this.scoreAnim = this.time.addEvent({
            delay: 16, // ~60fps
            loop: true,
            callback: () => {
                const elapsed = this.time.now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const currentScore = Math.floor(finalScore * eased);

                // Update counter text
                this.scoreCounterText.setText(currentScore.toLocaleString());

                // Update progress bar fill
                const barPct = scoreToBarPct(currentScore);
                this.progressFillGfx.clear();
                if (barPct > 0) {
                    this.drawProgressFill(barPct);
                }

                // Check tier transitions
                const tierIdx = this.getCurrentTierIndex(currentScore);
                if (tierIdx > this.lastTierIndex) {
                    // New tier reached!
                    for (let i = this.lastTierIndex + 1; i <= tierIdx; i++) {
                        this.activateTier(i, i === tierIdx);
                        audio.sfxTierReached(i);
                    }
                    this.lastTierIndex = tierIdx;

                    // Update badge
                    const t = TIERS[tierIdx];
                    const grad = TIER_GRADIENTS[t.name] || TIER_GRADIENTS['Apprentice'];
                    this.tierBadgeText.setText(`${t.emoji}  ${t.name.toUpperCase()}`);
                    this.tierBadgeText.setColor(grad.cssTo);
                    this.tierBadgeText.setAlpha(1);
                    // Pop animation
                    this.tweens.add({
                        targets: this.tierBadgeText,
                        scaleX: 1.15, scaleY: 1.15,
                        duration: 150, yoyo: true, ease: 'Back.easeOut',
                    });
                }

                // Score tick SFX — every ~80ms
                if (elapsed - lastTickTime > 80 && progress < 1) {
                    audio.sfxScoreTick();
                    lastTickTime = elapsed;
                }

                // Update mini progress bar in current tier
                this.updateTierMiniBar(currentScore);

                if (progress >= 1) {
                    // Ensure exact final score
                    this.scoreCounterText.setText(finalScore.toLocaleString());
                    this.scoreAnim.remove();
                    audio.sfxScoreFinish();

                    // Phase 2: Cascade stats in
                    this.cascadeStats();
                }
            },
        });
    }

    cascadeStats() {
        this.statRows.forEach((row, i) => {
            this.time.delayedCall(150 * i, () => {
                audio.sfxStatPop();
                this.tweens.add({
                    targets: [row.label, row.value],
                    alpha: 1, y: '-=8',
                    duration: 300, ease: 'Power2',
                });
                if (row.divider) {
                    this.tweens.add({
                        targets: row.divider,
                        alpha: 1, duration: 300, ease: 'Power2',
                    });
                }
            });
        });

        // Phase 3: Show buttons after stats
        this.time.delayedCall(150 * this.statRows.length + 200, () => {
            audio.sfxRevealButtons();
            this.tweens.add({
                targets: [this.leaderboardBtn.container],
                alpha: 1, y: '-=10',
                duration: 350, ease: 'Power2',
            });
        });
    }

    async autoSubmitScore() {
        const playerName = localStorage.getItem('bq_player_name');
        const company = localStorage.getItem('bq_company');
        if (!playerName || !company) return; // No name entered — skip

        const s = this.summary;
        const result = await leaderboardAPI.submitScore({
            playerName,
            company,
            score: s.score,
            tier: s.tier?.name || 'Apprentice',
            character: this.characterData?.id || 'hvac',
            jobsCompleted: s.jobsCompleted,
            wavesCompleted: s.wavesCompleted,
            bestStreak: s.bestStreak,
        });

        if (!result.ok) {
            console.warn('[GameOver] Auto-submit failed:', result.error);
        }
    }

    getCurrentTierIndex(score) {
        for (let i = TIERS.length - 1; i >= 0; i--) {
            if (score >= TIERS[i].min) return i;
        }
        return 0;
    }

    // ── TIER LADDER ──

    buildTierLadder(x, y, panelW, panelH) {
        // Title
        this.add.text(x + panelW / 2, y + 16, 'TIER RANKS', {
            fontSize: '10px', fontFamily: 'monospace', color: '#6b7280',
        }).setOrigin(0.5).setDepth(2);

        const ladderTop = y + 32;
        const ladderH = panelH - 48;
        const stepH = ladderH / TIERS.length;
        const fillBarW = panelW - 32; // width of horizontal fill bar (edge to edge within card)

        this.tierSteps = [];

        // Draw from top (highest tier) to bottom (lowest)
        for (let i = TIERS.length - 1; i >= 0; i--) {
            const t = TIERS[i];
            const grad = TIER_GRADIENTS[t.name] || TIER_GRADIENTS['Apprentice'];
            const stepY = ladderTop + (TIERS.length - 1 - i) * stepH;
            const stepCenterY = stepY + stepH / 2;

            // Background highlight (hidden initially)
            const bg = this.add.rectangle(x + panelW / 2, stepCenterY, panelW - 20, stepH - 4, 0xffffff, 0)
                .setDepth(2);

            // Emoji
            const emoji = this.add.text(x + 16, stepCenterY - 3, t.emoji, {
                fontSize: '13px',
            }).setOrigin(0, 0.5).setDepth(2).setAlpha(0.3);

            // Name
            const name = this.add.text(x + 36, stepCenterY - 3, t.name.toUpperCase(), {
                fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold',
                color: '#4b5563',
            }).setOrigin(0, 0.5).setDepth(2);

            // Horizontal fill bar — background track
            const barY = stepCenterY + 9;
            const barBg = this.add.rectangle(x + 16, barY, fillBarW, 3, 0xffffff, 0.06)
                .setOrigin(0, 0.5).setDepth(2);

            // Horizontal fill bar — colored fill (starts at width 0)
            const barFill = this.add.rectangle(x + 16, barY, 0, 3, grad.from, 0.85)
                .setOrigin(0, 0.5).setDepth(3);

            this.tierSteps.push({
                bg, emoji, name, barBg, barFill, grad, tier: t, index: i,
                barFullW: fillBarW, barX: x + 16, barY,
            });
        }
    }

    activateTier(tierIndex, isCurrent) {
        // Find the step for this tier
        const step = this.tierSteps.find(s => s.index === tierIndex);
        if (!step) return;

        // Animate emoji to full opacity
        this.tweens.add({
            targets: step.emoji,
            alpha: 1, duration: 250, ease: 'Power2',
        });

        // Color the name
        step.name.setColor(step.grad.cssTo);

        if (isCurrent) {
            // Highlight current tier with background
            step.bg.setFillStyle(0xffffff, 0.06);
            step.bg.setStrokeStyle(1, 0xffffff, 0.12);
            step.name.setColor('#ffffff');
            step.name.setFontSize(10);
            // Flash effect
            this.tweens.add({
                targets: step.bg,
                fillAlpha: 0.15,
                duration: 200, yoyo: true, ease: 'Power2',
                onComplete: () => step.bg.setFillStyle(0xffffff, 0.06),
            });

            // Mark all lower tiers as fully achieved (handles tiers that
            // were briefly "current" before the score climbed past them)
            for (const s of this.tierSteps) {
                if (s.index < tierIndex && !s.achieved) {
                    s.barFill.width = s.barFullW;
                    s.achieved = true;
                    s.bg.setFillStyle(0xffffff, 0.015);
                }
            }
        } else {
            // Previously achieved tier — immediately fill bar to 100%
            step.bg.setFillStyle(0xffffff, 0.015);
            step.barFill.width = step.barFullW;
            step.achieved = true; // mark so updateTierMiniBar won't touch it
        }
    }

    updateTierMiniBar(score) {
        // Find current tier and update only its fill bar proportionally
        const idx = this.getCurrentTierIndex(score);
        const step = this.tierSteps.find(s => s.index === idx);
        if (!step || step.achieved) return;

        if (idx < TIERS.length - 1) {
            const tMin = TIERS[idx].min;
            const tMax = TIERS[idx + 1].min;
            const pct = Math.min(1, (score - tMin) / (tMax - tMin));
            step.barFill.width = Math.floor(step.barFullW * pct);
        } else {
            // Top tier — fill fully
            step.barFill.width = step.barFullW;
        }
    }

    // ── PROGRESS BAR ──

    drawProgressBar(cx, cy, barW) {
        const barH = 8;
        // Track
        const trackGfx = this.add.graphics();
        trackGfx.fillStyle(0xffffff, 0.03);
        trackGfx.fillRoundedRect(cx - barW / 2, cy - barH / 2, barW, barH, 4);
        trackGfx.lineStyle(1, 0xffffff, 0.06);
        trackGfx.strokeRoundedRect(cx - barW / 2, cy - barH / 2, barW, barH, 4);

        // Fill graphics (will be drawn each frame during animation)
        this.progressFillGfx = this.add.graphics();
        this.progressBarCx = cx;
        this.progressBarCy = cy;
        this.progressBarW = barW;
        this.progressBarH = barH;

        // Tier tick marks and labels
        const tierPositions = TIERS.map(t => scoreToBarPct(t.min));
        const tierAbbrevs = ['AP', 'JN', 'LT', 'FM', 'SU', 'MC', 'OD', 'BL'];
        TIERS.forEach((t, i) => {
            const grad = TIER_GRADIENTS[t.name] || TIER_GRADIENTS['Apprentice'];
            const px = cx - barW / 2 + tierPositions[i] * barW;
            // Tick
            const tick = this.add.graphics();
            tick.lineStyle(1, 0xffffff, 0.12);
            tick.lineBetween(px, cy - barH / 2 - 1, px, cy + barH / 2 + 1);
            // Label
            this.add.text(px, cy + barH / 2 + 7, tierAbbrevs[i], {
                fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold',
                color: grad.cssTo,
            }).setOrigin(0.5, 0);
        });
    }

    drawProgressFill(barPct) {
        const cx = this.progressBarCx;
        const cy = this.progressBarCy;
        const barW = this.progressBarW;
        const barH = this.progressBarH;
        const fillW = barPct * barW;

        // Pre-compute tier positions on the bar (log-scale)
        const tierBarPcts = TIERS.map(t => scoreToBarPct(t.min));

        // Draw gradient fill segment by segment, using log-scale tier boundaries
        const steps = Math.max(1, Math.floor(fillW / 2));
        for (let s = 0; s < steps; s++) {
            // This pixel's position as a fraction of the full bar
            const posPct = (s / steps) * barPct;

            // Find which tier this position falls in (based on log-scale boundaries)
            let tierIdx = 0;
            for (let i = TIERS.length - 1; i >= 0; i--) {
                if (posPct >= tierBarPcts[i]) { tierIdx = i; break; }
            }

            // Interpolate within the tier's color range
            const tier = TIERS[tierIdx];
            const grad = TIER_GRADIENTS[tier.name] || TIER_GRADIENTS['Apprentice'];
            const tierStart = tierBarPcts[tierIdx];
            const tierEnd = tierIdx < TIERS.length - 1 ? tierBarPcts[tierIdx + 1] : 1;
            const localT = tierEnd > tierStart ? (posPct - tierStart) / (tierEnd - tierStart) : 0;

            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.IntegerToColor(grad.from),
                Phaser.Display.Color.IntegerToColor(grad.to),
                1, localT
            );
            const hex = Phaser.Display.Color.GetColor(Math.round(color.r), Math.round(color.g), Math.round(color.b));
            this.progressFillGfx.fillStyle(hex, 0.85);
            const sx = cx - barW / 2 + (s / steps) * fillW;
            this.progressFillGfx.fillRect(sx, cy - barH / 2 + 1, fillW / steps + 1, barH - 2);
        }
    }

    // ── HELPERS ──

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
        const container = this.add.container(cx, cy);

        const gfx = this.add.graphics();
        const drawNormal = () => {
            gfx.clear();
            gfx.fillStyle(0xffffff, 0.03);
            gfx.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 12);
            gfx.lineStyle(1, borderColor, 0.35);
            gfx.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 12);
        };
        const drawHover = () => {
            gfx.clear();
            gfx.fillStyle(0xffffff, 0.06);
            gfx.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 12);
            gfx.lineStyle(1.5, borderColor, 0.6);
            gfx.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 12);
        };
        drawNormal();

        const zone = this.add.rectangle(0, 0, bw, bh, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        // Gold button gets gold text, others get muted color
        const isGold = borderColor === 0xfbbf24;
        const cssColor = isGold ? '#fbbf24' : (borderColor === ACCENT_GREEN_HEX ? ACCENT_GREEN : '#94a3b8');
        const txt = this.add.text(0, 0, label, {
            fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
            color: cssColor,
        }).setOrigin(0.5);

        zone.on('pointerover', () => { drawHover(); txt.setColor('#ffffff'); });
        zone.on('pointerout', () => { drawNormal(); txt.setColor(cssColor); });
        zone.on('pointerdown', onClick);

        container.add([gfx, zone, txt]);

        // Pulse animation for gold (leaderboard) button
        if (isGold) {
            this.tweens.add({
                targets: container,
                scaleX: { from: 1, to: 1.03 },
                scaleY: { from: 1, to: 1.03 },
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }

        return { container };
    }

    createParticles(w, h) {
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(0, w);
            const y = Phaser.Math.Between(0, h);
            const size = Phaser.Math.Between(1, 2);
            const dot = this.add.circle(x, y, size, ACCENT_GREEN_HEX, Phaser.Math.FloatBetween(0.08, 0.25));
            this.floatParticle(dot, w, h);
        }
    }

    floatParticle(dot, w, h) {
        const duration = Phaser.Math.Between(6000, 14000);
        this.tweens.add({
            targets: dot,
            y: -20, alpha: 0,
            duration,
            delay: Phaser.Math.Between(0, 3000),
            onComplete: () => {
                dot.setPosition(Phaser.Math.Between(0, w), h + 10);
                dot.setAlpha(Phaser.Math.FloatBetween(0.08, 0.25));
                this.floatParticle(dot, w, h);
            },
        });
    }
}
