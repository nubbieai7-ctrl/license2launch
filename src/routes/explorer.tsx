import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Badge,
  Card,
  Container,
  Disclaimer,
  SampleBadge,
  SectionHeading,
} from "~/components/ui";
import { getExplorerProfiles } from "~/server/fns";
import type { ExplorerProfession } from "~/server/fns";

export const Route = createFileRoute("/explorer")({
  loader: () => getExplorerProfiles(),
  component: ExplorerPage,
});

interface CriterionDef {
  key: string;
  label: string;
}

const CRITERIA: CriterionDef[] = [
  { key: "trainingTime", label: "Training time" },
  { key: "examDifficulty", label: "Exam difficulty" },
  { key: "startupCost", label: "Startup cost" },
  { key: "selfEmploymentPotential", label: "Self-employment potential" },
  { key: "customerDemand", label: "Customer demand" },
  { key: "equipment", label: "Equipment requirements" },
  { key: "businessModels", label: "Possible business models" },
  { key: "timeToFirstCustomer", label: "Estimated time to first customer" },
  { key: "workMode", label: "Work mode (online / in-person)" },
];

function labelTone(label: string): "emerald" | "gold" | "navy" | "gray" {
  const l = label.toLowerCase();
  if (l === "low") return "emerald";
  if (l === "medium" || l === "both") return "gold";
  if (l === "high") return "navy";
  return "gray";
}

function ValueLabel({ label }: { label: string }) {
  return <Badge tone={labelTone(label)}>{label || "—"}</Badge>;
}

/** Extract a value's { label, text } from a profession by criterion key. */
function cellValue(p: ExplorerProfession, key: string): { label: string; text: string; list?: string[] } {
  const ep: Record<string, unknown> = p.explorer_profile as unknown as Record<string, unknown>;
  const v = ep[key];
  if (key === "businessModels") {
    const list = Array.isArray(v) ? (v as string[]) : [];
    return { label: "", text: "", list };
  }
  if (v && typeof v === "object") {
    const { label, text } = v as { label?: string; text?: string };
    return { label: label ?? "", text: text ?? "" };
  }
  return { label: typeof v === "string" ? v : "", text: "" };
}

function ExplorerPage() {
  const all = Route.useLoaderData();
  const [selected, setSelected] = useState<string[]>(
    () => all.map((p) => p.slug).slice(0, 3),
  );

  const shown = all.filter((p) => selected.includes(p.slug));

  function toggle(slug: string) {
    setSelected((prev) => {
      if (prev.includes(slug)) {
        // Keep at least 2 selected so the comparison stays meaningful.
        if (prev.length <= 2) return prev;
        return prev.filter((s) => s !== slug);
      }
      return [...prev, slug];
    });
  }

  return (
    <div className="py-12">
      <Container>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeading
            title="Career Explorer"
            subtitle="Compare the pilot professions side by side across the factors that matter most for starting out."
          />
          <SampleBadge />
        </div>

        {/* Selector */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-navy">Compare:</span>
          {all.map((p) => {
            const on = selected.includes(p.slug);
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => toggle(p.slug)}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors l2l-focus ${
                  on
                    ? "border-emerald bg-emerald text-white"
                    : "border-mist bg-paper text-navy hover:border-emerald/40"
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-slate-soft">
          Labels (low / medium / high) are general relative comparisons for
          this sample data — they are estimates, not guarantees. Select any 2–3
          professions to stack them side by side.
        </p>

        {/* Label legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-soft">
          <span className="font-medium text-navy">Legend:</span>
          <span className="inline-flex items-center gap-1.5">
            <Badge tone="emerald">Low</Badge> less / shorter / lighter
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Badge tone="gold">Medium</Badge> moderate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Badge tone="navy">High</Badge> more / longer / heavier
          </span>
        </div>

        <div className="mt-6">
          {/* Stat header cards */}
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <Card key={p.slug} className="py-4">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to="/professions/$slug"
                    params={{ slug: p.slug }}
                    className="font-bold text-navy hover:text-emerald"
                  >
                    {p.name} →
                  </Link>
                  <Badge tone="emerald">{p.category}</Badge>
                </div>
              </Card>
            ))}
          </div>

          {shown.length === 0 ? (
            <Card className="text-center">
              <p className="text-slate-soft">No professions selected.</p>
            </Card>
          ) : (
            /* Comparison table — horizontally scrollable on mobile */
            <div className="overflow-x-auto rounded-2xl border border-mist bg-paper shadow-card">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Career comparison across the selected professions
                </caption>
                <thead>
                  <tr className="border-b border-mist bg-mist/50">
                    <th className="sticky left-0 z-10 w-52 bg-mist/95 px-4 py-3 font-bold text-navy">
                      Criterion
                    </th>
                    {shown.map((p) => (
                      <th key={p.slug} className="px-4 py-3 font-bold text-navy">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRITERIA.map((c) => (
                    <tr
                      key={c.key}
                      className="border-b border-mist align-top last:border-0"
                    >
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-paper px-4 py-3 font-semibold text-navy"
                      >
                        {c.label}
                      </th>
                      {shown.map((p) => {
                        const v = cellValue(p, c.key);
                        return (
                          <td key={p.slug} className="px-4 py-3">
                            <ValueLabel label={v.label} />
                            {v.list ? (
                              <ul className="mt-2 space-y-1 text-xs text-ink">
                                {v.list.map((item, i) => (
                                  <li key={i} className="flex gap-1.5">
                                    <span className="text-emerald">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              v.text && (
                                <p className="mt-2 text-xs leading-relaxed text-slate-soft">
                                  {v.text}
                                </p>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card title="How to read this">
            <p className="text-sm text-slate-soft">
              This comparison uses ranges and relative labels (low / medium /
              high) — it never promises a specific income or outcome. Use it to
              shortlist a profession, then confirm the details on each
              profession page and with your local licensing authority.
            </p>
          </Card>
          <Card title="A note on comparability">
            <p className="text-sm text-slate-soft">
              The professions differ in how “self-employed” work is structured
              (e.g. agents typically work under a broker). These labels reflect
              general patterns in the sample data, not a guarantee of how any
              individual will work.
            </p>
          </Card>
        </div>

        <div className="mt-6">
          <Disclaimer />
          <p className="mt-2 text-xs text-slate-soft">
            All comparison data is sample content for illustration purposes
            only.
          </p>
        </div>
      </Container>
    </div>
  );
}
