---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 01f8f8ba8e1924f80ffb2088ef932ff7_a94a5ff5b99f11f19ba1525400638852
    ReservedCode1: IXhcE6wi529WqM0MDrPsTQGGo/ELnl0PTlhLC5HaItPGmL82Oph5O4byeELeiMnJUiwSS1L48PvBPuDgJc3SLnxPb8ZDSNx1YI5e9LoB4lBW8lhSMMqtAfsH+uhDSXqOCerr+T8vpshu2eH1SNAafx47HKKlB7P4B5lzpGI0vCuZVZ3H4nXMv6isIIc=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 01f8f8ba8e1924f80ffb2088ef932ff7_a94a5ff5b99f11f19ba1525400638852
    ReservedCode2: IXhcE6wi529WqM0MDrPsTQGGo/ELnl0PTlhLC5HaItPGmL82Oph5O4byeELeiMnJUiwSS1L48PvBPuDgJc3SLnxPb8ZDSNx1YI5e9LoB4lBW8lhSMMqtAfsH+uhDSXqOCerr+T8vpshu2eH1SNAafx47HKKlB7P4B5lzpGI0vCuZVZ3H4nXMv6isIIc=
---

# MoodHub

> [English](README_EN.md) | 中文

本地优先的心理健康陪伴与健康数据记录工具。数据全部保存在本机，不上传任何服务器。

> 免责声明：MoodHub 是自记录工具，不构成医疗诊断、治疗或处方建议。若你正处于心理危机中，请优先联系专业资源（全国统一心理援助热线 12356，或紧急电话 110 / 120）。

## 功能

- **总览**：最近 14 天睡眠 / 心情图表 + 指标明细表（睡眠、静息心率、HRV、压力、步数）
- **日记**：按日记录心情（1-5）、压力、睡眠质量与备注，同日覆盖更新
- **导入**：CSV / JSON 健康数据导入（识别睡眠时长、睡眠效率、静息心率、心率、HRV、血氧、压力、步数、运动时长），支持手动添加
- **树洞**：本地规则引擎心理陪伴回复；识别危机信号时立即弹出求助资源卡，不走 AI
- **AI 回复（可选）**：接入 DeepSeek / 通义千问 / 腾讯混元 / Gemini / OpenAI / 自定义兼容接口，API Key 可选持久化或仅会话有效
- **自评量表**：PHQ-9 / GAD-7 参考自评（内置，可在代码中开启）

## 技术栈

- React 18 + TypeScript 5 + Vite 5
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
