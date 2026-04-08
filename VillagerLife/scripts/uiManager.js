import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

export function openVillagerMenu(player, villager) {
    const vId = villager.id.slice(-4);
    const professionComp = villager.getComponent("minecraft:villager_v2");
    const profession = professionComp?.profession || "무직";

    // 1틱 지연 실행하여 UI 안정성 확보
    system.runTimeout(() => {
        const form = new ActionFormData()
            .title(`§l주민 관리 - ${profession}§r`)
            .body(`대상 ID: ${vId}\n지시할 행동을 선택하세요.`)
            .button("📦 자원 기부\n(인벤토리 비우기)")
            .button("🛠️ 마을 보수\n(주변 시설 점검)")
            .button("💰 일반 거래창 열기\n(종이 없이 우클릭)")
            .button("❌ 닫기");

        form.show(player).then((response) => {
            if (response.canceled) return;

            switch (response.selection) {
                case 0:
                    player.sendMessage(`§a[명령] 주민(${vId})에게 자원 운반을 지시했습니다.§r`);
                    break;
                case 1:
                    player.sendMessage(`§e[명령] 주민(${vId})이 마을을 순찰하며 보수합니다.§r`);
                    break;
                case 2:
                    player.sendMessage("§7일반 거래를 원하시면 종이를 내려놓고 우클릭하세요.§r");
                    break;
            }
        });
    }, 1);
}