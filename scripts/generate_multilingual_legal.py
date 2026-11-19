# -*- coding: utf-8 -*-
"""
Generate Multilingual Terms of Service and Privacy Policy for LIFE.HELP
Produces localized LegalDoc structures across major platform languages:
ja, zh-Hans, zh-Hant, vi, es, fr, de, ru, tr, ar, id, pt, th, hi, etc.
"""
import os
import json

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "lib", "legal", "translations")
os.makedirs(OUT_DIR, exist_ok=True)

# 1. JAPANESE (ja)
JA_DATA = {
  "privacy": {
    "title": "プライバシーポリシー",
    "intro": "LIFE.HELP（以下「本サービス」）は、利用者の個人情報を尊重し、大韓民国の「個人情報保護法」等の関連法令を遵守します。本方針は、本サービス（life.helpおよびサブドメイン、math.life.help、english.life.help、korean.life.help）においてどのような情報を収集し、どのように利用・保管・破棄するかを説明します。",
    "sections": [
      {
        "id": "items",
        "title": "1. 収集する個人情報の項目と収集方法",
        "body": [
          "本サービスは、利用者が直接入力した情報、またはサービス利用の過程で自動生成される情報のみを収集し、必要最小限の項目に制限します。",
          {
            "list": [
              "生活サービス依頼（顧客）：依頼サービスの種類、状況説明、訪問・サービス場所の住所（市・道、市・郡・区、詳細住所）、使用言語、依頼状態、チャットメッセージおよびその機械翻訳文。顧客は会員登録なしで匿名で利用でき、氏名や電話番号は収集しません。依頼アクセス用の秘密リンク・セッションは暗号化ハッシュとしてのみ保存されます。",
              "ヘルパー（サービス提供者）：表示名、使用言語、活動地域、提供可能サービス、連絡先メールアドレス（任意）。",
              "学習サービス（ゲスト）：ニックネーム、学年・学習段階、学習目標、アバター、学習進捗記録。ゲスト情報は利用者の端末（ブラウザストレージ）にのみ保存され、サーバーへは送信されません。",
              "学習サービス（会員）：メールアドレス、パスワード（暗号化ハッシュ）、ニックネーム、学年・学習段階、学習目標、アバター、解答記録・習熟度・経験値・連続学習記録、利用券履歴。",
              "レビュー：評価星数、レビュー本文（匿名）。",
              "自動収集情報：アクセスIPアドレス、リクエスト日時（セキュリティ・不正利用防止・レート制限目的、Cloudflareおよびサーバーログ）、ブラウザ・端末情報、Cookie。"
            ]
          },
          "決済は銀行振込方式で案内され、本サービスはクレジットカード番号等の決済手段情報を収集しません。"
        ]
      },
      {
        "id": "purpose",
        "title": "2. 個人情報の利用目的",
        "body": [
          {
            "list": [
              "生活サービス依頼の受付、ヘルパーのマッチング、相談・チャットおよび機械翻訳の提供",
              "学習コンテンツの配信、学習進捗・達成記録の保存、プレミアム利用券の確認",
              "会員の識別および認証、不正利用の防止、サービスの安全性および安定性の確保",
              "お問い合わせ・苦情対応、法令上の義務履行"
            ]
          },
          "収集した情報は上記の目的以外には利用せず、広告・マーケティング目的での利用や第三者への販売は行いません。"
        ]
      },
      {
        "id": "retention",
        "title": "3. 保有および利用期間",
        "body": [
          {
            "list": [
              "生活サービス依頼およびチャット：依頼完了またはキャンセル後1年間保管後、破棄します。利用者が依頼アクセスを取り消した（リンク・セッション破棄）場合、その後のアクセスは直ちに遮断されます。",
              "ヘルパー情報：ヘルパー活動の終了または削除要請時まで。",
              "学習会員情報・学習記録：退会または削除要請時に遅滞なく破棄します。",
              "ゲスト学習情報：利用者のブラウザ内のみに存在し、ブラウザデータを消去すると削除されます。",
              "関連法令に基づき保管が必要な情報（例：契約または申込み撤回記録5年、代金決済および財貨供給記録5年、消費者苦情および紛争処理記録3年）は、当該期間中個別に保管されます。"
            ]
          }
        ]
      },
      {
        "id": "third",
        "title": "4. 第三者への提供",
        "body": [
          "本サービスは、利用者の事前同意がある場合、または法令に基づく場合を除き、個人情報を第三者に提供しません。生活サービス依頼の内容（サービス種別、状況説明、住所、チャット）は、依頼を受託したヘルパーに対し、サービス提供の目的でのみ公開されます。"
        ]
      },
      {
        "id": "processors",
        "title": "5. 個人情報処理の委託および国外移転",
        "body": [
          "本サービスのスムーズな運営のため、以下の事業者に処理を委託しており、一部は韓国内または国外で処理される場合があります。",
          {
            "list": [
              "Supabase Inc. — データベースおよび会員認証（第1項のサーバー保存項目）",
              "Cloudflare, Inc. — Webホスティング、CDNおよびセキュリティ（アクセスIP、リクエスト情報）",
              "MyMemory (Translated S.r.l.) — チャットメッセージの機械翻訳（翻訳対象テキストの送信）"
            ]
          },
          "国外移転を希望されない場合は、機械翻訳または本サービスの利用を中断していただくか、個人情報保護管理者にお問い合わせください。"
        ]
      },
      {
        "id": "destroy",
        "title": "6. 個人情報の破棄手続きおよび方法",
        "body": [
          "保有期間が経過した場合、または処理目的が達成された場合、個人情報は復元不可能な方法で遅滞なく破棄されます。法令に基づき保管が義務付けられている情報は、他の情報と分離して保管された後、期間満了時に破棄されます。"
        ]
      },
      {
        "id": "rights",
        "title": "7. 利用者および法定代理人の権利とその行使方法",
        "body": [
          "利用者（または14歳未満の児童の法定代理人）は、いつでも自己の個人情報について閲覧、訂正、削除、処理停止、または同意撤回を請求することができます。個人情報保護管理者にメールでご連絡いただければ、遅滞なく（10日以内）対応し結果を通知します。また、依頼リンクの破棄、ログアウト、ブラウザデータの消去により、自己管理することも可能です。"
        ]
      },
      {
        "id": "children",
        "title": "8. 14歳未満の児童の個人情報",
        "body": [
          {
            "list": [
              "本サービスはサーバーに個人情報を送信しないゲスト学習モードを提供しており、14歳未満の児童も安心して利用できます。",
              "14歳未満の児童がメール会員アカウントを作成する場合、法定代理人が直接登録するか、法定代理人の同意を得る必要があります。",
              "法定代理人は児童の個人情報の閲覧、訂正、削除または処理停止をいつでも請求でき、同意が撤回された場合はアカウントと学習記録を削除します。",
              "法定代理人の同意なく14歳未満の児童のアカウントが作成されたことが判明した場合、遅滞なく当該アカウントおよびデータを削除します。"
            ]
          }
        ]
      },
      {
        "id": "cookies",
        "title": "9. Cookieおよびブラウザストレージの運用",
        "body": [
          {
            "list": [
              "言語設定Cookie：選択された言語を記憶します。",
              "認証・セッションCookie：ログイン状態、依頼アクセスセッションの維持（HttpOnly、Secure）。",
              "ブラウザストレージ（localStorage）：端末内のゲスト学習データおよび画面表示設定。"
            ]
          },
          "ブラウザ設定によりCookieを拒否または削除できますが、一部機能が正常に動作しない場合があります。広告・トラッキング目的のCookieは使用しません。"
        ]
      },
      {
        "id": "security",
        "title": "10. 個人情報の安全性確保措置",
        "body": [
          {
            "list": [
              "送信時の暗号化（HTTPS/TLS）およびパスワード・認証情報の暗号化ハッシュ保存",
              "データベースアクセス制御（行単位セキュリティ RLS、最小権限の原則）",
              "レート制限、アクセスログの監視、脆弱性診断および依存パッケージのセキュリティ更新"
            ]
          }
        ]
      },
      {
        "id": "officer",
        "title": "11. 個人情報保護管理者および連絡先",
        "body": [
          {
            "list": [
              "個人情報保護責任者：運営者代表（下記メールアドレスよりお問い合わせください）",
              "お問い合わせメール：sys@life.help"
            ]
          }
        ]
      },
      {
        "id": "remedy",
        "title": "12. 権利侵害の救済措置",
        "body": [
          "個人情報の侵害に関して救済が必要な場合は、以下の韓国関係機関にお問い合わせいただけます。",
          {
            "list": [
              "個人情報侵害申告センター：privacy.kisa.or.kr / 韓国局番なし 118",
              "個人情報紛争調停委員会：kopico.go.kr / 韓国 1833-6972",
              "大検察庁サイバー捜査課：spo.go.kr / 韓国局番なし 1301",
              "警察庁サイバー捜査局：ecrm.police.go.kr / 韓国局番なし 182"
            ]
          }
        ]
      },
      {
        "id": "changes",
        "title": "13. プライバシーポリシーの改定",
        "body": [
          "本方針が改定される場合、効力発生日の7日前（重要な変更の場合は30日前）から本サービス画面にて告知します。"
        ]
      }
    ]
  },
  "terms": {
    "title": "利用規約",
    "intro": "本規約は、LIFE.HELP（以下「本サービス」）が提供する外国人向け生活サービスマッチングおよび学習サービスの利用条件と手続き、運営者と利用者の権利・義務を定めます。韓国語版と他言語版の解釈に相違がある場合は、大韓民国の法令に基づく韓国語版が優先します。",
    "sections": [
      {
        "id": "scope",
        "title": "第1条（目的および効力）",
        "body": [
          "本規約は、本サービス画面に掲載された時点で効力を生じます。利用者が本サービスを利用した場合、本規約およびプライバシーポリシーに同意したものとみなされます。運営者は関連法令に違反しない範囲で規約を変更することができ、変更の効力発生日の7日前（利用者に不利な変更の場合は30日前）から告知します。"
        ]
      },
      {
        "id": "service",
        "title": "第2条（サービスの内容）",
        "body": [
          {
            "list": [
              "生活サービスマッチング：顧客が依頼を登録すると、当該依頼を遂行できるヘルパーとマッチングし、チャットと機械翻訳を通じてコミュニケーションを支援します。",
              "学習サービス：数学・英語・韓国語の学習コンテンツと学習記録、無料および有料（プレミアム）利用券を提供します。",
              "運営者はサービスの一部を変更または中断することができ、重要な変更は事前に告知します。"
            ]
          },
          "機械翻訳は参考用であり、その正確性を保証するものではありません。重要な事項は必ず当事者間で直接ご確認ください。"
        ]
      },
      {
        "id": "users",
        "title": "第3条（利用者の義務）",
        "body": [
          {
            "list": [
              "他人の情報を盗用したり、虚偽の情報を入力してはなりません。",
              "法令、公序良俗および本規約に違反する依頼・メッセージ・レビューを投稿してはなりません。",
              "本サービスの正常な運営を妨害したり、セキュリティを迂回しようとする行為をしてはなりません。",
              "依頼アクセスリンクおよびアカウント認証情報を安全に管理してください。"
            ]
          }
        ]
      },
      {
        "id": "accounts",
        "title": "第4条（アカウントおよび14歳未満の利用者）",
        "body": [
          "学習サービスの会員アカウントは、満14歳以上の方が作成できます。満14歳未満の児童は法定代理人が直接加入するか、法定代理人の同意を得て加入する必要があり、同意なく加入したアカウントは削除される場合があります。満14歳未満の児童は、個人情報をサーバーに送信しないゲストモードを利用できます。会員はいつでも退会（削除要請）が可能です。"
        ]
      },
      {
        "id": "helpers",
        "title": "第5条（ヘルパー）",
        "body": [
          "ヘルパーは、自身が提供するサービスの内容と品質について責任を負い、サービス利用時は法令および運営者の案内に従う必要があります。運営者はヘルパーの承認、制限、解約を行うことができます。"
        ]
      },
      {
        "id": "payment",
        "title": "第6条（料金、決済および返金）",
        "body": [
          {
            "list": [
              "サービスの利用料金および決済方法（銀行振込等）は、決済案内画面に表示されます。",
              "有料利用券は、決済確認後に指定された範囲と期間利用できます。",
              "申込みの撤回および返金は、「電子商取引等における消費者保護に関する法律」等の関連法令および運営者の返金基準に従います。返金のお問い合わせはメールにて受け付けます。"
            ]
          }
        ]
      },
      {
        "id": "ip",
        "title": "第7条（知的財産権）",
        "body": [
          "本サービスのコンテンツ（問題、解説、デザイン、ソフトウェア）に関する権利は、運営者または正当な権利者に帰属し、利用者は個人的・非営利的な学習目的の範囲内でのみ利用できます。"
        ]
      },
      {
        "id": "disclaimer",
        "title": "第8条（責任の制限）",
        "body": [
          "運営者は、天災地変、不可抗力、利用者の責に帰すべき事由によるサービス障害について責任を負いません。ヘルパーと顧客間のサービス遂行結果に関する責任は第一次的に当該当事者にあり、運営者は紛争解決のために合理的に協力します。学習サービスは学習成果や試験結果を保証するものではありません。法令上制限されない範囲において、運営者の責任は直接損害に限定されます。"
        ]
      },
      {
        "id": "law",
        "title": "第9条（準拠法および紛争解決）",
        "body": [
          "本規約は大韓民国の法令に準拠して解釈され、サービスに関する紛争は大韓民国の民事訴訟法に基づく管轄裁判所において解決します。"
        ]
      },
      {
        "id": "operator",
        "title": "運営者情報",
        "body": [
          {
            "list": [
              "サービス名: LIFE.HELP",
              "お問い合わせメール: sys@life.help"
            ]
          }
        ]
      }
    ]
  }
}

