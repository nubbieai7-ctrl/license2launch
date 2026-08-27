import { useState } from "react";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import {
  Button,
  Card,
  Container,
  Disclaimer,
  Field,
  Input,
  ProgressBar,
  SampleBadge,
  SectionHeading,
  Select,
} from "~/components/ui";
import { getMyProfile, saveOnboarding } from "~/server/fns";
import type { OnboardingProfile } from "~/server/fns";

export const Route = createFileRoute("/onboarding")({
  loader: async () => {
    // Require login to complete onboarding.
    const profile = await getMyProfile();
    if (!profile) {
      throw redirect({ to: "/login" });
    }
    return profile;
  },
  component: OnboardingPage,
});

const PROFESSIONS = [
  "Electrician",
  "Nursing (Registered Nurse)",
  "Real Estate Agent",
];

const LICENSE_STATUS = [
  "No — just exploring",
  "In training / working toward the license",
  "Preparing to take the exam",
  "Licensed / certified — building a business",
];

const EXPERIENCE = [
  "None / just exploring",
  "Some related experience",
  "Experienced in the work",
  "Expert / deeply experienced",
];

const EDUCATION = [
  "High school / GED",
  "Some college / trade courses",
  "Certificate or diploma",
  "Associate degree",
  "Bachelor's degree",
  "Graduate degree",
];

const BUSINESS_TYPE = [
  "Solo / independent",
  "Small business (may hire)",
  "Full company / multi-person",
  "Not sure yet",
];

const TARGET_LAUNCH = [
  "Under 6 months",
  "6–12 months",
  "1–2 years",
  "2+ years",
  "Not sure yet",
];

const BUDGET = [
  "Under $5,000",
  "$5,000 – $15,000",
  "$15,000 – $50,000",
  "Over $50,000",
  "Not sure yet",
];

const FUNDING_GOALS = [
  "Build personal savings",
  "Get a small business loan",
  "Grant funding",
  "Investor / equity",
  "Not sure yet",
];

const emptyProfile: OnboardingProfile = {
  country: "",
  state: "",
  city: "",
  profession: "",
  license_status: "",
  business_type: "",
  target_launch: "",
  budget: "",
  experience: "",
  education: "",
  funding_goals: "",
};

const STEPS = [
  {
    title: "Where are you?",
    blurb: "Tell us the location that will govern your licensing and business.",
  },
  {
    title: "Profession & your career",
    blurb: "Which path are you pursuing, and where are you on it?",
  },
  {
    title: "Your business",
    blurb: "A few early details help us tailor your launch plan.",
  },
  {
    title: "Review & submit",
    blurb: "Check your answers, then save your profile.",
  },
];

function required(profile: OnboardingProfile, step: number): string | null {
  if (step === 0) {
    if (!profile.country.trim()) return "Please enter your country.";
    return null;
  }
  if (step === 1) {
    if (!profile.profession) return "Please choose your profession.";
    if (!profile.license_status) return "Please choose your current license status.";
    if (!profile.experience) return "Please choose your experience level.";
    if (!profile.education) return "Please choose your education level.";
    return null;
  }
  if (step === 2) {
    if (!profile.business_type) return "Please choose your desired business type.";
    if (!profile.budget) return "Please choose your available budget.";
    return null;
  }
  return null;
}

