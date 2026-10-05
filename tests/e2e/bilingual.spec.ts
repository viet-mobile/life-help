import { test } from "@playwright/test";
import { defineBilingualTests, defineRealSpeechSmoke } from "./bilingual-flows";

/** Local production-build e2e of English + Korean listening (see ./bilingual-flows). */
defineBilingualTests(test, (p) => `http://english.localhost:3100${p}`);
defineRealSpeechSmoke(test, (p) => `http://english.localhost:3100${p}`);
