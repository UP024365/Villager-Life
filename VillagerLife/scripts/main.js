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

                const isUnderAttack = updateSecurity(villager);
                const currentHunger = updateHunger(villager);

                if (isUnderAttack) {
                    world.sendMessage(`§4[SECURITY] 주민(${vId}) 위협 감지 중...§r`);
                    continue; 
                }

                if (isVillagerTalking(villager.id)) continue;

                const weatherMsg = getWeatherMessage(villager);
                if (weatherMsg && Math.random() < 0.4) {
                    showSpeechBubble(villager, weatherMsg, 60);
                    world.sendMessage(`§3[WEATHER] 주민(${vId}) 날씨 반응: ${weatherMsg}§r`);
                    continue;
                }

                if (pickupFoodOnGround(villager, healthComp)) continue; 
                if (eatFromInventory(villager, currentHunger, healthComp)) continue; 

                if (Math.random() < 0.1) { 
                    let message = getRoutineMessage(villager);
                    showSpeechBubble(villager, message, 60);
                    world.sendMessage(`§e[ROUTINE] 주민(${vId}) 일상 대사: ${message}§r`);
                }
            } catch (innerErr) {
                console.warn(`주민(${vId}) 루프 오류: ${innerErr}`);
            }
        }
    } catch (err) {
        world.sendMessage(`§4[SYSTEM CRASH] 메인 루프 오류: ${err}§r`);
    }
}, 30);

// ==========================================
// --- 인터페이스 교체 (거래창 차단 핵심) ---
// ==========================================

// [핵심 수정] 상호작용 이벤트를 사전에 가로채서 취소함
world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const { player, target, itemStack } = event;

    // 주민을 클릭했고, 종이(명령서)를 들고 있다면
    if (target.typeId === "minecraft:villager_v2" && itemStack?.typeId === "minecraft:paper") {
        // 1. 거래창이 뜨지 않도록 이벤트 취소
        event.cancel = true;

        // 2. UI 호출 (beforeEvents 내부에서 직접 호출 불가하므로 system.run 사용)
        system.run(() => {
            openVillagerMenu(player, target);
        });
        
        world.sendMessage(`§b[UI] 주민(${target.id.slice(-4)}) 관리 인터페이스 강제 오픈 (거래창 차단됨)§r`);
    }
});

// ==========================================
// --- 기타 이벤트 리스너 ---
// ==========================================

world.afterEvents.entityHurt.subscribe((event) => {
    try {
        const victim = event.hurtEntity; 
        if (victim?.isValid() && victim.typeId === "minecraft:villager_v2") {
            const cause = event.damageSource?.cause ? String(event.damageSource.cause).toLowerCase() : "unknown";
            let msg = cause.includes("entity") ? "§4으악! 몹이다!§r" : "§c아야! 왜 때려!§r"; 
            showSpeechBubble(victim, msg, 40, true); 
            world.sendMessage(`§c[EVENT] 주민(${victim.id.slice(-4)}) 피격! 원인: ${cause}§r`);
        }
    } catch (err) {}
});

world.afterEvents.entityRemove.subscribe((event) => {
    try {
        if (event.typeId === "minecraft:villager_v2") {
            removeVillagerData(event.removedEntityId); 
            world.sendMessage(`§7[EVENT] 주민 데이터 제거됨 (ID: ${event.removedEntityId.slice(-4)})§r`);
        }
    } catch (err) {}
});