import type { ChatSuggestion, CrisisResource, DailyAggregate } from '../types';

export interface RuleReply {
  crisis: boolean;
  empathy: string;
  suggestions: ChatSuggestion[];
  followUp: string;
  resources?: CrisisResource[];
}

/* ---------- Crisis detection ---------- */

const CRISIS_PATTERNS: RegExp[] = [
  /自杀|轻生|不想活|活不下去|活够了|结束(自己|生命)|了结(自己|生命)|一了百了/,
  /自残|自伤|割腕|划(自己|手腕)|伤害自己/,
  /(杀|捅|砍|弄死)(他|她|他们|人|自己)/,
  /跳楼|跳河|跳桥|上吊|烧炭|服药自尽|吃安眠药/,
];

/**
 * Explicit denials that MUST NOT trigger a crisis response.
 *
 * Important: "不想活" / "不想死" are NOT in this list — in Chinese they
 * are usually genuine crisis signals, unlike "不想自杀" which is a denial.
 */
const SAFE_DENIAL = new RegExp(
  [
    // "我不会 / 从没 / 根本没 + (再)?(去|想|要|打算|实施|做)? + 危机词"
    /(?:不会|不可能|绝不|决不会|从未|从没|压根没|根本没|不打算|无意|并没有|不曾|未曾)(?:再)?(?:去|想|要|打算|实施|做)?(?:自杀|轻生|自残|自伤|伤害自己|弄死自己|跳楼|上吊|烧炭|割腕|服安眠药)/.source,
    // "没想过自杀 / 没想过"
    /没想(?:过)?(?:自杀|轻生|自残|自伤|伤害自己)?/.source,
    // "不想自杀 / 不想死 / 不想寻死" (explicitly NOT "不想活")
    /不想(?:自杀|轻生|自残|自伤|死|寻死|了结自己|跳楼|上吊)/.source,
    // "没有任何自杀念头 / 没有想过"
    /没有(?:任何)?(?:自杀|自残|轻生|伤害自己)?(?:念头|想法|计划|意图|打算)/.source,
    // "只是开玩笑 / 随口说说 / 纯属假设"
    /只是(?:开玩笑|说说|随口|假设)|开玩笑|随口|纯属假设/.source,
  ].join('|'),
  'i'
);

export function detectCrisis(text: string): boolean {
  const t = text.replace(/\s+/g, '');
  for (const re of CRISIS_PATTERNS) {
    const m = re.exec(t);
    if (!m) continue;
    const before = t.slice(0, m.index);
    if (SAFE_DENIAL.test(before)) continue;
    return true;
  }
  return false;
}

const CRISIS_RESOURCES: CrisisResource[] = [
  { name: '全国统一心理援助热线',       contact: '12356（24 小时）' },
  { name: '北京心理危机研究与干预中心', contact: '010-8295-1332' },
  { name: '希望 24 热线',               contact: '400-161-9995' },
  { name: '紧急危险情况',               contact: '110 / 120' },
];

/* ---------- Intent classification ---------- */

type Intent =
  | 'anxiety' | 'low_mood' | 'anger' | 'insomnia'
  | 'loneliness' | 'fatigue' | 'positive' | 'neutral';

const INTENT_RULES: { intent: Intent; re: RegExp }[] = [
  { intent: 'anxiety',    re: /焦虑|紧张|担心|害怕|恐慌|心慌|不安|压力大|喘不过气|考试|面试|deadline/i },
  { intent: 'low_mood',   re: /难过|伤心|低落|沮丧|没意思|空虚|想哭|绝望|无望|提不起劲|抑郁|丧/i },
  { intent: 'anger',      re: /生气|愤怒|火大|烦死|气死|暴躁|受不了|崩溃|抓狂/i },
  { intent: 'insomnia',   re: /失眠|睡不着|入睡|半夜醒|早醒|熬夜|睡眠不好/i },
  { intent: 'loneliness', re: /孤独|孤单|没人|寂寞|被抛弃|不被理解|没人懂|没人陪/i },
  { intent: 'fatigue',    re: /好累|疲惫|疲倦|没力气|乏力|精疲力尽|撑不住/i },
  { intent: 'positive',   re: /开心|高兴|快乐|幸福|有希望|好起来|谢谢|感恩|顺利|不错/i },
];

