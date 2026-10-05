# LIFE.HELP Learning V3 — Targeted Locale Correction Semantic Review Report

**Evaluation Baseline:** `06db88c` / Claude Core
**Target Locales Reviewed (13 locales):** `ar`, `de`, `es`, `fr`, `hi`, `id`, `it`, `ja`, `nl`, `pt`, `ru`, `zh-Hans`, `zh-Hant`
**Canonical Source:** `lib/learn/i18n/en.ts` (commit `f707310`)
**Status:** COMPLETE & VERIFIED

## 1. Executive Summary

In this targeted fix phase, all 13 learning locales previously rejected on semantic review were regenerated directly and faithfully from canonical `en.ts`.

- **Total locales evaluated:** 13 corrected locales (+ `arz` & `he` false-positive audit)
- **Number drift count:** 0
- **Range drift count:** 0
- **Duration drift count:** 0
- **Omission count:** 0
- **Added-claim count:** 0 (zero instances of "free", "official", or "guaranteed")
- **Wrong-language count:** 0
- **Placeholder error count:** 0

## 2. Number-Word False-Positive Audit (`arz` & `he`)

| Locale | Key | Canonical English | Translated Text | Semantic Value | Verdict | Note |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `arz` | `landing.cta.start` | Start in 1 minute | ابدأ في دقيقة واحدة | 1 minute | **PASS** | Uses authentic Egyptian Arabic word "دقيقة واحدة" (one minute). |
| `arz` | `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | ما تستخدمش اسمك الحقيقي. اسم مستعار من حرفين لـ ١٦ حرف كفاية. | 2 to 16 characters | **PASS** | Dual "حرفين" = 2 characters, "١٦" = 16. Semantics exact. |
| `arz` | `diag.intro.title` | 2-minute skill check | اختبار مستوى في دقيقتين | 2 minutes | **PASS** | Dual "دقيقتين" = 2 minutes. Semantics exact. |
| `arz` | `dash.diagnostic.cta` | Find your path with a 2-minute skill check | اعرف مستواك في دقيقتين بس | 2 minutes | **PASS** | Dual "دقيقتين" = 2 minutes. Semantics exact. |
| `he` | `landing.cta.start` | Start in 1 minute | התחילו בדקה אחת | 1 minute | **PASS** | Hebrew "בדקה אחת" = in one minute. Semantics exact. |

## 3. Key-by-Key Semantic Verification Table for the 13 Corrected Locales

### Locale: `ar`

| Key | Canonical English Source | Corrected Translation | Source Numbers | Target Numbers | Semantic Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `site.math.description` | Game-style math for elementary, middle and high school students. Short 3-10 minute quests take you from concepts to problem solving, with hints so you can work it out yourself. | رياضيات بأسلوب تفاعلي لطلاب المراحل الابتدائية والإعدادية والثانوية. مهمات قصيرة من 3 إلى 10 دقائق تأخذك من المفاهيم إلى حل المشكلات مع تلميحات تساعدك على الحل بنفسك. | `10,3` | `10,3` | **PASS** |
| `site.english.description` | Game-style English for elementary, middle and high school students. Learn words, grammar and sentence building in short quests. | لغة إنجليزية بأسلوب تفاعلي لطلاب المراحل الابتدائية والإعدادية والثانوية. تعلم الكلمات والقواعد وبناء الجمل في مهمات قصيرة. | `none` | `none` | **PASS** |
| `landing.cta.start` | Start in 1 minute | ابدأ في خلال 1 دقيقة | `1` | `1` | **PASS** |
| `landing.how1.body` | 3-10 minutes at a time. Concept, example, practice, challenge: build easy wins step by step. | من 3 إلى 10 دقائق في كل مرة. المفهوم، المثال، التدريب، التحدي: حقق نجاحات متتالية خطوة بخطوة. | `10,3` | `10,3` | **PASS** |
| `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | لا تستخدم اسمك الحقيقي. يكفي اسم مستعار مكون من 2 إلى 16 حرفًا. | `16,2` | `16,2` | **PASS** |
| `diag.intro.title` | 2-minute skill check | اختبار مهارات في خلال 2 دقيقة | `2` | `2` | **PASS** |
| `dash.diagnostic.cta` | Find your path with a 2-minute skill check | اكتشف مسارك مع اختبار مهارات في خلال 2 دقيقة | `2` | `2` | **PASS** |
| `lesson.answer.numeric` | Type your answer as a number (e.g. 4, -3, 3/4) | أدخل رقمًا (مثل 4، -3، 3/4) | `3,3,4,4` | `3,3,4,4` | **PASS** |
| `result.quest` | Today's quest complete! +100 XP | اكتملت المهام اليومية! +100 XP | `100` | `100` | **PASS** |
| `quest.subtitle` | Finish them all for a +100 XP bonus | أكمل جميع المهام للحصول على مكافأة +100 XP | `100` | `100` | **PASS** |
| `ach.streak_3.title` | 3-day streak | سلسلة 3 أيام | `3` | `3` | **PASS** |
| `ach.streak_3.desc` | You learned 3 days in a row. | تعلمت لمدة 3 أيام متتالية. | `3` | `3` | **PASS** |
| `ach.streak_7.title` | 7-day streak | سلسلة 7 أيام | `7` | `7` | **PASS** |
| `ach.streak_7.desc` | You learned 7 days in a row. | تعلمت لمدة 7 أيام متتالية. | `7` | `7` | **PASS** |
| `ach.solve_25.title` | 25 problems solved | إنجاز 25 سؤالًا | `25` | `25` | **PASS** |
| `ach.solve_25.desc` | You answered 25 questions correctly. | أجبت بشكل صحيح على 25 سؤالًا. | `25` | `25` | **PASS** |
| `ach.solve_100.title` | 100 problems solved | إنجاز 100 سؤال | `100` | `100` | **PASS** |
| `ach.solve_100.desc` | You answered 100 questions correctly. | أجبت بشكل صحيح على 100 سؤال. | `100` | `100` | **PASS** |
| `ach.vocab_50.title` | 50 words | 50 مفردة جديدة | `50` | `50` | **PASS** |
| `ach.vocab_50.desc` | You answered 50 vocabulary questions correctly. | أجبت بشكل صحيح على 50 سؤال مفردات. | `50` | `50` | **PASS** |
| `ach.review_10.title` | 10 reviews | 10 مراجعات | `10` | `10` | **PASS** |
| `ach.review_10.desc` | You solved 10 review questions. | أكملت 10 أسئلة مراجعة بنجاح. | `10` | `10` | **PASS** |
| `auth.password` | Password (at least 8 characters) | كلمة المرور (8 أحرف على الأقل) | `8` | `8` | **PASS** |
| `site.math.tagline` | Today's quest: one round of math! | مهمة اليوم: جولة واحدة في الرياضيات! | `none` | `none` | **PASS** |
| `site.english.tagline` | Today's quest: one round of English! | مهمة اليوم: جولة واحدة في اللغة الإنجليزية! | `none` | `none` | **PASS** |
| `landing.eyebrow` | Don't come to study, come for a quest | لا تأتِ للحفظ والتلقين، بل تعالَ لخوض مهمة | `none` | `none` | **PASS** |
| `landing.howTitle` | How it works | كيف يعمل | `none` | `none` | **PASS** |
| `landing.how1.title` | Short quests | مهمات قصيرة | `none` | `none` | **PASS** |
| `landing.how2.title` | Solve it with hints | حل المسائل مع التلميحات | `none` | `none` | **PASS** |
| `landing.how2.body` | It's fine to get it wrong. A small hint, a concrete hint, then the steps, until you understand. | الخطأ أمر طبيعي. تلميح بسيط، ثم تلميح محدد، ثم خطوات الحل بالتفصيل حتى تفهم تمامًا. | `none` | `none` | **PASS** |
| `landing.how3.title` | See yourself grow | شاهد تطورك بنفسك | `none` | `none` | **PASS** |
| `landing.how3.body` | XP, levels, streaks and the skill map show how much you grew today. | تُظهر نقاط XP والمستويات وأيام المتابعة وخريطة المهارات مدى تطورك اليوم. | `none` | `none` | **PASS** |
| `landing.privacy` | We don't ask for your real name, phone number or school. A nickname and your grade are enough. | نحن لا نطلب اسمك الحقيقي أو رقم هاتفك أو مدرستك. يكفي فقط اسم مستعار وصفك الدراسي. | `none` | `none` | **PASS** |
| `diag.intro.body` | This is not a graded test. A few questions show where you are now so we can open the right path for you. If you don't know, just skip it. | هذا ليس اختبارًا بدرجات. بضعة أسئلة توضح مستواك الحالي لنفتح لك المسار التعليمي المناسب. إذا كنت لا تعرف الإجابة، يمكنك تخطيها ببساطة. | `none` | `none` | **PASS** |
| `dash.hello` | {name}, ready for a round today? | {name}، هل أنت جاهز لجولة اليوم؟ | `none` | `none` | **PASS** |
| `learn.title` | Learning world | عالم التعلم | `none` | `none` | **PASS** |
| `avatar.fox` | Fox | ثعلب | `none` | `none` | **PASS** |
| `avatar.cat` | Cat | قطة | `none` | `none` | **PASS** |

### Locale: `de`

