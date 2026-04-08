import { world, system } from "@minecraft/server";

// 임포트 시작 로그
world.sendMessage("§e[시스템] 모듈 임포트를 시작합니다...§r");

import { showSpeechBubble, isVillagerTalking } from "./chatManager.js";
import { getRoutineMessage } from "./scheduleManager.js";
import { 
    updateHunger, 
    removeVillagerData, 
    pickupFoodOnGround, 
    eatFromInventory 
} from "./needsManager.js";
import { updateSecurity } from "./securityManager.js";
import { getWeatherMessage } from "./weatherManager.js";
import { openVillagerMenu } from "./uiManager.js"; 

// 모든 임포트 완료 후 실행
system.run(() => {
    world.sendMessage("§a[시스템] 모든 모듈이 성공적으로 임포트되었습니다!§r");
    world.sendMessage("§a[시스템] VillagerLife 디버깅 모드 활성화 완료!§r");
});

// ==========================================
// --- 메인 루프 (30틱 마다 실행) ---
// ==========================================
system.runInterval(() => {
    try {
        const villagers = world.getDimension("overworld").getEntities({ 
            type: "minecraft:villager_v2" 
        });

        for (const villager of villagers) {
            if (!villager || !villager.isValid()) continue;
            const vId = villager.id.slice(-4);

            try {
                const healthComp = villager.getComponent("minecraft:health");
                if (!healthComp) continue;

                // --- [우선순위 0] 보안(생존) ---
                // 공격받거나 주변에 좀비가 있으면 모든 행동 중단
                const isUnderAttack = updateSecurity(villager);
                if (isUnderAttack) {
                    world.sendMessage(`§4[PRIORITY 0] 주민(${vId}) 보안 로직 작동 중...§r`);
                    continue; 
                }

                // 대화 중이라면 로직 건너뜀
                if (isVillagerTalking(villager.id)) continue;

                // --- [우선순위 1] 특수 명령(심시티 모드) ---
                // UI를 통해 설정된 모드 확인 (IDLE, COLLECTING, REPAIRING)
                const mode = villager.getDynamicProperty("village:mode") || "IDLE";
                if (mode !== "IDLE") {
                    world.sendMessage(`§a[PRIORITY 1] 주민(${vId}) 현재 업무 수행 중: ${mode}§r`);
                    // 여기서 각 모드에 맞는 세부 함수를 호출할 수 있습니다.
                    continue; 
                }

                // --- [우선순위 2] 생존(허기) ---
                const currentHunger = updateHunger(villager);
                if (pickupFoodOnGround(villager, healthComp)) {
                    world.sendMessage(`§b[PRIORITY 2] 주민(${vId}) 바닥 음식 줍기 완료§r`);
                    continue; 
                }
                if (eatFromInventory(villager, currentHunger, healthComp)) {
                    world.sendMessage(`§b[PRIORITY 2] 주민(${vId}) 인벤토리 식사 완료§r`);
                    continue; 
                }

                // --- [우선순위 3] 환경 반응(날씨) ---
                const weatherMsg = getWeatherMessage(villager);
                if (weatherMsg && Math.random() < 0.4) {
                    showSpeechBubble(villager, weatherMsg, 60);
                    world.sendMessage(`§3[PRIORITY 3] 주민(${vId}) 날씨 반응: ${weatherMsg}§r`);
                    continue;
                }

                // --- [우선순위 4] 일반 일상 ---
                if (Math.random() < 0.1) { 
                    let message = getRoutineMessage(villager);
                    showSpeechBubble(villager, message, 60);
                    world.sendMessage(`§e[PRIORITY 4] 주민(${vId}) 일상 대사: ${message}§r`);
                }

            } catch (innerErr) {
                console.warn(`주민(${vId}) 루프 오류: ${innerErr}`);
            }
        }
    } catch (err) {
        world.sendMessage(`§4[SYSTEM CRASH] 메인 루프 치명적 오류: ${err}§r`);
    }
}, 30);

// ==========================================
// --- 인터페이스 가로채기 (UI) ---
// ==========================================

world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const { player, target, itemStack } = event;

    if (target.typeId === "minecraft:villager_v2" && itemStack?.typeId === "minecraft:paper") {
        // 거래창 차단
        event.cancel = true;

        // UI 오픈
        system.run(() => {
            openVillagerMenu(player, target);
        });
        
        world.sendMessage(`§b[UI] 주민(${target.id.slice(-4)}) 관리 메뉴 호출됨.§r`);
    }
});

// ==========================================
// --- 이벤트 모니터링 ---
// ==========================================

world.afterEvents.entityHurt.subscribe((event) => {
    try {
        const victim = event.hurtEntity; 
        if (victim?.isValid() && victim.typeId === "minecraft:villager_v2") {
            const cause = event.damageSource?.cause || "unknown";
            let msg = cause.includes("entity") ? "§4으악! 누가 날 공격해!§r" : "§c아야! 아파!§r"; 
            showSpeechBubble(victim, msg, 40, true); 
            world.sendMessage(`§c[EVENT] 주민(${victim.id.slice(-4)}) 피격됨 (원인: ${cause})§r`);
        }
    } catch (err) {}
});

world.afterEvents.entityRemove.subscribe((event) => {
    try {
        if (event.typeId === "minecraft:villager_v2") {
            removeVillagerData(event.removedEntityId); 
            world.sendMessage(`§7[EVENT] 주민 데이터 정리됨 (ID: ${event.removedEntityId.slice(-4)})§r`);
        }
    } catch (err) {}
});