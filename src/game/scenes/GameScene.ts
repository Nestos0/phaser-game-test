// File: src/scenes/GameScene.ts
import { EventBus } from '../EventBus';
import { BaseScene } from './BaseScene';

export class GameScene extends BaseScene {
  private score = 0;
  private scoredPipes = new Set<Phaser.Physics.Arcade.Sprite>();
  private posList: number[][] = [];
  private scoreContainer!: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics | null = null;
  public playover: boolean;

  constructor() {
    super('GameScene');
  }

  preload() {
    this.pipes = this.physics.add.group();
    this.posList = this.registry.get('pipePosition') || [];
  }

  create() {
    this.setupBackground();
    this.setupBird();
    this.setupInput();
    this.setupPipes();
    this.setupScoreDisplay();
    this.events.on('update', () => {
      // console.log(this.playover);
      if (!this.graphics && this.playover) {
        console.log(this.playover);
        let obj = this.createDefaultMenu(
          this,
          this.GAME_WIDTH / 2,
          this.GAME_HEIGHT / 2,
          'TEST LABEL',
          () => {},
        );
        this.graphics = obj.graphics;
        fadeIn(this, this.graphics, 300);
      }
    });
    this.debug();
    EventBus.emit('current-scene-ready', this);
  }

  update() {
    if (this.gameover) {
      this.handleGameOverFall();
    } else {
      this.animateBackground();
      this.recyclePipes();
      this.updateScore();
    }
    this.checkBounds();
    this.rotateBird();
  }

  private setupBackground() {
    const { GAME_WIDTH, HORIZONTAL_HEIGHT } = this;

    this.ground = this.add
      .tileSprite(0, HORIZONTAL_HEIGHT, GAME_WIDTH, 85, 'ground')
      .setOrigin(0)
      .setScale(1, 2)
      .setDepth(100);

    this.background = this.add
      .tileSprite(0, 0, GAME_WIDTH, HORIZONTAL_HEIGHT, 'background')
      .setOrigin(0)
      .setScale(2.4);
  }

  private setupBird() {
    const { GAME_WIDTH, GAME_HEIGHT } = this;
    const x = GAME_WIDTH / 2 - 400;
    const y = GAME_HEIGHT / 2 - 100;

    this.bird = this.physics.add.sprite(x, y, 'bird').setOrigin(0.5).setScale(2).setGravityY(980);
    this.bird.anims.play('fly');

    this.camera = this.cameras.main;
  }

