// 주민의 허기 수치를 저장할 Map
const villagerHunger = new Map();

export function updateHunger(villager) {
    const id = villager.id;
    
    // 데이터 초기화 보장
    if (!villagerHunger.has(id)) {
        villagerHunger.set(id, 100);
    }

    let currentHunger = villagerHunger.get(id);

    // 10% 확률로 소화 (약 15초당 허기 1 감소)
    if (Math.random() < 0.1) {
        currentHunger = Math.max(0, currentHunger - 1);
        villagerHunger.set(id, currentHunger);
    }

    return currentHunger;
}

export function recoverHunger(villager, amount = 50) {
    const id = villager.id;
    let currentHunger = villagerHunger.get(id) ?? 100;
    currentHunger = Math.min(100, currentHunger + amount); 
    villagerHunger.set(id, currentHunger);
    return currentHunger;
}

export function removeVillagerData(villagerId) {
    villagerHunger.delete(villagerId);
}