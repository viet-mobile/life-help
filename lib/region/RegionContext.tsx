"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  type RegionItem,
  defaultRegion,
} from "./regions";
import {
  type CountryCode,
  COUNTRIES,
  getCountryInfo,
  getCountryDisplayName,
} from "./countries";
import { useLocale } from "@/lib/i18n/LocaleContext";
import {
  getLocalizedAddress,
  getLocalizedShortAddress,
  getLocalizedSidoList,
  getLocalizedGunguList,
  getLocalizedDongList,
  formatRegionDisplay,
  romanizeKoreanRegion,
  getRegionCategoryHeaders,
  getRegionUIText,
} from "./regionLocalization";

interface RegionContextType {
  selectedRegion: RegionItem;
  setRegion: (region: RegionItem) => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  formattedRegion: string;
  shortRegionText: string;
}

const RegionContext = createContext<RegionContextType | null>(null);

const REGION_STORAGE_KEY = "life_help_selected_region";
const REGION_CHANGE_EVENT = "life_help_region_change";

let cachedRegion: RegionItem | null = null;

function getClientRegionSnapshot(): RegionItem {
  if (cachedRegion) return cachedRegion;
  try {
    const saved = localStorage.getItem(REGION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.sido && parsed.gungu && parsed.dong) {
        if (!parsed.country) parsed.country = "KR";
        cachedRegion = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  cachedRegion = defaultRegion;
  return defaultRegion;
}

function getServerRegionSnapshot(): RegionItem {
  return defaultRegion;
}

function subscribe(callback: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === REGION_STORAGE_KEY) {
      cachedRegion = null;
      callback();
    }
  };

  const handleCustom = () => {
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(REGION_CHANGE_EVENT, handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(REGION_CHANGE_EVENT, handleCustom);
  };
}

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const selectedRegion = useSyncExternalStore(
    subscribe,
    getClientRegionSnapshot,
    getServerRegionSnapshot,
  );

  const { locale, isBilingual } = useLocale();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const setRegion = useCallback((newRegion: RegionItem) => {
    cachedRegion = newRegion;
    try {
      localStorage.setItem(REGION_STORAGE_KEY, JSON.stringify(newRegion));
      window.dispatchEvent(new Event(REGION_CHANGE_EVENT));
    } catch {
      // ignore
    }
  }, []);

  const formattedRegion = getLocalizedAddress(selectedRegion, locale, isBilingual);
  const shortRegionText = getLocalizedShortAddress(selectedRegion, locale, isBilingual);

  return (
    <RegionContext.Provider
      value={{
        selectedRegion,
        setRegion,
        isModalOpen,
        openModal,
        closeModal,
        formattedRegion,
        shortRegionText,
      }}
    >
      {children}
      <RegionSelectorModal
        isOpen={isModalOpen}
        onClose={closeModal}
        currentRegion={selectedRegion}
        onSelect={(r) => {
          setRegion(r);
          closeModal();
        }}
      />
    </RegionContext.Provider>
  );
}

export function useRegion(): RegionContextType {
  const ctx = useContext(RegionContext);
  if (!ctx) {
    return {
      selectedRegion: defaultRegion,
      setRegion: () => {},
      isModalOpen: false,
      openModal: () => {},
      closeModal: () => {},
      formattedRegion: `${defaultRegion.sido} ${defaultRegion.gungu} ${defaultRegion.dong}`,
      shortRegionText: `${defaultRegion.gungu} ${defaultRegion.dong}`,
    };
  }
  return ctx;
}

/**
 * Interactive 4-step Region Selector Modal:
 * Step 0: 국가 (Country - KR, VN, CN, TW, JP, PH, ID)
 * Step 1: 시·도 / Province / State
 * Step 2: 시·군·구 / District / City
 * Step 3: 읍·면·동 / Ward / Barangay / Village + Write-in
 */
