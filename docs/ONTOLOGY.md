# MoodHub 项目本体

> 更新日期：2026-09-28
> MoodHub 的实体-类型-关系结构化视图，用于项目协作、知识管理与新人上手。

## 实体类型

| 类型 | 实体 |
| --- | --- |
| Project | MoodHub |
| Platform | Web / Android / iOS / Windows / macOS / Linux / HarmonyOS(PWA) |
| Feature | Overview / Diary / Import / TreeHole / AISettings / ScalePanel |
| Tech | React 18 / TypeScript 5 / Vite 5 / Tailwind 3 / recharts / Electron / Capacitor 6 |
| Standard | PHQ-9 / GAD-7 |
| DataStore | localStorage / sessionStorage |
| AIProvider | DeepSeek / Qwen / Tencent Hunyuan / Gemini / OpenAI / Custom(OpenAI-compatible) |
| Doc | README / RESEARCH-2026 / ROADMAP-2026 / ANDROID / HARMONY |
| Risk | 危机信号 / 数据隐私 / 未成年人合规 |

## 核心关系

- MoodHub --contains--> Feature
- Feature --uses--> Tech
- Feature --implements--> Standard（ScalePanel --implements--> PHQ-9 / GAD-7）
- MoodHub --stores--> DataStore（全部数据本机存储，无服务器）
- TreeHole --optional--> AIProvider（仅最近 8 条消息发送）
- TreeHole --local--> 危机识别规则引擎（不走 AI，不发网络请求）
- MoodHub --documents--> Doc
- MoodHub --mitigates--> Risk

## 领域知识映射

### 隐私
- 无账号体系、无遥测、无第三方统计 SDK
- API Key 可选仅会话有效（sessionStorage）
- 行业基线（2026）：25 款 Android 心理 App 全部含未披露 tracker SDK → MoodHub 本地优先是差异化优势

### 危机处理
- 识别 → 本地资源卡（12356 / 18111 / 988 等）→ 不上报、不发网络请求

### 合规关注
- 中国：未成年人 AI 服务限制（2026 草案）、虚拟陪伴禁令（2026-04）
- 美国：加州 SB 243、纽约州披露法
- 欧盟：EU AI Act（2026-08 全面执行）

## 未来实体（Roadmap 引入）

- Feature: EmotionFootprint（情绪足迹）
- Feature: PeriodicReport（周期回顾报告）
- Feature: LocalLLM（Ollama / LM Studio 接入）
- Feature: DataExport / DataClear
- Feature: MinorMode（未成年人模式）
