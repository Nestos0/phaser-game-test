import { EventBus } from "../EventBus";

export class Boot extends Phaser.Scene {
    constructor() {
        super("Boot");
    }

    preload() {
        // Boot 场景只加载 Preloader 所需资源
        this.load.spritesheet("bird", "assets/bird.png", {
            frameWidth: 34,
            frameHeight: 24,
        });

        this.load.spritesheet("ground", "assets/ground-sprite.png", {
            frameWidth: 336,
            frameHeight: 112,
        });

        this.load.image("background", "assets/bg.png");
        this.load.image("pipe", "assets/pipe.png");
    }

    create() {
        this.anims.create({
            key: "fly", // 动画名称
            frames: this.anims.generateFrameNumbers("bird", {
                start: 0,
                end: 2, // 取决于你 spritesheet 有几帧
            }),
            frameRate: 6, // 每秒播放帧数
            repeat: -1, // 无限循环
        });

        EventBus.emit("current-scene-ready", this);
        this.scene.start("GameScene");
    }
}
