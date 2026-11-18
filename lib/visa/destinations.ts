// The 66 countries LIFE.HELP serves (operator list, 2026-10-21): host slug, ISO 3166-1 alpha-2 code, English name. Localized names come from Intl.DisplayNames at render time.
export interface VisaDestination { slug: string; iso2: string; nameEn: string }
export const VISA_DESTINATIONS: readonly VisaDestination[] = [
  ["greece","GR","Greece"],["ghana","GH","Ghana"],["nigeria","NG","Nigeria"],["southafrica","ZA","South Africa"],["netherland","NL","Netherlands"],
  ["nepal","NP","Nepal"],["norway","NO","Norway"],["newzealand","NZ","New Zealand"],["taiwan","TW","Taiwan"],["denmark","DK","Denmark"],
  ["deutsch","DE","Germany"],["timorleste","TL","Timor-Leste"],["russia","RU","Russia"],["romania","RO","Romania"],["malaysia","MY","Malaysia"],
  ["mexico","MX","Mexico"],["mozambique","MZ","Mozambique"],["mongol","MN","Mongolia"],["us","US","United States"],["myanmar","MM","Myanmar"],
  ["bangladesh","BD","Bangladesh"],["venezuela","VE","Venezuela"],["vietnam","VN","Vietnam"],["brazil","BR","Brazil"],["saudiarabia","SA","Saudi Arabia"],
  ["srilanka","LK","Sri Lanka"],["sweden","SE","Sweden"],["swiss","CH","Switzerland"],["espania","ES","Spain"],["singapore","SG","Singapore"],
  ["uae","AE","United Arab Emirates"],["ethiopia","ET","Ethiopia"],["elsalvador","SV","El Salvador"],["uk","GB","United Kingdom"],["yemen","YE","Yemen"],
  ["uganda","UG","Uganda"],["uzbek","UZ","Uzbekistan"],["ukraina","UA","Ukraine"],["iraq","IQ","Iraq"],["iran","IR","Iran"],
  ["israel","IL","Israel"],["egypt","EG","Egypt"],["italia","IT","Italy"],["india","IN","India"],["indonesia","ID","Indonesia"],
  ["japan","JP","Japan"],["zambia","ZM","Zambia"],["china","CN","China"],["centralafrican","CF","Central African Republic"],["czech","CZ","Czechia"],
  ["kazakh","KZ","Kazakhstan"],["cambodia","KH","Cambodia"],["canada","CA","Canada"],["kenya","KE","Kenya"],["congo","CG","Republic of the Congo"],
  ["thailand","TH","Thailand"],["turkiye","TR","Türkiye"],["pakistan","PK","Pakistan"],["portugal","PT","Portugal"],["poland","PL","Poland"],
  ["france","FR","France"],["finland","FI","Finland"],["philippines","PH","Philippines"],["korea","KR","South Korea"],["hungary","HU","Hungary"],
  ["australia","AU","Australia"],
].map(([slug, iso2, nameEn]) => ({ slug, iso2, nameEn }));