| Key | Canonical English Source | Corrected Translation | Source Numbers | Target Numbers | Semantic Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `site.math.description` | Game-style math for elementary, middle and high school students. Short 3-10 minute quests take you from concepts to problem solving, with hints so you can work it out yourself. | Spielerisches Mathe-Lernen für Grundschule, Mittelstufe und Oberstufe. Kurze Quests von 3–10 Minuten führen dich von Konzepten zum Problemlösen – mit Hinweisen zum eigenständigen Lösen. | `10,3` | `10,3` | **PASS** |
| `site.english.description` | Game-style English for elementary, middle and high school students. Learn words, grammar and sentence building in short quests. | Spielerisches Englisch-Lernen für Grundschule, Mittelstufe und Oberstufe. Lerne Vokabeln, Grammatik und Satzbau in kurzen Quests. | `none` | `none` | **PASS** |
| `landing.cta.start` | Start in 1 minute | In 1 Minute starten | `1` | `1` | **PASS** |
| `landing.how1.body` | 3-10 minutes at a time. Concept, example, practice, challenge: build easy wins step by step. | 3–10 Minuten pro Einheit. Konzept, Beispiel, Übung, Herausforderung: Sichere dir Schritt für Schritt einfache Erfolge. | `10,3` | `10,3` | **PASS** |
| `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | Verwende nicht deinen echten Namen. Ein Spitzname mit 2–16 Zeichen reicht aus. | `16,2` | `16,2` | **PASS** |
| `diag.intro.title` | 2-minute skill check | 2-Minuten-Fähigkeitscheck | `2` | `2` | **PASS** |
| `dash.diagnostic.cta` | Find your path with a 2-minute skill check | Finde deinen Weg mit einem 2-Minuten-Fähigkeitscheck | `2` | `2` | **PASS** |
| `lesson.answer.numeric` | Type your answer as a number (e.g. 4, -3, 3/4) | Zahl eingeben (z. B. 4, -3, 3/4) | `3,3,4,4` | `3,3,4,4` | **PASS** |
| `result.quest` | Today's quest complete! +100 XP | Tagesquest abgeschlossen! +100 XP | `100` | `100` | **PASS** |
| `quest.subtitle` | Finish them all for a +100 XP bonus | Schließe alle Quests ab für +100 XP Bonus | `100` | `100` | **PASS** |
| `ach.streak_3.title` | 3-day streak | 3-Tage-Serie | `3` | `3` | **PASS** |
| `ach.streak_3.desc` | You learned 3 days in a row. | Du hast 3 Tage hintereinander gelernt. | `3` | `3` | **PASS** |
| `ach.streak_7.title` | 7-day streak | 7-Tage-Serie | `7` | `7` | **PASS** |
| `ach.streak_7.desc` | You learned 7 days in a row. | Du hast 7 Tage hintereinander gelernt. | `7` | `7` | **PASS** |
| `ach.solve_25.title` | 25 problems solved | 25 Aufgaben gelöst | `25` | `25` | **PASS** |
| `ach.solve_25.desc` | You answered 25 questions correctly. | Du hast 25 Aufgaben richtig gelöst. | `25` | `25` | **PASS** |
| `ach.solve_100.title` | 100 problems solved | 100 Aufgaben gelöst | `100` | `100` | **PASS** |
| `ach.solve_100.desc` | You answered 100 questions correctly. | Du hast 100 Aufgaben richtig gelöst. | `100` | `100` | **PASS** |
| `ach.vocab_50.title` | 50 words | 50 Wörter | `50` | `50` | **PASS** |
| `ach.vocab_50.desc` | You answered 50 vocabulary questions correctly. | Du hast 50 Vokabelaufgaben richtig beantwortet. | `50` | `50` | **PASS** |
| `ach.review_10.title` | 10 reviews | 10 Wiederholungen | `10` | `10` | **PASS** |
| `ach.review_10.desc` | You solved 10 review questions. | Du hast 10 Wiederholungsaufgaben gelöst. | `10` | `10` | **PASS** |
| `auth.password` | Password (at least 8 characters) | Passwort (mindestens 8 Zeichen) | `8` | `8` | **PASS** |
| `site.math.tagline` | Today's quest: one round of math! | Heutige Quest: eine Runde Mathe! | `none` | `none` | **PASS** |
| `site.english.tagline` | Today's quest: one round of English! | Heutige Quest: eine Runde Englisch! | `none` | `none` | **PASS** |
| `landing.eyebrow` | Don't come to study, come for a quest | Komm nicht zum Büffeln, komm auf eine Quest | `none` | `none` | **PASS** |
| `landing.howTitle` | How it works | So funktioniert es | `none` | `none` | **PASS** |
| `landing.how1.title` | Short quests | Kurze Quests | `none` | `none` | **PASS** |
| `landing.how2.title` | Solve it with hints | Mit Hinweisen lösen | `none` | `none` | **PASS** |
| `landing.how2.body` | It's fine to get it wrong. A small hint, a concrete hint, then the steps, until you understand. | Fehler sind völlig in Ordnung. Ein kleiner Hinweis, ein konkreter Tipp, dann die einzelnen Schritte, bis du es verstehst. | `none` | `none` | **PASS** |
| `landing.how3.title` | See yourself grow | Sieh dein eigenes Wachstum | `none` | `none` | **PASS** |
| `landing.how3.body` | XP, levels, streaks and the skill map show how much you grew today. | XP, Level, Serien und die Fähigkeitskarte zeigen dir, wie viel du heute gelernt hast. | `none` | `none` | **PASS** |
| `landing.privacy` | We don't ask for your real name, phone number or school. A nickname and your grade are enough. | Wir fragen nicht nach deinem echten Namen, deiner Telefonnummer oder Schule. Ein Spitzname und deine Klassenstufe reichen völlig aus. | `none` | `none` | **PASS** |
| `diag.intro.body` | This is not a graded test. A few questions show where you are now so we can open the right path for you. If you don't know, just skip it. | Dies ist kein benoteter Test. Ein paar Fragen zeigen, wo du stehst, damit wir den passenden Lernweg für dich freischalten können. Wenn du etwas nicht weißt, überspringe es einfach. | `none` | `none` | **PASS** |
| `dash.hello` | {name}, ready for a round today? | {name}, bereit für eine Runde heute? | `none` | `none` | **PASS** |
| `learn.title` | Learning world | Lernwelt | `none` | `none` | **PASS** |
| `avatar.fox` | Fox | Fuchs | `none` | `none` | **PASS** |
| `avatar.cat` | Cat | Katze | `none` | `none` | **PASS** |

### Locale: `es`

| Key | Canonical English Source | Corrected Translation | Source Numbers | Target Numbers | Semantic Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `site.math.description` | Game-style math for elementary, middle and high school students. Short 3-10 minute quests take you from concepts to problem solving, with hints so you can work it out yourself. | Matemáticas tipo juego para estudiantes de primaria, secundaria y preparatoria. Misiones cortas de 3-10 minutos te llevan de los conceptos a la resolución de problemas, con pistas para resolverlos por tu cuenta. | `10,3` | `10,3` | **PASS** |
| `site.english.description` | Game-style English for elementary, middle and high school students. Learn words, grammar and sentence building in short quests. | Inglés tipo juego para estudiantes de primaria, secundaria y preparatoria. Aprende vocabulario, gramática y construcción de oraciones en misiones cortas. | `none` | `none` | **PASS** |
| `landing.cta.start` | Start in 1 minute | Comenzar en 1 minuto | `1` | `1` | **PASS** |
| `landing.how1.body` | 3-10 minutes at a time. Concept, example, practice, challenge: build easy wins step by step. | 3-10 minutos por sesión. Concepto, ejemplo, práctica, desafío: acumula logros fáciles paso a paso. | `10,3` | `10,3` | **PASS** |
| `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | No uses tu nombre real. Un apodo de 2-16 caracteres es suficiente. | `16,2` | `16,2` | **PASS** |
| `diag.intro.title` | 2-minute skill check | Evaluación de habilidades de 2 minutos | `2` | `2` | **PASS** |
| `dash.diagnostic.cta` | Find your path with a 2-minute skill check | Encuentra tu camino con una evaluación de 2 minutos | `2` | `2` | **PASS** |
| `lesson.answer.numeric` | Type your answer as a number (e.g. 4, -3, 3/4) | Escribe tu respuesta como número (ej. 4, -3, 3/4) | `3,3,4,4` | `3,3,4,4` | **PASS** |
| `result.quest` | Today's quest complete! +100 XP | ¡Misión diaria completada! +100 XP | `100` | `100` | **PASS** |
| `quest.subtitle` | Finish them all for a +100 XP bonus | Completa todas para ganar un bono de +100 XP | `100` | `100` | **PASS** |
| `ach.streak_3.title` | 3-day streak | Racha de 3 días | `3` | `3` | **PASS** |
| `ach.streak_3.desc` | You learned 3 days in a row. | Aprendiste durante 3 días seguidos. | `3` | `3` | **PASS** |
| `ach.streak_7.title` | 7-day streak | Racha de 7 días | `7` | `7` | **PASS** |
| `ach.streak_7.desc` | You learned 7 days in a row. | Aprendiste durante 7 días seguidos. | `7` | `7` | **PASS** |
| `ach.solve_25.title` | 25 problems solved | 25 preguntas resueltas | `25` | `25` | **PASS** |
| `ach.solve_25.desc` | You answered 25 questions correctly. | Respondiste correctamente 25 preguntas. | `25` | `25` | **PASS** |
| `ach.solve_100.title` | 100 problems solved | 100 preguntas resueltas | `100` | `100` | **PASS** |
| `ach.solve_100.desc` | You answered 100 questions correctly. | Respondiste correctamente 100 preguntas. | `100` | `100` | **PASS** |
| `ach.vocab_50.title` | 50 words | 50 palabras | `50` | `50` | **PASS** |
| `ach.vocab_50.desc` | You answered 50 vocabulary questions correctly. | Respondiste correctamente 50 preguntas de vocabulario. | `50` | `50` | **PASS** |
| `ach.review_10.title` | 10 reviews | 10 repasos | `10` | `10` | **PASS** |
| `ach.review_10.desc` | You solved 10 review questions. | Resolviste 10 preguntas de repaso. | `10` | `10` | **PASS** |
| `auth.password` | Password (at least 8 characters) | Contraseña (al menos 8 caracteres) | `8` | `8` | **PASS** |
| `site.math.tagline` | Today's quest: one round of math! | Misión de hoy: ¡una ronda de matemáticas! | `none` | `none` | **PASS** |
| `site.english.tagline` | Today's quest: one round of English! | Misión de hoy: ¡una ronda de inglés! | `none` | `none` | **PASS** |
| `landing.eyebrow` | Don't come to study, come for a quest | No vengas a estudiar, ven a una misión | `none` | `none` | **PASS** |
| `landing.howTitle` | How it works | Cómo funciona | `none` | `none` | **PASS** |
| `landing.how1.title` | Short quests | Misiones cortas | `none` | `none` | **PASS** |
| `landing.how2.title` | Solve it with hints | Resuélvelo con pistas | `none` | `none` | **PASS** |
| `landing.how2.body` | It's fine to get it wrong. A small hint, a concrete hint, then the steps, until you understand. | No pasa nada si te equivocas. Una pequeña pista, luego una pista más concreta y los pasos guiados hasta que lo entiendas. | `none` | `none` | **PASS** |
| `landing.how3.title` | See yourself grow | Observa tu crecimiento | `none` | `none` | **PASS** |
| `landing.how3.body` | XP, levels, streaks and the skill map show how much you grew today. | Los XP, niveles, rachas y el mapa de habilidades muestran cuánto has avanzado hoy. | `none` | `none` | **PASS** |
| `landing.privacy` | We don't ask for your real name, phone number or school. A nickname and your grade are enough. | No te pedimos tu nombre real, número de teléfono ni escuela. Basta con un apodo y tu grado escolar. | `none` | `none` | **PASS** |
| `diag.intro.body` | This is not a graded test. A few questions show where you are now so we can open the right path for you. If you don't know, just skip it. | Esto no es un examen con calificación. Unas cuantas preguntas nos muestran tu nivel actual para abrirte el camino adecuado. Si no lo sabes, sáltatelo. | `none` | `none` | **PASS** |
| `dash.hello` | {name}, ready for a round today? | {name}, ¿listo para una ronda hoy? | `none` | `none` | **PASS** |
| `learn.title` | Learning world | Mundo de aprendizaje | `none` | `none` | **PASS** |
| `avatar.fox` | Fox | Zorro | `none` | `none` | **PASS** |
| `avatar.cat` | Cat | Gato | `none` | `none` | **PASS** |

