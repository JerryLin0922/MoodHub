---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 01f8f8ba8e1924f80ffb2088ef932ff7_24265678b9a411f1b24b525400ea19b7
    ReservedCode1: p5Aq6FEy+4TTiXHF+Dxo4mjZixZ6UgQ+8mBgVf/bEClwiwFx2C4JB3tdXuI7NdZa5L4WTOIxAeMK9HBNuoHuBh5Nozu3uh6vJ2j6So8cEe7+iCZ3J3+KiyzCaTBrhraoA4yGN85ujf75CKCr29epYRsb1l/rWoaffPZuRtx04i5i9NObDCjel65fp3Y=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 01f8f8ba8e1924f80ffb2088ef932ff7_24265678b9a411f1b24b525400ea19b7
    ReservedCode2: p5Aq6FEy+4TTiXHF+Dxo4mjZixZ6UgQ+8mBgVf/bEClwiwFx2C4JB3tdXuI7NdZa5L4WTOIxAeMK9HBNuoHuBh5Nozu3uh6vJ2j6So8cEe7+iCZ3J3+KiyzCaTBrhraoA4yGN85ujf75CKCr29epYRsb1l/rWoaffPZuRtx04i5i9NObDCjel65fp3Y=
---

# Android 构建与发布指南（MoodHub）

> Android 原生工程已通过 `npx cap add android` 生成，位于 `android/` 目录。
> 生成工程已按 `.gitignore` 忽略，可随时用 `npx cap add android` 重新生成。

## 环境要求

- Node.js 20+
- Android Studio（含 Android SDK、JDK 17）
  - SDK 组件：Android SDK Platform 34+、Build-Tools 34+
  - 环境变量：`ANDROID_HOME` 指向 SDK 目录

## 本地构建 APK

```bash
# 1. 构建 web 资源并同步到 android 工程
npm run build
npx cap sync android

# 2. 用 Android Studio 打开
npx cap open android
```

在 Android Studio 中：Build → Build APK(s) / Generate Signed Bundle。

## 命令行构建（无 Android Studio 界面）

```bash
cd android
./gradlew assembleDebug        # 调试 APK: android/app/build/outputs/apk/debug/
./gradlew assembleRelease      # 需要签名配置（见下）
```

## 签名发布（Play 商店 / 应用市场）

1. 生成密钥库：Android Studio → Build → Generate Signed Bundle，或命令行 `keytool -genkey -v -keystore moodhub.keystore -alias moodhub -keyalg RSA -keysize 2048 -validity 10000`
2. 在 `android/variables.gradle` 中配置 `signingConfig`（或通过 `android/app/build.gradle` 引用 keystore 路径、alias、密码）
3. `./gradlew assembleRelease` 产出已签名 AAB/APK
   - AAB 路径：`android/app/build/outputs/bundle/release/app-release.aab`

## 发布渠道清单

| 渠道 | 产物 | 注意 |
|------|------|------|
| Google Play | AAB | 需开发者账号，隐私政策页（MoodHub 数据仅存本机，需在商店声明） |
| 国内安卓市场（华为/小米/OPPO/vivo等） | APK 或 AAB | 需各厂商开发者账号与软著（可选）、隐私政策、备案号 |
| 华为 AppGallery | APK/AAB | 华为账号 + 鸿蒙/安卓应用均走此渠道 |

## 注意事项

- `appId` 为 `com.moodhub.app`，发布前若需改名请先改 `capacitor.config.ts` 并重新 `cap add`
- 应用内无账号体系、无网络上报；启用 AI 时才会向模型服务商发送树洞消息
- 如需使用原生推送/文件系统等能力，安装对应 Capacitor 插件后重新 `cap sync`
*（内容由AI生成，仅供参考）*
