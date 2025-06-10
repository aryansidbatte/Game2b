// GameOverScene.js

class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data) {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 40, 'GAME OVER', {
      fontSize: '32px',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, `Score: ${data.score}`, {
      fontSize: '20px'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 40, 'Press SPACE to Retry', {
      fontSize: '16px'
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('PlayScene');
    });
  }
}

window.GameOverScene = GameOverScene;
