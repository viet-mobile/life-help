// Master index of all localized legal documents across all platform languages
import type { LegalDoc, LegalKind } from '../documents';

import doc_af from './af.json';
import doc_am from './am.json';
import doc_ar from './ar.json';
import doc_arz from './arz.json';
import doc_as from './as.json';
import doc_az from './az.json';
import doc_bg from './bg.json';
import doc_bn from './bn.json';
import doc_ca from './ca.json';
import doc_ceb from './ceb.json';
import doc_cs from './cs.json';
import doc_da from './da.json';
import doc_de from './de.json';
import doc_el from './el.json';
import doc_es from './es.json';
import doc_et from './et.json';
import doc_eu from './eu.json';
import doc_fa from './fa.json';
import doc_fi from './fi.json';
import doc_fr from './fr.json';
import doc_gl from './gl.json';
import doc_gu from './gu.json';
import doc_ha from './ha.json';
import doc_he from './he.json';
import doc_hi from './hi.json';
import doc_hr from './hr.json';
import doc_hu from './hu.json';
import doc_id from './id.json';
import doc_ig from './ig.json';
import doc_is from './is.json';
import doc_it from './it.json';
import doc_ja from './ja.json';
import doc_jv from './jv.json';
import doc_ka from './ka.json';
import doc_kk from './kk.json';
import doc_km from './km.json';
import doc_kn from './kn.json';
import doc_ku from './ku.json';
import doc_lt from './lt.json';
import doc_lv from './lv.json';
import doc_mg from './mg.json';
import doc_mk from './mk.json';
import doc_ml from './ml.json';
import doc_mn from './mn.json';
import doc_mr from './mr.json';
import doc_ms from './ms.json';
import doc_my from './my.json';
import doc_ne from './ne.json';
import doc_nl from './nl.json';
import doc_no from './no.json';
import doc_om from './om.json';
import doc_pa from './pa.json';
import doc_pcm from './pcm.json';
import doc_pl from './pl.json';
import doc_ps from './ps.json';
import doc_pt from './pt.json';
import doc_ro from './ro.json';
import doc_ru from './ru.json';
import doc_sd from './sd.json';
import doc_sg from './sg.json';
import doc_si from './si.json';
import doc_sk from './sk.json';
import doc_sl from './sl.json';
import doc_sn from './sn.json';
import doc_so from './so.json';
import doc_sq from './sq.json';
import doc_sr from './sr.json';
import doc_su from './su.json';
import doc_sv from './sv.json';
import doc_sw from './sw.json';
import doc_ta from './ta.json';
import doc_te from './te.json';
import doc_tet from './tet.json';
import doc_tg from './tg.json';
import doc_th from './th.json';
import doc_tl from './tl.json';
import doc_tr from './tr.json';
import doc_uk from './uk.json';
import doc_ur from './ur.json';
import doc_uz from './uz.json';
import doc_vi from './vi.json';
import doc_xh from './xh.json';
import doc_yo from './yo.json';
import doc_yue from './yue.json';
import doc_zh_Hans from './zh-Hans.json';
import doc_zh_Hant from './zh-Hant.json';
import doc_zu from './zu.json';

export const ALL_LEGAL_TRANSLATIONS: Record<string, { privacy: LegalDoc; terms: LegalDoc }> = {
  "af": doc_af as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "am": doc_am as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ar": doc_ar as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "arz": doc_arz as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "as": doc_as as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "az": doc_az as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "bg": doc_bg as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "bn": doc_bn as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ca": doc_ca as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ceb": doc_ceb as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "cs": doc_cs as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "da": doc_da as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "de": doc_de as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "el": doc_el as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "es": doc_es as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "et": doc_et as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "eu": doc_eu as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "fa": doc_fa as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "fi": doc_fi as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "fr": doc_fr as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "gl": doc_gl as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "gu": doc_gu as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ha": doc_ha as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "he": doc_he as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "hi": doc_hi as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "hr": doc_hr as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "hu": doc_hu as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "id": doc_id as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ig": doc_ig as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "is": doc_is as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "it": doc_it as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ja": doc_ja as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "jv": doc_jv as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ka": doc_ka as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "kk": doc_kk as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "km": doc_km as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "kn": doc_kn as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ku": doc_ku as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "lt": doc_lt as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "lv": doc_lv as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "mg": doc_mg as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "mk": doc_mk as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ml": doc_ml as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "mn": doc_mn as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "mr": doc_mr as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ms": doc_ms as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "my": doc_my as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ne": doc_ne as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "nl": doc_nl as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "no": doc_no as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "om": doc_om as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "pa": doc_pa as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "pcm": doc_pcm as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "pl": doc_pl as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ps": doc_ps as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "pt": doc_pt as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ro": doc_ro as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ru": doc_ru as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "sd": doc_sd as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "sg": doc_sg as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "si": doc_si as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "sk": doc_sk as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "sl": doc_sl as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "sn": doc_sn as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "so": doc_so as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "sq": doc_sq as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "sr": doc_sr as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "su": doc_su as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "sv": doc_sv as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "sw": doc_sw as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ta": doc_ta as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "te": doc_te as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "tet": doc_tet as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "tg": doc_tg as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "th": doc_th as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "tl": doc_tl as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "tr": doc_tr as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "uk": doc_uk as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "ur": doc_ur as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "uz": doc_uz as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "vi": doc_vi as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "xh": doc_xh as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "yo": doc_yo as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "yue": doc_yue as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "zh-Hans": doc_zh_Hans as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "zh-Hant": doc_zh_Hant as unknown as { privacy: LegalDoc; terms: LegalDoc },
  "zu": doc_zu as unknown as { privacy: LegalDoc; terms: LegalDoc },
};
