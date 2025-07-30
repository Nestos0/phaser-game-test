import { EventBus } from "../EventBus";

export class Boot extends Phaser.Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    brick: Phaser.GameObjects.Sprite;
    keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
    bird: Phaser.Physics.Arcade.Sprite;

    constructor() {
        super("Boot");
    }

    preload() {
        // Boot 场景只加载 Preloader 所需资源
        this.load.spritesheet("bird", "assets/bird.png", {
            frameWidth: 34,
            frameHeight: 24,
        });
        this.load.image("background", "assets/bg.png");
    }

    create() {
        // ✅ Safely access game config width with type assertion
        const centerX = Number(this.sys.game.config.width || 800) / 2; // Fallback to 800 if undefined
        const posY = 16 * 5;

        // ✅ Assign bird sprite
        this.bird = this.physics.add.sprite(centerX, posY, "bird").setScale(4);
        // this.bird.body!.velocity.x = 200;

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);

        EventBus.emit("current-scene-ready", this);
    }

    update() {
        // ✅ Use game canvas width with type safety
        // const gameWidth = Number(this.sys.game.config.width || 800);
        // if (this.bird.x >= gameWidth - this.bird.width * 2) {
        //     this.bird.body!.velocity.x = -200;
        // } else if(this.bird.x - this.bird.width * 2 <= 0) {
        //     this.bird.body!.velocity.x = 200;
        // }
        this.input.on('pointerdown', () => {
            this.bird.setAccelerationY(-500)
        })

        this.input.keyboard?.on('keydown-SPACE', () => {
            this.bird.setVelocityY(-500)
            // this.bird.setAccelerationY(500)
        })
    }
}
