import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Badge,
  Button,
  Container,
  Card,
  SectionHeading,
  SampleBadge,
  Disclaimer,
} from "~/components/ui";
import { listProfessions } from "~/server/fns";

export const Route = createFileRoute("/")({
  loader: () => listProfessions(),
  component: Home,
});

const journey = [
  {
    step: "1",
    title: "Prepare for the license",
    text: "Follow a personalized roadmap and use exam-prep tools to get ready for your profession's licensing exam.",
  },
  {
    step: "2",
    title: "Build the business",
    text: "Choose a business model, estimate startup costs, write a business plan, and get funding-ready.",
  },
  {
    step: "3",
    title: "Launch with confidence",
    text: "Turn your new qualification into a legitimate small business — marketing, operations, and growth resources in one place.",
  },
];

function Home() {
  const professions = Route.useLoaderData();
  return (
    <div>
      {/* HERO */}
      <section className="bg-navy text-white">
        <Container className="py-16 sm:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-gold-light">
              For electricians, nurses & real estate agents
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Prepare for the license.
              <br />
              <span className="text-emerald-light">Launch the business.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80">
              License2Launch walks you from exam prep and licensing through to a
              legitimate small business — roadmaps, exam tools, business models,
              budgets, and funding readiness, all in one place.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asLink href="/onboarding" size="lg">
                Start your journey
              </Button>
              <Button
                asLink
                href="/professions"
                size="lg"
                variant="gold"
              >
                Explore professions
              </Button>
            </div>
            <p className="mt-6 max-w-xl text-sm text-white/60">
              Educational and organizational only — we never guarantee passing,
              licensing, funding, or profit.
            </p>
          </div>
        </Container>
      </section>

      {/* PREPARE → LAUNCH JOURNEY */}
      <section className="py-14">
        <Container>
          <SectionHeading
            title="Your path from license to launch"
            subtitle="Three connected stages, built around your profession."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {journey.map((j) => (
              <Card key={j.step}>
                <div className="mb-3 grid size-10 place-items-center rounded-full bg-emerald text-lg font-bold text-white">
                  {j.step}
                </div>
                <h3 className="text-lg">{j.title}</h3>
                <p className="mt-1.5 text-sm text-slate-soft">{j.text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* PILOT PROFESSIONS */}
      <section className="bg-mist py-14">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading
              title="Pilot professions"
              subtitle="Three paths to start with — more professions coming without rebuilding the app."
            />
            <SampleBadge />
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {professions.map((p) => (
              <Link
                key={p.slug}
                to="/professions/$slug"
                params={{ slug: p.slug }}
                className="group"
              >
                <Card
                  className="h-full transition-shadow group-hover:shadow-lg"
                  icon={<span aria-hidden>⚡</span>}
                  title={p.name}
                  subtitle={p.category}
                >
                  <p className="line-clamp-3 text-sm text-slate-soft">
                    {p.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge tone="emerald">{p.slug === "electrician" ? "Understand" : p.slug === "nursing" ? "Care" : "Close"}</Badge>
                    <span className="text-sm font-semibold text-emerald">
                      View →{" "}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA + SAMPLE DISCLOSURE */}
      <section className="py-16">
        <Container>
          <div className="rounded-3xl bg-emerald p-8 text-white sm:p-12">
            <h2 className="text-3xl font-extrabold">
              Ready to get started?
            </h2>
            <p className="mt-2 max-w-2xl text-white/85">
              Create a free account to save your progress and get a personalized
              roadmap. Onboarding is the first step after signing up.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                asLink
                href="/register"
                size="lg"
                variant="gold"
              >
                Create a free account
              </Button>
              <Button
                asLink
                href="/onboarding"
                size="lg"
                variant="secondary"
                className="bg-white text-emerald hover:bg-white/90"
              >
                Preview onboarding
              </Button>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Disclaimer />
            <Card title="About the content">
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-soft">
                <li>All invented or example content is labeled as sample data.</li>
                <li>
                  Official requirements vary by location — always confirm with your
                  licensing authority and qualified professionals.
                </li>
                <li>
                  Exam, license, cost, and funding details are general guidance,
                  not guarantees.
                </li>
              </ul>
            </Card>
          </div>
        </Container>
      </section>
    </div>
  );
}
