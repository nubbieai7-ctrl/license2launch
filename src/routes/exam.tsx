import { createFileRoute } from "@tanstack/react-router";
import { Card, Container, Disclaimer, SectionHeading } from "~/components/ui";

export const Route = createFileRoute("/exam")({
  component: ExamPage,
});

const topics = [
  {
    title: "Practice questions",
    text: "Short sets of sample questions to warm up on each profession's exam topics.",
  },
  {
    title: "Study progress",
    text: "Track lessons completed and see your readiness at a glance.",
  },
  {
    title: "Lessons & review",
    text: "Topic-by-topic review based on the official exam blueprint for your path.",
  },
];

function ExamPage() {
  return (
    <div className="py-12">
      <Container>
        <SectionHeading
          title="Exam preparation"
          subtitle="Your exam-prep dashboard — practice, track progress, and get ready for licensing day."
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {topics.map((t) => (
            <Card key={t.title}>
              <h3 className="text-lg">{t.title}</h3>
              <p className="mt-1.5 text-sm text-slate-soft">{t.text}</p>
            </Card>
          ))}
        </div>
        <Card className="mt-8">
          <h3 className="text-lg">Coming in a later milestone</h3>
          <p className="mt-1.5 text-sm text-slate-soft">
            Full exam-prep modules (lessons, question banks, and progress tracking)
            are part of a later milestone. Sample questions already exist in the
            database and will power this experience.
          </p>
          <div className="mt-4">
            <Disclaimer />
          </div>
        </Card>
      </Container>
    </div>
  );
}
