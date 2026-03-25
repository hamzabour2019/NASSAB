"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThemeToggleProps {
  className?: string;
}

/**
 * Toggle مخصص للـ Tailwind (`dark` class).
 * بدلاً من next-themes (اللي كان يسبب شاشة بيضاء عند التحويل)، بنبدّل class مباشرة على <html>.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return true;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    // sync after mount (safety)
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function onToggle() {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }

  return (
    <div
      className={cn(
        "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300",
        isDark ? "bg-zinc-950 border border-zinc-800" : "bg-white border border-zinc-200",
        className
      )}
      dir="ltr"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
      aria-label="تغيير الثيم"
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark ? "transform translate-x-0 bg-zinc-800" : "transform translate-x-8 bg-gray-200"
          )}
        >
          {isDark ? <Moon className="w-4 h-4 text-white" strokeWidth={1.5} /> : <Sun className="w-4 h-4 text-gray-700" strokeWidth={1.5} />}
        </div>

        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark ? "bg-transparent" : "transform -translate-x-8"
          )}
        >
          {isDark ? <Sun className="w-4 h-4 text-gray-500" strokeWidth={1.5} /> : <Moon className="w-4 h-4 text-black" strokeWidth={1.5} />}
        </div>
      </div>
    </div>
  );
}

