// BuildQuest: Obstacle Entity

import { OBSTACLE_TYPES } from '../utils/Constants.js';

export default class Obstacle {
    constructor(scene, x, y, type, player) {
        this.scene = scene;
        this.type = type;
        this.player = player;
        this.lifetime = type.lifetime || null;
        this.spawnTime = scene.time.now;
        this.warningShown = false;

        this.createSprite(x, y);

        // Set behavior
        if (type.behavior === 'linear') {
            this.setLinearMovement();
        } else if (type.behavior === 'chase') {
            // Chase is handled in update
        }
    }

    createSprite(x, y) {
        const key = `obstacle_${this.type.id}`;
        const size = this.type.size;
        const texSize = size * 3; // larger texture for warning zone

        if (!this.scene.textures.exists(key)) {
            const g = this.scene.make.graphics({ add: false });
            this.drawObstacle(g, this.type, texSize);
            g.generateTexture(key, texSize, texSize);
            g.destroy();
        }

        this.sprite = this.scene.physics.add.sprite(x, y, key);
        this.sprite.setSize(size, size);
        this.sprite.setData('entity', this);
        this.sprite.setDepth(6);

        if (this.type.behavior === 'stationary') {
            this.sprite.setImmovable(true);
        }
    }

    drawObstacle(g, type, texSize) {
        const s = type.size;
        const cx = texSize / 2;
        const cy = texSize / 2;

        // Warning zone circle underneath all obstacles
        const warningColor = type.id === 'change_order' ? 0xFF3333 :
            type.id === 'callback' ? 0xFF2288 : 0xFFAA00;
        g.fillStyle(warningColor, 0.15);
        g.fillCircle(cx, cy, s * 1.3);
        g.lineStyle(1, warningColor, 0.4);
        g.strokeCircle(cx, cy, s * 1.3);

        if (type.id === 'change_order') {
            // Red clipboard with "CO" text
            // Clipboard body
            g.fillStyle(0xCC2222);
            g.fillRect(cx - s * 0.6, cy - s * 0.7, s * 1.2, s * 1.5);
            // Clipboard clip at top
            g.fillStyle(0x991111);
            g.fillRect(cx - s * 0.3, cy - s * 0.85, s * 0.6, s * 0.25);
            g.fillStyle(0xAA1111);
            g.fillCircle(cx, cy - s * 0.85, s * 0.15);
            // Paper on clipboard
            g.fillStyle(0xFFEEDD);
            g.fillRect(cx - s * 0.45, cy - s * 0.5, s * 0.9, s * 1.1);
            // Lines on paper
            g.fillStyle(0xCCBBAA);
            g.fillRect(cx - s * 0.3, cy - s * 0.3, s * 0.6, 2);
            g.fillRect(cx - s * 0.3, cy - s * 0.1, s * 0.6, 2);
            g.fillRect(cx - s * 0.3, cy + s * 0.1, s * 0.4, 2);
            // "CO" text
            g.fillStyle(0xCC0000);
            g.fillRect(cx - s * 0.25, cy + s * 0.25, s * 0.15, s * 0.25); // C vertical
            g.fillRect(cx - s * 0.25, cy + s * 0.25, s * 0.3, 3); // C top
            g.fillRect(cx - s * 0.25, cy + s * 0.47, s * 0.3, 3); // C bottom
            g.fillStyle(0xCC0000);
            g.fillRect(cx + s * 0.05, cy + s * 0.25, s * 0.3, s * 0.25); // O outline
            g.fillStyle(0xFFEEDD);
            g.fillRect(cx + s * 0.12, cy + s * 0.3, s * 0.16, s * 0.14); // O hole

        } else if (type.id === 'callback') {
            // Phone handset with pulsing rings
            // Ring indicators (outer)
            g.lineStyle(2, 0xFF2266, 0.6);
            g.beginPath();
            g.arc(cx + s * 0.4, cy - s * 0.4, s * 0.6, -Math.PI * 0.8, -Math.PI * 0.2);
            g.strokePath();
            g.lineStyle(2, 0xFF2266, 0.4);
            g.beginPath();
            g.arc(cx + s * 0.4, cy - s * 0.4, s * 0.85, -Math.PI * 0.8, -Math.PI * 0.2);
            g.strokePath();
            // Phone handset body (curved shape)
            g.fillStyle(0x222244);
            g.fillRect(cx - s * 0.5, cy - s * 0.15, s * 1.0, s * 0.55);
            // Earpiece (top bulge)
            g.fillStyle(0x333355);
            g.fillCircle(cx - s * 0.35, cy - s * 0.05, s * 0.3);
            // Mouthpiece (bottom bulge)
            g.fillStyle(0x333355);
            g.fillCircle(cx + s * 0.35, cy + s * 0.25, s * 0.3);
            // Earpiece holes
            g.fillStyle(0x111133);
            g.fillCircle(cx - s * 0.35, cy - s * 0.05, s * 0.12);
            // Mouthpiece holes
            g.fillStyle(0x111133);
            for (let i = 0; i < 3; i++) {
                g.fillCircle(cx + s * 0.25 + i * s * 0.08, cy + s * 0.25, 2);
            }
            // "!" exclamation above
            g.fillStyle(0xFF0000);
            g.fillRect(cx - 2, cy - s * 0.8, 4, s * 0.35);
            g.fillRect(cx - 2, cy - s * 0.38, 4, 4);

        } else if (type.id === 'parts_delay') {
            // Shipping crate/box with clock
            // Box body
            g.fillStyle(0x8B7355);
            g.fillRect(cx - s * 0.75, cy - s * 0.65, s * 1.5, s * 1.4);
            // Box darker edges
            g.fillStyle(0x7A6244);
            g.fillRect(cx - s * 0.75, cy - s * 0.65, s * 1.5, 3);
            g.fillRect(cx - s * 0.75, cy + s * 0.72, s * 1.5, 3);
            g.fillRect(cx - s * 0.75, cy - s * 0.65, 3, s * 1.4);
            g.fillRect(cx + s * 0.72, cy - s * 0.65, 3, s * 1.4);
            // Packing tape cross
            g.fillStyle(0xCCBB66, 0.6);
            g.fillRect(cx - 2, cy - s * 0.65, 4, s * 1.4);
            g.fillRect(cx - s * 0.75, cy - 2, s * 1.5, 4);
            // Box outline
            g.lineStyle(2, 0x5A4A34);
            g.strokeRect(cx - s * 0.75, cy - s * 0.65, s * 1.5, s * 1.4);
            // Clock symbol on box
            g.lineStyle(2, 0x333333);
            g.strokeCircle(cx, cy - s * 0.15, s * 0.3);
            g.fillStyle(0xFFFFDD);
            g.fillCircle(cx, cy - s * 0.15, s * 0.25);
            // Clock hands
            g.lineStyle(2, 0x333333);
            g.lineBetween(cx, cy - s * 0.15, cx, cy - s * 0.35); // minute hand (up)
            g.lineBetween(cx, cy - s * 0.15, cx + s * 0.15, cy - s * 0.1); // hour hand (right)
            // Clock center dot
            g.fillStyle(0x333333);
            g.fillCircle(cx, cy - s * 0.15, 2);
        }
    }

    setLinearMovement() {
        // Pick random direction
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.sprite.setVelocity(
            Math.cos(angle) * this.type.speed,
            Math.sin(angle) * this.type.speed
        );
        this.sprite.setBounce(1);
        this.sprite.setCollideWorldBounds(true);
    }

    update(time, delta) {
        if (!this.sprite || !this.sprite.active) return;

        // Chase behavior
        if (this.type.behavior === 'chase' && this.player && this.player.sprite && this.player.sprite.active) {
            const angle = Phaser.Math.Angle.Between(
                this.sprite.x, this.sprite.y,
                this.player.sprite.x, this.player.sprite.y
            );
            this.sprite.setVelocity(
                Math.cos(angle) * this.type.speed,
                Math.sin(angle) * this.type.speed
            );
        }

        // Stationary lifetime
        if (this.lifetime && time - this.spawnTime > this.lifetime) {
            // Fade out
            this.scene.tweens.add({
                targets: this.sprite,
                alpha: 0,
                duration: 300,
                onComplete: () => this.destroy(),
            });
            this.lifetime = null; // prevent re-trigger
        }
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}
