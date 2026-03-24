// BuildQuest: Theme Texture Generator
// Generates floor tiles, wall tiles, and equipment textures for all 11 themed levels.

import { TILE_SIZE } from './Constants.js';
import { THEMES } from './LevelConfig.js';

const S = TILE_SIZE;
const cx = S / 2;
const cy = S / 2;

// ── PUBLIC API ──

export function generateAllThemeTextures(scene) {
    // Generate floor/wall textures for all themes that have custom colors
    const themeList = Object.values(THEMES);
    themeList.forEach(theme => generateThemeFloorWall(scene, theme));

    // Generate equipment for each themed level
    generateOfficeEquipment(scene);
    generateMechYardEquipment(scene);
    generateElectricalEquipment(scene);
    generatePlumbingEquipment(scene);
    generateDuctEquipment(scene);
    generateFreezerEquipment(scene);
    generateElevatorEquipment(scene);
    generateDataCenterEquipment(scene);
    generateConstructionEquipment(scene);
    generateForgeEquipment(scene);

    // Generate fan blade textures for themes with animated overlays
    themeList.forEach(theme => {
        if (theme.animatedOverlays) {
            theme.animatedOverlays.forEach(ao => {
                if (ao.type === 'fan') {
                    genFanBlade(scene, `fan_blade_${theme.id}`, ao.color);
                }
            });
        }
    });
}

// ── FAN BLADE TEXTURE GENERATION ──
function genFanBlade(scene, key, color) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ add: false });
    const size = S; // 48x48
    const center = size / 2;
    const bladeLen = 18;
    const bladeW = 6;

    // 4-blade propeller — draw angled blades
    g.fillStyle(color, 0.7);
    // Blade 1 — up
    g.fillRect(center - 1, center - bladeLen, bladeW, bladeLen);
    // Blade 2 — right
    g.fillRect(center, center - 1, bladeLen, bladeW);
    // Blade 3 — down
    g.fillRect(center - bladeW + 1, center, bladeW, bladeLen);
    // Blade 4 — left
    g.fillRect(center - bladeLen, center - bladeW + 1, bladeLen, bladeW);

    // Center hub
    g.fillStyle(color, 0.9);
    g.fillCircle(center, center, 4);

    // Highlight on blades
    g.fillStyle(0xffffff, 0.15);
    g.fillRect(center - 1, center - bladeLen, 1, bladeLen);
    g.fillRect(center, center - 1, bladeLen, 1);

    g.generateTexture(key, size, size);
    g.destroy();
}

// ── FLOOR & WALL GENERATION (style-specific patterns per theme) ──

function generateThemeFloorWall(scene, theme) {
    if (!theme.floorColors || !theme.wallColors) return;
    const fc = theme.floorColors;
    const wc = theme.wallColors;
    const style = theme.floorStyle || 'slab';
    const wStyle = theme.wallStyle || 'brick';

    // === FLOOR TILES (3 variants per theme) ===
    const floorDrawers = {
        carpet: drawCarpetFloor,
        concrete: drawConcreteFloor,
        metal: drawMetalFloor,
        vinyl: drawVinylFloor,
        stone: drawStoneFloor,
        frost: drawFrostFloor,
        polished: drawPolishedFloor,
        slab: drawSlabFloor,
    };
    const drawFloor = floorDrawers[style] || drawSlabFloor;
    genTex(scene, theme.floorKeys[0], (g) => drawFloor(g, fc, theme, 'A'));
    genTex(scene, theme.floorKeys[2], (g) => drawFloor(g, fc, theme, 'B'));
    genTex(scene, theme.floorKeys[3], (g) => drawFloor(g, fc, theme, 'C'));

    // === WALL TILES ===
    const wallDrawers = {
        brick: drawBrickWall,
        drywall: drawDrywallWall,
        parapet: drawParapetWall,
        corrugated: drawCorrugatedWall,
        warning: drawWarningWall,
        ceramic: drawCeramicWall,
        metal_panel: drawMetalPanelWall,
        server: drawServerWall,
        curtain: drawCurtainWall,
    };
    const drawWall = wallDrawers[wStyle] || drawBrickWall;
    genTex(scene, theme.wallKey, (g) => drawWall(g, wc, theme, false));
    genTex(scene, theme.wallTopKey, (g) => drawWall(g, wc, theme, true));
}

// ─── FLOOR STYLE: CARPET (Office) ───
function drawCarpetFloor(g, fc, theme, variant) {
    g.fillStyle(fc.base); g.fillRect(0, 0, S, S);
    // Fabric cross-hatch texture
    g.fillStyle(fc.patchLight, 0.25);
    for (let y = 0; y < S; y += 4) { g.fillRect(0, y, S, 1); }
    for (let x = 0; x < S; x += 4) { g.fillRect(x, 0, 1, S); }
    // Soft edge (no hard mortar)
    g.fillStyle(fc.mortarDark, 0.3);
    g.fillRect(0, 0, S, 1); g.fillRect(0, S - 1, S, 1);
    g.fillRect(0, 0, 1, S); g.fillRect(S - 1, 0, 1, S);
    if (variant === 'B') {
        // Slightly different weave — diagonal accent
        g.fillStyle(theme.ambientColor, 0.06);
        for (let i = 0; i < S; i += 6) { g.fillRect(i, i, 2, 2); g.fillRect(i + 3, i, 1, 1); }
    } else if (variant === 'C') {
        // Worn patch — lighter area
        g.fillStyle(fc.wearDark, 0.35); g.fillRect(8, 10, 16, 12);
        g.fillStyle(fc.patchMid, 0.2); g.fillRect(10, 12, 12, 8);
    } else {
        // Standard — subtle pile variation
        g.fillStyle(fc.patchMid, 0.15); g.fillRect(4, 4, 18, 14);
        g.fillStyle(fc.speckle, 0.2); g.fillRect(6, 20, 10, 8);
    }
}

// ─── FLOOR STYLE: CONCRETE (Rooftop, MechYard, Construction) ───
function drawConcreteFloor(g, fc, theme, variant) {
    g.fillStyle(fc.base); g.fillRect(0, 0, S, S);
    // Aggregate texture — random speckles
    g.fillStyle(fc.speckle, 0.4);
    for (let i = 0; i < 20; i++) {
        const px = (i * 7 + 3) % (S - 2); const py = (i * 11 + 5) % (S - 2);
        g.fillRect(px, py, 1 + (i % 2), 1);
    }
    // Expansion joint (thick line)
    g.fillStyle(fc.mortarDark, 0.7);
    if (variant === 'A') {
        g.fillRect(0, S - 2, S, 2); g.fillRect(S - 2, 0, 2, S);
    } else if (variant === 'B') {
        g.fillRect(0, S - 2, S, 2); g.fillRect(0, 0, 2, S);
        // Oil stain
        g.fillStyle(fc.wearDark, 0.4);
        g.fillCircle(20, 18, 6); g.fillCircle(22, 20, 4);
    } else {
        // Cracked slab
        g.fillRect(0, S - 2, S, 2); g.fillRect(S - 2, 0, 2, S);
        g.fillStyle(fc.wearDark, 0.6);
        g.fillRect(8, 6, 1, 4); g.fillRect(9, 9, 1, 3); g.fillRect(10, 11, 2, 1);
        g.fillRect(12, 12, 1, 4); g.fillRect(13, 15, 2, 1); g.fillRect(15, 16, 1, 3);
    }
    // Weathering patch
    g.fillStyle(fc.patchLight, 0.2); g.fillRect(3, 3, 12, 8);
    g.fillStyle(fc.patchMid, 0.15); g.fillRect(20, 20, 10, 8);
}

// ─── FLOOR STYLE: METAL GRATING (Ducts, Elevator) ───
function drawMetalFloor(g, fc, theme, variant) {
    g.fillStyle(fc.base); g.fillRect(0, 0, S, S);
    // Diamond/grid holes pattern
    g.fillStyle(fc.wearDark, 0.6);
    const gridSize = 6;
    for (let y = 2; y < S - 2; y += gridSize) {
        for (let x = 2; x < S - 2; x += gridSize) {
            g.fillRect(x + 1, y + 1, gridSize - 3, gridSize - 3);
        }
    }
    // Grid lines (raised metal bars)
    g.fillStyle(fc.patchLight, 0.5);
    for (let y = 1; y < S; y += gridSize) { g.fillRect(0, y, S, 1); }
    for (let x = 1; x < S; x += gridSize) { g.fillRect(x, 0, 1, S); }
    // Highlight on bars
    g.fillStyle(fc.speckle, 0.3);
    for (let y = 0; y < S; y += gridSize) { g.fillRect(0, y, S, 1); }
    if (variant === 'B') {
        // Some holes partially covered
        g.fillStyle(fc.patchMid, 0.4);
        g.fillRect(8, 8, 10, 4); g.fillRect(20, 24, 8, 6);
    } else if (variant === 'C') {
        // Rust/wear on grating
        g.fillStyle(fc.wearDark, 0.3);
        g.fillRect(4, 14, 8, 6); g.fillRect(18, 4, 10, 8);
        g.fillStyle(fc.patchLight, 0.15); g.fillRect(12, 22, 6, 4);
    }
    // Border rivets
    g.fillStyle(fc.speckle, 0.5);
    g.fillRect(0, 0, 2, 2); g.fillRect(S - 2, 0, 2, 2);
    g.fillRect(0, S - 2, 2, 2); g.fillRect(S - 2, S - 2, 2, 2);
}

// ─── FLOOR STYLE: VINYL (Electrical, Data Center) ───
function drawVinylFloor(g, fc, theme, variant) {
    g.fillStyle(fc.base); g.fillRect(0, 0, S, S);
    // Clean grid pattern — anti-static raised bumps
    g.fillStyle(fc.patchLight, 0.2);
    for (let y = 3; y < S; y += 8) {
        for (let x = 3; x < S; x += 8) {
            g.fillRect(x, y, 2, 2);
        }
    }
    // Tile edge — crisp clean line
    g.fillStyle(fc.mortarDark, 0.5);
    g.fillRect(0, 0, S, 1); g.fillRect(0, 0, 1, S);
    g.fillStyle(fc.patchLight, 0.3);
    g.fillRect(1, S - 1, S - 1, 1); g.fillRect(S - 1, 1, 1, S - 1);
    if (variant === 'B') {
        // Accent stripe — anti-static warning line
        g.fillStyle(theme.ambientColor, 0.12);
        g.fillRect(0, S / 2 - 1, S, 2);
    } else if (variant === 'C') {
        // Scuff marks
        g.fillStyle(fc.wearDark, 0.25);
        g.fillRect(10, 8, 12, 1); g.fillRect(6, 22, 8, 1);
        g.fillStyle(fc.patchMid, 0.15); g.fillRect(14, 16, 14, 10);
    } else {
        // Smooth clean surface
        g.fillStyle(fc.patchMid, 0.08); g.fillRect(4, 4, S - 8, S - 8);
    }
}

