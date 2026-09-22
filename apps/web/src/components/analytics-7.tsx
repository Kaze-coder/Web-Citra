"use client";

import { useState } from "react";

import { CalendarDays, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

type TimeRangeKey = "7d" | "30d" | "90d" | "year";

interface TimeRangeOption {
    value: TimeRangeKey;
    label: string;
}

const timeRanges: TimeRangeOption[] = [
    { value: "7d", label: "This Week" },
    { value: "30d", label: "This Month" },
    { value: "90d", label: "Last 3 Months" },
    { value: "year", label: "Year to Date" },
];

const platformConfig: Record<string, { label: string; imageUrl: string }> = {
    google: {
        label: "Google",
        imageUrl: "https://cdn.paceui.com/brand-logos/google-icon.svg",
    },
    github: {
        label: "GitHub",
        imageUrl: "https://cdn.paceui.com/brand-logos/github.svg",
    },
    linkedin: {
        label: "LinkedIn",
        imageUrl: "https://cdn.paceui.com/brand-logos/linkedin.svg",
    },
    x: {
        label: "X",
        imageUrl: "https://cdn.paceui.com/brand-logos/x.svg",
    },
};

const apiData = [
    { source: "google", visitors: 12450, revenue: 45200, percent: 78 },
    { source: "github", visitors: 8300, revenue: 28500, percent: 62 },
    { source: "linkedin", visitors: 4100, revenue: 12100, percent: 45 },
    { source: "x", visitors: 2400, revenue: 8400, percent: 25 },
];

export const Analytics7 = () => {
    const [range, setRange] = useState<TimeRangeKey>("30d");

    const selectedLabel = timeRanges.find((r) => r.value === range)?.label;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Revenue contribution from each traffic source</CardDescription>
                <CardAction>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button variant="outline" size="sm" className="gap-2 max-md:size-8">
                                    <CalendarDays className="text-muted-foreground size-4" />
                                    <span className="max-md:hidden">{selectedLabel}</span>
                                </Button>
                            }
                        />
                        <DropdownMenuContent align="end" className="w-44">
                            {timeRanges.map((item) => (
                                <DropdownMenuItem
                                    key={item.value}
                                    onClick={() => setRange(item.value)}
                                    className="justify-between">
                                    {item.label}
                                    {range === item.value && <CheckIcon className="size-4" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardAction>
            </CardHeader>

            <CardContent className="flex flex-col gap-2.5">
                {apiData.map((item) => {
                    const platform = platformConfig[item.source];

                    return (
                        <div key={item.source} className="group flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-muted flex size-9 items-center justify-center rounded-md p-1">
                                        <img
                                            src={platform.imageUrl}
                                            alt={`${platform.label} logo`}
                                            className="size-6"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-base font-medium">{platform.label}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {item.visitors.toLocaleString()} visitors
                                        </p>
                                    </div>
                                </div>
                                <div className="text-end">
                                    <p className="text-base font-medium">
                                        ${item.revenue.toLocaleString()}
                                        <span className="text-muted-foreground ms-1 text-xs">({item.percent}%)</span>
                                    </p>
                                    <div className="mt-1 flex items-center gap-2.5">
                                        <Progress
                                            aria-label={`Progress for ${platform.label}`}
                                            value={item.percent}
                                            className="bg-muted **:data-[slot=progress-indicator]:bg-primary/70 h-1 w-30 *:data-[slot=progress-track]:h-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};
