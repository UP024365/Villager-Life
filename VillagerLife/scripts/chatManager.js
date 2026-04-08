import { system } from "@minecraft/server";
const activeTimeouts = new Map(); 

export function showSpeechBubble(villager, message, durationInTicks = 60, force = false) {
    if (!villager?.isValid()) return;
    const id = villager.id;

    if (!force && activeTimeouts.has(id)) return;

    if (activeTimeouts.has(id)) {
        try { system.clearRun(activeTimeouts.get(id)); } catch (e) {}
        activeTimeouts.delete(id);
    }

    villager.nameTag = `§e${message}§r`; 

    const timeoutId = system.runTimeout(() => {
        // 내가 등록한 바로 그 타이머일 때만 이름표를 지움
        if (activeTimeouts.get(id) === timeoutId) {
            if (villager.isValid()) villager.nameTag = "";
            activeTimeouts.delete(id); 
        }
    }, durationInTicks);

    activeTimeouts.set(id, timeoutId);
}

export function isVillagerTalking(villagerId) {
    return activeTimeouts.has(villagerId);
}