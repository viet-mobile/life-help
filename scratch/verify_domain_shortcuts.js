// scratch/verify_domain_shortcuts.js
const http = require("http");

function fetchUrl(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path,
        method: "GET",
        headers: {
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function test() {
  console.log("=== 1. Testing /manifest.webmanifest across domains ===");

  const domains = [
    { host: "vietnam.life.help", expectedDesc: "Nền tảng dịch vụ sinh hoạt đa ngôn ngữ" },
    { host: "korea.life.help", expectedDesc: "한국 거주 외국인을 위한 생활서비스 플랫폼" },
    { host: "japan.life.help", expectedDesc: "在韓外国人向け生活支援プラットフォーム" },
    { host: "china.life.help", expectedDesc: "面向在韩外国人的生活服务平台" },
    { host: "taiwan.life.help", expectedDesc: "專為在韓外籍居民打造的生活服務平臺" },
    { host: "tech.life.help", expectedDesc: "LIFE.HELP 공식 헬퍼를 위한 업무 포털" },
    { host: "chat.life.help", expectedDesc: "한국 생활의 모든 고민을 모국어로 전문 상담원과 1:1 실시간 상담하세요" },
    { host: "sys.life.help", expectedDesc: "LIFE.HELP 공식 본사 통합 관제 및 운영 관리 시스템" },
  ];

  let passed = 0;
  let failed = 0;

  for (const d of domains) {
    try {
      const res = await fetchUrl("/manifest.webmanifest", {
        "x-forwarded-host": d.host,
        host: d.host,
      });

      if (res.status !== 200) {
        console.error(`❌ [${d.host}] HTTP ${res.status}`);
        failed++;
        continue;
      }

      const manifest = JSON.parse(res.body);

      const hasExpectedDesc = manifest.description && manifest.description.includes(d.expectedDesc);
      const hasCorrectUrl = manifest.start_url && manifest.start_url.includes(d.host);
      const noParenInKorean = manifest.lang === "ko" ? !/[()]/.test(manifest.name) && !/[()]/.test(manifest.short_name) : true;

      if (hasExpectedDesc && hasCorrectUrl && noParenInKorean) {
        console.log(`✅ [${d.host}] Manifest OK:`);
        console.log(`   Name: ${manifest.name}`);
        console.log(`   Short: ${manifest.short_name}`);
        console.log(`   URL: ${manifest.start_url}`);
        console.log(`   Desc: ${manifest.description.slice(0, 50)}...`);
        passed++;
      } else {
        console.error(`❌ [${d.host}] Failed check:`);
        console.error(`   ExpectedDesc (${hasExpectedDesc}): ${d.expectedDesc}`);
        console.error(`   ActualDesc: ${manifest.description}`);
        console.error(`   ActualUrl (${hasCorrectUrl}): ${manifest.start_url}`);
        console.error(`   NoParen (${noParenInKorean}): ${manifest.name}`);
        failed++;
      }
    } catch (e) {
      console.error(`❌ [${d.host}] Error:`, e.message);
      failed++;
    }
  }

  console.log("\n=== 2. Testing /api/shortcut/download ===");
  try {
    const res = await fetchUrl("/api/shortcut/download?host=vietnam.life.help");
    if (res.status === 200 && res.body.includes("URL=https://vietnam.life.help/") && res.body.includes("Comment=Nền tảng dịch vụ sinh hoạt đa ngôn ngữ")) {
      console.log("✅ [vietnam.life.help] .url shortcut download OK:");
      console.log(res.body.trim());
      passed++;
    } else {
      console.error("❌ /api/shortcut/download failed:", res.body);
      failed++;
    }
  } catch (e) {
    console.error("❌ /api/shortcut/download error:", e.message);
    failed++;
  }

  try {
    const res = await fetchUrl("/api/shortcut/download?host=tech.life.help");
    if (res.status === 200 && res.body.includes("URL=https://tech.life.help/")) {
      console.log("✅ [tech.life.help] .url shortcut download OK");
      passed++;
    } else {
      console.error("❌ [tech.life.help] /api/shortcut/download failed:", res.body);
      failed++;
    }
  } catch (e) {
    console.error("❌ [tech.life.help] error:", e.message);
    failed++;
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

test();

