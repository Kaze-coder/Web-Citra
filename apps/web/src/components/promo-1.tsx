import { ArrowRightIcon, CheckCircle2Icon, LockIcon, SparklesIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Promo1 = () => {
    return (
        <Card className="relative">
            <div className="bg-foreground/10 ring-foreground/5 absolute inset-s-2 top-2 flex size-9 items-center justify-center rounded-full ring-6 md:inset-s-4 md:top-4">
                <LockIcon className="size-4.5" />
            </div>
            <CardHeader className="relative flex flex-col items-center gap-2 text-center">
                <Badge variant="secondary">Pro Feature</Badge>
                <CardTitle>Unlock Advanced Analytics</CardTitle>
                <CardDescription className="mx-auto max-w-70">
                    Gain deeper insights into customer behavior and retention trends.
                </CardDescription>
            </CardHeader>

            <CardContent className="text-muted-foreground flex h-full flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                    <span>Unlimited historical data</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                    <span>Export reports to CSV/PDF</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                    <span>AI-powered forecasting</span>
                </div>
                <div className="mt-auto pt-3">
                    <Button className="gap-2">
                        <SparklesIcon className="size-4" />
                        Upgrade to Pro
                        <ArrowRightIcon className="size-4 opacity-75" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
