const fs = require('fs');

let content = fs.readFileSync('components/tech/HelperAuthCard.tsx', 'utf8');

// Replace state
content = content.replace(
  `  const [activeTab, setActiveTab] = useState<"register" | "login">(defaultTab);
  const [phone, setPhone] = useState("");
  const [helperName, setHelperName] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "toilet-clog",
    "sink-clog",
    "drain-clog",
  ]);
  const [regionText, setRegionText] = useState("전북특별자치도 익산시");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPhoneReissue, setShowPhoneReissue] = useState(false);`,
  `  const [activeTab, setActiveTab] = useState<"register" | "login">(defaultTab);
  const [email, setEmail] = useState("");
  const [helperName, setHelperName] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "toilet-clog",
    "sink-clog",
    "drain-clog",
  ]);
  const [regionText, setRegionText] = useState("전북특별자치도 익산시");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showEmailReissue, setShowEmailReissue] = useState(false);`
);

// Replace handleSendAccessKey
content = content.replace(
  `  // Request 3-Month Security Access Key
  const handleSendAccessKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg(
        formatBilingual(
          t("tech.invalidPhoneError"),
          "올바른 이동전화번호를 입력해 주세요. (예: 010-1234-5678)",
        ),
      );
      return;
    }

    setErrorMsg("");
    setLoading(true);
    const res = await requestAccessKey(phone);`,
  `  // Request 90-Day Security Access Key via Email
  const handleSendAccessKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMsg(
        formatBilingual(
          "Please enter a valid email address. (e.g. helper@example.com)",
          "올바른 이메일 주소를 입력해 주세요. (예: helper@example.com)",
        ),
      );
      return;
    }

    setErrorMsg("");
    setLoading(true);
    const res = await requestAccessKey(cleanEmail);`
);

// Replace registerHelper call in handleRegisterSubmit
content = content.replace(
  `    registerHelper({
      name: helperName.trim(),
      phone: phone.trim(),
      accessKey: authCode.trim().toUpperCase(),
      accessKeyExpiresAt: accessKeyNotice?.expiresAt,
      regions: [
        {
          sido: parts[0] || "전북특별자치도",
          gungu: parts[1] || "익산시",
        },
      ],
      services: selectedServices,
    });`,
  `    registerHelper({
      name: helperName.trim(),
      email: email.trim().toLowerCase(),
      accessKey: authCode.trim().toUpperCase(),
      accessKeyExpiresAt: accessKeyNotice?.expiresAt,
      regions: [
        {
          sido: parts[0] || "전북특별자치도",
          gungu: parts[1] || "익산시",
        },
      ],
      services: selectedServices,
    });`
);

// Replace login notice and reissue drawer
content = content.replace(
  `          {/* Explanatory Info Card */}
          <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-3.5">
            <p className="text-[11px] leading-relaxed text-blue-300 font-medium">
              💡{" "}
              {formatBilingual(
                t("tech.loginKeyNotice"),
                "카카오톡 또는 문자로 발급받으신 3개월 전용 보안 코드를 입력하시면 별도의 본인인증 없이 즉시 헬퍼 워크스페이스에 접속하실 수 있습니다.",
              )}
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMsg("");
              }}
              className="text-blue-400 hover:text-blue-300 font-bold"
            >
              {formatBilingual(
                t("tech.registerTab"),
                "← 신규 헬퍼 등록 및 활동 신청",
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowPhoneReissue((prev) => !prev)}
              className="text-slate-400 hover:text-white underline font-medium"
            >
              {formatBilingual(t("tech.lostCodeBtn"), "코드를 분실하셨나요?")}
            </button>
          </div>

          {/* Re-issue Drawer */}
          {showPhoneReissue && (
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 mt-2 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">
                {formatBilingual(
                  t("tech.reissueCodeTitle"),
                  "이동전화번호로 3개월 코드 재발급",
                )}
              </span>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold font-mono text-white outline-none focus:border-blue-500"
                />`,
  `          {/* Explanatory Info Card */}
          <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-3.5">
            <p className="text-[11px] leading-relaxed text-blue-300 font-medium">
              💡{" "}
              {formatBilingual(
                "Enter the 90-day security access code received via email to instantly access the Helper Workspace.",
                "이메일로 발급받으신 90일 전용 보안 접속 코드를 입력하시면 별도의 본인인증 없이 즉시 헬퍼 워크스페이스에 접속하실 수 있습니다.",
              )}
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMsg("");
              }}
              className="text-blue-400 hover:text-blue-300 font-bold"
            >
              {formatBilingual(
                t("tech.registerTab"),
                "← 신규 헬퍼 등록 및 활동 신청",
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailReissue((prev) => !prev)}
              className="text-slate-400 hover:text-white underline font-medium"
            >
              {formatBilingual(t("tech.lostCodeBtn"), "코드를 분실하셨나요?")}
            </button>
          </div>

          {/* Re-issue Drawer */}
          {showEmailReissue && (
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 mt-2 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">
                {formatBilingual(
                  "Reissue 90-day Code via Email",
                  "이메일로 90일 보안 코드 재발급",
                )}
              </span>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="helper@example.com"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold font-mono text-white outline-none focus:border-blue-500"
                />`
);

