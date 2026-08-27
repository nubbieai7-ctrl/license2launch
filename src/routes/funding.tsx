import { createFileRoute } from "@tanstack/react-router";
import { Badge, Card, Container, Disclaimer, SectionHeading } from "~/components/ui";
import { listFundingCategories } from "~/server/fns";

export const Route = createFileRoute("/funding")({
  loader: () => listFundingCategories(),
  component: FundingPage,
});

function FundingPage() {
  const cats = Route.useLoaderData();
  return (
    <div className="py-12">
      <Container>
        <SectionHeading
          title="Funding-readiness"
          subtitle="Understand the general categories of small-business funding and how to prepare for each. No providers listed — research and verify current options on your own."
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {cats.map((c) => (
            <Card key={c.id}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg">{c.name}</h3>
                <Badge tone={c.repayment_required === "No" ? "emerald" : "gold"}>
                  {c.repayment_required === "No" ? "Non-repayable" : "Repayment required"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-soft">{c.description}</p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-emerald">Repayment</h4>
                  <p className="text-ink">{c.repayment_required}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-emerald">Ownership</h4>
                  <p className="text-ink">{c.ownership_surrendered}</p>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wide text-emerald">Typical eligibility</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
                  {c.common_eligibility.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wide text-emerald">Questions to ask</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
                  {c.questions_to_ask.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 max-w-2xl space-y-4">
          <Disclaimer />
          <p className="text-sm text-slate-soft">
            Funding availability, terms, and eligibility change frequently. Only
            rely on current, verified information from the actual provider or an
            authorized lender. We never guarantee funding.
          </p>
        </div>
      </Container>
    </div>
  );
}
