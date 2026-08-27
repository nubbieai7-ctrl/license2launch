import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, Card, Container, SampleBadge, SectionHeading } from "~/components/ui";
import { listBusinessModels, listProfessions } from "~/server/fns";

export const Route = createFileRoute("/business-path")({
  loader: async () => {
    const [models, professions] = await Promise.all([
      listBusinessModels({ data: {} }),
      listProfessions(),
    ]);
    const names = new Map(professions.map((p) => [p.id, p.name]));
    return { models, names };
  },
  component: BusinessPathPage,
});

function BusinessPathPage() {
  const { models, names } = Route.useLoaderData();
  return (
    <div className="py-12">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading
            title="Profession-to-business paths"
            subtitle="Model business ideas for each licensed profession — what to offer, who to serve, and how to price it."
          />
          <SampleBadge />
        </div>

        <div className="mt-8 space-y-5">
          {models.map((m) => (
            <Card key={m.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="navy">{names.get(m.profession_id) ?? "Profession"}</Badge>
                <Badge tone="gold">Sample model</Badge>
              </div>
              <h3 className="mt-2 text-xl">{m.name}</h3>
              <p className="mt-2 text-sm text-slate-soft">{m.description}</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wide text-emerald">Services</h4>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
                    {m.services.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wide text-emerald">Target customers</h4>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
                    {m.target_customers.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 border-t border-mist pt-4">
                <h4 className="text-sm font-bold uppercase tracking-wide text-emerald">Estimated startup costs (sample)</h4>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {m.startup_cost_categories.map((c, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-mist px-3 py-2">
                      <span className="text-ink">{c.label}</span>
                      <span className="font-semibold text-navy">${c.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/professions" className="mt-4 inline-block text-sm font-semibold text-emerald">
                Explore profession →
              </Link>
            </Card>
          ))}
        </div>

        <p className="mt-8 max-w-2xl text-sm text-slate-soft">
          These business models are illustrative sample data for planning only.
          Your actual costs, licensing, and requirements vary — confirm with your
          licensing authority and qualified professionals.
        </p>
      </Container>
    </div>
  );
}
