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
        // 在基类中初始化游戏尺寸
        // this.GAME_WIDTH = 800; // 默认值
        // this.GAME_HEIGHT = 600; // 默认值
    }

    // 一个通用的初始化方法，可以在子类的 create 方法中调用
    init(): void {
        this.GAME_WIDTH = Number(this.sys.game.config.width);
        this.GAME_HEIGHT = Number(this.sys.game.config.height);
        this.HORIZONTAL_HEIGHT = (this.GAME_HEIGHT / 8) * 7;
    }
}