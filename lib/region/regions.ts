import { type CountryCode } from "./countries";
import { vietnamRegions } from "./vietnamRegions";
import { chinaRegions } from "./chinaRegions";
import { taiwanRegions } from "./taiwanRegions";
import { japanRegions } from "./japanRegions";
import { philippinesRegions } from "./philippinesRegions";
import { indonesiaRegions } from "./indonesiaRegions";

export interface GunguData {
  name: string;
  dongs: string[];
}

export interface SidoData {
  name: string;
  shortName: string;
  gunguList: GunguData[];
}

export interface RegionItem {
  country?: CountryCode;
  sido: string;
  gungu: string;
  dong: string;
}

export const defaultRegion: RegionItem = {
  country: "KR",
  sido: "전북특별자치도",
  gungu: "익산시",
  dong: "신동",
};

export const COUNTRY_SLUG_TO_CODE: Record<string, CountryCode> = {
  korea: "KR",
  vietnam: "VN",
  japan: "JP",
  china: "CN",
  taiwan: "TW",
  indonesia: "ID",
  philippines: "PH",
};

export const DEFAULT_COUNTRY_REGIONS: Record<CountryCode, RegionItem> = {
  KR: {
    country: "KR",
    sido: "전북특별자치도",
    gungu: "익산시",
    dong: "신동",
  },
  VN: {
    country: "VN",
    sido: "Thành phố Hồ Chí Minh",
    gungu: "Quận 1",
    dong: "Bến Nghé",
  },
  JP: {
    country: "JP",
    sido: "東京都",
    gungu: "新宿区",
    dong: "西新宿",
  },
  CN: {
    country: "CN",
    sido: "北京市",
    gungu: "朝阳区",
    dong: "三里屯街道",
  },
  TW: {
    country: "TW",
    sido: "臺北市",
    gungu: "信義區",
    dong: "西村里",
  },
  ID: {
    country: "ID",
    sido: "DKI Jakarta",
    gungu: "Jakarta Selatan",
    dong: "Senayan",
  },
  PH: {
    country: "PH",
    sido: "Metro Manila",
    gungu: "Makati",
    dong: "Bel-Air",
  },
};

