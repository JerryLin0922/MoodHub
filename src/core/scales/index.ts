/**
 * Brief self-report scales (for reference only, NOT medical diagnosis).
 * Includes common items and simple score interpretation hints.
 */

export interface ScaleOption {
  label: string;
  score: number;
}

export interface Scale {
  id: string;
  name: string;
  shortName: string;
  description: string;
  items: string[];
  options: ScaleOption[];
  /** Callback receiving the sum of scores; returns the interpretation hint. */
  interpret: (total: number) => string;
  disclaimer: string;
}

const FREQ_OPTIONS: ScaleOption[] = [
  { label: '没有', score: 0 },
  { label: '有几天', score: 1 },
  { label: '一半以上天数', score: 2 },
  { label: '几乎每天', score: 3 },
];

export const SCALES: Scale[] = [
  {
    id: 'phq9',
    name: '患者健康问卷（PHQ-9）',
    shortName: 'PHQ-9',
    description: '过去两周的抑郁相关感受。',
    items: [
      '做事时提不起劲或没有兴趣',
      '感到心情低落、沮丧或绝望',
      '入睡困难、睡不安稳或睡太多',
      '感觉疲倦或没有活力',
      '食欲不振或吃太多',
      '觉得自己很糟，或觉得自己让家人失望',
      '专注力下降，例如看报纸或看电视有困难',
      '动作或说话变得迟缓，或烦躁坐立不安',
      '有不如死掉或用某种方式伤害自己的念头',
    ],
    options: FREQ_OPTIONS,
    interpret: total => {
      if (total >= 15) return '中重度及以上，建议尽快咨询精神/心理专科。';
      if (total >= 10) return '中度，建议关注并考虑专业评估。';
      if (total >= 5) return '轻度，可先自我调节并持续观察。';
      return '当前倾向不明显，继续保持规律作息。';
    },
    disclaimer: '若第 9 项（自伤念头）得分大于 0，请立即联系专业援助（12356 / 110）。',
  },
  {
    id: 'gad7',
    name: '广泛性焦虑量表（GAD-7）',
    shortName: 'GAD-7',
    description: '过去两周的焦虑相关感受。',
    items: [
      '感到紧张、焦虑或急切',
      '不能停止或控制担忧',
      '对各种各样的事情担忧过多',
      '很难放松下来',
      '由于不安而无法静坐',
      '变得容易烦恼或急躁',
      '感到好像有什么可怕的事情会发生',
    ],
    options: FREQ_OPTIONS,
    interpret: total => {
      if (total >= 15) return '重度焦虑倾向，建议尽快寻求专业评估。';
      if (total >= 10) return '中度焦虑，建议关注并考虑专业评估。';
      if (total >= 5) return '轻度焦虑，可先使用放松训练并观察。';
      return '当前倾向不明显。';
    },
    disclaimer: '本量表仅作自评参考，不能替代临床诊断。',
  },
];

export function getScale(id: string): Scale | undefined {
  return SCALES.find(s => s.id === id);
}
