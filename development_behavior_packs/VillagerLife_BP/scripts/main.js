import { world, system } from "@minecraft/server";
import { addDialogue, isVillagerTalking, clearDialogueQueue } from "./chatManager.js";
import { handleRoutineDialogue } from "./scheduleManager.js";
import { updateHunger, removeVillagerData, pickupFoodOnGround, eatFromInventory } from "./needsManager.js";
import { updateSecurity } from "./securityManager.js";
import { handleWeatherDialogue } from "./weatherManager.js";
import { openVillagerMenu } from "./uiManager.js";

function logAction(villager, priority, action) {
    const vId = villager.id.slice(-4);
    world.sendMessage(`§7[LOG][P${priority}] 주민(${vId}): ${action}§r`);
}

system.run(() => {
    world.sendMessage("§a[시스템] VillagerLife 통합 로그 모드 활성화 완료!§r");
});

system.runInterval(() => {
    try {
        const overworld = world.getDimension("overworld");
        // [핵심] 일반 주민과 자경단을 모두 리스트에 포함시킵니다.
        const normalVillagers = overworld.getEntities({ type: "minecraft:villager_v2" });
        const militias = overworld.getEntities({ type: "custom:militia" });
        const villagers = [...normalVillagers, ...militias];

        for (const villager of villagers) {
            if (!villager || !villager.isValid()) continue;

            try {
                const healthComp = villager.getComponent("minecraft:health");
                if (!healthComp) continue;

                if (updateSecurity(villager)) {
                    logAction(villager, 10, "보안 로직 가동");
                    continue; 
                }

                const currentHunger = updateHunger(villager);
                if (pickupFoodOnGround(villager, healthComp)) continue;
                if (eatFromInventory(villager, currentHunger, healthComp)) continue;

                if (isVillagerTalking(villager.id)) continue;

                if (Math.random() < 0.4 && handleWeatherDialogue(villager)) continue;
                if (Math.random() < 0.08 && handleRoutineDialogue(villager)) continue;

            } catch (innerErr) {
                console.warn(`주민 루프 오류: ${innerErr}`);
            }
        }
    } catch (err) {
        world.sendMessage(`§4[SYSTEM CRASH] 메인 루프 오류: ${err}§r`);
    }
}, 30);

world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const { player, target, itemStack } = event;
    // [핵심] 자경단 상태에서도 UI가 열리도록 허용합니다.
    const isVillagerType = target.typeId === "minecraft:villager_v2" || target.typeId === "custom:militia";

    if (isVillagerType && itemStack?.typeId === "minecraft:paper") {
        event.cancel = true;
        system.run(() => {
            openVillagerMenu(player, target);
        });
    }
});