// ─── FLOOR STYLE: STONE (Plumbing) ───
function drawStoneFloor(g, fc, theme, variant) {
    g.fillStyle(fc.base); g.fillRect(0, 0, S, S);
    // Irregular stone texture — uneven patches
    g.fillStyle(fc.patchLight, 0.3);
    g.fillRect(2, 2, 14, 10); g.fillRect(20, 16, 12, 10);
    g.fillStyle(fc.patchMid, 0.25);
    g.fillRect(18, 2, 10, 8); g.fillRect(2, 20, 12, 10);
    // Rough aggregate
    g.fillStyle(fc.speckle, 0.4);
    for (let i = 0; i < 25; i++) {
        const px = (i * 13 + 5) % (S - 1); const py = (i * 9 + 7) % (S - 1);
        g.fillRect(px, py, 1, 1);
    }
    // Thick grout lines
    g.fillStyle(fc.mortarDark, 0.8);
    g.fillRect(0, 0, S, 2); g.fillRect(0, 0, 2, S);
    g.fillRect(S - 1, 0, 1, S); g.fillRect(0, S - 1, S, 1);
    if (variant === 'B') {
        // Water staining
        g.fillStyle(theme.ambientColor, 0.10);
        g.fillCircle(cx, cy, 8);
        g.fillStyle(fc.wearDark, 0.2); g.fillCircle(cx + 2, cy + 2, 5);
    } else if (variant === 'C') {
        // Cracks in stone
        g.fillStyle(fc.wearDark, 0.6);
        g.fillRect(6, 8, 1, 5); g.fillRect(7, 12, 2, 1); g.fillRect(9, 13, 1, 4);
        g.fillRect(20, 4, 1, 3); g.fillRect(21, 6, 1, 2); g.fillRect(22, 7, 3, 1);
    }
}

// ─── FLOOR STYLE: FROST (Freezer) ───
function drawFrostFloor(g, fc, theme, variant) {
    g.fillStyle(fc.base); g.fillRect(0, 0, S, S);
    // Smooth icy surface
    g.fillStyle(fc.patchLight, 0.2); g.fillRect(0, 0, S, S);
    // Ice crystal patches
    g.fillStyle(0xffffff, 0.06);
    g.fillRect(4, 4, 12, 8); g.fillRect(20, 20, 10, 8);
    // Frost edge lines
    g.fillStyle(fc.mortarDark, 0.4);
    g.fillRect(0, 0, S, 1); g.fillRect(0, 0, 1, S);
    g.fillRect(S - 1, 0, 1, S); g.fillRect(0, S - 1, S, 1);
    // Glossy highlight streak
    g.fillStyle(0xffffff, 0.08);
    g.fillRect(3, 3, S - 6, 2);
    if (variant === 'B') {
        // Ice patch — shiny
        g.fillStyle(0xffffff, 0.12);
        g.fillCircle(cx - 4, cy, 7);
        g.fillStyle(0x88bbff, 0.10); g.fillCircle(cx + 6, cy - 4, 5);
    } else if (variant === 'C') {
        // Cracked ice
        g.fillStyle(fc.wearDark, 0.5);
        g.fillRect(10, 8, 1, 6); g.fillRect(11, 13, 2, 1); g.fillRect(13, 14, 1, 5);
        g.fillStyle(0xffffff, 0.10);
        g.fillRect(8, 18, 14, 6); // refrozen puddle
    } else {
        // Standard frost texture
        g.fillStyle(fc.speckle, 0.15);
        for (let i = 0; i < 10; i++) {
            const px = (i * 11 + 3) % (S - 4); const py = (i * 7 + 2) % (S - 4);
            g.fillRect(px, py, 2, 2);
        }
    }
}

// ─── FLOOR STYLE: POLISHED (Forge Conference) ───
function drawPolishedFloor(g, fc, theme, variant) {
    g.fillStyle(fc.base); g.fillRect(0, 0, S, S);
    // Smooth polished surface with reflection
    g.fillStyle(fc.patchLight, 0.15); g.fillRect(0, 0, S, S);
    // Diagonal reflection streak
    g.fillStyle(0xffffff, 0.04);
    for (let i = 0; i < S; i++) { g.fillRect(i, i, 2, 1); }
    // Clean tile edges
    g.fillStyle(fc.mortarDark, 0.5);
    g.fillRect(0, 0, S, 1); g.fillRect(0, 0, 1, S);
    g.fillStyle(fc.patchLight, 0.3);
    g.fillRect(1, S - 1, S - 1, 1); g.fillRect(S - 1, 1, 1, S - 1);
    if (variant === 'B') {
        // Stage light reflection spot
        g.fillStyle(theme.ambientColor, 0.10);
        g.fillCircle(cx, cy, 10);
        g.fillStyle(0xffffff, 0.06); g.fillCircle(cx - 2, cy - 2, 6);
    } else if (variant === 'C') {
        // Scuff from foot traffic
        g.fillStyle(fc.wearDark, 0.2);
        g.fillRect(8, 16, 14, 1); g.fillRect(12, 20, 10, 1);
    } else {
        // Subtle gradient — lighter top
        g.fillStyle(0xffffff, 0.03); g.fillRect(2, 2, S - 4, S / 2 - 2);
    }
}

// ─── FLOOR STYLE: SLAB (fallback — original generic) ───
function drawSlabFloor(g, fc, theme, variant) {
    g.fillStyle(fc.base); g.fillRect(0, 0, S, S);
    g.fillStyle(fc.mortarDark, 0.8);
    g.fillRect(0, 0, S, 1); g.fillRect(0, 0, 1, S);
    g.fillRect(S - 1, 0, 1, S); g.fillRect(0, S - 1, S, 1);
    g.fillStyle(fc.patchLight, 0.4); g.fillRect(3, 3, 12, 10);
    g.fillStyle(fc.patchMid, 0.3); g.fillRect(17, 15, 11, 13);
    g.fillStyle(fc.speckle, 0.5);
    g.fillRect(5, 5, 2, 1); g.fillRect(22, 8, 1, 2);
    if (variant === 'C') {
        g.fillStyle(fc.wearDark, 0.6);
        g.fillRect(6, 4, 1, 3); g.fillRect(7, 6, 1, 2); g.fillRect(8, 7, 2, 1);
    }
}

// ═══════════════════════════════════════════════════
// WALL STYLES
// ═══════════════════════════════════════════════════

// ─── WALL: BRICK (fallback — original) ───
function drawBrickWall(g, wc, theme, isTop) {
    g.fillStyle(wc.base); g.fillRect(0, 0, S, S);
    const bH = 7, mW = 1;
    if (isTop) {
        // Cap highlight
        g.fillStyle(wc.capHighlight); g.fillRect(0, 0, S, 4);
        g.fillStyle(wc.capLight, 0.6); g.fillRect(0, 0, S, 2);
        g.fillStyle(wc.mortar, 0.4); g.fillRect(0, 4, S, 2);
    }
    const startY = isTop ? 6 : 0;
    g.fillStyle(wc.brickLight); g.fillRect(0, startY, 15, bH); g.fillRect(16, startY, 16, bH);
    g.fillStyle(wc.highlight, 0.5); g.fillRect(0, startY, 15, 1); g.fillRect(16, startY, 16, 1);
    g.fillStyle(wc.shadow, 0.5); g.fillRect(0, startY+bH-1, 15, 1); g.fillRect(16, startY+bH-1, 16, 1);
    g.fillStyle(wc.mortar, 0.6); g.fillRect(0, startY+bH, S, mW);
    const y2 = startY + bH + mW;
    g.fillStyle(wc.brickMid);
    g.fillRect(0, y2, 7, bH); g.fillRect(8, y2, 16, bH); g.fillRect(25, y2, 7, bH);
    g.fillStyle(wc.mortar, 0.6); g.fillRect(0, y2+bH, S, mW);
    const y3 = y2 + bH + mW;
    g.fillStyle(wc.brickLight); g.fillRect(0, y3, 15, bH); g.fillRect(16, y3, 16, bH);
    g.fillStyle(wc.mortar, 0.5);
    g.fillRect(15, startY, mW, bH); g.fillRect(7, y2, mW, bH); g.fillRect(24, y2, mW, bH);
    g.fillRect(15, y3, mW, bH);
    g.lineStyle(1, wc.mortar, 0.4); g.strokeRect(0, 0, S, S);
}

// ─── WALL: DRYWALL (Office) ───
function drawDrywallWall(g, wc, theme, isTop) {
    g.fillStyle(wc.base); g.fillRect(0, 0, S, S);
    if (isTop) {
        // Baseboard cap
        g.fillStyle(wc.capHighlight); g.fillRect(0, 0, S, 5);
        g.fillStyle(wc.capLight, 0.6); g.fillRect(0, 0, S, 2);
        g.fillStyle(wc.mortar, 0.3); g.fillRect(0, 5, S, 1);
    }
    // Smooth surface — very subtle texture
    g.fillStyle(wc.brickLight, 0.15); g.fillRect(0, 0, S, S);
    // Vertical seams every 16px
    g.fillStyle(wc.mortar, 0.25);
    g.fillRect(15, 0, 1, S); g.fillRect(31, 0, 1, S);
    // Subtle stipple texture
    g.fillStyle(wc.brickMid, 0.12);
    for (let i = 0; i < 15; i++) {
        const px = (i * 11 + 3) % (S - 1); const py = (i * 7 + 2) % (S - 1);
        g.fillRect(px, py, 1, 1);
    }
    // Light switch / outlet detail
    if (!isTop) {
        g.fillStyle(wc.highlight, 0.3); g.fillRect(cx - 2, cy - 3, 4, 6);
        g.fillStyle(wc.shadow, 0.2); g.fillRect(cx - 1, cy - 1, 2, 2);
    }
}