function OnboardingPage() {
  const initial = Route.useLoaderData();
  const router = useRouter();
  const loaded = initial?.onboarding ?? emptyProfile;
  const [profile, setProfile] = useState<OnboardingProfile>({
    ...emptyProfile,
    ...(loaded ?? {}),
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof OnboardingProfile>(key: K, value: string) =>
    setProfile((p) => ({ ...p, [key]: value }));

  function next() {
    setError(null);
    const err = required(profile, step);
    if (err) {
      setError(err);
      return;
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  }

  function back() {
    setError(null);
    if (step > 0) setStep((s) => s - 1);
  }

  async function submit() {
    setError(null);
    const err = required(profile, 3);
    if (err) {
      setError(err);
      setStep(2);
      return;
    }
    setSaving(true);
    const res = await saveOnboarding({ data: profile });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Could not save your profile.");
      return;
    }
    await router.invalidate();
    setDone(true);
  }

  if (done) {
    return <OnboardingDone user={initial?.name ?? "there"} profile={profile} />;
  }

  const pct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="py-10">
      <Container className="max-w-2xl">
        <SectionHeading
          title="Let's personalize your journey"
          subtitle={`Hi${initial?.name ? ", " + initial.name : ""} — answer a few quick questions. We'll use this to tailor your roadmap and business resources.`}
        />
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="font-medium text-navy">
            Step {step + 1} of {STEPS.length}
          </span>
          <SampleBadge />
        </div>
        <ProgressBar value={pct} className="mt-2" label={STEPS[step].title} />
        <Card className="mt-4">
          <p className="mb-5 text-sm text-slate-soft">{STEPS[step].blurb}</p>

          {step === 0 && (
            <div className="space-y-4">
              <Field label="Country" htmlFor="country">
                <Input
                  id="country"
                  value={profile.country}
                  onChange={(e) => set("country", e.target.value)}
                  placeholder="e.g. United States"
                />
              </Field>
              <Field label="State / province / region" htmlFor="state">
                <Input
                  id="state"
                  value={profile.state}
                  onChange={(e) => set("state", e.target.value)}
                  placeholder="e.g. Texas, or 'not sure yet'"
                />
              </Field>
              <Field label="City / county / local area" htmlFor="city">
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="e.g. Austin"
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field
                label="Which profession are you pursuing?"
                htmlFor="profession"
                hint="We currently cover 3 pilot professions — more coming soon."
              >
                <Select
                  id="profession"
                  value={profile.profession}
                  onChange={(e) => set("profession", e.target.value)}
                >
                  <option value="" disabled>
                    Select a profession…
                  </option>
                  {PROFESSIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Current license status" htmlFor="license_status">
                <Select
                  id="license_status"
                  value={profile.license_status}
                  onChange={(e) => set("license_status", e.target.value)}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {LICENSE_STATUS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Experience level" htmlFor="experience">
                <Select
                  id="experience"
                  value={profile.experience}
                  onChange={(e) => set("experience", e.target.value)}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {EXPERIENCE.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Education level" htmlFor="education">
                <Select
                  id="education"
                  value={profile.education}
                  onChange={(e) => set("education", e.target.value)}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {EDUCATION.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Desired business type" htmlFor="business_type">
                <Select
                  id="business_type"
                  value={profile.business_type}
                  onChange={(e) => set("business_type", e.target.value)}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {BUSINESS_TYPE.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Target launch date (roughly)" htmlFor="target_launch">
                <Select
                  id="target_launch"
                  value={profile.target_launch}
                  onChange={(e) => set("target_launch", e.target.value)}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {TARGET_LAUNCH.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Available budget to get started" htmlFor="budget">
                <Select
                  id="budget"
                  value={profile.budget}
                  onChange={(e) => set("budget", e.target.value)}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {BUDGET.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Funding goals" htmlFor="funding_goals">
                <Select
                  id="funding_goals"
                  value={profile.funding_goals}
                  onChange={(e) => set("funding_goals", e.target.value)}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {FUNDING_GOALS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <h3 className="text-lg">Review your answers</h3>
              <SummaryRow label="Country" value={profile.country} />
              <SummaryRow label="State / region" value={profile.state} />
              <SummaryRow label="City / area" value={profile.city} />
              <SummaryRow label="Profession" value={profile.profession} />
              <SummaryRow label="License status" value={profile.license_status} />
              <SummaryRow label="Experience level" value={profile.experience} />
              <SummaryRow label="Education level" value={profile.education} />
              <SummaryRow label="Business type" value={profile.business_type} />
              <SummaryRow label="Target launch" value={profile.target_launch} />
              <SummaryRow label="Budget" value={profile.budget} />
              <SummaryRow label="Funding goals" value={profile.funding_goals} />
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={step === 0}
            >
              ← Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next} size="lg">
                Next →
              </Button>
            ) : (
              <Button
                type="button"
                onClick={submit}
                size="lg"
                variant="gold"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save my profile"}
              </Button>
            )}
          </div>
        </Card>
      </Container>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-mist py-2 text-sm last:border-0">
      <span className="text-slate-soft">{label}</span>
      <span className="text-right font-medium text-navy">{value || "—"}</span>
    </div>
  );
}

function OnboardingDone({
  user,
  profile,
}: {
  user: string;
  profile: OnboardingProfile;
}) {
  return (
    <div className="py-12">
      <Container className="max-w-2xl">
        <SectionHeading
          title="Your profile is saved 🎉"
          subtitle={`Thanks, ${user}! Here are a few general next steps based on what you told us.`}
        />
        <Card className="mt-6">
          <h3 className="text-lg">Your next steps</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink">
            {nextSteps(profile).map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-bold text-emerald">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl border border-mist bg-mist/50 px-4 py-3 text-xs text-slate-soft">
            These are general first steps based on your profession and license
            status. Full personalization fills in during later milestones — your
            saved profile will drive a tailored roadmap, exam prep, and business
            plan.
          </p>
        </Card>
        <div className="mt-4">
          <Disclaimer />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asLink href="/roadmap" variant="secondary">
            View the roadmap
          </Button>
          <Button asLink href="/professions">
            Explore professions
          </Button>
          <Button asLink href="/explorer" variant="ghost">
            Compare careers
          </Button>
        </div>
      </Container>
    </div>
  );
}

/** Simple, clearly-labeled personalization derived from profession + license status. */
function nextSteps(profile: OnboardingProfile): string[] {
  const licensed = /licensed|licens/i.test(profile.license_status) &&
    !/no |just exploring/i.test(profile.license_status);
  if (licensed) {
    return [
      `Research business structures and register your ${profile.profession || "licensed"} business.`,
      "Build a startup budget and working-capital buffer for your first months.",
      "Review funding options and check funding readiness before you spend.",
    ];
  }
  return [
    `Confirm licensing requirements for ${profile.profession || "your profession"} with your local licensing authority.`,
    "Choose an approved education or training path and start your coursework / hours.",
    "Prepare for the licensing exam with a dedicated study plan.",
  ];
}
