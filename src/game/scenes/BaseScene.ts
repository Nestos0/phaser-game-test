// BaseScene.ts
// 这是一个所有场景都将继承的基类，用于共享公共属性和方法
export class BaseScene extends Phaser.Scene {
  // 公共的游戏尺寸属性，使用 readonly 确保只读
  public GAME_WIDTH: number;
  public GAME_HEIGHT: number;

  // 所有场景都可能需要的通用游戏对象
  public camera!: Phaser.Cameras.Scene2D.Camera;
  // public background!: Phaser.GameObjects.Image;
  public background!: Phaser.GameObjects.TileSprite;
  public keyboard!: Phaser.Input.Keyboard.KeyboardPlugin;
  public gameover: boolean = false;
  public overlapRef!: Phaser.Physics.Arcade.Collider;
  public ground!: Phaser.GameObjects.TileSprite;
  public bird!: Phaser.Physics.Arcade.Sprite;
  public pipes!: Phaser.Physics.Arcade.Group;

  HORIZONTAL_HEIGHT!: number;

  readonly PIPES_TO_RENDER = 5;

  constructor(key: string) {
    super(key);
  }

  // 一个通用的初始化方法，可以在子类的 create 方法中调用
  init(): void {
    this.GAME_WIDTH = Number(this.sys.game.config.width);
    this.GAME_HEIGHT = Number(this.sys.game.config.height);
    this.HORIZONTAL_HEIGHT = (this.GAME_HEIGHT / 8) * 7;
  }

  createDefaultMenu(
    scene: Phaser.Scene,
    x: number,
    y: number,
    labelText: string,
    onClick: () => void,
  ) {
    const width = 600; // 调整按钮尺寸
    const height = 800;
    const radius = 15;
    const fillColor = 0x4a4a4a; // 深色背景，适合暗/亮主题
    const textColor = '#ffffff';
    const fontSize = '24px';

    // 创建图形
    const graphics = scene.add.graphics();
    graphics.fillStyle(fillColor, 1);
    graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);

    const container = scene.add.container(0, 0).setDepth(1000);

    // 创建交互区域
    const zone = scene.add
      .zone(x, y, width, height)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const list = [];

    // 创建文本
    const text = scene.add
      .text(x, y - height / 2, labelText, {
        fontSize,
        color: textColor,
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
    container.add(graphics);
    container.add(text);

    // container.setAlpha(1);

    zone.on('pointerdown', onClick);

    return { graphics, zone, container };
  }
}
