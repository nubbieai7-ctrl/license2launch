import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button, Card, Container, Field, Input } from "~/components/ui";
import { registerFn } from "~/server/fns";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await registerFn({ data: { name, email, password } });
      if (!res.ok) {
        setError(res.error ?? "Registration failed.");
        setBusy(false);
        return;
      }
      await router.invalidate();
      await router.navigate({ to: "/onboarding" });
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="py-16">
      <Container className="max-w-md">
        <Card>
          <h1 className="text-2xl font-extrabold">Create your account</h1>
          <p className="mt-1 text-sm text-slate-soft">
            Save your progress and get a personalized roadmap.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Full name" htmlFor="name">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Alex Rivera"
              />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              hint="At least 8 characters."
            >
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
              />
            </Field>
            {error && (
              <p className="text-sm font-medium text-danger" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-soft">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-emerald">
              Log in
            </Link>
          </p>
        </Card>
      </Container>
    </div>
  );
}