// Replace registration phone field with email
content = content.replace(
  `          {/* Phone Input */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300">
              {formatBilingual(t("tech.phoneLabel"), "이동전화번호 (휴대폰 번호)")}
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="tel"
                required
                disabled={codeSent}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-base font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-60 disabled:bg-slate-850 font-mono"
              />
              {!codeSent ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-black text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer border border-blue-500/30"
                >
                  {loading
                    ? formatBilingual(t("tech.verifying"), "발송 중...")
                    : formatBilingual(
                        t("tech.getAccessKeyBtn"),
                        "3개월 보안 접속 코드 받기",
                      )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCodeSent(false)}
                  className="shrink-0 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-3.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white shadow-2xs active:scale-[0.98] transition cursor-pointer"
                >
                  {formatBilingual(t("tech.changePhoneBtn"), "번호 변경")}
                </button>
              )}
            </div>
            {!codeSent && (
              <div className="mt-2 rounded-xl border border-blue-900/40 bg-blue-950/20 p-3">
                <p className="text-[11px] leading-relaxed text-blue-300 font-medium">
                  💡{" "}
                  {formatBilingual(
                    t("tech.securitySessionNotice"),
                    "3개월 보안 세션 시스템: 이동전화번호 기반 무작위 90자 보안 암호키 발급",
                  )}
                </p>
              </div>
            )}
          </div>`,
  `          {/* Email Input */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300">
              {formatBilingual("Email Address", "이메일(Email) 주소")}
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="email"
                required
                disabled={codeSent}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="helper@example.com"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-base font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-60 disabled:bg-slate-850 font-mono"
              />
              {!codeSent ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-black text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer border border-blue-500/30"
                >
                  {loading
                    ? formatBilingual(t("tech.verifying"), "발송 중...")
                    : formatBilingual(
                        "90일 보안 접속 코드 받기",
                        "90일 보안 접속 코드 받기",
                      )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCodeSent(false)}
                  className="shrink-0 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-3.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white shadow-2xs active:scale-[0.98] transition cursor-pointer"
                >
                  {formatBilingual("이메일 변경", "이메일 변경")}
                </button>
              )}
            </div>
            {!codeSent && (
              <div className="mt-2 rounded-xl border border-blue-900/40 bg-blue-950/20 p-3">
                <p className="text-[11px] leading-relaxed text-blue-300 font-medium">
                  💡{" "}
                  {formatBilingual(
                    "90-Day Security Session: Security access key issued via email verification",
                    "90일 보안 세션 시스템: 이메일 인증 기반 90일 유효 보안 접속 코드 발급",
                  )}
                </p>
              </div>
            )}
          </div>`
);

// Replace visual notice card
content = content.replace(
  `              {/* Visual KakaoTalk / SMS Notice Card */}
              <div className="rounded-2xl border border-emerald-700/60 bg-emerald-950/40 p-4 text-xs text-emerald-200 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
                    <span>💬</span>
                    <span>
                      {formatBilingual(
                        t("tech.keySentNotice"),
                        "카카오톡 알림톡 / SMS 발송 완료",
                      )}
                    </span>
                  </span>
                  <span className="font-mono text-slate-300">{phone}</span>
                </div>`,
  `              {/* Visual Email Notice Card */}
              <div className="rounded-2xl border border-emerald-700/60 bg-emerald-950/40 p-4 text-xs text-emerald-200 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
                    <span>📧</span>
                    <span>
                      {formatBilingual(
                        "Email Sent Successfully",
                        "이메일(Email) 발송 완료",
                      )}
                    </span>
                  </span>
                  <span className="font-mono text-slate-300">{email}</span>
                </div>`
);

fs.writeFileSync('components/tech/HelperAuthCard.tsx', content, 'utf8');
console.log('Successfully updated components/tech/HelperAuthCard.tsx');

