// BuildQuest: Player Entity

import { PLAYER_BASE, COLORS } from '../utils/Constants.js';

export default class Player {
    constructor(scene, x, y, characterData) {
        this.scene = scene;
        this.characterData = characterData;
        this.stats = characterData.stats;

        // Calculate derived stats
        this.moveSpeed = PLAYER_BASE.SPEED + (this.stats.SPD * PLAYER_BASE.SPEED_PER_POINT);
        this.maxHealth = PLAYER_BASE.HEALTH + (this.stats.STR * PLAYER_BASE.HEALTH_PER_POINT);
        this.health = this.maxHealth;
        this.fixTime = Math.max(300, PLAYER_BASE.FIX_TIME - (this.stats.FIX * PLAYER_BASE.FIX_REDUCTION_PER_POINT));
        this.buffMultiplier = 1 + (this.stats.BUFF * PLAYER_BASE.BUFF_MULTIPLIER);

        // Create sprite
        this.createSprite(x, y);

        // State
        this.invincible = false;
        this.invincibleTimer = null;
        this.shieldActive = false;
        this.isCollectingJob = false;
        this.collectingJob = null;
        this.collectProgress = 0;

        // Movement
        this.facing = 'down';
        this.moving = false;

        // SPD afterimage trail
        this.trailTimer = 0;
        this.trailInterval = this.stats.SPD >= 4 ? 60 : this.stats.SPD >= 3 ? 100 : 0; // ms between trail sprites (0 = disabled)
    }

    createSprite(x, y) {
        const key = `player_${this.characterData.id}`;

        // Generate sprite texture if not cached — 60x72 (3x of 20x24 concept art)
        if (!this.scene.textures.exists(key)) {
            const g = this.scene.make.graphics({ add: false });
            this.drawCharacter(g, this.characterData, 0, 0, 3);
            g.generateTexture(key, 60, 72);
            g.destroy();
        }

        this.sprite = this.scene.physics.add.sprite(x, y, key);
        this.sprite.setDisplaySize(36, 42);   // 50% larger than original 24x28
        this.sprite.setSize(27, 27);
        this.sprite.setOffset(16, 27);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(10);
        this.sprite.setData('entity', this);

        // Collection progress bar (hidden by default)
        this.progressBar = this.scene.add.graphics();
        this.progressBar.setDepth(20);
        this.progressBar.setVisible(false);
    }

