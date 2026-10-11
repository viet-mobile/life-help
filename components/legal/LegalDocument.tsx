import { LEGAL_DOCS, type LegalBlock, type LegalKind, type LegalLang } from "@/lib/legal/documents";
import { LEGAL_VERSION, OPERATOR } from "@/lib/legal/operator";

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((b, i) =>
        typeof b === "string" ? (
          <p key={i}>{b}</p>
        ) : (
          <ul key={i}>
            {b.list.map((item, j) => <li key={j}>{item}</li>)}
          </ul>
        ),
      )}
    </>
  );
}

/** One privacy / terms document in the given languages (first = primary). Plain semantic HTML; styling comes from the wrapper class. */
export function LegalDocument({ kind, langs, className = "" }: { kind: LegalKind; langs: LegalLang[]; className?: string }) {
  return (
    <div className={`legal-doc ${className}`}>
      {langs.map((lang) => {
        const doc = LEGAL_DOCS[kind][lang];
        const effective = OPERATOR.effectiveDate || (lang === "ko" ? "서비스 정식 시작 시 시행(초안)" : "takes effect at launch (draft)");
        return (
          <article key={lang} lang={lang} id={`${kind}-${lang}`} className="legal-article">
            <h1>{doc.title}</h1>
            <p className="legal-meta">
              {lang === "ko" ? `버전 ${LEGAL_VERSION} · 시행일: ${effective}` : `Version ${LEGAL_VERSION} · Effective: ${effective}`}
            </p>
            <p>{doc.intro}</p>
            {doc.sections.map((s) => (
              <section key={s.id} id={`${kind}-${lang}-${s.id}`}>
                <h2>{s.title}</h2>
                <Blocks blocks={s.body} />
              </section>
            ))}
          </article>
        );
      })}
    </div>
  );
}
