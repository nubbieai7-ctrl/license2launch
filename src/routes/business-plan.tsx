import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, Container, Disclaimer, SectionHeading, SampleBadge } from "~/components/ui";

export const Route = createFileRoute("/business-plan")({
  component: BusinessPlanPage,
});

function BusinessPlanPage() {
  return (
    <div className="py-12">
      <Container className="max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading
            title="Business-plan generator"
            subtitle="Turn your profession, model, and numbers into an editable draft business plan."
          />
          <SampleBadge />
        </div>
        <Card className="mt-8">
          <h3 className="text-lg">Your draft plan, ready to edit</h3>
          <p className="mt-2 text-sm text-slate-soft">
            Answer a few questions about your profession, target customers, and
            pricing, and we&apos;ll assemble a clear draft you can edit and export.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button size="lg" disabled>
              Generate draft plan
            </Button>
            <p className="text-xs text-slate-soft">
              Business-plan generation arrives in a later milestone.
            </p>
          </div>
          <div className="mt-6">
            <Disclaimer />
          </div>
        </Card>
      </Container>
    </div>
  );
}
