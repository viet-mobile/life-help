import { test } from "@playwright/test";
import { url } from "./helpers";
import { defineBilingualTests, defineRealSpeechSmoke } from "../e2e/bilingual-flows";

/** Focused STAGING smoke of English + Korean listening on the deployed learning-only port (see ../e2e/bilingual-flows). */
defineBilingualTests(test, (p) => url("english", p));
defineRealSpeechSmoke(test, (p) => url("english", p));