// ─── WALL: PARAPET (Rooftop) ───
function drawParapetWall(g, wc, theme, isTop) {
    g.fillStyle(wc.base); g.fillRect(0, 0, S, S);
    if (isTop) {
        // Flat concrete cap
        g.fillStyle(wc.capHighlight); g.fillRect(0, 0, S, 6);
        g.fillStyle(wc.capLight, 0.5); g.fillRect(0, 0, S, 3);
        g.fillStyle(wc.mortar, 0.4); g.fillRect(0, 6, S, 1);
    }
    // Large concrete blocks (bigger than brick)
    const blockH = 12;
    const startY = isTop ? 7 : 0;
    g.fillStyle(wc.brickLight); g.fillRect(0, startY, 22, blockH);
    g.fillStyle(wc.brickMid); g.fillRect(23, startY, S - 23, blockH);
    g.fillStyle(wc.mortar, 0.5);
    g.fillRect(22, startY, 1, blockH); g.fillRect(0, startY + blockH, S, 2);
    const y2 = startY + blockH + 2;
    g.fillStyle(wc.brickMid); g.fillRect(0, y2, 10, blockH);
    g.fillStyle(wc.brickLight); g.fillRect(11, y2, 20, blockH);
    g.fillStyle(wc.brickMid); g.fillRect(32, y2, S - 32, blockH);
    g.fillStyle(wc.mortar, 0.5);
    g.fillRect(10, y2, 1, blockH); g.fillRect(31, y2, 1, blockH);
    // Weathering speckles
    g.fillStyle(wc.shadow, 0.2);
    for (let i = 0; i < 8; i++) {
        const px = (i * 13 + 4) % (S - 2); const py = (i * 9 + startY + 2) % (S - 2);
        g.fillRect(px, py, 2, 1);
    }
}

// ─── WALL: CORRUGATED METAL (MechYard, Construction) ───
function drawCorrugatedWall(g, wc, theme, isTop) {
    g.fillStyle(wc.base); g.fillRect(0, 0, S, S);
    if (isTop) {
        g.fillStyle(wc.capHighlight); g.fillRect(0, 0, S, 4);
        g.fillStyle(wc.capLight, 0.5); g.fillRect(0, 0, S, 2);
    }
    // Vertical ridges (corrugation)
    for (let x = 0; x < S; x += 4) {
        g.fillStyle(wc.brickLight, 0.6); g.fillRect(x, 0, 2, S);
        g.fillStyle(wc.shadow, 0.3); g.fillRect(x + 2, 0, 2, S);
    }
    // Highlight on ridge tops
    g.fillStyle(wc.highlight, 0.2);
    for (let x = 0; x < S; x += 4) { g.fillRect(x, 0, 1, S); }
    // Horizontal seam
    g.fillStyle(wc.mortar, 0.6); g.fillRect(0, cy - 1, S, 2);
    // Rivets at seam
    g.fillStyle(wc.highlight, 0.5);
    for (let x = 3; x < S; x += 8) { g.fillRect(x, cy - 2, 2, 1); g.fillRect(x, cy + 1, 2, 1); }
    // Rust spots
    g.fillStyle(wc.brickMid, 0.3); g.fillRect(8, 10, 4, 3); g.fillRect(28, 30, 5, 4);
}

// ─── WALL: WARNING STRIPES (Electrical) ───
function drawWarningWall(g, wc, theme, isTop) {
    g.fillStyle(wc.base); g.fillRect(0, 0, S, S);
    if (isTop) {
        // Yellow/black hazard stripe at top
        g.fillStyle(0xfbbf24, 0.7);
        g.fillRect(0, 0, S, 6);
        for (let x = -6; x < S; x += 12) {
            g.fillStyle(wc.shadow, 0.8);
            // Diagonal stripe
            g.fillRect(x, 0, 6, 6);
        }
        g.fillStyle(wc.mortar, 0.5); g.fillRect(0, 6, S, 1);
    }
    // Dark panels with conduit channels
    g.fillStyle(wc.brickMid, 0.4); g.fillRect(2, isTop ? 8 : 2, S - 4, S - (isTop ? 10 : 4));
    // Conduit runs
    g.fillStyle(wc.highlight, 0.3);
    g.fillRect(8, 0, 2, S); g.fillRect(26, 0, 2, S);
    // Warning label
    if (!isTop) {
        g.fillStyle(0xfbbf24, 0.4); g.fillRect(12, cy - 4, 12, 8);
        g.fillStyle(wc.shadow, 0.6); g.fillRect(14, cy - 2, 8, 4);
        // Lightning bolt hint
        g.fillStyle(0xfbbf24, 0.5); g.fillRect(17, cy - 1, 2, 2);
    }
    g.lineStyle(1, wc.mortar, 0.3); g.strokeRect(0, 0, S, S);
}

// ─── WALL: CERAMIC TILE (Plumbing) ───
function drawCeramicWall(g, wc, theme, isTop) {
    g.fillStyle(wc.base); g.fillRect(0, 0, S, S);
    if (isTop) {
        g.fillStyle(wc.capHighlight); g.fillRect(0, 0, S, 4);
        g.fillStyle(wc.capLight, 0.6); g.fillRect(0, 0, S, 2);
    }
    // Small square tile grid (8x8 tiles)
    const tileSize = 8;
    for (let ty = 0; ty < S; ty += tileSize) {
        for (let tx = 0; tx < S; tx += tileSize) {
            const odd = ((tx / tileSize) + (ty / tileSize)) % 2;
            g.fillStyle(odd ? wc.brickLight : wc.brickMid, 0.5);
            g.fillRect(tx + 1, ty + 1, tileSize - 2, tileSize - 2);
        }
    }
    // Grout lines
    g.fillStyle(wc.mortar, 0.6);
    for (let y = 0; y < S; y += tileSize) { g.fillRect(0, y, S, 1); }
    for (let x = 0; x < S; x += tileSize) { g.fillRect(x, 0, 1, S); }
    // Glossy highlight
    g.fillStyle(wc.highlight, 0.15);
    for (let ty = 0; ty < S; ty += tileSize) {
        for (let tx = 0; tx < S; tx += tileSize) {
            g.fillRect(tx + 1, ty + 1, tileSize - 2, 1);
        }
    }
    // Water staining
    if (!isTop) {
        g.fillStyle(wc.shadow, 0.15); g.fillRect(2, S - 10, S - 4, 8);
    }
}

// ─── WALL: METAL PANEL (Ducts, Elevator, Freezer) ───
function drawMetalPanelWall(g, wc, theme, isTop) {
    g.fillStyle(wc.base); g.fillRect(0, 0, S, S);
    if (isTop) {
        g.fillStyle(wc.capHighlight); g.fillRect(0, 0, S, 4);
        g.fillStyle(wc.capLight, 0.5); g.fillRect(0, 0, S, 2);
    }
    // Flat panel surface
    g.fillStyle(wc.brickLight, 0.2); g.fillRect(2, isTop ? 5 : 2, S - 4, S / 2 - 2);
    g.fillStyle(wc.brickMid, 0.15); g.fillRect(2, S / 2, S - 4, S / 2 - 2);
    // Horizontal seam
    g.fillStyle(wc.mortar, 0.5); g.fillRect(0, cy, S, 1);
    // Corner rivets (4 corners of panel)
    g.fillStyle(wc.highlight, 0.5);
    g.fillCircle(4, 4, 1.5); g.fillCircle(S - 4, 4, 1.5);
    g.fillCircle(4, S - 4, 1.5); g.fillCircle(S - 4, S - 4, 1.5);
    // Center rivet
    g.fillCircle(cx, cy, 1.5);
    // Panel edge highlight
    g.fillStyle(wc.highlight, 0.12); g.fillRect(1, 1, S - 2, 1); g.fillRect(1, 1, 1, S - 2);
    g.fillStyle(wc.shadow, 0.12); g.fillRect(1, S - 2, S - 2, 1); g.fillRect(S - 2, 1, 1, S - 2);
}

// ─── WALL: SERVER PANEL (Data Center) ───
function drawServerWall(g, wc, theme, isTop) {
    g.fillStyle(wc.base); g.fillRect(0, 0, S, S);
    if (isTop) {
        g.fillStyle(wc.capHighlight); g.fillRect(0, 0, S, 3);
        g.fillStyle(wc.capLight, 0.5); g.fillRect(0, 0, S, 1);
    }
    // Dark panel with perforated vent holes
    g.fillStyle(wc.brickMid, 0.3); g.fillRect(2, 2, S - 4, S - 4);
    // Vent perforation grid
    g.fillStyle(wc.shadow, 0.4);
    for (let y = 6; y < S - 4; y += 4) {
        for (let x = 6; x < S - 4; x += 4) {
            g.fillRect(x, y, 1, 1);
        }
    }
    // LED indicator lights (the key visual!)
    const ledColors = [0x4ade80, 0x3b82f6, 0xfbbf24, 0x4ade80, 0x3b82f6];
    ledColors.forEach((color, i) => {
        g.fillStyle(color, 0.7);
        g.fillRect(4, 8 + i * 8, 2, 2);
        // LED glow
        g.fillStyle(color, 0.15);
        g.fillRect(3, 7 + i * 8, 4, 4);
    });
    // Right-side port indicators
    g.fillStyle(wc.highlight, 0.3);
    for (let y = 10; y < S - 6; y += 6) { g.fillRect(S - 8, y, 4, 2); }
    g.lineStyle(1, wc.mortar, 0.3); g.strokeRect(1, 1, S - 2, S - 2);
}

// ─── WALL: CURTAIN (Forge Conference) ───
function drawCurtainWall(g, wc, theme, isTop) {
    g.fillStyle(wc.base); g.fillRect(0, 0, S, S);
    if (isTop) {
        // Curtain rod
        g.fillStyle(wc.capHighlight); g.fillRect(0, 0, S, 3);
        g.fillStyle(0xffffff, 0.15); g.fillRect(0, 0, S, 1);
        // Curtain rings
        g.fillStyle(wc.highlight, 0.4);
        for (let x = 4; x < S; x += 8) { g.fillCircle(x, 2, 1.5); }
    }
    // Vertical drape folds
    for (let x = 0; x < S; x += 6) {
        const isFold = (x / 6) % 2 === 0;
        g.fillStyle(isFold ? wc.brickLight : wc.shadow, isFold ? 0.3 : 0.3);
        g.fillRect(x, isTop ? 4 : 0, 6, S);
        // Fold highlight
        g.fillStyle(wc.highlight, isFold ? 0.12 : 0);
        g.fillRect(x, isTop ? 4 : 0, 1, S);
        // Fold shadow
        g.fillStyle(wc.shadow, isFold ? 0 : 0.12);
        g.fillRect(x + 5, isTop ? 4 : 0, 1, S);
    }
    // Subtle stage light glow at bottom
    if (!isTop) {
        g.fillStyle(theme.ambientColor, 0.08);
        for (let i = 0; i < 8; i++) {
            g.fillRect(0, S - 1 - i, S, 1);
        }
    }
}

// ══════════════════════════════════════════════════
// EQUIPMENT GENERATORS — One per themed level
// ══════════════════════════════════════════════════

