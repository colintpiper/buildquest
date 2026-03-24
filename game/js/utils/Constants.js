// BuildQuest — Constants

export const GAME_WIDTH = 816;
export const GAME_HEIGHT = 624;
export const TILE_SIZE = 48;

// BuildQuest Brand Colors
export const COLORS = {
    GROUNDED_GREEN: 0x12221C,
    PRECISION_GREEN: 0x00AF66,
    FOCUS_GREEN: 0x19D979,
    OPS_ORANGE: 0xFFAE11,
    WEATHERED_WHITE: 0xFBFFED,
    WHITE: 0xFFFFFF,
    MIDNIGHT_GREEN: 0x061100,
    // Game-specific — dark blue-black palette
    BG_DARK: 0x070b14,
    FLOOR_LIGHT: 0x111a2e,
    FLOOR_DARK: 0x0f1628,
    WALL: 0x1e2845,
    RED: 0xFF4444,
    HEALTH_RED: 0xE74C3C,
    HEALTH_GREEN: 0x2ECC71,
    // Accent colors
    ACCENT_GREEN: 0x4ade80,
    ACCENT_BLUE: 0x3b82f6,
};

export const CSS_COLORS = {
    GROUNDED_GREEN: '#12221C',
    PRECISION_GREEN: '#00AF66',
    FOCUS_GREEN: '#19D979',
    OPS_ORANGE: '#FFAE11',
    WEATHERED_WHITE: '#FBFFED',
    WHITE: '#FFFFFF',
    MIDNIGHT_GREEN: '#061100',
};

// Stat colors — distinct per stat for visual identity
export const STAT_COLORS = {
    STR: { hex: 0xf87171, css: '#f87171' },   // Red — health/toughness
    SPD: { hex: 0x60a5fa, css: '#60a5fa' },   // Blue — speed/agility
    FIX: { hex: 0x4ade80, css: '#4ade80' },   // Green — repair skill
    BUFF: { hex: 0xfbbf24, css: '#fbbf24' },  // Gold — power-up boost
};

// Characters
export const CHARACTERS = [
    {
        id: 'hvac',
        name: 'HVAC Tech',
        description: 'Balanced',
        color: 0xFF8800,
        hatColor: 0xFF6600,
        stats: { STR: 3, SPD: 3, FIX: 4, BUFF: 3 },
    },
    {
        id: 'electrician',
        name: 'Electrician',
        description: 'Speed',
        color: 0xFFDD00,
        hatColor: 0xCCBB00,
        stats: { STR: 2, SPD: 5, FIX: 4, BUFF: 2 },
    },
    {
        id: 'plumber',
        name: 'Plumber',
        description: 'Tank',
        color: 0xDD3333,
        hatColor: 0xBB2222,
        stats: { STR: 5, SPD: 2, FIX: 3, BUFF: 2 },
    },
    {
        id: 'pm',
        name: 'Project Manager',
        description: 'Support',
        color: 0x4488CC,
        hatColor: 0x336699,
        stats: { STR: 3, SPD: 3, FIX: 2, BUFF: 5 },
    },
];

// Power-ups
export const POWERUPS = {
    OPSAI: {
        id: 'opsai',
        name: 'OpsAI Supercharge',
        feature: 'OpsAI',
        description: '2x all points',
        color: 0x19D979,
        duration: 10000,
        icon: 'star',
    },
    DISPATCH: {
        id: 'dispatch',
        name: 'Smart Dispatch Radar',
        feature: 'Smart Dispatch',
        description: 'Ranks jobs by efficiency + guides to best',
        color: 0xFFD700,
        duration: 10000,
        icon: 'radar',
    },
    PROPOSAL: {
        id: 'proposal',
        name: 'Proposal Magnet',
        feature: 'Proposals',
        description: 'Magnetic pull on nearby jobs',
        color: 0xFF6B35,
        duration: 6000,
        icon: 'magnet',
    },
    REPORTING: {
        id: 'reporting',
        name: 'Reporting Crystal Ball',
        feature: 'Reporting',
        description: 'Shows where obstacles will spawn',
        color: 0x8866FF,
        duration: 12000,
        icon: 'eye',
    },
    PORTAL: {
        id: 'portal',
        name: 'Customer Portal Shield',
        feature: 'Customer Portal',
        description: 'Invincibility',
        color: 0x00CCFF,
        duration: 5000,
        icon: 'shield',
    },
    WORKFLOW: {
        id: 'workflow',
        name: 'Workflow Automator',
        feature: 'Workflow Automation',
        description: 'Clears all obstacles',
        color: 0xFF66AA,
        duration: 0, // instant
        icon: 'bolt',
    },
};

