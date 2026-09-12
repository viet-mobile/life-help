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

  const { locale } = useLocale();
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

  const formattedRegion = getLocalizedAddress(selectedRegion, locale);
  const shortRegionText = getLocalizedShortAddress(selectedRegion, locale);

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
 * Interactive 3-step Region Selector Modal:
 * Step 1: 시·도 (17)
 * Step 2: 시·군·구
 * Step 3: 읍·면·동
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
  const { locale } = useLocale();

  const [sido, setSido] = useState<string>(currentRegion.sido);
  const [gungu, setGungu] = useState<string>(currentRegion.gungu);
  const [dong, setDong] = useState<string>(currentRegion.dong);
  const [customDong, setCustomDong] = useState<string>("");

  const sidoList = useMemo(() => getLocalizedSidoList(locale), [locale]);
  const gunguList = useMemo(() => getLocalizedGunguList(sido, locale), [sido, locale]);
  const dongList = useMemo(() => getLocalizedDongList(sido, gungu, locale), [sido, gungu, locale]);
  const categoryHeaders = useMemo(() => getRegionCategoryHeaders(locale), [locale]);

  if (!isOpen) return null;

  const handleSidoClick = (sidoName: string) => {
    setSido(sidoName);
    const newGungus = getLocalizedGunguList(sidoName, locale);
    if (newGungus.length > 0) {
      const firstGungu = newGungus[0].ko;
      setGungu(firstGungu);
      const newDongs = getLocalizedDongList(sidoName, firstGungu, locale);
      setDong(newDongs[0]?.ko || "전체");
    }
  };

  const handleGunguClick = (gunguName: string) => {
    setGungu(gunguName);
    const newDongs = getLocalizedDongList(sido, gunguName, locale);
    if (newDongs.length > 0) {
      setDong(newDongs[0].ko);
    } else {
      setDong("전체");
    }
  };

  const handleDongClick = (dongName: string) => {
    setDong(dongName);
    setCustomDong("");
  };

  const handleConfirm = () => {
    const finalDong = customDong.trim() ? customDong.trim() : dong;
    onSelect({
      sido,
      gungu,
      dong: finalDong,
    });
  };

  const selectedSidoObj = sidoList.find((s) => s.ko === sido);
  const selectedGunguObj = gunguList.find((g) => g.ko === gungu);
  const selectedDongObj = dongList.find((d) => d.ko === dong);

  const previewSido = selectedSidoObj ? selectedSidoObj.display : sido;
  const previewGungu = selectedGunguObj ? selectedGunguObj.display : gungu;
  const previewDong = customDong.trim()
    ? formatRegionDisplay(
        customDong.trim(),
        romanizeKoreanRegion(customDong.trim()),
        customDong.trim(),
        locale
      )
    : selectedDongObj
    ? selectedDongObj.display
    : dong;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              {getRegionUIText("selectLocation", locale)}
            </h3>
            <p className="text-xs text-slate-500">
              {getRegionUIText("selectDescription", locale)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
              {previewSido} &gt; {previewGungu} &gt; {previewDong}
            </span>
          </div>
          <span className="text-xs text-blue-700 font-semibold shrink-0 ml-2">
            {getRegionUIText("selecting", locale)}
          </span>
        </div>

        {/* 3-Column Selector Body */}
        <div className="grid flex-1 grid-cols-3 overflow-hidden text-sm divide-x divide-slate-200 min-h-[340px]">
          {/* Column 1: 시·도 */}
          <div className="overflow-y-auto p-2 bg-slate-50">
            <div className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase">
              {categoryHeaders.sidoTitle}
            </div>
            <div className="mt-1 space-y-1">
              {sidoList.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => handleSidoClick(s.ko)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition sm:text-sm ${
                    sido === s.ko
                      ? "bg-blue-700 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {s.display}
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: 시·군·구 */}
          <div className="overflow-y-auto p-2 bg-white">
            <div className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase">
              {categoryHeaders.gunguTitle}
            </div>
            <div className="mt-1 space-y-1">
              {gunguList.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => handleGunguClick(g.ko)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition sm:text-sm ${
                    gungu === g.ko
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {g.display}
                </button>
              ))}
            </div>
          </div>

          {/* Column 3: 읍·면·동 */}
          <div className="overflow-y-auto p-2 bg-slate-50/50">
            <div className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase">
              {categoryHeaders.dongTitle}
            </div>
            <div className="mt-1 space-y-1">
              {dongList.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => handleDongClick(d.ko)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition sm:text-sm ${
                    dong === d.ko && !customDong
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {d.display}
                </button>
              ))}
            </div>

            {/* Direct write-in dong option */}
            <div className="mt-4 border-t border-slate-200 pt-3 px-1">
              <label className="block text-[11px] font-bold text-slate-500">
                {getRegionUIText("typeTown", locale)}
              </label>
              <input
                type="text"
                value={customDong}
                onChange={(e) => setCustomDong(e.target.value)}
                placeholder={getRegionUIText("townPlaceholder", locale)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 sm:text-sm"
          >
            {getRegionUIText("cancel", locale)}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-800 sm:text-sm"
          >
            {getRegionUIText("confirmLocation", locale)}
          </button>
        </div>
      </div>
    </div>
  );
}

