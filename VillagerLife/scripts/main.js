import { world, system } from "@minecraft/server";
import { showSpeechBubble } from "./chatManager.js";
import { getRoutineMessage } from "./scheduleManager.js";
import { updateHunger, recoverHunger, removeVillagerData } from "./needsManager.js";

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const nearbyVillagers = player.dimension.getEntities({
            location: player.location,
            maxDistance: 15,
            families: ["villager"]
        });

        for (const villager of nearbyVillagers) {
            // 주민이 유효하지 않으면 스킵
            if (!villager.isValid()) continue;

            const currentHunger = updateHunger(villager);
            const healthComp = villager.getComponent("minecraft:health");
            if (!healthComp) continue;

            // 1. 플레이어가 던져준 아이템 감지 (최우선 처리)
            const nearbyItems = villager.dimension.getEntities({
                location: villager.location,
                maxDistance: 2.5, // 감지 범위를 살짝 넓힘
                type: "minecraft:item"
            });

            let pickedUp = false;
            for (const itemEntity of nearbyItems) {
                const itemStack = itemEntity.getComponent("minecraft:item")?.itemStack;
                if (!itemStack) continue;

                const itemId = itemStack.typeId.toLowerCase();
                if (itemId.includes("bread") || itemId.includes("apple") || itemId.includes("carrot") || itemId.includes("potato")) {
                    itemEntity.kill(); // 아이템 획득
                    
                    recoverHunger(villager, 50);
                    healthComp.setCurrentValue(healthComp.defaultValue);

                    // [차별화] 아이템을 얻었을 때: 팝 소리와 레벨업 소리 조합
                    showSpeechBubble(villager, "§d와! 주신 음식 정말 맛있게 잘 먹을게요!§r", 60, true);
                    villager.dimension.runCommandAsync(`playsound random.pop @a ${villager.location.x} ${villager.location.y} ${villager.location.z}`).catch(()=>{}); 
                    villager.dimension.runCommandAsync(`playsound random.levelup @a ${villager.location.x} ${villager.location.y} ${villager.location.z}`).catch(()=>{});
                    // 맨 아랫줄 삭제 완료
                    pickedUp = true;
                    break;
                }
            }
            
            // 아이템을 획득했다면 이번 틱에서는 더 이상 대사를 덮어쓰지 않도록 건너뜀
            if (pickedUp) continue;

            // 2. 배고플 때 자신의 인벤토리 확인 (보관함 소모 시)
            let ateFromInventory = false;
            if (currentHunger <= 30 || healthComp.currentValue < healthComp.defaultValue) {
                const inventory = villager.getComponent("minecraft:inventory")?.container;
                let foodSlot = -1;

                if (inventory) {
                    for (let i = 0; i < inventory.size; i++) {
                        const item = inventory.getItem(i);
                        if (!item) continue;

                        const itemId = item.typeId.toLowerCase();
                        if (itemId.includes("bread") || itemId.includes("apple") || itemId.includes("carrot") || itemId.includes("potato")) {
                            foodSlot = i;
                            break;
                        }
                    }
                }

                if (foodSlot !== -1) {
                    const item = inventory.getItem(foodSlot);
                    if (item) {
                        if (item.amount > 1) {
                            item.amount -= 1;
                            inventory.setItem(foodSlot, item);
                        } else {
                            inventory.setItem(foodSlot, undefined);
                        }

                        recoverHunger(villager, 70);
                        healthComp.setCurrentValue(healthComp.defaultValue);

                        // [차별화] 혼자 먹을 때: 먹는 소리(random.eat)만 재생
                        showSpeechBubble(villager, "§b(냠냠...) 아껴뒀던 음식을 꺼내 먹어야지.§r", 60, true);
                        villager.dimension.runCommandAsync(`playsound random.eat @a ${villager.location.x} ${villager.location.y} ${villager.location.z}`).catch(()=>{});
                        ateFromInventory = true;
                    }
                } else if (currentHunger < 10) {
                    showSpeechBubble(villager, "§c배고파서 기운이 없어... 누가 음식 좀 주면 좋겠다.§r", 40);
                    ateFromInventory = true; // 배고프다고 불평을 했으므로 일반 대사 스킵 처리
                }
            } 
            
            // 인벤토리에서 음식을 먹거나 불평을 했다면 일반 대사 건너뜀
            if (ateFromInventory) continue;

            // 3. 평상시 상태 대사 (현재 주민이 아무런 중요한 대사를 하고 있지 않을 때만 출력)
            if (!villager.hasTag("isTalking")) {
                let message = getRoutineMessage(villager); // 복잡한 조건문 삭제, 알아서 처리됨
                showSpeechBubble(villager, message, 60);
            }
        }
    }
}, 30);

// 피격 이벤트 (아야 로직)
world.afterEvents.entityHurt.subscribe((event) => {
    const victim = event.hurtEntity; 
    if (victim.typeId === "minecraft:villager_v2") {
        victim.removeTag("isTalking"); // 맞았을 때는 즉시 기존 대사 태그 제거
        const cause = String(event.damageSource.cause).toLowerCase(); 
        let painMessage = "§c아야! 왜 때려!§r"; 
        if (cause.includes("entity")) painMessage = "§4으악! 몹이다! 살려줘!§r"; 
        else if (cause.includes("player")) painMessage = "§c아야! 갑자기 왜 그러세요?§r"; 
        showSpeechBubble(victim, painMessage, 40, true); 
    }
});

// 제거 이벤트 (메모리 정리)
world.afterEvents.entityRemove.subscribe((event) => {
    if (event.typeId === "minecraft:villager_v2") {
        removeVillagerData(event.removedEntityId); 
    }
});