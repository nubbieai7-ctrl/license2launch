import { useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Badge,
  Button,
  Card,
  Container,
  Disclaimer,
  Field,
  Input,
  ProgressBar,
  SectionHeading,
  Textarea,
} from "~/components/ui";
import { useUser } from "~/lib/ctx";
import { getMyRoadmap, updateRoadmapTask, type RoadmapStatus, type RoadmapTaskWithProgress } from "~/server/fns";

export const Route = createFileRoute("/roadmap")({
  loader: () => getMyRoadmap({ data: {} }),
  component: RoadmapPage,
});

/* Map the stored task categories to the milestone's journey groups. */
const groupOrder = ["Explore", "Educate", "Prepare", "Launch", "Grow"];
const groupMap: Record<string, string> = {
  research: "Explore",
  licensing: "Prepare",
  education: "Educate",
  exam: "Educate",
  business: "Prepare",
  finance: "Prepare",
  operations: "Prepare",
  marketing: "Launch",
  launch: "Launch",
  grow: "Grow",
};

const diffLabel: Record<string, string> = { easy: "Low", medium: "Med", hard: "High" };
const diffTone: Record<string, "emerald" | "gold" | "danger" | "gray"> = {
  easy: "emerald",
  medium: "gold",
  hard: "danger",
};

const statusTone: Record<RoadmapStatus, "gray" | "navy" | "emerald"> = {
  not_started: "gray",
  in_progress: "navy",
  done: "emerald",
};
const statusLabel: Record<RoadmapStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

type Filter = "all" | "complete" | "incomplete";

