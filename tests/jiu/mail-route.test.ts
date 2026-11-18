import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ allowed: false, send: vi.fn(), get: vi.fn(), put: vi.fn() }));
vi.mock("@/lib/jiu/admin", () => ({ canSendJiuMail: async () => mocks.allowed }));
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: async () => ({ env: { JIU_EMAIL: { send: mocks.send }, JIU_MAIL_STATE: { get: mocks.get, put: mocks.put } } }) }));
import { GET, POST } from "@/app/jiu/mail/route";
const report = { events: [{ id: "one", site: "math", action: "attempt", at: "2026-10-20T12:00:00Z" }], notes: [] };
function request(body: unknown = report, origin = "https://jiu.life.help", host = "jiu.life.help") {
  return new Request(`https://${host}/jiu/mail`, { method: "POST", headers: { host, origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
beforeEach(() => { mocks.allowed = false; mocks.send.mockReset().mockResolvedValue({ messageId: "provider-message" }); mocks.get.mockReset().mockResolvedValue(null); mocks.put.mockReset().mockResolvedValue(undefined); });
describe("journal mail endpoint", () => {
  it("requires the enrolled browser and never sends public visitor data", async () => { expect((await POST(request())).status).toBe(401); expect(mocks.send).not.toHaveBeenCalled(); });
  it("rejects cross-origin requests even with a valid browser", async () => { mocks.allowed = true; expect((await POST(request(report, "https://evil.example"))).status).toBe(403); expect(mocks.send).not.toHaveBeenCalled(); });
  it("does not expose delivery on marketplace hosts", async () => { mocks.allowed = true; expect((await POST(request(report, "https://life.help", "life.help"))).status).toBe(404); });
  it("rejects invalid reports before reaching the mail provider", async () => { mocks.allowed = true; expect((await POST(request({ events: [], notes: [] }))).status).toBe(400); expect(mocks.send).not.toHaveBeenCalled(); });
  it("sends only to the configured recipient and records delivery", async () => {
    mocks.allowed = true;
    expect((await POST(request({ ...report, to: "attacker@example.com" }))).status).toBe(200);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ from: "jiu@life.help", to: "jiubag850@gmail.com" }));
    expect(mocks.put).toHaveBeenCalledWith(expect.stringMatching(/^sent:[a-f0-9]{64}$/), "provider-message", { expirationTtl: 7776000 });
  });
  it("deduplicates successful delivery retries", async () => { mocks.allowed = true; mocks.get.mockResolvedValue("sent"); expect(await (await POST(request())).json()).toEqual({ sent: true, duplicate: true }); expect(mocks.send).not.toHaveBeenCalled(); });
  it("returns a retryable error on provider failure", async () => { mocks.allowed = true; mocks.send.mockRejectedValue(new Error("unavailable")); const spy = vi.spyOn(console, "error").mockImplementation(() => {}); expect((await POST(request())).status).toBe(503); expect(mocks.put).not.toHaveBeenCalled(); spy.mockRestore(); });
  it("reports whether this browser is enrolled", async () => { const req = new Request("https://jiu.life.help/jiu/mail", { headers: { host: "jiu.life.help" } }); expect(await (await GET(req)).json()).toMatchObject({ enabled: false }); mocks.allowed = true; expect(await (await GET(req)).json()).toMatchObject({ enabled: true }); });
});
