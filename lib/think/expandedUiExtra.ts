import pcm from './expanded-ui-extra/pcm.json';
import tl from './expanded-ui-extra/tl.json';
import ro from './expanded-ui-extra/ro.json';
import fi from './expanded-ui-extra/fi.json';
import cs from './expanded-ui-extra/cs.json';
import hu from './expanded-ui-extra/hu.json';
import af from './expanded-ui-extra/af.json';
import type { ExpandedThinkLang, ThinkLang } from './lang';
export const EXPANDED_UI_EXTRA = {pcm,tl,ro,fi,cs,hu,af} as const;
export type CoreThinkLang = Exclude<ThinkLang, ExpandedThinkLang>;
type ExtraPack = (typeof EXPANDED_UI_EXTRA)[ExpandedThinkLang];
/** Every added language has an actual pack. This helper never substitutes another language. */
export function extendThinkLabels<T>(core: Record<CoreThinkLang,T>, pick: (pack: ExtraPack)=>T): Record<ThinkLang,T> {
 return {...core,...Object.fromEntries(Object.entries(EXPANDED_UI_EXTRA).map(([locale,pack])=>[locale,pick(pack)]))} as Record<ThinkLang,T>;
}
export const formatThinkExtra = (s:string, values:Record<string,string|number>) => s.replace(/\{(\w+)\}/g,(_,key)=>String(values[key]??''));
