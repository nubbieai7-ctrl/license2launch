import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button, Card, Container, SectionHeading } from "~/components/ui";
import { useUser } from "~/lib/ctx";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const user = useUser();
  const router = useRouter();

  if (!user) {
    return (
      <div className="py-24">
        <Container className="max-w-md text-center">
          <h1 className="text-2xl font-extrabold">You&apos;re not logged in</h1>
          <p className="mt-2 text-sm text-slate-soft">
            Log in to see your personalized dashboard.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asLink href="/login">Log in</Button>
            <Button asLink href="/register" variant="gold">Create account</Button>
          </div>
        </Container>
      </div>
    );
  }

  const items = [
    { to: "/roadmap" as const, label: "Career roadmap" },
    { to: "/exam" as const, label: "Exam prep" },
    { to: "/business-path" as const, label: "Business paths" },
    { to: "/business-plan" as const, label: "Business plan" },
    { to: "/budget" as const, label: "Budget calculator" },
    { to: "/funding" as const, label: "Funding readiness" },
  ];

  return (
    <div className="py-12">
      <Container>
        <SectionHeading
          title={`Welcome back, ${user.name}`}
          subtitle="Here's your path from license to launch. Pick up where you left off."
        />
        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg">Signed in as {user.email}</h3>
              <p className="mt-1 text-sm text-slate-soft">
                Role: <span className="font-medium text-navy">{user.role}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await router.navigate({ to: "/logout" });
              }}
              className="text-sm font-semibold text-emerald hover:underline l2l-focus"
            >
              Log out
            </button>
          </div>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Link key={it.to} to={it.to} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-lg">
                <h3 className="text-lg">{it.label}</h3>
                <p className="mt-1 text-sm text-slate-soft">Open →</p>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
