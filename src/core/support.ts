/**
 * AI + 真人混合陪伴探索（ROADMAP-2026 阶段三）。
 * 定位：本地 AI 承担 24/7 即时倾听与记录，真人（志愿者 / 专业人士）作为
 * 可选匿名升级路径。本模块只做透明渠道引导，不做付费墙式情感依赖生意；
 * 危机场景仍由 treehole 危机规则优先处理并升级人工。
 */
import type { CrisisResource } from './types';

/**
 * 公开、稳定的心理支持渠道（与危机规则的渠道一致，避免编造号码）。
 * 仅保留官方 / 广泛公开的号码；紧急情况一律引导 110 / 120。
 */
export const HUMAN_SUPPORT_CHANNELS: CrisisResource[] = [
  { name: '全国统一心理援助热线', contact: '12356（24 小时）' },
  { name: '北京心理危机研究与干预中心', contact: '010-8295-1332' },
  { name: '希望 24 热线', contact: '400-161-9995' },
  { name: '紧急危险情况', contact: '110 / 120' },
];

/**
 * 检测用户是否主动寻求真人 / 人工支持（区别于 AI 陪伴的意愿）。
 * 命中后回复将附带真人支持渠道，作为可选升级路径。
 */
export function detectHumanSupportIntent(text: string): boolean {
  return /真人|人工|人类|找个人|找真人|有人聊聊|有人陪我|电话|热线|心理医生|心理咨询|咨询师|咨询|预约|线下|求助渠道|专业帮助|专业人士|志愿者|客服|找谁|找组织|联系谁/i.test(
    text
  );
}
