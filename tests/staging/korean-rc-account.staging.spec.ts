import { expect, test } from '@playwright/test';
import { createConfirmedUser, deleteFixtureUser, restRows, correctPayload, type Q } from './helpers';
import korean from '../../lib/learn/content/korean/korean.json';
import { BASE } from './target';

// Run separately from staging:integrated: its foreign-row baseline must not overlap these disposable learner fixtures.
test('Korean RC: signed-in K7 and K10 persist across reload; diagnostic, lesson, practice and cards work', async ({ page }) => {
  const who = { email: `learn.rc.${Date.now()}@example.test`, password: `RC-${crypto.randomUUID()}!` };
  let id: string | null = null;
  const api = async (action: string, body: Record<string, unknown> = {}) => {
    const response = await page.request.post(`${BASE}/api/learn/${action}`, { headers: { Origin: BASE }, data: { site: 'korean', locale: 'en', ...body } });
    expect(response.status(), action).toBe(200);
    return response.json();
  };
  try {
    id = await createConfirmedUser(who);
    await page.context().addCookies([{ name: 'learn_lang', value: 'en', url: BASE }]);
    await page.goto(`${BASE}/study/korean/login`);
    await page.locator('#email').fill(who.email);
    await page.locator('#password').fill(who.password);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(`${BASE}/study/korean/dashboard`);
    for (const grade of ['K7', 'K10']) {
      await api('onboard', { nickname: 'RC Test', grade, goal: 'fill_gaps', avatar: 'robot' });
      await page.reload();
      expect((await api('state')).state.profile.grade).toBe(grade);
      const rows = await restRows<{level: string}>('learn_progress_meta', `user_id=eq.${id}&site=eq.korean&select=level`);
      expect(rows).toEqual([{ level: grade }]);
      expect((await api('diagnostic')).next).toBeTruthy();
      const lesson = await api('start', { kind: 'lesson', lessonId: `korean-${grade.toLowerCase()}-l1` });
      const question = lesson.questions[0];
      const key = korean.questions.find(q => q.id === question.id);
      expect(key).toBeTruthy();
      expect((await api('attempt', { sessionId: lesson.sessionId, questionId: question.id, answer: correctPayload(key as unknown as Q), timeMs: 5000 })).correct).toBe(true);
      await page.reload();
      expect((await restRows('learn_attempts', `user_id=eq.${id}&question_code=eq.${question.id}&select=user_id`)).length).toBeGreaterThan(0);
      const skillId = grade === 'K7' ? 'k.k7.bridge_formal' : 'k.k10.idioms_action';
      const session = await api('start', { kind: 'practice', skillId });
      expect(session.questions.length).toBeGreaterThan(0);
      expect(session.questions[0].answer).toBeUndefined();
      expect((await api('cards', { count: 4 })).cards.length).toBeGreaterThan(0);
    }
  } finally {
    await deleteFixtureUser(id);
  }
});
