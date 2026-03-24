// BuildQuest — Main Entry Point

import Boot from './scenes/Boot.js';
import Menu from './scenes/Menu.js';
import NameEntry from './scenes/NameEntry.js';
import MeetTheTeam from './scenes/MeetTheTeam.js';
import HowToPlay from './scenes/HowToPlay.js';
import TipsScoring from './scenes/TipsScoring.js';
import CharacterSelect from './scenes/CharacterSelect.js';
import Game from './scenes/Game.js';
import GameOver from './scenes/GameOver.js';
import Leaderboard from './scenes/Leaderboard.js';

const config = {
    type: Phaser.AUTO,
    width: 816,
    height: 624,
    parent: 'game-container',
    backgroundColor: '#061100',
    pixelArt: true,
    roundPixels: true,
    disableVisibilityChange: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 400,
            height: 300,
        },
        max: {
            width: 1600,
            height: 1200,
        },
    },
    scene: [Boot, Menu, NameEntry, MeetTheTeam, HowToPlay, TipsScoring, CharacterSelect, Game, GameOver, Leaderboard],
    input: {
        activePointers: 2,
    },
};

const game = new Phaser.Game(config);
window.__bqGame = game;

// Prevent Phaser from pausing when tab loses focus
game.events.on('ready', () => {
    game.loop.wake();
});
document.addEventListener('visibilitychange', () => {
    game.loop.wake();
});
