import { system } from "@minecraft/server";

// 주민들이 할 다양한 대사 리스트
const dialogs = [
    "§e안녕? 오늘 마을 날씨가 참 좋네!§r",
    // ... 기존 대사 유지
];

// 주민 ID별로 현재 작동 중인 타이머를 저장할 Map
const activeTimeouts = new Map(); 

export function showSpeechBubble(villager, message, durationInTicks = 60, force = false) {
    const id = villager.id;

    if (!force && villager.hasTag("isTalking")) return;

    // 핵심 수정: force로 강제 덮어쓰기 시, 기존에 돌고 있던 말풍선 끄기 타이머를 강제 취소
    if (activeTimeouts.has(id)) {
        system.clearRun(activeTimeouts.get(id));
        activeTimeouts.delete(id);
    }

    villager.nameTag = `§e${message}§r`; 
    
    if (!villager.hasTag("isTalking")) {
        villager.addTag("isTalking");
    }

    const timeoutId = system.runTimeout(() => {
        if (villager.isValid()) {
            villager.nameTag = "";
            villager.removeTag("isTalking");
        }
        activeTimeouts.delete(id); // 타이머 종료 시 Map에서도 제거
    }, durationInTicks);

    // 새로운 타이머 등록
    activeTimeouts.set(id, timeoutId);
}