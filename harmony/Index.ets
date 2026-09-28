// harmony/Index.ets（替换 docs/HARMONY.md 中的壳页面）
// 在原有 ArkWeb 壳基础上注册 HealthBridge 到 javaScriptProxy。

import { webview } from '@kit.ArkWeb'
import { HealthBridge } from './HealthBridge'

@Entry
@Component
struct Index {
  controller: webview.WebviewController = new webview.WebviewController()
  private healthBridge: HealthBridge = new HealthBridge(this.controller)

  build() {
    Column() {
      Web({ src: $rawfile('index.html'), controller: this.controller })
        .width('100%')
        .height('100%')
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .allowFileAccess(true)
        .javaScriptProxy({
          object: this.healthBridge,
          name: 'moodhubNative',
          methodList: this.healthBridge.methodList(),
          controller: this.controller
        })
    }
  }
}