// ── Level 1: OFFICE ──
function generateOfficeEquipment(scene) {
    const bg = 0x263454;
    genTex(scene, 'equip_office_desk', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        // Ground shadow
        g.fillStyle(0x000000, 0.15); g.fillRect(5, S-4, S-8, 4);
        // Desk surface
        g.fillStyle(0x6a5040); g.fillRect(3, 8, S-6, 12);
        g.fillStyle(0x7a6050, 0.5); g.fillRect(3, 8, S-6, 2); // top highlight
        g.fillStyle(0x5a4030, 0.4); g.fillRect(3, 18, S-6, 2); // bottom shadow
        // Legs
        g.fillStyle(0x4a3a30); g.fillRect(4, 20, 3, S-24); g.fillRect(S-7, 20, 3, S-24);
        // Drawer
        g.fillStyle(0x5a4a3a); g.fillRect(12, 20, 14, 10);
        g.fillStyle(0x6a5a4a, 0.3); g.fillRect(12, 20, 14, 1);
        g.fillStyle(0x8a7a6a); g.fillRect(17, 24, 4, 2); // handle
        // Monitor on desk
        g.fillStyle(0x1a1a2a); g.fillRect(10, 0, 14, 9);
        g.fillStyle(0x3b82f6, 0.4); g.fillRect(11, 1, 12, 7); // screen glow
        g.fillStyle(0x4ade80, 0.3); g.fillRect(12, 2, 8, 1); g.fillRect(12, 4, 6, 1);
        g.fillStyle(0x333333); g.fillRect(15, 9, 4, 2); // stand
        // Coffee mug
        g.fillStyle(0xdddddd); g.fillRect(S-10, 9, 4, 5);
        g.fillStyle(0x8a6040, 0.6); g.fillRect(S-9, 10, 2, 3);
    });
    genTex(scene, 'equip_office_chair', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x000000, 0.12); g.fillCircle(cx, S-2, 8); // ground shadow
        // Seat cushion
        g.fillStyle(0x2a3248); g.fillRect(6, 18, S-12, 10);
        g.fillStyle(0x323c56, 0.4); g.fillRect(6, 18, S-12, 2); // highlight
        // Backrest
        g.fillStyle(0x303850); g.fillRect(8, 4, S-16, 16);
        g.fillStyle(0x384060, 0.5); g.fillRect(8, 4, S-16, 2); // highlight
        g.fillStyle(0x283048, 0.4); g.fillRect(8, 18, S-16, 2); // shadow
        // Stitch line detail
        g.fillStyle(0x3a4868, 0.3); g.fillRect(12, 8, S-24, 1); g.fillRect(12, 14, S-24, 1);
        // Armrests
        g.fillStyle(0x444444); g.fillRect(4, 14, 5, 2); g.fillRect(S-9, 14, 5, 2);
        g.fillStyle(0x555555, 0.4); g.fillRect(4, 14, 5, 1);
        // Stem + wheels
        g.fillStyle(0x333333); g.fillRect(cx-1, 28, 3, 6);
        g.fillStyle(0x444444); g.fillCircle(cx-7, S-2, 2); g.fillCircle(cx+7, S-2, 2);
        g.fillCircle(cx, S-1, 2); g.fillCircle(cx-4, S-3, 1.5); g.fillCircle(cx+4, S-3, 1.5);
    });
    genTex(scene, 'equip_office_monitor', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x000000, 0.12); g.fillRect(6, S-3, S-12, 3); // ground shadow
        // Monitor bezel
        g.fillStyle(0x1a1a2a); g.fillRect(2, 2, S-4, 24);
        g.fillStyle(0x222236, 0.3); g.fillRect(2, 2, S-4, 1); // edge highlight
        // Screen
        g.fillStyle(0x0a1628); g.fillRect(4, 4, S-8, 20);
        // Screen content — code/terminal
        g.fillStyle(0x4ade80, 0.35);
        g.fillRect(6, 6, 14, 1); g.fillRect(6, 9, 10, 1); g.fillRect(6, 12, 20, 1); g.fillRect(6, 15, 8, 1);
        g.fillStyle(0x3b82f6, 0.3); g.fillRect(6, 18, 12, 1); g.fillRect(6, 21, 16, 1);
        g.fillStyle(0xfbbf24, 0.2); g.fillRect(18, 6, 8, 1);
        // Screen reflection
        g.fillStyle(0xffffff, 0.04); g.fillRect(4, 4, S-8, 8);
        // Stand
        g.fillStyle(0x333340); g.fillRect(cx-3, 26, 6, 4);
        g.fillStyle(0x3a3a4a); g.fillRect(cx-7, 29, 14, 2);
        // Keyboard
        g.fillStyle(0x2a2a3a); g.fillRect(4, 34, S-8, 6);
        g.fillStyle(0x3a3a4a, 0.5); for (let kx = 6; kx < S-6; kx += 3) g.fillRect(kx, 35, 2, 4);
        g.fillStyle(0x4ade80, 0.4); g.fillRect(6, 36, 2, 2); // power key
    });
    genTex(scene, 'equip_office_whiteboard', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        // Frame
        g.fillStyle(0x6a6a7a); g.fillRect(2, 3, S-4, 28);
        g.fillStyle(0x7a7a8a, 0.3); g.fillRect(2, 3, S-4, 1); // top highlight
        // Board surface
        g.fillStyle(0xdde0e8); g.fillRect(4, 5, S-8, 24);
        // Writing content
        g.fillStyle(0x3b82f6, 0.5); g.fillRect(6, 7, 14, 1); g.fillRect(6, 11, 20, 1);
        g.fillStyle(0xef4444, 0.5); g.fillRect(6, 15, 10, 1); g.fillRect(6, 19, 16, 1);
        g.fillStyle(0x4ade80, 0.4); g.fillRect(6, 23, 12, 1);
        // Checkbox/bullet list
        g.fillStyle(0x444466, 0.3); g.fillRect(26, 7, 3, 3); g.fillRect(26, 13, 3, 3);
        g.fillStyle(0x4ade80, 0.5); g.fillRect(27, 8, 1, 1); // checkmark
        // Marker tray
        g.fillStyle(0x555566); g.fillRect(4, 30, S-8, 3);
        g.fillStyle(0x3b82f6); g.fillRect(7, 30, 2, 3);
        g.fillStyle(0xef4444); g.fillRect(11, 30, 2, 3);
        g.fillStyle(0x22c55e); g.fillRect(15, 30, 2, 3);
        g.fillStyle(0xfbbf24); g.fillRect(19, 30, 2, 3);
        // Legs
        g.fillStyle(0x555566); g.fillRect(6, 33, 2, S-35); g.fillRect(S-8, 33, 2, S-35);
        g.fillStyle(0x666676, 0.3); g.fillRect(6, 33, 1, S-35); // highlight
    });
    genTex(scene, 'equip_office_printer', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x000000, 0.12); g.fillRect(5, S-3, S-10, 3);
        // Main body
        g.fillStyle(0x3a3a48); g.fillRect(3, 10, S-6, 24);
        g.fillStyle(0x444458); g.fillRect(3, 8, S-6, 6);
        g.fillStyle(0x4a4a5c, 0.3); g.fillRect(3, 8, S-6, 1); // top highlight
        // Paper feed slot
        g.fillStyle(0x2a2a38); g.fillRect(7, 14, S-14, 4);
        g.fillStyle(0xdddddd, 0.4); g.fillRect(9, 14, S-18, 1); // paper edge
        // Control panel
        g.fillStyle(0x1a1a28); g.fillRect(5, 20, 12, 5);
        g.fillStyle(0x4ade80, 0.9); g.fillRect(7, 22, 2, 2); // power LED
        g.fillStyle(0xfbbf24, 0.5); g.fillRect(11, 22, 2, 2); // status LED
        // Paper tray
        g.fillStyle(0x333344); g.fillRect(5, 28, S-10, 5);
        g.fillStyle(0xdddddd, 0.2); g.fillRect(7, 29, S-14, 3); // paper stack
        // Output tray
        g.fillStyle(0x444458); g.fillRect(8, 4, S-16, 5);
        g.fillStyle(0xdddddd, 0.3); g.fillRect(10, 5, S-20, 1); // printed page
    });
    genTex(scene, 'equip_office_plant', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x000000, 0.10); g.fillCircle(cx, S-3, 9); // ground shadow
        // Pot
        g.fillStyle(0x8a5a3a); g.fillRect(10, 26, S-20, 12);
        g.fillStyle(0x9a6a4a, 0.4); g.fillRect(10, 26, S-20, 2); // rim highlight
        g.fillStyle(0x7a4a2a); g.fillRect(8, 24, S-16, 3); // rim
        g.fillStyle(0x6a3a1a, 0.3); g.fillRect(11, 28, S-22, 8); // inner shadow
        // Soil visible at top
        g.fillStyle(0x3a2a1a); g.fillRect(12, 24, S-24, 3);
        // Leaves — lush foliage
        g.fillStyle(0x1a8a3a, 0.9);
        g.fillCircle(cx, 14, 9); g.fillCircle(cx-6, 10, 6); g.fillCircle(cx+6, 10, 6);
        g.fillCircle(cx-4, 18, 5); g.fillCircle(cx+4, 18, 5);
        g.fillCircle(cx, 8, 5);
        // Leaf highlights
        g.fillStyle(0x4ade80, 0.5); g.fillCircle(cx-2, 10, 4); g.fillCircle(cx+4, 8, 3);
        g.fillCircle(cx-5, 15, 3);
        // Leaf vein detail
        g.fillStyle(0x0a6a2a, 0.3); g.fillRect(cx-1, 8, 1, 8); g.fillRect(cx-6, 12, 1, 6);
    });
}

