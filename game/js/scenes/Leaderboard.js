// BuildQuest: Leaderboard Scene — Dual-tab global leaderboard

import { TIERS } from '../utils/Constants.js';
import audio from '../utils/AudioManager.js';
import leaderboardAPI from '../utils/LeaderboardAPI.js';
import { addPixelHeader, PIXEL_THEMES } from '../utils/PixelFont.js';

const DARK_BG = 0x070b14;
const ACCENT_GREEN = '#4ade80';
const ACCENT_GREEN_HEX = 0x4ade80;
const GOLD_HEX = 0xfbbf24;
const GOLD_CSS = '#fbbf24';
const SILVER_HEX = 0x94a3b8;
const BRONZE_HEX = 0xcd7f32;

const TIER_COLORS = {
    'Apprentice': '#9ca3af',
    'Journeyman': '#60a5fa',
    'Lead Tech': '#4ade80',
    'Foreman': '#c084fc',
    'Superintendent': '#fb923c',
    'Master Contractor': '#f87171',
    'Operations Director': '#facc15',
    'BuildOps Legend': '#fef08a',
};

const CHARACTER_COLORS = {
    hvac: 0x4ade80,
    electrician: 0xfbbf24,
    plumber: 0x60a5fa,
    pm: 0xf97316,
};

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];
const MEDAL_BG_COLORS = [GOLD_HEX, SILVER_HEX, BRONZE_HEX];
const MEDAL_BG_ALPHA = [0.08, 0.06, 0.05];

// Max display widths for text truncation
const MAX_NAME_WIDTH = 110;
const MAX_COMPANY_WIDTH = 140;
const MAX_TIER_WIDTH = 110;

export default class Leaderboard extends Phaser.Scene {
    constructor() {
        super('Leaderboard');
    }

