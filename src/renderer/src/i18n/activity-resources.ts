export const activityResources = {
  "zh-CN": {
    home: {
      recent: {
        activity: {
          publishQueue: {
            title: {
              completed: "{{name}} 发布完成",
              partialFailure: "{{name}} 部分失败",
              failed: "{{name}} 发布失败",
            },
            subtitle: {
              allSuccess: "{{count}} 个执行 · 全部成功",
              successFailure: "{{success}} 成功 · {{failed}} 失败",
            },
          },
          download: {
            title: "下载 {{name}}",
            subtitle: "从 {{accountName}} 备份到本地",
          },
        },
      },
    },
    publish: {
      saveToLibraryMessages: {
        starting: "准备下载到本地库",
        reusing_download: "复用已下载模型包",
      },
    },
  },
  "zh-TW": {
    home: {
      recent: {
        activity: {
          publishQueue: {
            title: {
              completed: "{{name}} 發佈完成",
              partialFailure: "{{name}} 部分失敗",
              failed: "{{name}} 發佈失敗",
            },
            subtitle: {
              allSuccess: "{{count}} 個執行 · 全部成功",
              successFailure: "{{success}} 成功 · {{failed}} 失敗",
            },
          },
          download: {
            title: "下載 {{name}}",
            subtitle: "從 {{accountName}} 備份到本地",
          },
        },
      },
    },
    publish: {
      saveToLibraryMessages: {
        starting: "準備下載到本地庫",
        reusing_download: "複用已下載模型包",
      },
    },
  },
  ja: {
    home: {
      recent: {
        activity: {
          publishQueue: {
            title: {
              completed: "{{name}} の公開が完了",
              partialFailure: "{{name}} は一部失敗",
              failed: "{{name}} の公開に失敗",
            },
            subtitle: {
              allSuccess: "{{count}} 件の実行 · すべて成功",
              successFailure: "成功 {{success}} · 失敗 {{failed}}",
            },
          },
          download: {
            title: "{{name}} をダウンロード",
            subtitle: "{{accountName}} からローカルへバックアップ",
          },
        },
      },
    },
    publish: {
      saveToLibraryMessages: {
        starting: "ローカルライブラリへの保存を準備中",
        reusing_download: "既存のダウンロード済みモデルを再利用中",
      },
    },
  },
  en: {
    home: {
      recent: {
        activity: {
          publishQueue: {
            title: {
              completed: "{{name}} completed",
              partialFailure: "{{name}} completed with failures",
              failed: "{{name}} failed",
            },
            subtitle: {
              allSuccess: "{{count}} runs · all succeeded",
              successFailure: "{{success}} succeeded · {{failed}} failed",
            },
          },
          download: {
            title: "Downloaded {{name}}",
            subtitle: "Backed up from {{accountName}} to local library",
          },
        },
      },
    },
    publish: {
      saveToLibraryMessages: {
        starting: "Preparing local library save",
        reusing_download: "Reusing downloaded model package",
      },
    },
  },
} as const;
