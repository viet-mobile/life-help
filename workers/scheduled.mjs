// STAGING-ONLY Worker entry: the OpenNext worker plus a cron handler that retries interrupted
// settled-conversation cleanup. Used only by `npm run deploy:staging`, which also attaches the
// schedule. wrangler.jsonc (and so `deploy:production`) keeps the plain OpenNext entry and no
// cron trigger.
//
// The handler calls the existing /api/sys/cleanup/conversations route in-process, so the
// scheduler and a manual SYS retry run exactly the same authorization and cleanup code. It is
// inert unless the Worker holds LIFE_HELP_SETTLEMENT_TOKEN (set on life-help-staging only), and
// the route itself refuses any Supabase project other than staging.
import worker from "../.open-next/worker.js";

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "../.open-next/worker.js";

const CLEANUP_BATCH = 50;

const stagingWorker = {
  fetch: worker.fetch,

  async scheduled(controller, env, ctx) {
    const token = env.LIFE_HELP_SETTLEMENT_TOKEN;
    if (!token) {
      console.log(JSON.stringify({ job: "conversation-cleanup-retry", cron: controller.cron, skipped: "NO_PLATFORM_TOKEN" }));
      return;
    }
    const request = new Request("https://life-help-staging.internal/api/sys/cleanup/conversations", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Life-Help-Trigger": "scheduled" },
      body: JSON.stringify({ limit: CLEANUP_BATCH }),
    });
    const response = await worker.fetch(request, env, ctx);
    const report = await response.text();
    console.log(JSON.stringify({ job: "conversation-cleanup-retry", cron: controller.cron, status: response.status, report: report.slice(0, 500) }));
    // A non-2xx run surfaces as a failed invocation in the Cron Events log.
    if (!response.ok) throw new Error(`conversation cleanup retry failed: HTTP ${response.status}`);
  },
};

export default stagingWorker;
