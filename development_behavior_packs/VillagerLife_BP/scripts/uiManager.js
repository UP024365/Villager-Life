import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

/**
 * 주민 관리 메뉴를 엽니다.
 * [업데이트] 임명 시 일반 주민을 제거하고 전용 자경단 엔티티(custom:militia)를 소환합니다.
 */
export function openVillagerMenu(player, villager) {
    const vId = villager.id.slice(-4);
    const professionComp = villager.getComponent("minecraft:villager_v2");
    const profession = professionComp?.profession || "무직";

    // 현재 엔티티가 자경단(custom:militia)인지 확인 [cite: 157]
    const isMilitia = villager.typeId === "custom:militia";

    system.runTimeout(() => {
        const form = new ActionFormData()
            .title(`§l주민 관리 - ${profession}§r`)
            .body(`대상 ID: ${vId}\n현재 상태: ${isMilitia ? "§6자경단 (전투 모드)§r" : "일반 주민"}\n지시할 행동을 선택하세요.`)
            .button(isMilitia ? "🛡️ 자경단 보직 해제\n(일반 주민으로 복귀)" : "⚔️ 자경단으로 임명\n(전투 AI 활성화)")
            .button("📦 자원 기부\n(인벤토리 비우기)")
            .button("🛠️ 마을 보수\n(주변 시설 점검)")
            .button("❌ 닫기");

        form.show(player).then((response) => {
            if (response.canceled) return;

            switch (response.selection) {
                case 0: // 엔티티 교체 로직 실행 
                    handleMilitiaRole(player, villager, isMilitia);
                    break;
                case 1:
                    player.sendMessage(`§a[명령] 주민(${vId})에게 자원 운반을 지시했습니다.§r`);
                    break;
                case 2:
                    player.sendMessage(`§e[명령] 주민(${vId})이 마을을 순찰하며 보수합니다.§r`);
                    break;
            }
        });
    }, 1);
}

/**
 * 일반 주민과 자경단 엔티티 간의 교체를 처리합니다.
 */
function handleMilitiaRole(player, villager, currentIsMilitia) {
    const loc = villager.location;
    const dim = villager.dimension;
    const vId = villager.id.slice(-4);

    if (currentIsMilitia) {
        // --- 자경단 -> 일반 주민 교체 --- [cite: 188]
        villager.remove(); // 자경단 엔티티 제거
        const newVillager = dim.spawnEntity("minecraft:villager_v2", loc);
        
        // 새로 생성된 주민에게 기본 속성 부여
        newVillager.setDynamicProperty("village:role", "CITIZEN");
        
        player.sendMessage(`§7[알림] 자경단(${vId})이 일반 주민으로 돌아갔습니다.§r`);
    } else {
        // --- 일반 주민 -> 자경단 교체 --- [cite: 187]
        villager.remove(); // 일반 주민 엔티티 제거
        const militia = dim.spawnEntity("custom:militia", loc); // BP에 정의된 자경단 소환
        
        // 자경단 속성 부여 및 시각적 무기 장착 [cite: 93, 165]
        militia.setDynamicProperty("village:role", "MILITIA");
        const equippable = militia.getComponent("minecraft:equippable");
        if (equippable) {
            const sword = new ItemStack("minecraft:iron_sword", 1);
            equippable.setEquipment("Mainhand", sword);
        }

        player.sendMessage(`§6[알림] 주민(${vId})이 용감한 자경단으로 임명되었습니다!§r`);
        
        // 임명 효과음
        dim.runCommandAsync(`playsound random.anvil_use @a ${loc.x} ${loc.y} ${loc.z}`).catch(()=>{});
    }
}