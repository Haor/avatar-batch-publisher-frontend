export const accountValidationResources = {
  "zh-CN": {
    accounts: {
      loginFlow: {
        validation: {
          enterLogin: "请输入 VRChat 用户名或邮箱。",
          enterPassword: "请输入密码。",
          accountAlreadyExists: "这个账号已经存在于本地账号中心。",
          challengeExpired: "这次登录验证已经过期，请重新开始。",
          enterCode: "请输入验证码。",
          invalidCode: "验证码不正确，请重试。",
        },
      },
    },
  },
  "zh-TW": {
    accounts: {
      loginFlow: {
        validation: {
          enterLogin: "請輸入 VRChat 使用者名稱或信箱。",
          enterPassword: "請輸入密碼。",
          accountAlreadyExists: "這個帳號已經存在於本地帳號中心。",
          challengeExpired: "這次登入驗證已經過期，請重新開始。",
          enterCode: "請輸入驗證碼。",
          invalidCode: "驗證碼不正確，請重試。",
        },
      },
    },
  },
  ja: {
    accounts: {
      loginFlow: {
        validation: {
          enterLogin: "VRChat のユーザー名またはメールアドレスを入力してください。",
          enterPassword: "パスワードを入力してください。",
          accountAlreadyExists: "このアカウントはすでにローカルのアカウントセンターに存在します。",
          challengeExpired: "このログイン認証は期限切れです。最初からやり直してください。",
          enterCode: "認証コードを入力してください。",
          invalidCode: "認証コードが正しくありません。もう一度お試しください。",
        },
      },
    },
  },
  en: {
    accounts: {
      loginFlow: {
        validation: {
          enterLogin: "Enter your VRChat username or email.",
          enterPassword: "Enter your password.",
          accountAlreadyExists: "This account already exists in the local account center.",
          challengeExpired: "This login verification has expired. Start again.",
          enterCode: "Enter the verification code.",
          invalidCode: "The verification code is incorrect. Try again.",
        },
      },
    },
  },
} as const;
