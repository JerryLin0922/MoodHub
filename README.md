# MoodHub

> [English](README_EN.md) | 中文

本地优先的心理健康陪伴与健康数据记录工具。数据全部保存在本机，不上传任何服务器。

> 免责声明：MoodHub 是自记录工具，不构成医疗诊断、治疗或处方建议。若你正处于心理危机中，请优先联系专业资源：
> - 中国大陆：全国统一心理援助热线 **12356**，紧急情况拨打 **110 / 120**
> - 中国香港：「情绪通」精神健康支援热线 **18111**（24 小时，电话 / WhatsApp）；赛马会青少年情绪健康网上支援平台「Open 噏」**9101 2012**（24 小时网上辅导）
> - 美国 / 加拿大：**988**（24/7 免费危机热线，电话或短信）
> - 全球：国际自杀预防协会（IASP）官网可查询所在地危机资源

## 功能

- **总览**：最近 14 天睡眠 / 心情图表 + 指标明细表（睡眠、静息心率、HRV、压力、步数）
- **日记**：按日记录心情（1-5）、压力、睡眠质量与备注，同日覆盖更新；规划引入游戏化设计（情绪花园、streak、成就），降低记录门槛、提升趣味性（详见 [FEEDBACK-2026.md](docs/FEEDBACK-2026.md)）
- **导入**：CSV / JSON 健康数据导入（识别睡眠时长、睡眠效率、静息心率、心率、HRV、血氧、压力、步数、运动时长），支持手动添加；规划三步导入引导（来源模板、示例数据、预览确认），解决"数据从哪里来"的困惑
- **树洞**：本地规则引擎心理陪伴回复；识别危机信号时立即弹出求助资源卡，不走 AI
- **AI 回复（可选）**：接入 DeepSeek / 通义千问 / 腾讯混元 / Gemini / OpenAI / 自定义兼容接口，API Key 可选持久化或仅会话有效
- **自评量表**：PHQ-9 / GAD-7 参考自评（内置，可在代码中开启）

## 技术栈

- React 18 + TypeScript 5 + Vite 7
- Tailwind CSS 3 + recharts
- Electron（Windows / macOS / Linux 桌面）
- Capacitor 6（Android / iOS 移动端）

## 本地开发

```bash
npm install
npm run dev       # http://localhost:5173
```

## 构建验证

```bash
npm run build     # tsc --noEmit 类型检查 + vite 生产构建，产物在 dist/
```

## 多端打包

### Web（可直接部署到任意静态托管 / GitHub Pages）

```bash
npm run build
```

### 桌面端（Windows / macOS / Linux）

```bash
# Linux / macOS
bash pack.sh

# Windows PowerShell
.\pack.ps1
```

产物输出到 `release/`（NSIS 安装包 / 便携版 / dmg / AppImage / deb）。

### Android / iOS（Capacitor）

前置要求：安装 Node.js、Android Studio（Android）、Xcode（macOS + iOS）。

```bash
npm run build
npx cap add android     # 首次添加平台
npx cap add ios
npx cap sync            # 同步 web 资源到原生工程
npx cap open android    # 用 Android Studio 打开并构建 APK / AAB
npx cap open ios        # 用 Xcode 打开并构建 IPA
```

### 鸿蒙 / HarmonyOS 说明

Capacitor 官方不支持鸿蒙原生工程。可选路径：

1. 以 PWA / Web 形式在鸿蒙浏览器中使用（零改造）；
2. 将 `dist/` 作为 H5 资源集成到鸿蒙应用 Web 容器（需自行维护原生壳）；
3. 关注社区适配方案（如 OpenHarmony Web 容器封装），目前无官方一键方案。

## 数据与隐私

- 所有数据使用浏览器 localStorage / sessionStorage 保存在本机
- 未启用 AI 时全程离线可用；启用 AI 后仅将最近 8 条树洞消息发送给你选择的模型服务商
- API Key 可选持久化（localStorage）或仅会话有效（sessionStorage），可随时清除
- 无账号体系、无遥测、无第三方统计 SDK

### 隐私设计对照（2026 行业基线）

本地优先不是一句口号，而是与 2026 年行业审计结论直接对应的架构选择：

- 2026 年对 25 款 Android 心理健康 App 的测量研究发现，**每一款**都内嵌了隐私政策未披露的追踪 SDK，68% 未披露至少一半的内嵌追踪器；
- Mozilla 2024 年对 11 款主流 AI 陪伴 App 的审查全部给出「Privacy Not Included」警告；
- 主流大模型 API 的滥用监控日志默认可能保留 prompt 与回复最多 30 天，除非签订零保留协议。

MoodHub 的应对：**无任何第三方 SDK、无遥测、无账号、数据不出本机**；即使启用 AI，也只发送最近 8 条消息，并支持仅会话有效的 API Key。

### 危机信号的本地处理

树洞的危机识别与求助资源卡完全在本地规则引擎完成，**不走 AI、不发网络请求**，危机场景下不引入任何第三方依赖，保证求助路径最短、最可靠。

## 研究与路线图

- [2026 行业研究](docs/RESEARCH-2026.md)：本地优先心理健康 App 趋势、隐私合规（含《人工智能拟人化互动服务管理暂行办法》）、青少年保护、市场数据、付费倾诉与 AI 陪伴商业化
- [产品路线图](docs/ROADMAP-2026.md)：基于第一性原理与用户洞察的下一阶段规划
- [用户反馈与设计方向](docs/FEEDBACK-2026.md)：2026-09 真实用户反馈（日记趣味性、导入引导、陪伴定位）与对应设计决策
- [第一性原理与产品哲学](docs/FIRST-PRINCIPLES.md)：定位审视、惊喜点子、作者数字自我接入说明
- [项目本体](docs/ONTOLOGY.md)：MoodHub 实体-关系结构化视图，便于协作与知识管理

## 发布到 GitHub

仓库已包含 `.gitignore` 与 GitHub Actions 发布工作流（`.github/workflows/release.yml`），打 tag 即自动构建多平台安装包：

```bash
git init
git add .
git commit -m "feat: MoodHub v0.2.0"
git remote add origin https://github.com/<你的用户名>/moodhub.git
git push -u origin main
git tag v0.2.0
git push origin v0.2.0
```

之后在仓库 Releases 页面即可看到 Windows / macOS / Linux 的安装包产物。

## 目录结构

```
moodhub/
├── src/
│   ├── core/            # 类型、解析、聚合、规则引擎、量表、工具
│   ├── data/            # 本地存储、AI 提供商、AI 调用、数据 API
│   ├── store/           # React Context 全局状态
│   ├── components/      # 页面组件（Overview/Diary/Import/TreeHole/Settings/ScalePanel）
│   ├── App.tsx          # 入口与 Tab 路由
│   └── main.tsx
├── electron/            # Electron 壳与打包配置
├── capacitor.config.ts  # Capacitor 配置
├── pack.sh / pack.ps1   # 桌面打包脚本
└── .github/workflows/   # CI 发布工作流
```

## License

MIT
