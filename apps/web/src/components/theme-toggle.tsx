"use client";

import { MoonStarIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleTheme } from "@/components/providers";

export function ThemeToggle({ className }: { className?: string }) {
  return (
    <Button className={className} variant="ghost" size="icon" onClick={toggleTheme} aria-label="Ganti tema warna">
      <MoonStarIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </Button>
  );
}
