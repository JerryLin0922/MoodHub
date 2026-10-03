/**
 * SCL-90 (Symptom Checklist 90) — self-report symptom inventory.
 *
 * 90 items rated 1–5 (1 = not at all, 5 = extremely). Nine symptom factors
 * plus seven additional items. For reference/screening only — NOT a diagnosis.
 */

export const SCL90_OPTIONS = [
  { label: '没有', score: 1 },
  { label: '很轻', score: 2 },
  { label: '中等', score: 3 },
  { label: '偏重', score: 4 },
  { label: '严重', score: 5 },
] as const;

export const SCL90_ITEMS: string[] = [
  '头痛',
  '神经过敏，心中不踏实',
  '头脑中有不必要的想法或字句盘旋',
  '头晕或晕倒',
  '对异性的兴趣减退',
  '对旁人责备求全',
  '感到别人能控制你的思想',
  '责怪别人制造麻烦',
  '忘记性大',
  '担心自己的衣饰整齐及仪态的端正',
  '容易烦恼和激动',
  '胸痛',
  '害怕空旷的场所或街道',
  '感到自己的精力下降，活动减慢',
  '想结束自己的生命',
  '听到旁人听不到的声音',
  '发抖',
  '感到大多数人都不可信任',
  '胃口不好',
  '容易哭泣',
  '同异性相处时感到害羞不自在',
  '感到受骗、中了圈套或有人想抓住您',
  '无故地突然感到害怕',
  '自己不能控制地大发脾气',
  '怕单独出门',
  '经常责怪自己',
  '腰痛',
  '感到难以完成任务',
  '感到孤独',
  '感到苦闷',
  '过分担忧',
  '对事物不感兴趣',
  '感到害怕',
  '您的感情容易受到伤害',
  '旁人能知道您的私下想法',
  '感到别人不理解您、不同情您',
  '感到人们对您不友好，不喜欢您',
  '做事必须做得很慢以保证做得正确',
  '心跳得很厉害',
  '恶心或胃部不舒服',
  '感到比不上他人',
  '肌肉酸痛',
  '感到有人在监视您、谈论您',
  '难以入睡',
  '做事必须反复检查',
  '难以作出决定',
  '怕乘电车、公共汽车、地铁或火车',
  '呼吸有困难',
  '一阵阵发冷或发热',
  '因为感到害怕而避开某些东西、场合或活动',
  '脑子变空了',
  '身体发麻或刺痛',
  '喉咙有梗塞感',
  '感到前途没有希望',
  '不能集中注意力',
  '感到身体的某一部分软弱无力',
  '感到紧张或容易紧张',
  '感到手或脚发重',
  '想到死亡的事',
  '吃得太多',
  '当别人看着您或谈论您时感到不自在',
  '有一些不属于您自己的想法',
  '有想打人或伤害他人的冲动',
  '醒得太早',
  '必须反复洗手、点数目或触摸某些东西',
  '睡得不稳不深',
  '有想摔坏或破坏东西的冲动',
  '有一些别人没有的想法或念头',
  '感到对别人神经过敏',
  '在商店或电影院等人多的地方感到不自在',
  '感到任何事情都很困难',
  '一阵阵恐惧或惊恐',
  '感到在公共场合吃东西很不舒服',
  '经常与人争论',
  '单独一人时神经很紧张',
  '别人对您的成绩没有任何恰当的评价',
  '即使和别人在一起也感到孤单',
  '感到坐立不安、心神不定',
  '感到自己没有什么价值',
  '感到熟悉的东西变成陌生或不像是真的',
  '大叫或摔东西',
  '害怕会在公共场合昏倒',
  '感到别人想占您的便宜',
  '为一些有关性的想法而很苦恼',
  '您认为应该因为自己的过错而受到惩罚',
  '感到要很快把事情做完',
  '感到自己的身体有严重问题',
  '从未感到和其他人很亲近',
  '感到自己有罪',
  '感到自己的脑子有毛病',
];

