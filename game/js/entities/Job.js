// BuildQuest: Job Entity (Work Orders)

import { COLORS } from '../utils/Constants.js';

export default class Job {
    constructor(scene, x, y, value) {
        this.scene = scene;
        this.value = value;
        this.collected = false;
        this.highlighted = false;

        this.createSprite(x, y);
    }

    createSprite(x, y) {
        const key = `job_${this.value}`;

        if (!this.scene.textures.exists(key)) {
            const g = this.scene.make.graphics({ add: false });
            this.drawWorkOrder(g);
            g.generateTexture(key, 30, 33);
            g.destroy();
        }

        this.sprite = this.scene.physics.add.sprite(x, y, key);
        this.sprite.setSize(24, 24);
        this.sprite.setImmovable(true);
        this.sprite.setData('entity', this);
        this.sprite.setDepth(5);

        // Value text
        this.valueText = this.scene.add.text(x, y - 22, `$${this.value}`, {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#19D979',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5).setDepth(5);

        // Bobbing tween
        this.scene.tweens.add({
            targets: this.sprite,
            y: y - 4,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    drawWorkOrder(g) {
        // Clipboard with detailed work order — 30x33 texture (1.5x scale)
        // Shadow
        g.fillStyle(0x000000, 0.2);
        g.fillRect(5, 6, 24, 27);

        // Paper body
        g.fillStyle(0xF0F4E0);
        g.fillRect(2, 3, 24, 28);
        // Paper edge highlight
        g.fillStyle(0xFBFFED);
        g.fillRect(2, 3, 24, 2);
        g.fillRect(2, 3, 2, 28);
        // Paper shadow edge
        g.fillStyle(0xD8DCCA, 0.6);
        g.fillRect(24, 3, 2, 28);
        g.fillRect(2, 29, 24, 2);

        // Header bar (green — BuildOps brand)
        g.fillStyle(0x00AF66);
        g.fillRect(2, 3, 24, 6);
        g.fillStyle(0x19D979, 0.4);
        g.fillRect(2, 3, 24, 2);

        // Clipboard clip (metal)
        g.fillStyle(0x6a7a8a);
        g.fillRect(9, 0, 10, 6);
        g.fillStyle(0x8a9aaa);
        g.fillRect(9, 0, 10, 2);
        // Clip inner
        g.fillStyle(0x4a5a6a);
        g.fillRect(12, 1, 5, 3);

        // Text lines on paper
        g.fillStyle(0x8aaa8a);
        g.fillRect(5, 12, 18, 2);
        g.fillRect(5, 16, 15, 2);
        g.fillRect(5, 20, 16, 2);

        // Checkbox at bottom
        g.lineStyle(1, 0x8aaa8a, 0.8);
        g.strokeRect(5, 25, 4, 4);
        // Checkmark
        g.fillStyle(0x00AF66);
        g.fillRect(6, 27, 2, 2);
        g.fillRect(7, 28, 2, 1);

        // Dollar badge (bottom-right)
        g.fillStyle(COLORS.FOCUS_GREEN);
        g.fillCircle(22, 26, 4);
        g.fillStyle(0xFFFFFF, 0.8);
        g.fillRect(21, 23, 2, 6);
    }

    setHighlighted(on, tier) {
        this.highlighted = on;
        if (on) {
            // Tiered highlighting: 'best', 'top', or 'normal'
            this.highlightTier = tier || 'normal';
            if (tier === 'best') {
                this.sprite.setTint(0xFFD700); // gold
                this.valueText.setColor('#FFD700');
            } else if (tier === 'top') {
                this.sprite.setTint(0x4ade80); // green
                this.valueText.setColor('#4ade80');
            } else {
                this.sprite.setTint(0x6b7280); // dim gray
                this.valueText.setColor('#9ca3af');
            }
        } else {
            this.highlightTier = null;
            this.sprite.clearTint();
            this.valueText.setColor('#19D979');
            // Clean up any dispatch decorations
            this.clearDispatchMarker();
        }
    }

    showDispatchMarker(rank, efficiency) {
        this.clearDispatchMarker();
        if (!this.sprite || !this.sprite.active) return;

        const x = this.sprite.x;
        const y = this.sprite.y;

        if (rank === 0) {
            // BEST job — pulsing gold diamond + "BEST" label
            this.dispatchGlow = this.scene.add.circle(x, y, 22, 0xFFD700, 0.25).setDepth(4);
            this.scene.tweens.add({
                targets: this.dispatchGlow,
                alpha: { from: 0.35, to: 0.08 },
                scaleX: { from: 1, to: 1.6 },
                scaleY: { from: 1, to: 1.6 },
                duration: 700,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });

            this.dispatchLabel = this.scene.add.text(x, y - 36, '★ BEST', {
                fontSize: '10px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 3,
            }).setOrigin(0.5).setDepth(6);
        } else if (rank <= 2) {
            // Top 3 — subtle green glow
            this.dispatchGlow = this.scene.add.circle(x, y, 18, 0x4ade80, 0.15).setDepth(4);
            this.scene.tweens.add({
                targets: this.dispatchGlow,
                alpha: { from: 0.2, to: 0.05 },
                duration: 900,
                yoyo: true,
                repeat: -1,
            });

            this.dispatchLabel = this.scene.add.text(x, y - 36, `#${rank + 1}`, {
                fontSize: '9px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#4ade80',
                stroke: '#000000',
                strokeThickness: 2,
            }).setOrigin(0.5).setDepth(6);
        }
    }

    clearDispatchMarker() {
        if (this.dispatchGlow) { this.dispatchGlow.destroy(); this.dispatchGlow = null; }
        if (this.dispatchLabel) { this.dispatchLabel.destroy(); this.dispatchLabel = null; }
    }

    collect() {
        this.collected = true;
        this.valueText.destroy();
        this.sprite.destroy();
    }

    destroy() {
        this.clearDispatchMarker();
        if (this.valueText) this.valueText.destroy();
        if (this.sprite) this.sprite.destroy();
    }
}
