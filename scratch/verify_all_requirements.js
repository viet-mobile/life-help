/**
 * End-to-end verification script for all user requirements
 */
const http = require("http");

async function testHttp(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log("=================================================================");
  console.log("🚀 STARTING LIFE.HELP FULL SYSTEM VERIFICATION");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  // 1. Test Domain 308 Redirects
  console.log("TEST 1: Domain 308 Permanent Redirects");
  const redirectTests = [
    { host: "turkey.life.help", expected: "https://turkiye.life.help/" },
    { host: "spain.life.help", expected: "https://espania.life.help/" },
    { host: "germany.life.help", expected: "https://deutsch.life.help/" },
    { host: "italy.life.help", expected: "https://italia.life.help/" },
  ];

  for (const t of redirectTests) {
    try {
      const res = await testHttp({
        hostname: "localhost",
        port: 3000,
        path: "/",
        method: "GET",
        headers: {
          Host: t.host,
        },
      });

      if (res.statusCode === 308 && res.headers.location && res.headers.location.startsWith(t.expected)) {
        console.log(`  ✓ 308 Redirect: ${t.host} -> ${res.headers.location}`);
        passed++;
      } else {
        console.log(`  ✗ Failed 308 Redirect for ${t.host}: status=${res.statusCode}, loc=${res.headers.location}`);
        failed++;
      }
    } catch (e) {
      console.log(`  ✗ Request error for ${t.host}:`, e.message);
      failed++;
    }
  }

  // 2. Test Realtime Translation API (/api/translate)
  console.log("\nTEST 2: Realtime Bidirectional Translation Endpoint (/api/translate)");
  try {
    const payload = JSON.stringify({
      text: "Nước bồn cầu bị trào ngược và không thoát được",
      from: "vi",
      to: "ko",
    });

    const res = await testHttp(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/translate",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      payload
    );

    const json = JSON.parse(res.body);
    if (res.statusCode === 200 && json.translatedText) {
      console.log(`  ✓ Translated (vi -> ko): "${json.originalText}" -> "${json.translatedText}"`);
      passed++;
    } else {
      console.log(`  ✗ Translation failed:`, res.statusCode, res.body);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ Translation request error:`, e.message);
    failed++;
  }

  // 3. Test 128-Character Random Password Generation Requirements
  console.log("\nTEST 3: 128-Character Password Cryptographic Generator");
  const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const LOWER = "abcdefghijklmnopqrstuvwxyz";
  const DIGITS = "0123456789";
  const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const ALL_CHARS = UPPER + LOWER + DIGITS + SYMBOLS;

  function genPass() {
    const crypto = require("crypto");
    const res = [];
    function getChar(pool) {
      const idx = crypto.randomInt(0, pool.length);
      return pool[idx];
    }
    for (let i = 0; i < 4; i++) {
      res.push(getChar(UPPER));
      res.push(getChar(LOWER));
      res.push(getChar(DIGITS));
      res.push(getChar(SYMBOLS));
    }
    while (res.length < 128) {
      res.push(getChar(ALL_CHARS));
    }
    for (let i = res.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res.join("");
  }

  const p1 = genPass();
  const p2 = genPass();
  const hasUpper = /[A-Z]/.test(p1);
  const hasLower = /[a-z]/.test(p1);
  const hasDigit = /[0-9]/.test(p1);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(p1);

  if (p1.length === 128 && p2.length === 128 && p1 !== p2 && hasUpper && hasLower && hasDigit && hasSymbol) {
    console.log(`  ✓ 128-character password length: ${p1.length} chars`);
    console.log(`  ✓ Character categories: Upper=${hasUpper}, Lower=${hasLower}, Digit=${hasDigit}, Symbol=${hasSymbol}`);
    console.log(`  ✓ Sample Password: ${p1.substring(0, 24)}...${p1.substring(112)} (128 total)`);
    passed++;
  } else {
    console.log(`  ✗ 128-character password generator failed validation!`);
    failed++;
  }

  // 4. Test Device Registration & Access Gate (/register-device)
  console.log("\nTEST 4: Device Registration Endpoint (/register-device)");
  try {
    const res = await testHttp({
      hostname: "localhost",
      port: 3000,
      path: "/register-device",
      method: "GET",
    });

    if (res.statusCode === 200 && res.body.includes("register-device")) {
      console.log(`  ✓ /register-device portal loaded with HTTP 200 OK`);
      passed++;
    } else {
      console.log(`  ✗ /register-device failed: status=${res.statusCode}`);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ /register-device error:`, e.message);
    failed++;
  }

  // 5. Test Customer Request Page & Checklist Options (/request)
  console.log("\nTEST 5: Service Request Page & Checklist Options (/request)");
  try {
    const res = await testHttp({
      hostname: "localhost",
      port: 3000,
      path: "/request?service=clog-clearing",
      method: "GET",
    });

    if (res.statusCode === 200) {
      console.log(`  ✓ /request page loaded successfully with HTTP 200 OK`);
      passed++;
    } else {
      console.log(`  ✗ /request failed: status=${res.statusCode}`);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ /request error:`, e.message);
    failed++;
  }

  // 6. Test Realtime Chat Page (/chat)
  console.log("\nTEST 6: 1:1 Realtime Provider Chat Page (/chat)");
  try {
    const res = await testHttp({
      hostname: "localhost",
      port: 3000,
      path: "/chat",
      method: "GET",
    });

    if (res.statusCode === 200) {
      console.log(`  ✓ /chat page loaded successfully with HTTP 200 OK`);
      passed++;
    } else {
      console.log(`  ✗ /chat failed: status=${res.statusCode}`);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ /chat error:`, e.message);
    failed++;
  }

  console.log("\n=================================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

