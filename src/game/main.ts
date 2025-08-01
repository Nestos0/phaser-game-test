import { Boot } from './scenes/Boot';
import { GameScene } from './scenes/GameScene'
import { AUTO, Game } from 'phaser';

// const width = window.innerWidth
// const height  = window.innerHeight
const width = 1600
const height = 1200

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: width,
        height: height, 
      },
    input: {
            keyboard: true // ✅ Explicitly enable keyboard input
        },
    physics: {
        default: "arcade",
        arcade: {
            debug: false
        }
    },
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [
        Boot,
        GameScene
    ]
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;