    /**
     * Draw a detailed pixel-art character at (ox, oy) with pixel scale s.
     * Designs match the concept deck SVGs (20x24 viewBox).
     * s=2 gives 40x48 for the game sprite; larger s for previews.
     */
    drawCharacter(g, data, ox, oy, s) {
        // helper: fill a rectangle in "SVG pixels" mapped to real pixels
        const r = (x, y, w, h, color) => {
            g.fillStyle(color);
            g.fillRect(ox + x * s, oy + y * s, w * s, h * s);
        };

        if (data.id === 'hvac') {
            // --- HVAC TECH (orange) — carrying manifold gauges ---
            // Hard hat
            r(4, 0, 12, 2, 0xfdba74);   // hat highlight
            r(3, 2, 14, 3, 0xf97316);   // hat body
            r(5, 1, 10, 1, 0xf97316);   // hat mid

            // Face
            r(5, 5, 10, 6, 0xfed7aa);

            // Eyes
            r(6, 7, 2, 2, 0x1e293b);
            r(7, 7, 1, 1, 0xffffff);
            r(12, 7, 2, 2, 0x1e293b);
            r(12, 7, 1, 1, 0xffffff);

            // Mouth & chin
            r(8, 9, 4, 1, 0xfca5a5);
            r(8, 10, 4, 1, 0xfbbf24);

            // Shirt (blue work shirt)
            r(4, 11, 12, 6, 0x3b82f6);
            r(5, 14, 10, 3, 0x2563eb);
            // Snowflake/fan patch on chest (HVAC symbol)
            r(9, 12, 1, 1, 0x88ccff);
            r(8, 13, 3, 1, 0x88ccff);
            r(9, 14, 1, 1, 0x88ccff);

            // Arms
            r(2, 11, 2, 6, 0x3b82f6);
            r(16, 11, 2, 6, 0x3b82f6);

            // LEFT HAND: Manifold gauge set
            // Gauge body (circular)
            r(0, 9, 3, 3, 0x2244aa);    // blue gauge body
            r(0, 9, 3, 1, 0x4488cc);    // gauge highlight
            r(1, 10, 1, 1, 0xffffff);   // gauge needle
            // Hoses hanging down
            r(0, 12, 1, 4, 0xdd2222);   // red hose (high pressure)
            r(2, 12, 1, 4, 0x2266cc);   // blue hose (low pressure)
            r(1, 12, 1, 3, 0xfbbf24);   // yellow hose (center)

            // Belt with tool pouches
            r(5, 17, 10, 1, 0x92400e);
            r(9, 17, 2, 1, 0xfbbf24);
            r(3, 16, 2, 2, 0x7a5a2e);   // tool pouch left
            r(15, 16, 2, 2, 0x7a5a2e);  // tool pouch right

            // Pants
            r(5, 18, 4, 4, 0x1e3a5f);
            r(11, 18, 4, 4, 0x1e3a5f);

            // Boots
            r(5, 22, 4, 2, 0x78350f);
            r(11, 22, 4, 2, 0x78350f);

        } else if (data.id === 'electrician') {
            // --- ELECTRICIAN (yellow) — multimeter + wire coil ---
            // Cap
            r(4, 0, 12, 2, 0xfde68a);   // cap highlight
            r(3, 2, 14, 3, 0xfbbf24);   // cap body
            r(5, 1, 10, 1, 0xfbbf24);   // cap mid
            // Lightning bolt badge on cap
            r(9, 1, 1, 1, 0xff6600);
            r(8, 2, 1, 1, 0xff6600);
            r(9, 3, 1, 1, 0xff6600);

            // Face (darker skin)
            r(5, 5, 10, 6, 0xd4a574);

            // Eyes
            r(6, 7, 2, 2, 0x1e293b);
            r(7, 7, 1, 1, 0xffffff);
            r(12, 7, 2, 2, 0x1e293b);
            r(12, 7, 1, 1, 0xffffff);

            // Mouth
            r(8, 9, 4, 1, 0xfca5a5);
            r(8, 10, 4, 1, 0xd4a574);

            // Shirt (green)
            r(4, 11, 12, 6, 0x22c55e);
            r(5, 14, 10, 3, 0x16a34a);
            // Lightning bolt on chest
            r(9, 12, 2, 1, 0xfef08a);
            r(8, 13, 2, 1, 0xfef08a);
            r(9, 14, 2, 1, 0xfef08a);

            // Arms
            r(2, 11, 2, 6, 0x22c55e);
            r(16, 11, 2, 6, 0x22c55e);

            // LEFT HAND: Wire cutters (large, recognizable)
            // Handle (two arms forming a V)
            r(0, 11, 1, 5, 0xcc4444);   // left handle (red)
            r(2, 11, 1, 5, 0xcc4444);   // right handle (red)
            // Handle grips
            r(0, 14, 1, 2, 0xaa2222);   // left grip end
            r(2, 14, 1, 2, 0xaa2222);   // right grip end
            // Pivot/hinge
            r(0, 10, 3, 1, 0x8899aa);   // hinge pin
            r(1, 10, 1, 1, 0xaabbcc);   // hinge highlight
            // Blades (cutting jaws at top)
            r(0, 8, 1, 2, 0x6688aa);    // left blade
            r(2, 8, 1, 2, 0x6688aa);    // right blade
            r(0, 8, 3, 1, 0xaabbcc);    // blade tips (shiny)
            // Cut wire sparks
            r(0, 7, 1, 1, 0xfef08a);    // spark
            r(2, 7, 1, 1, 0xfef08a);    // spark

            // RIGHT SHOULDER: Wire coil
            r(17, 8, 3, 2, 0xdd8833);   // coil top
            r(17, 10, 3, 2, 0xcc7722);  // coil middle
            r(18, 12, 2, 2, 0xbb6611);  // coil bottom/hanging
            r(17, 9, 1, 1, 0xeebb55);   // wire highlight

            // Belt
            r(5, 17, 10, 1, 0x92400e);
            r(9, 17, 2, 1, 0xfbbf24);

            // Pants
            r(5, 18, 4, 4, 0x1e3a5f);
            r(11, 18, 4, 4, 0x1e3a5f);

            // Boots
            r(5, 22, 4, 2, 0x78350f);
            r(11, 22, 4, 2, 0x78350f);

        } else if (data.id === 'plumber') {
            // --- PLUMBER (red/purple, tank) — large pipe wrench ---
            // Backwards cap
            r(5, 1, 10, 2, 0xdc2626);
            r(4, 3, 12, 2, 0x991b1b);
            r(14, 4, 4, 2, 0x991b1b);   // brim facing right

            // Face (light skin)
            r(5, 5, 10, 6, 0xfed7aa);

            // Beard
            r(6, 9, 8, 2, 0x92400e);

            // Eyes
            r(6, 7, 2, 2, 0x1e293b);
            r(7, 7, 1, 1, 0xffffff);
            r(12, 7, 2, 2, 0x1e293b);
            r(12, 7, 1, 1, 0xffffff);

            // Mouth (behind beard)
            r(8, 9, 4, 1, 0xfca5a5);

            // Shirt (purple)
            r(4, 11, 12, 6, 0x7c3aed);
            r(5, 13, 10, 1, 0x6d28d9);
            r(5, 15, 10, 1, 0x6d28d9);
            // Water droplet on chest
            r(9, 12, 2, 1, 0x44aaff);
            r(8, 13, 4, 2, 0x3388dd);
            r(9, 15, 2, 1, 0x3388dd);

            // Bigger arms (tank class)
            r(1, 11, 3, 6, 0x7c3aed);
            r(16, 11, 3, 6, 0x7c3aed);

            // RIGHT HAND: Large pipe wrench (exaggerated, iconic)
            // Wrench jaw (open end, angled)
            r(18, 7, 2, 2, 0xaabbcc);   // upper jaw
            r(18, 9, 1, 1, 0x8899aa);   // jaw gap
            r(18, 9, 2, 1, 0xaabbcc);   // lower jaw
            r(17, 8, 1, 2, 0x8899aa);   // jaw hinge
            // Wrench handle (long, angled down)
            r(18, 10, 2, 3, 0xcc4444);  // handle top (red)
            r(19, 13, 1, 5, 0xcc4444);  // handle shaft (red)
            r(19, 18, 1, 2, 0xaa3333);  // handle end (darker)
            // Handle grip texture
            r(18, 11, 1, 1, 0xdd5555);  // grip highlight

            // LEFT HAND: Small pipe section
            r(0, 12, 2, 1, 0x6e7a8a);   // pipe
            r(0, 11, 1, 3, 0x5a6a7a);   // pipe vertical
            r(0, 13, 2, 1, 0x6e7a8a);   // pipe joint

            // Belt
            r(5, 17, 10, 1, 0x92400e);
            r(9, 17, 2, 1, 0xfbbf24);

            // Pants (darker)
            r(5, 18, 4, 4, 0x44403c);
            r(11, 18, 4, 4, 0x44403c);

            // Boots
            r(5, 22, 4, 2, 0x78350f);
            r(11, 22, 4, 2, 0x78350f);

        } else if (data.id === 'pm') {
            // --- PROJECT MANAGER (gray/cyan) ---
            // Hair (no hat)
            r(5, 1, 10, 3, 0x1e293b);   // dark hair
            r(6, 0, 8, 1, 0x1e293b);    // hair top

            // Face
            r(5, 4, 10, 7, 0xfed7aa);

            // Glasses (purple tint)
            r(6, 6, 3, 2, 0xc084fc);    // left lens — approx rgba(192,132,252,.35) on skin
            r(11, 6, 3, 2, 0xc084fc);   // right lens
            r(9, 6, 2, 1, 0x1e293b);    // bridge

            // Eyes behind glasses
            r(7, 7, 1, 1, 0x1e293b);
            r(12, 7, 1, 1, 0x1e293b);

            // Mouth
            r(8, 9, 4, 1, 0xfca5a5);

            // Shirt (gray/white)
            r(4, 11, 12, 6, 0xe5e7eb);
            r(5, 14, 10, 3, 0xd1d5db);
            // Green tie
            r(9, 11, 2, 6, 0x22c55e);

            // Arms
            r(2, 11, 2, 6, 0xe5e7eb);
            r(16, 11, 2, 6, 0xe5e7eb);

            // BuildOps tablet in left hand
            r(0, 11, 2, 3, 0x1e293b);   // tablet body
            r(0, 12, 2, 1, 0x4ade80);   // green screen

            // Belt
            r(5, 17, 10, 1, 0x374151);

            // Pants (dark)
            r(5, 18, 4, 4, 0x374151);
            r(11, 18, 4, 4, 0x374151);

            // Dark shoes
            r(5, 22, 4, 2, 0x1e293b);
            r(11, 22, 4, 2, 0x1e293b);
        }
    }