function RegionSelectorModal({
  isOpen,
  onClose,
  currentRegion,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentRegion: RegionItem;
  onSelect: (region: RegionItem) => void;
}) {
  const { locale, isBilingual } = useLocale();

  const [country, setCountry] = useState<CountryCode>(currentRegion.country || "KR");
  const [sido, setSido] = useState<string>(currentRegion.sido);
  const [gungu, setGungu] = useState<string>(currentRegion.gungu);
  const [dong, setDong] = useState<string>(currentRegion.dong);
  const [customDong, setCustomDong] = useState<string>("");

  // Sync state with currentRegion when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const initialCountry = currentRegion.country || "KR";
      setCountry(initialCountry);
      setSido(currentRegion.sido);
      setGungu(currentRegion.gungu);
      setDong(currentRegion.dong);
      setCustomDong("");
    }
  }, [isOpen, currentRegion]);

  const countryInfo = useMemo(() => getCountryInfo(country), [country]);
  const sidoList = useMemo(() => getLocalizedSidoList(locale, isBilingual, country), [locale, isBilingual, country]);
  const gunguList = useMemo(() => getLocalizedGunguList(sido, locale, isBilingual, country), [sido, locale, isBilingual, country]);
  const dongList = useMemo(() => getLocalizedDongList(sido, gungu, locale, isBilingual, country), [sido, gungu, locale, isBilingual, country]);
  const categoryHeaders = useMemo(() => getRegionCategoryHeaders(locale, isBilingual), [locale, isBilingual]);

  if (!isOpen) return null;

  const handleCountryClick = (newCountry: CountryCode) => {
    if (newCountry === country) return;
    setCountry(newCountry);
    const newSidos = getLocalizedSidoList(locale, isBilingual, newCountry);
    if (newSidos.length > 0) {
      const firstSido = newSidos[0].key;
      setSido(firstSido);
      const newGungus = getLocalizedGunguList(firstSido, locale, isBilingual, newCountry);
      if (newGungus.length > 0) {
        const firstGungu = newGungus[0].key;
        setGungu(firstGungu);
        const newDongs = getLocalizedDongList(firstSido, firstGungu, locale, isBilingual, newCountry);
        setDong(newDongs[0]?.key || "");
      } else {
        setGungu("");
        setDong("");
      }
    } else {
      setSido("");
      setGungu("");
      setDong("");
    }
    setCustomDong("");
  };

  const handleSidoClick = (sidoName: string) => {
    setSido(sidoName);
    const newGungus = getLocalizedGunguList(sidoName, locale, isBilingual, country);
    if (newGungus.length > 0) {
      const firstGungu = newGungus[0].key;
      setGungu(firstGungu);
      const newDongs = getLocalizedDongList(sidoName, firstGungu, locale, isBilingual, country);
      setDong(newDongs[0]?.key || "");
    } else {
      setGungu("");
      setDong("");
    }
    setCustomDong("");
  };

  const handleGunguClick = (gunguName: string) => {
    setGungu(gunguName);
    const newDongs = getLocalizedDongList(sido, gunguName, locale, isBilingual, country);
    if (newDongs.length > 0) {
      setDong(newDongs[0].key);
    } else {
      setDong("");
    }
    setCustomDong("");
  };

  const handleDongClick = (dongName: string) => {
    setDong(dongName);
    setCustomDong("");
  };

  const handleConfirm = () => {
    const finalDong = customDong.trim() ? customDong.trim() : dong;
    onSelect({
      country,
      sido,
      gungu,
      dong: finalDong,
    });
  };

  const selectedSidoObj = sidoList.find((s) => s.key === sido);
  const selectedGunguObj = gunguList.find((g) => g.key === gungu);
  const selectedDongObj = dongList.find((d) => d.key === dong);

  const previewSido = selectedSidoObj ? selectedSidoObj.display : sido;
  const previewGungu = selectedGunguObj ? selectedGunguObj.display : gungu;
  const previewDong = customDong.trim()
    ? (country === "KR"
        ? formatRegionDisplay(
            customDong.trim(),
            romanizeKoreanRegion(customDong.trim()),
            customDong.trim(),
            locale,
            isBilingual
          )
        : customDong.trim())
    : selectedDongObj
    ? selectedDongObj.display
    : dong;

  const countryDisplayName = getCountryDisplayName(countryInfo, locale);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl lg:max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              {getRegionUIText("selectLocation", locale, isBilingual)}
            </h3>
            <p className="text-xs text-slate-500">
              {getRegionUIText("selectDescription", locale, isBilingual)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Current Selected Preview Badge */}
        <div className="bg-blue-50/80 px-6 py-3 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-900 overflow-x-auto whitespace-nowrap py-0.5">
            <span>📍</span>
            <span>
              {countryDisplayName} {previewSido ? `> ${previewSido}` : ""} {previewGungu ? `> ${previewGungu}` : ""} {previewDong ? `> ${previewDong}` : ""}
            </span>
          </div>
          <span className="text-xs text-blue-700 font-semibold shrink-0 ml-2">
            {getRegionUIText("selecting", locale, isBilingual)}
          </span>
        </div>

        {/* 4-Column Selector Body with horizontal scroll support on narrow screens */}
        <div className="overflow-x-auto flex-1 min-h-[360px]">
          <div className="grid grid-cols-4 min-w-[620px] md:min-w-full h-full divide-x divide-slate-200 text-sm">
            {/* Column 1: 국가 (Country) */}
            <div className="overflow-y-auto p-2 bg-slate-100/70">
              <div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase">
                {categoryHeaders.countryTitle}
              </div>
              <div className="mt-1 space-y-1">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountryClick(c.code)}
                    className={`w-full rounded-lg px-2.5 py-2 text-left text-xs font-bold transition sm:text-sm flex items-center gap-2 cursor-pointer ${
                      country === c.code
                        ? "bg-blue-800 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="truncate">{getCountryDisplayName(c, locale)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: 1단계 (시·도 / Province / State) */}
            <div className="overflow-y-auto p-2 bg-slate-50">
              <div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase truncate">
                {country === "KR" ? categoryHeaders.sidoTitle : countryInfo.level1Category}
              </div>
              <div className="mt-1 space-y-1">
                {sidoList.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => handleSidoClick(s.key)}
                    className={`w-full rounded-lg px-2.5 py-2 text-left text-xs font-bold transition sm:text-sm truncate cursor-pointer ${
                      sido === s.key
                        ? "bg-blue-700 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-200"
                    }`}
                    title={s.display}
                  >
                    {s.display}
                  </button>
                ))}
              </div>
            </div>

            {/* Column 3: 2단계 (시·군·구 / District / City) */}
            <div className="overflow-y-auto p-2 bg-white">
              <div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase truncate">
                {country === "KR" ? categoryHeaders.gunguTitle : countryInfo.level2Category}
              </div>
              <div className="mt-1 space-y-1">
                {gunguList.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => handleGunguClick(g.key)}
                    className={`w-full rounded-lg px-2.5 py-2 text-left text-xs font-bold transition sm:text-sm truncate cursor-pointer ${
                      gungu === g.key
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    title={g.display}
                  >
                    {g.display}
                  </button>
                ))}
              </div>
            </div>

            {/* Column 4: 3단계 (읍·면·동 / Ward / Barangay / Village) */}
            <div className="overflow-y-auto p-2 bg-slate-50/50">
              <div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase truncate">
                {country === "KR" ? categoryHeaders.dongTitle : countryInfo.level3Category}
              </div>
              <div className="mt-1 space-y-1">
                {dongList.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => handleDongClick(d.key)}
                    className={`w-full rounded-lg px-2.5 py-2 text-left text-xs font-bold transition sm:text-sm truncate cursor-pointer ${
                      dong === d.key && !customDong
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    title={d.display}
                  >
                    {d.display}
                  </button>
                ))}
              </div>

              {/* Direct write-in dong option */}
              <div className="mt-4 border-t border-slate-200 pt-3 px-1">
                <label className="block text-[11px] font-bold text-slate-500">
                  {getRegionUIText("typeTown", locale, isBilingual)}
                </label>
                <input
                  type="text"
                  value={customDong}
                  onChange={(e) => setCustomDong(e.target.value)}
                  placeholder={getRegionUIText("townPlaceholder", locale, isBilingual)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 sm:text-sm cursor-pointer"
          >
            {getRegionUIText("cancel", locale, isBilingual)}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-800 sm:text-sm cursor-pointer"
          >
            {getRegionUIText("confirmLocation", locale, isBilingual)}
          </button>
        </div>
      </div>
    </div>
  );
}


