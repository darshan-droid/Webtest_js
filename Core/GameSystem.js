import { TriggerSystem } from './TriggerSystem.js';
import { JoystickSystem } from './JoystickSystem.js';

export class GameSystem {
    constructor(player, meta) {
        this.player = player;
        this.triggerSystem = new TriggerSystem(player);
        this.triggerSystem.loadFromMeta(meta);
        this.joystickSystem = new JoystickSystem(player);
    }

    init() {
        this.joystickSystem.init();
        document.getElementById('joystick').style.display = 'block';
    }

    update(time, frame) {
        this.joystickSystem.update(1 / 60);
        this.triggerSystem.update();
    }
}
