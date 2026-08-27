import { createFileRoute } from "@tanstack/react-router";
import { Badge, Card, Container, ProgressBar, SectionHeading } from "~/components/ui";
import { listRoadmap } from "~/server/fns";

export const Route = createFileRoute("/roadmap")({
  loader: () => listRoadmap({ data: {} }),
  component: RoadmapPage,
});

const diffTone: Record<string, "emerald" | "gold" | "danger"> = {
  easy: "emerald",
  medium: "gold",
  hard: "danger",
};

function RoadmapPage() {
  const tasks = Route.useLoaderData();
  const checked = Math.max(1, Math.round(tasks.length * 0.15));
  return (
    <div className="py-12">
      <Container>
        <SectionHeading
          title="Your career roadmap"
          subtitle="A step-by-step path from preparation to launching your business. Track progress as you go."
        />
        <div className="mt-6 max-w-2xl">
          <ProgressBar label="Overall progress" value={checked} max={tasks.length} />
        </div>

        <div className="mt-8 space-y-4">
          {tasks.map((t) => (
            <Card key={t.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-soft">
                    Step {t.step_order}
                  </span>
                  <Badge tone={diffTone[t.difficulty] ?? "gray"}>
                    {t.difficulty}
                  </Badge>
                  <Badge tone="navy">{t.category}</Badge>
                </div>
                <h3 className="mt-1.5 text-lg">{t.title}</h3>
                <p className="mt-1 text-sm text-slate-soft">{t.description}</p>
              </div>
              <div className="shrink-0 text-sm text-slate-soft sm:text-right">
                <div>{t.est_time}</div>
                <div className="text-xs">~{t.suggested_deadline_days} days</div>
              </div>
            </Card>
          ))}
        </div>

        <p className="mt-8 max-w-2xl text-sm text-slate-soft">
          This roadmap is general guidance based on sample data. Requirement
          specifics (hours, courses, exams) vary by state — always confirm with your
          licensing authority.
        </p>
      </Container>
    </div>
  );
}
