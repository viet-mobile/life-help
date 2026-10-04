/** Avatar catalogue (cosmetic only, no pay-to-win). Purchasable items arrive in Phase 2. */
export const AVATARS = [
  { id: "fox", emoji: "🦊" },
  { id: "cat", emoji: "🐱" },
  { id: "panda", emoji: "🐼" },
  { id: "robot", emoji: "🤖" },
  { id: "owl", emoji: "🦉" },
  { id: "penguin", emoji: "🐧" },
] as const;

export function avatarEmoji(id: string | undefined): string {
  return AVATARS.find((a) => a.id === id)?.emoji ?? "🦊";
}
