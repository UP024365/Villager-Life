import { system } from "@minecraft/server";
import { addDialogue } from "./chatManager.js"; 

const panickingVillagers = new Map();
const mobNames = { 
    "zombie": "좀비", 
    "drowned": "물좀비", 
    "husk": "사막좀비", 
    "zombie_villager": "좀비 주민",
    "skeleton": "스켈레톤", 
    "creeper": "크리퍼", 
    "spider": "거미" 
};

export function updateSecurity(villager) {
    const role = villager.getDynamicProperty("village:role") || "CITIZEN";
    
    const enemies = villager.dimension.getEntities({
        location: villager.location,
        maxDistance: role === "MILITIA" ? 15 : 10,
        families: ["monster"]
    }).filter(e => Math.abs(e.location.y - villager.location.y) < 6);

    if (enemies.length > 0) {
        const id = villager.id;
        const target = enemies[0];
        const rawId = target.typeId.replace("minecraft:", "");
        const name = mobNames[rawId] || "괴물";

        if (!panickingVillagers.has(id)) {
            if (role === "MILITIA") {
                addDialogue(villager, `§6전투 태세! 저기 ${name}(을)를 처리하겠다!§r`, 60, 10);
            } else {
                addDialogue(villager, `§4으악! 저기 ${name} 나타났다! 도망쳐!§r`, 60, 10);
            }
            
            const tid = system.runTimeout(() => panickingVillagers.delete(id), 60);
            panickingVillagers.set(id, tid);
        }

        if (role === "MILITIA" && target.isValid()) {
            const navigation = villager.getComponent("minecraft:navigation");
            
            if (navigation) {
                villager.teleport(villager.location, {
                    facingLocation: target.location
                });
                
                villager.dimension.runCommandAsync(
                    `execute as ${villager.id} run scriptevent villager:move_to ${target.location.x} ${target.location.y} ${target.location.z}`
                ).catch(() => {});
            }
        }

        return true; 
    }
    return false;
}