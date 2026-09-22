"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { SearchIcon } from "lucide-react";

import { Notification1 } from "@/components/notification-1";
import { Profile1 } from "@/components/profile-1";
import { Widget1 } from "@/components/widget-1";
import { Widget2 } from "@/components/widget-2";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export const Topbar = () => {
    const pathname = usePathname();
    const { setOpenMobile } = useSidebar();

    useEffect(() => {
        setOpenMobile(false);
    }, [pathname, setOpenMobile]);

    return (
        <header className="bg-background/80 sticky top-0 z-50 flex min-h-14 items-center justify-between border-b backdrop-blur-sm">
            <div className="flex items-center gap-2 px-4">
                <SidebarTrigger />
                <div>
                    <Button variant="outline" size="sm" className="w-48 justify-between shadow-none max-md:hidden">
                        <span className="text-muted-foreground font-normal">Search...</span>

                        <div className="flex items-center gap-1">
                            <kbd className="bg-background flex h-5 items-center justify-center rounded-lg border px-1">
                                <span className="pt-px text-[0.625rem] leading-none">Pro</span>
                            </kbd>
                        </div>
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Search">
                        <SearchIcon className="size-4.5" />
                    </Button>
                </div>
            </div>
            <div className="flex items-center gap-1.5 px-4">
                <Widget1 />
                <Widget2 />
                <Notification1 />
                <div className="bg-border ms-3 h-6.5 w-px max-sm:hidden" />
                <div className="flex items-center gap-1">
                    <Profile1 />
                </div>
            </div>
        </header>
    );
};