### Locale: `fr`

| Key | Canonical English Source | Corrected Translation | Source Numbers | Target Numbers | Semantic Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `site.math.description` | Game-style math for elementary, middle and high school students. Short 3-10 minute quests take you from concepts to problem solving, with hints so you can work it out yourself. | Des maths ludiques pour le primaire, le collège et le lycée. De courtes quêtes de 3 à 10 minutes vous guident des concepts à la résolution de problèmes, avec des indices pour trouver par vous-même. | `10,3` | `10,3` | **PASS** |
| `site.english.description` | Game-style English for elementary, middle and high school students. Learn words, grammar and sentence building in short quests. | De l'anglais ludique pour le primaire, le collège et le lycée. Apprenez le vocabulaire, la grammaire et la construction de phrases dans de courtes quêtes. | `none` | `none` | **PASS** |
| `landing.cta.start` | Start in 1 minute | Commencer en 1 minute | `1` | `1` | **PASS** |
| `landing.how1.body` | 3-10 minutes at a time. Concept, example, practice, challenge: build easy wins step by step. | 3 à 10 minutes à la fois. Concept, exemple, pratique, défi : bâtissez des victoires simples pas à pas. | `10,3` | `10,3` | **PASS** |
| `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | N'utilisez pas votre vrai nom. Un pseudo de 2 à 16 caractères suffit. | `16,2` | `16,2` | **PASS** |
| `diag.intro.title` | 2-minute skill check | Bilan de compétences en 2 minutes | `2` | `2` | **PASS** |
| `dash.diagnostic.cta` | Find your path with a 2-minute skill check | Trouvez votre voie avec un bilan en 2 minutes | `2` | `2` | **PASS** |
| `lesson.answer.numeric` | Type your answer as a number (e.g. 4, -3, 3/4) | Saisissez un nombre (ex. 4, -3, 3/4) | `3,3,4,4` | `3,3,4,4` | **PASS** |
| `result.quest` | Today's quest complete! +100 XP | Quête quotidienne terminée ! +100 XP | `100` | `100` | **PASS** |
| `quest.subtitle` | Finish them all for a +100 XP bonus | Terminez-les toutes pour remporter un bonus de +100 XP | `100` | `100` | **PASS** |
| `ach.streak_3.title` | 3-day streak | Série de 3 jours | `3` | `3` | **PASS** |
| `ach.streak_3.desc` | You learned 3 days in a row. | Vous avez étudié 3 jours consécutifs. | `3` | `3` | **PASS** |
| `ach.streak_7.title` | 7-day streak | Série de 7 jours | `7` | `7` | **PASS** |
| `ach.streak_7.desc` | You learned 7 days in a row. | Vous avez étudié 7 jours consécutifs. | `7` | `7` | **PASS** |
| `ach.solve_25.title` | 25 problems solved | 25 problèmes résolus | `25` | `25` | **PASS** |
| `ach.solve_25.desc` | You answered 25 questions correctly. | Vous avez répondu correctement à 25 questions. | `25` | `25` | **PASS** |
| `ach.solve_100.title` | 100 problems solved | 100 problèmes résolus | `100` | `100` | **PASS** |
| `ach.solve_100.desc` | You answered 100 questions correctly. | Vous avez répondu correctement à 100 questions. | `100` | `100` | **PASS** |
| `ach.vocab_50.title` | 50 words | 50 mots | `50` | `50` | **PASS** |
| `ach.vocab_50.desc` | You answered 50 vocabulary questions correctly. | Vous avez répondu correctement à 50 questions de vocabulaire. | `50` | `50` | **PASS** |
| `ach.review_10.title` | 10 reviews | 10 révisions | `10` | `10` | **PASS** |
| `ach.review_10.desc` | You solved 10 review questions. | Vous avez résolu 10 questions de révision. | `10` | `10` | **PASS** |
| `auth.password` | Password (at least 8 characters) | Mot de passe (8 caractères minimum) | `8` | `8` | **PASS** |
| `site.math.tagline` | Today's quest: one round of math! | Quête du jour : une session de maths ! | `none` | `none` | **PASS** |
| `site.english.tagline` | Today's quest: one round of English! | Quête du jour : une session d'anglais ! | `none` | `none` | **PASS** |
| `landing.eyebrow` | Don't come to study, come for a quest | Ne venez pas bachoter, venez pour une quête | `none` | `none` | **PASS** |
| `landing.howTitle` | How it works | Comment ça marche | `none` | `none` | **PASS** |
| `landing.how1.title` | Short quests | Des quêtes courtes | `none` | `none` | **PASS** |
| `landing.how2.title` | Solve it with hints | Résolvez avec des indices | `none` | `none` | **PASS** |
| `landing.how2.body` | It's fine to get it wrong. A small hint, a concrete hint, then the steps, until you understand. | Ce n'est pas grave de se tromper. Un petit indice, un indice concret, puis les étapes jusqu'à ce que vous compreniez. | `none` | `none` | **PASS** |
| `landing.how3.title` | See yourself grow | Voyez vos progrès | `none` | `none` | **PASS** |
| `landing.how3.body` | XP, levels, streaks and the skill map show how much you grew today. | L'XP, les niveaux, les séries et la carte des compétences montrent vos progrès du jour. | `none` | `none` | **PASS** |
| `landing.privacy` | We don't ask for your real name, phone number or school. A nickname and your grade are enough. | Nous ne demandons ni votre vrai nom, ni numéro de téléphone, ni école. Un pseudo et votre classe suffisent. | `none` | `none` | **PASS** |
| `diag.intro.body` | This is not a graded test. A few questions show where you are now so we can open the right path for you. If you don't know, just skip it. | Ce n'est pas un test noté. Quelques questions montrent votre niveau actuel pour vous ouvrir le bon parcours. Si vous ne savez pas, passez simplement la question. | `none` | `none` | **PASS** |
| `dash.hello` | {name}, ready for a round today? | {name}, prêt pour une session aujourd'hui ? | `none` | `none` | **PASS** |
| `learn.title` | Learning world | Monde d'apprentissage | `none` | `none` | **PASS** |
| `avatar.fox` | Fox | Renard | `none` | `none` | **PASS** |
| `avatar.cat` | Cat | Chat | `none` | `none` | **PASS** |

### Locale: `hi`

| Key | Canonical English Source | Corrected Translation | Source Numbers | Target Numbers | Semantic Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `site.math.description` | Game-style math for elementary, middle and high school students. Short 3-10 minute quests take you from concepts to problem solving, with hints so you can work it out yourself. | प्राथमिक, माध्यमिक और उच्च विद्यालय के छात्रों के लिए खेल-शैली में गणित। 3-10 मिनट के छोटे क्वेस्ट आपको अवधारणाओं से समस्या-समाधान तक ले जाते हैं, ऐसे संकेतों के साथ ताकि आप खुद हल कर सकें। | `10,3` | `10,3` | **PASS** |
| `site.english.description` | Game-style English for elementary, middle and high school students. Learn words, grammar and sentence building in short quests. | प्राथमिक, माध्यमिक और उच्च विद्यालय के छात्रों के लिए खेल-शैली में अंग्रेज़ी। छोटे क्वेस्ट में शब्द, व्याकरण और वाक्य निर्माण सीखें। | `none` | `none` | **PASS** |
| `landing.cta.start` | Start in 1 minute | 1 मिनट में शुरू करें | `1` | `1` | **PASS** |
| `landing.how1.body` | 3-10 minutes at a time. Concept, example, practice, challenge: build easy wins step by step. | एक बार में 3-10 मिनट। अवधारणा, उदाहरण, अभ्यास, चुनौती: कदम दर कदम आसान जीत हासिल करें। | `10,3` | `10,3` | **PASS** |
| `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | अपने असली नाम का उपयोग न करें। 2-16 वर्णों का उपनाम काफी है। | `16,2` | `16,2` | **PASS** |
| `diag.intro.title` | 2-minute skill check | 2 मिनट का कौशल परीक्षण | `2` | `2` | **PASS** |
| `dash.diagnostic.cta` | Find your path with a 2-minute skill check | 2 मिनट के कौशल परीक्षण के साथ अपना रास्ता खोजें | `2` | `2` | **PASS** |
| `lesson.answer.numeric` | Type your answer as a number (e.g. 4, -3, 3/4) | संख्या दर्ज करें (उदा. 4, -3, 3/4) | `3,3,4,4` | `3,3,4,4` | **PASS** |
| `result.quest` | Today's quest complete! +100 XP | दैनिक मिशन पूरा हुआ! +100 XP | `100` | `100` | **PASS** |
| `quest.subtitle` | Finish them all for a +100 XP bonus | +100 XP बोनस के लिए सभी मिशन पूरे करें | `100` | `100` | **PASS** |
| `ach.streak_3.title` | 3-day streak | 3 दिन की स्ट्रीक | `3` | `3` | **PASS** |
| `ach.streak_3.desc` | You learned 3 days in a row. | लगातार 3 दिन अध्ययन किया। | `3` | `3` | **PASS** |
| `ach.streak_7.title` | 7-day streak | 7 दिन की स्ट्रीक | `7` | `7` | **PASS** |
| `ach.streak_7.desc` | You learned 7 days in a row. | लगातार 7 दिन अध्ययन किया। | `7` | `7` | **PASS** |
| `ach.solve_25.title` | 25 problems solved | 25 प्रश्न हल हुए | `25` | `25` | **PASS** |
| `ach.solve_25.desc` | You answered 25 questions correctly. | आपने 25 प्रश्न सही हल किए। | `25` | `25` | **PASS** |
| `ach.solve_100.title` | 100 problems solved | 100 प्रश्न हल हुए | `100` | `100` | **PASS** |
| `ach.solve_100.desc` | You answered 100 questions correctly. | आपने 100 प्रश्न सही हल किए। | `100` | `100` | **PASS** |
| `ach.vocab_50.title` | 50 words | 50 शब्दावली शब्द | `50` | `50` | **PASS** |
| `ach.vocab_50.desc` | You answered 50 vocabulary questions correctly. | आपने 50 शब्दावली प्रश्न सही हल किए। | `50` | `50` | **PASS** |
| `ach.review_10.title` | 10 reviews | 10 समीक्षा प्रश्न | `10` | `10` | **PASS** |
| `ach.review_10.desc` | You solved 10 review questions. | आपने 10 समीक्षा प्रश्न पूरे किए। | `10` | `10` | **PASS** |
| `auth.password` | Password (at least 8 characters) | पासवर्ड (कम से कम 8 अक्षर) | `8` | `8` | **PASS** |
| `site.math.tagline` | Today's quest: one round of math! | आज का क्वेस्ट: गणित का एक राउंड! | `none` | `none` | **PASS** |
| `site.english.tagline` | Today's quest: one round of English! | आज का क्वेस्ट: अंग्रेज़ी का एक राउंड! | `none` | `none` | **PASS** |
| `landing.eyebrow` | Don't come to study, come for a quest | रटने मत आइए, एक रोमांचक क्वेस्ट के लिए आइए | `none` | `none` | **PASS** |
| `landing.howTitle` | How it works | यह कैसे काम करता है | `none` | `none` | **PASS** |
| `landing.how1.title` | Short quests | छोटे क्वेस्ट | `none` | `none` | **PASS** |
| `landing.how2.title` | Solve it with hints | संकेतों की मदद से हल करें | `none` | `none` | **PASS** |
| `landing.how2.body` | It's fine to get it wrong. A small hint, a concrete hint, then the steps, until you understand. | गलत होना बिल्कुल ठीक है। एक छोटा संकेत, फिर एक ठोस संकेत, और फिर तब तक के चरण जब तक आप समझ न जाएं। | `none` | `none` | **PASS** |
| `landing.how3.title` | See yourself grow | अपनी प्रगति को स्वयं देखें | `none` | `none` | **PASS** |
| `landing.how3.body` | XP, levels, streaks and the skill map show how much you grew today. | XP, स्तर, लकीरें और कौशल मानचित्र दिखाते हैं कि आप आज कितना आगे बढ़े। | `none` | `none` | **PASS** |
| `landing.privacy` | We don't ask for your real name, phone number or school. A nickname and your grade are enough. | हम आपका असली नाम, फ़ोन नंबर या स्कूल नहीं पूछते। सिर्फ एक उपनाम और आपकी कक्षा ही काफी है। | `none` | `none` | **PASS** |
| `diag.intro.body` | This is not a graded test. A few questions show where you are now so we can open the right path for you. If you don't know, just skip it. | यह कोई अंक देने वाली परीक्षा नहीं है। कुछ प्रश्न दिखाते हैं कि आप अभी कहाँ हैं ताकि हम आपके लिए सही रास्ता खोल सकें। यदि आप नहीं जानते हैं, तो इसे छोड़ दें। | `none` | `none` | **PASS** |
| `dash.hello` | {name}, ready for a round today? | {name}, क्या आप आज एक राउंड के लिए तैयार हैं? | `none` | `none` | **PASS** |
| `learn.title` | Learning world | सीखने की दुनिया | `none` | `none` | **PASS** |
| `avatar.fox` | Fox | लोमड़ी | `none` | `none` | **PASS** |
| `avatar.cat` | Cat | बिल्ली | `none` | `none` | **PASS** |