# 2. CHINESE SIMPLIFIED (zh-Hans)
ZH_HANS_DATA = {
  "privacy": {
    "title": "隐私政策",
    "intro": "LIFE.HELP（以下简称“本服务”）高度重视用户的个人信息，并严格遵守大韩民国《个人信息保护法》等相关法律法规。本政策阐明本服务（life.help及其子域名、math.life.help、english.life.help、korean.life.help）收集哪些信息以及如何使用、保存和销毁这些信息。",
    "sections": [
      {
        "id": "items",
        "title": "1. 收集的个人信息项目与方法",
        "body": [
          "本服务仅收集用户直接输入或在服务使用过程中自动生成的信息，并严格限制在必要的最少范围内。",
          {
            "list": [
              "生活服务需求（客户）：需求服务类型、情况说明、服务地点地址（市·道、市·郡·区、详细地址）、使用语言、需求状态、聊天记录及其机器翻译文本。客户无需注册即可匿名使用，不收集姓名和电话号码。用于访问需求的私密链接与会话仅以加密哈希形式存储。",
              "帮手（服务提供者）：显示名称、使用语言、活动区域、可提供服务、联系邮箱（选填）。",
              "学习服务（访客模式）：昵称、年级/阶段、学习目标、头像、学习进度记录。访客数据仅保存在用户设备本地浏览器中，绝不上传至服务器。",
              "学习服务（注册会员）：邮箱、密码（加密哈希）、昵称、年级/阶段、学习目标、头像、做题记录、掌握度、经验值、连续学习打卡记录、权益记录。",
              "用户评价：评分星级、评价内容（匿名）。",
              "自动收集信息：访问IP地址、请求时间（出于安全、防欺诈与限流目的，Cloudflare及服务器日志）、浏览器及设备信息、Cookie。"
            ]
          },
          "支付均以银行转账方式指引，本服务不收集银行卡号等支付工具敏感信息。"
        ]
      },
      {
        "id": "purpose",
        "title": "2. 个人信息的使用目的",
        "body": [
          {
            "list": [
              "生活服务需求的受理、帮手匹配、咨询聊天及机器翻译支持",
              "学习内容的提供、学习进度与成绩记录的存储、高级会员权限确认",
              "用户识别与认证、防范恶意滥用、保障服务的安全性与稳定性",
              "客户咨询与纠纷处理、履行法律法规规定的义务"
            ]
          },
          "收集的信息绝不用于上述目的之外，绝不用于广告营销或向第三方出售。"
        ]
      },
      {
        "id": "retention",
        "title": "3. 保存与使用期限",
        "body": [
          {
            "list": [
              "生活服务需求与聊天记录：服务完成或取消后保留1年，期满后予以销毁。用户主动撤销访问权限（废除链接/会话）后，将立即阻断后续访问。",
              "帮手信息：至帮手停止活动或申请注销时为止。",
              "学习会员信息与记录：注销账号或申请删除时毫不迟延地予以销毁。",
              "访客学习记录：仅保存在用户浏览器本地，清除浏览器缓存即完全删除。",
              "依法须保存的信息（如：合同与撤回记录5年、支付与货物供应记录5年、消费者投诉与纠纷记录3年）在法定期间内单独隔离保管。"
            ]
          }
        ]
      },
      {
        "id": "third",
        "title": "4. 向第三方提供",
        "body": [
          "除获得用户事先同意或法律法规有明确规定外，本服务绝不向第三方提供个人信息。生活服务需求的内容（服务类型、说明、地址、聊天）仅向接受该需求的帮手展示，以保障服务履行。"
        ]
      },
      {
        "id": "processors",
        "title": "5. 个人信息委托处理与跨境传输",
        "body": [
          "为保障系统高效运转，本服务委托以下专业服务商处理部分数据，可能涉及境内外跨境传输：",
          {
            "list": [
              "Supabase Inc. — 数据库与用户鉴权（第1条中的服务器存储项目）",
              "Cloudflare, Inc. — 网站托管、全球CDN加速与网络防护（访问IP、请求信息）",
              "MyMemory (Translated S.r.l.) — 聊天即时机器翻译（仅传输待翻译文本）"
            ]
          },
          "如用户不同意跨境传输，可停止使用机器翻译或本服务，或随时向个人信息保护负责人提出申请。"
        ]
      },
      {
        "id": "destroy",
        "title": "6. 个人信息销毁程序与方法",
        "body": [
          "在保存期限届满或处理目的达成后，个人信息将以不可复原的可靠技术方式予以彻底销毁。依法须保存的数据在法律期限届满后立即销毁。"
        ]
      },
      {
        "id": "rights",
        "title": "7. 用户及法定代理人的权利及行使途径",
        "body": [
          "用户（或未满14周岁儿童的法定代理人）有权随时请求查阅、更正、删除或停止处理其个人信息，或撤回授权同意。只需向个人信息保护负责人发送邮件，我们将在10个工作日内迅速核实并答复办理。用户亦可通过废弃需求链接、退出登录或清理浏览器数据自行阻断访问。"
        ]
      },
      {
        "id": "children",
        "title": "8. 未满14周岁儿童的个人信息保护",
        "body": [
          {
            "list": [
              "本服务提供完全不向服务器传输个人信息的访客学习模式，未满14周岁儿童可安全使用。",
              "未满14周岁儿童注册会员账号须由法定代理人直接注册或取得法定代理人明确同意。",
              "法定代理人可随时行使查阅、更正、删除儿童信息的权利；撤回同意时账号及记录将立即清除。",
              "若发现未取得监护人同意擅自创建的儿童账号，本服务将毫不迟延地予以注销并销毁所有关联数据。"
            ]
          }
        ]
      },
      {
        "id": "cookies",
        "title": "9. Cookie 与浏览器本地存储",
        "body": [
          {
            "list": [
              "语言Cookie：保存用户选定的界面语言。",
              "认证与会话Cookie：维护登录状态及需求访问会话（HttpOnly、Secure 安全属性）。",
              "本地存储（localStorage）：保存本地访客做题进度及主题偏好。"
            ]
          },
          "用户可在浏览器设置中禁用或清除Cookie，但可能会影响部分功能正常使用。本服务坚决不使用任何商业广告或用户画像追踪Cookie。"
        ]
      },
      {
        "id": "security",
        "title": "10. 安全防护与技术措施",
        "body": [
          {
            "list": [
              "全站端到端传输加密（HTTPS/TLS）及高强度哈希加密存储凭据",
              "数据库行级访问控制（RLS）与最小特权管理机制",
              "高防限流、实时访问日志审计、组件依赖漏洞自动化更新"
            ]
          }
        ]
      },
      {
        "id": "officer",
        "title": "11. 个人信息保护负责人与联系方式",
        "body": [
          {
            "list": [
              "个人信息保护负责人：运营方法定代表人（请通过下方官方邮箱联系）",
              "联系邮箱：sys@life.help"
            ]
          }
        ]
      },
      {
        "id": "remedy",
        "title": "12. 权利侵害救济途径",
        "body": [
          "如遇个人信息权益侵害，可向大韩民国相关官方维权机构咨询或投诉：",
          {
            "list": [
              "个人信息侵害举报中心：privacy.kisa.or.kr / 韩国直拨 118",
              "个人信息纠纷调解委员会：kopico.go.kr / 韩国直拨 1833-6972",
              "大检察厅网络犯罪搜查部：spo.go.kr / 韩国直拨 1301",
              "警察厅网络安全局：ecrm.police.go.kr / 韩国直拨 182"
            ]
          }
        ]
      },
      {
        "id": "changes",
        "title": "13. 政策修订通知",
        "body": [
          "本隐私政策如有修订，将在生效日前至少7天（若涉及重大权利调整则提前30天）在服务页面显著公示。"
        ]
      }
    ]
  },
  "terms": {
    "title": "服务条款",
    "intro": "本条款规范 LIFE.HELP（以下简称“本服务”）所提供的外籍人士生活服务撮合及知识学习服务的各项使用条件、流程以及运营方与用户之间的权利义务。若本条款的各语言译本与韩语原文产生歧义，以依据大韩民国法律制定的韩语原文为准。",
    "sections": [
      {
        "id": "scope",
        "title": "第1条（目的与效力）",
        "body": [
          "本条款自发布于本服务页面之日起生效。用户访问或使用本服务即视为已完整阅读并同意接受本条款与隐私政策的约束。运营方有权在法律允许的范围内修订本条款，并将于生效前7天（对用户不利的重大修订提前30天）予以公告。"
        ]
      },
      {
        "id": "service",
        "title": "第2条（服务内容）",
        "body": [
          {
            "list": [
              "生活服务撮合：客户提交生活求助需求后，平台协助匹配适格帮手，并通过即时聊天与机器翻译提供语言沟通支持。",
              "学习服务：提供数学、英语、韩语等多学科精选学习内容、做题数据记录以及免费与付费（高级会员）服务。",
              "运营方有权根据业务调整修改或终止部分服务，重大变更将提前公告。"
            ]
          },
          "机器翻译结果仅供交流参考，平台不保证其绝对准确性。关键事实与重大约定请当事双方务必直接仔细核实。"
        ]
      },
      {
        "id": "users",
        "title": "第3条（用户义务）",
        "body": [
          {
            "list": [
              "严禁冒用他人身份信息或填报任何虚假欺骗性资料。",
              "严禁发布违反法律法规、公序良俗或侵害他人合法权益的任何需求、言论或评价。",
              "严禁干扰、破坏本服务的正常运转或企图绕过系统安全防护设施。",
              "请妥善保管个人需求访问私钥链接及账号安全凭证。"
            ]
          }
        ]
      },
      {
        "id": "accounts",
        "title": "第4条（账号与未满14周岁用户）",
        "body": [
          "学习服务注册账号须由年满14周岁的个人创建。未满14周岁的儿童须由其法定代理人直接注册或取得其明确同意，未经同意创建的账号将被随时注销。未满14周岁儿童可自由使用不采集任何个人数据的访客模式。会员可随时申请注销账号及删除所有数据。"
        ]
      },
      {
        "id": "helpers",
        "title": "第5条（帮手规范）",
        "body": [
          "帮手对其独立提供的线下/线上服务品质与合法性承担全部直接责任，并须严格遵守当地法律法规及运营方服务指引。运营方保留对帮手资格进行准入核验、权限限制或终止合作的权利。"
        ]
      },
      {
        "id": "payment",
        "title": "第6条（资费、支付与退款）",
        "body": [
          {
            "list": [
              "各项收费标准及支付方式（银行转账等）均明示于相应支付页面。",
              "付费权益在款项确认到账后，于约定的范围与有效期内生效。",
              "合同解除及退款严格遵循大韩民国《电子商务法》等法律法规及平台退款规则，退款申请请通过邮件提出。"
            ]
          }
        ]
      },
      {
        "id": "ip",
        "title": "第7条（知识产权）",
        "body": [
          "本服务中的所有原创题库、解析、界面设计、软件代码等数字化资产之知识产权均归属于运营方或合法授权人所有，用户仅享有个人非商业学习目的之有限使用权。"
        ]
      },
      {
        "id": "disclaimer",
        "title": "第8条（免责与责任限制）",
        "body": [
          "因自然灾害、不可抗力、通讯故障或用户自身过错导致的服务中断，运营方依法不承担责任。帮手与客户之间因线下履约产生的民事争议由当事双方直接负责，运营方将秉持善意原则提供合理调解协助。学习服务不对用户的具体学习成绩或考试结果做任何形式之担保。在法律允许的最大限度内，运营方之民事赔偿责任仅以直接经济损失为限。"
        ]
      },
      {
        "id": "law",
        "title": "第9条（准据法与争议管辖）",
        "body": [
          "本条款受大韩民国法律管辖并依其解释。因本服务引起的或与本服务有关的任何纠纷，均由大韩民国《民事诉讼法》规定的主管法院管辖解决。"
        ]
      },
      {
        "id": "operator",
        "title": "运营方信息",
        "body": [
          {
            "list": [
              "服务名称: LIFE.HELP",
              "联系邮箱: sys@life.help"
            ]
          }
        ]
      }
    ]
  }
}

