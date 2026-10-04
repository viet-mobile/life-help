import { T, rng, gcd } from "../elementary/lib.mjs";
export { T, gcd };

/** Seeded random helper: the same seed string always produces the same stream. */
export const hash32 = (s) => [...String(s)].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 7);
export function makeRand(seed) {
  const r = rng(hash32(seed));
  const api = {
    next: r,
    int: (a, b) => a + Math.floor(r() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    chance: (p) => r() < p,
    shuffle: (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    /** n distinct picks */
    sample: (arr, n) => api.shuffle(arr).slice(0, n),
    /** integer in a..b that is a multiple of `step` */
    mult: (a, b, step) => step * api.int(Math.ceil(a / step), Math.floor(b / step)),
  };
  return api;
}

export const NAMES = ["Mina", "Jun", "Hana", "Minh", "Lan", "Sora", "Tuan", "Yuna", "Nam", "Linh", "Doyun", "Mai"];
/** shop goods as { ko, vi } (always used inside particle-safe sentences) */
export const GOODS = [
  { ko: "공책", vi: "vở" }, { ko: "연필", vi: "bút chì" }, { ko: "우유", vi: "sữa" }, { ko: "빵", vi: "bánh mì" },
  { ko: "주스", vi: "nước ép" }, { ko: "스티커", vi: "hình dán" }, { ko: "과자", vi: "bánh quy" }, { ko: "물병", vi: "bình nước" },
];
export const won = (n) => `${Number(n).toLocaleString("en-US")}`;
export const tex = (s) => `$${s}$`;
export const round = (x, d = 6) => Number(x.toFixed(d));
export const fracTex = (n, d) => { const g = gcd(n, d); const a = n / g, b = d / g; return b === 1 ? `${a}` : `\\frac{${a}}{${b}}`; };

export const ONE = T("(숫자만 쓰세요)", "(chỉ nhập số)");
export const DEC = T("(소수로 써 주세요. 필요하면 소수 둘째 자리까지)", "(nhập số thập phân, tối đa hai chữ số sau dấu phẩy nếu cần)");
export const join = (...parts) => T(parts.map((p) => p.ko).join(" "), parts.map((p) => p.vi).join(" "));
