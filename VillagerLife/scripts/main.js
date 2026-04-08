import { world, system } from "@minecraft/server";
import { showSpeechBubble } from "./chatManager.js";
import { getCurrentRoutine } from "./scheduleManager.js"; // 새 모듈 불러오기

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const nearbyVillagers = player.dimension.getEntities({
            location: player.location,
            maxDistance: 5,
            type: "minecraft:villager_v2"
        });

        for (const villager of nearbyVillagers) {
            // 현재 시간에 따른 루틴 대사 가져오기
            const currentMessage = getCurrentRoutine();
            
            // 말풍선 띄우기 (기존 chatManager의 함수를 재활용하되 메시지만 변경)
            // chatManager.js의 showSpeechBubble 함수에서 
            // randomMsg 대신 매개변수로 메시지를 받게 살짝 수정하면 더 좋습니다!
            showSpeechBubble(villager, currentMessage, 60); 
        }
    }
}, 20);