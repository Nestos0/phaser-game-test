import { EventBus } from '../EventBus';
import { BaseScene } from './BaseScene';

function createDefaultButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  labelText: string,
  onClick: () => void,
) {
  const width = 800;
  const height = 1000;
  const radius = 15;
  const fillColor = 0xfafafa;
  const textColor = '#ffffff';
  const fontSize = '24px';

  const graphics = scene.add.graphics();
  graphics.fillStyle(fillColor, 1);
  graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);

  const zone = scene.add
    .zone(x, y, width, height)
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  const text = scene.add
    .text(x, y, labelText, {
      fontSize,
      color: textColor,
      fontFamily: 'sans-serif',
    })
    .setOrigin(0.5);

  graphics.clear();
  graphics.fillStyle(fillColor, 1);
  graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius).setDepth(1000);

  zone.on('pointerdown', onClick);

  // 返回对象供外部操作
  return { graphics, zone, text };
}

export class TitleScene extends BaseScene {
  // public bg!: Phaser.GameObjects.Image;
  run: boolean = true;
  gamestart: boolean = false;
  next_posX: number;
  pos: number[][] = [];

  constructor() {
    // 使用唯一的 key "TitleScene" 来注册场景
    super('TitleScene');
  }

  preload() {
    this.pipes = this.physics.add.group();
  }

  create() {
    // 调用基类的通用初始化方法

    // 创建标题场景的UI
    this.background = this.add
      .tileSprite(0, 0, this.GAME_WIDTH, this.HORIZONTAL_HEIGHT, 'background')
      .setOrigin(0)
      .setScale(2.4);

    this.add
      .image(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2 - 100, 'title')
      .setScale(2.5)
      .setDepth(100);

    this.ground = this.add
      .tileSprite(0, this.HORIZONTAL_HEIGHT, this.GAME_WIDTH, 85, 'ground')
      .setOrigin(0)
      .setScale(1, 2)
      .setDepth(100);

    this.add
      .text(this.GAME_WIDTH / 2, (this.GAME_HEIGHT / 4) * 3 + 50, '按下空格键开始游戏', {
        fontSize: '32px',
        color: '#555',
        // backgroundColor: "#00000000",
        padding: { x: 0, y: 0 },
      })
      .setOrigin(0.5);

    this.next_posX = this.GAME_WIDTH / 2 - 400;
    const posX = this.GAME_WIDTH / 2 - 600;
    const posY = this.GAME_HEIGHT / 2 - 100;

    this.generatePipe();

    this.bird = this.physics.add.sprite(posX, posY, 'bird').setOrigin(0.5).setScale(2);
    this.bird.setAccelerationX(200);
    this.bird.anims.play('fly');

    // 监听空格键，开始游戏场景
    this.input.keyboard?.once('keydown-SPACE', () => {
      // this.scene.start("GameScene", { ground: this.ground });
      this.gamestart = true;
    });

    // createDefaultButton(this, this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2, '开始游戏', () => {
    //   this.scene.start('GameScene');
    // });

    EventBus.emit('current-scene-ready', this);
  }

  update() {
    const vx = this.bird.body!.velocity.x;
    const vy = this.bird.body!.velocity.y;

    // 控制 Y 加速度
    if (!this.gamestart) {
      if (vy > 40) {
        this.bird.setAccelerationY(-50);
      } else if (vy < -40) {
        this.bird.setAccelerationY(50);
      }

      // 控制 X 加速度
      if (vx > 150) {
        this.bird.setAccelerationX(-150);
        if (this.run) {
          this.bird.setAccelerationY(-50);
          this.run = false;
        }
      } else if (vx < -150) {
        this.bird.setAccelerationX(150);
      }
    } else {
      this.bird.setVelocity(
        (this.next_posX - this.bird.body!.position.x) * 2,
        (this.GAME_HEIGHT / 2 - 100 - this.bird.body!.position.y) * 2,
      );

      if (
        Phaser.Math.Fuzzy.Equal(this.bird.body!.position.x, this.next_posX, 100) &&
        Phaser.Math.Fuzzy.Equal(this.bird.body!.position.y, this.GAME_HEIGHT / 2 - 100, 100)
      ) {
        this.registry.set('pipePosition', this.pos);
        this.scene.start('GameScene');
      }
    }
  }

  placePipe(uPipe: Phaser.Physics.Arcade.Sprite, lPipe: Phaser.Physics.Arcade.Sprite): number[] {
    const rightMostX = this.getRightMostX();
    const pipeHorizontalDistance = Phaser.Math.Between(500, 600);
    const pipeVerticalDistance = Phaser.Math.Between(180, 250);
    const pipeUpperPos = Phaser.Math.Between(this.GAME_HEIGHT / 8, this.GAME_HEIGHT / 2);

    uPipe.setPosition(rightMostX + pipeHorizontalDistance, pipeUpperPos);
    lPipe.setPosition(rightMostX + pipeHorizontalDistance, pipeUpperPos + pipeVerticalDistance);
    return [pipeHorizontalDistance, pipeVerticalDistance, pipeUpperPos];
  }

  generatePipe() {
    for (let i = 0; i < this.PIPES_TO_RENDER; i++) {
      // const gameWidth = Number(this.sys.game.config.width);
      const upperPipe = this.pipes
        .create(this.GAME_WIDTH / 2, 0, 'pipe')
        .setOrigin(0.5, 1)
        .setScale(2)
        .setFlipY(true);
      const lowerPipe = this.pipes
        .create(this.GAME_WIDTH / 2, 0, 'pipe')
        .setOrigin(0.5, 0)
        .setScale(2);
      this.pos.push(this.placePipe(upperPipe, lowerPipe));
    }
  }

  getRightMostX(): number {
    let rightMostX = 0;
    this.pipes.getChildren().forEach((child) => {
      const pipe = child as Phaser.Physics.Arcade.Sprite;
      rightMostX = Math.max(pipe.x, rightMostX);
    });
    return rightMostX;
  }
}
