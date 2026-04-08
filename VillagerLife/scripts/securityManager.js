const panickingVillagers = new Map();
const mobNames = { "zombie": "좀비", "skeleton": "스켈레톤", "creeper": "크리퍼", "spider": "거미", "witch": "마녀" };

export function updateSecurity(villager) {
    const enemies = villager.dimension.getEntities({
        location: villager.location,
        maxDistance: 10,
        families: ["monster"]
    }).filter(e => Math.abs(e.location.y - villager.location.y) < 4);

    if (enemies.length > 0) {
        const id = villager.id;
        if (!panickingVillagers.has(id)) {
            const rawId = enemies[0].typeId.replace("minecraft:", "");
            const name = mobNames[rawId] || "괴물";
            
            showSpeechBubble(villager, `§4으악! ${name} 나타났다! 도망쳐!§r`, 60, true);
            
            // 3초간 패닉 대사 쿨타임
            const tid = system.runTimeout(() => panickingVillagers.delete(id), 60);
            panickingVillagers.set(id, tid);
        }
        return true; 
    }
    return false;
}