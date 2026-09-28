# MoodHub 项目本体

> 更新日期：2026-09-28（第二轮：2026-10 迭代实体与关系更新）
> MoodHub 的实体-类型-关系结构化视图，用于项目协作、知识管理与新人上手。
> 本版纳入 2026-09 用户反馈与市场研究新增实体；可执行图谱见本地 `memory/ontology/graph.jsonl`（ontology skill）。

## 实体类型

| 类型 | 实体 |
| --- | --- |
| Project | MoodHub |
| Platform | Web / Android / iOS / Windows / macOS / Linux / HarmonyOS(PWA) |
| Feature | Overview / Diary / Import / TreeHole / AISettings / ScalePanel / ImportGuide / Gameplay / CompanionMode |
| Tech | React 18 / TypeScript 5 / Vite 5 / Tailwind 3 / recharts / Electron / Capacitor 6 |
| Standard | PHQ-9 / GAD-7 |
| DataStore | localStorage / sessionStorage |
| AIProvider | DeepSeek / Qwen / Tencent Hunyuan / Gemini / OpenAI / Custom(OpenAI-compatible) / LocalLLM(Ollama, LM Studio) |
| Doc | README / RESEARCH-2026 / ROADMAP-2026 / FEEDBACK-2026 / FIRST-PRINCIPLES / ANDROID / HARMONY / ONTOLOGY |
| Risk | 危机信号 / 数据隐私 / 未成年人合规 / 临床主张越界 / 危机转介合规 / 情感依赖 |
| Regulation | CAC 拟人化互动服务办法（2026-07-15 施行）/ 加州 SB 243 / EU AI Act（2026-08 全面执行）/ 香港三层应急机制 / 州级 AI 疗法立法（IL WOPR / NV AB 406 / RI H7349·S2197 / ME LD 2082 / CO / TN / VT / CT 综合 AI 法）/ WA My Health My Data / FTC 执法 |
| UserFeedback | 日记趣味性不足（FB-2026-09-01）/ 导入无引导（FB-2026-09-02）/ 陪伴定位思考（FB-2026-09-03） |
| Competitor | Finch / HeartGarden / Daylio / Voidpet / Wysa / Woebot / TalkspaceTee / 给力心理 / 旧纸树洞 / 同频树洞 / 知己CCBT / 林间疗愈 / PsychDiary / Reflectly / Stoic / HowWeFeel |
| MarketTrend | 游戏化日记趋势 / 付费陪聊市场 / AI商业化教训 / 软硬融合 |
| Evidence | ICITRI2025（游戏化日记 DASS-42 显著下降 p<0.05）/ Wysa 临床试验 8 项 |

## 核心关系

- MoodHub --contains--> Feature
- Feature --uses--> Tech
- Feature --implements--> Standard（ScalePanel --implements--> PHQ-9 / GAD-7）
- MoodHub --stores--> DataStore（全部数据本机存储，无服务器）
- TreeHole --optional--> AIProvider（仅最近 8 条消息发送）
- TreeHole --local--> 危机识别规则引擎（不走 AI，不发网络请求）
- MoodHub --documents--> Doc
- MoodHub --mitigates--> Risk
- MoodHub --compliesWith--> Regulation（未成年人模式 / AI 身份标识 / 防依赖设计 / 非治疗声明 / 危机转介协议）
- MoodHub --plans--> ImportGuide / Gameplay（回应反馈 FB-2026-09-01/02）
- MoodHub --explores--> CompanionMode（回应反馈 FB-2026-09-03）
- Gameplay --benchmarksAgainst--> Finch / HeartGarden / Daylio / Voidpet
- Gameplay --supportedBy--> ICITRI2025
- CompanionMode --benchmarksAgainst--> Wysa / TalkspaceTee / 给力心理
- Competitor --demonstrates--> MarketTrend

## 领域知识映射

### 隐私
- 无账号体系、无遥测、无第三方统计 SDK
- API Key 可选仅会话有效（sessionStorage）
- 行业基线（2026）：25 款 Android 心理 App 全部含未披露 tracker SDK → MoodHub 本地优先是差异化优势

### 危机处理
- 识别 → 本地资源卡（12356 / 18111 / 988 等）→ 不上报、不发网络请求
- 2026-09 新增提案：危机预案「一键信封」（用户显式授权后 24h 未打开资源卡才触发，默认关闭）

### 合规关注
- 中国：《人工智能拟人化互动服务管理暂行办法》（2026-03 公布、2026-07-15 施行）：AI 身份标识、未成年人虚拟亲密关系禁令、连续使用 2 小时休息提醒、防情感依赖；未成年人网络保护指南草案（征求意见至 10-17）
- 美国：州法两阵营——禁止（IL / NV / RI / ME / CO / TN / VT）、披露+危机转介（UT / NY / CA / NE / OR / CT / TX）；FTC 对治疗性表述执法；WA My Health My Data；联邦无综合框架（2025-12 EO 抢占之争）
- 欧盟：EU AI Act 陪伴系统实施法案 2026-08-02 生效（一致性评估）
- 香港：三层应急机制恒常化（2025-12-01 起）

### 用户反馈 → 设计映射（2026-09）
- FB-2026-09-01 日记趣味性不足 → Gameplay（情绪花园 / streak / 成就）
- FB-2026-09-02 导入无引导 → ImportGuide（三步向导 / 来源模板 / 示例数据）
- FB-2026-09-03 陪伴定位思考 → CompanionMode（AI 即时 + 真人可选，边界清晰，无成瘾设计）

## 未来实体（Roadmap 引入）

- Feature: EmotionFootprint（情绪足迹）
- Feature: PeriodicReport（周期回顾报告）
- Feature: LocalLLM（Ollama / LM Studio 接入）
- Feature: DataExport / DataClear
- Feature: MinorMode（未成年人模式，含 AI 身份标识与防依赖设计）
- Feature: CrisisEnvelope（危机预案「一键信封」，2026-09 新增，默认关闭）
- Feature: ComplianceDocs（三重免责声明 + 审计日志导出 + 州法兼容矩阵，2026-09 新增）
- Feature: Gameplay（游戏化日记：情绪花园 / 养成 / streak / 成就）
- Feature: ImportGuide（导入引导：三步向导 / 来源模板 / 示例数据）
- Feature: CompanionMode（AI + 可选真人混合陪伴，长期探索）
