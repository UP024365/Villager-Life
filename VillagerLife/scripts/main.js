import { world, system } from "@minecraft/server";
import { showSpeechBubble, isVillagerTalking } from "./chatManager.js";
import { getRoutineMessage } from "./scheduleManager.js";
import { updateHunger, recoverHunger, removeVillagerData } from "./needsManager.js";
import { updateSecurity } from "./securityManager.js";

// --- [헬퍼 함수 1] 바닥 음식 줍기 ---
function pickupFoodOnGround(villager, healthComp) {
    const nearbyItems = villager.dimension.getEntities({
        location: villager.location,
        maxDistance: 2.5,
        type: "minecraft:item"
    });

    for (const itemEntity of nearbyItems) {
        const itemStack = itemEntity.getComponent("minecraft:item")?.itemStack;
        if (!itemStack) continue;

        const itemId = itemStack.typeId.toLowerCase();
        if (itemId.includes("bread") || itemId.includes("apple") || itemId.includes("carrot") || itemId.includes("potato")) {
            itemEntity.kill(); 
            recoverHunger(villager, 50);
            healthComp.setCurrentValue(healthComp.defaultValue);

            showSpeechBubble(villager, "§d와! 주신 음식 정말 맛있게 잘 먹을게요!§r", 60, true);
            
            const { x, y, z } = villager.location;
            villager.dimension.runCommandAsync(`playsound random.pop @a ${x} ${y} ${z}`).catch(()=>{}); 
            return true; // 실제 아이템을 먹었으므로 true (행동 완료)
        }
    }
    return false;
}

// --- [헬퍼 함수 2] 인벤토리 식사 또는 배고픔 호소 ---
function eatFromInventory(villager, currentHunger, healthComp) {
    if (currentHunger <= 30 || healthComp.currentValue < healthComp.defaultValue) {
        const inventory = villager.getComponent("minecraft:inventory")?.container;
        let foodSlot = -1;

        if (inventory) {
            for (let i = 0; i < inventory.size; i++) {
                const item = inventory.getItem(i);
                if (!item) continue;
                if (["bread", "apple", "carrot", "potato"].some(f => item.typeId.includes(f))) {
                    foodSlot = i;
                    break;
                }
            }
        }

        if (foodSlot !== -1) {
            const item = inventory.getItem(foodSlot);
            if (item.amount > 1) { item.amount -= 1; inventory.setItem(foodSlot, item); }
            else { inventory.setItem(foodSlot, undefined); }

            recoverHunger(villager, 70);
            healthComp.setCurrentValue(healthComp.defaultValue);
            showSpeechBubble(villager, "§b(냠냠...) 아껴뒀던 음식을 먹어야지.§r", 60, true);
            return true; // 실제 식사를 했으므로 true (행동 완료)
        } else if (currentHunger < 10) {
            // 배고프다고 말만 하는 건 '행동'으로 치지 않음 (false 반환)
            if (!isVillagerTalking(villager.id)) {
                showSpeechBubble(villager, "§c배고파서 기운이 없어...§r", 40);
            }
        }
    }
    return false; 
}

// --- 메인 루프 ---
system.runInterval(() => {
    // 오버월드 전체 주민 대상 (중복 연산 방지)
    const villagers = world.getDimension("overworld").getEntities({ families: ["villager"] });

    for (const villager of villagers) {
        if (!villager.isValid()) continue;

        const healthComp = villager.getComponent("minecraft:health");
        if (!healthComp) continue;

        const isUnderAttack = updateSecurity(villager);
        const currentHunger = updateHunger(villager);

        if (isUnderAttack) continue; // 위협 시 루틴 중단
        if (pickupFoodOnGround(villager, healthComp)) continue; // 음식 주우면 루틴 중단
        if (eatFromInventory(villager, currentHunger, healthComp)) continue; // 밥 먹으면 루틴 중단

        // 일상 대사 (확률 조정: 3% 확률로 약 5~10초에 한 번씩)
        if (!isVillagerTalking(villager.id)) {
            if (Math.random() < 0.03) {
                let message = getRoutineMessage(villager);
                showSpeechBubble(villager, message, 60);
            }
        }
    }
}, 30);

// 피격 이벤트
world.afterEvents.entityHurt.subscribe((event) => {
    const victim = event.hurtEntity; 
    if (victim?.isValid() && victim.typeId === "minecraft:villager_v2") {
        const cause = String(event.damageSource.cause).toLowerCase(); 
        let msg = cause.includes("entity") ? "§4으악! 몹이다!§r" : "§c아야! 왜 때려!§r"; 
        showSpeechBubble(victim, msg, 40, true); 
    }
});

world.afterEvents.entityRemove.subscribe((event) => {
    removeVillagerData(event.removedEntityId); 
});