const EMPATHY: Record<Intent, string[]> = {
  anxiety:    ['听起来你现在整个人是绷着的。', '这种悬着的感觉确实很耗人。'],
  low_mood:   ['我听到了，这段时间对你来说不轻松。', '能把它说出来，已经需要一点力气了。'],
  anger:      ['这事换谁都会上火。', '你的生气是有来由的，不用急着压下去。'],
  insomnia:   ['睡不着的时候，时间会变得特别难熬。', '身体躺下了，脑子还在跑，这种感觉很累。'],
  loneliness: ['被理解这件事，本来就不容易遇到。', '你现在说的这些，我认真在听。'],
  fatigue:    ['累到这个程度，是身体在发信号了。', '你已经撑了很久了。'],
  positive:   ['真好，这个感觉值得被记住。', '替你高兴。'],
  neutral:    ['嗯，我在听。', '谢谢你愿意说这些。'],
};

const FOLLOW_UP: Record<Intent, string> = {
  anxiety:    '现在你身体哪个部位最紧？肩膀、胸口还是胃？',
  low_mood:   '今天有没有哪一刻，稍微没那么沉？哪怕只有几分钟。',
  anger:      '如果给这股火打 0–10 分，现在是几分？',
  insomnia:   '你今晚是躺下睡不着，还是半夜醒了就再难睡回去？',
  loneliness: '最近一次觉得「有人懂我」是什么时候？',
  fatigue:    '你上一次真正休息（不是刷手机）是什么时候？',
  positive:   '是什么让今天变得不一样？',
  neutral:    '想多说说吗？哪一部分最让你在意？',
};

/* ---------- Suggestion library ---------- */

const SUGGESTIONS: Record<string, ChatSuggestion[]> = {
  breathing: [
    { label: '4-7-8 呼吸', detail: '吸气 4 秒 → 屏息 7 秒 → 缓慢呼气 8 秒，重复 4 轮。' },
    { label: '生理性叹气', detail: '连续两次短吸气 + 一次长呼气，做 5 次，能较快降低心率。' },
    { label: '方块呼吸', detail: '吸 4 - 停 4 - 呼 4 - 停 4，跟着节拍走 2 分钟。' },
  ],
  sleep: [
    { label: '固定起床时间', detail: '先固定起床时间（比固定入睡时间更重要），连续 7 天。' },
    { label: '15 分钟离床法', detail: '躺下 15 分钟没睡着就起身，到暗处做无聊的事，有困意再回床。' },
    { label: '睡前 90 分钟降光', detail: '把屏幕亮度调到最低，卧室温度 18–20℃。' },
  ],
  exercise: [
    { label: '10 分钟快走', detail: '饭后快走 10 分钟，比剧烈运动更容易坚持，对情绪改善也稳定。' },
    { label: '晨间日光', detail: '起床后 30 分钟内接触 10 分钟自然光，帮助校准生物钟。' },
    { label: '轻量抗阻', detail: '深蹲 / 俯卧撑各 2 组，强度到「还能说话」即可。' },
  ],
  music: [
    { label: '节奏匹配法', detail: '先放和你当前情绪同频的音乐，5 分钟后再切到稍轻快的曲子。' },
    { label: '白噪音', detail: '雨声 / 风扇声 45dB 左右，有助于入睡。' },
  ],
  drink: [
    { label: '洋甘菊茶', detail: '睡前 1 小时一杯，温热即可，不加糖。' },
    { label: '14:00 后断咖啡因', detail: '咖啡因半衰期约 5–6 小时，下午喝会推迟入睡。' },
  ],
  food: [
    { label: '色氨酸食物', detail: '睡前 2 小时少量：牛奶、香蕉、燕麦、坚果。' },
    { label: '稳定血糖', detail: '正餐加蛋白质 + 膳食纤维，避免情绪随血糖大起大落。' },
    { label: '别用酒精助眠', detail: '酒精让你更快入睡，但会显著破坏后半夜深睡和 REM。' },
  ],
};