/** Factor definitions: 1-based item numbers per SCL-90 scoring key. */
export const SCL90_FACTORS: { id: string; name: string; items: number[] }[] = [
  { id: 'somatization',           name: '躯体化',         items: [1, 4, 12, 27, 40, 42, 48, 49, 52, 53, 56, 58] },
  { id: 'obsessive-compulsive',   name: '强迫症状',       items: [3, 9, 10, 28, 38, 45, 46, 51, 55, 65] },
  { id: 'interpersonal',          name: '人际关系敏感',   items: [6, 21, 34, 36, 37, 41, 61, 69, 73] },
  { id: 'depression',             name: '抑郁',           items: [5, 14, 15, 20, 22, 26, 29, 30, 31, 32, 54, 71, 79] },
  { id: 'anxiety',                name: '焦虑',           items: [2, 17, 23, 33, 39, 57, 72, 78, 80, 86] },
  { id: 'hostility',              name: '敌对',           items: [11, 24, 63, 67, 74, 81] },
  { id: 'phobic-anxiety',         name: '恐怖',           items: [13, 25, 47, 50, 70, 75, 82] },
  { id: 'paranoid-ideation',      name: '偏执',           items: [8, 18, 43, 68, 76, 83] },
  { id: 'psychoticism',           name: '精神病性',       items: [7, 16, 35, 62, 77, 84, 85, 87, 88, 90] },
];

/** Additional items (sleep/appetite/guilt) scored separately, not in any factor. */
export const SCL90_EXTRA_ITEMS = [19, 44, 59, 60, 64, 66, 89];

/** Items that may indicate an active crisis; a score >= 2 must surface a warning. */
export const SCL90_CRISIS_ITEMS = [15, 59] as const;

export interface SCL90FactorScore {
  id: string;
  name: string;
  /** 1-based item numbers answered within this factor. */
  answered: number;
  /** Average score (0 when no item answered). */
  score: number;
  /** True when average >= 2 (common screening threshold). */
  elevated: boolean;
}

export interface SCL90Result {
  total: number;
  mean: number;
  positiveCount: number;
  positiveMean: number;
  factorScores: SCL90FactorScore[];
  extraMean: number;
  /** Positive screen: any factor >= 2, total >= 160, or >= 43 positive items. */
  screenPositive: boolean;
  crisisItems: number[];
}

/**
 * Score a completed SCL-90. `answers` maps 0-based item index -> 1..5.
 * Missing items are excluded from totals and factor means.
 */
export function scoreSCL90(answers: Record<number, number>): SCL90Result {
  const values: (number | undefined)[] = SCL90_ITEMS.map((_, i) => {
    const v = answers[i];
    return v != null && v >= 1 && v <= 5 ? v : undefined;
  });

  const answered = values.filter((v): v is number => v != null);
  const total = answered.reduce((a, b) => a + b, 0);
  const positive = answered.filter(v => v >= 2);
  const positiveCount = positive.length;
  const positiveMean = positiveCount > 0 ? positive.reduce((a, b) => a + b, 0) / positiveCount : 0;

  const factorScores: SCL90FactorScore[] = SCL90_FACTORS.map(f => {
    const nums = f.items
      .map(n => values[n - 1])
      .filter((v): v is number => v != null);
    const score = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    return {
      id: f.id,
      name: f.name,
      answered: nums.length,
      score,
      elevated: score >= 2,
    };
  });

  const extraNums = SCL90_EXTRA_ITEMS
    .map(n => values[n - 1])
    .filter((v): v is number => v != null);
  const extraMean = extraNums.length > 0
    ? extraNums.reduce((a, b) => a + b, 0) / extraNums.length
    : 0;

  const screenPositive =
    factorScores.some(f => f.elevated) ||
    total >= 160 ||
    positiveCount >= 43;

  const crisisItems = [...SCL90_CRISIS_ITEMS].filter(n => {
    const v = values[n - 1];
    return v != null && v >= 2;
  });

  return {
    total,
    mean: answered.length > 0 ? total / answered.length : 0,
    positiveCount,
    positiveMean,
    factorScores,
    extraMean,
    screenPositive,
    crisisItems,
  };
}

export const SCL90_DISCLAIMER =
  '本量表为症状自评参考，不能替代临床诊断。若结果提示阳性或你正经历心理困扰，建议前往精神/心理专科进一步评估。';
