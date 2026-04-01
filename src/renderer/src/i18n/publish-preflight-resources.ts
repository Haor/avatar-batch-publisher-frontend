export const publishPreflightResources = {
  "zh-CN": {
    publish: {
      preflight: {
        summary: "预检通过 {{passed}}/{{total}} 项",
        accountSelection: {
          none: "还没有勾选任何账号。",
          readyBlocked: "已选 {{selected}} 个，其中 {{ready}} 个可发布，{{blocked}} 个被阻塞",
        },
        primaryActionHint: {
          ready: "预检已经全部通过，现在可以开始预留 Avatar ID 并发起批量发布。",
          repairBlocked: "可发布账号已经就绪；如果你想把另外 {{blocked}} 个账号也带上，先去账号中心修复它们。",
        },
        checks: {
          artifact_selected: {
            title: "已选制品",
            detail: {
              missing: "开始前需要先导入并选中一个本地模型。",
              selected: "{{name}} / {{platform}} / {{unityVersion}}",
            },
          },
          rewrite_mode: {
            title: "改写方式",
            detail: {
              missing: "请先选中一个本地模型。",
              ready: {
                bundle: "发布时系统会先为每个目标账号预留新的 Avatar ID，再把种子 bundle 改写成对应目标 ID 并上传。这是从 .vrca 包内直接解析出的 seed Avatar ID。",
                reserved: "发布时系统会先为每个目标账号预留新的 Avatar ID，再把种子 bundle 改写成对应目标 ID 并上传。导出时自动预留了 seed Avatar ID。",
                experimental_fake: "发布时系统会先为每个目标账号预留新的 Avatar ID，再把种子 bundle 改写成对应目标 ID 并上传。导出时使用了实验性 seed Avatar ID。",
                manual: "发布时系统会先为每个目标账号预留新的 Avatar ID，再把种子 bundle 改写成对应目标 ID 并上传。这是手动导入时填写的 seed Avatar ID。",
                current: "发布时系统会先为每个目标账号预留新的 Avatar ID，再把种子 bundle 改写成对应目标 ID 并上传。沿用了当前 Avatar 上已有的 seed Avatar ID。",
              },
            },
          },
          target_accounts: {
            title: "目标账号",
            detail: {
              noneSelected: "至少勾选一个会话正常且具备模型发布权限的账号。",
              noneReady: "虽然勾选了 {{selected}} 个账号，但暂时没有一个可发布。",
              readyOnly: "已选 {{ready}} 个可发布账号。",
              readyWithBlocked: "已选 {{ready}} 个可发布账号，另有 {{blocked}} 个账号需要先修复。",
            },
          },
          avatar_name: {
            title: "模型名称",
            detail: {
              missing: "请输入这轮批量发布要使用的模型名称。",
              ready: "本轮将以“{{name}}”作为名称发布。",
            },
          },
          release_status: {
            title: "发布状态",
            detail: {
              missing: "开始之前需要先选 private 或 public。",
              ready: "当前发布状态为“{{releaseStatus}}”。",
            },
          },
        },
      },
    },
  },
  "zh-TW": {
    publish: {
      preflight: {
        summary: "預檢通過 {{passed}}/{{total}} 項",
        accountSelection: {
          none: "還沒有勾選任何帳號。",
          readyBlocked: "已選 {{selected}} 個，其中 {{ready}} 個可發佈，{{blocked}} 個被阻塞",
        },
        primaryActionHint: {
          ready: "預檢已全部通過，現在可以開始預留 Avatar ID 並發起批量發佈。",
          repairBlocked: "可發佈帳號已就緒；如果你想把另外 {{blocked}} 個帳號也帶上，先去帳號中心修復它們。",
        },
        checks: {
          artifact_selected: {
            title: "已選製品",
            detail: {
              missing: "開始前需要先匯入並選中一個本機模型。",
              selected: "{{name}} / {{platform}} / {{unityVersion}}",
            },
          },
          rewrite_mode: {
            title: "改寫方式",
            detail: {
              missing: "請先選中一個本機模型。",
              ready: {
                bundle: "發佈時系統會先為每個目標帳號預留新的 Avatar ID，再把 seed bundle 改寫成對應目標 ID 並上傳。這是從 .vrca 包內直接解析出的 seed Avatar ID。",
                reserved: "發佈時系統會先為每個目標帳號預留新的 Avatar ID，再把 seed bundle 改寫成對應目標 ID 並上傳。匯出時自動預留了 seed Avatar ID。",
                experimental_fake: "發佈時系統會先為每個目標帳號預留新的 Avatar ID，再把 seed bundle 改寫成對應目標 ID 並上傳。匯出時使用了實驗性 seed Avatar ID。",
                manual: "發佈時系統會先為每個目標帳號預留新的 Avatar ID，再把 seed bundle 改寫成對應目標 ID 並上傳。這是手動匯入時填寫的 seed Avatar ID。",
                current: "發佈時系統會先為每個目標帳號預留新的 Avatar ID，再把 seed bundle 改寫成對應目標 ID 並上傳。沿用了目前 Avatar 上已有的 seed Avatar ID。",
              },
            },
          },
          target_accounts: {
            title: "目標帳號",
            detail: {
              noneSelected: "至少勾選一個會話正常且具備模型發佈權限的帳號。",
              noneReady: "雖然勾選了 {{selected}} 個帳號，但暫時沒有一個可發佈。",
              readyOnly: "已選 {{ready}} 個可發佈帳號。",
              readyWithBlocked: "已選 {{ready}} 個可發佈帳號，另有 {{blocked}} 個帳號需要先修復。",
            },
          },
          avatar_name: {
            title: "模型名稱",
            detail: {
              missing: "請輸入這輪批量發佈要使用的模型名稱。",
              ready: "本輪將以「{{name}}」作為名稱發佈。",
            },
          },
          release_status: {
            title: "發佈狀態",
            detail: {
              missing: "開始之前需要先選 private 或 public。",
              ready: "目前發佈狀態為「{{releaseStatus}}」。",
            },
          },
        },
      },
    },
  },
  ja: {
    publish: {
      preflight: {
        summary: "事前チェック {{passed}}/{{total}} 項目が通過",
        accountSelection: {
          none: "まだアカウントが選択されていません。",
          readyBlocked: "{{selected}} 件選択済み。公開可能 {{ready}} 件、ブロック中 {{blocked}} 件",
        },
        primaryActionHint: {
          ready: "事前チェックはすべて完了しました。Avatar ID を予約して一括公開を開始できます。",
          repairBlocked: "公開可能なアカウントは準備できています。残り {{blocked}} 件も含める場合は、先にアカウント管理で修復してください。",
        },
        checks: {
          artifact_selected: {
            title: "選択中のローカルモデル",
            detail: {
              missing: "開始前にローカルモデルを取り込み、選択してください。",
              selected: "{{name}} / {{platform}} / {{unityVersion}}",
            },
          },
          rewrite_mode: {
            title: "書き換え方式",
            detail: {
              missing: "先にローカルモデルを選択してください。",
              ready: {
                bundle: "公開時は対象アカウントごとに新しい Avatar ID を予約し、seed bundle を対象 ID に書き換えてからアップロードします。seed Avatar ID は .vrca から直接解析されています。",
                reserved: "公開時は対象アカウントごとに新しい Avatar ID を予約し、seed bundle を対象 ID に書き換えてからアップロードします。seed Avatar ID はエクスポート時に自動予約されています。",
                experimental_fake: "公開時は対象アカウントごとに新しい Avatar ID を予約し、seed bundle を対象 ID に書き換えてからアップロードします。seed Avatar ID は実験モードで生成されています。",
                manual: "公開時は対象アカウントごとに新しい Avatar ID を予約し、seed bundle を対象 ID に書き換えてからアップロードします。seed Avatar ID は手動インポート時に指定されています。",
                current: "公開時は対象アカウントごとに新しい Avatar ID を予約し、seed bundle を対象 ID に書き換えてからアップロードします。現在の Avatar に既存の seed Avatar ID があります。",
              },
            },
          },
          target_accounts: {
            title: "対象アカウント",
            detail: {
              noneSelected: "有効なセッションがあり、モデル公開権限を持つアカウントを少なくとも 1 件選択してください。",
              noneReady: "{{selected}} 件選択されていますが、現在公開可能なアカウントはありません。",
              readyOnly: "公開可能なアカウントを {{ready}} 件選択済みです。",
              readyWithBlocked: "公開可能なアカウントを {{ready}} 件選択済みです。ほかに {{blocked}} 件は修復が必要です。",
            },
          },
          avatar_name: {
            title: "モデル名",
            detail: {
              missing: "この一括公開で使用するモデル名を入力してください。",
              ready: "今回は「{{name}}」という名前で公開されます。",
            },
          },
          release_status: {
            title: "公開状態",
            detail: {
              missing: "開始前に private または public を選択してください。",
              ready: "現在の公開状態は「{{releaseStatus}}」です。",
            },
          },
        },
      },
    },
  },
  en: {
    publish: {
      preflight: {
        summary: "Preflight passed {{passed}}/{{total}} checks",
        accountSelection: {
          none: "No accounts selected yet.",
          readyBlocked: "Selected {{selected}}, publishable {{ready}}, blocked {{blocked}}",
        },
        primaryActionHint: {
          ready: "All checks passed. You can reserve Avatar IDs and start the batch publish now.",
          repairBlocked: "Publishable accounts are ready. Repair the remaining {{blocked}} blocked accounts first if you want to include them too.",
        },
        checks: {
          artifact_selected: {
            title: "Selected artifact",
            detail: {
              missing: "Import and select a local model before starting.",
              selected: "{{name}} / {{platform}} / {{unityVersion}}",
            },
          },
          rewrite_mode: {
            title: "Rewrite mode",
            detail: {
              missing: "Select a local model first.",
              ready: {
                bundle: "The app reserves a new Avatar ID for each target account, rewrites the seed bundle to that target ID, then uploads it. The seed Avatar ID was parsed directly from the .vrca bundle.",
                reserved: "The app reserves a new Avatar ID for each target account, rewrites the seed bundle to that target ID, then uploads it. The seed Avatar ID was reserved automatically during export.",
                experimental_fake: "The app reserves a new Avatar ID for each target account, rewrites the seed bundle to that target ID, then uploads it. The seed Avatar ID was generated in experimental mode during export.",
                manual: "The app reserves a new Avatar ID for each target account, rewrites the seed bundle to that target ID, then uploads it. The seed Avatar ID was provided manually during import.",
                current: "The app reserves a new Avatar ID for each target account, rewrites the seed bundle to that target ID, then uploads it. The current Avatar already had a seed Avatar ID.",
              },
            },
          },
          target_accounts: {
            title: "Target accounts",
            detail: {
              noneSelected: "Select at least one account with a valid session and Avatar publish permission.",
              noneReady: "Selected {{selected}} accounts, but none are publishable right now.",
              readyOnly: "Selected {{ready}} publishable accounts.",
              readyWithBlocked: "Selected {{ready}} publishable accounts, and {{blocked}} more need repair.",
            },
          },
          avatar_name: {
            title: "Avatar name",
            detail: {
              missing: "Enter the Avatar name for this publish batch.",
              ready: "This batch will publish as “{{name}}”.",
            },
          },
          release_status: {
            title: "Release status",
            detail: {
              missing: "Choose private or public before starting.",
              ready: "Current release status is “{{releaseStatus}}”.",
            },
          },
        },
      },
    },
  },
} as const;