export const koreanRegions: SidoData[] = [

  {
    name: "전북특별자치도",
    shortName: "전북",
    gunguList: [
      {
        name: "익산시",
        dongs: [
          "신동",
          "영등동",
          "모현동",
          "어양동",
          "남중동",
          "마동",
          "송학동",
          "인화동",
          "평화동",
          "동산동",
          "중앙동",
          "창인동",
          "팔봉동",
          "삼성동",
          "황등면",
          "함열읍",
          "오산면",
          "금마면",
          "왕궁면",
          "춘포면",
        ],
      },
      {
        name: "전주시 덕진구",
        dongs: [
          "송천동",
          "인후동",
          "덕진동",
          "금암동",
          "호성동",
          "우아동",
          "팔복동",
          "여의동",
          "조촌동",
          "혁신동",
        ],
      },
      {
        name: "전주시 완산구",
        dongs: [
          "효자동",
          "서신동",
          "중화산동",
          "삼천동",
          "평화동",
          "중앙동",
          "풍남동",
          "노송동",
          "완산동",
        ],
      },
      {
        name: "군산시",
        dongs: [
          "나운동",
          "수송동",
          "조촌동",
          "미룡동",
          "산북동",
          "지곡동",
          "소룡동",
          "경암동",
          "구암동",
          "대야면",
          "옥구읍",
        ],
      },
      {
        name: "완주군",
        dongs: [
          "봉동읍",
          "삼례읍",
          "이서면",
          "용진읍",
          "상관면",
          "구이면",
          "고산면",
          "소양면",
        ],
      },
      {
        name: "정읍시",
        dongs: ["연지동", "수성동", "상동", "시기동", "내장상동", "신태인읍"],
      },
      {
        name: "남원시",
        dongs: ["도통동", "향교동", "죽항동", "노암동", "운봉읍"],
      },
      {
        name: "김제시",
        dongs: ["요촌동", "신풍동", "검산동", "교월동", "만경읍"],
      },
    ],
  },
  {
    name: "서울특별시",
    shortName: "서울",
    gunguList: [
      {
        name: "강남구",
        dongs: ["역삼동", "논현동", "삼성동", "대치동", "청담동", "신사동", "압구정동", "도곡동", "개포동"],
      },
      {
        name: "구로구",
        dongs: ["구로동", "가리봉동", "개봉동", "오류동", "신도림동", "온수동", "천왕동", "항동"],
      },
      {
        name: "영등포구",
        dongs: ["영등포동", "대림동", "신길동", "문래동", "당산동", "여의도동", "양평동", "도림동"],
      },
      {
        name: "관악구",
        dongs: ["신림동", "봉천동", "낙성대동", "남현동", "서원동", "신원동", "난곡동", "대학동"],
      },
      {
        name: "마포구",
        dongs: ["서교동", "합정동", "연남동", "망원동", "공덕동", "상암동", "아현동", "도화동"],
      },
      {
        name: "광진구",
        dongs: ["화양동", "자양동", "군자동", "중곡동", "구의동", "광장동", "능동"],
      },
      {
        name: "동대문구",
        dongs: ["제기동", "전농동", "답십리동", "장안동", "청량리동", "회기동", "휘경동", "이문동"],
      },
      {
        name: "용산구",
        dongs: ["이태원동", "한남동", "후암동", "남영동", "청파동", "원효로동", "한강로동", "이촌동"],
      },
      {
        name: "서대문구",
        dongs: ["신촌동", "연희동", "홍제동", "홍은동", "남가좌동", "북가좌동", "충현동"],
      },
      {
        name: "송파구",
        dongs: ["잠실동", "가락동", "문정동", "방이동", "석촌동", "삼전동", "풍납동", "장지동"],
      },
      {
        name: "강서구",
        dongs: ["화곡동", "등촌동", "가양동", "염창동", "발산동", "우장산동", "방화동", "공항동"],
      },
    ],
  },
  {
    name: "경기도",
    shortName: "경기",
    gunguList: [
      {
        name: "수원시",
        dongs: ["매산동", "인계동", "화서동", "고등동", "세류동", "권선동", "영통동", "망포동", "정자동"],
      },
      {
        name: "안산시",
        dongs: ["원곡동", "초지동", "고잔동", "중앙동", "본오동", "선부동", "와동", "신길동", "사동"],
      },
      {
        name: "성남시",
        dongs: ["서현동", "수내동", "정자동", "야탑동", "판교동", "모란동", "신흥동", "태평동", "상대원동"],
      },
      {
        name: "화성시",
        dongs: ["향남읍", "남양읍", "봉담읍", "동탄동", "병점동", "우정읍", "송산면", "팔탄면"],
      },
      {
        name: "평택시",
        dongs: ["서정동", "송탄동", "비전동", "팽성읍", "안중읍", "포승읍", "고덕면", "청북읍"],
      },
      {
        name: "시흥시",
        dongs: ["정왕동", "배곧동", "은행동", "대야동", "신천동", "목감동", "능곡동", "거모동"],
      },
      {
        name: "부천시",
        dongs: ["중동", "상동", "심곡동", "원미동", "소사동", "역곡동", "송내동", "도당동"],
      },
      {
        name: "김포시",
        dongs: ["사우동", "풍무동", "걸포동", "고촌읍", "통진읍", "양촌읍", "장기동", "구래동", "운양동"],
      },
      {
        name: "고양시",
        dongs: ["일산동", "백석동", "마두동", "주엽동", "화정동", "행신동", "대화동", "삼송동"],
      },
      {
        name: "용인시",
        dongs: ["수지구 풍덕천동", "기흥구 신갈동", "기흥구 구갈동", "처인구 김량장동", "처인구 포곡읍"],
      },
    ],
  },
  {
    name: "인천광역시",
    shortName: "인천",
    gunguList: [
      {
        name: "부평구",
        dongs: ["부평동", "십정동", "산곡동", "청천동", "갈산동", "삼산동", "부개동"],
      },
      {
        name: "남동구",
        dongs: ["구월동", "간석동", "만수동", "논현동", "서창동", "고잔동"],
      },
      {
        name: "미추홀구",
        dongs: ["주안동", "숭의동", "용현동", "학익동", "도화동", "관교동"],
      },
      {
        name: "서구",
        dongs: ["청라동", "검단동", "가정동", "석남동", "가좌동", "연희동", "당하동"],
      },
      {
        name: "연수구",
        dongs: ["송도동", "연수동", "청학동", "동춘동", "옥련동", "선학동"],
      },
    ],
  },
  {
    name: "부산광역시",
    shortName: "부산",
    gunguList: [
      {
        name: "부산진구",
        dongs: ["부전동", "전포동", "양정동", "범천동", "가야동", "개금동", "당감동"],
      },
      {
        name: "해운대구",
        dongs: ["우동", "중동", "좌동", "송정동", "반여동", "재송동"],
      },
      {
        name: "사하구",
        dongs: ["하단동", "당리동", "괴정동", "신평동", "장림동", "다대동"],
      },
      {
        name: "동래구",
        dongs: ["온천동", "사직동", "수안동", "명륜동", "안락동"],
      },
    ],
  },
  {
    name: "대구광역시",
    shortName: "대구",
    gunguList: [
      {
        name: "달서구",
        dongs: ["두류동", "본리동", "감삼동", "죽전동", "이곡동", "신당동", "월성동", "진천동", "상인동"],
      },
      {
        name: "북구",
        dongs: ["산격동", "복현동", "대현동", "침산동", "칠성동", "태전동", "구암동", "동천동"],
      },
      {
        name: "수성구",
        dongs: ["범어동", "만촌동", "수성동", "황금동", "지산동", "범물동", "시지동"],
      },
    ],
  },
  {
    name: "광주광역시",
    shortName: "광주",
    gunguList: [
      {
        name: "광산구",
        dongs: ["송정동", "우산동", "월곡동", "첨단동", "수완동", "신가동", "하남동", "운남동"],
      },
      {
        name: "북구",
        dongs: ["용봉동", "운암동", "중흥동", "문흥동", "두암동", "일곡동", "양산동"],
      },
      {
        name: "서구",
        dongs: ["치평동", "상무동", "화정동", "금호동", "풍암동", "농성동", "광천동"],
      },
    ],
  },
  {
    name: "대전광역시",
    shortName: "대전",
    gunguList: [
      {
        name: "유성구",
        dongs: ["온천동", "노은동", "신성동", "전민동", "관평동", "원신흥동", "봉명동"],
      },
      {
        name: "서구",
        dongs: ["둔산동", "월평동", "갈마동", "탄방동", "괴정동", "도마동", "가수원동", "관저동"],
      },
    ],
  },
  {
    name: "울산광역시",
    shortName: "울산",
    gunguList: [
      {
        name: "남구",
        dongs: ["삼산동", "달동", "신정동", "옥동", "무거동", "야음동"],
      },
      {
        name: "중구",
        dongs: ["성남동", "옥교동", "태화동", "유곡동", "반구동", "학성동"],
      },
      {
        name: "북구",
        dongs: ["농소동", "화봉동", "송정동", "효문동", "양정동"],
      },
    ],
  },
  {
    name: "세종특별자치시",
    shortName: "세종",
    gunguList: [
      {
        name: "세종시",
        dongs: ["조치원읍", "나성동", "새롬동", "다정동", "아름동", "종촌동", "보람동", "도담동", "어진동"],
      },
    ],
  },
  {
    name: "충청남도",
    shortName: "충남",
    gunguList: [
      {
        name: "천안시",
        dongs: ["두정동", "불당동", "신부동", "백석동", "쌍용동", "성정동", "신방동", "성환읍", "직산읍"],
      },
      {
        name: "아산시",
        dongs: ["온천동", "배방읍", "탕정면", "둔포면", "신창면", "음봉면"],
      },
      {
        name: "당진시",
        dongs: ["당진동", "송악읍", "합덕읍", "송산면", "신평면"],
      },
      {
        name: "서산시",
        dongs: ["동문동", "읍내동", "석림동", "예천동", "대산읍"],
      },
    ],
  },
  {
    name: "충청북도",
    shortName: "충북",
    gunguList: [
      {
        name: "청주시",
        dongs: ["가경동", "복대동", "율량동", "오창읍", "오송읍", "용암동", "사창동", "분평동", "산남동"],
      },
      {
        name: "충주시",
        dongs: ["연수동", "교현동", "칠금동", "호암동", "문화동", "주덕읍"],
      },
      {
        name: "진천군",
        dongs: ["진천읍", "덕산읍", "광혜원면", "이월면"],
      },
      {
        name: "음성군",
        dongs: ["음성읍", "금왕읍", "대소면", "맹동면", "삼성면"],
      },
    ],
  },
  {
    name: "전라남도",
    shortName: "전남",
    gunguList: [
      {
        name: "여수시",
        dongs: ["학동", "여서동", "문수동", "신기동", "시전동", "미평동", "돌산읍"],
      },
      {
        name: "순천시",
        dongs: ["조례동", "연향동", "덕월동", "생목동", "매곡동", "해룡면"],
      },
      {
        name: "목포시",
        dongs: ["하당동", "상동", "옥암동", "용해동", "연산동", "북항동"],
      },
      {
        name: "나주시",
        dongs: ["빛가람동(혁신도시)", "송월동", "금남동", "남평읍"],
      },
      {
        name: "영암군",
        dongs: ["삼호읍", "영암읍", "학산면"],
      },
    ],
  },
  {
    name: "경상북도",
    shortName: "경북",
    gunguList: [
      {
        name: "포항시",
        dongs: ["이동", "효자동", "양학동", "죽도동", "장량동", "두호동", "오천읍", "연일읍", "흥해읍"],
      },
      {
        name: "구미시",
        dongs: ["인동동", "진미동", "양포동", "원평동", "송정동", "형곡동", "옥계동", "고아읍"],
      },
      {
        name: "경주시",
        dongs: ["동천동", "황성동", "용강동", "성건동", "황오동", "안강읍", "외동읍"],
      },
      {
        name: "경산시",
        dongs: ["중방동", "서부동", "북부동", "하양읍", "진량읍", "압량읍"],
      },
    ],
  },
  {
    name: "경상남도",
    shortName: "경남",
    gunguList: [
      {
        name: "창원시",
        dongs: ["상남동", "중앙동", "팔용동", "합성동", "양덕동", "월영동", "석동", "용원동"],
      },
      {
        name: "김해시",
        dongs: ["내외동", "북부동", "활천동", "삼안동", "장유동", "진영읍", "진례면"],
      },
      {
        name: "양산시",
        dongs: ["물금읍", "중앙동", "양주동", "삼성동", "평산동", "덕계동"],
      },
      {
        name: "거제시",
        dongs: ["고현동", "장평동", "옥포동", "아주동", "상문동", "수양동"],
      },
    ],
  },
  {
    name: "강원특별자치도",
    shortName: "강원",
    gunguList: [
      {
        name: "원주시",
        dongs: ["단계동", "무실동", "단구동", "반곡관설동(혁신도시)", "명륜동", "일산동", "문막읍"],
      },
      {
        name: "춘천시",
        dongs: ["퇴계동", "석사동", "후평동", "효자동", "강남동", "신사우동", "신북읍"],
      },
      {
        name: "강릉시",
        dongs: ["교동", "포남동", "옥천동", "중앙동", "홍제동", "초당동", "주문진읍"],
      },
    ],
  },
  {
    name: "제주특별자치도",
    shortName: "제주",
    gunguList: [
      {
        name: "제주시",
        dongs: ["노형동", "연동", "아라동", "이도동", "일도동", "삼도동", "애월읍", "한림읍", "조천읍"],
      },
      {
        name: "서귀포시",
        dongs: ["동홍동", "서홍동", "대륜동", "대천동", "중문동", "대정읍", "남원읍", "성산읍"],
      },
    ],
  },
];

export function getCountryRegions(country: CountryCode = "KR"): SidoData[] {
  switch (country) {
    case "VN":
      return vietnamRegions;
    case "CN":
      return chinaRegions;
    case "TW":
      return taiwanRegions;
    case "JP":
      return japanRegions;
    case "PH":
      return philippinesRegions;
    case "ID":
      return indonesiaRegions;
    case "KR":
    default:
      return koreanRegions;
  }
}

export function findSido(sidoName: string, country: CountryCode = "KR"): SidoData | undefined {
  const regions = getCountryRegions(country);
  return regions.find(
    (s) => s.name === sidoName || s.shortName === sidoName || sidoName.includes(s.shortName),
  );
}

export function findGungu(sidoName: string, gunguName: string, country: CountryCode = "KR"): GunguData | undefined {
  const sido = findSido(sidoName, country);
  if (!sido) return undefined;
  return sido.gunguList.find(
    (g) => g.name === gunguName || g.name.includes(gunguName) || gunguName.includes(g.name),
  );
}


