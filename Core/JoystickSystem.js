import * as THREE from '../three.module.js';

export class JoystickSystem {
    constructor(player) {
        this.player = player;
        this.joyVec = new THREE.Vector2(0, 0);
    }

    init() {
        this.joystick = document.getElementById('joystick');
        this.stick = document.getElementById('joystick-stick');
        this.maxRadius = 36;
        this.active = false;
        const start = (ev) => {
            ev.preventDefault();
            this.active = true;
            const rect = this.joystick.getBoundingClientRect();
            this.center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        };
        const move = (ev) => {
            if (!this.active) return;
            const t = ev.touches ? ev.touches[0] : ev;
            const dx = t.clientX - this.center.x;
            const dy = t.clientY - this.center.y;
            const dist = Math.min(Math.sqrt(dx * dx + dy * dy), this.maxRadius);
            this.joyVec.set(dx / this.maxRadius, dy / this.maxRadius);
            this.stick.style.left = `${50 + (dx / this.maxRadius) * 50}%`;
            this.stick.style.top = `${50 + (dy / this.maxRadius) * 50}%`;
        };
        const end = () => {
            this.active = false;
            this.joyVec.set(0, 0);
            this.stick.style.left = '50%';
            this.stick.style.top = '50%';
        };
        this.joystick.addEventListener('touchstart', start);
        this.joystick.addEventListener('touchmove', move);
        this.joystick.addEventListener('touchend', end);
    }

    update(dt) {
        if (!this.player) return;
        const moveSpeed = 0.6;
        if (this.joyVec.lengthSq() > 0.0004) {
            const dir = new THREE.Vector3(this.joyVec.x, 0, -this.joyVec.y).normalize();
            this.player.position.addScaledVector(dir, moveSpeed * (dt || 0.016));
        }
    }
}