    update(input, time, delta) {
        if (this.isCollectingJob) {
            this.sprite.setVelocity(0, 0);
            // Collection progress is handled by Game.js update loop
            return;
        }

        // Movement — input is { left, right, up, down } booleans
        let vx = 0;
        let vy = 0;

        if (input.left) vx = -1;
        else if (input.right) vx = 1;
        if (input.up) vy = -1;
        else if (input.down) vy = 1;

        // Normalize diagonal
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.sprite.setVelocity(vx * this.moveSpeed, vy * this.moveSpeed);
        this.moving = vx !== 0 || vy !== 0;

        if (vx < 0) this.facing = 'left';
        else if (vx > 0) this.facing = 'right';
        if (vy < 0) this.facing = 'up';
        else if (vy > 0) this.facing = 'down';

        // Bobbing animation
        if (this.moving) {
            this.sprite.y += Math.sin(time / 100) * 0.3;
        }

        // SPD afterimage trail — faster characters leave ghost sprites
        if (this.moving && this.trailInterval > 0) {
            this.trailTimer += delta;
            if (this.trailTimer >= this.trailInterval) {
                this.trailTimer = 0;
                this.spawnTrailGhost();
            }
        }

        // Invincibility flash
        if (this.invincible) {
            this.sprite.setAlpha(Math.sin(time / 50) > 0 ? 1 : 0.3);
        }

        // Progress bar follows player
        this.progressBar.setPosition(0, 0);
    }

