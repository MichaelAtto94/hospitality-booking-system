"use client";

import { Check, Monitor, Moon, Settings2, Sun, Type, X } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type FontSize = "small" | "standard" | "large";

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const fontSizes: { value: FontSize; label: string; sample: string }[] = [
  { value: "small", label: "Small", sample: "A" },
  { value: "standard", label: "Standard", sample: "A" },
  { value: "large", label: "Large", sample: "A" },
];

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.themePreference = theme;
}

function applyFontSize(size: FontSize) {
  document.documentElement.dataset.fontSize = size;
}

export function AppearanceControls() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [fontSize, setFontSize] = useState<FontSize>("standard");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = (localStorage.getItem("zedstay-theme") as Theme | null) ?? "light";
      const savedFont = (localStorage.getItem("zedstay-font-size") as FontSize | null) ?? "standard";
      setTheme(savedTheme);
      setFontSize(savedFont);
      applyTheme(savedTheme);
      applyFontSize(savedFont);
    }, 0);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => {
      const selected = (localStorage.getItem("zedstay-theme") as Theme | null) ?? "light";
      if (selected === "system") applyTheme("system");
    };
    media.addEventListener("change", updateSystemTheme);
    return () => {
      window.clearTimeout(timer);
      media.removeEventListener("change", updateSystemTheme);
    };
  }, []);

  function selectTheme(value: Theme) {
    setTheme(value);
    localStorage.setItem("zedstay-theme", value);
    applyTheme(value);
  }

  function selectFontSize(value: FontSize) {
    setFontSize(value);
    localStorage.setItem("zedstay-font-size", value);
    applyFontSize(value);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Appearance settings"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-200 hover:text-blue-700"
      >
        <Settings2 size={18} />
      </button>

      {open && (
        <>
          <button aria-label="Close appearance settings" onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default" />
          <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="font-black text-slate-950">Appearance</p>
                <p className="text-xs text-slate-500">Personalise your workspace</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={17} />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <section>
                <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <Sun size={14} /> Colour theme
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {themes.map(({ value, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => selectTheme(value)}
                      className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-bold ${theme === value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      <Icon size={19} />
                      {label}
                      {theme === value && <Check size={12} className="absolute right-1.5 top-1.5" />}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <Type size={14} /> Text size
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {fontSizes.map(({ value, label, sample }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => selectFontSize(value)}
                      className={`relative flex flex-col items-center gap-1 rounded-xl border p-3 font-bold ${fontSize === value ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      <span className={value === "small" ? "text-sm" : value === "large" ? "text-2xl" : "text-lg"}>{sample}</span>
                      <span className="text-[10px]">{label}</span>
                      {fontSize === value && <Check size={12} className="absolute right-1.5 top-1.5" />}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
