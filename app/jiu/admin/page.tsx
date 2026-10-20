import { isJiuAdmin } from "@/lib/jiu/admin";
import { login, logout } from "./actions";
import "../jiu.css";
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const admin = await isJiuAdmin();
  const { error } = await searchParams;
  return <main className="jiu-shell"><header className="jiu-header"><a href="/jiu" className="jiu-logo">jiu<span>관리자</span></a></header><section className="jiu-admin"><h1>{admin ? "관리자 jiu" : "관리자 로그인"}</h1>{admin ? <><p>관리자 인증과 이 브라우저의 이메일 자동 저장 연결이 완료되었습니다.</p><p>학습 일지는 브라우저에 저장되며, 새 활동과 소감은 약 5분 간격으로 jiubag850@gmail.com으로 발송됩니다. 학습 사이트나 블로그가 열려 있을 때 동작합니다. 연결은 90일간 유지되며 로그아웃하면 해제됩니다.</p><p><a href="/jiu">학습 블로그로 이동 →</a></p><form action={logout}><button>로그아웃</button></form></> : <form action={login}><label>아이디<input name="username" autoComplete="username" required defaultValue="jiu" /></label><label>비밀번호<input name="password" type="password" autoComplete="current-password" required maxLength={256} /></label>{error && <p role="alert">{error === "limited" ? "로그인 시도가 많습니다. 15분 후 다시 시도하세요." : "아이디 또는 비밀번호를 확인해 주세요."}</p>}<button type="submit">로그인</button></form>}</section></main>;
}
