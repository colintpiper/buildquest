// BuildQuest: PowerUp Entity

export default class PowerUp {
    constructor(scene, x, y, powerUpData) {
        this.scene = scene;
        this.data = powerUpData;

        this.createSprite(x, y);
    }

    createSprite(x, y) {
        const key = `powerup_${this.data.id}`;

        if (!this.scene.textures.exists(key)) {
            const g = this.scene.make.graphics({ add: false });
            this.drawPowerUp(g, this.data);
            g.generateTexture(key, 36, 36);
            g.destroy();
        }

        this.sprite = this.scene.physics.add.sprite(x, y, key);
        this.sprite.setSize(27, 27);
        this.sprite.setImmovable(true);
        this.sprite.setData('entity', this);
        this.sprite.setDepth(5);

        // Pulse tween
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Glow effect
        this.glow = this.scene.add.circle(x, y, 20, this.data.color, 0.2);
        this.glow.setDepth(4);
        this.scene.tweens.add({
            targets: this.glow,
            alpha: 0.05,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 800,
            yoyo: true,
            repeat: -1,
        });

        // Label
        this.label = this.scene.add.text(x, y + 24, this.data.feature, {
            fontSize: '9px',
            fontFamily: 'monospace',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5).setDepth(5);
    }

    drawPowerUp(g, data) {
        const cx = 18;
        const cy = 18;

        // Outer glow ring
        g.lineStyle(2, data.color, 0.25);
        g.strokeCircle(cx, cy, 16);

        // Background circle with gradient feel
        g.fillStyle(data.color, 0.15);
        g.fillCircle(cx, cy, 15);
        g.fillStyle(data.color, 0.25);
        g.fillCircle(cx, cy, 10);

        // Icon based on type
        g.fillStyle(data.color);

        switch (data.icon) {
            case 'star': // OpsAI — BuildOps chevron with AI sparkle rays
                // Sparkle rays radiating outward (subtle)
                g.fillStyle(data.color, 0.18);
                g.fillRect(cx - 1, cy - 14, 2, 5);   // N
                g.fillRect(cx - 1, cy + 9, 2, 5);    // S
                g.fillRect(cx + 9, cy - 1, 5, 2);    // E
                g.fillRect(cx - 14, cy - 1, 5, 2);   // W
                // Diagonal sparkle dots
                g.fillRect(cx - 10, cy - 10, 2, 2);
                g.fillRect(cx + 8, cy - 10, 2, 2);
                g.fillRect(cx - 10, cy + 8, 2, 2);
                g.fillRect(cx + 8, cy + 8, 2, 2);
                // Central BuildOps chevron (3 stacked)
                const aiGreen = 0x00AF66;
                for (let ai = 0; ai < 3; ai++) {
                    const avy = cy - 5 + ai * 4;
                    g.fillStyle(aiGreen, 0.9 - ai * 0.1);
                    g.beginPath();
                    g.moveTo(cx - 5, avy - 2);
                    g.lineTo(cx, avy + 1);
                    g.lineTo(cx + 5, avy - 2);
                    g.lineTo(cx + 5, avy + 0.5);
                    g.lineTo(cx, avy + 3.5);
                    g.lineTo(cx - 5, avy + 0.5);
                    g.closePath();
                    g.fillPath();
                }
                // Bright core glow
                g.fillStyle(0xFFFFFF, 0.3);
                g.fillCircle(cx, cy, 3);
                break;

            case 'radar': // Smart Dispatch — radar rings with BuildOps chevron center
                // Radar rings
                g.lineStyle(2, data.color, 0.5);
                g.strokeCircle(cx, cy, 7);
                g.lineStyle(1, data.color, 0.25);
                g.strokeCircle(cx, cy, 12);
                // Directional pips (N/S/E/W)
                g.fillStyle(data.color, 0.6);
                g.fillRect(cx - 1, cy - 13, 2, 3);  // N
                g.fillRect(cx - 1, cy + 10, 2, 3);  // S
                g.fillRect(cx + 10, cy - 1, 3, 2);  // E
                g.fillRect(cx - 13, cy - 1, 3, 2);  // W
                // BuildOps chevron at center (3 gold chevrons)
                for (let ri = 0; ri < 3; ri++) {
                    const rvy = cy - 5 + ri * 4;
                    g.fillStyle(data.color, 0.9 - ri * 0.1);
                    g.beginPath();
                    g.moveTo(cx - 4, rvy - 1.5);
                    g.lineTo(cx, rvy + 0.5);
                    g.lineTo(cx + 4, rvy - 1.5);
                    g.lineTo(cx + 4, rvy);
                    g.lineTo(cx, rvy + 2.5);
                    g.lineTo(cx - 4, rvy);
                    g.closePath();
                    g.fillPath();
                }
                break;

            case 'magnet': // Proposal Blaster — orange clipboard with BuildOps chevron
                // Clipboard body (warm orange-brown)
                g.fillStyle(0x3d2008, 0.9);
                g.fillRect(cx - 8, cy - 9, 16, 20);
                // Clipboard clip at top
                g.fillStyle(data.color, 0.8);
                g.fillRect(cx - 5, cy - 12, 10, 4);
                g.fillRect(cx - 3, cy - 13, 6, 2);
                // Screen/paper area tint
                g.fillStyle(data.color, 0.12);
                g.fillRect(cx - 8, cy - 9, 16, 20);
                // Text lines (orange tinted)
                g.fillStyle(data.color, 0.3);
                g.fillRect(cx - 5, cy - 5, 10, 1);
                g.fillRect(cx - 5, cy - 2, 8, 1);
                g.fillRect(cx - 5, cy + 6, 7, 1);
                g.fillRect(cx - 5, cy + 8, 5, 1);
                // BuildOps chevron watermark (centered on clipboard)
                const docGreen = 0x00AF66;
                for (let di = 0; di < 3; di++) {
                    const dvy = cy - 2 + di * 3.5;
                    g.fillStyle(docGreen, 0.7 - di * 0.15);
                    g.beginPath();
                    g.moveTo(cx - 4, dvy - 1.5);
                    g.lineTo(cx, dvy + 0.5);
                    g.lineTo(cx + 4, dvy - 1.5);
                    g.lineTo(cx + 4, dvy);
                    g.lineTo(cx, dvy + 2.5);
                    g.lineTo(cx - 4, dvy);
                    g.closePath();
                    g.fillPath();
                }
                // Clipboard border
                g.lineStyle(1, data.color, 0.5);
                g.strokeRect(cx - 8, cy - 9, 16, 20);
                break;

            case 'eye': // Reporting — crystal ball with BuildOps chevron inside
                // Crystal ball outer glow
                g.fillStyle(data.color, 0.15);
                g.fillCircle(cx, cy, 13);
                // Crystal ball body
                g.fillStyle(data.color, 0.3);
                g.fillCircle(cx, cy, 10);
                // Inner dark area
                g.fillStyle(0x0a0f1a, 0.7);
                g.fillCircle(cx, cy, 8);
                // BuildOps chevron "vision" inside ball
                const ballGreen = 0x00AF66;
                for (let bi = 0; bi < 3; bi++) {
                    const bvy = cy - 4 + bi * 3.5;
                    g.fillStyle(ballGreen, 0.85 - bi * 0.15);
                    g.beginPath();
                    g.moveTo(cx - 4, bvy - 1.5);
                    g.lineTo(cx, bvy + 0.5);
                    g.lineTo(cx + 4, bvy - 1.5);
                    g.lineTo(cx + 4, bvy);
                    g.lineTo(cx, bvy + 2.5);
                    g.lineTo(cx - 4, bvy);
                    g.closePath();
                    g.fillPath();
                }
                // Glass highlight
                g.fillStyle(0xFFFFFF, 0.2);
                g.fillCircle(cx - 3, cy - 4, 3);
                // Base/pedestal
                g.fillStyle(data.color, 0.5);
                g.fillRect(cx - 5, cy + 10, 10, 2);
                g.fillRect(cx - 3, cy + 8, 6, 2);
                break;

            case 'shield': // Customer Portal — shield with BuildOps chevron
                // Shield body
                g.fillRect(cx - 9, cy - 10, 18, 15);
                g.fillRect(cx - 7, cy + 5, 14, 3);
                g.fillRect(cx - 5, cy + 8, 10, 2);
                g.fillRect(cx - 2, cy + 10, 4, 2);
                // Shield border highlight
                g.fillStyle(0xFFFFFF, 0.2);
                g.fillRect(cx - 9, cy - 10, 18, 2);
                g.fillRect(cx - 9, cy - 10, 2, 15);
                // BuildOps chevron emblem on shield
                for (let ci = 0; ci < 3; ci++) {
                    const cvy = cy - 5 + ci * 4;
                    g.fillStyle(0xFFFFFF, 0.7 - ci * 0.1);
                    g.beginPath();
                    g.moveTo(cx - 5, cvy - 2);
                    g.lineTo(cx, cvy + 1);
                    g.lineTo(cx + 5, cvy - 2);
                    g.lineTo(cx + 5, cvy + 0.5);
                    g.lineTo(cx, cvy + 3.5);
                    g.lineTo(cx - 5, cvy + 0.5);
                    g.closePath();
                    g.fillPath();
                }
                break;

            case 'bolt': // Workflow — iPad with BuildOps logo
                g.fillStyle(data.color);
                // iPad body (rounded rectangle)
                g.fillStyle(0x1a1a2e, 0.9);
                g.fillRect(cx - 9, cy - 12, 18, 24);
                // Screen bezel highlight
                g.fillStyle(data.color, 0.15);
                g.fillRect(cx - 9, cy - 12, 18, 24);
                // Screen area (slightly inset)
                g.fillStyle(0x0a0f1a);
                g.fillRect(cx - 7, cy - 9, 14, 18);
                // BuildOps chevron logo on screen (3 mini chevrons)
                const logoGreen = 0x00AF66;
                for (let i = 0; i < 3; i++) {
                    const vy = cy - 5 + i * 4;
                    g.fillStyle(logoGreen, 0.9 - i * 0.1);
                    g.beginPath();
                    g.moveTo(cx - 5, vy - 2);
                    g.lineTo(cx, vy + 1);
                    g.lineTo(cx + 5, vy - 2);
                    g.lineTo(cx + 5, vy + 0.5);
                    g.lineTo(cx, vy + 3.5);
                    g.lineTo(cx - 5, vy + 0.5);
                    g.closePath();
                    g.fillPath();
                }
                // iPad border
                g.lineStyle(1, data.color, 0.5);
                g.strokeRect(cx - 9, cy - 12, 18, 24);
                // Home button / chin indicator
                g.fillStyle(data.color, 0.3);
                g.fillRect(cx - 2, cy + 10, 4, 1);
                break;
        }
    }

    collect() {
        if (this.label) this.label.destroy();
        if (this.glow) this.glow.destroy();
        if (this.sprite) this.sprite.destroy();
    }

    destroy() {
        this.collect();
    }
}
