import { useState, useMemo } from "react";
import { Info, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

const mono = { fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace' };

const PROVIDERS = {
  Anthropic: "#E8817F",
  OpenAI: "#4FD1C5",
  Google: "#7C9CFF",
  xAI: "#B79CFF",
  DeepSeek: "#F5A623",
};

// Current list pricing, USD per 1M tokens. Compiled from provider pricing pages
// and pricing trackers as of mid-July 2026 — verify against the provider before budgeting.
const MODELS = [
  { provider: "Anthropic", name: "Haiku 4.5", input: 1, output: 5, note: "" },
  { provider: "Anthropic", name: "Sonnet 5", input: 2, output: 10, note: "intro price thru Aug 31, 2026 → $3/$15" },
  { provider: "Anthropic", name: "Opus 4.8", input: 5, output: 25, note: "" },
  { provider: "Anthropic", name: "Fable 5", input: 10, output: 50, note: "Mythos-class" },
  { provider: "OpenAI", name: "GPT-5.6 Luna", input: 1, output: 6, note: "" },
  { provider: "OpenAI", name: "GPT-5.6 Terra", input: 2.5, output: 15, note: "" },
  { provider: "OpenAI", name: "GPT-5.6 Sol", input: 5, output: 30, note: "flagship" },
  { provider: "Google", name: "Gemini 3.1 Flash-Lite", input: 0.25, output: 1.5, note: "" },
  { provider: "Google", name: "Gemini 3.5 Flash", input: 1.5, output: 9, note: "" },
  { provider: "Google", name: "Gemini 3.1 Pro", input: 2, output: 12, note: "2x/1.5x above 200K tokens" },
  { provider: "xAI", name: "Grok 4.1 Fast", input: 0.2, output: 0.5, note: "2M context" },
  { provider: "xAI", name: "Grok 4.3", input: 1.25, output: 2.5, note: "" },
  { provider: "xAI", name: "Grok 4.5", input: 2, output: 6, note: "flagship" },
  { provider: "DeepSeek", name: "V4 Flash", input: 0.14, output: 0.28, note: "" },
  { provider: "DeepSeek", name: "V4 Pro", input: 0.435, output: 0.87, note: "promo rate" },
];

// Flagship-tier output price ($/M tokens) at a few points over the past year.
// Approximate / directional — compiled from provider release notes, not an official index.
const TREND = [
  { label: "Aug 2025", sub: "GPT-5 · Opus 4.1 · Gemini 2.5 Pro", Anthropic: 75, OpenAI: 10, Google: 10 },
  { label: "Feb 2026", sub: "GPT-5.4 · Opus 4.6 · Gemini 3 Pro", Anthropic: 25, OpenAI: 15, Google: 12 },
  { label: "Jul 2026", sub: "GPT-5.6 Sol · Opus 4.8 · Gemini 3.1 Pro", Anthropic: 25, OpenAI: 30, Google: 12 },
];

const TREND_CALLOUTS = [
  {
    label: "Claude Opus",
    change: -67,
    detail: "$75 → $25 per M output",
    span: "Opus 4.1 (Aug '25) → Opus 4.8 (May '26)",
    color: PROVIDERS.Anthropic,
  },
  {
    label: "DeepSeek V4 Pro",
    change: -75,
    detail: "$3.48 → $0.87 per M output",
    span: "standard rate → current promo",
    color: PROVIDERS.DeepSeek,
  },
  {
    label: "GPT flagship",
    change: 200,
    detail: "$10 → $30 per M output",
    span: "GPT-5 (Aug '25) → GPT-5.6 Sol (Jul '26)",
    color: PROVIDERS.OpenAI,
  },
];

const fmt = (n) => (n < 1 ? `$${n.toFixed(2)}` : `$${n}`);

export default function TokenPricingPage() {
  const [activeProviders, setActiveProviders] = useState(new Set(Object.keys(PROVIDERS)));
  const [sortBy, setSortBy] = useState("output");

  const toggleProvider = (p) => {
    setActiveProviders((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next.size === 0 ? new Set(Object.keys(PROVIDERS)) : next;
    });
  };

  const visibleModels = useMemo(() => MODELS.filter((m) => activeProviders.has(m.provider)), [activeProviders]);

  const grouped = useMemo(() => {
    const g = {};
    Object.keys(PROVIDERS).forEach((p) => (g[p] = []));
    MODELS.forEach((m) => g[m.provider].push(m));
    Object.values(g).forEach((arr) => arr.sort((a, b) => a[sortBy] - b[sortBy]));
    return g;
  }, [sortBy]);

  return (
    <div
      className="min-h-screen w-full text-slate-100"
      style={{ background: "#0A0C10", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2 text-teal-300" style={{ letterSpacing: "0.12em" }}>
              <span className="text-xs font-semibold uppercase" style={mono}>
                AI Model Pricing
              </span>
            </div>
            <h1 className="text-2xl font-bold mt-1 text-white">Token costs, every major model, at a glance.</h1>
          </div>
          <span
            className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 whitespace-nowrap"
            style={mono}
          >
            Verified · Jul 15, 2026
          </span>
        </div>
        <p className="text-sm text-slate-400 max-w-2xl mb-6">
          List API pricing in USD per million tokens, compiled from provider pricing pages. Rates change often —
          confirm against the provider before budgeting anything at scale.
        </p>

        {/* Provider filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(PROVIDERS).map(([p, color]) => {
            const active = activeProviders.has(p);
            return (
              <button
                key={p}
                onClick={() => toggleProvider(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                style={{
                  borderColor: active ? color : "#212632",
                  color: active ? color : "#8891A5",
                  background: active ? `${color}14` : "transparent",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                {p}
              </button>
            );
          })}
        </div>

        {/* At a glance: scatter */}
        <div className="rounded-xl border border-slate-800 p-5 mb-6" style={{ background: "#12151C" }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-white">Input vs. output price</h2>
            <span className="text-[11px] text-slate-500">$ / 1M tokens · log scale</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Lower-left is cheaper on both sides. Bubble color = provider.</p>
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid stroke="#1C2028" />
              <XAxis
                type="number"
                dataKey="input"
                name="Input"
                scale="log"
                domain={[0.1, 15]}
                tickFormatter={(v) => `$${v}`}
                tick={{ fill: "#8891A5", fontSize: 11 }}
                label={{ value: "Input $/1M", position: "insideBottom", offset: -5, fill: "#8891A5", fontSize: 11 }}
                axisLine={{ stroke: "#2A2F3A" }}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="output"
                name="Output"
                scale="log"
                domain={[0.25, 60]}
                tickFormatter={(v) => `$${v}`}
                tick={{ fill: "#8891A5", fontSize: 11 }}
                label={{ value: "Output $/1M", angle: -90, position: "insideLeft", fill: "#8891A5", fontSize: 11 }}
                axisLine={{ stroke: "#2A2F3A" }}
                tickLine={false}
              />
              <ZAxis range={[90, 90]} />
              <Tooltip
                cursor={{ stroke: "#2A2F3A" }}
                contentStyle={{ background: "#1C2028", border: "1px solid #2A2F3A", borderRadius: 8, fontSize: 12 }}
                formatter={(value, name) => [`$${value}/1M`, name]}
                labelFormatter={() => ""}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div
                      style={{ background: "#1C2028", border: "1px solid #2A2F3A", borderRadius: 8 }}
                      className="px-3 py-2 text-xs"
                    >
                      <div className="text-white font-medium mb-0.5">
                        {d.provider} {d.name}
                      </div>
                      <div className="text-slate-400" style={mono}>
                        in {fmt(d.input)} · out {fmt(d.output)}
                      </div>
                    </div>
                  );
                }}
              />
              {Object.entries(PROVIDERS).map(([p, color]) =>
                activeProviders.has(p) ? (
                  <Scatter key={p} name={p} data={MODELS.filter((m) => m.provider === p)} fill={color} />
                ) : null
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Provider tables */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">By provider</h2>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 mr-1">Sort by</span>
            {["input", "output"].map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className="px-2.5 py-1 rounded-md border text-xs capitalize transition-colors"
                style={{
                  borderColor: sortBy === s ? "#4FD1C5" : "#212632",
                  color: sortBy === s ? "#4FD1C5" : "#8891A5",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {Object.entries(PROVIDERS)
            .filter(([p]) => activeProviders.has(p))
            .map(([p, color]) => (
              <div key={p} className="rounded-xl border border-slate-800 overflow-hidden" style={{ background: "#12151C" }}>
                <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <h3 className="text-sm font-semibold text-white">{p}</h3>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 text-left">
                      <th className="px-4 py-2 font-medium">Model</th>
                      <th className="px-4 py-2 font-medium text-right">In</th>
                      <th className="px-4 py-2 font-medium text-right">Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[p].map((m) => (
                      <tr key={m.name} className="border-t border-slate-800/60">
                        <td className="px-4 py-2 text-slate-200">
                          {m.name}
                          {m.note && <div className="text-[10px] text-slate-500 mt-0.5">{m.note}</div>}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-300" style={mono}>
                          {fmt(m.input)}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-300" style={mono}>
                          {fmt(m.output)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </div>

        {/* Over time */}
        <h2 className="text-sm font-semibold text-white mb-1">Over time</h2>
        <p className="text-xs text-slate-500 mb-3">
          Flagship-tier output price, a few checkpoints over the past year. Directional, not an official index.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          <div className="lg:col-span-3 rounded-xl border border-slate-800 p-5" style={{ background: "#12151C" }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={TREND} margin={{ left: 0, right: 16, top: 10 }}>
                <CartesianGrid stroke="#1C2028" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#8891A5", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8891A5", fontSize: 11 }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{ background: "#1C2028", border: "1px solid #2A2F3A", borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n) => [`$${v}/M`, n]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Anthropic" stroke={PROVIDERS.Anthropic} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="OpenAI" stroke={PROVIDERS.OpenAI} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Google" stroke={PROVIDERS.Google} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-3">
            {TREND_CALLOUTS.map((c) => (
              <div key={c.label} className="rounded-xl border border-slate-800 p-4 flex items-center justify-between" style={{ background: "#12151C" }}>
                <div>
                  <div className="text-sm text-white font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    {c.label}
                  </div>
                  <div className="text-xs text-slate-400 mt-1" style={mono}>
                    {c.detail}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{c.span}</div>
                </div>
                <div
                  className="flex items-center gap-0.5 text-sm font-semibold flex-shrink-0"
                  style={{ color: c.change < 0 ? "#4FD1C5" : c.change > 0 ? "#F5A623" : "#8891A5" }}
                >
                  {c.change < 0 ? <ArrowDownRight size={16} /> : c.change > 0 ? <ArrowUpRight size={16} /> : <Minus size={16} />}
                  {Math.abs(c.change)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="flex items-start gap-2 text-[11px] text-slate-600 mt-4 border-t border-slate-800 pt-4">
          <Info size={13} className="flex-shrink-0 mt-0.5" />
          <p>
            Compiled from Anthropic, OpenAI, Google, xAI and DeepSeek pricing pages and pricing trackers as of
            July 15, 2026. Cached-input, batch, and long-context surcharge rates aren't shown here. Providers
            change list prices without much notice — treat this as a snapshot, not a live feed.
          </p>
        </div>
      </div>
    </div>
  );
}
