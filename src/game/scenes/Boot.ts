import { EventBus } from "../EventBus";

export class Boot extends Phaser.Scene {
    private GAME_WIDTH: number;
    private GAME_HEIGHT: number;
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    brick: Phaser.GameObjects.Sprite;
    keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
    bird: Phaser.Physics.Arcade.Sprite;
    pipes: Phaser.Physics.Arcade.Group;

    PIPES_TO_RENDER: number = 5;

    initbirdPosition: number = 200;

    constructor() {
        super("Boot");
    }

    preload() {
        this.GAME_WIDTH = Number(this.sys.game.config.width || 800);
        this.GAME_HEIGHT = Number(this.sys.game.config.height || 600);
        this.pipes = this.physics.add.group();
        // Boot 场景只加载 Preloader 所需资源
        this.load.spritesheet("bird", "assets/bird.png", {
            frameWidth: 34,
            frameHeight: 24,
        });
        this.load.image("background", "assets/bg.png");
        this.load.image("pipe", "assets/pipe.png");
    }

    create() {
        this.add.image(0, 0, "background").setOrigin(0).setScale(2);
        // ✅ Safely access game config width with type assertion
        const posX = this.GAME_WIDTH / 2 - 400; // Fallback to 800 if undefined
        const posY = this.GAME_HEIGHT / 2 - 100;

        // ✅ Assign bird sprite
        this.bird = this.physics.add
            .sprite(posX, posY, "bird")
            .setOrigin(0.5)
            .setScale(2);

        this.bird.setGravityY(980);

        // this.physics.add.sprite(900, 300, "pipe").setOrigin(0.5, 1).setScale(2).setFlipY(true)
        // this.physics.add.sprite(900, 500, "pipe").setOrigin(0.5, 0).setScale(2)

        this.camera = this.cameras.main;
        // this.camera.setBackgroundColor(0x00ff00);

        this.generatePipe();

        this.input.on("pointerdown", () => {
            this.bird.setVelocityY(250);
            this.bird.setAccelerationY(-500);
        });

        this.input.keyboard?.on("keydown-SPACE", () => {
            this.bird.setVelocityY(-400);
            // this.bird.setAccelerationY(500)
        });

        this.physics.add.collider(this.bird, this.pipes, () => {
            // 碰撞回调：比如重启游戏
            this.restartgame(this.bird);
        });

        this.pipes
            .getChildren()
            .forEach((child: Phaser.GameObjects.GameObject) => {
                const pipe = child as Phaser.Physics.Arcade.Sprite;
                pipe.body!.immovable = true;
                return true;
            });

        EventBus.emit("current-scene-ready", this);
    }

    update() {
        // ✅ Use game canvas width with type safety
        const gameWidth = Number(this.sys.game.config.height || 800);
        if (this.bird.y >= gameWidth - this.bird.height * 2) {
            this.restartgame(this.bird);
        } else if (this.bird.y - this.bird.height * 2 <= 0) {
            this.restartgame(this.bird);
        }
        this.recycle();
    }

    restartgame(bird: Phaser.Physics.Arcade.Sprite) {
        const posX = this.GAME_WIDTH / 2 - 400; // Fallback to 800 if undefined
        const posY = this.GAME_HEIGHT / 2 - 100;
        bird.setPosition(posX, posY);
        bird.setVelocity(0);
        bird.setAcceleration(0);

        this.pipes.clear(true, true); // 清空并销毁子对象，但保留 group 实例
        this.generatePipe()
    }

    placePipe(
        uPipe: Phaser.Physics.Arcade.Sprite,
        lPipe: Phaser.Physics.Arcade.Sprite,
    ) {
        const rightMostX = this.getRightMostX();
        const gameHeight: number = Number(this.sys.game.config.height);
        const pipeHorizontalDistanceRange: [number, number] = [500, 600];
        const pipeVerticalDistanceRange: [number, number] = [150, 250];
        let pipeVerticalDistance = Phaser.Math.Between(
            ...pipeVerticalDistanceRange,
        );
        let pipeHorizontalDistance = Phaser.Math.Between(
            ...pipeHorizontalDistanceRange,
        );
        let pipeUpperPos = Phaser.Math.Between(
            gameHeight / 5,
            (gameHeight / 5) * 3,
        );
        uPipe.setPosition(rightMostX + pipeHorizontalDistance, pipeUpperPos);
        lPipe.setPosition(
            rightMostX + pipeHorizontalDistance,
            pipeUpperPos + pipeVerticalDistance,
        );
    }

    generatePipe() {
        for (let i = 0; i < this.PIPES_TO_RENDER; i++) {
            const gameWidth = Number(this.sys.game.config.width);
            const upperPipe = this.pipes
                .create(gameWidth / 2, 0, "pipe")
                .setOrigin(0.5, 1)
                .setScale(2)
                .setFlipY(true);
            const lowerPipe = this.pipes
                .create(gameWidth / 2, 0, "pipe")
                .setOrigin(0.5, 0)
                .setScale(2);
            this.placePipe(upperPipe, lowerPipe);
        }
        this.pipes.setVelocityX(-200);
    }

    getRightMostX(): number {
        let rightMostX: number = 0;
        this.pipes
            .getChildren()
            .forEach((child: Phaser.GameObjects.GameObject) => {
                const pipe = child as Phaser.Physics.Arcade.Sprite;
                rightMostX = Math.max(pipe.x, rightMostX);
            });

        return rightMostX;
    }

    recycle(): void {
        const tempPipes: Phaser.Physics.Arcade.Sprite[] = [];
        this.pipes.getChildren().forEach((pipe) => {
            const sprite = pipe as Phaser.Physics.Arcade.Sprite; // Type assertion since we expect arcade sprites
            if (sprite.getBounds().right <= 0) {
                tempPipes.push(sprite);
                if (tempPipes.length === 2) {
                    this.placePipe(
                        ...(tempPipes as [
                            Phaser.Physics.Arcade.Sprite,
                            Phaser.Physics.Arcade.Sprite,
                        ]),
                    );
                }
            }
        });
    }

    debug(): void {
        const graphics = this.add.graphics();

        // 设置线条样式（宽度为 2 像素，颜色为白色，透明度为 1）
        graphics.lineStyle(2, 0xffffff, 1);

        // 绘制视平线（水平线，贯穿画布宽度，位于画布高度的中间）
        const horizonY = Number(this.sys.game.config.height) / 2; // 画布高度的中点
        graphics.beginPath();
        graphics.moveTo(0, horizonY);
        graphics.lineTo(Number(this.sys.game.config.width), horizonY);
        graphics.strokePath();

        // 绘制视垂线（垂直线，贯穿画布高度，位于画布宽度的中间）
        const verticalX = Number(this.sys.game.config.width) / 2; // 画布宽度的中点
        graphics.beginPath();
        graphics.moveTo(verticalX, 0);
        graphics.lineTo(verticalX, Number(this.sys.game.config.height));
        graphics.strokePath();
    }
}
