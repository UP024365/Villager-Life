// utils.js 수정 예시
export function findNearestBlock(entity, blockType, radius) {
    // 주민의 위치를 정수로 변환하여 블록 좌표계와 일치시킴
    const x = Math.floor(entity.location.x);
    const y = Math.floor(entity.location.y);
    const z = Math.floor(entity.location.z);
    
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const targetPos = { x: x + dx, y: y + dy, z: z + dz };
                const block = entity.dimension.getBlock(targetPos);
                
                // 블록이 존재하고 typeId가 일치하는지 확인
                if (block && block.typeId === blockType) {
                    return targetPos;
                }
            }
        }
    }
    return null;
}