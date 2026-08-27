import { createFileRoute } from "@tanstack/react-router";
import { Card, Container, Disclaimer, SectionHeading } from "~/components/ui";

export const Route = createFileRoute("/budget")({
  component: BudgetPage,
});

function BudgetPage() {
  return (
    <div className="py-12">
      <Container className="max-w-3xl">
        <SectionHeading
          title="Startup-budget calculator"
          subtitle="Estimate your one-time and recurring startup costs with transparent formulas."
        />
        <Card className="mt-8">
          <h3 className="text-lg">Your startup budget</h3>
          <p className="mt-2 text-sm text-slate-soft">
            Add categories (tools, vehicle, insurance, licensing, marketing) and
            amounts, and the calculator totals it with clear formulas you can
            review.
          </p>
          <div className="mt-4 rounded-xl border border-mist bg-mist/50 px-4 py-3 text-sm text-slate-soft">
            The interactive calculator arrives in a later milestone. Sample cost
            figures for each business model already exist on the Business Path page.
          </div>
          <div className="mt-6">
            <Disclaimer />
          </div>
        </Card>
      </Container>
    </div>
  );
}