const INTENT_SUGGESTIONS: Record<Intent, string[]> = {
  anxiety:    ['breathing', 'breathing', 'exercise', 'music'],
  low_mood:   ['exercise', 'music', 'food', 'breathing'],
  anger:      ['breathing', 'exercise', 'music'],
  insomnia:   ['sleep', 'sleep', 'drink', 'breathing'],
  loneliness: ['music', 'exercise', 'food'],
  fatigue:    ['sleep', 'food', 'exercise'],
  positive:   ['exercise', 'music'],
  neutral:    ['breathing', 'music'],
};

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

/* ---------- Context for personalizing rule replies ---------- */

function recentContext(daily: DailyAggregate[]) {
  const recent = daily.slice(-7);
  const avg = (k: keyof DailyAggregate) => {
    const vals = recent
      .map(d => d[k])
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  return {
    days: recent.length,
    sleep: avg('sleepDuration'),
    rhr: avg('restingHeartRate'),
    hrv: avg('hrv'),
    stress: avg('stress'),
  };
}

/* ---------- Public entry ---------- */

export function buildReply(text: string, daily: DailyAggregate[]): RuleReply {
  // Crisis always short-circuits.
  if (detectCrisis(text)) {
    return {
      crisis: true,
      empathy: '我听到了，你现在承受的比任何人都该承受的要多。你不需要一个人扛。',
      suggestions: [],
      followUp: '请立刻联系下面的资源，或让身边能信任的人现在过来陪你。',
      resources: CRISIS_RESOURCES,
    };
  }

  const rule = INTENT_RULES.find(r => r.re.test(text));
  const intent: Intent = rule ? rule.intent : 'neutral';

  const empathy = pick(EMPATHY[intent], 1)[0];

  const cats = [...new Set(INTENT_SUGGESTIONS[intent])];
  const suggestions: ChatSuggestion[] = [];
  for (const c of cats) {
    if (suggestions.length >= 3) break;
    suggestions.push(pick(SUGGESTIONS[c], 1)[0]);
  }

  const ctx = recentContext(daily);
  let dataNote = '';
  if (ctx.days >= 3) {
    if (intent === 'insomnia' && ctx.sleep) {
      dataNote = ` 你最近 ${ctx.days} 天平均睡眠 ${(ctx.sleep / 60).toFixed(1)} 小时。`;
    } else if (intent === 'anxiety' && ctx.hrv) {
      dataNote = ` 你最近 ${ctx.days} 天平均 HRV 是 ${ctx.hrv.toFixed(0)} ms，HRV 偏低通常和交感神经过度激活有关。`;
    } else if (intent === 'fatigue' && ctx.rhr) {
      dataNote = ` 你最近 ${ctx.days} 天静息心率平均 ${ctx.rhr.toFixed(0)} bpm。`;
    } else if (intent === 'low_mood' && ctx.sleep) {
      dataNote = ` 最近 ${ctx.days} 天你平均睡了 ${(ctx.sleep / 60).toFixed(1)} 小时。`;
    }
  }

  return {
    crisis: false,
    empathy: empathy + dataNote,
    suggestions,
    followUp: FOLLOW_UP[intent],
  };
}

/** Exposed for the AI module to reuse the same intent guess. */
export function guessIntent(text: string): Intent {
  const rule = INTENT_RULES.find(r => r.re.test(text));
  return rule ? rule.intent : 'neutral';
}
