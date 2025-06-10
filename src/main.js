// main.js
// debug with extreme prejudice
"use strict";


var my = { sprite: {} };

const GAME_WIDTH  = 480;
const GAME_HEIGHT = 640;

let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: { pixelArt: true },
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0x000000,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [TitleScene, PlayScene, GameOverScene]
};

const game = new Phaser.Game(config);