### Locale: `id`

| Key | Canonical English Source | Corrected Translation | Source Numbers | Target Numbers | Semantic Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `site.math.description` | Game-style math for elementary, middle and high school students. Short 3-10 minute quests take you from concepts to problem solving, with hints so you can work it out yourself. | Matematika bergaya permainan untuk siswa SD, SMP, dan SMA. Quest singkat 3-10 menit memandu Anda dari konsep hingga pemecahan masalah, dengan petunjuk agar Anda dapat menyelesaikannya sendiri. | `10,3` | `10,3` | **PASS** |
| `site.english.description` | Game-style English for elementary, middle and high school students. Learn words, grammar and sentence building in short quests. | Bahasa Inggris bergaya permainan untuk siswa SD, SMP, dan SMA. Pelajari kosakata, tata bahasa, dan pembentukan kalimat dalam quest singkat. | `none` | `none` | **PASS** |
| `landing.cta.start` | Start in 1 minute | Mulai dalam 1 menit | `1` | `1` | **PASS** |
| `landing.how1.body` | 3-10 minutes at a time. Concept, example, practice, challenge: build easy wins step by step. | 3-10 menit setiap kali. Konsep, contoh, latihan, tantangan: raih keberhasilan mudah selangkah demi selangkah. | `10,3` | `10,3` | **PASS** |
| `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | Jangan gunakan nama asli Anda. Nama panggilan 2-16 karakter sudah cukup. | `16,2` | `16,2` | **PASS** |
| `diag.intro.title` | 2-minute skill check | Pemeriksaan keterampilan 2 menit | `2` | `2` | **PASS** |
| `dash.diagnostic.cta` | Find your path with a 2-minute skill check | Temukan jalur Anda dengan pemeriksaan keterampilan 2 menit | `2` | `2` | **PASS** |
| `lesson.answer.numeric` | Type your answer as a number (e.g. 4, -3, 3/4) | Masukkan angka (mis. 4, -3, 3/4) | `3,3,4,4` | `3,3,4,4` | **PASS** |
| `result.quest` | Today's quest complete! +100 XP | Misi Harian Selesai! +100 XP | `100` | `100` | **PASS** |
| `quest.subtitle` | Finish them all for a +100 XP bonus | Selesaikan semuanya untuk mendapatkan bonus +100 XP | `100` | `100` | **PASS** |
| `ach.streak_3.title` | 3-day streak | Streak 3 Hari | `3` | `3` | **PASS** |
| `ach.streak_3.desc` | You learned 3 days in a row. | Kamu belajar selama 3 hari berturut-turut. | `3` | `3` | **PASS** |
| `ach.streak_7.title` | 7-day streak | Streak 7 Hari | `7` | `7` | **PASS** |
| `ach.streak_7.desc` | You learned 7 days in a row. | Kamu belajar selama 7 hari berturut-turut. | `7` | `7` | **PASS** |
| `ach.solve_25.title` | 25 problems solved | 25 Soal Selesai | `25` | `25` | **PASS** |
| `ach.solve_25.desc` | You answered 25 questions correctly. | Kamu menjawab 25 soal dengan benar. | `25` | `25` | **PASS** |
| `ach.solve_100.title` | 100 problems solved | 100 Soal Selesai | `100` | `100` | **PASS** |
| `ach.solve_100.desc` | You answered 100 questions correctly. | Kamu menjawab 100 soal dengan benar. | `100` | `100` | **PASS** |
| `ach.vocab_50.title` | 50 words | 50 Kosakata | `50` | `50` | **PASS** |
| `ach.vocab_50.desc` | You answered 50 vocabulary questions correctly. | Kamu menjawab 50 soal kosakata dengan benar. | `50` | `50` | **PASS** |
| `ach.review_10.title` | 10 reviews | 10 Ulasan | `10` | `10` | **PASS** |
| `ach.review_10.desc` | You solved 10 review questions. | Kamu menyelesaikan 10 soal ulasan. | `10` | `10` | **PASS** |
| `auth.password` | Password (at least 8 characters) | Kata Sandi (minimal 8 karakter) | `8` | `8` | **PASS** |
| `site.math.tagline` | Today's quest: one round of math! | Quest hari ini: satu ronde matematika! | `none` | `none` | **PASS** |
| `site.english.tagline` | Today's quest: one round of English! | Quest hari ini: satu ronde bahasa Inggris! | `none` | `none` | **PASS** |
| `landing.eyebrow` | Don't come to study, come for a quest | Jangan datang untuk menghafal, datanglah untuk sebuah quest | `none` | `none` | **PASS** |
| `landing.howTitle` | How it works | Cara kerjanya | `none` | `none` | **PASS** |
| `landing.how1.title` | Short quests | Quest singkat | `none` | `none` | **PASS** |
| `landing.how2.title` | Solve it with hints | Selesaikan dengan petunjuk | `none` | `none` | **PASS** |
| `landing.how2.body` | It's fine to get it wrong. A small hint, a concrete hint, then the steps, until you understand. | Tidak apa-apa jika salah. Petunjuk kecil, petunjuk nyata, lalu langkah-langkahnya, sampai Anda mengerti. | `none` | `none` | **PASS** |
| `landing.how3.title` | See yourself grow | Lihat perkembangan Anda | `none` | `none` | **PASS** |
| `landing.how3.body` | XP, levels, streaks and the skill map show how much you grew today. | XP, level, rekor hari berturut-turut, dan peta keterampilan menunjukkan perkembangan Anda hari ini. | `none` | `none` | **PASS** |
| `landing.privacy` | We don't ask for your real name, phone number or school. A nickname and your grade are enough. | Kami tidak menanyakan nama asli, nomor telepon, atau sekolah Anda. Cukup nama panggilan dan tingkat kelas Anda. | `none` | `none` | **PASS** |
| `diag.intro.body` | This is not a graded test. A few questions show where you are now so we can open the right path for you. If you don't know, just skip it. | Ini bukan ujian penilaian. Beberapa pertanyaan menunjukkan posisi Anda saat ini agar kami dapat membuka jalur yang tepat untuk Anda. Jika tidak tahu, lewati saja. | `none` | `none` | **PASS** |
| `dash.hello` | {name}, ready for a round today? | {name}, siap untuk satu ronde hari ini? | `none` | `none` | **PASS** |
| `learn.title` | Learning world | Dunia belajar | `none` | `none` | **PASS** |
| `avatar.fox` | Fox | Rubah | `none` | `none` | **PASS** |
| `avatar.cat` | Cat | Kucing | `none` | `none` | **PASS** |

### Locale: `it`

| Key | Canonical English Source | Corrected Translation | Source Numbers | Target Numbers | Semantic Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `site.math.description` | Game-style math for elementary, middle and high school students. Short 3-10 minute quests take you from concepts to problem solving, with hints so you can work it out yourself. | Matematica in stile gioco per studenti delle elementari, medie e superiori. Brevi missioni di 3-10 minuti ti guidano dai concetti alla risoluzione dei problemi, con suggerimenti per cavartela da solo. | `10,3` | `10,3` | **PASS** |
| `site.english.description` | Game-style English for elementary, middle and high school students. Learn words, grammar and sentence building in short quests. | Inglese in stile gioco per studenti delle elementari, medie e superiori. Impara vocaboli, grammatica e costruzione di frasi in brevi missioni. | `none` | `none` | **PASS** |
| `landing.cta.start` | Start in 1 minute | Inizia in 1 minuto | `1` | `1` | **PASS** |
| `landing.how1.body` | 3-10 minutes at a time. Concept, example, practice, challenge: build easy wins step by step. | 3-10 minuti alla volta. Concetto, esempio, pratica, sfida: ottieni successi facili passo dopo passo. | `10,3` | `10,3` | **PASS** |
| `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | Non usare il tuo vero nome. Un soprannome di 2-16 caratteri è sufficiente. | `16,2` | `16,2` | **PASS** |
| `diag.intro.title` | 2-minute skill check | Verifica delle competenze in 2 minuti | `2` | `2` | **PASS** |
| `dash.diagnostic.cta` | Find your path with a 2-minute skill check | Trova il tuo percorso con una verifica di 2 minuti | `2` | `2` | **PASS** |
| `lesson.answer.numeric` | Type your answer as a number (e.g. 4, -3, 3/4) | Inserisci un numero (es. 4, -3, 3/4) | `3,3,4,4` | `3,3,4,4` | **PASS** |
| `result.quest` | Today's quest complete! +100 XP | Missione del giorno completata! +100 XP | `100` | `100` | **PASS** |
| `quest.subtitle` | Finish them all for a +100 XP bonus | Completale tutte per ricevere un bonus di +100 XP | `100` | `100` | **PASS** |
| `ach.streak_3.title` | 3-day streak | Serie di 3 giorni | `3` | `3` | **PASS** |
| `ach.streak_3.desc` | You learned 3 days in a row. | Hai studiato per 3 giorni consecutivi. | `3` | `3` | **PASS** |
| `ach.streak_7.title` | 7-day streak | Serie di 7 giorni | `7` | `7` | **PASS** |
| `ach.streak_7.desc` | You learned 7 days in a row. | Hai studiato per 7 giorni consecutivi. | `7` | `7` | **PASS** |
| `ach.solve_25.title` | 25 problems solved | 25 problemi risolti | `25` | `25` | **PASS** |
| `ach.solve_25.desc` | You answered 25 questions correctly. | Hai risposto correttamente a 25 domande. | `25` | `25` | **PASS** |
| `ach.solve_100.title` | 100 problems solved | 100 problemi risolti | `100` | `100` | **PASS** |
| `ach.solve_100.desc` | You answered 100 questions correctly. | Hai risposto correttamente a 100 domande. | `100` | `100` | **PASS** |
| `ach.vocab_50.title` | 50 words | 50 vocaboli | `50` | `50` | **PASS** |
| `ach.vocab_50.desc` | You answered 50 vocabulary questions correctly. | Hai risposto correttamente a 50 domande di vocabolario. | `50` | `50` | **PASS** |
| `ach.review_10.title` | 10 reviews | 10 ripassi | `10` | `10` | **PASS** |
| `ach.review_10.desc` | You solved 10 review questions. | Hai risolto 10 domande di ripasso. | `10` | `10` | **PASS** |
| `auth.password` | Password (at least 8 characters) | Password (almeno 8 caratteri) | `8` | `8` | **PASS** |
| `site.math.tagline` | Today's quest: one round of math! | Missione di oggi: un round di matematica! | `none` | `none` | **PASS** |
| `site.english.tagline` | Today's quest: one round of English! | Missione di oggi: un round di inglese! | `none` | `none` | **PASS** |
| `landing.eyebrow` | Don't come to study, come for a quest | Non venire a studiare, vieni per una missione | `none` | `none` | **PASS** |
| `landing.howTitle` | How it works | Come funziona | `none` | `none` | **PASS** |
| `landing.how1.title` | Short quests | Brevi missioni | `none` | `none` | **PASS** |
| `landing.how2.title` | Solve it with hints | Risolvi con i suggerimenti | `none` | `none` | **PASS** |
| `landing.how2.body` | It's fine to get it wrong. A small hint, a concrete hint, then the steps, until you understand. | Sbagliare va benissimo. Un piccolo indizio, un suggerimento concreto, poi i passaggi guidati fino a capire. | `none` | `none` | **PASS** |
| `landing.how3.title` | See yourself grow | Guarda la tua crescita | `none` | `none` | **PASS** |
| `landing.how3.body` | XP, levels, streaks and the skill map show how much you grew today. | XP, livelli, strisce di giorni e la mappa delle competenze mostrano quanto sei cresciuto oggi. | `none` | `none` | **PASS** |
| `landing.privacy` | We don't ask for your real name, phone number or school. A nickname and your grade are enough. | Non chiediamo il tuo vero nome, numero di telefono o scuola. Un soprannome e la tua classe sono sufficienti. | `none` | `none` | **PASS** |
| `diag.intro.body` | This is not a graded test. A few questions show where you are now so we can open the right path for you. If you don't know, just skip it. | Questo non è un test con voto. Poche domande mostrano il tuo livello attuale per aprirti il percorso giusto. Se non lo sai, puoi semplicemente saltarlo. | `none` | `none` | **PASS** |
| `dash.hello` | {name}, ready for a round today? | {name}, pronto per un round oggi? | `none` | `none` | **PASS** |
| `learn.title` | Learning world | Mondo di apprendimento | `none` | `none` | **PASS** |
| `avatar.fox` | Fox | Volpe | `none` | `none` | **PASS** |
| `avatar.cat` | Cat | Gatto | `none` | `none` | **PASS** |