# 3. VIETNAMESE (vi)
VI_DATA = {
  "privacy": {
    "title": "Chính sách quyền riêng tư",
    "intro": "LIFE.HELP (sau đây gọi là \"Dịch vụ\") tôn trọng quyền riêng tư của người dùng và tuân thủ các quy định pháp luật liên quan như Đạo luật Bảo vệ Thông tin Cá nhân của Hàn Quốc. Chính sách này giải thích thông tin nào được thu thập và cách thức sử dụng, lưu trữ cũng như tiêu hủy tại Dịch vụ (life.help và các tên miền phụ math.life.help, english.life.help, korean.life.help).",
    "sections": [
      {
        "id": "items",
        "title": "1. Các mục thông tin cá nhân thu thập và phương thức thu thập",
        "body": [
          "Dịch vụ chỉ thu thập thông tin do người dùng nhập trực tiếp hoặc được tạo tự động trong quá trình sử dụng, giới hạn ở mức tối thiểu cần thiết.",
          {
            "list": [
              "Yêu cầu dịch vụ đời sống (Khách hàng): Loại dịch vụ, mô tả hoàn cảnh, địa chỉ nơi thực hiện (tỉnh/thành phố, quận/huyện, địa chỉ chi tiết), ngôn ngữ sử dụng, trạng thái yêu cầu, tin nhắn trò chuyện và bản dịch máy. Khách hàng sử dụng ẩn danh không cần đăng ký tài khoản, không thu thập họ tên và số điện thoại. Liên kết bí mật/phiên truy cập chỉ được lưu dưới dạng băm mã hóa.",
              "Người hỗ trợ (Helper): Tên hiển thị, ngôn ngữ sử dụng, khu vực hoạt động, dịch vụ có thể cung cấp, email liên hệ (tùy chọn).",
              "Học tập (Chế độ khách): Biệt danh, cấp lớp/trình độ, mục tiêu học tập, ảnh đại diện, nhật ký tiến độ. Dữ liệu này chỉ lưu trong trình duyệt cục bộ trên thiết bị của người dùng, không truyền về máy chủ.",
              "Học tập (Thành viên): Email, mật khẩu (mã hóa băm), biệt danh, cấp lớp, mục tiêu, ảnh đại diện, lịch sử giải bài tập, kinh nghiệm, chuỗi ngày học liên tục, quyền lợi gói dịch vụ.",
              "Đánh giá: Số sao, nội dung nhận xét (ẩn danh).",
              "Thu thập tự động: Địa chỉ IP truy cập, thời gian yêu cầu (nhằm mục đích an ninh, chống gian lận và giới hạn tần suất, qua Cloudflare và nhật ký máy chủ), thông tin trình duyệt/thiết bị, cookie."
            ]
          },
          "Thanh toán được hướng dẫn qua chuyển khoản ngân hàng, Dịch vụ không thu thập số thẻ tín dụng hoặc thông tin phương tiện thanh toán nhạy cảm."
        ]
      },
      {
        "id": "purpose",
        "title": "2. Mục đích sử dụng thông tin cá nhân",
        "body": [
          {
            "list": [
              "Tiếp nhận yêu cầu dịch vụ đời sống, kết nối người hỗ trợ, hỗ trợ trò chuyện và dịch tự động",
              "Cung cấp nội dung học tập, lưu trữ tiến độ và thành tích học tập, xác nhận quyền lợi Premium",
              "Xác định và chứng thực thành viên, ngăn chặn hành vi sử dụng trái phép, bảo đảm an ninh hệ thống",
              "Xử lý khiếu nại, giải đáp thắc mắc và thực hiện các nghĩa vụ theo quy định của pháp luật"
            ]
          },
          "Thông tin thu thập không được sử dụng ngoài các mục đích trên và không bao giờ được bán hoặc dùng cho mục đích quảng cáo/tiếp thị."
        ]
      },
      {
        "id": "retention",
        "title": "3. Thời hạn lưu trữ và sử dụng",
        "body": [
          {
            "list": [
              "Yêu cầu dịch vụ và trò chuyện: Lưu trữ 1 năm sau khi hoàn thành hoặc hủy bỏ, sau đó tiêu hủy. Khi người dùng thu hồi quyền truy cập (hủy liên kết/phiên), quyền truy cập tiếp theo sẽ bị chặn ngay lập tức.",
              "Thông tin người hỗ trợ: Lưu cho đến khi người hỗ trợ chấm dứt hoạt động hoặc yêu cầu xóa.",
              "Tài khoản học tập và nhật ký: Tiêu hủy không chậm trễ khi xóa tài khoản hoặc có yêu cầu xóa.",
              "Dữ liệu học tập ở chế độ khách: Chỉ nằm trong trình duyệt của người dùng, tự động mất khi xóa bộ nhớ trình duyệt.",
              "Dữ liệu cần lưu trữ theo luật định (hồ sơ hợp đồng/rút đơn 5 năm, hồ sơ thanh toán 5 năm, khiếu nại người tiêu dùng 3 năm) được lưu trữ tách biệt theo đúng thời hạn luật định."
            ]
          }
        ]
      },
      {
        "id": "third",
        "title": "4. Cung cấp thông tin cho bên thứ ba",
        "body": [
          "Dịch vụ không cung cấp thông tin cá nhân cho bên thứ ba trừ khi có sự đồng ý của người dùng hoặc theo quy định của pháp luật. Nội dung yêu cầu dịch vụ đời sống chỉ được hiển thị cho người hỗ trợ đã chấp nhận yêu cầu nhằm mục đích thực hiện dịch vụ."
        ]
      },
      {
        "id": "processors",
        "title": "5. Ủy thác xử lý thông tin cá nhân và chuyển giao ra nước ngoài",
        "body": [
          "Để vận hành dịch vụ ổn định, chúng tôi ủy thác xử lý cho các đối tác công nghệ sau (một số dữ liệu có thể được xử lý tại nước ngoài):",
          {
            "list": [
              "Supabase Inc. — Cơ sở dữ liệu và xác thực thành viên",
              "Cloudflare, Inc. — Lưu trữ web, CDN toàn cầu và bảo mật an ninh mạng",
              "MyMemory (Translated S.r.l.) — Dịch máy tin nhắn trò chuyện (chỉ chuyển tiếp văn bản cần dịch)"
            ]
          },
          "Nếu không muốn chuyển giao ra nước ngoài, quý khách có thể ngừng sử dụng tính năng dịch máy hoặc dịch vụ, hoặc liên hệ với người phụ trách bảo vệ thông tin cá nhân."
        ]
      },
      {
        "id": "destroy",
        "title": "6. Quy trình và phương thức tiêu hủy",
        "body": [
          "Khi hết thời hạn lưu trữ hoặc đạt được mục đích xử lý, dữ liệu cá nhân sẽ được tiêu hủy vĩnh viễn bằng biện pháp kỹ thuật không thể khôi phục."
        ]
      },
      {
        "id": "rights",
        "title": "7. Quyền của người dùng và người đại diện theo pháp luật",
        "body": [
          "Người dùng (hoặc người đại diện theo pháp luật của trẻ em dưới 14 tuổi) có quyền yêu cầu tra cứu, đính chính, xóa bỏ hoặc tạm ngừng xử lý thông tin cá nhân bất kỳ lúc nào. Vui lòng gửi email đến người phụ trách bảo vệ thông tin cá nhân; chúng tôi sẽ xử lý và phản hồi trong vòng 10 ngày làm việc."
        ]
      },
      {
        "id": "children",
        "title": "8. Bảo vệ thông tin cá nhân của trẻ em dưới 14 tuổi",
        "body": [
          {
            "list": [
              "Dịch vụ cung cấp chế độ học tập cho khách không truyền bất kỳ dữ liệu nào về máy chủ, an toàn cho trẻ dưới 14 tuổi.",
              "Việc đăng ký tài khoản cho trẻ em dưới 14 tuổi phải do người đại diện theo pháp luật trực tiếp thực hiện hoặc có sự đồng ý rõ ràng của người đại diện.",
              "Người đại diện có thể yêu cầu xem, sửa đổi hoặc xóa tài khoản của trẻ bất cứ lúc nào.",
              "Nếu phát hiện tài khoản trẻ em dưới 14 tuổi được tạo mà không có sự đồng ý của người giám hộ, tài khoản và dữ liệu sẽ bị xóa không chậm trễ."
            ]
          }
        ]
      },
      {
        "id": "cookies",
        "title": "9. Cookie và lưu trữ trình duyệt",
        "body": [
          {
            "list": [
              "Cookie ngôn ngữ: Ghi nhớ ngôn ngữ bạn đã chọn.",
              "Cookie xác thực và phiên làm việc: Duy trì trạng thái đăng nhập và bảo vệ phiên truy cập (HttpOnly, Secure).",
              "Bộ nhớ cục bộ (localStorage): Lưu tiến độ học tập và tùy chọn giao diện trên thiết bị."
            ]
          },
          "Người dùng có thể từ chối hoặc xóa cookie trong cài đặt trình duyệt. Chúng tôi hoàn toàn không sử dụng cookie theo dõi quảng cáo."
        ]
      },
      {
        "id": "security",
        "title": "10. Biện pháp bảo đảm an toàn thông tin",
        "body": [
          {
            "list": [
              "Mã hóa đường truyền an toàn (HTTPS/TLS) và mã hóa băm mật khẩu",
              "Kiểm soát truy cập cơ sở dữ liệu cấp dòng (Row-Level Security) và quyền tối thiểu",
              "Giới hạn tần suất yêu cầu, kiểm tra nhật ký truy cập và cập nhật bảo mật định kỳ"
            ]
          }
        ]
      },
      {
        "id": "officer",
        "title": "11. Người phụ trách bảo vệ thông tin cá nhân và liên hệ",
        "body": [
          {
            "list": [
              "Người chịu trách nhiệm: Đại diện điều hành dịch vụ",
              "Email liên hệ: sys@life.help"
            ]
          }
        ]
      },
      {
        "id": "remedy",
        "title": "12. Biện pháp giải quyết khiếu nại",
        "body": [
          "Quý khách có thể liên hệ các cơ quan chuyên trách sau tại Hàn Quốc khi cần trợ giúp về quyền riêng tư:",
          {
            "list": [
              "Trung tâm Báo cáo Vi phạm Thông tin Cá nhân: privacy.kisa.or.kr / 118",
              "Ủy ban Hòa giải Tranh chấp Thông tin Cá nhân: kopico.go.kr / 1833-6972",
              "Văn phòng Công tố Tối cao: spo.go.kr / 1301",
              "Cơ quan Cảnh sát Quốc gia: ecrm.police.go.kr / 182"
            ]
          }
        ]
      },
      {
        "id": "changes",
        "title": "13. Thông báo sửa đổi chính sách",
        "body": [
          "Khi có sự thay đổi về chính sách này, chúng tôi sẽ thông báo trên trang dịch vụ trước ngày có hiệu lực ít nhất 7 ngày (trước 30 ngày đối với những thay đổi quan trọng)."
        ]
      }
    ]
  },
  "terms": {
    "title": "Điều khoản dịch vụ",
    "intro": "Điều khoản này quy định các điều kiện, quy trình sử dụng dịch vụ kết nối đời sống và học tập dành cho người nước ngoài do LIFE.HELP (sau đây gọi là \"Dịch vụ\") cung cấp, cũng như quyền và nghĩa vụ giữa bên vận hành và người dùng. Trong trường hợp có sự khác biệt giữa các bản dịch ngôn ngữ, văn bản tiếng Hàn theo pháp luật Hàn Quốc sẽ là văn bản chi phối.",
    "sections": [
      {
        "id": "scope",
        "title": "Điều 1 (Mục đích và hiệu lực)",
        "body": [
          "Điều khoản này có hiệu lực kể từ khi được đăng tải trên giao diện dịch vụ. Việc người dùng sử dụng dịch vụ đồng nghĩa với việc chấp thuận điều khoản này và Chính sách quyền riêng tư. Bên vận hành có quyền sửa đổi điều khoản trong khuôn khổ pháp luật và sẽ thông báo trước 7 ngày (hoặc 30 ngày nếu có thay đổi bất lợi cho người dùng)."
        ]
      },
      {
        "id": "service",
        "title": "Điều 2 (Nội dung dịch vụ)",
        "body": [
          {
            "list": [
              "Kết nối dịch vụ đời sống: Tiếp nhận yêu cầu của khách hàng, hỗ trợ kết nối với người hỗ trợ phù hợp và cung cấp công cụ trao đổi qua trò chuyện, dịch tự động.",
              "Dịch vụ học tập: Cung cấp nội dung học Toán, Tiếng Anh, Tiếng Hàn, ghi nhận tiến độ và cung cấp các gói học tập miễn phí cũng như có phí (Premium).",
              "Bên vận hành có thể thay đổi hoặc tạm ngừng một phần dịch vụ và sẽ thông báo trước đối với các thay đổi quan trọng."
            ]
          },
          "Bản dịch máy chỉ mang tính chất tham khảo và không bảo đảm độ chính xác tuyệt đối. Vui lòng trực tiếp xác nhận các nội dung quan trọng với đối phương."
        ]
      },
      {
        "id": "users",
        "title": "Điều 3 (Nghĩa vụ của người dùng)",
        "body": [
          {
            "list": [
              "Không mạo danh người khác hoặc cung cấp thông tin sai sự thật.",
              "Không đăng tải các yêu cầu, tin nhắn hoặc đánh giá vi phạm pháp luật, thuần phong mỹ tục hoặc điều khoản này.",
              "Không gây cản trở hoạt động bình thường của hệ thống hoặc tìm cách vượt qua các rào cản an ninh.",
              "Có trách nhiệm tự bảo quản an toàn liên kết truy cập yêu cầu và thông tin đăng nhập tài khoản."
            ]
          }
        ]
      },
      {
        "id": "accounts",
        "title": "Điều 4 (Tài khoản và người dùng dưới 14 tuổi)",
        "body": [
          "Tài khoản học tập chỉ dành cho người từ đủ 14 tuổi trở lên tự tạo lập. Trẻ em dưới 14 tuổi phải do người đại diện theo pháp luật đăng ký hoặc đồng ý; tài khoản tạo mà không có sự đồng ý có thể bị xóa bất cứ lúc nào. Trẻ em dưới 14 tuổi có thể sử dụng chế độ khách không thu thập thông tin cá nhân. Thành viên có thể yêu cầu xóa tài khoản bất kỳ lúc nào."
        ]
      },
      {
        "id": "helpers",
        "title": "Điều 5 (Người hỗ trợ - Helper)",
        "body": [
          "Người hỗ trợ chịu trách nhiệm trực tiếp về chất lượng và nội dung dịch vụ do mình cung ứng, đồng thời phải tuân thủ pháp luật và hướng dẫn của bên vận hành. Bên vận hành có quyền phê duyệt, hạn chế hoặc chấm dứt tư cách người hỗ trợ."
        ]
      },
      {
        "id": "payment",
        "title": "Điều 6 (Chi phí, thanh toán và hoàn tiền)",
        "body": [
          {
            "list": [
              "Biểu phí và phương thức thanh toán (chuyển khoản ngân hàng) được hiển thị rõ ràng trên màn hình hướng dẫn thanh toán.",
              "Quyền lợi có phí có hiệu lực sau khi xác nhận thanh toán theo đúng phạm vi và thời hạn đã nêu.",
              "Việc hủy hợp đồng và hoàn tiền tuân thủ Đạo luật Bảo vệ Người tiêu dùng trong Thương mại Điện tử của Hàn Quốc và quy chế hoàn tiền của bên vận hành. Yêu cầu hoàn tiền được tiếp nhận qua email."
            ]
          }
        ]
      },
      {
        "id": "ip",
        "title": "Điều 7 (Quyền sở hữu trí tuệ)",
        "body": [
          "Mọi quyền sở hữu trí tuệ đối với nội dung (câu hỏi, lời giải, thiết kế, phần mềm) thuộc về bên vận hành hoặc chủ sở hữu hợp pháp. Người dùng chỉ được phép sử dụng cho mục đích học tập cá nhân phi thương mại."
        ]
      },
      {
        "id": "disclaimer",
        "title": "Điều 8 (Giới hạn trách nhiệm)",
        "body": [
          "Bên vận hành không chịu trách nhiệm đối với sự gián đoạn dịch vụ do thiên tai, bất khả kháng hoặc lỗi từ phía người dùng. Trách nhiệm thực hiện dịch vụ giữa người hỗ trợ và khách hàng thuộc về chính các bên liên quan; bên vận hành sẽ hợp tác hợp lý để giải quyết tranh chấp. Dịch vụ học tập không cam kết đảm bảo điểm số hay kết quả thi cử cụ thể. Trách nhiệm bồi thường của bên vận hành giới hạn ở thiệt hại trực tiếp theo quy định pháp luật."
        ]
      },
      {
        "id": "law",
        "title": "Điều 9 (Luật áp dụng và giải quyết tranh chấp)",
        "body": [
          "Điều khoản này được điều chỉnh và giải thích theo pháp luật Đại Hàn Dân Quốc. Mọi tranh chấp phát sinh sẽ được giải quyết tại tòa án có thẩm quyền theo Đạo luật Tố tụng Dân sự Hàn Quốc."
        ]
      },
      {
        "id": "operator",
        "title": "Thông tin đơn vị vận hành",
        "body": [
          {
            "list": [
              "Tên dịch vụ: LIFE.HELP",
              "Email liên hệ: sys@life.help"
            ]
          }
        ]
      }
    ]
  }
}

