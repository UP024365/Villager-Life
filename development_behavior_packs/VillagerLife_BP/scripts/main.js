import { world, system } from "@minecraft/server";
// [필독] import 문은 반드시 파일 최상단에 위치해야 합니다.
import { addDialogue, isVillagerTalking } from "./chatManager.js";
import { handleRoutineDialogue } from "./scheduleManager.js";
import { updateHunger, pickupFoodOnGround, eatFromInventory } from "./needsManager.js";
import { updateSecurity } from "./securityManager.js";
import { handleWeatherDialogue } from "./weatherManager.js";
import { openVillagerMenu } from "./uiManager.js";

/**
 * 전역 로그 출력 함수
 */
function logAction(villager, priority, action) {
    const vId = villager.id.slice(-4);
    const type = villager.typeId === "custom:militia" ? "자경단" : "주민";
    world.sendMessage(`§7[LOG][P${priority}] ${type}(${vId}): ${action}§r`);
}

// 스크립트 로드 확인용 로그
world.sendMessage("§e[시스템] VillagerLife 모드 로드 중...§r");

system.run(() => {
    world.sendMessage("§a[시스템] VillagerLife 통합 로그 모드 활성화 성공!§r");
});

/**
 * 메인 틱 업데이트 루프 (30틱 = 1.5초 주기)
 */
system.runInterval(() => {
    try {
        const overworld = world.getDimension("overworld");
        const villagers = [
            ...overworld.getEntities({ type: "minecraft:villager_v2" }),
            ...overworld.getEntities({ type: "custom:militia" })
        ];

        for (const villager of villagers) {
            if (!villager?.isValid()) continue;

            const healthComp = villager.getComponent("minecraft:health");
            if (!healthComp) continue;

            // 1. 보안 체크 (최우선순위)
            // 좀비가 감지되면 여기서 true가 반환되어야 로그가 찍힙니다.
            if (updateSecurity(villager)) {
                logAction(villager, 10, "적 감지! 경계 태세");
                continue; 
            }

            // 2. 생존 로직 (허기 및 식사)
            const currentHunger = updateHunger(villager);
            if (pickupFoodOnGround(villager, healthComp)) logAction(villager, 5, "바닥 음식 습득");
            if (eatFromInventory(villager, currentHunger, healthComp)) logAction(villager, 6, "식사 완료");

            // 3. 대화 로직 (말하고 있지 않을 때만)
            if (!isVillagerTalking(villager.id)) {
                if (Math.random() < 0.4 && handleWeatherDialogue(villager)) {
                    logAction(villager, 3, "날씨 대화 발생");
                } 
                else if (Math.random() < 0.08 && handleRoutineDialogue(villager)) {
                    logAction(villager, 1, "일상 대화 발생");
                }
            }
        }
    } catch (err) {
        world.sendMessage(`§4[런타임 에러] ${err}§r`);
    }
}, 30);

/**
 * 이벤트 리스너: 주민이 피해를 입었을 때 (아야!)
 */
world.afterEvents.entityHurt.subscribe((event) => {
    const { hurtEntity } = event;
    const isVillager = hurtEntity.typeId === "minecraft:villager_v2" || hurtEntity.typeId === "custom:militia";

    if (isVillager && hurtEntity.isValid()) {
        addDialogue(hurtEntity, "§c아야! 왜 때려요!§r", 40, 9);
        logAction(hurtEntity, 9, "피격 반응(아야!)");
    }
});

/**
 * 이벤트 리스너: 종이로 우클릭 시 관리 메뉴 오픈
 */
world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const { player, target, itemStack } = event;
    const isVillagerType = target.typeId === "minecraft:villager_v2" || target.typeId === "custom:militia";

    if (isVillagerType && itemStack?.typeId === "minecraft:paper") {
        event.cancel = true;
        system.run(() => {
            openVillagerMenu(player, target);
        });
    }
});