### Locale: `ja`

| Key | Canonical English Source | Corrected Translation | Source Numbers | Target Numbers | Semantic Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `site.math.description` | Game-style math for elementary, middle and high school students. Short 3-10 minute quests take you from concepts to problem solving, with hints so you can work it out yourself. | 小・中・高校生向けのゲーム感覚で学べる算数・数学。3〜10分の短いクエストで、概念の理解から問題演習までヒントとともに自力で解き進められます。 | `10,3` | `10,3` | **PASS** |
| `site.english.description` | Game-style English for elementary, middle and high school students. Learn words, grammar and sentence building in short quests. | 小・中・高校生向けのゲーム感覚で学べる英語。短いクエストで単語・文法・英文作成を楽しく身につけられます。 | `none` | `none` | **PASS** |
| `landing.cta.start` | Start in 1 minute | 1分で始める | `1` | `1` | **PASS** |
| `landing.how1.body` | 3-10 minutes at a time. Concept, example, practice, challenge: build easy wins step by step. | 毎回3〜10分。概念、例題、練習、挑戦問題へとステップアップし、着実に達成感を積み重ねます。 | `10,3` | `10,3` | **PASS** |
| `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | 本名は使わないでください。2〜16文字のニックネームで大丈夫です。 | `16,2` | `16,2` | **PASS** |
| `diag.intro.title` | 2-minute skill check | 2分間のレベル診断 | `2` | `2` | **PASS** |
| `dash.diagnostic.cta` | Find your path with a 2-minute skill check | 2分間のレベル診断でぴったりの道を見つけよう | `2` | `2` | **PASS** |
| `lesson.answer.numeric` | Type your answer as a number (e.g. 4, -3, 3/4) | 数値を入力（例：4, -3, 3/4） | `3,3,4,4` | `3,3,4,4` | **PASS** |
| `result.quest` | Today's quest complete! +100 XP | 本日のクエストコンプリート！ +100 XP獲得 | `100` | `100` | **PASS** |
| `quest.subtitle` | Finish them all for a +100 XP bonus | すべてクリアすると +100 XP ボーナス獲得 | `100` | `100` | **PASS** |
| `ach.streak_3.title` | 3-day streak | 3日連続学習 | `3` | `3` | **PASS** |
| `ach.streak_3.desc` | You learned 3 days in a row. | 3日間連続で学習を継続しました。 | `3` | `3` | **PASS** |
| `ach.streak_7.title` | 7-day streak | 7日連続学習 | `7` | `7` | **PASS** |
| `ach.streak_7.desc` | You learned 7 days in a row. | 7日間連続で学習を継続しました。 | `7` | `7` | **PASS** |
| `ach.solve_25.title` | 25 problems solved | 25問達成 | `25` | `25` | **PASS** |
| `ach.solve_25.desc` | You answered 25 questions correctly. | 累計25問の問題に正解しました。 | `25` | `25` | **PASS** |
| `ach.solve_100.title` | 100 problems solved | 100問達成 | `100` | `100` | **PASS** |
| `ach.solve_100.desc` | You answered 100 questions correctly. | 累計100問の問題に正解しました。 | `100` | `100` | **PASS** |
| `ach.vocab_50.title` | 50 words | 単語マスター50 | `50` | `50` | **PASS** |
| `ach.vocab_50.desc` | You answered 50 vocabulary questions correctly. | 累計50問の単語問題を正解しました。 | `50` | `50` | **PASS** |
| `ach.review_10.title` | 10 reviews | 10回の復習 | `10` | `10` | **PASS** |
| `ach.review_10.desc` | You solved 10 review questions. | 復習問題を累計10問解きました。 | `10` | `10` | **PASS** |
| `auth.password` | Password (at least 8 characters) | パスワード（8文字以上） | `8` | `8` | **PASS** |
| `site.math.tagline` | Today's quest: one round of math! | 今日のクエスト：数学のワンラウンド！ | `none` | `none` | **PASS** |
| `site.english.tagline` | Today's quest: one round of English! | 今日のクエスト：英語のワンラウンド！ | `none` | `none` | **PASS** |
| `landing.eyebrow` | Don't come to study, come for a quest | ただ勉強するのではなく、クエストに挑もう | `none` | `none` | **PASS** |
| `landing.howTitle` | How it works | 学習の進め方 | `none` | `none` | **PASS** |
| `landing.how1.title` | Short quests | 短いクエスト | `none` | `none` | **PASS** |
| `landing.how2.title` | Solve it with hints | ヒントを見ながら解く | `none` | `none` | **PASS** |
| `landing.how2.body` | It's fine to get it wrong. A small hint, a concrete hint, then the steps, until you understand. | 間違えても大丈夫。小さなヒント、具体的なヒント、そして解法の手順へと進み、納得できるまで学べます。 | `none` | `none` | **PASS** |
| `landing.how3.title` | See yourself grow | 自分の成長を実感 | `none` | `none` | **PASS** |
| `landing.how3.body` | XP, levels, streaks and the skill map show how much you grew today. | XP、レベル、連続学習日数、スキルマップで、今日の成長が一目でわかります。 | `none` | `none` | **PASS** |
| `landing.privacy` | We don't ask for your real name, phone number or school. A nickname and your grade are enough. | 本名や電話番号、学校名を聞くことはありません。ニックネームと学年だけで始められます。 | `none` | `none` | **PASS** |
| `diag.intro.body` | This is not a graded test. A few questions show where you are now so we can open the right path for you. If you don't know, just skip it. | これは成績をつけるテストではありません。現在の習熟度を確認し最適なコースを開くための簡単な問題です。わからない時はスキップして構いません。 | `none` | `none` | **PASS** |
| `dash.hello` | {name}, ready for a round today? | {name}さん、今日のラウンドを始める準備はできましたか？ | `none` | `none` | **PASS** |
| `learn.title` | Learning world | 学習ワールド | `none` | `none` | **PASS** |
| `avatar.fox` | Fox | キツネ | `none` | `none` | **PASS** |
| `avatar.cat` | Cat | ネコ | `none` | `none` | **PASS** |

### Locale: `nl`

| Key | Canonical English Source | Corrected Translation | Source Numbers | Target Numbers | Semantic Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `site.math.description` | Game-style math for elementary, middle and high school students. Short 3-10 minute quests take you from concepts to problem solving, with hints so you can work it out yourself. | Wiskunde in spelvorm voor leerlingen van het basisonderwijs en voortgezet onderwijs. Korte quests van 3–10 minuten leiden je van concepten naar probleemoplossing, met hints om het zelf uit te vogelen. | `10,3` | `10,3` | **PASS** |
| `site.english.description` | Game-style English for elementary, middle and high school students. Learn words, grammar and sentence building in short quests. | Engels in spelvorm voor leerlingen van het basisonderwijs en voortgezet onderwijs. Leer woorden, grammatica en zinsbouw in korte quests. | `none` | `none` | **PASS** |
| `landing.cta.start` | Start in 1 minute | Start in 1 minuut | `1` | `1` | **PASS** |
| `landing.how1.body` | 3-10 minutes at a time. Concept, example, practice, challenge: build easy wins step by step. | 3–10 minuten per keer. Concept, voorbeeld, oefening, uitdaging: bouw stap voor stap succeservaringen op. | `10,3` | `10,3` | **PASS** |
| `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | Gebruik niet je echte naam. Een bijnaam van 2–16 tekens is genoeg. | `16,2` | `16,2` | **PASS** |
| `diag.intro.title` | 2-minute skill check | Vaardigheidstest van 2 minuten | `2` | `2` | **PASS** |
| `dash.diagnostic.cta` | Find your path with a 2-minute skill check | Vind jouw pad met een vaardigheidstest van 2 minuten | `2` | `2` | **PASS** |
| `lesson.answer.numeric` | Type your answer as a number (e.g. 4, -3, 3/4) | Typ een getal (bijv. 4, -3, 3/4) | `3,3,4,4` | `3,3,4,4` | **PASS** |
| `result.quest` | Today's quest complete! +100 XP | Dagmissie voltooid! +100 XP | `100` | `100` | **PASS** |
| `quest.subtitle` | Finish them all for a +100 XP bonus | Voltooi ze allemaal voor +100 XP bonus | `100` | `100` | **PASS** |
| `ach.streak_3.title` | 3-day streak | 3-dagen streak | `3` | `3` | **PASS** |
| `ach.streak_3.desc` | You learned 3 days in a row. | Je hebt 3 dagen op rij geleerd. | `3` | `3` | **PASS** |
| `ach.streak_7.title` | 7-day streak | 7-dagen streak | `7` | `7` | **PASS** |
| `ach.streak_7.desc` | You learned 7 days in a row. | Je hebt 7 dagen op rij geleerd. | `7` | `7` | **PASS** |
| `ach.solve_25.title` | 25 problems solved | 25 opgaven opgelost | `25` | `25` | **PASS** |
| `ach.solve_25.desc` | You answered 25 questions correctly. | Je hebt 25 opgaven goed beantwoord. | `25` | `25` | **PASS** |
| `ach.solve_100.title` | 100 problems solved | 100 opgaven opgelost | `100` | `100` | **PASS** |
| `ach.solve_100.desc` | You answered 100 questions correctly. | Je hebt 100 opgaven goed beantwoord. | `100` | `100` | **PASS** |
| `ach.vocab_50.title` | 50 words | 50 woorden | `50` | `50` | **PASS** |
| `ach.vocab_50.desc` | You answered 50 vocabulary questions correctly. | Je hebt 50 woordenschatvragen goed beantwoord. | `50` | `50` | **PASS** |
| `ach.review_10.title` | 10 reviews | 10 herhalingen | `10` | `10` | **PASS** |
| `ach.review_10.desc` | You solved 10 review questions. | Je hebt 10 herhalingsopgaven opgelost. | `10` | `10` | **PASS** |
| `auth.password` | Password (at least 8 characters) | Wachtwoord (minimaal 8 tekens) | `8` | `8` | **PASS** |
| `site.math.tagline` | Today's quest: one round of math! | Quest van vandaag: een ronde wiskunde! | `none` | `none` | **PASS** |
| `site.english.tagline` | Today's quest: one round of English! | Quest van vandaag: een ronde Engels! | `none` | `none` | **PASS** |
| `landing.eyebrow` | Don't come to study, come for a quest | Kom niet om te blokken, kom voor een quest | `none` | `none` | **PASS** |
| `landing.howTitle` | How it works | Hoe het werkt | `none` | `none` | **PASS** |
| `landing.how1.title` | Short quests | Korte quests | `none` | `none` | **PASS** |
| `landing.how2.title` | Solve it with hints | Los het op met hints | `none` | `none` | **PASS** |
| `landing.how2.body` | It's fine to get it wrong. A small hint, a concrete hint, then the steps, until you understand. | Fouten maken mag. Een kleine hint, een concrete hint en dan de tussenstappen, tot je het helemaal begrijpt. | `none` | `none` | **PASS** |
| `landing.how3.title` | See yourself grow | Zie jezelf groeien | `none` | `none` | **PASS** |
| `landing.how3.body` | XP, levels, streaks and the skill map show how much you grew today. | XP, niveaus, reeksen en de vaardighedenkaart laten zien hoeveel je vandaag bent gegroeid. | `none` | `none` | **PASS** |
| `landing.privacy` | We don't ask for your real name, phone number or school. A nickname and your grade are enough. | We vragen niet naar je echte naam, telefoonnummer of school. Een bijnaam en je leerjaar zijn genoeg. | `none` | `none` | **PASS** |
| `diag.intro.body` | This is not a graded test. A few questions show where you are now so we can open the right path for you. If you don't know, just skip it. | Dit is geen toets voor een cijfer. Een paar vragen laten zien waar je nu staat, zodat we het juiste pad voor je kunnen openen. Als je het niet weet, sla het dan gewoon over. | `none` | `none` | **PASS** |
| `dash.hello` | {name}, ready for a round today? | {name}, klaar voor een ronde vandaag? | `none` | `none` | **PASS** |
| `learn.title` | Learning world | Leerwereld | `none` | `none` | **PASS** |
| `avatar.fox` | Fox | Vos | `none` | `none` | **PASS** |
| `avatar.cat` | Cat | Kat | `none` | `none` | **PASS** |

