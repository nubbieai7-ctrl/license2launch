import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Button,
  Card,
  Container,
  Disclaimer,
  ProgressBar,
  SampleBadge,
  SectionHeading,
} from "~/components/ui";
import { useUser } from "~/lib/ctx";
import {
  answerQuestion,
  getExamProgress,
  listCourseLessons,
  listExamCourses,
  listPracticeQuestions,
  type ExamCourse,
  type ExamProgress,
  type Lesson,
  type PracticeQuestion,
} from "~/server/fns";

export const Route = createFileRoute("/exam")({
  loader: async () => {
    const [courses, questions] = await Promise.all([
      listExamCourses(),
      listPracticeQuestions({ data: {} }),
    ]);
    return { courses, questions };
  },
  component: ExamPage,
});

const diffTone: Record<string, "emerald" | "gold" | "danger" | "gray"> = {
  easy: "emerald",
  medium: "gold",
  hard: "danger",
};

type Tab = "courses" | "practice" | "progress";

function ExamPage() {
  const { courses, questions } = Route.useLoaderData();
  const user = useUser();

  const [tab, setTab] = useState<Tab>("courses");
  const [professionFilter, setProfessionFilter] = useState<number | "all">("all");
  const [selectedCourse, setSelectedCourse] = useState<ExamCourse | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  const [practiceIndex, setPracticeIndex] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [answerMsg, setAnswerMsg] = useState<string | null>(null);

  const [progress, setProgress] = useState<ExamProgress | null>(null);

  const filteredQuestions = useMemo(() => {
    if (professionFilter === "all") return questions;
    return questions.filter((q) => q.profession_id === professionFilter);
  }, [questions, professionFilter]);

  const current =
    practiceIndex != null && practiceIndex < filteredQuestions.length
      ? filteredQuestions[practiceIndex]
      : null;

  // Refresh progress when signed in (also after answering a question).
  useEffect(() => {
    if (!user) {
      setProgress(null);
      return;
    }
    getExamProgress({
      data: professionFilter === "all" ? {} : { professionId: professionFilter as number },
    }).then((p) => setProgress(p));
  }, [user, professionFilter, practiceIndex]);

  async function openCourse(course: ExamCourse) {
    setSelectedCourse(course);
    const ls = await listCourseLessons({ data: { courseId: course.id } });
    setLessons(ls);
    setActiveLesson(ls.length ? ls[0] : null);
  }

  async function submitAnswer() {
    if (!current || chosen == null) return;
    const res = await answerQuestion({ data: { questionId: current.id, optionIndex: chosen } });
    setSubmitted({ correct: res.correct, explanation: res.explanation });
    setAnswerMsg(
      res.loggedIn ? null : "Not signed in — this answer won't be included in your progress tracking.",
    );
  }

  function nextQuestion() {
    setChosen(null);
    setSubmitted(null);
    setAnswerMsg(null);
    if (practiceIndex != null && practiceIndex < filteredQuestions.length - 1) {
      setPracticeIndex(practiceIndex + 1);
    } else {
      setPracticeIndex(null); // finished the set
    }
  }

  return (
    <div className="py-12">
      <Container>
        <SectionHeading
          title="Exam preparation center"
          subtitle="Sample lessons, practice questions, and progress tracking to help you prepare for licensing day."
        />
        <div className="mt-4 max-w-2xl">
          <div className="rounded-xl border border-warn/30 bg-warn-bg px-4 py-3 text-sm text-warn">
            All lessons and questions here are <strong>SAMPLE practice content</strong> for study
            and organization only. They are not the official exam and do not predict your real exam
            score or pass rate. Always prepare with your state-approved curriculum and the official
            licensing authority.
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Exam sections">
          {(
            [
              ["courses", "Courses & lessons"],
              ["practice", "Practice questions"],
              ["progress", "My progress"],
            ] as Array<[Tab, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors l2l-focus ${
                tab === key ? "bg-navy text-white" : "bg-mist text-navy hover:bg-mist/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Profession filter */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-navy">Profession:</span>
          <button
            type="button"
            onClick={() => setProfessionFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-semibold l2l-focus ${
              professionFilter === "all" ? "bg-emerald text-white" : "bg-mist text-navy hover:bg-mist/70"
            }`}
          >
            All
          </button>
          {[...new Set(courses.map((c) => c.profession_slug))].map((slug) => {
            const c = courses.find((x) => x.profession_slug === slug)!;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => setProfessionFilter(c.profession_id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold l2l-focus ${
                  professionFilter === c.profession_id
                    ? "bg-emerald text-white"
                    : "bg-mist text-navy hover:bg-mist/70"
                }`}
              >
                {c.profession_name}
              </button>
            );
          })}
        </div>

        {tab === "courses" && (
          <CoursesTab
            courses={courses.filter((c) => professionFilter === "all" || c.profession_id === professionFilter)}
            selectedCourse={selectedCourse}
            lessons={lessons}
            activeLesson={activeLesson}
            onOpen={openCourse}
            onBack={() => setSelectedCourse(null)}
            onSelectLesson={setActiveLesson}
          />
        )}

        {tab === "practice" && (
          <PracticeTab
            questions={filteredQuestions}
            current={current}
            index={practiceIndex}
            chosen={chosen}
            setChosen={setChosen}
            submitted={submitted}
            onSubmit={submitAnswer}
            onNext={nextQuestion}
            onStart={() => setPracticeIndex(0)}
            answerMsg={answerMsg}
          />
        )}

        {tab === "progress" && <ProgressTab user={user} progress={progress} />}

        <div className="mt-10 max-w-2xl">
          <Disclaimer />
        </div>
      </Container>
    </div>
  );
}