export const POWERUP_LIST = Object.values(POWERUPS);

// Obstacles
export const OBSTACLE_TYPES = {
    CHANGE_ORDER: {
        id: 'change_order',
        name: 'Change Order',
        color: 0xFF6644,
        speed: 80,
        behavior: 'linear', // straight lines
        damage: 1,
        size: 27,
    },
    CALLBACK: {
        id: 'callback',
        name: 'Callback',
        color: 0xFF4488,
        speed: 40,
        behavior: 'chase', // follows player slowly
        damage: 1,
        size: 24,
    },
    PARTS_DELAY: {
        id: 'parts_delay',
        name: 'Parts Delay',
        color: 0x888888,
        speed: 0,
        behavior: 'stationary',
        damage: 1,
        size: 33,
        lifetime: 5000, // disappears after 5s
    },
};

// Level config (formerly "Wave")
export const WAVE_CONFIG = {
    BASE_TIME: 30, // seconds per level
    TIME_REDUCTION_PER_WAVE: 1, // lose 1 second each level
    MIN_TIME: 15,
    BASE_JOBS: 5,
    JOBS_PER_WAVE: 1,
    BASE_OBSTACLES: 1,
    OBSTACLES_PER_WAVE: 3,
    POWERUP_SPAWN_INTERVAL: 8000, // ms between power-up spawns
    JOB_BASE_VALUE: 500,
    JOB_VALUE_PER_WAVE: 200,
    BOSS_WAVE_INTERVAL: 5, // boss every 5th level
};

// Player base stats
export const PLAYER_BASE = {
    SPEED: 120, // base pixels/sec
    SPEED_PER_POINT: 25, // additional per SPD point
    HEALTH: 0, // base health (hearts shown = STR value directly)
    HEALTH_PER_POINT: 1, // additional per STR point
    FIX_TIME: 1500, // base ms to collect a job
    FIX_REDUCTION_PER_POINT: 150, // ms reduced per FIX point
    BUFF_MULTIPLIER: 0.15, // extra duration per BUFF point
};

// Scoring
export const SCORING = {
    BASE_MARGIN: 100, // start at 100% margin
    MARGIN_LOSS_PER_HIT: 15,
    MARGIN_LOSS_PER_SECOND: 0.5, // margin decays over time
    // Streak — diminishing returns after soft cap
    STREAK_BONUS_BASE: 300,
    STREAK_SOFT_CAP: 8,        // diminishing returns begin here
    STREAK_HARD_CAP: 25,       // absolute max streak counted
    STREAK_DECAY: 0.12,        // how fast diminishing kicks in
    // Multipliers — additive on base 1.0 (no longer multiplicative)
    FIRST_TIME_FIX_BONUS: 0.4, // +40% if no hits this wave
    OPSAI_BONUS: 0.75,         // +75% while OpsAI active
    // Wave completion bonus (not subject to multipliers)
    WAVE_CLEAR_BASE: 1000,
    WAVE_CLEAR_PER_LEVEL: 500,
};

// Tiers — 8 tiers with ~2.5x exponential spacing
export const TIERS = [
    { name: 'Apprentice', emoji: '🔧', min: 0 },
    { name: 'Journeyman', emoji: '⚡', min: 5000 },
    { name: 'Lead Tech', emoji: '🔥', min: 15000 },
    { name: 'Foreman', emoji: '🪖', min: 40000 },
    { name: 'Superintendent', emoji: '🌟', min: 100000 },
    { name: 'Master Contractor', emoji: '🏆', min: 250000 },
    { name: 'Operations Director', emoji: '👑', min: 600000 },
    { name: 'BuildOps Legend', emoji: '🔱', min: 1500000 },
];

// Map dimensions (in tiles)
export const MAP = {
    WIDTH: 17,
    HEIGHT: 13,
    WALL_THICKNESS: 1,
};
