// PlayScene.js

const PLAYER_SPEED      = 250;   // px/s
const PLAYER_FIRE_RATE  = 300;   // ms between player shots
const ENEMY_BULLET_RATE = 5000;  // ms between enemy shots

class PlayScene extends Phaser.Scene {
  constructor () {
    super('PlayScene');
    this.diveTimer = null;        // wave‑3 kamikaze scheduler
  }

  create () {
    this.initGame();
  }

  update () {
    this.handlePlayerInput();
    this.maintainEnemies();

    // Advance to next wave when grid is empty
    if (this.waveActive && this.enemies.countActive() === 0) {
      this.endCurrentWave();
    }
  }

  // Game setup 
  initGame () {
    // state
    this.lives      = 2;   // starts at 2 but you earn 1 each new wave
    this.shield     = 1;   // 1 = blue hull, 0 = red (next hit kills life)
    this.score      = 0;
    this.wave       = 0;
    this.waveActive = false;
    this.canFire    = true;

    // groups
    this.playerBullets = this.physics.add.group();
    this.enemyBullets  = this.physics.add.group();
    this.enemies       = this.physics.add.group();

    // backdrop
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'background')
        .setScale(2.5)
        .setDepth(-2);
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT + 400, 'planet')
        .setOrigin(0.5, 1)
        .setScale(0.5)
        .setAlpha(0.6)
        .setDepth(-1);

    // player
    this.player = this.physics.add
      .sprite(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'player1')
      .setScale(0.5)
      .setCollideWorldBounds(true);

    // hud
    this.livesText = this.add.text(10, 10, 'Lives: 2', { fontSize: '16px' });
    this.scoreText = this.add
      .text(GAME_WIDTH - 10, 10, 'Score: 0', { fontSize: '16px' })
      .setOrigin(1, 0);
    this.waveText = this.add
      .text(GAME_WIDTH / 2, 10, 'Wave: 0', { fontSize: '16px' })
      .setOrigin(0.5, 0);

    // input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // collison
    this.physics.add.overlap(
      this.playerBullets,
      this.enemies,
      this.onPlayerBulletHitsEnemy,
      null,
      this
    );
    this.physics.add.overlap(
      this.enemyBullets,
      this.player,
      this.onEnemyBulletHitsPlayer,
      null,
      this
    );
    this.physics.add.overlap(
      this.enemies,
      this.player,
      this.onEnemyCollidesPlayer,
      null,
      this
    );

    // first wave
    this.time.delayedCall(750, () => this.spawnWave());
  }

  // input/movement
  handlePlayerInput () {
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-PLAYER_SPEED);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(PLAYER_SPEED);
    } else {
      this.player.setVelocityX(0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.fireKey) && this.canFire) {
      this.firePlayerBullet();
      this.canFire = false;
      this.time.delayedCall(PLAYER_FIRE_RATE, () => (this.canFire = true));
    }
  }

  // enemy maintenance
  maintainEnemies () {
    this.enemies.children.each(enemy => {
      if (!enemy.active) return;

      // Wave‑2 wrap‑around (enemies drift downward forever)
      if (
        this.wave === 2 &&
        enemy.getData('loopDown') &&
        enemy.y > GAME_HEIGHT + 30
      ) {
        enemy.y = -30;
      }

      // Wave‑3 kamikaze: despawn if they missed
      if (this.wave === 3 && enemy.getData('diving')) {
        const offScreen =
          enemy.y > GAME_HEIGHT + 50 ||
          enemy.y < -50 ||
          enemy.x < -50 ||
          enemy.x > GAME_WIDTH + 50;
        if (offScreen) enemy.disableBody(true, true);
      }
    });
  }

  // Wave flow
  endCurrentWave () {
    this.waveActive = false;
    if (this.diveTimer) {
      this.diveTimer.remove(false);
      this.diveTimer = null;
    }
    this.time.delayedCall(1500, () => this.spawnWave());
  }

  spawnWave () {
    this.wave += 1;
    this.lives += 1; // small reward each wave
    this.updateUI();

    const cols = 6;
    const rows = 2 + Math.min(this.wave, 4);
    const startY = 80;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 60 + c * 60;
        const y = startY + r * 50;
        const type = r % 2 === 0 ? 'enemy1' : 'enemy2';
        const enemy = this.enemies.create(x, y, type).setScale(0.5).setData('type', type);

        switch (this.wave) {
          case 2:
            enemy.setVelocityY(40).setData('loopDown', true);
            this.scheduleEnemyFire(enemy);
            break;
          case 3:
            enemy.setData('canShoot', false); // waits for dive
            break;
          default:
            this.tweens.add({
              targets: enemy,
              x: x + 40,
              yoyo: true,
              duration: 2000,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
            this.scheduleEnemyFire(enemy);
        }
      }
    }

    if (this.wave === 3) {
      this.diveTimer = this.time.addEvent({
        delay: 1200,
        callback: this.launchDive,
        callbackScope: this,
        loop: true,
      });
    }

    this.waveActive = true;
  }

  // Kamikaze dive (wave‑3)
  launchDive () {
    const idle = this.enemies.getChildren().find(e => e.active && !e.getData('diving'));
    if (!idle) return;

    idle.setData('diving', true);
    this.physics.moveToObject(idle, this.player, 200);
    idle.setAngle(
      Phaser.Math.RadToDeg(Math.atan2(idle.body.velocity.y, idle.body.velocity.x))
    );
  }

  // Firing helpers
  firePlayerBullet () {
    this.playerBullets
      .create(this.player.x, this.player.y - 20, 'bullet')
      .setVelocityY(-400);
    this.sound.play('shoot', { volume: 0.3 });
  }

  scheduleEnemyFire (enemy) {
    if (enemy.getData('canShoot') === false) return;
    this.time.addEvent({
      delay: Phaser.Math.Between(ENEMY_BULLET_RATE * 0.8, ENEMY_BULLET_RATE * 1.2),
      callback: () => this.enemyFire(enemy),
      loop: true,
    });
  }

  enemyFire (enemy) {
    if (!enemy.active || enemy.getData('diving')) return; // no bullets while diving
    this.enemyBullets
      .create(enemy.x, enemy.y + 20, 'bullet')
      .setTint(0xff4444)
      .setVelocityY(200);
  }

  // Collision callbacks
  onPlayerBulletHitsEnemy (bullet, enemy) {
    bullet.destroy();
    enemy.disableBody(true, true);
    this.sound.play('boom', { volume: 0.25 });
    this.addScore(enemy.getData('type') === 'enemy1' ? 100 : 150);
  }

  onEnemyBulletHitsPlayer (player, bullet) {
    bullet.destroy();
    this.damagePlayer();
  }

  onEnemyCollidesPlayer (player, enemy) {
    if (!enemy.active) return;
    enemy.disableBody(true, true);
    this.damagePlayer();
  }

  // Player damage
  damagePlayer () {
  this.blinkPlayer();

  if (this.shield > 0) {
    this.shield = 0;
    this.player.setTexture('player2');   // no shield, red hull
    this.time.delayedCall(800, () => this.physics.world.enable(this.player));
  } else {
    // ▸ Second hit -> lose a life -> reset to blue + full shield
    this.lives -= 1;
    this.shield = 1;
    this.player.setTexture('player1');   // <- back to normal sprite
    this.cameras.main.shake(150, 0.01);
    this.time.delayedCall(50, () => this.resetPlayerPosition());
    this.sound.play('boom', { volume: 0.25, detune: -1000 });

    if (this.lives <= 0) {
      this.scene.start('GameOverScene', { score: this.score });
      return;
    }
  }

  this.updateUI();
}

  blinkPlayer () {
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      duration: 80,
      yoyo: true,
      repeat: 5,
      onComplete: () => this.player.setAlpha(1),
    });
  }

  resetPlayerPosition () {
    this.player.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 50);
  }

  // UI helpers ---------------------------------------------------------------
  addScore (amount) {
    this.score += amount;
    this.updateUI();
  }

  updateUI () {
    this.scoreText.setText(`Score: ${this.score}`);
    this.livesText.setText(`Lives: ${this.lives}`);
    this.waveText.setText(`Wave: ${this.wave}`);
  }
}

window.PlayScene = PlayScene;
