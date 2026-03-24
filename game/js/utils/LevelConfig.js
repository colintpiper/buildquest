// BuildQuest: Level Configuration — Theme definitions & layouts per level
// All 11 unique themed levels

// ── THEME DEFINITIONS ──
// Each theme defines colors, equipment texture keys, floor/wall texture keys,
// a unique 17x13 tile layout, and ambient detail config.

export const THEMES = {
    // === Level 1: THE OFFICE — Cubicle maze, blue-gray tones ===
    office: {
        id: 'office',
        name: 'Office HQ',
        subtitle: 'NAVIGATE THE CUBICLES',
        floorColors: {
            base: 0x263454, mortarDark: 0x1c2840,
            patchLight: 0x304268, patchMid: 0x2c3c60,
            speckle: 0x384a72, wearDark: 0x182038,
        },
        wallColors: {
            base: 0x2e3c62, brickLight: 0x384878, brickMid: 0x344470,
            highlight: 0x425284, shadow: 0x243050, mortar: 0x1e2a48,
            capHighlight: 0x4a5a8a, capLight: 0x526290,
        },
        equipKeys: [
            'equip_office_desk', 'equip_office_chair', 'equip_office_monitor',
            'equip_office_whiteboard', 'equip_office_printer', 'equip_office_plant',
        ],
        floorKeys: ['tile_floor_office', 'tile_floor_office', 'tile_floor_office_b', 'tile_floor_office_c'],
        wallKey: 'tile_wall_office', wallTopKey: 'tile_wall_top_office',
        ambientColor: 0x3b82f6, ambientAlpha: 0.08,
        floorStyle: 'carpet', wallStyle: 'drywall',
        scuffColor: 0x0e1422, cobwebColor: 0x2a3a58,
        atmosphere: {
            colorWash: 0x3b82f6, colorWashAlpha: 0.12,
            vignetteColor: 0x0a1530, vignetteAlpha: 0.25,
            particles: {
                type: 'dust', direction: 'float', count: 14,
                color: 0xc4b8a0, colorAlt: 0x8899bb,
                sizeMin: 1, sizeMax: 2, alphaMin: 0.08, alphaMax: 0.20, speed: 'slow',
            },
        },
        layouts: [
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,2,0,0,2,0,0,0,2,0,0,2,2,0,1],
                [1,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,1],
                [1,0,2,2,0,0,2,0,0,0,2,0,0,2,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
                [1,0,0,0,0,0,0,2,0,2,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,2,0,2,0,0,0,0,0,0,1],
                [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
        ],
    },

    // === Level 2: THE ROOFTOP — Open sky, industrial gray ===
    rooftop: {
        id: 'rooftop',
        name: 'Rooftop',
        subtitle: 'WATCH YOUR STEP',
        floorColors: {
            base: 0x3a4050, mortarDark: 0x2c3240,
            patchLight: 0x4a5060, patchMid: 0x444a58,
            speckle: 0x525868, wearDark: 0x262c38,
        },
        wallColors: {
            base: 0x505a64, brickLight: 0x5c666e, brickMid: 0x586068,
            highlight: 0x687078, shadow: 0x424a52, mortar: 0x38404a,
            capHighlight: 0x6e7680, capLight: 0x767e88,
        },
        equipKeys: [
            'equip_hvac', 'equip_pipe', 'equip_gear',
            'equip_duct', 'equip_barrel', 'equip_fire',
        ],
        floorKeys: ['tile_floor_roof', 'tile_floor_roof', 'tile_floor_roof_b', 'tile_floor_roof_c'],
        wallKey: 'tile_wall_roof', wallTopKey: 'tile_wall_top_roof',
        ambientColor: 0x8899bb, ambientAlpha: 0.06,
        floorStyle: 'concrete', wallStyle: 'parapet',
        scuffColor: 0x181c22, cobwebColor: 0x3a4450,
        themeOverlay: { type: 'beacon' },
        animatedOverlays: [
            { equipIndex: 0, type: 'fan', color: 0x505a64, speed: 2000 },
        ],
        atmosphere: {
            colorWash: 0x6688aa, colorWashAlpha: 0.10,
            vignetteColor: 0x1a2030, vignetteAlpha: 0.20,
            particles: {
                type: 'streak', direction: 'streak', count: 10,
                color: 0xccddee, colorAlt: 0x8899bb,
                sizeMin: 1, sizeMax: 2, alphaMin: 0.06, alphaMax: 0.18, speed: 'fast',
            },
        },
        layouts: [
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
                [1,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,2,0,0,0,0,2,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,2,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
        ],
    },

    // === Level 3: MECHANICAL YARD — Outdoor concrete, industrial ===
    mechyard: {
        id: 'mechyard',
        name: 'Mechanical Yard',
        subtitle: 'HEAVY EQUIPMENT',
        floorColors: {
            base: 0x3c3e38, mortarDark: 0x2e302c,
            patchLight: 0x4a4c44, patchMid: 0x444640,
            speckle: 0x52544e, wearDark: 0x282a26,
        },
        wallColors: {
            base: 0x4a4c48, brickLight: 0x565854, brickMid: 0x525450,
            highlight: 0x626460, shadow: 0x3c3e3a, mortar: 0x343634,
            capHighlight: 0x6a6c6a, capLight: 0x727472,
        },
        equipKeys: [
            'equip_yard_chiller', 'equip_yard_generator', 'equip_yard_bollard',
            'equip_yard_fence', 'equip_yard_dumpster', 'equip_yard_pallet',
        ],
        floorKeys: ['tile_floor_yard', 'tile_floor_yard', 'tile_floor_yard_b', 'tile_floor_yard_c'],
        wallKey: 'tile_wall_yard', wallTopKey: 'tile_wall_top_yard',
        ambientColor: 0x8a9aa8, ambientAlpha: 0.05,
        floorStyle: 'concrete', wallStyle: 'corrugated',
        scuffColor: 0x1a1c1e, cobwebColor: 0x3a3e44,
        atmosphere: {
            colorWash: 0x7a8a60, colorWashAlpha: 0.10,
            vignetteColor: 0x1c2018, vignetteAlpha: 0.22,
            particles: {
                type: 'drip', direction: 'fall', count: 12,
                color: 0x4a4a30, colorAlt: 0x3a3a28,
                sizeMin: 1, sizeMax: 2, alphaMin: 0.10, alphaMax: 0.25, speed: 'medium',
            },
        },
        layouts: [
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,2,0,0,0,0,0,0,0,0,0,2,2,0,1],
                [1,0,2,2,0,0,0,0,0,0,0,0,0,2,2,0,1],
                [1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,1],
                [1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
        ],
    },

    // === Level 4: ELECTRICAL ROOM — Tight, red/yellow warning ===
    electrical: {
        id: 'electrical',
        name: 'Electrical Room',
        subtitle: 'DANGER HIGH VOLTAGE',
        floorColors: {
            base: 0x2c2238, mortarDark: 0x201a2c,
            patchLight: 0x382e48, patchMid: 0x342a42,
            speckle: 0x3e3450, wearDark: 0x1a1424,
        },
        wallColors: {
            base: 0x382c48, brickLight: 0x443658, brickMid: 0x403254,
            highlight: 0x504268, shadow: 0x2c2238, mortar: 0x241c30,
            capHighlight: 0x5a4c70, capLight: 0x625478,
        },
        equipKeys: [
            'equip_elec_panel', 'equip_elec_transformer', 'equip_elec_conduit',
            'equip_elec_junction', 'equip_elec_arcflash', 'equip_elec_cabinet',
        ],
        floorKeys: ['tile_floor_elec', 'tile_floor_elec', 'tile_floor_elec_b', 'tile_floor_elec_c'],
        wallKey: 'tile_wall_elec', wallTopKey: 'tile_wall_top_elec',
        ambientColor: 0xfbbf24, ambientAlpha: 0.06,
        floorStyle: 'vinyl', wallStyle: 'warning',
        scuffColor: 0x0e0a16, cobwebColor: 0x2a2038,
        themeOverlay: { type: 'hazard' },
        atmosphere: {
            colorWash: 0xfbbf24, colorWashAlpha: 0.14,
            vignetteColor: 0x2a1800, vignetteAlpha: 0.28,
            particles: {
                type: 'spark', direction: 'sparkle', count: 16,
                color: 0xfbbf24, colorAlt: 0xffffff,
                sizeMin: 1, sizeMax: 3, alphaMin: 0.15, alphaMax: 0.50, speed: 'fast',
            },
        },
        layouts: [
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
                [1,0,2,2,0,1,0,2,0,2,0,1,0,2,2,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,0,0,0,0,2,0,0,0,2,0,0,0,0,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,0,0,0,0,2,0,0,0,2,0,0,0,0,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,1,0,2,0,2,0,1,0,0,2,0,1],
                [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
                [1,0,2,0,0,1,0,2,0,2,0,1,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
        ],
    },

    // === Level 5: MECHANICAL ROOM (PLUMBING) — Warm red/orange, pipes ===
    plumbing: {
        id: 'plumbing',
        name: 'Mechanical Room',
        subtitle: 'WATCH THE PIPES',
        floorColors: {
            base: 0x382820, mortarDark: 0x2c1e18,
            patchLight: 0x443830, patchMid: 0x40342c,
            speckle: 0x4c4038, wearDark: 0x221a14,
        },
        wallColors: {
            base: 0x443428, brickLight: 0x504030, brickMid: 0x4c3c2c,
            highlight: 0x5c4c3c, shadow: 0x382a20, mortar: 0x2c2018,
            capHighlight: 0x665846, capLight: 0x6e604e,
        },
        equipKeys: [
            'equip_plumb_boiler', 'equip_plumb_heater', 'equip_plumb_valve',
            'equip_plumb_pipe', 'equip_plumb_gauge', 'equip_plumb_tank',
        ],
        floorKeys: ['tile_floor_plumb', 'tile_floor_plumb', 'tile_floor_plumb_b', 'tile_floor_plumb_c'],
        wallKey: 'tile_wall_plumb', wallTopKey: 'tile_wall_top_plumb',
        ambientColor: 0xf97316, ambientAlpha: 0.07,
        floorStyle: 'stone', wallStyle: 'ceramic',
        scuffColor: 0x120c0a, cobwebColor: 0x382820,
        themeOverlay: { type: 'pipes' },
        atmosphere: {
            colorWash: 0xf97316, colorWashAlpha: 0.12,
            vignetteColor: 0x2a1a10, vignetteAlpha: 0.25,
            particles: {
                type: 'drip', direction: 'fall', count: 14,
                color: 0x4488cc, colorAlt: 0xaaccdd,
                sizeMin: 1, sizeMax: 2, alphaMin: 0.10, alphaMax: 0.30, speed: 'medium',
            },
        },
        layouts: [
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,1,1,0,0,0,1,1,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,0,2,0,0,1,1,0,0,0,1,1,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,1,0,0,0,1,0,0,0,2,0,1],
                [1,0,0,0,0,0,1,0,2,0,1,0,0,0,0,0,1],
                [1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,0,0,0,0,0,0,2,0,0,0,0,0,0,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,0,0,0,0,0,1,0,2,0,1,0,0,0,0,0,1],
                [1,0,2,0,0,0,1,0,0,0,1,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
        ],
    },

    // === Level 6: IN THE DUCTS — Metallic silver, claustrophobic ===
    ducts: {
        id: 'ducts',
        name: 'In the Ducts',
        subtitle: 'TIGHT SQUEEZE',
        floorColors: {
            base: 0x424850, mortarDark: 0x363c42,
            patchLight: 0x505660, patchMid: 0x4c525a,
            speckle: 0x5a6068, wearDark: 0x30363c,
        },
        wallColors: {
            base: 0x5a6270, brickLight: 0x666e7a, brickMid: 0x626a76,
            highlight: 0x727a86, shadow: 0x4e5660, mortar: 0x444c56,
            capHighlight: 0x7a828e, capLight: 0x828a96,
        },
        equipKeys: [
            'equip_duct_damper', 'equip_duct_filter', 'equip_duct_vane',
            'equip_duct_junction', 'equip_duct_flex', 'equip_duct_register',
        ],
        floorKeys: ['tile_floor_duct', 'tile_floor_duct', 'tile_floor_duct_b', 'tile_floor_duct_c'],
        wallKey: 'tile_wall_duct', wallTopKey: 'tile_wall_top_duct',
        ambientColor: 0x94a3b8, ambientAlpha: 0.06,
        floorStyle: 'metal', wallStyle: 'metal_panel',
        scuffColor: 0x1e2226, cobwebColor: 0x444a52,
        animatedOverlays: [
            { equipIndex: 0, type: 'fan', color: 0x5a6270, speed: 1500 },
        ],
        atmosphere: {
            colorWash: 0x8090a8, colorWashAlpha: 0.10,
            vignetteColor: 0x1e2430, vignetteAlpha: 0.28,
            particles: {
                type: 'dust', direction: 'float', count: 16,
                color: 0xaab0b8, colorAlt: 0xddd8cc,
                sizeMin: 1, sizeMax: 2, alphaMin: 0.08, alphaMax: 0.22, speed: 'slow',
            },
        },
        layouts: [
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1],
                [1,0,2,0,1,0,2,0,0,0,2,0,1,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,1,0,2,0,0,0,2,0,1,0,2,0,1],
                [1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,1,0,0,0,0,0,1,0,0,2,0,1],
                [1,0,0,0,0,1,0,0,2,0,0,1,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,1,0,0,2,0,0,1,0,0,0,0,1],
                [1,0,2,0,0,1,0,0,0,0,0,1,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
        ],
    },

    // === Level 7: REFRIGERATION — Blue/white cold tones ===
    freezer: {
        id: 'freezer',
        name: 'Refrigeration',
        subtitle: 'STAY WARM',
        floorColors: {
            base: 0x283850, mortarDark: 0x1e2c42,
            patchLight: 0x344868, patchMid: 0x304260,
            speckle: 0x3c5072, wearDark: 0x182436,
        },
        wallColors: {
            base: 0x344a62, brickLight: 0x40587a, brickMid: 0x3c5474,
            highlight: 0x4c6488, shadow: 0x283c52, mortar: 0x203448,
            capHighlight: 0x587292, capLight: 0x607a9a,
        },
        equipKeys: [
            'equip_freeze_door', 'equip_freeze_coil', 'equip_freeze_rack',
            'equip_freeze_pipe', 'equip_freeze_vent', 'equip_freeze_crate',
        ],
        floorKeys: ['tile_floor_freeze', 'tile_floor_freeze', 'tile_floor_freeze_b', 'tile_floor_freeze_c'],
        wallKey: 'tile_wall_freeze', wallTopKey: 'tile_wall_top_freeze',
        ambientColor: 0x60a5fa, ambientAlpha: 0.10,
        floorStyle: 'frost', wallStyle: 'metal_panel',
        scuffColor: 0x0e1620, cobwebColor: 0x2a3a50,
        themeOverlay: { type: 'frost' },
        atmosphere: {
            colorWash: 0x60a5fa, colorWashAlpha: 0.16,
            vignetteColor: 0x081828, vignetteAlpha: 0.30,
            particles: {
                type: 'snow', direction: 'fall', count: 20,
                color: 0xddeeff, colorAlt: 0xffffff,
                sizeMin: 1, sizeMax: 3, alphaMin: 0.12, alphaMax: 0.35, speed: 'slow',
            },
        },
        layouts: [
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,2,0,0,0,0,0,0,0,2,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,1,0,1,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,1,0,1,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,2,0,0,0,0,0,0,0,2,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
        ],
    },

    // === Level 8: ELEVATOR SYSTEMS — Dark, vertical depth ===
    elevator: {
        id: 'elevator',
        name: 'Elevator Systems',
        subtitle: 'MIND THE SHAFT',
        floorColors: {
            base: 0x262630, mortarDark: 0x1c1c26,
            patchLight: 0x323240, patchMid: 0x2e2e3a,
            speckle: 0x3a3a48, wearDark: 0x181820,
        },
        wallColors: {
            base: 0x363640, brickLight: 0x42424e, brickMid: 0x3e3e4a,
            highlight: 0x4e4e5c, shadow: 0x2a2a34, mortar: 0x222230,
            capHighlight: 0x585864, capLight: 0x60606c,
        },
        equipKeys: [
            'equip_elev_motor', 'equip_elev_cable', 'equip_elev_control',
            'equip_elev_weight', 'equip_elev_rail', 'equip_elev_door',
        ],
        floorKeys: ['tile_floor_elev', 'tile_floor_elev', 'tile_floor_elev_b', 'tile_floor_elev_c'],
        wallKey: 'tile_wall_elev', wallTopKey: 'tile_wall_top_elev',
        ambientColor: 0xfbbf24, ambientAlpha: 0.04,
        floorStyle: 'metal', wallStyle: 'metal_panel',
        scuffColor: 0x0a0a10, cobwebColor: 0x28283a,
        themeOverlay: { type: 'shaft' },
        atmosphere: {
            colorWash: 0xccaa44, colorWashAlpha: 0.10,
            vignetteColor: 0x14140e, vignetteAlpha: 0.30,
            particles: {
                type: 'dust', direction: 'fall', count: 10,
                color: 0x666660, colorAlt: 0x888880,
                sizeMin: 1, sizeMax: 2, alphaMin: 0.08, alphaMax: 0.20, speed: 'medium',
            },
        },
        layouts: [
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,1,0,0,0,0,0,1,0,0,2,0,1],
                [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
                [1,0,2,0,0,1,0,0,0,0,0,1,0,0,2,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,1,0,0,0,1,0,0,0,2,0,1],
                [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
                [1,0,2,0,0,0,1,0,0,0,1,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
        ],
    },

    // === Level 9: DATA CENTER — Blue LED glow, server racks ===
    datacenter: {
        id: 'datacenter',
        name: 'Data Center',
        subtitle: 'HOT AISLE COLD AISLE',
        floorColors: {
            base: 0x1e2840, mortarDark: 0x141c32,
            patchLight: 0x2a3450, patchMid: 0x263048,
            speckle: 0x323e58, wearDark: 0x121828,
        },
        wallColors: {
            base: 0x283250, brickLight: 0x343e5c, brickMid: 0x303a58,
            highlight: 0x404c6a, shadow: 0x1e2840, mortar: 0x182238,
            capHighlight: 0x4a5674, capLight: 0x525e7c,
        },
        equipKeys: [
            'equip_dc_rack', 'equip_dc_crac', 'equip_dc_ups',
            'equip_dc_pdu', 'equip_dc_cable', 'equip_dc_fire',
        ],
        floorKeys: ['tile_floor_dc', 'tile_floor_dc', 'tile_floor_dc_b', 'tile_floor_dc_c'],
        wallKey: 'tile_wall_dc', wallTopKey: 'tile_wall_top_dc',
        ambientColor: 0x3b82f6, ambientAlpha: 0.12,
        floorStyle: 'vinyl', wallStyle: 'server',
        scuffColor: 0x080c14, cobwebColor: 0x1e2840,
        themeOverlay: { type: 'leds' },
        atmosphere: {
            colorWash: 0x2266dd, colorWashAlpha: 0.15,
            vignetteColor: 0x0a1028, vignetteAlpha: 0.28,
            particles: {
                type: 'datastream', direction: 'fall', count: 18,
                color: 0x4ade80, colorAlt: 0x3b82f6,
                sizeMin: 1, sizeMax: 2, alphaMin: 0.10, alphaMax: 0.30, speed: 'fast',
            },
        },
        layouts: [
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,2,0,2,0,0,0,2,0,2,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,2,0,2,0,0,0,2,0,2,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,2,0,2,0,0,0,2,0,2,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,2,0,2,0,0,0,2,0,2,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,2,0,0,0,0,0,2,0,0,2,0,1],
                [1,0,2,0,0,2,0,0,0,0,0,2,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,2,0,0,0,0,0,2,0,0,2,0,1],
                [1,0,2,0,0,2,0,0,0,0,0,2,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
        ],
    },

    // === Level 10: CONSTRUCTION SITE — Raw concrete, orange cones ===
    construction: {
        id: 'construction',
        name: 'Construction Site',
        subtitle: 'HARD HAT AREA',
        floorColors: {
            base: 0x3c3628, mortarDark: 0x2e2a1e,
            patchLight: 0x4a4434, patchMid: 0x464030,
            speckle: 0x524c3c, wearDark: 0x262218,
        },
        wallColors: {
            base: 0x4c4638, brickLight: 0x585244, brickMid: 0x544e40,
            highlight: 0x645e50, shadow: 0x403a2e, mortar: 0x343026,
            capHighlight: 0x6c665c, capLight: 0x746e64,
        },
        equipKeys: [
            'equip_con_beam', 'equip_con_scaffold', 'equip_con_cone',
            'equip_con_sawhorse', 'equip_con_pallet', 'equip_con_barrel',
        ],
        floorKeys: ['tile_floor_con', 'tile_floor_con', 'tile_floor_con_b', 'tile_floor_con_c'],
        wallKey: 'tile_wall_con', wallTopKey: 'tile_wall_top_con',
        ambientColor: 0xf97316, ambientAlpha: 0.06,
        floorStyle: 'concrete', wallStyle: 'corrugated',
        scuffColor: 0x141210, cobwebColor: 0x342e28,
        themeOverlay: { type: 'caution' },
        atmosphere: {
            colorWash: 0xdd8833, colorWashAlpha: 0.12,
            vignetteColor: 0x1e1408, vignetteAlpha: 0.25,
            particles: {
                type: 'dust', direction: 'float', count: 18,
                color: 0xc4a870, colorAlt: 0xb09060,
                sizeMin: 1, sizeMax: 3, alphaMin: 0.10, alphaMax: 0.28, speed: 'slow',
            },
        },
        layouts: [
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,1,1,0,1,1,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,1,1,0,1,1,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
        ],
    },

    // === Level 11: FORGE CONFERENCE — Stage + audience seating ===
    forge: {
        id: 'forge',
        name: 'Forge Conference',
        subtitle: 'THE BIG STAGE',
        floorColors: {
            base: 0x2e2240, mortarDark: 0x221a32,
            patchLight: 0x3c2e52, patchMid: 0x382a4c,
            speckle: 0x44365c, wearDark: 0x1a1228,
        },
        wallColors: {
            base: 0x3c2e54, brickLight: 0x483a64, brickMid: 0x443660,
            highlight: 0x544676, shadow: 0x302444, mortar: 0x261c38,
            capHighlight: 0x5e5080, capLight: 0x665888,
        },
        equipKeys: [
            'equip_forge_speaker', 'equip_forge_podium', 'equip_forge_camera',
            'equip_forge_chair', 'equip_forge_screen', 'equip_forge_light',
        ],
        floorKeys: ['tile_floor_forge', 'tile_floor_forge', 'tile_floor_forge_b', 'tile_floor_forge_c'],
        wallKey: 'tile_wall_forge', wallTopKey: 'tile_wall_top_forge',
        ambientColor: 0xa855f7, ambientAlpha: 0.08,
        floorStyle: 'polished', wallStyle: 'curtain',
        scuffColor: 0x0c0818, cobwebColor: 0x2a2040,
        themeOverlay: { type: 'stage' },
        atmosphere: {
            colorWash: 0x8844cc, colorWashAlpha: 0.16,
            vignetteColor: 0x140828, vignetteAlpha: 0.30,
            particles: {
                type: 'confetti', direction: 'fall', count: 14,
                color: 0xfbbf24, colorAlt: 0xa855f7,
                sizeMin: 1, sizeMax: 3, alphaMin: 0.10, alphaMax: 0.30, speed: 'slow',
            },
        },
        layouts: [
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,2,0,0,2,0,0,2,0,2,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,2,0,0,2,0,0,2,0,2,0,2,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,2,0,0,0,0,0,2,0,0,2,0,1],
                [1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1],
                [1,0,2,0,0,2,0,0,0,0,0,2,0,0,2,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
        ],
    },
};

// ── Map wave number to theme ──
export function getLevelTheme(wave) {
    const themeOrder = [
        'office', 'rooftop', 'mechyard', 'electrical', 'plumbing',
        'ducts', 'freezer', 'elevator', 'datacenter', 'construction', 'forge',
    ];
    const keys = Object.keys(THEMES);

    // Determine which theme to use
    let themeKey;
    if (wave <= 11) {
        themeKey = themeOrder[wave - 1];
    } else {
        // Loop through themes for wave > 11
        themeKey = themeOrder[(wave - 1) % 11];
    }
    const theme = THEMES[themeKey];

    // Resolve layout — pick from layouts array or fallback to layout
    let layout;
    if (theme.layouts) {
        if (wave <= 11) {
            layout = theme.layouts[0];
        } else {
            const idx = Math.floor(Math.random() * theme.layouts.length);
            layout = theme.layouts[idx];
        }
    } else {
        layout = theme.layout;
    }

    // Return theme with resolved layout
    return { ...theme, layout };
}
