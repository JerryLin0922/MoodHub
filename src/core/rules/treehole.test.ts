import { describe, expect, it } from 'vitest';
import { buildReply, detectCrisis } from './treehole';

describe('detectCrisis', () => {
  it('detects direct crisis statements', () => {
    expect(detectCrisis('我不想活了')).toBe(true);
    expect(detectCrisis('我想自杀')).toBe(true);
    expect(detectCrisis('活着太痛苦，想结束生命')).toBe(true);
    expect(detectCrisis('最近一直想割腕')).toBe(true);
    expect(detectCrisis('真想一了百了')).toBe(true);
  });

  it('does not fire on explicit denials', () => {
    expect(detectCrisis('我不会自杀，只是想找人聊聊')).toBe(false);
    expect(detectCrisis('没想过轻生')).toBe(false);
    expect(detectCrisis('我不是想自杀，就是压力大')).toBe(false);
    expect(detectCrisis('别担心，我不会伤害自己')).toBe(false);
    expect(detectCrisis('我只是开玩笑说想自杀')).toBe(false);
  });

  it('does not fire on normal venting', () => {
    expect(detectCrisis('今天工作好累')).toBe(false);
    expect(detectCrisis('有点焦虑，怕考试发挥不好')).toBe(false);
  });
});

describe('buildReply', () => {
  it('short-circuits to crisis resources', () => {
    const r = buildReply('我不想活了', []);
    expect(r.crisis).toBe(true);
    expect(r.resources?.length).toBeGreaterThan(0);
    expect(r.followUp).toContain('资源');
  });

  it('returns structured non-crisis reply with suggestions', () => {
    const r = buildReply('最近总是失眠，半夜就醒', []);
    expect(r.crisis).toBe(false);
    expect(r.empathy.length).toBeGreaterThan(0);
    expect(r.suggestions.length).toBeGreaterThan(0);
    expect(r.followUp.length).toBeGreaterThan(0);
  });

  it('personalizes with recent data', () => {
    const daily = [
      { date: '2026-09-20', sleepDuration: 360 },
      { date: '2026-09-21', sleepDuration: 420 },
      { date: '2026-09-22', sleepDuration: 390 },
    ];
    const r = buildReply('又失眠了', daily);
    expect(r.empathy).toContain('小时');
  });
});
