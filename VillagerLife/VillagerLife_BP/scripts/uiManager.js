import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

/**
 * 주민 관리 메뉴를 엽니다.
 * [업데이트] 자경단 임명/해제 버튼 및 무기(철검) 지급 로직이 통합되었습니다.
 */
export function openVillagerMenu(player, villager) {
    const vId = villager.id.slice(-4);
    const professionComp = villager.getComponent("minecraft:villager_v2");
    const profession = professionComp?.profession || "무직";

    // 1. 현재 주민의 역할 상태 확인 (기본값: CITIZEN) [cite: 50, 81]
    const role = villager.getDynamicProperty("village:role") || "CITIZEN";
    const isMilitia = role === "MILITIA";

    // 1틱 지연 실행하여 UI 안정성 확보
    system.runTimeout(() => {
        const form = new ActionFormData()
            .title(`§l주민 관리 - ${profession}§r`)
            .body(`대상 ID: ${vId}\n현재 상태: ${isMilitia ? "§6자경단§r" : "일반 주민"}\n지시할 행동을 선택하세요.`)
            // [버튼 0] 자경단 상태에 따라 텍스트가 변경되는 버튼 추가 
            .button(isMilitia ? "🛡️ 자경단 보직 해제" : "⚔️ 자경단으로 임명\n(철검 지급)")
            .button("📦 자원 기부\n(인벤토리 비우기)")
            .button("🛠️ 마을 보수\n(주변 시설 점검)")
            .button("❌ 닫기");

        form.show(player).then((response) => {
            if (response.canceled) return;

            switch (response.selection) {
                case 0: // 자경단 임명 및 해제 처리 [cite: 80]
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
 * 자경단 역할을 부여/해제하고 시각적인 무기(칼)를 관리합니다.
 */
function handleMilitiaRole(player, villager, currentIsMilitia) {
    const vId = villager.id.slice(-4);
    const equippable = villager.getComponent("minecraft:equippable"); // 장비 컴포넌트 접근 [cite: 73, 82]
    
    if (currentIsMilitia) {
        // --- 자경단 해제 로직 ---
        villager.setDynamicProperty("village:role", "CITIZEN");
        
        // 주 손(Mainhand)의 아이템 회수 [cite: 83, 90]
        if (equippable) {
            equippable.setEquipment("Mainhand", undefined);
        }
        
        player.sendMessage(`§7[알림] 주민(${vId})의 자경단 보직을 해제했습니다.§r`);
    } else {
        // --- 자경단 임명 로직 ---
        villager.setDynamicProperty("village:role", "MILITIA"); // 시스템상 역할 부여 [cite: 70]
        
        // 철검 지급 및 시각적 장착 [cite: 73, 82]
        if (equippable) {
            try {
                const sword = new ItemStack("minecraft:iron_sword", 1);
                equippable.setEquipment("Mainhand", sword); // 주 손에 칼 설정 [cite: 90]
            } catch (err) {
                player.sendMessage("§c[오류] 무기 지급에 실패했습니다: " + err);
            }
        }
        
        player.sendMessage(`§6[알림] 주민(${vId})을 자경단으로 임명하고 무기를 지급했습니다!§r`);
        
        // 임명 시 효과음 재생
        const { x, y, z } = villager.location;
        villager.dimension.runCommandAsync(`playsound random.anvil_use @a ${x} ${y} ${z}`).catch(()=>{});
    }
}