    startCollectingJob(job) {
        this.isCollectingJob = true;
        this.collectingJob = job;
        this.collectProgress = 0;
        this.progressBar.setVisible(true);
    }

    updateCollection(delta) {
        if (!this.collectingJob || !this.collectingJob.sprite || !this.collectingJob.sprite.active) {
            this.cancelCollection();
            return;
        }

        this.collectProgress += delta;
        const progress = Math.min(1, this.collectProgress / this.fixTime);

        // Draw circular progress ring around player
        this.progressBar.clear();
        const cx = this.sprite.x;
        const cy = this.sprite.y;
        const radius = 22;

        // Background ring
        this.progressBar.lineStyle(3, 0x333333, 0.5);
        this.progressBar.beginPath();
        this.progressBar.arc(cx, cy, radius, 0, Math.PI * 2);
        this.progressBar.strokePath();

        // Progress arc (clockwise from top)
        if (progress > 0) {
            const startAngle = -Math.PI / 2; // top
            const endAngle = startAngle + Math.PI * 2 * progress;
            this.progressBar.lineStyle(3, COLORS.FOCUS_GREEN, 0.9);
            this.progressBar.beginPath();
            this.progressBar.arc(cx, cy, radius, startAngle, endAngle);
            this.progressBar.strokePath();
        }

        if (this.collectProgress >= this.fixTime) {
            const job = this.collectingJob;
            this.cancelCollection();
            return job; // signal completion to Game scene
        }

        return null;
    }

    cancelCollection() {
        this.isCollectingJob = false;
        this.collectingJob = null;
        this.collectProgress = 0;
        this.progressBar.setVisible(false);
        this.progressBar.clear();
    }

    spawnTrailGhost() {
        if (!this.sprite || !this.sprite.active) return;
        const ghost = this.scene.add.image(this.sprite.x, this.sprite.y, this.sprite.texture.key);
        ghost.setDisplaySize(this.sprite.displayWidth, this.sprite.displayHeight);
        ghost.setAlpha(0.3);
        ghost.setTint(0x60a5fa); // blue tint for speed trail
        ghost.setDepth(this.sprite.depth - 1);
        this.scene.tweens.add({
            targets: ghost,
            alpha: 0,
            scaleX: ghost.scaleX * 0.7,
            scaleY: ghost.scaleY * 0.7,
            duration: 250,
            onComplete: () => ghost.destroy(),
        });
    }

    takeDamage() {
        if (this.invincible || this.shieldActive) return false;

        this.health--;
        this.invincible = true;

        // Flash for 1.5 seconds
        this.scene.time.delayedCall(1500, () => {
            this.invincible = false;
            if (this.sprite && this.sprite.active) {
                this.sprite.setAlpha(1);
            }
        });

        // Knockback effect — STR reduces shake intensity
        const shakeIntensity = Math.max(0.003, 0.012 - this.stats.STR * 0.0015);
        this.scene.cameras.main.shake(150, shakeIntensity);

        return this.health <= 0;
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.progressBar) this.progressBar.destroy();
    }
}
