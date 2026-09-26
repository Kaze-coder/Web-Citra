import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="grid gap-6 border-b border-foreground/15 pb-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end lg:pb-8">
      <div className="max-w-3xl">
        {eyebrow && <p className="section-kicker mb-3">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold leading-none tracking-[-0.04em] sm:text-4xl lg:text-[2.75rem]">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
