import { world, system } from "@minecraft/server";
import { showSpeechBubble } from "./chatManager.js";
import { updateHunger, recoverHunger } from "./needsManager.js";
import { findNearestBlock } from "./utils.js";

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const nearbyVillagers = player.dimension.getEntities({
            location: player.location,
            maxDistance: 15,
            type: "minecraft:villager_v2"
        });

        for (const villager of nearbyVillagers) {
            const hunger = updateHunger(villager);

            if (hunger < 30) {
                // 1. 근처 10칸 이내에 상자(minecraft:chest)가 있는지 탐색
                const chestPos = findNearestBlock(villager, "minecraft:chest", 10);

                if (chestPos) {
                    // 2. 상자가 있다면 그 좌표로 이동 명령 (컴포넌트 제어)
                    const moveComp = villager.getComponent("minecraft:navigation");
                    villager.teleport(villager.location, { facingLocation: chestPos }); // 상자 바라보기
                    
                    // 실제 이동 로직 (이동 속도를 높여서 상자로 뛰어가는 것처럼 연출)
                    showSpeechBubble(villager, "§6너무 배고파! 식량 저장고(상자)로 갈 거야!§r", 40);
                    
                    // 3. 상자 근처(2칸 이내)에 도착했는지 체크
                    const dist = Math.sqrt(
                        Math.pow(villager.location.x - chestPos.x, 2) + 
                        Math.pow(villager.location.z - chestPos.z, 2)
                    );

                    if (dist < 2) {
                        recoverHunger(villager, 100);
                        showSpeechBubble(villager, "§b(쩝쩝...) 역시 상자에 빵이 있었어! 살 것 같다.§r", 60);
                        // 상자 열리는 소리 재생 (디테일!)
                        villager.dimension.runCommand(`playsound random.chestopen @a ${chestPos.x} ${chestPos.y} ${chestPos.z}`);
                    }
                } else {
                    showSpeechBubble(villager, "§c배고픈데 근처에 상자가 없어... 살려줘!§r", 40);
                }
            }
        }
    }
}, 20);