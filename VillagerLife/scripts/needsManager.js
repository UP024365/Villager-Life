// 주민의 허기 수치를 저장할 Map
const villagerHunger = new Map();

export function updateHunger(villager) {
    const id = villager.id;
    let currentHunger = villagerHunger.get(id) ?? 100;

    currentHunger = Math.max(0, currentHunger - 1);
    villagerHunger.set(id, currentHunger);

    return currentHunger;
}

// 주민이 월드에서 제거되었을 때 호출하여 메모리를 정리하는 함수 추가
export function removeVillagerData(villagerId) {
    if (villagerHunger.has(villagerId)) {
        villagerHunger.delete(villagerId);
    }
}

export function feedVillager(villager, amount) {
    const id = villager.id;
    let currentHunger = villagerHunger.get(id) ?? 100;
    currentHunger = Math.min(100, currentHunger + amount);
    villagerHunger.set(id, currentHunger);
}

export function recoverHunger(villager, amount = 50) {
    const id = villager.id;
    let currentHunger = villagerHunger.get(id) ?? 100;
    currentHunger = Math.min(100, currentHunger + amount); 
    villagerHunger.set(id, currentHunger);
    return currentHunger;
}