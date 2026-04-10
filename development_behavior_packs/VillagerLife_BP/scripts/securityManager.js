import { system } from "@minecraft/server";
import { addDialogue } from "./chatManager.js"; 

const panickingVillagers = new Map();
const mobNames = { "zombie": "좀비", "skeleton": "스켈레톤", "creeper": "크리퍼", "spider": "거미" };

export function updateSecurity(villager) {
    const role = villager.getDynamicProperty("village:role") || "CITIZEN";
    const isMilitiaEntity = villager.typeId === "custom:militia";
    
    const enemies = villager.dimension.getEntities({
        location: villager.location,
        maxDistance: (role === "MILITIA" || isMilitiaEntity) ? 15 : 10,
        families: ["monster"]
    }).filter(e => Math.abs(e.location.y - villager.location.y) < 6);

    if (enemies.length > 0) {
        const id = villager.id;
        const target = enemies[0];
        const name = mobNames[target.typeId.replace("minecraft:", "")] || "괴물";

        if (!panickingVillagers.has(id)) {
            const msg = (role === "MILITIA" || isMilitiaEntity) ? 
                `§6전투 태세! 저기 ${name}(을)를 처리하겠다!§r` : 
                `§4으악! 저기 ${name} 나타났다! 도망쳐!§r`;
            
            addDialogue(villager, msg, 60, 10);
            const tid = system.runTimeout(() => panickingVillagers.delete(id), 60);
            panickingVillagers.set(id, tid);
        }
        return true; 
    }
    return false;
}