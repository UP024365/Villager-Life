import { world, system } from "@minecraft/server";

// 아이템을 사용할 때 발생하는 이벤트
world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;

  // 사과를 사용했을 때만 작동
  if (item.typeId === "minecraft:apple") {
    player.sendMessage("§c사과를 사용했습니다! 3초 뒤에 폭발합니다!§r");

    // 3초(60틱) 뒤에 폭발 실행
    system.runTimeout(() => {
      const location = player.location;
      // 플레이어 위치에 폭발 생성 (위력 3, 불 안붙음, 블록 파괴 안함)
      player.dimension.createExplosion(location, 3, { causesFire: false, breaksBlocks: false });
      player.sendMessage("§l§e펑!§r");
    }, 60);
  }
});