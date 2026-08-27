import { createFileRoute } from "@tanstack/react-router";
import { Card, Container, Disclaimer, SectionHeading } from "~/components/ui";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="py-12">
      <Container className="max-w-3xl">
        <SectionHeading title="Terms" subtitle="License2Launch — placeholder terms." />
        <Card className="mt-8 space-y-4 text-sm text-slate-soft">
          <p>
            These are placeholder terms. License2Launch is educational and
            organizational only. We make no guarantees of passing, licensing,
            funding, or profit.
          </p>
          <Disclaimer />
        </Card>
      </Container>
    </div>
  );
}
