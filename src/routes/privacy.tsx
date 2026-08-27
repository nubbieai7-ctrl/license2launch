import { createFileRoute } from "@tanstack/react-router";
import { Card, Container, SectionHeading } from "~/components/ui";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="py-12">
      <Container className="max-w-3xl">
        <SectionHeading title="Privacy" subtitle="License2Launch — placeholder privacy notice." />
        <Card className="mt-8 space-y-4 text-sm text-slate-soft">
          <p>
            These are placeholder terms. We handle data responsibly and do not sell
            personal information. Details will be finalized before public launch.
          </p>
        </Card>
      </Container>
    </div>
  );
}
