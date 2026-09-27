# MoodHub 鸿蒙（HarmonyOS NEXT）落地指引

> 状态说明：HarmonyOS NEXT 已不再兼容 Android APK，且 Capacitor 官方目前**不支持**鸿蒙。本指引给出将 MoodHub Web 构建产物以 ArkWeb 壳方式打包为 HAP/APP 的可落地路径。

## 总体方案

```
MoodHub SPA (dist/) ──放入──> entry/src/main/resources/rawfile/
        │
        └── ArkTS 页面用 Web 组件 (ArkWeb) 加载本地 index.html
        │
        └── DevEco Studio 签名打包 -> HAP / APP (AppGallery)
```

Web 层零改动，原生能力（存储/推送/文件）需按需用 ArkTS 插件桥接。

## 前置条件

- DevEco Studio 5.0+（HarmonyOS SDK API 12+）
- 华为开发者账号（AGC 平台，用于申请签名证书与上架）
- 支持 HarmonyOS NEXT 的测试设备或模拟器

## 操作步骤

### 1. 产出 Web 构建

```bash
cd moodhub
npm ci
npm run build
# 产物在 dist/
```

### 2. 创建鸿蒙工程

DevEco Studio 新建工程：`Empty Ability`，语言 ArkTS，包名建议 `com.moodhub.app`，随后执行：

```bash
# 将 Web 静态资源拷入 rawfile（鸿蒙不打包 node_modules / 源码）
mkdir -p entry/src/main/resources/rawfile
cp -r dist/* entry/src/main/resources/rawfile/
```

### 3. 编写 ArkWeb 壳页面

`entry/src/main/ets/pages/Index.ets`：

```ts
import { webview } from '@kit.ArkWeb'

@Entry
@Component
struct Index {
  controller: webview.WebviewController = new webview.WebviewController()

  build() {
    Column() {
      Web({ src: $rawfile('index.html'), controller: this.controller })
        .width('100%')
        .height('100%')
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .allowFileAccess(true)
    }
  }
}
```

### 4. 配置模块权限（如需联网）

`entry/src/main/module.json5`：

```json5
{
  module: {
    requestPermissions: [
      { name: 'ohos.permission.INTERNET' }
    ]
  }
}
```

### 5. 打包与签名

- DevEco：`Build > Build Hap(s)/APP(s)`，选择 `release`。
- 首次需在 `File > Project Structure > Signing Configs` 勾选自动签名（登录华为账号）。
- 产物：`entry/build/default/outputs/default/entry-default-signed.hap`。
- 上架 AppGallery：在 AGC 创建应用，上传 HAP，填写隐私与权限声明。

## 原生能力桥接（按需）

MoodHub 目前是纯前端 SPA，本地数据用浏览器存储。若后续需要：

| 能力 | 鸿蒙方案 |
|---|---|
| 本地持久化 | `@kit.ArkData`（Preferences / RelationalStore）替代 localStorage |
| 系统通知/提醒 | `@kit.NotificationKit` 推送通知 |
| 文件导出 | `@kit.CoreFileKit` 选择器 |
| 崩溃/埋点 | AGC 崩溃服务 / Analytics Kit |

## 已知限制

- ArkWeb 加载 rawfile 为只读；如需读写文件必须走 ArkTS 原生插件。
- 上架审核要求隐私政策、适老化与无障碍声明，需在 AGC 后台补充。
- 真机调试需要鸿蒙 NEXT 设备与开发者证书，模拟器资源有限。

## 与其它平台的关系

| 目标 | 方式 | 状态 |
|---|---|---|
| Android APK | Capacitor + Gradle（CI 已配置） | CI 产出 debug APK |
| iOS | Capacitor + Xcode（CI 已配置，无签名 archive） | CI 产出 archive，签名需 Apple 证书 |
| Windows/macOS/Linux | Electron Builder（CI 三平台） | CI 产出 exe/dmg/deb/AppImage |
| HarmonyOS NEXT | 本指引 ArkWeb 壳 | 需 DevEco Studio 手动执行 |
