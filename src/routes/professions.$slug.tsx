import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Badge,
  Button,
  Container,
  Card,
  SampleBadge,
  Disclaimer,
  SectionHeading,
} from "~/components/ui";
import { getProfession, listBusinessModels } from "~/server/fns";

export const Route = createFileRoute("/professions/$slug")({
  loader: async ({ params }) => {
    const [profession, businessModels] = await Promise.all([
      getProfession({ data: { slug: params.slug } }),
      null,
    ]);
    return { profession };
  },
  component: ProfessionDetail,
});

function ListBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-sm font-bold uppercase tracking-wide text-emerald">
        {title}
      </h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

function ProfessionDetail() {
  const { profession } = Route.useLoaderData();
  if (!profession) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-2xl">Profession not found</h1>
        <Link to="/professions" className="mt-3 inline-block font-semibold text-emerald">
          ← Back to professions
        </Link>
      </Container>
    );
  }

  return (
    <div className="py-10">
      <Container>
        <Link to="/professions" className="text-sm font-medium text-emerald">
          ← All professions
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone="emerald">{profession.category}</Badge>
          {profession.is_sample && <SampleBadge />}
        </div>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
          {profession.name}
        </h1>
        <p className="mt-3 max-w-3xl text-slate-soft">{profession.description}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button asLink href="/roadmap" size="md">
            View roadmap
          </Button>
          <Button asLink href="/exam" size="md" variant="secondary">
            Exam prep
          </Button>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Licenses, exams & education">
              <div className="space-y-5">
                <ListBlock title="Licenses & certifications" items={profession.licenses_certifications} />
                <ListBlock title="Exams" items={profession.exam_names} />
                <ListBlock title="Education path" items={profession.suggested_education} />
                <ListBlock title="Exam subjects" items={profession.exam_subjects} />
              </div>
            </Card>

            <Card title="Required skills">
              <ListBlock title="Core skills" items={profession.required_skills} />
            </Card>

            <Card title="Business opportunities">
              <ListBlock title="Ways to build a business" items={profession.business_opportunities} />
              <div className="mt-5">
                <h4 className="text-sm font-bold uppercase tracking-wide text-emerald">
                  Revenue models
                </h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
                  {profession.revenue_models.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card title="Typical customers">
              <p className="text-sm text-slate-soft">
                {profession.typical_customers.join(" · ")}
              </p>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-5">
            <Card title="Startup costs">
              <p className="text-sm text-slate-soft">{profession.startup_cost_range}</p>
              <ListBlock title="Equipment" items={profession.equipment_requirements} />
            </Card>

            <Card title="Insurance considerations">
              <ListBlock title="Consider" items={profession.insurance_considerations} />
            </Card>

            <Card title="Typical risks">
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
                {profession.typical_risks.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Card>

            <Card title="Marketing channels">
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
                {profession.marketing_channels.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Card>

            <Card title="Funding options">
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
                {profession.funding_options.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Card>
            <Card title="Employees & subcontractors">
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
                {profession.employees_subcontractors.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Card>
            <Card title="Location & licensing">
              <p className="text-sm text-slate-soft">{profession.location_requirements}</p>
            </Card>

            {profession.official_links.length > 0 && (
              <Card title="Official resources">
                <ul className="space-y-1 text-sm">
                  {profession.official_links.map((l, i) => (
                    <li key={i}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-emerald hover:underline"
                      >
                        {l.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card title="Data source & review">
              <SampleBadge />
              <p className="mt-2 text-sm text-slate-soft">
                Last reviewed: <span className="text-navy">{profession.last_reviewed || "\u2014"}</span>
              </p>
              {profession.admin_notes && (
                <p className="mt-1 text-sm text-slate-soft">
                  Admin notes: <span className="text-navy">{profession.admin_notes}</span>
                </p>
              )}
              <Link
                to="/explorer"
                className="mt-3 inline-block text-sm font-semibold text-emerald hover:underline"
              >
                Compare on Career Explorer {"\u2192"}
              </Link>
            </Card>
            <Disclaimer />
          </div>
        </div>
      </Container>
    </div>
  );
}