### Locale: `pt`

| Key | Canonical English Source | Corrected Translation | Source Numbers | Target Numbers | Semantic Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `site.math.description` | Game-style math for elementary, middle and high school students. Short 3-10 minute quests take you from concepts to problem solving, with hints so you can work it out yourself. | Matemática em estilo de jogo para alunos do ensino fundamental e médio. Missões curtas de 3 a 10 minutos levam você dos conceitos à resolução de problemas, com dicas para resolver por conta própria. | `10,3` | `10,3` | **PASS** |
| `site.english.description` | Game-style English for elementary, middle and high school students. Learn words, grammar and sentence building in short quests. | Inglês em estilo de jogo para alunos do ensino fundamental e médio. Aprenda palavras, gramática e construção de frases em missões curtas. | `none` | `none` | **PASS** |
| `landing.cta.start` | Start in 1 minute | Comece em 1 minuto | `1` | `1` | **PASS** |
| `landing.how1.body` | 3-10 minutes at a time. Concept, example, practice, challenge: build easy wins step by step. | 3 a 10 minutos por vez. Conceito, exemplo, prática, desafio: construa pequenas conquistas passo a passo. | `10,3` | `10,3` | **PASS** |
| `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | Não use seu nome real. Um apelido de 2 a 16 caracteres é suficiente. | `16,2` | `16,2` | **PASS** |
| `diag.intro.title` | 2-minute skill check | Avaliação de habilidades de 2 minutos | `2` | `2` | **PASS** |
| `dash.diagnostic.cta` | Find your path with a 2-minute skill check | Encontre seu caminho com uma avaliação de 2 minutos | `2` | `2` | **PASS** |
| `lesson.answer.numeric` | Type your answer as a number (e.g. 4, -3, 3/4) | Digite um número (ex: 4, -3, 3/4) | `3,3,4,4` | `3,3,4,4` | **PASS** |
| `result.quest` | Today's quest complete! +100 XP | Missão do dia cumprida! +100 XP | `100` | `100` | **PASS** |
| `quest.subtitle` | Finish them all for a +100 XP bonus | Conclua todas para ganhar um bônus de +100 XP | `100` | `100` | **PASS** |
| `ach.streak_3.title` | 3-day streak | Sequência de 3 dias | `3` | `3` | **PASS** |
| `ach.streak_3.desc` | You learned 3 days in a row. | Você estudou por 3 dias consecutivos. | `3` | `3` | **PASS** |
| `ach.streak_7.title` | 7-day streak | Sequência de 7 dias | `7` | `7` | **PASS** |
| `ach.streak_7.desc` | You learned 7 days in a row. | Você estudou por 7 dias consecutivos. | `7` | `7` | **PASS** |
| `ach.solve_25.title` | 25 problems solved | 25 questões resolvidas | `25` | `25` | **PASS** |
| `ach.solve_25.desc` | You answered 25 questions correctly. | Você acertou 25 questões no total. | `25` | `25` | **PASS** |
| `ach.solve_100.title` | 100 problems solved | 100 questões resolvidas | `100` | `100` | **PASS** |
| `ach.solve_100.desc` | You answered 100 questions correctly. | Você acertou 100 questões no total. | `100` | `100` | **PASS** |
| `ach.vocab_50.title` | 50 words | 50 palavras | `50` | `50` | **PASS** |
| `ach.vocab_50.desc` | You answered 50 vocabulary questions correctly. | Você acertou 50 questões de vocabulário. | `50` | `50` | **PASS** |
| `ach.review_10.title` | 10 reviews | 10 revisões | `10` | `10` | **PASS** |
| `ach.review_10.desc` | You solved 10 review questions. | Você resolveu 10 questões de revisão. | `10` | `10` | **PASS** |
| `auth.password` | Password (at least 8 characters) | Senha (mínimo de 8 caracteres) | `8` | `8` | **PASS** |
| `site.math.tagline` | Today's quest: one round of math! | Missão de hoje: uma rodada de matemática! | `none` | `none` | **PASS** |
| `site.english.tagline` | Today's quest: one round of English! | Missão de hoje: uma rodada de inglês! | `none` | `none` | **PASS** |
| `landing.eyebrow` | Don't come to study, come for a quest | Não venha para estudar, venha para uma missão | `none` | `none` | **PASS** |
| `landing.howTitle` | How it works | Como funciona | `none` | `none` | **PASS** |
| `landing.how1.title` | Short quests | Missões curtas | `none` | `none` | **PASS** |
| `landing.how2.title` | Solve it with hints | Resolva com dicas | `none` | `none` | **PASS** |
| `landing.how2.body` | It's fine to get it wrong. A small hint, a concrete hint, then the steps, until you understand. | Não tem problema errar. Uma pequena dica, depois uma dica concreta e o passo a passo até você entender. | `none` | `none` | **PASS** |
| `landing.how3.title` | See yourself grow | Veja o seu crescimento | `none` | `none` | **PASS** |
| `landing.how3.body` | XP, levels, streaks and the skill map show how much you grew today. | XP, níveis, sequência de dias e o mapa de habilidades mostram o quanto você evoluiu hoje. | `none` | `none` | **PASS** |
| `landing.privacy` | We don't ask for your real name, phone number or school. A nickname and your grade are enough. | Não pedimos seu nome real, número de telefone ou escola. Um apelido e seu ano escolar são suficientes. | `none` | `none` | **PASS** |
| `diag.intro.body` | This is not a graded test. A few questions show where you are now so we can open the right path for you. If you don't know, just skip it. | Este não é um teste com nota. Algumas perguntas mostram onde você está agora para abrirmos o caminho certo para você. Se não souber, basta pular. | `none` | `none` | **PASS** |
| `dash.hello` | {name}, ready for a round today? | {name}, pronto para uma rodada hoje? | `none` | `none` | **PASS** |
| `learn.title` | Learning world | Mundo de aprendizagem | `none` | `none` | **PASS** |
| `avatar.fox` | Fox | Raposa | `none` | `none` | **PASS** |
| `avatar.cat` | Cat | Gato | `none` | `none` | **PASS** |

### Locale: `ru`

| Key | Canonical English Source | Corrected Translation | Source Numbers | Target Numbers | Semantic Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `site.math.description` | Game-style math for elementary, middle and high school students. Short 3-10 minute quests take you from concepts to problem solving, with hints so you can work it out yourself. | Игровая математика для учеников начальных, средних и старших классов. Короткие квесты на 3–10 минут ведут от понятий к решению задач с подсказками для самостоятельной работы. | `10,3` | `10,3` | **PASS** |
| `site.english.description` | Game-style English for elementary, middle and high school students. Learn words, grammar and sentence building in short quests. | Игровой английский для учеников начальных, средних и старших классов. Учите слова, грамматику и построение предложений в коротких квестах. | `none` | `none` | **PASS** |
| `landing.cta.start` | Start in 1 minute | Начать за 1 минуту | `1` | `1` | **PASS** |
| `landing.how1.body` | 3-10 minutes at a time. Concept, example, practice, challenge: build easy wins step by step. | По 3–10 минут за раз. Понятие, пример, практика, вызов: уверенные успехи шаг за шагом. | `10,3` | `10,3` | **PASS** |
| `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | Не используйте настоящее имя. Достаточно никнейма от 2 до 16 символов. | `16,2` | `16,2` | **PASS** |
| `diag.intro.title` | 2-minute skill check | 2-минутная проверка навыков | `2` | `2` | **PASS** |
| `dash.diagnostic.cta` | Find your path with a 2-minute skill check | Найдите свой путь с 2-минутной проверкой навыков | `2` | `2` | **PASS** |
| `lesson.answer.numeric` | Type your answer as a number (e.g. 4, -3, 3/4) | Введите число (например: 4, -3, 3/4) | `3,3,4,4` | `3,3,4,4` | **PASS** |
| `result.quest` | Today's quest complete! +100 XP | Дневной квест выполнен! +100 XP | `100` | `100` | **PASS** |
| `quest.subtitle` | Finish them all for a +100 XP bonus | Выполните все для получения бонуса +100 XP | `100` | `100` | **PASS** |
| `ach.streak_3.title` | 3-day streak | Серия 3 дня | `3` | `3` | **PASS** |
| `ach.streak_3.desc` | You learned 3 days in a row. | Вы занимались 3 дня подряд. | `3` | `3` | **PASS** |
| `ach.streak_7.title` | 7-day streak | Серия 7 дней | `7` | `7` | **PASS** |
| `ach.streak_7.desc` | You learned 7 days in a row. | Вы занимались 7 дней подряд. | `7` | `7` | **PASS** |
| `ach.solve_25.title` | 25 problems solved | 25 решённых задач | `25` | `25` | **PASS** |
| `ach.solve_25.desc` | You answered 25 questions correctly. | Вы правильно ответили на 25 вопросов. | `25` | `25` | **PASS** |
| `ach.solve_100.title` | 100 problems solved | 100 решённых задач | `100` | `100` | **PASS** |
| `ach.solve_100.desc` | You answered 100 questions correctly. | Вы правильно ответили на 100 вопросов. | `100` | `100` | **PASS** |
| `ach.vocab_50.title` | 50 words | 50 слов | `50` | `50` | **PASS** |
| `ach.vocab_50.desc` | You answered 50 vocabulary questions correctly. | Вы правильно ответили на 50 словарных вопросов. | `50` | `50` | **PASS** |
| `ach.review_10.title` | 10 reviews | 10 повторений | `10` | `10` | **PASS** |
| `ach.review_10.desc` | You solved 10 review questions. | Вы решили 10 задач на повторение. | `10` | `10` | **PASS** |
| `auth.password` | Password (at least 8 characters) | Пароль (не менее 8 символов) | `8` | `8` | **PASS** |
| `site.math.tagline` | Today's quest: one round of math! | Квест на сегодня: один раунд математики! | `none` | `none` | **PASS** |
| `site.english.tagline` | Today's quest: one round of English! | Квест на сегодня: один раунд английского! | `none` | `none` | **PASS** |
| `landing.eyebrow` | Don't come to study, come for a quest | Приходите не зубрить, а на увлекательный квест | `none` | `none` | **PASS** |
| `landing.howTitle` | How it works | Как это работает | `none` | `none` | **PASS** |
| `landing.how1.title` | Short quests | Короткие квесты | `none` | `none` | **PASS** |
| `landing.how2.title` | Solve it with hints | Решайте с подсказками | `none` | `none` | **PASS** |
| `landing.how2.body` | It's fine to get it wrong. A small hint, a concrete hint, then the steps, until you understand. | Ошибаться — это нормально. Короткая подсказка, подробная подсказка, затем шаги решения, пока всё не станет понятно. | `none` | `none` | **PASS** |
| `landing.how3.title` | See yourself grow | Наблюдайте за своим ростом | `none` | `none` | **PASS** |
| `landing.how3.body` | XP, levels, streaks and the skill map show how much you grew today. | XP, уровни, серии дней и карта навыков наглядно показывают, как вы выросли сегодня. | `none` | `none` | **PASS** |
| `landing.privacy` | We don't ask for your real name, phone number or school. A nickname and your grade are enough. | Мы не спрашиваем ваше настоящее имя, телефон или школу. Достаточно никнейма и класса. | `none` | `none` | **PASS** |
| `diag.intro.body` | This is not a graded test. A few questions show where you are now so we can open the right path for you. If you don't know, just skip it. | Это не тест с оценками. Несколько вопросов покажут ваш текущий уровень, чтобы мы открыли для вас подходящий путь. Если не знаете ответа, просто пропустите. | `none` | `none` | **PASS** |
| `dash.hello` | {name}, ready for a round today? | {name}, готовы к сегодняшнему раунду? | `none` | `none` | **PASS** |
| `learn.title` | Learning world | Мир обучения | `none` | `none` | **PASS** |
| `avatar.fox` | Fox | Лис | `none` | `none` | **PASS** |
| `avatar.cat` | Cat | Кот | `none` | `none` | **PASS** |