    init(data) {
        this.justSubmitted = data?.justSubmitted || false;
        this.playerName = data?.playerName || localStorage.getItem('bq_player_name') || '';
        this.source = data?.source || 'menu';
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        this.w = w;
        this.h = h;

        // Wrap text creation to always use high-res rendering (avoids pixelated small text)
        const origAddText = this.add.text.bind(this.add);
        this.add.text = (x, y, text, style = {}) => {
            return origAddText(x, y, text, { ...style, resolution: 2 });
        };

        // Background
        this.add.rectangle(w / 2, h / 2, w, h, DARK_BG);
        this.drawAmbientGlow(w, h);
        this.drawGrid(w, h);
        this.createParticles(w, h);

        // ── Title ──
        addPixelHeader(this, w / 2, 36, 'LEADERBOARD', {
            px: 4, depth: 2, theme: PIXEL_THEMES.GOLD,
        });

        // ── Tab buttons — moved down for breathing room ──
        this.activeTab = 'techs';
        const tabY = 88;
        const tabW = 190;
        const tabH = 32;
        const tabGap = 16;

        this.tabTechs = this.createTabButton(
            w / 2 - tabW / 2 - tabGap / 2, tabY, tabW, tabH,
            'TOP TECHS ALL-TIME', true, () => this.switchTab('techs')
        );
        this.tabCompanies = this.createTabButton(
            w / 2 + tabW / 2 + tabGap / 2, tabY, tabW, tabH,
            'TOP COMPANIES ALL-TIME', false, () => this.switchTab('companies')
        );

        // ── Leaderboard content area ──
        const cardTop = 114;
        const cardH = h - 114 - 62;
        this.cardX = 36;
        this.cardW = w - 72;
        this.cardTop = cardTop;
        this.cardH = cardH;
        this.drawCard(this.cardX, cardTop, this.cardW, cardH);

        // Content container (for easy clearing)
        this.contentContainer = this.add.container(0, 0).setDepth(3);

        // Loading text
        this.loadingText = this.add.text(w / 2, cardTop + cardH / 2, 'Loading...', {
            fontSize: '14px', fontFamily: 'monospace', color: '#6b7280',
        }).setOrigin(0.5).setDepth(3);
        this.loadingTween = this.tweens.add({
            targets: this.loadingText,
            alpha: { from: 1, to: 0.3 },
            duration: 800, yoyo: true, repeat: -1,
        });

        // Error text (hidden)
        this.errorText = this.add.text(w / 2, cardTop + cardH / 2, '', {
            fontSize: '12px', fontFamily: 'monospace', color: '#f87171',
            align: 'center',
        }).setOrigin(0.5).setDepth(3).setAlpha(0);

        // ── Navigation buttons ──
        const btnY = h - 30;
        if (this.source === 'game') {
            this.createCardButton(w / 2 - 110, btnY, 170, 36, 'PLAY AGAIN', ACCENT_GREEN_HEX, () => {
                this.scene.start('CharacterSelect');
            });
            this.createCardButton(w / 2 + 110, btnY, 170, 36, 'MAIN MENU', 0x64748b, () => {
                this.scene.start('Menu');
            });
        } else {
            this.createCardButton(w / 2, btnY, 170, 36, '◀  BACK', 0x64748b, () => {
                this.scene.start('Menu');
            });
        }

        // Pagination state (techs tab only)
        this.techsPage = 0;
        this.techsData = [];
        this.techsRowsPerPage = 9;

        // Keyboard
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.source === 'game') this.scene.start('CharacterSelect');
        });
        this.input.keyboard.on('keydown-TAB', (e) => {
            e.preventDefault();
            this.switchTab(this.activeTab === 'techs' ? 'companies' : 'techs');
        });
        this.input.keyboard.on('keydown-LEFT', () => {
            if (this.activeTab === 'techs' && this.techsPage > 0) {
                this.techsPage--;
                this.contentContainer.removeAll(true);
                this._renderTechsPage();
            }
        });
        this.input.keyboard.on('keydown-RIGHT', () => {
            if (this.activeTab === 'techs') {
                const totalPages = Math.ceil(this.techsData.length / this.techsRowsPerPage);
                if (this.techsPage < totalPages - 1) {
                    this.techsPage++;
                    this.contentContainer.removeAll(true);
                    this._renderTechsPage();
                }
            }
        });

        // Audio controls
        audio.createControls(this);

        // Load data
        this.loadData();
    }

    async loadData() {
        this.showLoading();

        if (this.activeTab === 'techs') {
            const result = await leaderboardAPI.getTopTechsAllTime(50);
            if (result.ok) {
                this.hideLoading();
                this.renderTechs(result.data);
            } else {
                this.showError(result.error || 'Could not load leaderboard');
            }
        } else {
            const result = await leaderboardAPI.getTopCompaniesAllTime(10);
            if (result.ok) {
                this.hideLoading();
                this.renderCompanies(result.data);
            } else {
                this.showError(result.error || 'Could not load leaderboard');
            }
        }
    }

    switchTab(tab) {
        if (tab === this.activeTab) return;
        audio.sfxMenuSelect();
        this.activeTab = tab;
        this.techsPage = 0; // reset pagination on tab switch

        // Update tab visuals
        this.updateTabVisuals(this.tabTechs, tab === 'techs');
        this.updateTabVisuals(this.tabCompanies, tab === 'companies');

        // Clear and reload
        this.contentContainer.removeAll(true);
        this.loadData();
    }

    showLoading() {
        this.loadingText.setAlpha(1);
        this.errorText.setAlpha(0);
    }

    hideLoading() {
        if (this.loadingTween) this.loadingTween.stop();
        this.loadingText.setAlpha(0);
    }

    showError(msg) {
        this.loadingText.setAlpha(0);
        this.errorText.setText(msg + '\n\nTap to retry').setAlpha(1);

        // Make error text interactive for retry
        if (!this.errorText.input) {
            this.errorText.setInteractive({ useHandCursor: true });
            this.errorText.on('pointerdown', () => {
                this.contentContainer.removeAll(true);
                this.loadData();
            });
        }
    }

    /**
     * Truncate a Phaser text object to fit within maxWidth pixels
     */
    truncateText(textObj, maxWidth) {
        if (textObj.width <= maxWidth) return;
        const original = textObj.text;
        for (let len = original.length - 1; len > 0; len--) {
            textObj.setText(original.slice(0, len) + '…');
            if (textObj.width <= maxWidth) return;
        }
    }

    // ── Render Techs Tab ──

    renderTechs(data) {
        const rowH = 42;
        const paginationH = 32;
        const available = this.cardH - 12 - 22 - 8 - paginationH;
        this.techsRowsPerPage = Math.max(1, Math.floor(available / rowH));
        this.techsData = data;
        this._renderTechsPage();
    }

    _renderTechsPage() {
        const w = this.w;
        const startY = this.cardTop + 12;
        const rowH = 42;
        const padX = this.cardX + 16;
        const rightX = this.cardX + this.cardW - 16;
        const totalPages = Math.ceil(this.techsData.length / this.techsRowsPerPage);
        const pageStart = this.techsPage * this.techsRowsPerPage;
        const pageData = this.techsData.slice(pageStart, pageStart + this.techsRowsPerPage);

        // Header row
        const headerY = startY + 4;
        this.addContent(this.add.text(padX, headerY, 'RANK', {
            fontSize: '9px', fontFamily: 'monospace', color: '#6b7280',
        }).setDepth(3));
        this.addContent(this.add.text(padX + 56, headerY, 'NAME', {
            fontSize: '9px', fontFamily: 'monospace', color: '#6b7280',
        }).setDepth(3));
        this.addContent(this.add.text(rightX - 200, headerY, 'SCORE', {
            fontSize: '9px', fontFamily: 'monospace', color: '#6b7280',
        }).setDepth(3));
        this.addContent(this.add.text(rightX - 8, headerY, 'TIER', {
            fontSize: '9px', fontFamily: 'monospace', color: '#6b7280',
        }).setOrigin(1, 0).setDepth(3));

        if (this.techsData.length === 0) {
            this.addContent(this.add.text(w / 2, this.cardTop + this.cardH / 2, 'No scores yet — be the first!', {
                fontSize: '13px', fontFamily: 'monospace', color: '#6b7280',
            }).setOrigin(0.5).setDepth(3));
            return;
        }

        // Rows
        pageData.forEach((entry, i) => {
            const globalRank = pageStart + i; // 0-based global rank
            const y = startY + 22 + i * rowH;

            const isPlayer = this.justSubmitted && entry.player_name === this.playerName;
            const isFirst = globalRank === 0;
            const isMedal = globalRank < 3;

            // Row background for top 3 or current player
            if (isMedal || isPlayer) {
                const rowBg = this.add.graphics().setDepth(2);
                if (isPlayer) {
                    rowBg.fillStyle(ACCENT_GREEN_HEX, 0.06);
                    rowBg.lineStyle(1, ACCENT_GREEN_HEX, 0.15);
                } else if (isFirst) {
                    rowBg.fillStyle(ACCENT_GREEN_HEX, 0.08);
                    rowBg.lineStyle(1.5, ACCENT_GREEN_HEX, 0.25);
                } else {
                    rowBg.fillStyle(MEDAL_BG_COLORS[globalRank], MEDAL_BG_ALPHA[globalRank]);
                }
                rowBg.fillRoundedRect(this.cardX + 8, y - 2, this.cardW - 16, rowH - 4, 6);
                if (isPlayer || isFirst) {
                    rowBg.strokeRoundedRect(this.cardX + 8, y - 2, this.cardW - 16, rowH - 4, 6);
                }
                this.addContent(rowBg);
            }

            // Subtle divider between non-medal rows
            if (i > 0 && !isMedal) {
                const divider = this.add.graphics().setDepth(2);
                divider.lineStyle(1, 0xffffff, 0.04);
                divider.lineBetween(this.cardX + 16, y - 2, this.cardX + this.cardW - 16, y - 2);
                this.addContent(divider);
            }

            const cy = y + rowH / 2 - 2;

            // Rank
            const rankStr = isMedal ? MEDAL_ICONS[globalRank] : `${globalRank + 1}.`;
            const rankText = this.add.text(padX + 6, cy, rankStr, {
                fontSize: isMedal ? '16px' : '12px',
                fontFamily: 'monospace', fontStyle: 'bold',
                color: isMedal ? '#ffffff' : '#6b7280',
            }).setOrigin(0, 0.5).setDepth(3);
            this.addContent(rankText);

            // Character dot
            const charColor = CHARACTER_COLORS[entry.character] || 0x6b7280;
            const charDot = this.add.circle(padX + 46, cy, 5, charColor, 0.8).setDepth(3);
            this.addContent(charDot);

            // Name
            const nameColor = isPlayer ? ACCENT_GREEN : (isFirst ? ACCENT_GREEN : '#e2e8f0');
            const nameText = this.add.text(padX + 60, cy - 10, entry.player_name || 'Anonymous', {
                fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold',
                color: nameColor,
            }).setDepth(3);
            this.truncateText(nameText, MAX_NAME_WIDTH);
            this.addContent(nameText);

            // Company subtitle
            const companyText = this.add.text(padX + 60, cy + 5, entry.company || '', {
                fontSize: '9px', fontFamily: 'monospace',
                color: isFirst ? '#6ee7a0' : '#6b7280',
            }).setDepth(3);
            this.truncateText(companyText, MAX_COMPANY_WIDTH);
            this.addContent(companyText);

            // Score
            const scoreColor = isFirst ? ACCENT_GREEN : (isMedal ? GOLD_CSS : '#e2e8f0');
            const scoreText = this.add.text(rightX - 200, cy, (entry.score || 0).toLocaleString(), {
                fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
                color: scoreColor,
            }).setOrigin(0, 0.5).setDepth(3);
            this.addContent(scoreText);

            // Tier badge
            const tierColor = TIER_COLORS[entry.tier] || '#6b7280';
            const tierEmoji = TIERS.find(t => t.name === entry.tier)?.emoji || '';
            const tierText = this.add.text(rightX - 8, cy, `${tierEmoji} ${(entry.tier || '').toUpperCase()}`, {
                fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold',
                color: tierColor,
            }).setOrigin(1, 0.5).setDepth(3);
            this.addContent(tierText);

            // Staggered fade-in
            const elements = [rankText, charDot, nameText, companyText, scoreText, tierText];
            elements.forEach(el => el.setAlpha(0));
            this.tweens.add({
                targets: elements,
                alpha: 1, x: '+=8',
                duration: 250,
                delay: 60 * i,
                ease: 'Power2',
            });
        });

        // Pagination controls
        if (totalPages > 1) {
            this._renderTechsPagination(totalPages);
        }
    }

    _renderTechsPagination(totalPages) {
        const paginationY = this.cardTop + this.cardH - 16;
        const cx = this.w / 2;
        const canPrev = this.techsPage > 0;
        const canNext = this.techsPage < totalPages - 1;

        // ◀ prev button
        const prevColor = canPrev ? '#e2e8f0' : '#374151';
        const prevText = this.add.text(cx - 60, paginationY, '◀', {
            fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
            color: prevColor,
        }).setOrigin(0.5).setDepth(4);
        if (canPrev) {
            prevText.setInteractive({ useHandCursor: true });
            prevText.on('pointerover', () => { audio.sfxMenuHover(); prevText.setColor(ACCENT_GREEN); });
            prevText.on('pointerout', () => prevText.setColor(prevColor));
            prevText.on('pointerdown', () => {
                audio.sfxMenuSelect();
                this.techsPage--;
                this.contentContainer.removeAll(true);
                this._renderTechsPage();
            });
        }
        this.addContent(prevText);

        // Page indicator: "2 / 4"
        const pageLabel = this.add.text(cx, paginationY, `${this.techsPage + 1} / ${totalPages}`, {
            fontSize: '10px', fontFamily: 'monospace', color: '#6b7280',
        }).setOrigin(0.5).setDepth(4);
        this.addContent(pageLabel);

        // ▶ next button
        const nextColor = canNext ? '#e2e8f0' : '#374151';
        const nextText = this.add.text(cx + 60, paginationY, '▶', {
            fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
            color: nextColor,
        }).setOrigin(0.5).setDepth(4);
        if (canNext) {
            nextText.setInteractive({ useHandCursor: true });
            nextText.on('pointerover', () => { audio.sfxMenuHover(); nextText.setColor(ACCENT_GREEN); });
            nextText.on('pointerout', () => nextText.setColor(nextColor));
            nextText.on('pointerdown', () => {
                audio.sfxMenuSelect();
                this.techsPage++;
                this.contentContainer.removeAll(true);
                this._renderTechsPage();
            });
        }
        this.addContent(nextText);
    }

    // ── Render Companies Tab ──

    renderCompanies(data) {
        const w = this.w;
        const startY = this.cardTop + 12;
        const rowH = 54;
        const padX = this.cardX + 16;
        const rightX = this.cardX + this.cardW - 16;

        // Header row — brighter, easier to read
        const headerY = startY + 6;
        this.addContent(this.add.text(padX, headerY, 'RANK', {
            fontSize: '9px', fontFamily: 'monospace', color: '#6b7280',
        }).setDepth(3));
        this.addContent(this.add.text(padX + 56, headerY, 'COMPANY', {
            fontSize: '9px', fontFamily: 'monospace', color: '#6b7280',
        }).setDepth(3));
        this.addContent(this.add.text(rightX - 180, headerY, 'TOTAL SCORE', {
            fontSize: '9px', fontFamily: 'monospace', color: '#6b7280',
        }).setDepth(3));
        this.addContent(this.add.text(rightX - 50, headerY, 'PLAYERS', {
            fontSize: '9px', fontFamily: 'monospace', color: '#6b7280',
        }).setDepth(3));

        if (data.length === 0) {
            this.addContent(this.add.text(w / 2, this.cardTop + this.cardH / 2, 'No scores yet — be the first!', {
                fontSize: '13px', fontFamily: 'monospace', color: '#6b7280',
            }).setOrigin(0.5).setDepth(3));
            return;
        }

        const playerCompany = localStorage.getItem('bq_company') || '';

        // Rows
        data.forEach((entry, i) => {
            const y = startY + 24 + i * rowH;
            if (y + rowH > this.cardTop + this.cardH - 8) return;

            const isPlayerCompany = this.justSubmitted && entry.company === playerCompany;
            const isFirst = i === 0;

            // Row background
            if (i < 3 || isPlayerCompany) {
                const rowBg = this.add.graphics().setDepth(2);
                if (isPlayerCompany) {
                    rowBg.fillStyle(ACCENT_GREEN_HEX, 0.06);
                    rowBg.lineStyle(1, ACCENT_GREEN_HEX, 0.15);
                } else if (isFirst) {
                    // #1 gets a special glow border
                    rowBg.fillStyle(ACCENT_GREEN_HEX, 0.08);
                    rowBg.lineStyle(1.5, ACCENT_GREEN_HEX, 0.25);
                } else {
                    rowBg.fillStyle(MEDAL_BG_COLORS[i], MEDAL_BG_ALPHA[i]);
                }
                rowBg.fillRoundedRect(this.cardX + 8, y - 2, this.cardW - 16, rowH - 6, 6);
                if (isPlayerCompany || isFirst) {
                    rowBg.strokeRoundedRect(this.cardX + 8, y - 2, this.cardW - 16, rowH - 6, 6);
                }
                this.addContent(rowBg);
            }

            // Subtle divider line between rows (skip medal rows)
            if (i > 0 && i >= 3) {
                const divider = this.add.graphics().setDepth(2);
                divider.lineStyle(1, 0xffffff, 0.04);
                divider.lineBetween(this.cardX + 16, y - 3, this.cardX + this.cardW - 16, y - 3);
                this.addContent(divider);
            }

            // Vertical center of the row
            const cy = y + rowH / 2 - 2;

            // Rank — fixed x position, vertically centered
            const rankStr = i < 3 ? MEDAL_ICONS[i] : `${i + 1}.`;
            const rankText = this.add.text(padX + 6, cy, rankStr, {
                fontSize: i < 3 ? '16px' : '12px',
                fontFamily: 'monospace', fontStyle: 'bold',
                color: i < 3 ? '#ffffff' : '#6b7280',
            }).setOrigin(0, 0.5).setDepth(3);
            this.addContent(rankText);

            // Character icon for top player — vertically centered
            const topCharColor = CHARACTER_COLORS[entry.top_character] || 0x6b7280;
            const charDot = this.add.circle(padX + 46, cy, 5, topCharColor, 0.8).setDepth(3);
            this.addContent(charDot);

            // Company name — top line of name+callout pair
            const companyColor = isPlayerCompany ? ACCENT_GREEN : (isFirst ? ACCENT_GREEN : '#e2e8f0');
            const companyName = this.add.text(padX + 56, cy - 12, entry.company || 'Unknown', {
                fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
                color: companyColor,
            }).setDepth(3);
            this.truncateText(companyName, MAX_COMPANY_WIDTH);
            this.addContent(companyName);

            // Top player callout — positioned below company name
            const topPlayerStr = entry.top_player
                ? `★ ${entry.top_player} — High Score: ${(entry.best_score || 0).toLocaleString()}`
                : `High Score: ${(entry.best_score || 0).toLocaleString()}`;
            const bestLabel = this.add.text(padX + 56, cy + 5, topPlayerStr, {
                fontSize: '10px', fontFamily: 'monospace',
                color: isFirst ? '#6ee7a0' : (i < 3 ? '#facc15' : '#8b95a5'),
            }).setDepth(3);
            this.addContent(bestLabel);

            // Total score — vertically centered
            const totalScoreColor = isFirst ? ACCENT_GREEN : (i < 3 ? GOLD_CSS : '#e2e8f0');
            const totalScore = this.add.text(rightX - 180, cy, (entry.total_score || 0).toLocaleString(), {
                fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
                color: totalScoreColor,
            }).setOrigin(0, 0.5).setDepth(3);
            this.addContent(totalScore);

            // Unique players — vertically centered
            const players = this.add.text(rightX - 50, cy, String(entry.unique_players || 0), {
                fontSize: '13px', fontFamily: 'monospace', color: '#9ca3af',
            }).setOrigin(0, 0.5).setDepth(3);
            this.addContent(players);

            // Staggered animation
            const elements = [rankText, charDot, companyName, bestLabel, totalScore, players];
            elements.forEach(el => el.setAlpha(0));
            this.tweens.add({
                targets: elements,
                alpha: 1, x: '+=8',
                duration: 250,
                delay: 80 * i,
                ease: 'Power2',
            });
        });
    }

    addContent(gameObject) {
        this.contentContainer.add(gameObject);
    }

    // ── Tab buttons ──

    createTabButton(cx, cy, bw, bh, label, active, onClick) {
        const gfx = this.add.graphics().setDepth(2);
        const txt = this.add.text(cx, cy, label, {
            fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold',
            color: active ? '#ffffff' : '#6b7280',
        }).setOrigin(0.5).setDepth(3);

        const zone = this.add.rectangle(cx, cy, bw, bh, 0x000000, 0)
            .setInteractive({ useHandCursor: true }).setDepth(4);

        zone.on('pointerdown', onClick);
        zone.on('pointerover', () => {
            audio.sfxMenuHover();
            txt.setColor('#ffffff');
            gfx.clear();
            gfx.fillStyle(0xffffff, 0.08);
            gfx.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 8);
            gfx.lineStyle(1.5, GOLD_HEX, 0.6);
            gfx.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 8);
        });
        zone.on('pointerout', () => {
            this.drawTab(tab, tab._active || false);
        });

        const tab = { gfx, txt, zone, cx, cy, bw, bh, _active: active };
        this.drawTab(tab, active);
        return tab;
    }

    drawTab(tab, active) {
        const { gfx, txt, cx, cy, bw, bh } = tab;
        gfx.clear();
        if (active) {
            gfx.fillStyle(0xffffff, 0.06);
            gfx.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 8);
            gfx.lineStyle(1, GOLD_HEX, 0.5);
            gfx.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 8);
            txt.setColor('#ffffff');
        } else {
            gfx.fillStyle(0xffffff, 0.02);
            gfx.fillRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 8);
            gfx.lineStyle(1, 0xffffff, 0.08);
            gfx.strokeRoundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 8);
            txt.setColor('#6b7280');
        }
    }

    updateTabVisuals(tab, active) {
        tab._active = active;
        this.drawTab(tab, active);
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
            .setInteractive({ useHandCursor: true }).setDepth(5);

        const cssColor = borderColor === ACCENT_GREEN_HEX ? ACCENT_GREEN : '#94a3b8';
        const txt = this.add.text(cx, cy, label, {
            fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold',
            color: cssColor,
        }).setOrigin(0.5).setDepth(3);

        zone.on('pointerover', () => { audio.sfxMenuHover(); drawHover(); txt.setColor('#ffffff'); });
        zone.on('pointerout', () => { drawNormal(); txt.setColor(cssColor); });
        zone.on('pointerdown', () => { audio.sfxMenuSelect(); onClick(); });
    }

    drawCard(x, y, w, h) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0xffffff, 0.03);
        gfx.fillRoundedRect(x, y, w, h, 14);
        gfx.lineStyle(1, 0xffffff, 0.06);
        gfx.strokeRoundedRect(x, y, w, h, 14);
        gfx.setDepth(1);
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