// ── Level 3: MECHANICAL YARD ──
function generateMechYardEquipment(scene) {
    const bg = 0x3c3e38;
    genTex(scene, 'equip_yard_chiller', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x5a6a78); g.fillRect(2, 6, S-4, S-10);
        g.fillStyle(0x6a7a88, 0.4); g.fillRect(2, 6, S-4, 2);
        g.fillStyle(0x4a5a68, 0.5); g.fillRect(2, S-6, S-4, 2);
        for (let vy = 10; vy < S-8; vy += 3) { g.fillStyle(0x4a5a68, 0.5); g.fillRect(4, vy, S-8, 1); }
        g.fillStyle(0xcc8844); g.fillRect(S-6, 8, 2, 14); g.fillRect(S-3, 8, 2, 14);
        g.fillStyle(0x00AF66, 0.8); g.fillRect(6, S-8, 2, 2);
    });
    genTex(scene, 'equip_yard_generator', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x3a4a3a); g.fillRect(3, 8, S-6, S-12);
        g.fillStyle(0x4a5a4a, 0.4); g.fillRect(3, 8, S-6, 2);
        g.fillStyle(0x2a3a2a); g.fillRect(5, 12, S-10, 10);
        for (let sx = 7; sx < S-7; sx += 4) { g.fillStyle(0x1a2a1a, 0.6); g.fillRect(sx, 14, 2, 6); }
        g.fillStyle(0x333333); g.fillRect(cx-2, 2, 4, 8);
        g.fillStyle(0xfbbf24, 0.6); g.fillRect(cx-1, 2, 2, 3);
        g.fillStyle(0x444444); g.fillRect(4, S-4, S-8, 3);
    });
    genTex(scene, 'equip_yard_bollard', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x000000, 0.15); g.fillCircle(cx, S-6, 8);
        g.fillStyle(0xddaa00); g.fillRect(cx-4, 6, 8, S-12);
        g.fillStyle(0xeebb22, 0.4); g.fillRect(cx-4, 6, 2, S-12);
        g.fillStyle(0xbb8800, 0.4); g.fillRect(cx+2, 6, 2, S-12);
        g.fillStyle(0xddaa00); g.fillCircle(cx, 6, 4);
        g.fillStyle(0xeebb22, 0.3); g.fillCircle(cx-1, 5, 2);
    });
    genTex(scene, 'equip_yard_fence', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x6a7a8a); g.fillRect(0, 8, S, 2); g.fillRect(0, 20, S, 2);
        g.fillStyle(0x7a8a9a); g.fillRect(2, 2, 2, S-6); g.fillRect(S-4, 2, 2, S-6);
        g.fillRect(cx-1, 2, 2, S-6);
        g.fillStyle(0x6a7a8a, 0.5);
        for (let dx = 6; dx < S-4; dx += 4) g.fillRect(dx, 10, 1, 10);
    });
    genTex(scene, 'equip_yard_dumpster', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x2a5a2a); g.fillRect(3, 10, S-6, S-14);
        g.fillStyle(0x3a6a3a, 0.4); g.fillRect(3, 10, S-6, 2);
        g.fillStyle(0x1a4a1a, 0.4); g.fillRect(3, S-6, S-6, 2);
        g.fillStyle(0x2a5a2a); g.fillRect(2, 8, S-4, 4);
        g.fillStyle(0x444444); g.fillRect(6, S-4, 4, 3); g.fillRect(S-10, S-4, 4, 3);
        g.fillStyle(0x333333); g.fillCircle(8, S-2, 2); g.fillCircle(S-8, S-2, 2);
    });
    genTex(scene, 'equip_yard_pallet', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x6a5a40); g.fillRect(2, S-6, S-4, 2); g.fillRect(2, S-12, S-4, 2);
        g.fillRect(4, S-12, 3, 8); g.fillRect(cx-1, S-12, 3, 8); g.fillRect(S-7, S-12, 3, 8);
        g.fillStyle(0x4a4a4a); g.fillRect(4, 4, S-8, S-16);
        g.fillStyle(0x5a5a5a, 0.3); g.fillRect(4, 4, S-8, 2);
    });
}

// ── Level 4: ELECTRICAL ROOM ──
function generateElectricalEquipment(scene) {
    const bg = 0x2c2238;
    genTex(scene, 'equip_elec_panel', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        groundShadow(g, 4, S-4, S-8, 4);
        // Panel housing
        g.fillStyle(0x2a2438); g.fillRect(3, 2, S-6, S-5);
        g.fillStyle(0x342c48, 0.3); g.fillRect(3, 2, S-6, 1); // top highlight
        g.fillStyle(0x1e1830); g.fillRect(5, 4, S-10, S-9);
        // Breaker rows — left column (red/off)
        for (let i = 0; i < 5; i++) {
            g.fillStyle(0xBB3333); g.fillRect(7, 6+i*6, 5, 4);
            g.fillStyle(0xDD5555, 0.3); g.fillRect(7, 6+i*6, 5, 1);
        }
        // Breaker rows — right column (green/on)
        for (let i = 0; i < 5; i++) {
            g.fillStyle(0x00AF66); g.fillRect(20, 6+i*6, 5, 4);
            g.fillStyle(0x22CC88, 0.3); g.fillRect(20, 6+i*6, 5, 1);
        }
        // Center bus bar
        g.fillStyle(0xcc8844, 0.6); g.fillRect(13, 4, 5, S-10);
        g.fillStyle(0xdd9955, 0.3); g.fillRect(13, 4, 2, S-10);
        // Warning lightning bolt
        g.fillStyle(0xFFAE11, 0.8); g.fillRect(cx, S-10, 3, 2); g.fillRect(cx-1, S-8, 3, 2);
        g.fillRect(cx+1, S-6, 3, 2);
        // Panel door handle
        g.fillStyle(0x666678); g.fillRect(S-8, cy-2, 2, 6);
        g.fillStyle(0x7a7a8c, 0.4); g.fillRect(S-8, cy-2, 1, 6);
    });
    genTex(scene, 'equip_elec_transformer', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x3a3a48); g.fillRect(4, 6, S-8, S-10);
        g.fillStyle(0x4a4a58, 0.4); g.fillRect(4, 6, S-8, 2);
        g.fillStyle(0x2a2a38); g.fillRect(8, 12, S-16, 14);
        g.fillStyle(0xcc8844); g.fillRect(6, 2, 3, 6); g.fillRect(S-9, 2, 3, 6);
        g.fillStyle(0xfbbf24, 0.5); g.fillRect(cx-3, 14, 6, 4);
        g.fillStyle(0xFF4444, 0.6); g.fillRect(8, S-8, 8, 3);
        g.fillStyle(0xFFFFFF, 0.4); g.fillRect(9, S-7, 6, 1);
    });
    genTex(scene, 'equip_elec_conduit', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x5a6a7e); g.fillRect(cx-3, 0, 6, S);
        g.fillStyle(0x6a7a8e, 0.4); g.fillRect(cx-3, 0, 2, S);
        g.fillStyle(0x4a5a6e, 0.4); g.fillRect(cx+1, 0, 2, S);
        g.fillStyle(0x5a6a7e); g.fillRect(0, cy-3, S, 6);
        g.fillStyle(0x3a4a5e); g.fillRect(cx-4, cy-4, 8, 8);
        g.fillStyle(0x4a5a6e); g.fillCircle(cx, cy, 2);
    });
    genTex(scene, 'equip_elec_junction', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x4a4a58); g.fillRect(6, 6, S-12, S-12);
        g.fillStyle(0x3a3a48); g.fillRect(8, 8, S-16, S-16);
        g.fillStyle(0x5a5a68, 0.4); g.fillRect(6, 6, S-12, 2);
        g.fillStyle(0x5a6a7e); g.fillRect(0, cy-2, 6, 4); g.fillRect(S-6, cy-2, 6, 4);
        g.fillRect(cx-2, 0, 4, 6); g.fillRect(cx-2, S-6, 4, 6);
        g.fillStyle(0xFFAE11, 0.4); g.fillCircle(cx, cy, 4);
    });
    genTex(scene, 'equip_elec_arcflash', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        groundShadow(g, 3, S-3, S-6, 3);
        // Danger glow
        g.fillStyle(0xFF4444, 0.12); g.fillRect(0, 0, S, S);
        // Sign background
        g.fillStyle(0x3a2020); g.fillRect(4, 4, S-8, S-10);
        g.fillStyle(0x4a2828, 0.3); g.fillRect(4, 4, S-8, 1);
        // Red border
        g.fillStyle(0xFF4444, 0.6); g.lineStyle(2, 0xFF4444, 0.6); g.strokeRect(4, 4, S-8, S-10);
        // Lightning bolt — larger, more detailed
        g.fillStyle(0xfbbf24, 0.35); g.fillCircle(cx, 16, 10); // glow
        g.fillStyle(0xFFAE11, 0.9);
        g.fillRect(cx, 8, 4, 3); g.fillRect(cx-2, 10, 4, 3);
        g.fillRect(cx+1, 12, 4, 3); g.fillRect(cx-1, 14, 4, 3);
        g.fillRect(cx, 16, 4, 3); g.fillRect(cx-2, 18, 4, 3);
        // DANGER text bar
        g.fillStyle(0xFF4444, 0.8); g.fillRect(6, S-16, S-12, 6);
        g.fillStyle(0xFFFFFF, 0.6); g.fillRect(8, S-15, S-16, 4);
        // Warning stripes at top
        g.fillStyle(0xfbbf24, 0.4); g.fillRect(4, 4, S-8, 3);
        for (let x = 4; x < S-4; x += 6) { g.fillStyle(0x000000, 0.5); g.fillRect(x, 4, 3, 3); }
    });
    genTex(scene, 'equip_elec_cabinet', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x3a3848); g.fillRect(4, 2, S-8, S-4);
        g.fillStyle(0x4a4858, 0.4); g.fillRect(4, 2, S-8, 2);
        g.fillStyle(0x2a2838); g.fillRect(6, 6, S-12, S-10);
        g.fillStyle(0x555568); g.fillRect(cx+2, 10, 2, 8);
        g.fillStyle(0x00AF66, 0.6); g.fillRect(8, 8, 2, 2);
        g.fillStyle(0xFF4444, 0.4); g.fillRect(12, 8, 2, 2);
        g.fillStyle(0x444444); g.fillRect(4, S-3, S-8, 2);
    });
}