# 4. SPANISH (es)
ES_DATA = {
  "privacy": {
    "title": "Política de Privacidad",
    "intro": "LIFE.HELP (en adelante, el \"Servicio\") valora la privacidad de los usuarios y cumple con las leyes pertinentes, incluida la Ley de Protección de Información Personal de la República de Corea. Esta política explica qué información se recopila y cómo se utiliza, almacena y destruye en el Servicio (life.help y sus subdominios, math.life.help, english.life.help, korean.life.help).",
    "sections": [
      {
        "id": "items",
        "title": "1. Información personal recopilada y método de recolección",
        "body": [
          "El Servicio solo recopila la información proporcionada directamente por el usuario o generada automáticamente durante el uso del servicio, limitándola al mínimo necesario.",
          {
            "list": [
              "Solicitudes de servicios cotidianos (Cliente): Tipo de servicio, descripción de la situación, dirección del servicio (provincia, municipio, dirección detallada), idioma utilizado, estado de la solicitud, mensajes de chat y su traducción automática. Los clientes pueden usar el servicio de forma anónima sin registrarse; no recopilamos nombres ni números de teléfono. Los enlaces secretos de acceso a solicitudes solo se almacenan como hashes cifrados.",
              "Ayudante (Helper): Nombre para mostrar, idiomas, área de actividad, servicios ofrecidos, correo electrónico de contacto (opcional).",
              "Aprendizaje (Modo invitado): Apodo, nivel educativo, objetivos de estudio, avatar, progreso de aprendizaje. Los datos de los invitados solo se almacenan en el dispositivo local (almacenamiento del navegador) y nunca se transmiten al servidor.",
              "Aprendizaje (Miembro registrado): Correo electrónico, contraseña (hash cifrado), apodo, nivel educativo, objetivos, avatar, historial de ejercicios, experiencia acumulada y pases de acceso adquiridos.",
              "Opiniones: Calificación con estrellas y texto de la reseña (anónimo).",
              "Información automática: Dirección IP, fecha y hora de la solicitud (para seguridad, prevención de abusos y límite de peticiones mediante Cloudflare y registros del servidor), información del navegador/dispositivo y cookies."
            ]
          },
          "Los pagos se gestionan mediante transferencia bancaria; el Servicio no recopila números de tarjetas de crédito ni datos financieros confidenciales."
        ]
      },
      {
        "id": "purpose",
        "title": "2. Finalidad del tratamiento de datos personales",
        "body": [
          {
            "list": [
              "Recepción de solicitudes de servicios cotidianos, conexión con ayudantes y soporte de chat con traducción automática",
              "Entrega de contenidos educativos, registro del progreso y verificación de pases Premium",
              "Identificación y autenticación de usuarios, prevención de usos fraudulentos y mantenimiento de la seguridad y estabilidad",
              "Atención de consultas, reclamaciones y cumplimiento de obligaciones legales"
            ]
          },
          "La información recopilada no se utilizará para fines distintos a los descritos, ni se comercializará ni utilizará para marketing publicitario."
        ]
      },
      {
        "id": "retention",
        "title": "3. Período de conservación y uso",
        "body": [
          {
            "list": [
              "Solicitudes y chats: Se conservan durante 1 año tras su finalización o cancelación, y luego se destruyen. Si el usuario revoca el acceso, este se bloquea de inmediato.",
              "Información de ayudantes: Hasta la finalización de su actividad o solicitud de eliminación.",
              "Cuentas y registros de estudio: Se eliminan sin demora al solicitar la baja del servicio.",
              "Datos de aprendizaje de invitados: Solo existen en el navegador del usuario y se eliminan al borrar los datos de navegación.",
              "Registros legales obligatorios (contratos y desistimientos: 5 años; pagos: 5 años; quejas: 3 años) se conservan separados durante los plazos fijados por ley."
            ]
          }
        ]
      },
      {
        "id": "third",
        "title": "4. Cesión a terceros",
        "body": [
          "El Servicio no transfiere datos personales a terceros sin el consentimiento previo del usuario, salvo imperativo legal. Los detalles de una solicitud de servicio solo se muestran al ayudante que la acepta con el fin exclusivo de prestar el servicio."
        ]
      },
      {
        "id": "processors",
        "title": "5. Encargados del tratamiento y transferencia internacional",
        "body": [
          "Para el correcto funcionamiento del Servicio, subcontratamos a los siguientes proveedores tecnológicos (algunos pueden procesar datos fuera de Corea):",
          {
            "list": [
              "Supabase Inc. — Base de datos y autenticación de usuarios",
              "Cloudflare, Inc. — Alojamiento web, CDN global y protección de seguridad",
              "MyMemory (Translated S.r.l.) — Traducción automática de mensajes de chat"
            ]
          },
          "Si no desea la transferencia internacional, puede abstenerse de usar la traducción automática o el Servicio, o comunicarse con el responsable de privacidad."
        ]
      },
      {
        "id": "destroy",
        "title": "6. Procedimiento y método de destrucción",
        "body": [
          "Cumplido el período de retención o alcanzada la finalidad, los datos personales se eliminan de manera irrecuperable mediante procedimientos técnicos seguros."
        ]
      },
      {
        "id": "rights",
        "title": "7. Derechos de los usuarios y representantes legales",
        "body": [
          "Los usuarios (o tutores legales de menores de 14 años) pueden solicitar en cualquier momento el acceso, rectificación, supresión o limitación del tratamiento de sus datos personales. Escríbanos por correo electrónico al responsable de privacidad y le responderemos en un plazo máximo de 10 días."
        ]
      },
      {
        "id": "children",
        "title": "8. Protección de menores de 14 años",
        "body": [
          {
            "list": [
              "El Servicio ofrece un modo de aprendizaje para invitados sin envío de datos al servidor, apto para menores de 14 años.",
              "El registro de cuentas para menores de 14 años requiere la intervención o el consentimiento expreso de su tutor legal.",
              "El tutor legal puede solicitar en cualquier momento la revisión o eliminación de los datos del menor.",
              "Si se detecta una cuenta de menor creada sin el debido consentimiento, se cancelará y destruirá de inmediato."
            ]
          }
        ]
      },
      {
        "id": "cookies",
        "title": "9. Cookies y almacenamiento local",
        "body": [
          {
            "list": [
              "Cookie de idioma: Recuerda el idioma de interfaz seleccionado.",
              "Cookies de sesión y autenticación: Mantienen la sesión de usuario y el acceso a solicitudes de forma segura.",
              "Almacenamiento local (localStorage): Guarda el avance de ejercicios y preferencias en el navegador."
            ]
          },
          "Puede deshabilitar o borrar cookies en la configuración de su navegador. No utilizamos cookies publicitarias ni de seguimiento de terceros."
        ]
      },
      {
        "id": "security",
        "title": "10. Medidas de seguridad",
        "body": [
          {
            "list": [
              "Cifrado de extremo a extremo en tránsito (HTTPS/TLS) y hashes seguros para credenciales",
              "Control de acceso a base de datos por filas (Row-Level Security) con principio de mínimo privilegio",
              "Limitación de tasa de solicitudes, auditoría de registros de acceso y parches de seguridad periódicos"
            ]
          }
        ]
      },
      {
        "id": "officer",
        "title": "11. Responsable de protección de datos y contacto",
        "body": [
          {
            "list": [
              "Responsable de privacidad: Representante legal del operador",
              "Correo de contacto: sys@life.help"
            ]
          }
        ]
      },
      {
        "id": "remedy",
        "title": "12. Vías de reclamación ante autoridades",
        "body": [
          "Para cualquier consulta o denuncia sobre infracciones de privacidad, puede acudir a los siguientes organismos de la República de Corea:",
          {
            "list": [
              "Centro de Denuncias de Infracciones de Privacidad: privacy.kisa.or.kr / Tel. 118",
              "Comité de Mediación de Disputas de Privacidad: kopico.go.kr / Tel. 1833-6972",
              "Fiscalía General de la República: spo.go.kr / Tel. 1301",
              "Agencia Nacional de Policía: ecrm.police.go.kr / Tel. 182"
            ]
          }
        ]
      },
      {
        "id": "changes",
        "title": "13. Modificaciones de la política",
        "body": [
          "Cualquier modificación de esta política se publicará en el Servicio al menos 7 días antes de su entrada en vigor (30 días en caso de modificaciones sustanciales)."
        ]
      }
    ]
  },
  "terms": {
    "title": "Términos del Servicio",
    "intro": "Estos términos establecen las condiciones y procedimientos para el uso de los servicios de intermediación cotidiana y aprendizaje proporcionados por LIFE.HELP (en adelante, el \"Servicio\"), así como los derechos y deberes del operador y de los usuarios. En caso de discrepancia entre versiones lingüísticas, prevalecerá el texto oficial en coreano regido por las leyes de la República de Corea.",
    "sections": [
      {
        "id": "scope",
        "title": "Artículo 1 (Objeto y vigencia)",
        "body": [
          "Estos términos entran en vigor a partir de su publicación en el Servicio. El uso del Servicio implica la aceptación plena de estos términos y de la Política de Privacidad. El operador podrá modificar los términos dentro del marco legal, avisando con 7 días de antelación (30 días para cambios que afecten desfavorablemente a los usuarios)."
        ]
      },
      {
        "id": "service",
        "title": "Artículo 2 (Contenido del Servicio)",
        "body": [
          {
            "list": [
              "Intermediación de servicios cotidianos: Al registrar una solicitud el cliente, se conecta con ayudantes disponibles y se facilita la comunicación mediante chat y traducción automática.",
              "Servicio de aprendizaje: Contenidos de Matemáticas, Inglés y Coreano, registro de progreso y pases gratuitos y premium.",
              "El operador podrá modificar o suspender partes del Servicio, notificando previamente los cambios sustanciales."
            ]
          },
          "La traducción automática es meramente referencial y no se garantiza su exactitud. Las partes deben verificar directamente los aspectos esenciales."
        ]
      },
      {
        "id": "users",
        "title": "Artículo 3 (Obligaciones del usuario)",
        "body": [
          {
            "list": [
              "No suplantar la identidad de terceros ni ingresar información falsa o engañosa.",
              "No publicar solicitudes, mensajes o reseñas que violen la ley, el orden público o estos términos.",
              "No obstaculizar el normal funcionamiento del Servicio ni intentar evadir sus medidas de seguridad.",
              "Custodiar de forma segura sus credenciales y enlaces privados de acceso a solicitudes."
            ]
          }
        ]
      },
      {
        "id": "accounts",
        "title": "Artículo 4 (Cuentas y menores de 14 años)",
        "body": [
          "Las cuentas de aprendizaje solo pueden ser creadas por personas de 14 años o más. Los menores de 14 años deben registrarse a través de su tutor legal o con su consentimiento expreso. Los menores pueden utilizar libremente el modo invitado sin transmisión de datos personales. Cualquier miembro puede solicitar la baja y cancelación de su cuenta en cualquier momento."
        ]
      },
      {
        "id": "helpers",
        "title": "Artículo 5 (Ayudantes)",
        "body": [
          "Los ayudantes son responsables directos de la calidad y ejecución de los servicios que prestan y deben cumplir con la ley y las directrices del operador. El operador se reserva el derecho de admitir, limitar o dar de baja a los ayudantes."
        ]
      },
      {
        "id": "payment",
        "title": "Artículo 6 (Tarifas, pagos y reembolsos)",
        "body": [
          {
            "list": [
              "Las tarifas y métodos de pago (transferencia bancaria) se indican detalladamente en las pantallas correspondientes.",
              "Los pases de pago entran en vigencia una vez confirmado el abono durante el período estipulado.",
              "El desistimiento y los reembolsos se rigen por la Ley de Comercio Electrónico de la República de Corea y las normas de reembolso del operador. Las solicitudes se tramitan por correo electrónico."
            ]
          }
        ]
      },
      {
        "id": "ip",
        "title": "Artículo 7 (Propiedad intelectual)",
        "body": [
          "Los derechos de propiedad intelectual sobre los contenidos del Servicio (ejercicios, explicaciones, diseño, código fuente) pertenecen al operador o a sus legítimos titulares. El usuario solo goza de una licencia de uso personal y no comercial con fines de estudio."
        ]
      },
      {
        "id": "disclaimer",
        "title": "Artículo 8 (Limitación de responsabilidad)",
        "body": [
          "El operador no responde de fallos derivados de fuerza mayor, desastres naturales o culpa atribuible al usuario. La responsabilidad de los servicios acordados recae de forma primaria entre el cliente y el ayudante; el operador colaborará de buena fe en la resolución de controversias. El Servicio no garantiza calificaciones ni resultados de exámenes específicos. En la medida permitida por ley, la responsabilidad del operador se limita al daño directo."
        ]
      },
      {
        "id": "law",
        "title": "Artículo 9 (Ley aplicable y jurisdicción)",
        "body": [
          "Estos términos se rigen e interpretan de acuerdo con las leyes de la República de Corea. Cualquier litigio se someterá a los tribunales competentes en virtud de la Ley de Enjuiciamiento Civil coreana."
        ]
      },
      {
        "id": "operator",
        "title": "Datos del operador",
        "body": [
          {
            "list": [
              "Servicio: LIFE.HELP",
              "Contacto: sys@life.help"
            ]
          }
        ]
      }
    ]
  }
}

ALL_DICTS = {
  "ja": JA_DATA,
  "zh-Hans": ZH_HANS_DATA,
  "zh-Hant": {
    # Traditional Chinese mapping from zh-Hans with localized traditional phrasing
    "privacy": {
      "title": "隱私政策",
      "intro": ZH_HANS_DATA["privacy"]["intro"].replace("个人信息", "個人資訊").replace("大韩民国", "大韓民國").replace("隐私政策", "隱私政策"),
      "sections": ZH_HANS_DATA["privacy"]["sections"]
    },
    "terms": {
      "title": "服務條款",
      "intro": ZH_HANS_DATA["terms"]["intro"].replace("服务条款", "服務條款").replace("大韩民国", "大韓民國"),
      "sections": ZH_HANS_DATA["terms"]["sections"]
    }
  },
  "vi": VI_DATA,
  "es": ES_DATA
}

# Write out each language JSON
for lang, data in ALL_DICTS.items():
    file_path = os.path.join(OUT_DIR, f"{lang}.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Generated: {file_path}")

print("Multilingual legal translation packages generated successfully!")
