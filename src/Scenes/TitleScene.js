// TitleScene.js
class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload() {
    this.load.image('player1', 'assets/player1.png');
    this.load.image('player2', 'assets/player2.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('enemy1', 'assets/enemy1.png');
    this.load.image('enemy2', 'assets/enemy2.png');
    this.load.audio('shoot',  'assets/shoot.wav');
    this.load.audio('boom',   'assets/explode.wav');
    this.load.image('planet', 'assets/planet.png');
    this.load.image('background', 'assets/background.png');
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 40, 'SPACE DEFENSE', {
      fontSize: '32px',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, 'Press SPACE to Start', {
      fontSize: '16px'
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('PlayScene');
    });
  }
}

window.TitleScene = TitleScene;