// ── Level 5: PLUMBING / MECHANICAL ROOM ──
function generatePlumbingEquipment(scene) {
    const bg = 0x382820;
    genTex(scene, 'equip_plumb_boiler', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x5a4a3a); g.fillRect(4, 4, S-8, S-8);
        g.fillStyle(0x6a5a4a, 0.4); g.fillRect(4, 4, S-8, 2);
        g.fillStyle(0x4a3a2a, 0.4); g.fillRect(4, S-6, S-8, 2);
        g.fillCircle(cx, cy, 8);
        g.fillStyle(0x3a2a1a); g.fillCircle(cx, cy, 6);
        g.fillStyle(0xf97316, 0.3); g.fillCircle(cx, cy+2, 4);
        g.fillStyle(0x888888); g.fillRect(cx-1, 2, 3, 4);
        g.fillStyle(0x666666); g.fillRect(4, S-4, 4, 3); g.fillRect(S-8, S-4, 4, 3);
    });
    genTex(scene, 'equip_plumb_heater', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x4a5a6a); g.fillRect(6, 4, S-12, S-8);
        g.fillStyle(0x5a6a7a, 0.4); g.fillRect(6, 4, S-12, 2);
        g.fillStyle(0xcc8844); g.fillRect(4, 10, 4, 2); g.fillRect(S-8, 10, 4, 2);
        g.fillStyle(0xcc8844); g.fillRect(4, 22, 4, 2); g.fillRect(S-8, 22, 4, 2);
        g.fillStyle(0xf97316, 0.2); g.fillRect(10, 12, S-20, 8);
        g.fillStyle(0x888888); g.fillCircle(cx, 8, 3);
        g.fillStyle(0x666666); g.fillCircle(cx, 8, 1.5);
    });
    genTex(scene, 'equip_plumb_valve', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0xcc8844); g.fillRect(0, cy-3, S, 6);
        g.fillStyle(0xdd9955, 0.4); g.fillRect(0, cy-3, S, 2);
        g.fillStyle(0xBB3333); g.fillCircle(cx, cy-8, 6);
        g.fillStyle(0xDD4444, 0.4); g.fillCircle(cx-1, cy-9, 3);
        g.fillStyle(0x888888); g.fillRect(cx-1, cy-14, 2, 6);
        g.fillStyle(0xBB3333); g.fillRect(cx-5, cy-14, 10, 2);
    });
    genTex(scene, 'equip_plumb_pipe', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0xcc8844); g.fillRect(cx-4, 0, 8, S);
        g.fillStyle(0xdd9955, 0.3); g.fillRect(cx-4, 0, 3, S);
        g.fillStyle(0xbb7733, 0.3); g.fillRect(cx+1, 0, 3, S);
        g.fillStyle(0xaa7733); g.fillRect(cx-5, 4, 10, 3); g.fillRect(cx-5, S-7, 10, 3);
        g.fillStyle(0x222222); g.fillRect(cx-5, cy-1, 10, 2);
    });
    genTex(scene, 'equip_plumb_gauge', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x555555); g.fillCircle(cx, cy, 12);
        g.fillStyle(0xddddcc); g.fillCircle(cx, cy, 10);
        g.fillStyle(0x222222, 0.3); g.fillRect(cx-8, cy, 16, 1);
        g.fillStyle(0xFF4444, 0.7); g.fillRect(cx, cy-8, 1, 8);
        g.fillStyle(0x333333); g.fillCircle(cx, cy, 1.5);
        g.fillStyle(0x00AF66, 0.4); g.fillRect(cx+2, cy-6, 4, 3);
        g.fillStyle(0xFF4444, 0.3); g.fillRect(cx-6, cy-6, 4, 3);
    });
    genTex(scene, 'equip_plumb_tank', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x4a5a6a); g.fillRect(6, 4, S-12, S-8);
        g.fillStyle(0x5a6a7a, 0.3); g.fillRect(6, 4, 3, S-8);
        g.fillStyle(0x3a4a5a, 0.3); g.fillRect(S-9, 4, 3, S-8);
        g.fillStyle(0x5a6a7a); g.fillRect(6, 3, S-12, 3); g.fillRect(6, S-6, S-12, 3);
        g.fillStyle(0xcc8844); g.fillRect(cx-1, 0, 3, 5);
        g.fillStyle(0x888888); g.fillRect(8, cy, 4, 4);
    });
}

// ── Level 6: IN THE DUCTS ──
function generateDuctEquipment(scene) {
    const bg = 0x424850;
    genTex(scene, 'equip_duct_damper', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x6a7a8c); g.fillRect(0, 6, S, 20);
        g.fillStyle(0x8a9aac, 0.5); g.fillRect(0, 6, S, 2);
        g.fillStyle(0x4a5a6c); g.fillRect(0, 24, S, 2);
        g.fillStyle(0xaa7733); g.fillRect(4, 10, S-8, 2); g.fillRect(4, 20, S-8, 2);
        g.fillStyle(0x888888); g.fillCircle(cx, 16, 3);
        g.fillStyle(0x5a6a7c, 0.8); g.fillRect(6, 12, S-12, 8);
    });
    genTex(scene, 'equip_duct_filter', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x8a9aaa); g.fillRect(4, 4, S-8, S-8);
        g.fillStyle(0x9aaabc, 0.3); g.fillRect(4, 4, S-8, 2);
        g.fillStyle(0x6a7a8a);
        for (let fy = 8; fy < S-8; fy += 3) g.fillRect(6, fy, S-12, 1);
        for (let fx = 8; fx < S-8; fx += 3) g.fillRect(fx, 6, 1, S-12);
        g.fillStyle(0x7a8a9a); g.fillRect(4, 4, S-8, 1); g.fillRect(4, S-5, S-8, 1);
        g.fillRect(4, 4, 1, S-8); g.fillRect(S-5, 4, 1, S-8);
    });
    genTex(scene, 'equip_duct_vane', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x5a6a7c); g.fillRect(2, 2, S-4, S-4);
        g.fillStyle(0x7a8a9c);
        for (let i = 0; i < 5; i++) g.fillRect(6+i*6, 4, 3, S-8);
        g.fillStyle(0x8a9aac, 0.4);
        for (let i = 0; i < 5; i++) g.fillRect(6+i*6, 4, 1, S-8);
    });
    genTex(scene, 'equip_duct_junction', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x6a7a8c); g.fillRect(0, cy-6, S, 12);
        g.fillStyle(0x6a7a8c); g.fillRect(cx-6, 0, 12, S);
        g.fillStyle(0x5a6a7c); g.fillRect(cx-8, cy-8, 16, 16);
        g.fillStyle(0x8a9aac, 0.3);
        for (let r = 3; r < S; r += 5) { g.fillCircle(r, cy-6, 1); g.fillCircle(r, cy+5, 1); }
        for (let r = 3; r < S; r += 5) { g.fillCircle(cx-6, r, 1); g.fillCircle(cx+5, r, 1); }
    });
    genTex(scene, 'equip_duct_flex', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x555560); g.fillCircle(cx, cy, 12);
        g.fillStyle(0x444450); g.fillCircle(cx, cy, 9);
        for (let r = 4; r <= 10; r += 2) {
            g.lineStyle(1, 0x666670, 0.4); g.strokeCircle(cx, cy, r);
        }
        g.fillStyle(0x333340); g.fillCircle(cx, cy, 3);
    });
    genTex(scene, 'equip_duct_register', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x8a9aaa); g.fillRect(4, 4, S-8, S-8);
        g.fillStyle(0x6a7a8a);
        for (let ly = 8; ly < S-8; ly += 4) g.fillRect(6, ly, S-12, 2);
        g.fillStyle(0x9aaabc, 0.4); g.fillRect(4, 4, S-8, 1);
        g.fillStyle(0x5a6a7a, 0.4); g.fillRect(4, S-5, S-8, 1);
    });
}

// ── Level 7: REFRIGERATION / FREEZER ──
function generateFreezerEquipment(scene) {
    const bg = 0x283850;
    genTex(scene, 'equip_freeze_door', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        groundShadow(g, 4, S-3, S-8, 3);
        // Door frame
        g.fillStyle(0x6a7a8a); g.fillRect(3, 1, S-6, S-3);
        g.fillStyle(0x7a8a9a, 0.4); g.fillRect(3, 1, S-6, 2); // top highlight
        g.fillStyle(0x5a6a7a, 0.3); g.fillRect(3, S-4, S-6, 2); // bottom shadow
        // Door panel
        g.fillStyle(0x4a5a6a); g.fillRect(5, 5, S-10, S-9);
        // Frost/ice effect on door
        g.fillStyle(0x60a5fa, 0.12); g.fillRect(5, 5, S-10, S-9);
        g.fillStyle(0xaaddff, 0.10); g.fillRect(7, 6, 8, 5); // frost patch
        g.fillStyle(0xffffff, 0.06); g.fillRect(7, 6, 5, 3); // ice crystal
        // Frost crystallization pattern
        g.fillStyle(0xccddff, 0.08);
        for (let i = 0; i < 8; i++) {
            const fx = 6 + (i * 7 + 3) % (S-14); const fy = 8 + (i * 11 + 2) % (S-18);
            g.fillRect(fx, fy, 2, 2);
        }
        // Heavy handle
        g.fillStyle(0x999999); g.fillRect(S-10, cy-3, 4, 8);
        g.fillStyle(0xbbbbbb, 0.4); g.fillRect(S-10, cy-3, 4, 2); // handle highlight
        g.fillStyle(0x777777, 0.4); g.fillRect(S-10, cy+3, 4, 2); // handle shadow
        // Temp indicator
        g.fillStyle(0x60a5fa, 0.7); g.fillRect(7, S-10, 3, 3);
        g.fillStyle(0xaaddff, 0.3); g.fillRect(8, S-9, 1, 1);
        // Seal gasket
        g.fillStyle(0x333344, 0.4); g.fillRect(4, 4, 1, S-8); g.fillRect(S-5, 4, 1, S-8);
    });
    genTex(scene, 'equip_freeze_coil', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x4a6a8a); g.fillRect(4, 4, S-8, S-8);
        g.fillStyle(0x3a5a7a);
        for (let cy2 = 8; cy2 < S-8; cy2 += 4) g.fillRect(6, cy2, S-12, 2);
        g.fillStyle(0xaaddff, 0.2); g.fillRect(4, 4, S-8, S-8);
        g.fillStyle(0xcc8844); g.fillRect(2, cy-2, 4, 4); g.fillRect(S-6, cy-2, 4, 4);
    });
    genTex(scene, 'equip_freeze_rack', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x6a7a8a); g.fillRect(4, 2, 3, S-4); g.fillRect(S-7, 2, 3, S-4);
        g.fillStyle(0x5a6a7a); g.fillRect(4, 6, S-8, 2); g.fillRect(4, 16, S-8, 2);
        g.fillRect(4, 26, S-8, 2); g.fillRect(4, 36, S-8, 2);
        g.fillStyle(0x4a5a6a, 0.5); g.fillRect(8, 8, 10, 6); g.fillRect(10, 18, 8, 6);
        g.fillRect(8, 28, 12, 6);
    });
    genTex(scene, 'equip_freeze_pipe', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0xcc8844); g.fillRect(cx-3, 0, 6, S);
        g.fillStyle(0xdd9955, 0.3); g.fillRect(cx-3, 0, 2, S);
        g.fillStyle(0x222222); g.fillRect(cx-4, 8, 8, 3); g.fillRect(cx-4, S-11, 8, 3);
        g.fillStyle(0xaaddff, 0.15); g.fillRect(cx-6, 0, 12, S);
    });
    genTex(scene, 'equip_freeze_vent', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x5a6a7a); g.fillRect(4, 4, S-8, S-8);
        g.fillStyle(0x3a4a5a);
        for (let vy = 8; vy < S-8; vy += 4) g.fillRect(6, vy, S-12, 2);
        g.fillStyle(0xaaddff, 0.2);
        g.fillRect(8, 10, S-16, S-20);
        g.fillStyle(0xffffff, 0.06); g.fillCircle(cx, cy, 6);
    });
    genTex(scene, 'equip_freeze_crate', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x4a5a6a); g.fillRect(4, 6, S-8, S-10);
        g.fillStyle(0x5a6a7a, 0.4); g.fillRect(4, 6, S-8, 2);
        g.fillStyle(0x3a4a5a); g.fillRect(6, 10, S-12, S-16);
        g.fillStyle(0xaaddff, 0.1); g.fillRect(4, 6, S-8, S-10);
        g.fillStyle(0xffffff, 0.08); g.fillRect(8, 8, 4, 4); g.fillRect(12, 10, 6, 2);
    });
}

