import { EventBus } from "../EventBus";

function mapVelocityToAngle(
    v: number,
    minV: number,
    maxV: number,
    minAngle: number,
    maxAngle: number,
): number {
    const clampedV = Phaser.Math.Clamp(v, minV, maxV);
    const normV = (clampedV - minV) / (maxV - minV);
    const adjusted = normV * normV;
    return minAngle + adjusted * (maxAngle - minAngle);
}

export class GameScene extends Phaser.Scene {
    public GAME_WIDTH!: number;
    public GAME_HEIGHT!: number;
    private score: number = 0;
    // private scoreText!: Phaser.GameObjects.Image;
    private scoredPipes: Set<Phaser.Physics.Arcade.Sprite> = new Set();
    private scoreContainer: Phaser.GameObjects.Container;
    camera!: Phaser.Cameras.Scene2D.Camera;
    background!: Phaser.GameObjects.Image;
    gameText!: Phaser.GameObjects.Text;
    brick!: Phaser.GameObjects.Sprite;
    keyboard!: Phaser.Input.Keyboard.KeyboardPlugin;
    bird!: Phaser.Physics.Arcade.Sprite;
    pipes!: Phaser.Physics.Arcade.Group;
    gameover: boolean = false;
    overlapRef!: Phaser.Physics.Arcade.Collider;
    ground!: Phaser.GameObjects.TileSprite;

    readonly PIPES_TO_RENDER = 5;
    HORIZONTAL_HEIGHT!: number;

    readonly initbirdPosition = 200;

    constructor() {
        super("GameScene");
    }

    preload() {
        this.GAME_WIDTH = Number(this.sys.game.config.width || 800);
        this.GAME_HEIGHT = Number(this.sys.game.config.height || 600);

        this.HORIZONTAL_HEIGHT = (this.GAME_HEIGHT / 8) * 7;

        this.pipes = this.physics.add.group();
    }

    create() {
        this.add.image(0, 0, "background").setOrigin(0).setScale(2);

        this.ground = this.add
            .tileSprite(
                0,
                this.HORIZONTAL_HEIGHT,
                this.GAME_WIDTH,
                85,
                "ground",
            )
            .setOrigin(0)
            .setScale(1, 2)
            .setDepth(100);

        const posX = this.GAME_WIDTH / 2 - 400;
        const posY = this.GAME_HEIGHT / 2 - 100;

        this.bird = this.physics.add
            .sprite(posX, posY, "bird")
            .setOrigin(0.5)
            .setScale(2);
        this.bird.setGravityY(980);
        this.bird.anims.play("fly");

        this.camera = this.cameras.main;

        this.generatePipe();

        this.input.on("pointerdown", () => {
            this.bird.setVelocityY(250);
            this.bird.setAccelerationY(-500);
        });

        this.input.keyboard?.on("keydown-SPACE", () => {
            if (!this.gameover) {
                this.bird.setVelocityY(-400);
            } else {
                this.restartgame(this.bird);
            }
        });

        this.overlapRef = this.physics.add.overlap(this.bird, this.pipes, () =>
            this.gameoverAni(),
        );

        this.pipes.getChildren().forEach((child) => {
            const pipe = child as Phaser.Physics.Arcade.Sprite;
            pipe.body!.immovable = true;
        });

        this.scoreContainer = this.add.container(0,50);
        let scoreText = this.add
            .image(this.GAME_WIDTH / 2, 16, "number", 0)
            .setScale(2)
            .setDepth(1000);
        this.scoreContainer.add(scoreText);

        this.debug();
        EventBus.emit("current-scene-ready", this);
    }

