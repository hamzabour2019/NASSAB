import { TreePine } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";

const sizeClasses: Record<LogoSize, string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
};

const iconSizes: Record<LogoSize, string> = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-8 h-8",
};

export function Logo({
  size = "md",
  className,
  iconClassName,
}: {
  size?: LogoSize;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/40 shrink-0",
        sizeClasses[size],
        className
      )}
      aria-hidden
    >
      <TreePine
        className={cn("text-primary-foreground", iconSizes[size], iconClassName)}
        strokeWidth={1.5}
      />
    </div>
  );
}

