import { useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Container } from "~/components/ui";
import { logoutFn } from "~/server/fns";

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
});

function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    (async () => {
      await logoutFn();
      if (!active) return;
      await router.invalidate();
      await router.navigate({ to: "/" });
    })();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="py-24">
      <Container className="max-w-md text-center">
        <h1 className="text-2xl font-extrabold">Logging out…</h1>
        <p className="mt-2 text-sm text-slate-soft">
          You&apos;ll be redirected to the home page in a moment.
        </p>
      </Container>
    </div>
  );
}
