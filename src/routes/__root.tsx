import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "~/styles/app.css?url";
import { AppShell } from "~/components/layout";
import { UserCtx } from "~/lib/ctx";
import { getCurrentUser } from "~/server/fns";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "License2Launch — Prep for the license, launch the business",
      },
      {
        name: "description",
        content:
          "License2Launch helps you prepare for professional licensing exams and turn your qualification into a legitimate small business.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  loader: () => getCurrentUser(),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-3xl">Page not found</h1>
      <p className="mt-2 text-slate-soft">
        The page you're looking for doesn't exist.
      </p>
    </div>
  ),
});

function RootComponent() {
  const user = Route.useLoaderData();
  return (
    <UserCtx.Provider value={user}>
      <RootDocument>
        <AppShell user={user}>
          <Outlet />
        </AppShell>
      </RootDocument>
    </UserCtx.Provider>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
