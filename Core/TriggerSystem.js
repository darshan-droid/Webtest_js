import * as THREE from '../three.module.js';

export class TriggerSystem {
    constructor(player) {
        this.player = player;
        this.triggers = [];
    }

    loadFromMeta(meta) {
        if (!meta.Triggers) return;
        for (const t of meta.Triggers) {
            this.triggers.push({
                id: t.Id,
                action: t.Action,
                pos: new THREE.Vector3(t.Position[0], t.Position[1], t.Position[2]),
                radius: t.Radius,
                triggered: false
            });
        }
    }

    update() {
        if (!this.player) return;
        const pPos = this.player.getWorldPosition(new THREE.Vector3());
        for (const trig of this.triggers) {
            if (trig.triggered) continue;
            const d = pPos.distanceTo(trig.pos);
            if (d < trig.radius) {
                trig.triggered = true;
                console.log(`[Trigger] ${trig.id} activated → ${trig.action}`);
                this.onTrigger(trig);
            }
        }
    }

    onTrigger(trig) {
        switch (trig.action) {
            case 'ScoreUp':
                window.GameScore = (window.GameScore || 0) + 1;
                console.log(`[Game] Score: ${window.GameScore}`);
                break;
            case 'PlayAnimation':
                console.log('[Trigger] Play animation triggered');
                break;
            default:
                console.log(`[Trigger] Unknown action ${trig.action}`);
        }
    }
}
