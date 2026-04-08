// 주민의 허기 수치를 저장할 Map (전공자 느낌 나게 메모리 상에 관리)
const villagerHunger = new Map();

export function updateHunger(villager) {
    const id = villager.id;
    // 기존 수치가 없으면 100(풀 배터리)으로 시작
    let currentHunger = villagerHunger.get(id) ?? 100;

    // 업데이트할 때마다 1씩 감소 (배고파짐)
    currentHunger = Math.max(0, currentHunger - 1);
    villagerHunger.set(id, currentHunger);

    return currentHunger;
}

// 밥 먹이기 (나중에 아이템 주면 수치 올릴 때 사용)
export function feedVillager(villager, amount) {
    const id = villager.id;
    let currentHunger = villagerHunger.get(id) ?? 100;
    currentHunger = Math.min(100, currentHunger + amount);
    villagerHunger.set(id, currentHunger);
}

// 주민이 밥을 먹었을 때 수치를 채워주는 함수
export function recoverHunger(villager, amount = 50) {
    const id = villager.id;
    let currentHunger = villagerHunger.get(id) ?? 100;
    currentHunger = Math.min(100, currentHunger + amount); // 최대 100
    villagerHunger.set(id, currentHunger);
    return currentHunger;
}