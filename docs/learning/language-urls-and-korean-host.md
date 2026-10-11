# Language URLs, metadata and korean.life.help

## Language in the URL (math / english / study.korean / korean.life.help)

`https://math.life.help/en`, `/vi`, `/ur`, `/zh-Hans` ... (every locale of `messages/registry.ts`, any case; `zs` / `zt` / `zh` are accepted
for the Chinese variants) serve the site in that language. The proxy strips the prefix before routing and passes it to the server as
`x-learn-locale` (a client-supplied value is discarded), so the HTML itself carries that language's `<title>`, description, Open Graph /
Twitter preview, `<html lang>` / `dir`, `rel=canonical` and `hreflang` alternates for every locale - what a link preview or crawler sees
without cookies. The language link also writes the same cookie as the language switcher, in-page links keep the prefix, and the switcher
moves to the same page under the new prefix. Without a prefix nothing changes (math / english default to Korean, study.korean to English).

## korean.life.help

`korean.life.help` is the REPRESENTATIVE address of the Korean study site (`lib/learn/hosts.ts`, first production entry): the Study chooser,
the cross-site links, the Vietnamese entry alias (`hoc.tieng.han.viet.mobile`) and every canonical / hreflang / og:url name it.
`study.korean.life.help` keeps serving the same site but is not redirected (guest progress lives per origin) and is never named in metadata.
A one-level host is covered by the zone's wildcard certificate (the two-level `study.korean.life.help` is not).

The hostname is registered in Cloudflare by the operator (not by the repository). If it must be redone:
1. Cloudflare dashboard -> Workers & Pages -> `life-help` -> Settings -> Domains & Routes -> Add -> Custom domain -> `korean.life.help`
   (DNS record and certificate are created automatically).
2. Do it together with (or right after) the release that contains this code. Before that release the production Worker does not know the
   host and would answer with the main LIFE.HELP site.
3. Check: `https://korean.life.help/en` shows the English metadata of the Korean study site, `https://korean.life.help/` its default.
