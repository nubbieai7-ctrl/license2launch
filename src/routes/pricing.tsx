import { createFileRoute } from "@tanstack/react-router";
import { Badge, Card, Container, SectionHeading } from "~/components/ui";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

const plans = [
  {
    name: "Explorer",
    price: "Free",
    blurb: "Start your path with the core profession library and a personalized roadmap.",
    features: ["Profession library (3 pilots)", "Career roadmap", "Basic exam prep"],
    featured: false,
  },
  {
    name: "Launcher",
    price: "Coming soon",
    blurb: "Everything for turning your license into a business.",
    features: ["Everything in Explorer", "Business-plan generator", "Budget calculator", "Funding-readiness tools"],
    featured: true,
  },
  {
    name: "Grow",
    price: "Coming soon",
    blurb: "For licensed pros scaling a small business.",
    features: ["Everything in Launcher", "Marketing center", "Growth resources"],
    featured: false,
  },
];

function PricingPage() {
  return (
    <div className="py-12">
      <Container>
        <SectionHeading
          title="Simple, transparent pricing"
          subtitle="Plans are placeholders for now — no live payments until credentials are added. Start free."
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {plans.map((p) => (
            <Card
              key={p.name}
              className={p.featured ? "border-emerald ring-2 ring-emerald/30" : ""}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg">{p.name}</h3>
                {p.featured && <Badge tone="emerald">Most popular</Badge>}
              </div>
              <div className="mt-2 text-2xl font-extrabold text-navy">{p.price}</div>
              <p className="mt-1 text-sm text-slate-soft">{p.blurb}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-sm text-slate-soft">
          No live payments are collected at this stage. Plan details are
          placeholders and may change.
        </p>
      </Container>
    </div>
  );
}