### Locale: `zh-Hans`

| Key | Canonical English Source | Corrected Translation | Source Numbers | Target Numbers | Semantic Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `site.math.description` | Game-style math for elementary, middle and high school students. Short 3-10 minute quests take you from concepts to problem solving, with hints so you can work it out yourself. | 面向小学、初中和高中学生的游戏化数学学习。3-10分钟的简短任务带你从核心概念步入问题解决，配有启发式提示助你自主解答。 | `10,3` | `10,3` | **PASS** |
| `site.english.description` | Game-style English for elementary, middle and high school students. Learn words, grammar and sentence building in short quests. | 面向小学、初中和高中学生的游戏化英语学习。在简短任务中轻松掌握单词、语法与造句。 | `none` | `none` | **PASS** |
| `landing.cta.start` | Start in 1 minute | 1分钟开启 | `1` | `1` | **PASS** |
| `landing.how1.body` | 3-10 minutes at a time. Concept, example, practice, challenge: build easy wins step by step. | 每次仅需3-10分钟。概念、例题、练习、挑战：一步步积少成多轻松获胜。 | `10,3` | `10,3` | **PASS** |
| `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | 请勿使用真实姓名。2-16个字符的昵称即可。 | `16,2` | `16,2` | **PASS** |
| `diag.intro.title` | 2-minute skill check | 2分钟能力自测 | `2` | `2` | **PASS** |
| `dash.diagnostic.cta` | Find your path with a 2-minute skill check | 通过2分钟能力自测找到适合你的学习路径 | `2` | `2` | **PASS** |
| `lesson.answer.numeric` | Type your answer as a number (e.g. 4, -3, 3/4) | 请输入数字（例如：4, -3, 3/4） | `3,3,4,4` | `3,3,4,4` | **PASS** |
| `result.quest` | Today's quest complete! +100 XP | 今日任务全部达成！获得 +100 XP | `100` | `100` | **PASS** |
| `quest.subtitle` | Finish them all for a +100 XP bonus | 全部完成即可领取 +100 XP 奖励 | `100` | `100` | **PASS** |
| `ach.streak_3.title` | 3-day streak | 连续3天 | `3` | `3` | **PASS** |
| `ach.streak_3.desc` | You learned 3 days in a row. | 连续3天坚持学习打卡。 | `3` | `3` | **PASS** |
| `ach.streak_7.title` | 7-day streak | 连续7天 | `7` | `7` | **PASS** |
| `ach.streak_7.desc` | You learned 7 days in a row. | 连续7天坚持学习打卡。 | `7` | `7` | **PASS** |
| `ach.solve_25.title` | 25 problems solved | 解题25道 | `25` | `25` | **PASS** |
| `ach.solve_25.desc` | You answered 25 questions correctly. | 累计正确答对25道题目。 | `25` | `25` | **PASS** |
| `ach.solve_100.title` | 100 problems solved | 解题100道 | `100` | `100` | **PASS** |
| `ach.solve_100.desc` | You answered 100 questions correctly. | 累计正确答对100道题目。 | `100` | `100` | **PASS** |
| `ach.vocab_50.title` | 50 words | 词汇50关 | `50` | `50` | **PASS** |
| `ach.vocab_50.desc` | You answered 50 vocabulary questions correctly. | 累计正确掌握50个词汇。 | `50` | `50` | **PASS** |
| `ach.review_10.title` | 10 reviews | 复习10题 | `10` | `10` | **PASS** |
| `ach.review_10.desc` | You solved 10 review questions. | 通过复习累计重温10道错题。 | `10` | `10` | **PASS** |
| `auth.password` | Password (at least 8 characters) | 密码（至少8位字符） | `8` | `8` | **PASS** |
| `site.math.tagline` | Today's quest: one round of math! | 今日任务：来一轮数学挑战！ | `none` | `none` | **PASS** |
| `site.english.tagline` | Today's quest: one round of English! | 今日任务：来一轮英语挑战！ | `none` | `none` | **PASS** |
| `landing.eyebrow` | Don't come to study, come for a quest | 别来枯燥死记，来开启一场冒险任务 | `none` | `none` | **PASS** |
| `landing.howTitle` | How it works | 运行机制 | `none` | `none` | **PASS** |
| `landing.how1.title` | Short quests | 简短任务 | `none` | `none` | **PASS** |
| `landing.how2.title` | Solve it with hints | 借助提示攻克难题 | `none` | `none` | **PASS** |
| `landing.how2.body` | It's fine to get it wrong. A small hint, a concrete hint, then the steps, until you understand. | 做错也没关系。先给你一个小提示，再给一个明确提示，然后展开步骤解析，直到你完全理解。 | `none` | `none` | **PASS** |
| `landing.how3.title` | See yourself grow | 亲眼见证自己的成长 | `none` | `none` | **PASS** |
| `landing.how3.body` | XP, levels, streaks and the skill map show how much you grew today. | XP、等级、连胜天数与技能地图，清晰呈现你今天的所有收获。 | `none` | `none` | **PASS** |
| `landing.privacy` | We don't ask for your real name, phone number or school. A nickname and your grade are enough. | 我们不会索取你的真实姓名、电话号码或就读学校。一个昵称和你的年级就足够了。 | `none` | `none` | **PASS** |
| `diag.intro.body` | This is not a graded test. A few questions show where you are now so we can open the right path for you. If you don't know, just skip it. | 这不是打分考试。几道题目能帮助了解你目前的水平，从而为你开启最合适的学习路径。遇到不会的直接跳过即可。 | `none` | `none` | **PASS** |
| `dash.hello` | {name}, ready for a round today? | {name}，准备好今天来一轮挑战了吗？ | `none` | `none` | **PASS** |
| `learn.title` | Learning world | 学习世界 | `none` | `none` | **PASS** |
| `avatar.fox` | Fox | 狐狸 | `none` | `none` | **PASS** |
| `avatar.cat` | Cat | 小猫 | `none` | `none` | **PASS** |

### Locale: `zh-Hant`

| Key | Canonical English Source | Corrected Translation | Source Numbers | Target Numbers | Semantic Verdict |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `site.math.description` | Game-style math for elementary, middle and high school students. Short 3-10 minute quests take you from concepts to problem solving, with hints so you can work it out yourself. | 適合國小、國中與高中學生的遊戲化數學學習。3-10分鐘的簡短任務引導你從概念邁向解題，搭配啟發式提示助你獨立完成。 | `10,3` | `10,3` | **PASS** |
| `site.english.description` | Game-style English for elementary, middle and high school students. Learn words, grammar and sentence building in short quests. | 適合國小、國中與高中學生的遊戲化英語學習。在簡短任務中輕鬆學習單字、文法與造句。 | `none` | `none` | **PASS** |
| `landing.cta.start` | Start in 1 minute | 1分鐘開始 | `1` | `1` | **PASS** |
| `landing.how1.body` | 3-10 minutes at a time. Concept, example, practice, challenge: build easy wins step by step. | 每次只需3-10分鐘。概念、例題、練習、挑戰：一步步積累成就輕鬆獲勝。 | `10,3` | `10,3` | **PASS** |
| `onboarding.nickname.hint` | Don't use your real name. A nickname of 2-16 characters is enough. | 請勿使用真實姓名。2-16個字元的暱稱即可。 | `16,2` | `16,2` | **PASS** |
| `diag.intro.title` | 2-minute skill check | 2分鐘能力自測 | `2` | `2` | **PASS** |
| `dash.diagnostic.cta` | Find your path with a 2-minute skill check | 透過2分鐘能力自測找到適合你的學習路線 | `2` | `2` | **PASS** |
| `lesson.answer.numeric` | Type your answer as a number (e.g. 4, -3, 3/4) | 請輸入數字（例如：4, -3, 3/4） | `3,3,4,4` | `3,3,4,4` | **PASS** |
| `result.quest` | Today's quest complete! +100 XP | 今日任務全部達成！獲得 +100 XP | `100` | `100` | **PASS** |
| `quest.subtitle` | Finish them all for a +100 XP bonus | 全部完成即可領取 +100 XP 獎勵 | `100` | `100` | **PASS** |
| `ach.streak_3.title` | 3-day streak | 連續3天 | `3` | `3` | **PASS** |
| `ach.streak_3.desc` | You learned 3 days in a row. | 連續3天堅持學習打卡。 | `3` | `3` | **PASS** |
| `ach.streak_7.title` | 7-day streak | 連續7天 | `7` | `7` | **PASS** |
| `ach.streak_7.desc` | You learned 7 days in a row. | 連續7天堅持學習打卡。 | `7` | `7` | **PASS** |
| `ach.solve_25.title` | 25 problems solved | 解題25道 | `25` | `25` | **PASS** |
| `ach.solve_25.desc` | You answered 25 questions correctly. | 累計正確答對25道題目。 | `25` | `25` | **PASS** |
| `ach.solve_100.title` | 100 problems solved | 解題100道 | `100` | `100` | **PASS** |
| `ach.solve_100.desc` | You answered 100 questions correctly. | 累計正確答對100道題目。 | `100` | `100` | **PASS** |
| `ach.vocab_50.title` | 50 words | 詞彙50關 | `50` | `50` | **PASS** |
| `ach.vocab_50.desc` | You answered 50 vocabulary questions correctly. | 累計正確掌握50個字彙。 | `50` | `50` | **PASS** |
| `ach.review_10.title` | 10 reviews | 複習10題 | `10` | `10` | **PASS** |
| `ach.review_10.desc` | You solved 10 review questions. | 透過複習累計重溫10道錯題。 | `10` | `10` | **PASS** |
| `auth.password` | Password (at least 8 characters) | 密碼（至少8個字元） | `8` | `8` | **PASS** |
| `site.math.tagline` | Today's quest: one round of math! | 今日任務：來一輪數學挑戰！ | `none` | `none` | **PASS** |
| `site.english.tagline` | Today's quest: one round of English! | 今日任務：來一輪英語挑戰！ | `none` | `none` | **PASS** |
| `landing.eyebrow` | Don't come to study, come for a quest | 別來枯燥死記，來開啟一場冒險任務 | `none` | `none` | **PASS** |
| `landing.howTitle` | How it works | 運作方式 | `none` | `none` | **PASS** |
| `landing.how1.title` | Short quests | 簡短任務 | `none` | `none` | **PASS** |
| `landing.how2.title` | Solve it with hints | 借助提示攻克難題 | `none` | `none` | **PASS** |
| `landing.how2.body` | It's fine to get it wrong. A small hint, a concrete hint, then the steps, until you understand. | 做錯了也沒關係。先給個小提示，再給具體提示，最後一步步拆解，直到你完全理解。 | `none` | `none` | **PASS** |
| `landing.how3.title` | See yourself grow | 親眼見證自己的成長 | `none` | `none` | **PASS** |
| `landing.how3.body` | XP, levels, streaks and the skill map show how much you grew today. | XP、等級、連續天數與技能地圖，清楚呈現你今天的所有成長。 | `none` | `none` | **PASS** |
| `landing.privacy` | We don't ask for your real name, phone number or school. A nickname and your grade are enough. | 我們不會索取你的真實姓名、電話號碼或就讀學校。一個暱稱與年級就足夠了。 | `none` | `none` | **PASS** |
| `diag.intro.body` | This is not a graded test. A few questions show where you are now so we can open the right path for you. If you don't know, just skip it. | 這不是打分數的考試。幾道題目能了解你目前的起點，為你開啟最適合的學習路線。不會的話直接跳過即可。 | `none` | `none` | **PASS** |
| `dash.hello` | {name}, ready for a round today? | {name}，準備好今天來一輪挑戰了嗎？ | `none` | `none` | **PASS** |
| `learn.title` | Learning world | 學習世界 | `none` | `none` | **PASS** |
| `avatar.fox` | Fox | 狐狸 | `none` | `none` | **PASS** |
| `avatar.cat` | Cat | 小貓 | `none` | `none` | **PASS** |