function CoursesTab({
  courses,
  selectedCourse,
  lessons,
  activeLesson,
  onOpen,
  onBack,
  onSelectLesson,
}: {
  courses: ExamCourse[];
  selectedCourse: ExamCourse | null;
  lessons: Lesson[];
  activeLesson: Lesson | null;
  onOpen: (c: ExamCourse) => void;
  onBack: () => void;
  onSelectLesson: (l: Lesson) => void;
}) {
  if (selectedCourse) {
    return (
      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-semibold text-emerald hover:underline l2l-focus"
          >
            ← All courses
          </button>
          <h3 className="mt-4 text-lg font-bold text-navy">{selectedCourse.title}</h3>
          <p className="mt-1 text-sm text-slate-soft">{selectedCourse.profession_name}</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {lessons.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => onSelectLesson(l)}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium l2l-focus ${
                  activeLesson?.id === l.id
                    ? "bg-navy text-white"
                    : "bg-mist text-navy hover:bg-mist/70"
                }`}
              >
                {l.title}
              </button>
            ))}
          </div>
        </div>
        <Card>
          {activeLesson ? (
            <>
              <div className="flex items-center gap-2">
                <SampleBadge />
                <span className="text-xs text-slate-soft">Sample study content</span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-navy">{activeLesson.title}</h3>
              <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
                {activeLesson.body}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-soft">Select a lesson to read it.</p>
          )}
        </Card>
      </div>
    );
  }
  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <Card key={c.id} title={c.title} subtitle={c.profession_name}>
          <div className="flex items-center gap-2">
            <SampleBadge />
            <span className="text-xs text-slate-soft">{c.lesson_count} lessons</span>
            <span className="text-xs text-slate-soft">· {c.question_count} practice Qs</span>
          </div>
          <p className="mt-2 text-sm text-slate-soft">{c.description}</p>
          <Button size="sm" className="mt-4" onClick={() => onOpen(c)}>
            Open course
          </Button>
        </Card>
      ))}
      {courses.length === 0 && (
        <p className="text-sm text-slate-soft">No courses for this selection yet.</p>
      )}
    </div>
  );
}

function PracticeTab({
  questions,
  current,
  index,
  chosen,
  setChosen,
  submitted,
  onSubmit,
  onNext,
  onStart,
  answerMsg,
}: {
  questions: PracticeQuestion[];
  current: PracticeQuestion | null;
  index: number | null;
  chosen: number | null;
  setChosen: (i: number) => void;
  submitted: { correct: boolean; explanation: string } | null;
  onSubmit: () => void;
  onNext: () => void;
  onStart: () => void;
  answerMsg: string | null;
}) {
  if (questions.length === 0) {
    return (
      <Card className="mt-8">
        <p className="text-sm text-slate-soft">No practice questions for this selection yet.</p>
      </Card>
    );
  }
  if (current == null) {
    return (
      <Card className="mt-8">
        <div className="flex items-center gap-2">
          <SampleBadge />
        </div>
        <h3 className="mt-3 text-lg font-bold text-navy">
          {index === null ? "Ready to practice?" : "Set complete — nice work!"}
        </h3>
        <p className="mt-1 text-sm text-slate-soft">
          {index === null
            ? `You have ${questions.length} sample practice questions in this set. Answer them one at a time and see instant explanations.`
            : "You've worked through this set of sample questions."}
        </p>
        {index === null && (
          <Button className="mt-4" onClick={onStart}>
            Start practice
          </Button>
        )}
      </Card>
    );
  }
  return (
    <div className="mt-8 max-w-2xl">
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <SampleBadge />
          <Badge tone={diffTone[current.difficulty] ?? "gray"}>{current.difficulty}</Badge>
          {current.topic && <Badge tone="navy">{current.topic}</Badge>}
          <span className="ml-auto text-xs text-slate-soft">
            Question {(index ?? 0) + 1} of {questions.length}
          </span>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-navy">{current.question}</h3>
        <div className="mt-4 space-y-2">
          {current.options.map((opt, i) => {
            let cls = "border-mist bg-white hover:border-emerald";
            if (submitted && i === chosen) {
              cls = submitted.correct
                ? "border-emerald bg-emerald/10 text-emerald-800"
                : "border-danger bg-danger/10 text-danger";
            } else if (submitted && !submitted.correct) {
              // no correct reveal to keep it self-directed; only hides harshness
            }
            return (
              <button
                key={i}
                type="button"
                disabled={!!submitted}
                onClick={() => setChosen(i)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium text-ink transition-colors l2l-focus disabled:opacity-80 ${cls}`}
                aria-pressed={chosen === i}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-mist text-xs font-bold text-navy">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {!submitted ? (
          <div className="mt-4">
            <Button size="sm" onClick={onSubmit} disabled={chosen == null}>
              Submit answer
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                submitted.correct ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
              }`}
            >
              {submitted.correct ? "Correct!" : "Not quite."} {submitted.explanation}
            </div>
            {answerMsg && <p className="mt-2 text-xs text-slate-soft">{answerMsg}</p>}
            <Button size="sm" variant="gold" className="mt-4" onClick={onNext}>
              {index != null && index < questions.length - 1 ? "Next question" : "Finish set"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function ProgressTab({
  user,
  progress,
}: {
  user: ReturnType<typeof useUser>;
  progress: ExamProgress | null;
}) {
  if (!user) {
    return (
      <Card className="mt-8 max-w-2xl">
        <h3 className="text-lg font-bold text-navy">Sign in to track exam progress</h3>
        <p className="mt-1 text-sm text-slate-soft">
          Log in to save your practice answers, see your percentage answered and correct, and review
          per-topic accuracy.
        </p>
        <Button asLink href="/login" size="md" className="mt-4">
          Log in
        </Button>
      </Card>
    );
  }
  if (!progress) {
    return (
      <Card className="mt-8 max-w-2xl">
        <p className="text-sm text-slate-soft">Loading your progress…</p>
      </Card>
    );
  }
  return (
    <div className="mt-8 grid max-w-3xl gap-5 sm:grid-cols-2">
      <Card>
        <h3 className="text-lg font-bold text-navy">Answered</h3>
        <div className="mt-2">
          <ProgressBar label={`${progress.answered} of ${progress.totalQuestions} answered`} value={progress.answered} max={progress.totalQuestions} />
        </div>
        <p className="mt-2 text-xs text-slate-soft">Sample practice questions only.</p>
      </Card>
      <Card>
        <h3 className="text-lg font-bold text-navy">Accuracy</h3>
        <div className="mt-2">
          <ProgressBar
            label={`${progress.correct} correct of ${progress.answered} answered`}
            value={progress.pctCorrect}
          />
        </div>
        <p className="mt-2 text-xs text-slate-soft">
          Percentage of answered sample questions answered correctly.
        </p>
      </Card>

      {progress.byTopic.length > 0 && (
        <Card className="sm:col-span-2">
          <h3 className="text-lg font-bold text-navy">Accuracy by topic</h3>
          <div className="mt-3 space-y-3">
            {progress.byTopic.map((t) => (
              <div key={t.topic}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-navy">{t.topic || "General"}</span>
                  <span className="text-slate-soft">
                    {t.correct}/{t.answered} · {t.accuracy}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-mist">
                  <div
                    className={`h-full rounded-full ${t.accuracy < 60 ? "bg-gold" : "bg-emerald"}`}
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {progress.weakTopics.length > 0 && (
        <Card className="border-gold/40 bg-gold/5 sm:col-span-2">
          <h3 className="text-lg font-bold text-navy">Areas to review</h3>
          <p className="mt-1 text-sm text-slate-soft">
            Based on your sample answers, these topics had lower accuracy. Remember: this is
            <strong> sample-derived guidance only</strong> — it is not a prediction of your real exam.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {progress.weakTopics.map((t) => (
              <Badge key={t} tone="warn">{t || "General"}</Badge>
            ))}
          </div>
        </Card>
      )}

      {progress.answered === 0 && (
        <p className="text-sm text-slate-soft sm:col-span-2">
          No sample questions answered yet. Head to the Practice tab to start.
        </p>
      )}
    </div>
  );
}
