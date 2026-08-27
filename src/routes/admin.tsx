import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, Button, Card, Container, SectionHeading } from "~/components/ui";
import { useUser } from "~/lib/ctx";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const sections = [
  { title: "Professions", text: "Add or edit profession records — no code changes." },
  { title: "Courses & lessons", text: "Manage exam-prep lessons and content." },
  { title: "Practice questions", text: "Curate the practice question bank." },
  { title: "Business-model templates", text: "Maintain profession-to-business path templates." },
  { title: "Roadmap templates", text: "Adjust the steps in each career roadmap." },
  { title: "Funding resources", text: "Add verified funding providers and documents." },
];

function AdminPage() {
  const user = useUser();

  if (!user) {
    return (
      <div className="py-24">
        <Container className="max-w-md text-center">
          <h1 className="text-2xl font-extrabold">Admin only</h1>
          <p className="mt-2 text-sm text-slate-soft">
            You must be logged in to view the admin area.
          </p>
          <div className="mt-6">
            <Button asLink href="/login">Log in</Button>
          </div>
        </Container>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="py-24">
        <Container className="max-w-md text-center">
          <h1 className="text-2xl font-extrabold">Access restricted</h1>
          <p className="mt-2 text-sm text-slate-soft">
            This area is for administrators only. Your account doesn&apos;t have
            admin permissions.
          </p>
          <div className="mt-6">
            <Link to="/dashboard" className="font-semibold text-emerald">
              ← Back to your dashboard
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-12">
      <Container>
        <div className="flex flex-wrap items-center gap-3">
          <SectionHeading
            title="Admin — content management"
            subtitle="Manage professions, courses, questions, templates, and funding resources."
          />
          <Badge tone="emerald">Admin</Badge>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <Card key={s.title}>
              <h3 className="text-lg">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-soft">{s.text}</p>
              <Button size="sm" className="mt-4" disabled>
                Manage
              </Button>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <h3 className="text-lg">Adding a profession</h3>
          <p className="mt-1.5 text-sm text-slate-soft">
            Milestone 1 establishes the data model and this admin shell. The CRUD
            editors arrive in a later milestone — for now, each profession is a
            data record seeded through the server, so new professions can be added
            without rebuilding the app.
          </p>
        </Card>
      </Container>
    </div>
  );
}
