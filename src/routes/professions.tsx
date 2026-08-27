import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Badge,
  Card,
  Container,
  Field,
  Input,
  SampleBadge,
  SectionHeading,
  Select,
} from "~/components/ui";
import { listProfessions } from "~/server/fns";

export const Route = createFileRoute("/professions")({
  loader: () => listProfessions(),
  component: ProfessionsList,
});

function ProfessionsList() {
  const professions = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(professions.map((p) => p.category))).sort(),
    [professions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return professions.filter((p) => {
      const inCategory = !category || p.category === category;
      const haystack = `${p.name} ${p.category} ${p.description}`.toLowerCase();
      const matches = !q || haystack.includes(q);
      return inCategory && matches;
    });
  }, [professions, query, category]);

  return (
    <div className="py-12">
      <Container>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeading
            title="Explore professions"
            subtitle="Pick a licensed path and see what it takes to prepare and launch."
          />
          <SampleBadge />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field label="Search professions" htmlFor="prof-search">
            <Input
              id="prof-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, keyword, or description…"
              aria-label="Search professions"
            />
          </Field>
          <Field label="Filter by category" htmlFor="prof-category">
            <Select
              id="prof-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="sm:w-56"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <p className="mt-3 text-sm text-slate-soft" role="status">
          {filtered.length} of {professions.length} professions shown
          {category ? ` in ${category}` : ""}
          {query ? ` matching “${query}”` : ""}.
        </p>

        {filtered.length === 0 ? (
          <Card className="mt-6 text-center">
            <p className="text-slate-soft">
              No professions match your search. Try a different keyword or
              category.
            </p>
          </Card>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.slug}
                to="/professions/$slug"
                params={{ slug: p.slug }}
                className="group"
              >
                <Card className="h-full transition-shadow group-hover:shadow-lg">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge tone="emerald">{p.category}</Badge>
                    {p.is_sample && <SampleBadge />}
                  </div>
                  <h3 className="text-xl">{p.name}</h3>
                  <p className="mt-2 line-clamp-4 text-sm text-slate-soft">
                    {p.description}
                  </p>
                  <span className="mt-4 inline-block text-sm font-semibold text-emerald">
                    View profession →
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
          <SampleBadge />
          <p className="mt-2 max-w-3xl text-xs text-slate-soft">
            All pilot profession content on this site is sample data for
            illustration. Requirements, exams, costs, and links can change.
            Always confirm the details with the agency that licenses your
            profession in your area.
          </p>
        </div>
      </Container>
    </div>
  );
}