function RoadmapPage() {
  const tasks = Route.useLoaderData();
  const user = useUser();
  const router = useRouter();
  const [items, setItems] = useState<RoadmapTaskWithProgress[]>(tasks);
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});
  const [deadlineDraft, setDeadlineDraft] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  const doneCount = items.filter((t) => t.status === "done").length;

  const groups = useMemo(() => {
    const map = new Map<string, RoadmapTaskWithProgress[]>();
    for (const t of items) {
      const g = groupMap[t.category] ?? "Prepare";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(t);
    }
    // Newest filter applies across the whole list (counted before grouping).
    return map;
  }, [items]);

  function visible(tasks: RoadmapTaskWithProgress[]): RoadmapTaskWithProgress[] {
    if (filter === "complete") return tasks.filter((t) => t.status === "done");
    if (filter === "incomplete") return tasks.filter((t) => t.status !== "done");
    return tasks;
  }

  async function requireLogin(): Promise<boolean> {
    if (user) return true;
    await router.navigate({ to: "/login" });
    return false;
  }

  async function setStatus(task: RoadmapTaskWithProgress, status: RoadmapStatus) {
    if (!(await requireLogin())) return;
    setItems((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    const res = await updateRoadmapTask({ data: { taskId: task.id, status } });
    if (!res.ok) {
      if (res.error && res.error.includes("logged in")) {
        await router.navigate({ to: "/login" });
        return;
      }
      // revert optimistic update on failure
      setItems((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }
  }

  async function saveDetails(task: RoadmapTaskWithProgress) {
    if (!(await requireLogin())) return;
    setSaving(task.id);
    const res = await updateRoadmapTask({
      data: {
        taskId: task.id,
        status: task.status,
        notes: notesDraft[task.id] ?? task.notes,
        deadline: deadlineDraft[task.id] || null,
      },
    });
    if (res.ok) {
      setItems((prev) => prev.map((t) => (t.id === task.id ? res.ok ? res.task : t : t)));
      setExpanded(null);
    } else if (res.error && res.error.includes("logged in")) {
      await router.navigate({ to: "/login" });
    }
    setSaving(null);
  }

  const completeTotal = items.filter((t) => t.status !== "done").length + doneCount;

  return (
    <div className="py-12">
      <Container>
        <SectionHeading
          title="Your career roadmap"
          subtitle="A step-by-step path from preparation to launching your business. Track your progress, deadlines, and notes as you go."
        />
        <div className="mt-6 max-w-2xl">
          <ProgressBar
            label={`Progress — ${doneCount} of ${items.length} complete`}
            value={doneCount}
            max={items.length}
          />
        </div>

        {!user && (
          <Card className="mt-6 border-emerald/40 bg-emerald/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg">Sign in to save your progress</h3>
                <p className="mt-1 text-sm text-slate-soft">
                  This is a read-only view. Log in to mark tasks done, set deadlines, and add
                  notes — your progress will persist.
                </p>
              </div>
              <div>
                <Button asLink href="/login" size="md">Log in</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <div className="mt-8 flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter roadmap">
          {(
            [
              ["all", "All"],
              ["complete", "Complete"],
              ["incomplete", "Incomplete"],
            ] as Array<[Filter, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors l2l-focus ${
                filter === key ? "bg-navy text-white" : "bg-mist text-navy hover:bg-mist/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-10">
          {groupOrder.map((group) => {
            const tasks = visible(groups.get(group) ?? []);
            if (tasks.length === 0) return null;
            return (
              <section key={group} aria-label={group}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-xl font-bold text-navy">{group}</h3>
                  <span className="h-px flex-1 bg-mist" />
                  <span className="text-sm text-slate-soft">
                    {tasks.filter((t) => t.status === "done").length}/{tasks.length} done
                  </span>
                </div>
                <div className="space-y-3">
                  {tasks.map((t) => (
                    <RoadmapCard
                      key={t.id}
                      task={t}
                      expanded={expanded === t.id}
                      onExpand={() => setExpanded(expanded === t.id ? null : t.id)}
                      onStatus={(s) => setStatus(t, s)}
                      saving={saving === t.id}
                      notesDraft={notesDraft[t.id] ?? t.notes}
                      deadlineDraft={deadlineDraft[t.id] ?? t.deadline ?? ""}
                      onNotes={(v) => setNotesDraft((m) => ({ ...m, [t.id]: v }))}
                      onDeadline={(v) => setDeadlineDraft((m) => ({ ...m, [t.id]: v }))}
                      onSave={() => saveDetails(t)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 max-w-2xl space-y-4">
          <p className="text-sm text-slate-soft">
            This roadmap is general guidance built on sample data. Requirement specifics
            (hours, courses, exams, fees) vary by state — always confirm with your licensing
            authority before relying on any step.
          </p>
          {completeTotal > 0 && <Disclaimer />}
        </div>
      </Container>
    </div>
  );
}

function RoadmapCard({
  task,
  expanded,
  onExpand,
  onStatus,
  saving,
  notesDraft,
  deadlineDraft,
  onNotes,
  onDeadline,
  onSave,
}: {
  task: RoadmapTaskWithProgress;
  expanded: boolean;
  onExpand: () => void;
  onStatus: (s: RoadmapStatus) => void;
  saving: boolean;
  notesDraft: string;
  deadlineDraft: string;
  onNotes: (v: string) => void;
  onDeadline: (v: string) => void;
  onSave: () => void;
}) {
  const done = task.status === "done";
  return (
    <Card className={`${done ? "opacity-80" : ""}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          aria-label={`Mark "${task.title}" done`}
          checked={done}
          onChange={() => onStatus(done ? "in_progress" : "done")}
          className="mt-1 size-5 shrink-0 accent-emerald l2l-focus"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-soft">Step {task.step_order}</span>
            <Badge tone={diffTone[task.difficulty] ?? "gray"}>
              {diffLabel[task.difficulty] ?? task.difficulty}
            </Badge>
            <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
            {task.profession_name && <Badge tone="gold">{task.profession_name}</Badge>}
            <button
              type="button"
              onClick={onExpand}
              aria-expanded={expanded}
              className="ml-auto text-sm font-semibold text-emerald hover:underline l2l-focus"
            >
              {expanded ? "Close" : "Details"}
            </button>
          </div>
          <h3 className={`mt-1.5 text-lg ${done ? "line-through decoration-emerald/60" : ""}`}>{task.title}</h3>
          <p className="mt-1 text-sm text-slate-soft">{task.description}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-soft">
            <span>⏱ {task.est_time}</span>
            <span>Suggested deadline: ~{task.suggested_deadline_days} days</span>
            {task.deadline && <span className="font-semibold text-navy">My deadline: {task.deadline}</span>}
          </div>

          {!expanded && task.notes && (
            <p className="mt-2 rounded-lg bg-mist/60 px-3 py-2 text-xs text-slate-soft">
              Notes: {task.notes}
            </p>
          )}

          {expanded && (
            <div className="mt-3 space-y-4 rounded-xl border border-mist bg-mist/20 p-4">
              <div className="flex flex-wrap gap-2">
                {(["not_started", "in_progress", "done"] as RoadmapStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onStatus(s)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold l2l-focus ${
                      task.status === s ? "bg-navy text-white" : "bg-white text-navy border border-mist"
                    }`}
                  >
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
              <Field label="My deadline" htmlFor={`deadline-${task.id}`}>
                <Input
                  id={`deadline-${task.id}`}
                  type="date"
                  value={deadlineDraft}
                  onChange={(e) => onDeadline(e.target.value)}
                />
              </Field>
              <Field label="Notes" htmlFor={`notes-${task.id}`}>
                <Textarea
                  id={`notes-${task.id}`}
                  value={notesDraft}
                  onChange={(e) => onNotes(e.target.value)}
                  placeholder="e.g. Called the state board — confirmed steps and fees"
                />
              </Field>
              <div className="flex items-center gap-3">
                <Button size="sm" onClick={onSave} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                {task.official_link ? (
                  <a
                    href={task.official_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-emerald hover:underline l2l-focus"
                  >
                    Official resource ↗
                  </a>
                ) : (
                  <span className="text-xs text-slate-soft">
                    Confirm requirements with your licensing authority
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
