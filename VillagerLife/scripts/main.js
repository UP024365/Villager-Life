import { world, system } from "@minecraft/server";
import { showSpeechBubble } from "./chatManager.js";
import { findNearestBlock } from "./utils.js";
import { getCurrentRoutine, getJobMessage } from "./scheduleManager.js";
import { updateHunger, recoverHunger, removeVillagerData } from "./needsManager.js"; // removeVillagerData 추가

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const nearbyVillagers = player.dimension.getEntities({
            location: player.location,
            maxDistance: 15,
            families: ["villager"]
        });

        for (const villager of nearbyVillagers) {
            const currentHunger = updateHunger(villager);
            const healthComp = villager.getComponent("minecraft:health");
            if (!healthComp) continue;

            if (currentHunger <= 30 || healthComp.currentValue < healthComp.defaultValue) {
                const chestPos = findNearestBlock(villager, "minecraft:chest", 10);

                if (chestPos) {
                    villager.teleport(villager.location, { facingLocation: chestPos });
                    showSpeechBubble(villager, `§6배고파... 밥 좀 먹어야겠어!!!!!!!!!!!!. [허기: ${currentHunger}]§r`, 40);

                    // 거리 계산 시 y좌표도 포함하여 더 정확하게 체크
                    const dist = Math.sqrt(
                        Math.pow(villager.location.x - chestPos.x, 2) + 
                        Math.pow(villager.location.y - chestPos.y, 2) + 
                        Math.pow(villager.location.z - chestPos.z, 2)
                    );

                    if (dist < 2.5) { // 판정 범위를 2.5로 살짝 여유 있게 조정
                        recoverHunger(villager, 70);
                        healthComp.setCurrentValue(healthComp.defaultValue);
                        showSpeechBubble(villager, "§b(냠냠...) 역시 상자에 먹을 게 있었네!§r", 60);
                        villager.dimension.runCommand(`playsound random.levelup @a ${villager.location.x} ${villager.location.y} ${villager.location.z}`);
                    }
                } else if (currentHunger < 10) {
                    showSpeechBubble(villager, `§c너무 배고픈데... 근처에 식량 저장고가 없나?§r`, 40);
                }
            } 
            else {
                const time = world.getTimeOfDay();
                let message;
                if (time >= 2000 && time < 12000) {
                    message = getJobMessage(villager);
                } else {
                    message = getCurrentRoutine();
                }
                showSpeechBubble(villager, message, 60);
            }
        }
    }
}, 30);

// [수정] 주민 사망/제거 시 데이터 삭제 (메모리 누수 방지)
world.afterEvents.entityRemove.subscribe((event) => {
    if (event.typeId === "minecraft:villager_v2") {
        removeVillagerData(event.removedEntityId);
    }
});

// [보정] 피격 이벤트 리스너
world.afterEvents.entityHurt.subscribe((event) => {
    const victim = event.hurtEntity;
    if (victim.typeId === "minecraft:villager_v2") {
        const damageSource = event.damageSource.cause;
        let painMessage = "§c아야! 왜 때려!§r";
        
        // EntitySourceCause 값은 보통 첫 글자가 대문자입니다.
        if (damageSource === "Entity" || damageSource === "entity") {
            painMessage = "§4으악! 몹이다! 살려줘!§r";
        } else if (damageSource === "Player" || damageSource === "player") {
            painMessage = "§c아야! 갑자기 왜 그러세요?§r";
        }
        showSpeechBubble(victim, painMessage, 40);
    }
});