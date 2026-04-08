import { world } from "@minecraft/server";

// 시간대별 주민의 상태 정의
export const ScheduleState = {
    MORNING: "출근 중! 오늘도 열심히 일해야지.",
    AFTERNOON: "한창 일할 시간이야. 바쁘다 바빠!",
    EVENING: "드디어 퇴근! 마을 광장에서 수다나 떨까?",
    NIGHT: "졸려... 이제 자러 가야겠어."
};

// 마인크래프트 시간을 기반으로 현재 루틴 상태를 반환하는 함수
export function getCurrentRoutine() {
    const time = world.getTimeOfDay();

    // 마크 시간 기준 (0: 일출, 6000: 정오, 12000: 일몰, 18000: 자정)
    if (time >= 0 && time < 2000) return ScheduleState.MORNING;
    if (time >= 2000 && time < 12000) return ScheduleState.AFTERNOON;
    if (time >= 12000 && time < 14000) return ScheduleState.EVENING;
    return ScheduleState.NIGHT;
}