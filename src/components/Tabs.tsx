interface TabDef {
  id: string;
  label: string;
}

interface Props {
  defs: readonly TabDef[];
  active: string;
  onChange: (id: string) => void;
}

export default function Tabs({ defs, active, onChange }: Props) {
  return (
    <nav className="flex gap-1 text-sm">
      {defs.map(d => {
        const on = d.id === active;
        return (
          <button
            key={d.id}
            onClick={() => onChange(d.id)}
            className={
              'px-3 py-1.5 rounded-full transition-colors ' +
              (on
                ? 'bg-slate-800 text-white'
                : 'text-slate-500 hover:bg-slate-100')
            }
          >
            {d.label}
          </button>
        );
      })}
    </nav>
  );
}
