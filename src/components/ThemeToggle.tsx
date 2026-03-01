import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/lib/useTheme";

const options: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.value === theme) || options[2];
  const Icon = current.icon;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
        title="Theme"
        aria-label="Toggle theme"
      >
        <Icon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-32 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161630] shadow-xl z-50 overflow-hidden animate-in fade-in">
          {options.map((opt) => {
            const OptIcon = opt.icon;
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                  active ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <OptIcon className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
