// components/PriceChart.tsx
// Purpose: a twelve-month price line, drawn as plain SVG - no chart library, no payload.
// Date: 2026-09-12
//
// CR AudioViz AI, LLC · EIN 39-3646201
export function PriceChart({ bars }: { bars: { t: number; c: number }[] }) {
  if (bars.length < 2) return <p className="mt-2 text-sm text-gray-400">Not enough history to draw.</p>;
  const w = 720;
  const h = 180;
  const pad = 4;
  const closes = bars.map((b) => b.c);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const points = bars.map((b, i) => {
    const x = pad + (i / (bars.length - 1)) * (w - pad * 2);
    const y = h - pad - ((b.c - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const rising = (closes[closes.length - 1] as number) >= (closes[0] as number);
  const stroke = rising ? "#34d399" : "#fb7185";
  const first = new Date(bars[0]?.t ?? Date.now());
  const last = new Date(bars[bars.length - 1]?.t ?? Date.now());
  const fmt = (d: Date) => new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(d);
  return (
    <figure className="mt-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" role="img"
        aria-label={`Twelve-month price line, ${rising ? "higher" : "lower"} than a year ago, from ${min.toFixed(2)} to ${max.toFixed(2)} dollars`}>
        <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <figcaption className="flex justify-between text-xs text-gray-400">
        <span>{fmt(first)}</span>
        <span>low {min < 1 ? min.toFixed(4) : min.toFixed(2)} · high {max < 1 ? max.toFixed(4) : max.toFixed(2)}</span>
        <span>{fmt(last)}</span>
      </figcaption>
    </figure>
  );
}