  private setupInput() {
    this.input.on('pointerdown', () => {
      this.bird.setVelocityY(250);
    });
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.gameover && this.playover) this.restartGame();
      else if (!this.gameover) this.bird.setVelocityY(-400);
    });
    this.overlapRef = this.physics.add.overlap(this.bird, this.pipes, () => this.gameoverAni());
  }

  private setupPipes() {
    this.generatePipes(this.posList);
    this.pipes
      .getChildren()
      .forEach((c) => ((c as Phaser.Physics.Arcade.Sprite).body!.immovable = true));
  }

  private setupScoreDisplay() {
    this.scoreContainer = this.add.container(0, 50).setDepth(1000);
    this.renderScore();
  }

  private animateBackground() {
    this.ground.tilePositionX += 2;
    this.background.tilePositionX += 0.1;
  }

  private rotateBird() {
    const angle = Phaser.Math.Linear(
      this.bird.angle,
      mapVelocityToAngle(this.bird.body!.velocity.y, -300, 300, -30, 45),
      0.1,
    );
    this.bird.setAngle(angle);
  }

  private checkBounds() {
    const limitY = this.HORIZONTAL_HEIGHT;
    if (this.bird.y >= limitY - this.bird.height || this.bird.y <= 0) {
      if (!this.gameover) {
        this.gameoverAni();
      } else {
        this.handleGameOverFall();
      }
      this.bird.setDrag(400);
    }
  }

  private updateScore() {
    this.pipes.getChildren().forEach((child) => {
      const pipe = child as Phaser.Physics.Arcade.Sprite;
      if (
        !this.scoredPipes.has(pipe) &&
        pipe.x < this.bird.x &&
        this.bird.x < pipe.x + pipe.width &&
        pipe.flipY
      ) {
        this.scoredPipes.clear();
        this.scoredPipes.add(pipe);
        this.score++;
        this.renderScore();
      }
    });
  }

  private renderScore() {
    this.scoreContainer.removeAll(true);
    const digits = String(this.score).split('');
    digits.forEach((d, i) =>
      this.scoreContainer.add(
        this.add
          .image(this.GAME_WIDTH / 2 + (i - digits.length / 2) * 48, 50, 'number', Number(d))
          .setScale(2),
      ),
    );
  }

  private recyclePipes() {
    const outOfBounds: Phaser.Physics.Arcade.Sprite[] = [];
    this.pipes.getChildren().forEach((c) => {
      const pipe = c as Phaser.Physics.Arcade.Sprite;
      if (pipe.getBounds().right <= 0) outOfBounds.push(pipe);
    });
    if (outOfBounds.length === 2) {
      const [upperPipe, lowerPipe] = outOfBounds;
      this.placePipe(upperPipe, lowerPipe);
    }
  }

  private placePipe(
    uPipe: Phaser.Physics.Arcade.Sprite,
    lPipe: Phaser.Physics.Arcade.Sprite,
    pos?: number[],
  ) {
    const offsetX = pos?.[0] ?? Phaser.Math.Between(500, 600);
    const gapY = pos?.[1] ?? Phaser.Math.Between(180, 250);
    const upperY = pos?.[2] ?? Phaser.Math.Between(this.GAME_HEIGHT / 5, this.GAME_HEIGHT / 2);

    const x = this.getRightMostX() + offsetX;
    uPipe.setPosition(x, upperY);
    lPipe.setPosition(x, upperY + gapY);
  }

  private restartGame() {
    this.overlapRef.active = true;
    this.gameover = false;
    this.pipes.clear(true, true);
    this.setupPipes();
    this.bird.setGravityY(980).setVelocity(0).setAcceleration(0).setDrag(0);
    const { GAME_WIDTH, GAME_HEIGHT } = this;
    this.bird.setPosition(GAME_WIDTH / 2 - 400, GAME_HEIGHT / 2 - 100);
    this.bird.anims.play('fly');
    this.graphics!.destroy();
    this.events.once('update', () => {
      this.graphics = null; // 防止再使用
    });
    this.scoredPipes.clear();
    this.score = 0;
    this.playover = false;
    this.renderScore();
  }

  private handleGameOverFall() {
    if (this.bird.y >= this.HORIZONTAL_HEIGHT + this.bird.height / 2) {
      this.bird
        .setVelocityY(0)
        .setGravityY(0)
        .setY(this.HORIZONTAL_HEIGHT - this.bird.height / 2);
      this.playover = true;
    }
  }

  private getRightMostX(): number {
    return this.pipes
      .getChildren()
      .reduce((max, c) => Math.max((c as Phaser.Physics.Arcade.Sprite).x, max), 0 as number);
  }

  private debug() {
    const g = this.add.graphics().lineStyle(2, 0xffffff, 1);
    const { width, height } = this.sys.game.config;
    g.strokeCircle((width as number) / 2, (height as number) / 2, 0); // dummy
  }

  private gameoverAni() {
    this.overlapRef.active = false;
    this.pipes.setVelocityX(0);
    this.bird.setVelocityX(300);
    this.bird.setDrag(150);
    this.bird.setVelocityY(-500);
    this.time.delayedCall(200, () => {
      this.gameover = true;
      this.bird.anims.pause();
      this.pipes.setVelocityX(0);
      this.bird.setGravityY(2080);
      this.bird.setDepth(900);
    });
  }

  generatePipes(pos?: number[][]) {
    for (let i = 0; i < this.PIPES_TO_RENDER; i++) {
      const upperPipe = this.pipes
        .create(this.GAME_WIDTH / 2, 0, 'pipe')
        .setOrigin(0.5, 1)
        .setScale(2)
        .setFlipY(true);
      const lowerPipe = this.pipes
        .create(this.GAME_WIDTH / 2, 0, 'pipe')
        .setOrigin(0.5, 0)
        .setScale(2);
      if (pos) {
        this.placePipe(upperPipe, lowerPipe, pos[i]);
      } else {
        this.placePipe(upperPipe, lowerPipe);
      }
    }

    this.pipes.setVelocityX(-200);
  }
}

export function fadeIn(scene: GameScene, obj: Phaser.GameObjects.Graphics, duration = 500) {
  obj.setAlpha(0);
    scene.tweens.add({
      targets: obj,
      alpha: 1,
      duration,
      ease: 'Linear',
    });
}

export function fadeOut(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject,
  duration = 500,
  onComplete?: () => void,
) {
  scene.tweens.add({
    targets: obj,
    alpha: 0,
    duration,
    ease: 'Linear',
    onComplete: () => {
      if (onComplete) onComplete();
    },
  });
}

function mapVelocityToAngle(
  v: number,
  minV: number,
  maxV: number,
  minAngle: number,
  maxAngle: number,
): number {
  const norm = ((Phaser.Math.Clamp(v, minV, maxV) - minV) / (maxV - minV)) ** 2;
  return minAngle + norm * (maxAngle - minAngle);
}