    update() {
        if (!this.gameover) {
            this.ground.tilePositionX += 2;

            this.pipes.getChildren().forEach((pipe) => {
                const p = pipe as Phaser.Physics.Arcade.Sprite;

                if (
                    !this.scoredPipes.has(p) &&
                    p.texture.key === "pipe" &&
                    p.flipY
                ) {
                    if (p.x < this.bird.x && this.bird.x < p.width + p.x) {
                        this.score += 1;

                        // 清除旧分数容器并重建
                        this.scoreContainer.destroy();
                        this.scoreContainer = this.add.container(0, 16);
                        let digit = 0;
                        let score = this.score;

                        // 将数字拆分为字符数组
                        for (
                            let i = this.score;
                            i > 0;
                            i = Math.floor(i / 10)
                        ) {
                            digit += 1;
                        }
                        for (let i = digit - 1; i >= 0; i--) {
                            const scoreImage = this.add
                                .image(
                                    this.GAME_WIDTH / 2 -
                                        i * 48 +
                                        (digit - 1) * 24 /* ((j - 1) * 24) */,
                                    50,
                                    "number",
                                    Math.floor(score / 10 ** i),
                                )
                                .setScale(2)
                                .setDepth(1000);
                            this.scoreContainer.add(scoreImage);
                            score = score % 10 ** i;
                        }
                        this.scoredPipes.clear();
                        this.scoredPipes.add(p);
                    }
                }
            });
            if (this.bird.y >= this.HORIZONTAL_HEIGHT - this.bird.height) {
                this.gameoverAni();
            } else if (this.bird.y - this.bird.height * 2 <= 0) {
                this.gameoverAni();
            }
        } else {
            if (this.bird.y >= this.HORIZONTAL_HEIGHT - this.bird.height / 2) {
                this.bird.setVelocityY(0);
                this.bird.setGravityY(0);
                this.bird.setY(this.HORIZONTAL_HEIGHT - this.bird.height / 2);
            }
        }

        this.recycle();

        const vy = this.bird.body!.velocity.y;
        const angle = mapVelocityToAngle(vy, -300, 300, -30, 45);
        this.bird.angle = Phaser.Math.Linear(this.bird.angle, angle, 0.1);
    }

    gameoverAni() {
        this.overlapRef.active = false;
        this.pipes.setVelocityX(0);
        this.bird.setVelocityY(-500);
        this.time.delayedCall(200, () => {
            this.gameover = true;
            this.bird.anims.pause();
            this.bird.setVelocityX(0);
            // this.bird.setVelocityY(-600);
            this.bird.setGravityY(2080);
            this.bird.setDepth(1000);
        });
    }

    restartgame(bird: Phaser.Physics.Arcade.Sprite) {
        this.overlapRef.active = true;
        this.gameover = false;
        this.bird.setGravityY(980);
        this.bird.anims.play("fly");

        const posX = this.GAME_WIDTH / 2 - 400;
        const posY = this.GAME_HEIGHT / 2 - 100;

        bird.setPosition(posX, posY);
        bird.setVelocity(0);
        bird.setAcceleration(0);

        this.scoredPipes.clear();

        this.pipes.clear(true, true);
        this.generatePipe();

        this.score = 0;
        this.scoreContainer.destroy();
        this.scoreContainer = this.add.container(0, 16);
        const scoreImage = this.add
            .image(this.GAME_WIDTH / 2, 50, "number", this.score)
            .setScale(2)
            .setDepth(1000);
        this.scoreContainer.add(scoreImage);
    }

    placePipe(
        uPipe: Phaser.Physics.Arcade.Sprite,
        lPipe: Phaser.Physics.Arcade.Sprite,
    ) {
        const rightMostX = this.getRightMostX();
        const pipeHorizontalDistance = Phaser.Math.Between(500, 600);
        const pipeVerticalDistance = Phaser.Math.Between(150, 250);
        const pipeUpperPos = Phaser.Math.Between(
            this.GAME_HEIGHT / 5,
            (this.GAME_HEIGHT / 5) * 3,
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
        let rightMostX = 0;
        this.pipes.getChildren().forEach((child) => {
            const pipe = child as Phaser.Physics.Arcade.Sprite;
            rightMostX = Math.max(pipe.x, rightMostX);
        });
        return rightMostX;
    }

    recycle() {
        const tempPipes: Phaser.Physics.Arcade.Sprite[] = [];
        this.pipes.getChildren().forEach((pipe) => {
            const sprite = pipe as Phaser.Physics.Arcade.Sprite;
            if (sprite.getBounds().right <= 0) {
                tempPipes.push(sprite);
                if (tempPipes.length === 2) {
                    this.placePipe(tempPipes[0], tempPipes[1]);
                }
            }
        });
    }

    debug() {
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xffffff, 1);

        const horizonY = Number(this.sys.game.config.height) / 2;
        graphics.beginPath();
        graphics.moveTo(0, horizonY);
        graphics.lineTo(Number(this.sys.game.config.width), horizonY);
        graphics.strokePath();

        const verticalX = Number(this.sys.game.config.width) / 2;
        graphics.beginPath();
        graphics.moveTo(verticalX, 0);
        graphics.lineTo(verticalX, Number(this.sys.game.config.height));
        graphics.strokePath();
    }
}
