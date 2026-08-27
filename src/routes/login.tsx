import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button, Card, Container, Field, Input } from "~/components/ui";
import { loginFn } from "~/server/fns";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await loginFn({ data: { email, password } });
      if (!res.ok) {
        setError(res.error ?? "Login failed.");
        setBusy(false);
        return;
      }
      await router.invalidate();
      await router.navigate({ to: "/dashboard" });
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="py-16">
      <Container className="max-w-md">
        <Card>
          <h1 className="text-2xl font-extrabold">Log in</h1>
          <p className="mt-1 text-sm text-slate-soft">
            Welcome back — continue your path from license to launch.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
            <Field label="Password" htmlFor="password" hint="Your password is stored securely.">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </Field>
            {error && (
              <p className="text-sm font-medium text-danger" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Logging in…" : "Log in"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-soft">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-emerald">
              Create one
            </Link>
          </p>
        </Card>
      </Container>
    </div>
  );
}