// ── Level 8: ELEVATOR SYSTEMS ──
function generateElevatorEquipment(scene) {
    const bg = 0x262630;
    genTex(scene, 'equip_elev_motor', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x3a3a48); g.fillRect(4, 8, S-8, S-12);
        g.fillStyle(0x4a4a58, 0.4); g.fillRect(4, 8, S-8, 2);
        g.fillStyle(0x2a2a38); g.fillCircle(cx, cy, 8);
        g.fillStyle(0x4a4a58); g.fillCircle(cx, cy, 3);
        g.fillStyle(0x5a5a68, 0.5); g.fillRect(cx-6, cy-1, 4, 2); g.fillRect(cx+2, cy-1, 4, 2);
        g.fillStyle(0xcc8844); g.fillRect(S-6, 12, 3, 10);
        g.fillStyle(0x00AF66, 0.7); g.fillRect(6, 10, 2, 2);
        g.fillStyle(0x444444); g.fillRect(4, S-4, S-8, 3);
    });
    genTex(scene, 'equip_elev_cable', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x444450); g.fillCircle(cx, cy, 12);
        g.fillStyle(0x333340); g.fillCircle(cx, cy, 9);
        g.fillStyle(0x555560);
        for (let a = 0; a < 6; a++) {
            const ax = cx + Math.cos(a*1.05)*7; const ay = cy + Math.sin(a*1.05)*7;
            g.fillCircle(ax, ay, 1.5);
        }
        g.fillStyle(0x666670); g.fillCircle(cx, cy, 3);
        g.fillStyle(0x444450); g.fillCircle(cx, cy, 1.5);
    });
    genTex(scene, 'equip_elev_control', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x3a3a48); g.fillRect(6, 2, S-12, S-4);
        g.fillStyle(0x2a2a38); g.fillRect(8, 6, S-16, S-10);
        g.fillStyle(0x4a4a58, 0.3); g.fillRect(6, 2, S-12, 2);
        g.fillStyle(0x00AF66, 0.7); g.fillCircle(12, 10, 2);
        g.fillStyle(0xFF4444, 0.5); g.fillCircle(20, 10, 2);
        g.fillStyle(0xfbbf24, 0.5); g.fillCircle(28, 10, 2);
        g.fillStyle(0x1a1a28); g.fillRect(10, 16, S-20, 10);
        g.fillStyle(0x4ade80, 0.3); g.fillRect(12, 18, 8, 1); g.fillRect(12, 21, 12, 1);
    });
    genTex(scene, 'equip_elev_weight', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x4a4a58); g.fillRect(8, 2, S-16, S-4);
        g.fillStyle(0x5a5a68, 0.3); g.fillRect(8, 2, S-16, 2);
        g.fillStyle(0x3a3a48, 0.3); g.fillRect(8, S-4, S-16, 2);
        for (let i = 0; i < 4; i++) {
            g.fillStyle(0x3a3a48, 0.6); g.fillRect(10, 6+i*9, S-20, 6);
            g.fillStyle(0x4a4a58, 0.3); g.fillRect(10, 6+i*9, S-20, 1);
        }
    });
    genTex(scene, 'equip_elev_rail', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x5a5a68); g.fillRect(cx-3, 0, 6, S);
        g.fillStyle(0x6a6a78, 0.3); g.fillRect(cx-3, 0, 2, S);
        g.fillStyle(0x4a4a58); g.fillRect(cx-6, 4, 12, 3); g.fillRect(cx-6, S-7, 12, 3);
        g.fillRect(cx-6, cy-1, 12, 3);
        g.fillStyle(0x3a3a48); g.fillCircle(cx, 5, 1.5); g.fillCircle(cx, cy, 1.5); g.fillCircle(cx, S-5, 1.5);
    });
    genTex(scene, 'equip_elev_door', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x5a5a68); g.fillRect(2, 2, S-4, S-4);
        g.fillStyle(0x4a4a58); g.fillRect(4, 4, cx-5, S-8); g.fillRect(cx+1, 4, cx-5, S-8);
        g.fillStyle(0x6a6a78, 0.3); g.fillRect(4, 4, cx-5, 2); g.fillRect(cx+1, 4, cx-5, 2);
        g.fillStyle(0x333340); g.fillRect(cx-1, 4, 2, S-8);
        g.fillStyle(0xfbbf24, 0.4); g.fillCircle(cx-6, cy, 2); g.fillCircle(cx+6, cy, 2);
    });
}

// ── Level 9: DATA CENTER ──
function generateDataCenterEquipment(scene) {
    const bg = 0x1e2840;
    genTex(scene, 'equip_dc_rack', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        groundShadow(g, 4, S-3, S-8, 3);
        // Rack frame
        g.fillStyle(0x1a1e2e); g.fillRect(3, 1, S-6, S-3);
        g.fillStyle(0x242840, 0.4); g.fillRect(3, 1, S-6, 1); // top highlight
        // Server slots
        g.fillStyle(0x161a2a); g.fillRect(5, 3, S-10, S-7);
        for (let ry = 5; ry < S-5; ry += 5) {
            // Server unit
            g.fillStyle(0x1c2034); g.fillRect(6, ry, S-12, 4);
            g.fillStyle(0x222640, 0.4); g.fillRect(6, ry, S-12, 1); // unit highlight
            // LEDs per unit
            g.fillStyle(0x4ade80, 0.6); g.fillRect(8, ry+1, 1, 2);
            g.fillStyle(0x3b82f6, 0.5); g.fillRect(10, ry+1, 1, 2);
            g.fillStyle(0x4ade80, 0.3); g.fillRect(12, ry+1, 1, 1);
            // Drive bays
            g.fillStyle(0x0e1220, 0.6); g.fillRect(16, ry+1, 10, 2);
            g.fillStyle(0x3b82f6, 0.15); g.fillRect(17, ry+1, 2, 1); g.fillRect(20, ry+1, 2, 1);
        }
        // Rack rails
        g.fillStyle(0x2a2e42); g.fillRect(5, 1, 1, S-3); g.fillRect(S-6, 1, 1, S-3);
        // Top/bottom caps
        g.fillStyle(0x2a2e40); g.fillRect(3, 1, S-6, 2); g.fillRect(3, S-4, S-6, 2);
        // Blue ambient glow from LEDs
        g.fillStyle(0x3b82f6, 0.06); g.fillRect(3, 1, S-6, S-3);
    });
    genTex(scene, 'equip_dc_crac', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x3a4a5a); g.fillRect(4, 4, S-8, S-8);
        g.fillStyle(0x4a5a6a, 0.4); g.fillRect(4, 4, S-8, 2);
        for (let vy = 10; vy < S-8; vy += 3) { g.fillStyle(0x2a3a4a, 0.6); g.fillRect(6, vy, S-12, 1); }
        g.fillStyle(0x00AF66, 0.7); g.fillRect(8, 6, 2, 2);
        g.fillStyle(0x3b82f6, 0.15); g.fillRect(4, 4, S-8, S-8);
    });
    genTex(scene, 'equip_dc_ups', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x2a2a3a); g.fillRect(4, 4, S-8, S-8);
        g.fillStyle(0x3a3a4a, 0.4); g.fillRect(4, 4, S-8, 2);
        g.fillStyle(0x1a1a28); g.fillRect(8, 10, S-16, 8);
        g.fillStyle(0x4ade80, 0.4); g.fillRect(10, 12, 10, 1); g.fillRect(10, 15, 6, 1);
        g.fillStyle(0x00AF66, 0.8); g.fillCircle(cx, S-10, 3);
        g.fillStyle(0xfbbf24, 0.5); g.fillRect(8, S-14, 4, 2);
    });
    genTex(scene, 'equip_dc_pdu', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x2a2a3a); g.fillRect(cx-6, 2, 12, S-4);
        g.fillStyle(0x3a3a4a, 0.3); g.fillRect(cx-6, 2, 12, 2);
        for (let py = 8; py < S-6; py += 6) {
            g.fillStyle(0x1a1a28); g.fillRect(cx-4, py, 8, 4);
            g.fillStyle(0x00AF66, 0.5); g.fillRect(cx-2, py+1, 1, 2);
            g.fillStyle(0x4ade80, 0.3); g.fillRect(cx+1, py+1, 1, 2);
        }
    });
    genTex(scene, 'equip_dc_cable', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x3a3a48); g.fillRect(2, cy-4, S-4, 8);
        g.fillStyle(0x4a4a58, 0.3); g.fillRect(2, cy-4, S-4, 2);
        const colors = [0x3b82f6, 0xfbbf24, 0x4ade80, 0xef4444, 0xa855f7];
        colors.forEach((c, i) => { g.fillStyle(c, 0.4); g.fillRect(4, cy-3+i*1.5, S-8, 1); });
    });
    genTex(scene, 'equip_dc_fire', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0xCC2222); g.fillRect(8, 8, S-16, S-12);
        g.fillStyle(0xDD4444, 0.4); g.fillRect(8, 8, 3, S-12);
        g.fillStyle(0x444444); g.fillRect(10, 2, 8, 8);
        g.fillStyle(0x333333); g.fillRect(18, 4, 6, 2); g.fillRect(22, 4, 2, 6);
        g.fillStyle(0xFFFFFF, 0.4); g.fillCircle(cx, 6, 2);
        g.fillStyle(0xFFFFFF, 0.3); g.fillRect(10, 16, 8, 4);
        g.fillStyle(0x444444); g.fillRect(8, S-6, 14, 2);
    });
}

