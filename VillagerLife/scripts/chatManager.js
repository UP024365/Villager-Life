import { system } from "@minecraft/server";

// 주민들이 할 다양한 대사 리스트
const dialogs = [
    "§e안녕? 오늘 마을 날씨가 참 좋네!§r",
    "§a에메랄드 좀 있어? 거래하자!§r",
    "§b요즘 농사일이 너무 피곤해...§r",
    "§d우리 마을에 온 걸 환영해!§r",
    "§c배고파... 빵 좀 주라!§r"
];

// chatManager.js 수정본
export function showSpeechBubble(villager, message, durationInTicks = 60) {
    if (villager.hasTag("isTalking")) return;

    villager.nameTag = `§e${message}§r`; // 매개변수로 받은 메시지 출력
    villager.addTag("isTalking");

    system.runTimeout(() => {
        if (villager.isValid()) {
            villager.nameTag = "";
            villager.removeTag("isTalking");
        }
    }, durationInTicks);
}