// BuildQuest: Main Game Scene

import {
    COLORS, CSS_COLORS, TILE_SIZE, MAP,
    WAVE_CONFIG, POWERUP_LIST, OBSTACLE_TYPES, SCORING,
    GAME_WIDTH, GAME_HEIGHT,
} from '../utils/Constants.js';
import Player from '../entities/Player.js';
import Job from '../entities/Job.js';
import Obstacle from '../entities/Obstacle.js';
import PowerUp from '../entities/PowerUp.js';
import ScoreManager from '../utils/ScoreManager.js';
import audio from '../utils/AudioManager.js';
import { addPixelHeader, PIXEL_THEMES } from '../utils/PixelFont.js';
import { getLevelTheme } from '../utils/LevelConfig.js';

export default class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.characterData = data.character;
    }

    create() {
        this.scoreManager = new ScoreManager();

        // Start game music (startMusic handles stop internally)
        audio.init();
        audio.startMusic('game');

        // Game state
        this.wave = 0;
        this.waveTime = 0;
        this.waveTimeTotal = 0;
        this.waveActive = false;
        this.gameOver = false;
        this.paused = false;
        this.showingAnnouncement = false;

        // Collections
        this.jobs = [];
        this.obstacles = [];
        this.powerups = [];
        this.activePowerUps = {};

        // Theme tracking
        this.currentTheme = null;
        this.mapObjects = []; // track all map display objects for cleanup

        // Create map (Level 1 theme)
        const theme = getLevelTheme(1);
        this.createMap(theme);

        // Playable area (inside walls)
        const playLeft = TILE_SIZE * MAP.WALL_THICKNESS;
        const playTop = TILE_SIZE * MAP.WALL_THICKNESS;
        const playW = (MAP.WIDTH - MAP.WALL_THICKNESS * 2) * TILE_SIZE;
        const playH = (MAP.HEIGHT - MAP.WALL_THICKNESS * 2) * TILE_SIZE;
        this.playBounds = new Phaser.Geom.Rectangle(playLeft, playTop, playW, playH);

        // Physics bounds
        this.physics.world.setBounds(playLeft, playTop, playW, playH);

        // Player
        this.player = new Player(
            this,
            playLeft + playW / 2,
            playTop + playH / 2,
            this.characterData
        );

        // Collide player with solid equipment
        this.physics.add.collider(this.player.sprite, this.solidGroup);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
        });

        // Mute key
        this.input.keyboard.on('keydown-M', () => audio.toggleMute());

        // Pause keys
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());
        this.input.keyboard.on('keydown-P', () => this.togglePause());

        // Audio controls
        audio.createControls(this);

        // Touch controls
        this.setupTouchControls();

        // UI
        this.createUI();

        // Power-up timer
        this.lastPowerUpSpawn = 0;

        // Start first wave on next update frame
        this.waveStartPending = true;
    }

    createMap(theme) {
        this.currentTheme = theme;
        const layout = this.layout = theme.layout;

        // Equipment types to cycle through for '2' tiles
        const equipKeys = theme.equipKeys;
        let equipIdx = 0;

        // Track animated overlay config for equipment
        const animatedOverlays = theme.animatedOverlays || [];
        const fanEquipIndices = new Set(animatedOverlays.filter(a => a.type === 'fan').map(a => a.equipIndex));
        const fanConfigs = {};
        animatedOverlays.filter(a => a.type === 'fan').forEach(a => { fanConfigs[a.equipIndex] = a; });

        // Floor tile variants
        const floorKeys = theme.floorKeys;

        // Use theme-specific or default wall textures
        const wallKey = theme.wallKey;
        const wallTopKey = theme.wallTopKey;

        // For default theme, keep the drain grate variant
        const isDefault = theme.id === 'default';

        // Static physics group for solid equipment
        this.solidGroup = this.physics.add.staticGroup();

        // Track all map display objects for cleanup
        this.mapObjects = [];
        this.themeOverlayObjects = [];

        for (let ty = 0; ty < MAP.HEIGHT; ty++) {
            for (let tx = 0; tx < MAP.WIDTH; tx++) {
                const x = tx * TILE_SIZE + TILE_SIZE / 2;
                const y = ty * TILE_SIZE + TILE_SIZE / 2;
                const cell = layout[ty][tx];

                if (cell === 1) {
                    const aboveIsFloor = ty > 0 && layout[ty - 1][tx] !== 1;
                    const isEdge = tx === 0 || tx === MAP.WIDTH - 1 || ty === 0 || ty === MAP.HEIGHT - 1;
                    const wKey = aboveIsFloor ? wallTopKey : wallKey;
                    if (!isEdge) {
                        const wall = this.physics.add.staticImage(x, y, wKey).setDepth(0);
                        wall.body.setSize(TILE_SIZE, TILE_SIZE);
                        wall.body.setOffset(0, 0);
                        wall.setImmovable(true);
                        this.solidGroup.add(wall);
                        this.mapObjects.push(wall);
                    } else {
                        const img = this.add.image(x, y, wKey).setDepth(0);
                        this.mapObjects.push(img);
                    }
                } else {
                    // Floor tile — seeded pseudorandom variant selection
                    const hash = (tx * 7 + ty * 13 + tx * ty) % 17;
                    let tileKey;
                    if (isDefault && hash === 0) {
                        tileKey = 'tile_floor4'; // drain grate (rare, default only)
                    } else if (hash < 5) {
                        tileKey = floorKeys[3] || floorKeys[0]; // cracked
                    } else if (hash < 9) {
                        tileKey = floorKeys[2] || floorKeys[0]; // alternate
                    } else {
                        tileKey = floorKeys[0]; // standard
                    }
                    const floorImg = this.add.image(x, y, tileKey).setDepth(0);
                    this.mapObjects.push(floorImg);

                    // Shadow overlays for floor tiles adjacent to walls
                    const wallAbove = ty > 0 && layout[ty - 1][tx] === 1;
                    const wallLeft = tx > 0 && layout[ty][tx - 1] === 1;
                    if (wallAbove && wallLeft) {
                        const s = this.add.image(x, y, 'shadow_corner').setDepth(1).setAlpha(0.8);
                        this.mapObjects.push(s);
                    } else if (wallAbove) {
                        const s = this.add.image(x, y, 'shadow_down').setDepth(1).setAlpha(0.8);
                        this.mapObjects.push(s);
                    } else if (wallLeft) {
                        const s = this.add.image(x, y, 'shadow_right').setDepth(1).setAlpha(0.8);
                        this.mapObjects.push(s);
                    }

                    if (cell === 2) {
                        const key = equipKeys[equipIdx % equipKeys.length];
                        const currentEquipIdx = equipIdx;
                        equipIdx++;
                        const equip = this.physics.add.staticImage(x, y, key).setDepth(2).setAlpha(0.85);
                        equip.body.setSize(TILE_SIZE, TILE_SIZE);
                        equip.body.setOffset(0, 0);
                        equip.setImmovable(true);
                        this.solidGroup.add(equip);
                        this.mapObjects.push(equip);

                        // Add fan overlay if this equipment index matches
                        if (fanEquipIndices.has(currentEquipIdx)) {
                            const fc = fanConfigs[currentEquipIdx];
                            const fanKey = `fan_blade_${theme.id}`;
                            if (this.textures.exists(fanKey)) {
                                const fan = this.add.image(x, y, fanKey).setDepth(2.5).setAlpha(0.85).setScale(1.1);
                                this.themeOverlayObjects.push(fan);
                                this.tweens.add({
                                    targets: fan,
                                    angle: 360,
                                    duration: fc.speed || 2000,
                                    repeat: -1,
                                    ease: 'Linear',
                                });
                            }
                        }
                    }
                }
            }
        }

        // Ambient details — cobwebs in corners, scuff marks
        this.addAmbientDetails(layout, theme);

        // Theme-specific overlays
        this.addThemeOverlays(theme);

        // Atmospheric effects — color wash + environmental particles
        this.addColorWash(theme);
        this.createAtmosphereParticles(theme);
    }

    destroyMap() {
        // Clear solid group first (remove references without destroying — mapObjects handles destruction)
        if (this.solidGroup) {
            try { this.solidGroup.clear(false, false); } catch (e) { /* group already cleared */ }
        }
        // Remove all map display objects (includes colorWashRect)
        if (this.mapObjects) {
            this.mapObjects.forEach(obj => {
                if (obj && obj.active !== false) {
                    try { obj.destroy(); } catch (e) { /* already destroyed */ }
                }
            });
            this.mapObjects = [];
        }
        // Clear theme overlay objects (fans, overlays, tweened objects)
        if (this.themeOverlayObjects) {
            this.themeOverlayObjects.forEach(obj => {
                if (obj && obj.active !== false) {
                    try { obj.destroy(); } catch (e) { /* already destroyed */ }
                }
            });
            this.themeOverlayObjects = [];
        }
        // Clear atmosphere particles
        if (this.atmosphereParticles) {
            this.atmosphereParticles.forEach(p => {
                if (p && p.active !== false) {
                    try { p.destroy(); } catch (e) { /* already destroyed */ }
                }
            });
            this.atmosphereParticles = [];
        }
        // Clear ambient graphics
        if (this.ambientGfx) {
            this.ambientGfx.destroy();
            this.ambientGfx = null;
        }
        // Clear vignette
        if (this.vignetteGfx) {
            this.vignetteGfx.destroy();
            this.vignetteGfx = null;
        }
    }

    addThemeOverlays(theme) {
        if (!theme.themeOverlay) return;
        const overlay = theme.themeOverlay;
        const layout = this.layout;
        const TS = TILE_SIZE;

        switch (overlay.type) {
            case 'stage':
                this._addStageOverlay(layout, TS);
                break;
            case 'frost':
                this._addFrostOverlay(layout, TS);
                break;
            case 'pipes':
                this._addPipesOverlay(layout, TS);
                break;
            case 'hazard':
                this._addHazardOverlay(layout, TS);
                break;
            case 'leds':
                this._addLedsOverlay(layout, TS);
                break;
            case 'beacon':
                this._addBeaconOverlay(layout, TS);
                break;
            case 'shaft':
                this._addShaftOverlay(layout, TS);
                break;
            case 'caution':
                this._addCautionOverlay(layout, TS);
                break;
        }
    }

    _addStageOverlay(layout, TS) {
        const g = this.add.graphics().setDepth(1.5);
        this.themeOverlayObjects.push(g);

        // Stage edge line at row 7 (the wall divider)
        const stageY = 7 * TS;
        for (let tx = 1; tx < MAP.WIDTH - 1; tx++) {
            if (layout[7][tx] !== 1) {
                const x = tx * TS;
                // Purple/gold gradient line
                g.fillStyle(0xa855f7, 0.6);
                g.fillRect(x, stageY, TS, 3);
                g.fillStyle(0xfbbf24, 0.5);
                g.fillRect(x, stageY + 3, TS, 2);
            }
        }

        // Spotlight cones on stage floor (rows 1-6)
        const spotPositions = [
            { tx: 4, ty: 3 }, { tx: 8, ty: 2 }, { tx: 12, ty: 4 },
        ];
        spotPositions.forEach(sp => {
            const sx = sp.tx * TS + TS / 2;
            const sy = sp.ty * TS + TS / 2;
            const spot = this.add.circle(sx, sy, 36, 0xfbbf24, 0.15).setDepth(3.5);
            this.themeOverlayObjects.push(spot);
            this.tweens.add({
                targets: spot, alpha: { from: 0.08, to: 0.25 },
                duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
            const spot2 = this.add.circle(sx, sy, 22, 0xa855f7, 0.12).setDepth(3.5);
            this.themeOverlayObjects.push(spot2);
            this.tweens.add({
                targets: spot2, alpha: { from: 0.06, to: 0.20 },
                duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 500,
            });
        });

        // "BUILDOPS" text on stage
        const boText = this.add.text(8 * TS + TS / 2, 4 * TS, 'BUILDOPS', {
            fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#4ade80',
        }).setOrigin(0.5).setDepth(1.5).setAlpha(0.55);
        this.themeOverlayObjects.push(boText);

        // "FORGE 2026" banner near top
        const fText = this.add.text(8 * TS + TS / 2, 1 * TS + 10, 'FORGE 2026', {
            fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#a855f7',
        }).setOrigin(0.5).setDepth(1.5).setAlpha(0.50);
        this.themeOverlayObjects.push(fText);

        // Audience silhouettes in rows 9-11
        const audienceGfx = this.add.graphics().setDepth(1.5);
        this.themeOverlayObjects.push(audienceGfx);
        for (let row = 9; row <= 11; row++) {
            for (let tx = 2; tx < MAP.WIDTH - 2; tx++) {
                if (layout[row][tx] === 0 && Math.random() < 0.5) {
                    const ax = tx * TS + Phaser.Math.Between(8, TS - 8);
                    const ay = row * TS + Phaser.Math.Between(8, TS - 8);
                    audienceGfx.fillStyle(0x1a1228, 0.40);
                    audienceGfx.fillCircle(ax, ay - 4, 4); // head
                    audienceGfx.fillRect(ax - 3, ay, 6, 7); // body
                }
            }
        }
    }

    _addFrostOverlay(layout, TS) {
        const g = this.add.graphics().setDepth(1.5);
        this.themeOverlayObjects.push(g);

        // Frost edge creep on wall-adjacent floor tiles
        for (let ty = 1; ty < MAP.HEIGHT - 1; ty++) {
            for (let tx = 1; tx < MAP.WIDTH - 1; tx++) {
                if (layout[ty][tx] !== 0) continue;
                const x = tx * TS;
                const y = ty * TS;
                const wallAbove = ty > 0 && layout[ty - 1][tx] === 1;
                const wallBelow = ty < MAP.HEIGHT - 1 && layout[ty + 1][tx] === 1;
                const wallLeft = tx > 0 && layout[ty][tx - 1] === 1;
                const wallRight = tx < MAP.WIDTH - 1 && layout[ty][tx + 1] === 1;

                const alpha = Phaser.Math.FloatBetween(0.18, 0.30);
                if (wallAbove) {
                    g.fillStyle(0xddeeff, alpha);
                    g.fillRect(x, y, TS, Phaser.Math.Between(2, 4));
                }
                if (wallBelow) {
                    const h = Phaser.Math.Between(2, 4);
                    g.fillStyle(0xddeeff, alpha);
                    g.fillRect(x, y + TS - h, TS, h);
                }
                if (wallLeft) {
                    g.fillStyle(0xddeeff, alpha);
                    g.fillRect(x, y, Phaser.Math.Between(2, 4), TS);
                }
                if (wallRight) {
                    const w = Phaser.Math.Between(2, 4);
                    g.fillStyle(0xddeeff, alpha);
                    g.fillRect(x + TS - w, y, w, TS);
                }
            }
        }

        // Random ice patches on floor tiles
        for (let i = 0; i < 10; i++) {
            const tx = Phaser.Math.Between(2, MAP.WIDTH - 3);
            const ty = Phaser.Math.Between(2, MAP.HEIGHT - 3);
            if (layout[ty][tx] === 0) {
                const px = tx * TS + Phaser.Math.Between(8, TS - 8);
                const py = ty * TS + Phaser.Math.Between(8, TS - 8);
                g.fillStyle(0xddeeff, Phaser.Math.FloatBetween(0.10, 0.18));
                g.fillCircle(px, py, Phaser.Math.Between(6, 12));
            }
        }

        // Icicles from top wall edge
        const icicleGfx = this.add.graphics().setDepth(2.5);
        this.themeOverlayObjects.push(icicleGfx);
        for (let tx = 2; tx < MAP.WIDTH - 2; tx++) {
            if (layout[0][tx] === 1 && layout[1][tx] === 0 && Math.random() < 0.4) {
                const ix = tx * TS + Phaser.Math.Between(6, TS - 6);
                const iy = 1 * TS;
                icicleGfx.fillStyle(0x88ccff, 0.50);
                icicleGfx.fillTriangle(ix - 3, iy, ix + 3, iy, ix, iy + Phaser.Math.Between(8, 16));
            }
        }

        // Cold breath fog spots
        for (let i = 0; i < 4; i++) {
            const tx = Phaser.Math.Between(2, MAP.WIDTH - 3);
            const ty = Phaser.Math.Between(2, MAP.HEIGHT - 3);
            if (layout[ty][tx] === 0) {
                const fx = tx * TS + TS / 2;
                const fy = ty * TS + TS / 2;
                const fog = this.add.circle(fx, fy, Phaser.Math.Between(20, 35), 0xddeeff, 0.06).setDepth(3.5);
                this.themeOverlayObjects.push(fog);
                this.tweens.add({
                    targets: fog, alpha: { from: 0.04, to: 0.14 },
                    duration: Phaser.Math.Between(3000, 5000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
                });
            }
        }
    }

    _addPipesOverlay(layout, TS) {
        const g = this.add.graphics().setDepth(1.5);
        this.themeOverlayObjects.push(g);

        const pipeColor = 0x8b5e3c;
        const highlightColor = 0xc49060;

        // Horizontal pipe runs along top (y=1) and bottom (y=11) interior wall edges
        [1, MAP.HEIGHT - 2].forEach(ty => {
            const py = ty * TS + TS / 2;
            for (let tx = 1; tx < MAP.WIDTH - 1; tx++) {
                if (layout[ty][tx] === 0) {
                    const px = tx * TS;
                    g.fillStyle(pipeColor, 0.55);
                    g.fillRect(px, py - 2, TS, 5);
                    g.fillStyle(highlightColor, 0.40);
                    g.fillRect(px, py - 2, TS, 2);
                }
            }
        });

        // Vertical pipe runs along left (x=1) and right (x=15) interior wall edges
        [1, MAP.WIDTH - 2].forEach(tx => {
            const px = tx * TS + TS / 2;
            for (let ty = 1; ty < MAP.HEIGHT - 1; ty++) {
                if (layout[ty][tx] === 0) {
                    const py = ty * TS;
                    g.fillStyle(pipeColor, 0.55);
                    g.fillRect(px - 2, py, 5, TS);
                    g.fillStyle(highlightColor, 0.40);
                    g.fillRect(px - 2, py, 2, TS);
                }
            }
        });

        // Pipe joints at corners
        const jointPositions = [
            { tx: 1, ty: 1 }, { tx: 1, ty: MAP.HEIGHT - 2 },
            { tx: MAP.WIDTH - 2, ty: 1 }, { tx: MAP.WIDTH - 2, ty: MAP.HEIGHT - 2 },
        ];
        jointPositions.forEach(jp => {
            const jx = jp.tx * TS + TS / 2 - 2;
            const jy = jp.ty * TS + TS / 2 - 2;
            g.fillStyle(pipeColor, 0.65);
            g.fillRect(jx - 1, jy - 1, 7, 7);
        });

        // Puddle spots on random floor tiles
        for (let i = 0; i < 5; i++) {
            const tx = Phaser.Math.Between(2, MAP.WIDTH - 3);
            const ty = Phaser.Math.Between(2, MAP.HEIGHT - 3);
            if (layout[ty][tx] === 0) {
                const px = tx * TS + Phaser.Math.Between(10, TS - 10);
                const py = ty * TS + Phaser.Math.Between(10, TS - 10);
                g.fillStyle(0x4488cc, Phaser.Math.FloatBetween(0.15, 0.25));
                g.fillCircle(px, py, Phaser.Math.Between(8, 14));
            }
        }

        // Drip sources on ceiling edge — add small blue dots that spawn particles
        for (let i = 0; i < 3; i++) {
            const tx = Phaser.Math.Between(3, MAP.WIDTH - 4);
            if (layout[1][tx] === 0) {
                const dx = tx * TS + Phaser.Math.Between(8, TS - 8);
                const dy = 1 * TS + 4;
                g.fillStyle(0x4488cc, 0.5);
                g.fillCircle(dx, dy, 3);
            }
        }
    }

    _addHazardOverlay(layout, TS) {
        const g = this.add.graphics().setDepth(1.5);
        this.themeOverlayObjects.push(g);

        // Hazard stripes on floor tiles adjacent to equipment
        const equipPositions = [];
        for (let ty = 1; ty < MAP.HEIGHT - 1; ty++) {
            for (let tx = 1; tx < MAP.WIDTH - 1; tx++) {
                if (layout[ty][tx] === 2) equipPositions.push({ tx, ty });
            }
        }

        equipPositions.forEach(ep => {
            const neighbors = [
                { tx: ep.tx - 1, ty: ep.ty }, { tx: ep.tx + 1, ty: ep.ty },
                { tx: ep.tx, ty: ep.ty - 1 }, { tx: ep.tx, ty: ep.ty + 1 },
            ];
            neighbors.forEach(n => {
                if (n.tx >= 0 && n.tx < MAP.WIDTH && n.ty >= 0 && n.ty < MAP.HEIGHT && layout[n.ty][n.tx] === 0) {
                    const hx = n.tx * TS;
                    const hy = n.ty * TS;
                    // Yellow/black hazard stripes
                    for (let s = 0; s < TS; s += 8) {
                        g.fillStyle(0xfbbf24, 0.25);
                        g.fillRect(hx + s, hy + TS - 4, 4, 4);
                        g.fillStyle(0x111111, 0.20);
                        g.fillRect(hx + s + 4, hy + TS - 4, 4, 4);
                    }
                }
            });
        });

        // Spark flashes near random equipment
        const sparkEquip = equipPositions.slice(0, 3);
        sparkEquip.forEach(ep => {
            const sx = ep.tx * TS + Phaser.Math.Between(8, TS - 8);
            const sy = ep.ty * TS + Phaser.Math.Between(4, TS - 4);
            const spark = this.add.circle(sx, sy, 4, 0xfbbf24, 0.7).setDepth(3.5);
            this.themeOverlayObjects.push(spark);
            this.tweens.add({
                targets: spark, alpha: { from: 0.8, to: 0 }, scaleX: { from: 2.5, to: 0.3 }, scaleY: { from: 2.5, to: 0.3 },
                duration: 150, delay: Phaser.Math.Between(0, 1500), yoyo: true, repeat: -1,
                hold: Phaser.Math.Between(800, 2500),
            });
            // Add a glow halo around spark
            const glow = this.add.circle(sx, sy, 12, 0xfbbf24, 0).setDepth(3.4);
            this.themeOverlayObjects.push(glow);
            this.tweens.add({
                targets: glow, alpha: { from: 0.3, to: 0 }, scaleX: { from: 1.5, to: 0.5 }, scaleY: { from: 1.5, to: 0.5 },
                duration: 150, delay: Phaser.Math.Between(0, 1500), yoyo: true, repeat: -1,
                hold: Phaser.Math.Between(800, 2500),
            });
        });
    }

    _addLedsOverlay(layout, TS) {
        const g = this.add.graphics().setDepth(1.5);
        this.themeOverlayObjects.push(g);

        // Small colored dots on wall tiles suggesting server LEDs
        let ledCount = 0;
        for (let ty = 1; ty < MAP.HEIGHT - 1 && ledCount < 12; ty++) {
            for (let tx = 1; tx < MAP.WIDTH - 1 && ledCount < 12; tx++) {
                if (layout[ty][tx] !== 1) continue;
                // Only interior walls
                const isEdge = tx === 0 || tx === MAP.WIDTH - 1 || ty === 0 || ty === MAP.HEIGHT - 1;
                if (isEdge) continue;
                if (Math.random() < 0.5) continue;

                const lx = tx * TS + Phaser.Math.Between(6, TS - 6);
                const ly = ty * TS + Phaser.Math.Between(6, TS - 6);
                const ledColor = Math.random() < 0.6 ? 0x4ade80 : 0x3b82f6;
                g.fillStyle(ledColor, 0.45);
                g.fillCircle(lx, ly, 2);
                ledCount++;
            }
        }

        // Blinking LED dots
        for (let i = 0; i < 4; i++) {
            const tx = Phaser.Math.Between(2, MAP.WIDTH - 3);
            const ty = Phaser.Math.Between(1, MAP.HEIGHT - 2);
            if (layout[ty][tx] === 1) {
                const bx = tx * TS + Phaser.Math.Between(6, TS - 6);
                const by = ty * TS + Phaser.Math.Between(6, TS - 6);
                const blinkColor = Math.random() < 0.5 ? 0x4ade80 : 0x3b82f6;
                const led = this.add.circle(bx, by, 3, blinkColor, 0.7).setDepth(1.5);
                this.themeOverlayObjects.push(led);
                this.tweens.add({
                    targets: led, alpha: { from: 0.7, to: 0.1 },
                    duration: Phaser.Math.Between(400, 1200), yoyo: true, repeat: -1,
                    delay: Phaser.Math.Between(0, 800),
                });
            }
        }
    }

    _addBeaconOverlay(_layout, TS) {
        // Red blinking beacon in top-right corner
        const bx = (MAP.WIDTH - 2) * TS + TS / 2;
        const by = 1 * TS + TS / 2;
        const beacon = this.add.circle(bx, by, 6, 0xff0000, 0).setDepth(3.5);
        this.themeOverlayObjects.push(beacon);
        this.tweens.add({
            targets: beacon, alpha: { from: 0, to: 0.9 },
            duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
        // Beacon glow halo
        const beaconGlow = this.add.circle(bx, by, 18, 0xff0000, 0).setDepth(3.4);
        this.themeOverlayObjects.push(beaconGlow);
        this.tweens.add({
            targets: beaconGlow, alpha: { from: 0, to: 0.25 },
            duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
    }

    _addShaftOverlay(layout, TS) {
        const g = this.add.graphics().setDepth(1.5);
        this.themeOverlayObjects.push(g);

        // Dark rectangles suggesting shaft openings in open areas between wall columns
        for (let ty = 3; ty < MAP.HEIGHT - 3; ty++) {
            for (let tx = 3; tx < MAP.WIDTH - 3; tx++) {
                if (layout[ty][tx] !== 0) continue;
                // Check if surrounded by open floor (large open area)
                const hasWallNearby = layout[ty - 1][tx] === 1 || layout[ty + 1][tx] === 1 ||
                    layout[ty][tx - 1] === 1 || layout[ty][tx + 1] === 1;
                if (!hasWallNearby && Math.random() < 0.08) {
                    const sx = tx * TS + 8;
                    const sy = ty * TS + 4;
                    g.fillStyle(0x0a0a10, 0.35);
                    g.fillRect(sx, sy, TS - 16, TS - 8);
                    // Cable lines
                    g.lineStyle(1, 0x3a3a48, 0.30);
                    g.lineBetween(sx + 6, sy, sx + 6, sy + TS - 8);
                    g.lineBetween(sx + TS - 22, sy, sx + TS - 22, sy + TS - 8);
                }
            }
        }

        // Cable lines on wall-column areas
        for (let ty = 2; ty < MAP.HEIGHT - 2; ty++) {
            for (let tx = 2; tx < MAP.WIDTH - 2; tx++) {
                if (layout[ty][tx] === 1 && Math.random() < 0.15) {
                    const cx = tx * TS + TS / 2;
                    const cy1 = ty * TS;
                    const cy2 = ty * TS + TS;
                    g.lineStyle(1, 0x4e4e5c, 0.25);
                    g.lineBetween(cx - 4, cy1, cx - 4, cy2);
                    g.lineBetween(cx + 4, cy1, cx + 4, cy2);
                }
            }
        }
    }

    _addCautionOverlay(layout, TS) {
        const g = this.add.graphics().setDepth(1.5);
        this.themeOverlayObjects.push(g);

        // Caution tape lines across openings near wall gaps
        for (let ty = 1; ty < MAP.HEIGHT - 1; ty++) {
            for (let tx = 1; tx < MAP.WIDTH - 1; tx++) {
                if (layout[ty][tx] !== 0) continue;
                // Check for wall gap pattern (wall on two sides, open in between)
                const wallLeft = tx > 1 && layout[ty][tx - 1] === 1;
                const wallRight = tx < MAP.WIDTH - 2 && layout[ty][tx + 1] === 1;
                const wallAbove = ty > 1 && layout[ty - 1][tx] === 1;
                const wallBelow = ty < MAP.HEIGHT - 2 && layout[ty + 1][tx] === 1;

                if ((wallLeft && wallRight) || (wallAbove && wallBelow)) {
                    if (Math.random() < 0.3) {
                        const cx = tx * TS;
                        const cy = ty * TS + TS / 2;
                        // Yellow tape with black dashes
                        for (let s = 0; s < TS; s += 6) {
                            g.fillStyle(0xfbbf24, 0.35);
                            g.fillRect(cx + s, cy - 1, 4, 3);
                            g.fillStyle(0x111111, 0.25);
                            g.fillRect(cx + s + 4, cy - 1, 2, 2);
                        }
                    }
                }
            }
        }
    }

    addAmbientDetails(layout, theme) {
        const g = this.add.graphics();
        g.setDepth(2);
        this.ambientGfx = g;

        const scuffColor = theme.scuffColor || 0x0a0f1a;
        const cobwebColor = theme.cobwebColor || 0x2a3a55;

        // Scuff marks on random floor tiles
        for (let i = 0; i < 12; i++) {
            const tx = Phaser.Math.Between(2, MAP.WIDTH - 3);
            const ty = Phaser.Math.Between(2, MAP.HEIGHT - 3);
            if (layout[ty][tx] === 0) {
                const x = tx * TILE_SIZE + Phaser.Math.Between(4, TILE_SIZE - 4);
                const y = ty * TILE_SIZE + Phaser.Math.Between(4, TILE_SIZE - 4);
                g.fillStyle(scuffColor, 0.15);
                g.fillRect(x, y, Phaser.Math.Between(3, 8), 1);
            }
        }

        // Cobweb-like marks in wall corners
        for (let ty = 1; ty < MAP.HEIGHT - 1; ty++) {
            for (let tx = 1; tx < MAP.WIDTH - 1; tx++) {
                if (layout[ty][tx] !== 0) continue;
                const wallAbove = layout[ty - 1][tx] === 1;
                const wallLeft = layout[ty][tx - 1] === 1;
                const wallRight = layout[ty][tx + 1] === 1;

                if (wallAbove && wallLeft && Math.random() < 0.3) {
                    const bx = tx * TILE_SIZE;
                    const by = ty * TILE_SIZE;
                    g.lineStyle(1, cobwebColor, 0.15);
                    g.lineBetween(bx, by, bx + 8, by + 3);
                    g.lineBetween(bx, by, bx + 3, by + 8);
                    g.lineBetween(bx + 2, by, bx + 6, by + 6);
                }
                if (wallAbove && wallRight && Math.random() < 0.3) {
                    const bx = (tx + 1) * TILE_SIZE;
                    const by = ty * TILE_SIZE;
                    g.lineStyle(1, cobwebColor, 0.15);
                    g.lineBetween(bx, by, bx - 8, by + 3);
                    g.lineBetween(bx, by, bx - 3, by + 8);
                }
            }
        }

        // Vignette overlay
        this.addVignette(theme);
    }

    addVignette(theme) {
        const w = GAME_WIDTH;
        const h = GAME_HEIGHT;
        const vg = this.add.graphics();
        vg.setDepth(45);
        this.vignetteGfx = vg;
        vg.setScrollFactor(0);

        const atmo = theme && theme.atmosphere;
        const color = atmo ? atmo.vignetteColor : 0x000000;
        const baseAlpha = atmo ? atmo.vignetteAlpha : 0.12;

        // Top and bottom edge darkening — extended range for visibility
        for (let i = 0; i < 40; i++) {
            const a = baseAlpha * (1 - i / 40);
            vg.fillStyle(color, a);
            vg.fillRect(0, i, w, 1);
            vg.fillRect(0, h - 1 - i, w, 1);
        }
        // Left and right edge darkening
        for (let i = 0; i < 30; i++) {
            const a = (baseAlpha * 0.7) * (1 - i / 30);
            vg.fillStyle(color, a);
            vg.fillRect(i, 0, 1, h);
            vg.fillRect(w - 1 - i, 0, 1, h);
        }
    }

    addColorWash(theme) {
        const atmo = theme && theme.atmosphere;
        if (!atmo) return;

        const mapW = MAP.WIDTH * TILE_SIZE;
        const mapH = MAP.HEIGHT * TILE_SIZE;

        this.colorWashRect = this.add.rectangle(
            mapW / 2, mapH / 2, mapW, mapH,
            atmo.colorWash, atmo.colorWashAlpha
        ).setDepth(3);

        this.mapObjects.push(this.colorWashRect);
    }

    createAtmosphereParticles(theme) {
        const atmo = theme && theme.atmosphere;
        if (!atmo || !atmo.particles) return;

        this.atmosphereParticles = [];
        const p = atmo.particles;
        const mapW = MAP.WIDTH * TILE_SIZE;
        const mapH = MAP.HEIGHT * TILE_SIZE;

        for (let i = 0; i < p.count; i++) {
            const color = (i % 2 === 0 && p.colorAlt) ? p.colorAlt : p.color;
            const size = Phaser.Math.FloatBetween(p.sizeMin, p.sizeMax);
            const alpha = Phaser.Math.FloatBetween(p.alphaMin, p.alphaMax);

            let particle;

            if (p.type === 'datastream') {
                // Vertical line for data streams
                particle = this.add.rectangle(
                    Phaser.Math.Between(TILE_SIZE, mapW - TILE_SIZE),
                    Phaser.Math.Between(0, mapH),
                    1, Phaser.Math.Between(8, 20),
                    color, alpha
                );
            } else if (p.type === 'streak') {
                // Horizontal line for wind
                particle = this.add.rectangle(
                    Phaser.Math.Between(0, mapW),
                    Phaser.Math.Between(TILE_SIZE, mapH - TILE_SIZE),
                    Phaser.Math.Between(12, 30), 1,
                    color, alpha
                );
            } else if (p.type === 'confetti') {
                // Multi-color small rectangles for confetti
                const confettiColors = [0xfbbf24, 0xa855f7, 0x4ade80, 0x3b82f6, 0xf87171];
                const cc = confettiColors[i % confettiColors.length];
                particle = this.add.rectangle(
                    Phaser.Math.Between(TILE_SIZE, mapW - TILE_SIZE),
                    Phaser.Math.Between(0, mapH),
                    Phaser.Math.Between(2, 4), Phaser.Math.Between(2, 4),
                    cc, alpha
                );
            } else {
                // Circle for dust, snow, sparks, drips, smoke
                particle = this.add.circle(
                    Phaser.Math.Between(TILE_SIZE, mapW - TILE_SIZE),
                    Phaser.Math.Between(TILE_SIZE, mapH - TILE_SIZE),
                    size, color, alpha
                );
            }

            particle.setDepth(4);
            this.atmosphereParticles.push(particle);
            this.animateParticle(particle, p, mapW, mapH);
        }
    }

    animateParticle(particle, config, mapW, mapH) {
        const speed = config.speed === 'fast' ? [2000, 5000] :
                      config.speed === 'medium' ? [5000, 10000] :
                      [8000, 16000]; // slow

        const duration = Phaser.Math.Between(speed[0], speed[1]);
        let tweenConfig;

        switch (config.direction) {
            case 'fall': // snow, drips, oil — top to bottom
                tweenConfig = {
                    targets: particle,
                    y: mapH + 10,
                    x: particle.x + Phaser.Math.Between(-20, 20),
                    alpha: 0,
                    duration,
                    delay: Phaser.Math.Between(0, 3000),
                    onComplete: () => {
                        if (!particle.active) return;
                        particle.setPosition(
                            Phaser.Math.Between(TILE_SIZE, mapW - TILE_SIZE), -10
                        );
                        particle.setAlpha(Phaser.Math.FloatBetween(config.alphaMin, config.alphaMax));
                        this.animateParticle(particle, config, mapW, mapH);
                    },
                };
                break;

            case 'rise': // smoke — bottom to top
                tweenConfig = {
                    targets: particle,
                    y: -10,
                    x: particle.x + Phaser.Math.Between(-30, 30),
                    alpha: 0,
                    duration,
                    delay: Phaser.Math.Between(0, 3000),
                    onComplete: () => {
                        if (!particle.active) return;
                        particle.setPosition(
                            Phaser.Math.Between(TILE_SIZE, mapW - TILE_SIZE), mapH + 10
                        );
                        particle.setAlpha(Phaser.Math.FloatBetween(config.alphaMin, config.alphaMax));
                        this.animateParticle(particle, config, mapW, mapH);
                    },
                };
                break;

            case 'streak': // wind — left to right
                tweenConfig = {
                    targets: particle,
                    x: mapW + 30,
                    alpha: 0,
                    duration: Phaser.Math.Between(1500, 4000),
                    delay: Phaser.Math.Between(0, 4000),
                    onComplete: () => {
                        if (!particle.active) return;
                        particle.setPosition(
                            -30, Phaser.Math.Between(TILE_SIZE, mapH - TILE_SIZE)
                        );
                        particle.setAlpha(Phaser.Math.FloatBetween(config.alphaMin, config.alphaMax));
                        this.animateParticle(particle, config, mapW, mapH);
                    },
                };
                break;

            case 'sparkle': // sparks — flash in place then reposition
                tweenConfig = {
                    targets: particle,
                    alpha: { from: config.alphaMax, to: 0 },
                    scaleX: { from: 1.5, to: 0.3 },
                    scaleY: { from: 1.5, to: 0.3 },
                    duration: Phaser.Math.Between(150, 500),
                    delay: Phaser.Math.Between(100, 2000),
                    onComplete: () => {
                        if (!particle.active) return;
                        particle.setPosition(
                            Phaser.Math.Between(TILE_SIZE, mapW - TILE_SIZE),
                            Phaser.Math.Between(TILE_SIZE, mapH - TILE_SIZE)
                        );
                        particle.setAlpha(config.alphaMax);
                        particle.setScale(1);
                        this.animateParticle(particle, config, mapW, mapH);
                    },
                };
                break;

            default: // 'float' — gentle drift upward with horizontal sway
                tweenConfig = {
                    targets: particle,
                    y: particle.y - Phaser.Math.Between(60, 150),
                    x: particle.x + Phaser.Math.Between(-40, 40),
                    alpha: 0,
                    duration,
                    delay: Phaser.Math.Between(0, 4000),
                    onComplete: () => {
                        if (!particle.active) return;
                        particle.setPosition(
                            Phaser.Math.Between(TILE_SIZE, mapW - TILE_SIZE),
                            Phaser.Math.Between(TILE_SIZE, mapH - TILE_SIZE)
                        );
                        particle.setAlpha(Phaser.Math.FloatBetween(config.alphaMin, config.alphaMax));
                        this.animateParticle(particle, config, mapW, mapH);
                    },
                };
        }

        this.tweens.add(tweenConfig);
    }

    setupTouchControls() {
        this.touchActive = false;
        this.touchTarget = { x: 0, y: 0 };

        // Subtle direction line from player toward touch point
        this.touchLine = this.add.graphics().setDepth(5);

        this.input.on('pointerdown', (pointer) => {
            this.touchTarget.x = pointer.worldX;
            this.touchTarget.y = pointer.worldY;
            this.touchActive = true;
        });

        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                this.touchTarget.x = pointer.worldX;
                this.touchTarget.y = pointer.worldY;
                this.touchActive = true;
            }
        });

        this.input.on('pointerup', () => {
            this.touchActive = false;
            this.touchLine.clear();
        });
    }

    createUI() {
        const uiDepth = 50;
        const barH = 68;
        const font = 'monospace';

        // --- Glassmorphism top bar ---
        // Dark base layer
        this.add.rectangle(GAME_WIDTH / 2, barH / 2, GAME_WIDTH, barH, 0x0a0f1e, 0.82).setDepth(uiDepth).setScrollFactor(0);
        // Subtle light overlay for frosted feel
        this.add.rectangle(GAME_WIDTH / 2, barH / 2, GAME_WIDTH, barH, 0xffffff, 0.03).setDepth(uiDepth).setScrollFactor(0);
        // Top highlight edge
        this.add.rectangle(GAME_WIDTH / 2, 0.5, GAME_WIDTH, 1, 0xffffff, 0.06).setDepth(uiDepth).setScrollFactor(0);
        // Bottom border glow
        this.add.rectangle(GAME_WIDTH / 2, barH, GAME_WIDTH, 1, 0x4ade80, 0.25).setDepth(uiDepth).setScrollFactor(0);
        // Subtle green glow beneath border
        this.add.rectangle(GAME_WIDTH / 2, barH + 1, GAME_WIDTH, 3, 0x4ade80, 0.06).setDepth(uiDepth).setScrollFactor(0);

        // --- Row 1 (y=6): LEVEL, LOGO+TIMER, SCORE ---

        // Level text
        this.waveText = this.add.text(14, 6, 'LEVEL 1', {
            fontSize: '17px',
            fontFamily: font,
            fontStyle: 'bold',
            color: '#4ade80',
        }).setDepth(uiDepth + 1).setScrollFactor(0);

        // BuildOps logo above timer (centered)
        this.add.image(GAME_WIDTH / 2, 10, 'logo_small')
            .setOrigin(0.5).setAlpha(0.45).setDepth(uiDepth + 1).setScrollFactor(0);

        // Timer (below logo)
        this.timerText = this.add.text(GAME_WIDTH / 2, 22, '00:30', {
            fontSize: '20px',
            fontFamily: font,
            fontStyle: 'bold',
            color: CSS_COLORS.FOCUS_GREEN,
        }).setOrigin(0.5, 0).setDepth(uiDepth + 1).setScrollFactor(0);

        // Score
        this.scoreText = this.add.text(GAME_WIDTH - 14, 6, 'SCORE: 0', {
            fontSize: '17px',
            fontFamily: font,
            fontStyle: 'bold',
            color: '#ffffff',
        }).setOrigin(1, 0).setDepth(uiDepth + 1).setScrollFactor(0);

        // --- Row 2 (y=44): HEALTH, MARGIN, STREAK, JOBS ---

        // Health display (left)
        this.healthText = this.add.text(14, 44, '', {
            fontSize: '16px',
            fontFamily: font,
            color: '#f87171',
        }).setDepth(uiDepth + 1).setScrollFactor(0);
        this.updateHealthDisplay();

        // Margin display (center-left)
        this.marginText = this.add.text(GAME_WIDTH * 0.32, 46, 'MARGIN: 100%', {
            fontSize: '14px',
            fontFamily: font,
            fontStyle: 'bold',
            color: '#4ade80',
        }).setOrigin(0.5, 0).setDepth(uiDepth + 1).setScrollFactor(0);

        // Streak display (center-right)
        this.streakText = this.add.text(GAME_WIDTH * 0.58, 46, 'STREAK: 0', {
            fontSize: '14px',
            fontFamily: font,
            fontStyle: 'bold',
            color: '#facc15',
        }).setOrigin(0.5, 0).setDepth(uiDepth + 1).setScrollFactor(0);

        // Jobs remaining (right)
        this.jobsText = this.add.text(GAME_WIDTH - 14, 46, '', {
            fontSize: '14px',
            fontFamily: font,
            color: 'rgba(255,255,255,0.6)',
        }).setOrigin(1, 0).setDepth(uiDepth + 1).setScrollFactor(0);

        // Active power-ups display (below the bar)
        this.powerUpDisplay = this.add.text(14, barH + 5, '', {
            fontSize: '12px',
            fontFamily: font,
            color: '#4ade80',
        }).setDepth(uiDepth + 1).setScrollFactor(0);

        // BuildOps logo — bottom-right branding
        this.add.image(GAME_WIDTH - 20, GAME_HEIGHT - 16, 'logo_small')
            .setOrigin(0.5).setAlpha(0.2).setDepth(uiDepth).setScrollFactor(0);

        // Score popup group
        this.scorePopups = [];

        // Pause button (HUD — top-left, right of LEVEL text)
        this.pauseBtnBg = this.add.rectangle(120, 15, 32, 24, 0xffffff, 0.1)
            .setDepth(uiDepth).setScrollFactor(0);
        this.pauseBtn = this.add.text(120, 4, '||', {
            fontSize: '18px',
            fontFamily: font,
            fontStyle: 'bold',
            color: '#cbd5e1',
            letterSpacing: 2,
        }).setOrigin(0.5, 0).setDepth(uiDepth + 1).setScrollFactor(0);
        this.pauseBtn.setInteractive({ useHandCursor: true });
        this.pauseBtn.on('pointerdown', () => this.togglePause());
        this.pauseBtn.on('pointerover', () => this.pauseBtn.setColor('#ffffff'));
        this.pauseBtn.on('pointerout', () => this.pauseBtn.setColor('#cbd5e1'));
    }

    updateHealthDisplay() {
        const hearts = '♥'.repeat(this.player.health) + '♡'.repeat(this.player.maxHealth - this.player.health);
        this.healthText.setText(hearts);
    }

    // === WAVE MANAGEMENT ===

    startWave() {
        this.wave++;
        this.waveActive = true;
        // Update music tempo for escalating tension
        audio._gameLevel = this.wave - 1;

        // Calculate wave parameters
        const waveTimeSec = Math.max(
            WAVE_CONFIG.MIN_TIME,
            WAVE_CONFIG.BASE_TIME - (this.wave - 1) * WAVE_CONFIG.TIME_REDUCTION_PER_WAVE
        );
        this.waveTime = waveTimeSec * 1000;
        this.waveTimeTotal = this.waveTime;

        // Clear all active power-ups between levels
        this.clearActivePowerUps();

        // Clear previous
        this.clearEntities();

        // Check for theme change — rebuild map if needed
        const newTheme = getLevelTheme(this.wave);
        if (!this.currentTheme || newTheme.id !== this.currentTheme.id) {
            this.destroyMap();
            this.createMap(newTheme);
            // Re-add player collider with new solid group
            if (this.player && this.player.sprite) {
                this.physics.add.collider(this.player.sprite, this.solidGroup);
            }
        }

        // Spawn jobs
        const jobCount = WAVE_CONFIG.BASE_JOBS + Math.floor((this.wave - 1) * WAVE_CONFIG.JOBS_PER_WAVE);
        for (let i = 0; i < jobCount; i++) {
            this.spawnJob();
        }

        // Spawn obstacles
        const obsCount = WAVE_CONFIG.BASE_OBSTACLES + Math.floor((this.wave - 1) * WAVE_CONFIG.OBSTACLES_PER_WAVE);
        const types = Object.values(OBSTACLE_TYPES);
        for (let i = 0; i < obsCount; i++) {
            const type = types[i % types.length];
            this.time.delayedCall(i * 500, () => {
                if (this.waveActive && !this.gameOver) this.spawnObstacle(type);
            });
        }

        // Update UI
        this.waveText.setText(`LEVEL ${this.wave}`);

        // Level announcement with theme subtitle
        const subtitle = (this.currentTheme && this.currentTheme.subtitle) || (this.wave > 1 ? 'DISPATCH!' : 'COLLECT JOBS!');
        this.showAnnouncement(`LEVEL ${this.wave}`, subtitle);
        audio.sfxLevelStart();
    }

    showAnnouncement(title, subtitle) {
        this.showingAnnouncement = true;
        if (this.pauseBtn) this.pauseBtn.setVisible(false);
        if (this.pauseBtnBg) this.pauseBtnBg.setVisible(false);
        const w = GAME_WIDTH;
        const h = GAME_HEIGHT;

        const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6).setDepth(100);

        // 3D pixel block title
        const { img: t1, glowImg: g1 } = addPixelHeader(this, w / 2, h / 2 - 15, title, {
            px: 5, depth: 2, theme: PIXEL_THEMES.LEVEL, glow: true, depthLayer: 101,
        });

        const t2 = this.add.text(w / 2, h / 2 + 28, subtitle, {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#facc15',
        }).setOrigin(0.5).setDepth(101);

        this.time.delayedCall(1200, () => {
            this.showingAnnouncement = false;
            if (this.pauseBtn) this.pauseBtn.setVisible(true);
            if (this.pauseBtnBg) this.pauseBtnBg.setVisible(true);
            bg.destroy();
            t1.destroy();
            if (g1) g1.destroy();
            t2.destroy();
        });
    }

    endWave() {
        this.waveActive = false;
        const waveBonus = this.scoreManager.completeWave(this.currentWave);
        audio.sfxWaveComplete();

        // Show wave completion bonus as floating text
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2 + 40;
        const bonusText = this.add.text(cx, cy, `+${waveBonus.toLocaleString()} LEVEL BONUS`, {
            fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#4ade80', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(100);
        this.tweens.add({
            targets: bonusText, y: cy - 30, alpha: 0,
            duration: 1500, ease: 'Power2', onComplete: () => bonusText.destroy(),
        });

        // Update score display
        if (this.scoreText) this.scoreText.setText(`Score: ${this.scoreManager.score.toLocaleString()}`);

        // Brief pause then next wave
        this.showAnnouncement('LEVEL COMPLETE!', `Score: ${this.scoreManager.score.toLocaleString()}`);
        this.time.delayedCall(2000, () => {
            if (!this.gameOver) this.startWave();
        });
    }

    // === SPAWNING ===

    getRandomPlayPosition() {
        const margin = 60;
        // Try up to 20 times to find a position not on a wall or equipment tile
        for (let attempt = 0; attempt < 20; attempt++) {
            const x = Phaser.Math.Between(this.playBounds.x + margin, this.playBounds.right - margin);
            const y = Phaser.Math.Between(this.playBounds.y + margin, this.playBounds.bottom - margin);
            const tx = Math.floor(x / TILE_SIZE);
            const ty = Math.floor(y / TILE_SIZE);
            if (this.layout && this.layout[ty] && this.layout[ty][tx] === 0) {
                return { x, y };
            }
        }
        // Fallback
        return {
            x: Phaser.Math.Between(this.playBounds.x + margin, this.playBounds.right - margin),
            y: Phaser.Math.Between(this.playBounds.y + margin, this.playBounds.bottom - margin),
        };
    }

    spawnJob() {
        const pos = this.getRandomPlayPosition();
        const value = WAVE_CONFIG.JOB_BASE_VALUE + Math.floor(Math.random() * WAVE_CONFIG.JOB_VALUE_PER_WAVE * this.wave);
        // Round to nearest 100
        const roundedValue = Math.round(value / 100) * 100;
        const job = new Job(this, pos.x, pos.y, roundedValue);
        this.jobs.push(job);

        // Setup overlap with player
        this.physics.add.overlap(this.player.sprite, job.sprite, () => {
            if (!this.player.isCollectingJob && !job.collected) {
                // Proposal Magnet (magnetic) auto-collects
                if (this.activePowerUps.proposal) {
                    this.collectJob(job);
                } else {
                    this.player.startCollectingJob(job);
                }
            }
        });

        this.updateJobsDisplay();
    }

    spawnObstacle(type) {
        // Spawn at edge of play area
        const side = Phaser.Math.Between(0, 3);
        let x, y;
        const b = this.playBounds;

        switch (side) {
            case 0: x = b.x + 30; y = Phaser.Math.Between(b.y + 30, b.bottom - 30); break;
            case 1: x = b.right - 30; y = Phaser.Math.Between(b.y + 30, b.bottom - 30); break;
            case 2: x = Phaser.Math.Between(b.x + 30, b.right - 30); y = b.y + 30; break;
            case 3: x = Phaser.Math.Between(b.x + 30, b.right - 30); y = b.bottom - 30; break;
        }

        // Stationary obstacles spawn anywhere
        if (type.behavior === 'stationary') {
            const pos = this.getRandomPlayPosition();
            x = pos.x;
            y = pos.y;
        }

        const obstacle = new Obstacle(this, x, y, type, this.player);
        this.obstacles.push(obstacle);

        // Collision with player
        this.physics.add.overlap(this.player.sprite, obstacle.sprite, () => {
            this.handlePlayerHit(obstacle);
        });
    }

    spawnPowerUp() {
        const pos = this.getRandomPlayPosition();
        // OpsAI is weighted 3x more likely (important power-up & marketing feature)
        const weightedList = [...POWERUP_LIST];
        const opsai = POWERUP_LIST.find(p => p.id === 'opsai');
        if (opsai) { weightedList.push(opsai, opsai); }
        const data = Phaser.Utils.Array.GetRandom(weightedList);
        const powerup = new PowerUp(this, pos.x, pos.y, data);
        this.powerups.push(powerup);
        audio.sfxPowerUpSpawn();

        // Overlap
        this.physics.add.overlap(this.player.sprite, powerup.sprite, () => {
            this.collectPowerUp(powerup);
        });
    }

    // === COLLECTION & COLLISION ===

    collectJob(job) {
        if (job.collected || !this.waveActive) return;

        const prevStreak = this.scoreManager.streak;
        const result = this.scoreManager.completeJob(
            job.value,
            this.waveTime,
            this.waveTimeTotal
        );

        // Audio
        audio.sfxJobPickup();
        if (this.scoreManager.streak > prevStreak && this.scoreManager.streak >= 3) {
            audio.sfxStreakBonus();
        }

        // Score popup
        this.showScorePopup(job.sprite.x, job.sprite.y - 20, `+${result.points}`);

        job.clearDispatchMarker(); // clean up any dispatch decorations before destroying
        job.collect();
        this.jobs = this.jobs.filter(j => j !== job);

        // Update UI
        this.scoreText.setText(`SCORE: ${this.scoreManager.score.toLocaleString()}`);
        this.streakText.setText(`STREAK: ${this.scoreManager.streak}`);
        this.marginText.setText(`MARGIN: ${Math.round(this.scoreManager.profitMargin)}%`);
        this.updateJobsDisplay();

        // Check if all jobs collected
        if (this.jobs.length === 0) {
            this.endWave();
        }
    }

    collectPowerUp(powerup) {
        const data = powerup.data;
        powerup.collect();
        this.powerups = this.powerups.filter(p => p !== powerup);

        // Unique SFX per power-up type
        if (data.id === 'opsai') {
            audio.sfxOpsAI();
            this.triggerOpsAIEffect();
        } else if (data.id === 'dispatch') {
            audio.sfxSmartDispatch();
        } else if (data.id === 'workflow') {
            // Workflow has its own SFX in applyPowerUp
        } else {
            audio.sfxPowerUp();
        }

        this.showScorePopup(
            this.player.sprite.x,
            this.player.sprite.y - 30,
            data.name,
            data.color
        );

        // Apply effect
        this.applyPowerUp(data);
    }

    applyPowerUp(data) {
        const duration = data.duration * this.player.buffMultiplier;

        switch (data.id) {
            case 'opsai':
                this.scoreManager.opsAIActive = true;
                this.activePowerUps.opsai = true;
                // Store base speed on first activation, apply 2x
                if (!this.player._baseSpeed) {
                    this.player._baseSpeed = this.player.moveSpeed;
                }
                this.player.moveSpeed = this.player._baseSpeed * 2;
                // Warning before expiration
                if (duration > 2500) {
                    this.time.delayedCall(duration - 2000, () => {
                        if (this.activePowerUps.opsai) audio.sfxPowerUpWarning();
                    });
                }
                this.time.delayedCall(duration, () => {
                    if (!this.activePowerUps.opsai) return;
                    this.scoreManager.opsAIActive = false;
                    delete this.activePowerUps.opsai;
                    this.player.moveSpeed = this.player._baseSpeed;
                    audio.sfxPowerUpExpire();
                });
                break;

            case 'dispatch':
                this.activePowerUps.dispatch = true;
                this.updateDispatchRankings();
                this.createDispatchArrow();
                if (duration > 2500) {
                    this.time.delayedCall(duration - 2000, () => {
                        if (this.activePowerUps.dispatch) audio.sfxPowerUpWarning();
                    });
                }
                this.time.delayedCall(duration, () => {
                    if (!this.activePowerUps.dispatch) return;
                    delete this.activePowerUps.dispatch;
                    this.cleanupDispatch();
                    audio.sfxPowerUpExpire();
                });
                break;

            case 'proposal':
                this.activePowerUps.proposal = true;
                if (duration > 2500) {
                    this.time.delayedCall(duration - 2000, () => {
                        if (this.activePowerUps.proposal) audio.sfxPowerUpWarning();
                    });
                }
                this.time.delayedCall(duration, () => {
                    if (!this.activePowerUps.proposal) return;
                    delete this.activePowerUps.proposal;
                    audio.sfxPowerUpExpire();
                });
                break;

            case 'reporting':
                this.activePowerUps.reporting = true;
                this.showObstacleWarnings();
                if (duration > 2500) {
                    this.time.delayedCall(duration - 2000, () => {
                        if (this.activePowerUps.reporting) audio.sfxPowerUpWarning();
                    });
                }
                this.time.delayedCall(duration, () => {
                    if (!this.activePowerUps.reporting) return;
                    delete this.activePowerUps.reporting;
                    audio.sfxPowerUpExpire();
                });
                break;

            case 'portal':
                this.player.shieldActive = true;
                this.activePowerUps.portal = true;
                this.player.sprite.setTint(0x00CCFF);
                audio.sfxShieldOn();
                if (duration > 2500) {
                    this.time.delayedCall(duration - 2000, () => {
                        if (this.activePowerUps.portal) audio.sfxPowerUpWarning();
                    });
                }
                this.time.delayedCall(duration, () => {
                    if (!this.activePowerUps.portal) return;
                    this.player.shieldActive = false;
                    delete this.activePowerUps.portal;
                    if (this.player.sprite && this.player.sprite.active) {
                        this.player.sprite.clearTint();
                    }
                    audio.sfxShieldOff();
                });
                break;

            case 'workflow':
                // Instant: clear all obstacles
                audio.sfxWorkflowClear();
                this.obstacles.forEach(o => o.destroy());
                this.obstacles = [];
                // Flash effect
                this.cameras.main.flash(300, 25, 217, 121);
                break;
        }
    }

    showObstacleWarnings() {
        // Show warning markers where new obstacles will spawn
        for (let i = 0; i < 3; i++) {
            const pos = this.getRandomPlayPosition();
            const warning = this.add.circle(pos.x, pos.y, 30, 0xFF0000, 0.2).setDepth(3);
            const warningText = this.add.text(pos.x, pos.y, '!', {
                fontSize: '18px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#f87171',
            }).setOrigin(0.5).setDepth(3);

            this.tweens.add({
                targets: [warning],
                alpha: 0.05,
                duration: 500,
                yoyo: true,
                repeat: -1,
            });

            this.time.delayedCall(8000, () => {
                warning.destroy();
                warningText.destroy();
            });
        }
    }

    triggerOpsAIEffect() {
        const w = GAME_WIDTH;
        const h = GAME_HEIGHT;

        // Big white flash
        this.cameras.main.flash(500, 255, 255, 255, false, (cam, progress) => {
            if (progress >= 1 && this.opsaiOverlay) {
                // Flash done
            }
        });

        // Screen shake
        this.cameras.main.shake(300, 0.008);

        // Glowing green border that persists while OpsAI is active
        this.opsaiBorderGfx = this.add.graphics().setDepth(95);
        const drawBorder = (alpha) => {
            this.opsaiBorderGfx.clear();
            // Inner glow
            this.opsaiBorderGfx.lineStyle(4, 0x4ade80, alpha * 0.6);
            this.opsaiBorderGfx.strokeRect(2, 2, w - 4, h - 4);
            // Outer glow
            this.opsaiBorderGfx.lineStyle(8, 0x4ade80, alpha * 0.2);
            this.opsaiBorderGfx.strokeRect(0, 0, w, h);
        };
        drawBorder(1);

        // Pulse the border
        const borderPulse = this.tweens.addCounter({
            from: 0.4,
            to: 1,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                if (this.opsaiBorderGfx) drawBorder(tween.getValue());
            },
        });

        // Green tint overlay
        this.opsaiOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x4ade80, 0.06).setDepth(94);
        this.tweens.add({
            targets: this.opsaiOverlay,
            alpha: { from: 0.12, to: 0.03 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Big announcement
        const opsText = this.add.text(w / 2, h / 2 - 10, 'OpsAI SUPERCHARGE!', {
            fontSize: '28px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#4ade80',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5).setDepth(101).setAlpha(0);

        const opsSubText = this.add.text(w / 2, h / 2 + 24, '2X SPEED  •  2X POINTS', {
            fontSize: '14px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(101).setAlpha(0);

        // Animate text in and out
        this.tweens.add({
            targets: [opsText, opsSubText],
            alpha: { from: 0, to: 1 },
            scaleX: { from: 0.5, to: 1 },
            scaleY: { from: 0.5, to: 1 },
            duration: 300,
            ease: 'Back.easeOut',
        });

        this.time.delayedCall(1500, () => {
            this.tweens.add({
                targets: [opsText, opsSubText],
                alpha: 0,
                y: '-=20',
                duration: 400,
                onComplete: () => { opsText.destroy(); opsSubText.destroy(); },
            });
        });

        // Remove border/overlay when OpsAI expires (use same duration as power-up)
        const duration = POWERUP_LIST.find(p => p.id === 'opsai').duration * this.player.buffMultiplier;
        this.time.delayedCall(duration, () => {
            if (borderPulse) borderPulse.stop();
            if (this.opsaiBorderGfx) {
                this.tweens.add({
                    targets: this.opsaiBorderGfx,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        if (this.opsaiBorderGfx) { this.opsaiBorderGfx.destroy(); this.opsaiBorderGfx = null; }
                    },
                });
            }
            if (this.opsaiOverlay) {
                this.tweens.add({
                    targets: this.opsaiOverlay,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        if (this.opsaiOverlay) { this.opsaiOverlay.destroy(); this.opsaiOverlay = null; }
                    },
                });
            }
        });
    }

    // === SMART DISPATCH SYSTEM ===

    updateDispatchRankings() {
        if (!this.activePowerUps.dispatch || !this.player || !this.player.sprite) return;

        const px = this.player.sprite.x;
        const py = this.player.sprite.y;

        // Calculate efficiency score for each job: value / distance
        const ranked = this.jobs
            .filter(j => j.sprite && j.sprite.active && !j.collected)
            .map(j => {
                const dist = Phaser.Math.Distance.Between(px, py, j.sprite.x, j.sprite.y);
                const efficiency = j.value / Math.max(dist, 20); // avoid division by near-zero
                return { job: j, efficiency, dist };
            })
            .sort((a, b) => b.efficiency - a.efficiency);

        // Apply tiered highlighting
        ranked.forEach((entry, i) => {
            const tier = i === 0 ? 'best' : i <= 2 ? 'top' : 'normal';
            entry.job.setHighlighted(true, tier);
            entry.job.showDispatchMarker(i, entry.efficiency);
        });

        // Track best job for arrow
        this._dispatchBestJob = ranked.length > 0 ? ranked[0].job : null;
    }

    createDispatchArrow() {
        // Directional arrow graphic pointing to best job
        this.dispatchArrowGfx = this.add.graphics().setDepth(92);
        this.dispatchDistText = this.add.text(0, 0, '', {
            fontSize: '10px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(92);
    }

    updateDispatchArrow() {
        if (!this.dispatchArrowGfx || !this._dispatchBestJob || !this.player.sprite) return;

        const best = this._dispatchBestJob;
        if (!best.sprite || !best.sprite.active) return;

        const px = this.player.sprite.x;
        const py = this.player.sprite.y;
        const bx = best.sprite.x;
        const by = best.sprite.y;

        const angle = Math.atan2(by - py, bx - px);
        const dist = Phaser.Math.Distance.Between(px, py, bx, by);

        // Draw arrow from player edge pointing to best job
        const arrowDist = Math.min(45, dist - 20); // don't overlap the job
        if (arrowDist < 15) {
            this.dispatchArrowGfx.clear();
            this.dispatchDistText.setVisible(false);
            return;
        }

        const startX = px + Math.cos(angle) * 22;
        const startY = py + Math.sin(angle) * 22;
        const endX = px + Math.cos(angle) * arrowDist;
        const endY = py + Math.sin(angle) * arrowDist;

        this.dispatchArrowGfx.clear();

        // Arrow line (gold, glowing)
        this.dispatchArrowGfx.lineStyle(3, 0xFFD700, 0.8);
        this.dispatchArrowGfx.beginPath();
        this.dispatchArrowGfx.moveTo(startX, startY);
        this.dispatchArrowGfx.lineTo(endX, endY);
        this.dispatchArrowGfx.strokePath();

        // Arrowhead
        const headLen = 8;
        const a1 = angle + Math.PI * 0.8;
        const a2 = angle - Math.PI * 0.8;
        this.dispatchArrowGfx.fillStyle(0xFFD700, 0.9);
        this.dispatchArrowGfx.fillTriangle(
            endX, endY,
            endX + Math.cos(a1) * headLen, endY + Math.sin(a1) * headLen,
            endX + Math.cos(a2) * headLen, endY + Math.sin(a2) * headLen,
        );

        // Outer glow
        this.dispatchArrowGfx.lineStyle(6, 0xFFD700, 0.15);
        this.dispatchArrowGfx.beginPath();
        this.dispatchArrowGfx.moveTo(startX, startY);
        this.dispatchArrowGfx.lineTo(endX, endY);
        this.dispatchArrowGfx.strokePath();

        // Distance text near arrow tip
        const labelX = px + Math.cos(angle) * (arrowDist + 14);
        const labelY = py + Math.sin(angle) * (arrowDist + 14);
        this.dispatchDistText.setPosition(labelX, labelY);
        this.dispatchDistText.setText(`$${best.value}`);
        this.dispatchDistText.setVisible(true);
    }

    cleanupDispatch() {
        // Remove all job highlights and markers
        this.jobs.forEach(j => {
            j.setHighlighted(false);
            j.clearDispatchMarker();
        });
        // Remove arrow
        if (this.dispatchArrowGfx) { this.dispatchArrowGfx.destroy(); this.dispatchArrowGfx = null; }
        if (this.dispatchDistText) { this.dispatchDistText.destroy(); this.dispatchDistText = null; }
        this._dispatchBestJob = null;
    }

    handlePlayerHit(obstacle) {
        if (this.player.invincible || this.player.shieldActive || !this.waveActive) return;

        const isDead = this.player.takeDamage();
        this.scoreManager.takeHit();
        audio.sfxHit();
        this.updateHealthDisplay();
        this.marginText.setText(`MARGIN: ${Math.round(this.scoreManager.profitMargin)}%`);

        // Streak lost sound (only if we had a streak)
        if (this.scoreManager.streak > 0) {
            audio.sfxStreakLost();
        }
        this.streakText.setText('STREAK: 0');

        // Low health warning heartbeat
        if (this.player.health <= 2 && this.player.health > 0) {
            audio.sfxLowHealth();
        }

        // Cancel any collection in progress
        this.player.cancelCollection();

        if (isDead) {
            this.triggerGameOver();
        }
    }

    showScorePopup(x, y, text, color) {
        const popup = this.add.text(x, y, text, {
            fontSize: '13px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: color ? `#${color.toString(16).padStart(6, '0')}` : '#4ade80',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: popup,
            y: y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => popup.destroy(),
        });
    }

    updateJobsDisplay() {
        const remaining = this.jobs.length;
        this.jobsText.setText(`Jobs: ${remaining} remaining`);
    }

    // === GAME OVER ===

    triggerGameOver() {
        this.gameOver = true;
        if (this.pauseBtn) this.pauseBtn.setVisible(false);
        if (this.pauseBtnBg) this.pauseBtnBg.setVisible(false);
        this.waveActive = false;
        audio.stopMusic();
        audio.sfxGameOver();

        // Freeze everything
        this.physics.world.pause();

        // Dramatic pause then transition
        this.time.delayedCall(1000, () => {
            this.scene.start('GameOver', {
                summary: this.scoreManager.getSummary(),
                character: this.characterData,
            });
        });
    }

    // === PAUSE MENU ===

    togglePause() {
        if (this.gameOver || this.showingAnnouncement) return;

        if (this.paused) {
            this.hidePauseMenu();
        } else {
            this.showPauseMenu();
        }
    }

    showPauseMenu() {
        this.paused = true;

        // Cancel any in-progress job collection
        if (this.player.isCollectingJob) {
            this.player.cancelCollection();
        }

        // Freeze physics world (tweens are driven by scene.time, so keep time running until entrance tween completes)
        this.physics.world.pause();

        audio.sfxMenuSelect();

        // Track all pause UI elements for cleanup
        this.pauseElements = [];

        const w = GAME_WIDTH;
        const h = GAME_HEIGHT;
        const depth = 200;
        const font = 'monospace';

        // --- Background overlay ---
        const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0)
            .setDepth(depth).setScrollFactor(0);
        this.pauseElements.push(overlay);

        // Camera blur (graceful fallback if postFX unavailable)
        this.pauseBlur = null;
        try {
            if (this.cameras.main.postFX) {
                this.pauseBlur = this.cameras.main.postFX.addBlur(0, 0, 0, 1);
            }
        } catch (e) {
            // Canvas renderer — skip blur
        }

        // Fade in overlay
        this.tweens.add({
            targets: overlay,
            alpha: 0.65,
            duration: 200,
            ease: 'Cubic.easeOut',
        });

        // --- Card container elements ---
        const cardW = 260;
        const cardH = 290;
        const cardX = w / 2;
        const cardY = h / 2;

        // Card glow (behind card)
        const glow = this.add.rectangle(cardX, cardY, cardW + 12, cardH + 12, 0x4ade80, 0.08)
            .setDepth(depth + 1).setScrollFactor(0);
        this.pauseElements.push(glow);

        // Card background
        const cardBg = this.add.rectangle(cardX, cardY, cardW, cardH, 0x0a0f1e, 0.95)
            .setDepth(depth + 1).setScrollFactor(0);
        this.pauseElements.push(cardBg);

        // Card border (Graphics — alpha only, no scale animation)
        const border = this.add.graphics().setDepth(depth + 1).setScrollFactor(0);
        border.lineStyle(2, 0x4ade80, 1);
        border.strokeRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH);
        this.pauseElements.push(border);

        // --- Card contents ---
        const contentDepth = depth + 2;
        const topY = cardY - cardH / 2 + 30;

        // "PAUSED" title
        const { img: pausedTitle, glowImg: pausedGlow } = addPixelHeader(
            this, cardX, topY, 'PAUSED', {
                px: 4, depth: 2, theme: PIXEL_THEMES.LEVEL, glow: true, depthLayer: contentDepth,
            }
        );
        pausedTitle.setScrollFactor(0);
        if (pausedGlow) pausedGlow.setScrollFactor(0);
        this.pauseElements.push(pausedTitle);
        if (pausedGlow) this.pauseElements.push(pausedGlow);

        // Resume button glow
        const resumeY = topY + 60;
        const resumeGlow = this.add.rectangle(cardX, resumeY, cardW - 36, 38, 0x4ade80, 0.12)
            .setDepth(contentDepth).setScrollFactor(0);
        this.pauseElements.push(resumeGlow);

        // Resume button
        const resumeBg = this.add.rectangle(cardX, resumeY, cardW - 40, 34, 0x4ade80, 1)
            .setDepth(contentDepth).setScrollFactor(0);
        this.pauseElements.push(resumeBg);

        const resumeText = this.add.text(cardX, resumeY, '> RESUME', {
            fontSize: '14px', fontFamily: font, fontStyle: 'bold', color: '#070b14',
        }).setOrigin(0.5).setDepth(contentDepth + 1).setScrollFactor(0);
        this.pauseElements.push(resumeText);

        resumeBg.setInteractive({ useHandCursor: true });
        resumeBg.on('pointerdown', () => this.togglePause());
        resumeBg.on('pointerover', () => resumeText.setColor('#ffffff'));
        resumeBg.on('pointerout', () => resumeText.setColor('#070b14'));

        // "ESC to resume" hint
        const hintText = this.add.text(cardX, resumeY + 24, 'ESC to resume', {
            fontSize: '11px', fontFamily: font, color: '#cbd5e1',
        }).setOrigin(0.5).setDepth(contentDepth).setScrollFactor(0);
        this.pauseElements.push(hintText);

        // --- Audio toggles ---
        const toggleY = resumeY + 58;
        const toggleW = (cardW - 48) / 2;
        const toggleGap = 8;
        const leftX = cardX - toggleW / 2 - toggleGap / 2;
        const rightX = cardX + toggleW / 2 + toggleGap / 2;

        // Music toggle
        const musicOn = !audio.musicMuted;
        const musicBorder = this.add.graphics().setDepth(contentDepth).setScrollFactor(0);
        musicBorder.lineStyle(1, musicOn ? 0x4ade80 : 0xffffff, musicOn ? 0.3 : 0.15);
        musicBorder.strokeRect(leftX - toggleW / 2, toggleY - 14, toggleW, 28);
        this.pauseElements.push(musicBorder);

        const musicText = this.add.text(leftX, toggleY, musicOn ? '♪ ON' : '♪ OFF', {
            fontSize: '12px', fontFamily: font, color: musicOn ? '#4ade80' : '#6b7280',
        }).setOrigin(0.5).setDepth(contentDepth + 1).setScrollFactor(0);
        this.pauseElements.push(musicText);

        const musicHit = this.add.rectangle(leftX, toggleY, toggleW, 28, 0x000000, 0)
            .setDepth(contentDepth + 2).setScrollFactor(0).setInteractive({ useHandCursor: true });
        this.pauseElements.push(musicHit);

        musicHit.on('pointerdown', () => {
            const muted = audio.toggleMusic();
            musicText.setText(muted ? '♪ OFF' : '♪ ON');
            musicText.setColor(muted ? '#6b7280' : '#4ade80');
            musicBorder.clear();
            musicBorder.lineStyle(1, muted ? 0xffffff : 0x4ade80, muted ? 0.15 : 0.3);
            musicBorder.strokeRect(leftX - toggleW / 2, toggleY - 14, toggleW, 28);
            if (!audio.sfxMuted) audio.sfxMenuHover();
        });
        musicHit.on('pointerover', () => musicText.setColor('#ffffff'));
        musicHit.on('pointerout', () => musicText.setColor(audio.musicMuted ? '#6b7280' : '#4ade80'));

        // SFX toggle
        const sfxOn = !audio.sfxMuted;
        const sfxBorder = this.add.graphics().setDepth(contentDepth).setScrollFactor(0);
        sfxBorder.lineStyle(1, sfxOn ? 0x4ade80 : 0xffffff, sfxOn ? 0.3 : 0.15);
        sfxBorder.strokeRect(rightX - toggleW / 2, toggleY - 14, toggleW, 28);
        this.pauseElements.push(sfxBorder);

        const sfxText = this.add.text(rightX, toggleY, sfxOn ? 'SFX ON' : 'SFX OFF', {
            fontSize: '12px', fontFamily: font, color: sfxOn ? '#4ade80' : '#6b7280',
        }).setOrigin(0.5).setDepth(contentDepth + 1).setScrollFactor(0);
        this.pauseElements.push(sfxText);

        const sfxHit = this.add.rectangle(rightX, toggleY, toggleW, 28, 0x000000, 0)
            .setDepth(contentDepth + 2).setScrollFactor(0).setInteractive({ useHandCursor: true });
        this.pauseElements.push(sfxHit);

        sfxHit.on('pointerdown', () => {
            const muted = audio.toggleSfx();
            sfxText.setText(muted ? 'SFX OFF' : 'SFX ON');
            sfxText.setColor(muted ? '#6b7280' : '#4ade80');
            sfxBorder.clear();
            sfxBorder.lineStyle(1, muted ? 0xffffff : 0x4ade80, muted ? 0.15 : 0.3);
            sfxBorder.strokeRect(rightX - toggleW / 2, toggleY - 14, toggleW, 28);
            if (!muted) audio.sfxMenuHover();
        });
        sfxHit.on('pointerover', () => sfxText.setColor('#ffffff'));
        sfxHit.on('pointerout', () => sfxText.setColor(audio.sfxMuted ? '#6b7280' : '#4ade80'));

        // --- Quit button ---
        const quitY = toggleY + 46;

        const quitBorder = this.add.graphics().setDepth(contentDepth).setScrollFactor(0);
        quitBorder.lineStyle(1, 0xf87171, 0.3);
        quitBorder.strokeRect(cardX - (cardW - 40) / 2, quitY - 17, cardW - 40, 34);
        this.pauseElements.push(quitBorder);

        const quitText = this.add.text(cardX, quitY, 'QUIT TO MENU', {
            fontSize: '13px', fontFamily: font, fontStyle: 'bold', color: '#f87171',
        }).setOrigin(0.5).setDepth(contentDepth + 1).setScrollFactor(0);
        this.pauseElements.push(quitText);

        const quitHit = this.add.rectangle(cardX, quitY, cardW - 40, 34, 0x000000, 0)
            .setDepth(contentDepth + 2).setScrollFactor(0).setInteractive({ useHandCursor: true });
        this.pauseElements.push(quitHit);

        quitHit.on('pointerdown', () => {
            audio.sfxMenuSelect();
            audio.stopMusic();
            if (this.pauseBlur) {
                try { this.cameras.main.postFX.remove(this.pauseBlur); } catch (e) {}
                this.pauseBlur = null;
            }
            this.scene.start('Menu');
        });
        quitHit.on('pointerover', () => quitText.setColor('#ffffff'));
        quitHit.on('pointerout', () => quitText.setColor('#f87171'));

        // --- Entrance animation ---
        // Scalable elements (Images, Rectangles, Text — NOT Graphics objects)
        const scalableElements = [glow, cardBg, resumeGlow, resumeBg, resumeText,
            hintText, musicText, musicHit, sfxText, sfxHit, quitText, quitHit, pausedTitle];
        if (pausedGlow) scalableElements.push(pausedGlow);

        // Alpha-only elements (Graphics objects — don't support setScale reliably)
        const graphicsElements = [border, musicBorder, sfxBorder, quitBorder];

        // Start scalable elements small and invisible
        scalableElements.forEach(el => {
            el.setScale(0.85);
            el.setAlpha(0);
        });
        // Start graphics invisible
        graphicsElements.forEach(el => el.setAlpha(0));

        // Scale + fade in for scalable elements; pause scene time only after animation completes
        this.tweens.add({
            targets: scalableElements,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 300,
            delay: 50,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.paused = true;
            },
        });
        // Fade in only for graphics
        this.tweens.add({
            targets: graphicsElements,
            alpha: 1,
            duration: 300,
            delay: 50,
            ease: 'Cubic.easeOut',
        });

        // Store refs for exit animation
        this.pauseOverlay = overlay;
        this.pauseScalableElements = scalableElements;
        this.pauseGraphicsElements = graphicsElements;
    }

    hidePauseMenu() {
        this.paused = false;

        audio.sfxMenuHover();

        // Unfreeze time so exit tweens can run
        this.time.paused = false;

        const exitDuration = 150;

        // Scale out scalable elements
        if (this.pauseScalableElements) {
            this.tweens.add({
                targets: this.pauseScalableElements,
                scaleX: 0.85,
                scaleY: 0.85,
                alpha: 0,
                duration: exitDuration,
                ease: 'Cubic.easeIn',
            });
        }

        // Fade out graphics elements
        if (this.pauseGraphicsElements) {
            this.tweens.add({
                targets: this.pauseGraphicsElements,
                alpha: 0,
                duration: exitDuration,
                ease: 'Cubic.easeIn',
            });
        }

        // Overlay fades out
        if (this.pauseOverlay) {
            this.tweens.add({
                targets: this.pauseOverlay,
                alpha: 0,
                duration: exitDuration,
                ease: 'Cubic.easeIn',
            });
        }

        // Clear refs immediately to prevent rapid-toggle double-processing
        const elementsToDestroy = this.pauseElements || [];
        this.pauseElements = [];
        this.pauseOverlay = null;
        this.pauseScalableElements = null;
        this.pauseGraphicsElements = null;

        // After exit animation, clean up and resume
        setTimeout(() => {
            elementsToDestroy.forEach(el => {
                if (el && el.destroy) {
                    try { el.destroy(); } catch (e) {}
                }
            });

            // Remove camera blur
            if (this.pauseBlur) {
                try { this.cameras.main.postFX.remove(this.pauseBlur); } catch (e) {}
                this.pauseBlur = null;
            }

            // Resume physics
            this.physics.world.resume();
        }, exitDuration + 20);
    }

    // === CLEANUP ===

    clearEntities() {
        this.jobs.forEach(j => j.destroy());
        this.jobs = [];
        this.obstacles.forEach(o => o.destroy());
        this.obstacles = [];
        this.powerups.forEach(p => p.destroy());
        this.powerups = [];
    }

    clearActivePowerUps() {
        // Reset OpsAI
        if (this.activePowerUps.opsai) {
            this.scoreManager.opsAIActive = false;
            if (this.player._baseSpeed) {
                this.player.moveSpeed = this.player._baseSpeed;
            }
        }
        // Reset Dispatch
        if (this.activePowerUps.dispatch) {
            this.cleanupDispatch();
        }
        // Reset Portal shield
        if (this.activePowerUps.portal) {
            this.player.shieldActive = false;
            if (this.player.sprite && this.player.sprite.active) {
                this.player.sprite.clearTint();
            }
        }
        // Clear OpsAI screen overlay if present
        if (this.opsaiOverlay) {
            this.opsaiOverlay.destroy();
            this.opsaiOverlay = null;
        }
        if (this.opsaiBorderGfx) {
            this.opsaiBorderGfx.destroy();
            this.opsaiBorderGfx = null;
        }
        // Reset all
        this.activePowerUps = {};
    }

    // === MAGNETIC PULL (Proposal Magnet) ===

    applyMagneticPull(delta) {
        if (!this.activePowerUps.proposal) return;
        // BUFF stat enhances magnetic pull range and force
        const buffBonus = this.player.stats.BUFF * 0.15; // 15% per BUFF point
        const pullRadius = 180 * (1 + buffBonus);
        const pullForce = 300 * (1 + buffBonus);
        const dt = delta / 1000; // convert ms to seconds

        this.jobs.forEach(job => {
            if (!job.sprite || !job.sprite.active) return;
            const dist = Phaser.Math.Distance.Between(
                this.player.sprite.x, this.player.sprite.y,
                job.sprite.x, job.sprite.y
            );
            if (dist < pullRadius) {
                const angle = Phaser.Math.Angle.Between(
                    job.sprite.x, job.sprite.y,
                    this.player.sprite.x, this.player.sprite.y
                );
                job.sprite.x += Math.cos(angle) * pullForce * dt;
                job.sprite.y += Math.sin(angle) * pullForce * dt;
            }
        });
    }

    // === UPDATE ===

    update(time, delta) {
        if (this.gameOver || this.paused || !this.player) return;

        // Start first wave once update loop is running
        if (this.waveStartPending) {
            this.waveStartPending = false;
            this.startWave();
        }

        // Build input state without mutating Phaser key objects
        const input = { left: false, right: false, up: false, down: false };

        // Keyboard: cursors + WASD
        input.left = this.cursors.left.isDown || this.wasd.left.isDown;
        input.right = this.cursors.right.isDown || this.wasd.right.isDown;
        input.up = this.cursors.up.isDown || this.wasd.up.isDown;
        input.down = this.cursors.down.isDown || this.wasd.down.isDown;

        // Touch controls — tap/drag to move toward target
        if (this.touchActive && this.player) {
            const dx = this.touchTarget.x - this.player.sprite.x;
            const dy = this.touchTarget.y - this.player.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 10) {
                if (dx < -10) input.left = true;
                if (dx > 10) input.right = true;
                if (dy < -10) input.up = true;
                if (dy > 10) input.down = true;
            }

            // Draw direction line from player to touch target
            this.touchLine.clear();
            if (dist > 10) {
                this.touchLine.lineStyle(2, 0x4ade80, 0.4);
                this.touchLine.lineBetween(
                    this.player.sprite.x, this.player.sprite.y,
                    this.touchTarget.x, this.touchTarget.y
                );
                // Small circle at target
                this.touchLine.fillStyle(0x4ade80, 0.3);
                this.touchLine.fillCircle(this.touchTarget.x, this.touchTarget.y, 6);
            }
        }

        // Player update
        this.player.update(input, time, delta);

        // Check job collection completion
        if (this.player.isCollectingJob) {
            const completedJob = this.player.updateCollection(delta);
            if (completedJob) {
                this.collectJob(completedJob);
            }
        }

        // Obstacles update
        this.obstacles.forEach(o => o.update(time, delta));

        // Magnetic pull
        this.applyMagneticPull(delta);

        // Smart Dispatch — update rankings and arrow every frame
        if (this.activePowerUps.dispatch) {
            this.updateDispatchRankings();
            this.updateDispatchArrow();
        }

        // Wave timer
        if (this.waveActive) {
            this.waveTime -= delta;
            const secs = Math.max(0, Math.ceil(this.waveTime / 1000));
            const mins = Math.floor(secs / 60);
            const s = secs % 60;
            this.timerText.setText(`${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`);

            // Timer color
            if (secs <= 5) {
                this.timerText.setColor('#f87171');
            } else if (secs <= 10) {
                this.timerText.setColor('#facc15');
            } else {
                this.timerText.setColor('#19D979');
            }

            // Margin decay
            this.scoreManager.profitMargin = Math.max(
                0,
                this.scoreManager.profitMargin - SCORING.MARGIN_LOSS_PER_SECOND * (delta / 1000)
            );
            this.marginText.setText(`MARGIN: ${Math.round(this.scoreManager.profitMargin)}%`);

            // Time's up
            if (this.waveTime <= 0) {
                this.endWave();
            }

            // Spawn power-ups periodically
            if (time - this.lastPowerUpSpawn > WAVE_CONFIG.POWERUP_SPAWN_INTERVAL) {
                this.spawnPowerUp();
                this.lastPowerUpSpawn = time;
            }

            // Spawn extra obstacles over time for pressure (scales with wave)
            if (this.wave > 1 && Math.random() < 0.001 * this.wave) {
                const types = Object.values(OBSTACLE_TYPES);
                this.spawnObstacle(Phaser.Utils.Array.GetRandom(types));
            }
        }

        // Active power-ups display
        const activeNames = Object.keys(this.activePowerUps);
        if (activeNames.length > 0) {
            this.powerUpDisplay.setText('ACTIVE: ' + activeNames.join(' | ').toUpperCase());
        } else {
            this.powerUpDisplay.setText('');
        }
    }
}