// ── Level 10: CONSTRUCTION SITE ──
function generateConstructionEquipment(scene) {
    const bg = 0x3c3628;
    genTex(scene, 'equip_con_beam', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x7a6a5a); g.fillRect(0, 8, S, 4); g.fillRect(0, S-12, S, 4);
        g.fillStyle(0x6a5a4a); g.fillRect(cx-2, 8, 4, S-20);
        g.fillStyle(0x8a7a6a, 0.3); g.fillRect(0, 8, S, 1); g.fillRect(0, S-12, S, 1);
        g.fillStyle(0x5a4a3a, 0.3); g.fillRect(0, 11, S, 1); g.fillRect(0, S-9, S, 1);
    });
    genTex(scene, 'equip_con_scaffold', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x6a6a7a); g.fillRect(4, 0, 3, S); g.fillRect(S-7, 0, 3, S);
        g.fillStyle(0x7a7a8a, 0.3); g.fillRect(4, 0, 1, S); g.fillRect(S-7, 0, 1, S);
        g.fillStyle(0x5a5a6a); g.fillRect(4, 8, S-8, 2); g.fillRect(4, S-10, S-8, 2);
        g.fillStyle(0x8a7a5a); g.fillRect(4, 6, S-8, 3);
        g.fillStyle(0x6a6a7a, 0.5); g.fillRect(6, 10, S-12, 1);
        g.fillRect(8, 12, 1, S-24); g.fillRect(S-9, 12, 1, S-24);
    });
    genTex(scene, 'equip_con_cone', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x000000, 0.15); g.fillCircle(cx, S-5, 10); // ground shadow
        // Cone body
        g.fillStyle(0xee6622);
        g.fillTriangle(cx, 3, cx-10, S-7, cx+10, S-7);
        // Reflective stripes
        g.fillStyle(0xdddddd, 0.7); g.fillRect(cx-7, 14, 14, 3); g.fillRect(cx-5, 24, 10, 3);
        // Cone highlight (left face lighter)
        g.fillStyle(0xff8844, 0.4);
        g.fillTriangle(cx, 3, cx-3, S-7, cx-10, S-7);
        // Cone shadow (right face darker)
        g.fillStyle(0xcc5511, 0.3);
        g.fillTriangle(cx, 3, cx+3, S-7, cx+10, S-7);
        // Tip highlight
        g.fillStyle(0xffaa55, 0.5); g.fillRect(cx-1, 3, 2, 3);
        // Base
        g.fillStyle(0x444444); g.fillRect(cx-10, S-7, 20, 3);
        g.fillStyle(0x555555, 0.3); g.fillRect(cx-10, S-7, 20, 1);
    });
    genTex(scene, 'equip_con_sawhorse', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0xee6622); g.fillRect(4, 10, S-8, 4);
        g.fillStyle(0xdddddd, 0.5); g.fillRect(4, 12, S-8, 2);
        g.fillStyle(0x8a7a5a); g.fillRect(6, 14, 3, S-18); g.fillRect(S-9, 14, 3, S-18);
        g.fillRect(12, 14, 3, S-18); g.fillRect(S-15, 14, 3, S-18);
        g.fillStyle(0x7a6a4a); g.fillRect(4, S-6, S-8, 2);
    });
    genTex(scene, 'equip_con_pallet', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x6a5a40); g.fillRect(2, S-6, S-4, 2); g.fillRect(2, S-12, S-4, 2);
        g.fillRect(4, S-12, 3, 8); g.fillRect(cx-1, S-12, 3, 8); g.fillRect(S-7, S-12, 3, 8);
        g.fillStyle(0x5a5a5a); g.fillRect(4, 2, S-8, S-16);
        g.fillStyle(0x6a6a6a, 0.3); g.fillRect(4, 2, S-8, 2);
        g.fillStyle(0x4a4a4a, 0.3); g.fillRect(cx-2, 4, 4, S-20);
    });
    genTex(scene, 'equip_con_barrel', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x000000, 0.15); g.fillRect(6, S-3, S-10, 3);
        g.fillStyle(0xee6622); g.fillRect(7, 4, S-14, S-8); g.fillRect(6, 8, S-12, S-16);
        g.fillStyle(0xff7733, 0.3); g.fillRect(7, 4, 3, S-8);
        g.fillStyle(0xcc5511, 0.3); g.fillRect(S-10, 4, 3, S-8);
        g.fillStyle(0xdd5500); g.fillRect(7, 3, S-14, 3); g.fillRect(7, S-6, S-14, 3);
        g.fillStyle(0x333333); g.fillRect(6, 12, S-12, 2); g.fillRect(6, S-14, S-12, 2);
        g.fillStyle(0x000000, 0.6); g.fillRect(9, 16, S-18, 4);
        g.fillStyle(0x000000, 0.4); g.fillRect(11, 16, 2, 4); g.fillRect(15, 16, 2, 4);
        g.fillRect(19, 16, 2, 4);
    });
}

// ── Level 11: FORGE CONFERENCE ──
function generateForgeEquipment(scene) {
    const bg = 0x2e2240;
    genTex(scene, 'equip_forge_speaker', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x222230); g.fillRect(6, 4, S-12, 24);
        g.fillStyle(0x1a1a28); g.fillRect(8, 6, S-16, 20);
        g.lineStyle(1, 0x3a3a48, 0.7); g.strokeCircle(cx, 14, 7);
        g.fillStyle(0x2a2a38); g.fillCircle(cx, 14, 3);
        g.lineStyle(1, 0x3a3a48, 0.5); g.strokeCircle(cx, 23, 3);
        g.fillStyle(0x2a2a38); g.fillCircle(cx, 23, 1.5);
        g.fillStyle(0x333340); g.fillRect(cx-2, 28, 4, 14);
        g.fillStyle(0x2a2a38); g.fillRect(cx-6, S-4, 12, 3);
        g.fillStyle(0xa855f7, 0.8); g.fillRect(10, 6, 2, 2);
    });
    genTex(scene, 'equip_forge_podium', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x3a2a1e); g.fillRect(8, 8, S-16, S-12);
        g.fillStyle(0x4a3a28); g.fillRect(10, 10, S-20, S-16);
        g.fillStyle(0x00AF66, 0.4); g.fillRect(cx-4, 16, 8, 6);
        g.fillStyle(0x5a4a38, 0.6); g.fillRect(8, 6, S-16, 4);
        g.fillStyle(0x555555); g.fillRect(S-14, 2, 2, 6);
        g.fillStyle(0x444444); g.fillCircle(S-13, 2, 2);
        g.fillStyle(0x2a1e14); g.fillRect(6, S-4, S-12, 3);
    });
    genTex(scene, 'equip_forge_camera', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x333340); g.fillRect(cx-8, 28, 2, 16); g.fillRect(cx+6, 28, 2, 16); g.fillRect(cx-1, 28, 2, 18);
        g.fillStyle(0x2a2a38); g.fillRect(6, 10, S-12, 18);
        g.fillStyle(0x1a1a28); g.fillCircle(cx, 18, 7);
        g.lineStyle(1, 0x4a4a58, 0.6); g.strokeCircle(cx, 18, 7);
        g.fillStyle(0x3b82f6, 0.2); g.fillCircle(cx, 18, 4);
        g.fillStyle(0x0a0a18); g.fillCircle(cx, 18, 2);
        g.fillStyle(0xff4444, 0.9); g.fillCircle(S-10, 12, 2);
        g.fillStyle(0x333344); g.fillRect(4, 12, 4, 6);
    });
    genTex(scene, 'equip_forge_chair', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x2e2240); g.fillRect(6, 18, S-12, 10);
        g.fillStyle(0x362848, 0.4); g.fillRect(6, 18, S-12, 2);
        g.fillStyle(0x342648); g.fillRect(8, 4, S-16, 16);
        g.fillStyle(0x3c2e50, 0.4); g.fillRect(8, 4, S-16, 2);
        g.fillStyle(0x444444); g.fillRect(4, 16, 4, 2); g.fillRect(S-8, 16, 4, 2);
        g.fillStyle(0x444450); g.fillRect(8, 28, 2, S-30); g.fillRect(S-10, 28, 2, S-30);
    });
    genTex(scene, 'equip_forge_screen', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        groundShadow(g, 4, S-3, S-8, 3);
        // Screen bezel
        g.fillStyle(0x1a1a28); g.fillRect(1, 1, S-2, 30);
        g.fillStyle(0x242436, 0.3); g.fillRect(1, 1, S-2, 1); // highlight
        // Screen
        g.fillStyle(0x0a0e1a); g.fillRect(3, 3, S-6, 26);
        // Presentation content — BuildOps branding
        g.fillStyle(0x00AF66, 0.4); g.fillRect(6, 6, 20, 3); // title
        g.fillStyle(0xa855f7, 0.3);
        g.fillRect(6, 12, 16, 1); g.fillRect(6, 15, 22, 1); g.fillRect(6, 18, 12, 1); g.fillRect(6, 21, 18, 1);
        // Chart/graphic area
        g.fillStyle(0x4ade80, 0.2);
        for (let bx = 22; bx < S-6; bx += 4) {
            const bh = 3 + (bx % 7);
            g.fillRect(bx, 24 - bh, 2, bh);
        }
        // Screen glow
        g.fillStyle(0xa855f7, 0.05); g.fillRect(0, 0, S, 32);
        // Screen reflection
        g.fillStyle(0xffffff, 0.03); g.fillRect(3, 3, S-6, 10);
        // Stand
        g.fillStyle(0x333340); g.fillRect(cx-2, 31, 4, 6);
        g.fillStyle(0x3a3a4a); g.fillRect(cx-8, 36, 16, 3);
        g.fillStyle(0x444450, 0.3); g.fillRect(cx-8, 36, 16, 1);
    });
    genTex(scene, 'equip_forge_light', (g) => {
        g.fillStyle(bg); g.fillRect(0, 0, S, S);
        g.fillStyle(0x444450); g.fillRect(cx-1, 0, 3, 8);
        g.fillStyle(0x333340); g.fillRect(6, 8, S-12, 12);
        g.fillStyle(0x3a3a48, 0.4); g.fillRect(6, 8, S-12, 2);
        g.fillStyle(0xfbbf24, 0.6); g.fillRect(10, 18, S-20, 4);
        g.fillStyle(0xfbbf24, 0.08); g.fillTriangle(10, 22, cx, S-2, S-10, 22);
        g.fillStyle(0xfbbf24, 0.04); g.fillTriangle(6, 20, cx, S, S-6, 20);
        g.fillStyle(0x2a2a38); g.fillRect(4, 10, 3, 8); g.fillRect(S-7, 10, 3, 8);
    });
}

// ── Helpers ──

// Draw a ground shadow ellipse under equipment
function groundShadow(g, x, y, w, h) {
    g.fillStyle(0x000000, 0.15);
    g.fillRect(x, y, w, h);
}

function genTex(scene, key, drawFn) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ add: false });
    drawFn(g);
    g.generateTexture(key, S, S);
    g.destroy();
}
