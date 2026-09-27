interface TabDef {
  id: string;
  label: string;
}

interface Props {
  defs: readonly TabDef[];
  active: string;
  onChange: (id: string) => void;
}

/** Accessible tab navigation (ARIA tablist/tab semantics). */
export default function Tabs({ defs, active, onChange }: Props) {
  return (
    <nav
      role="tablist"
      aria-label="页面导航"
      className="flex gap-1 text-sm overflow-x-auto"
    >
      {defs.map(d => {
        const on = d.id === active;
        return (
          <button
            key={d.id}
            role="tab"
            aria-selected={on}
            aria-controls={`panel-${d.id}`}
            onClick={() => onChange(d.id)}
            className={
              'px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ' +
              (on
                ? 'bg-brand-600 text-white'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700')
            }
          >
            {d.label}
          </button>
        );
      })}
    </nav>
  );
}
