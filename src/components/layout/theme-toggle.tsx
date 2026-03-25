"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="المظهر"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuItem onClick={() => setTheme("light")}>فاتح</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>داكن</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>النظام</DropdownMenuItem>
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          الحالي: {theme}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
