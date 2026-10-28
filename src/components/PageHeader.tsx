import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="text-muted mb-1 text-sm">Dashboard › Optimizar › {title}</div>
        <h1 className="text-m1 text-2xl font-semibold">{title}</h1>
        <p className="text-muted mt-1 text-sm">{description}</p>
      </div>
      {actions}
    </div>
  );
}
