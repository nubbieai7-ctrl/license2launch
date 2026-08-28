/**
 * License2Launch — server functions (M1)
 * All DB access is server-side only, exposed to routes/components via
 * createServerFn handlers. Client code never touches SQLite directly.
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { initDb, db, parseJson } from "./db";
import {
  SESSION_COOKIE,
  createSession,
  identityFromToken,
  destroySession,
  type Identity,
} from "./auth";

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

const cookieOpts = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30,
};

export const getCurrentUser = createServerFn().handler(async (): Promise<Identity | null> => {
  await initDb();
  return identityFromToken(db(), getCookie(SESSION_COOKIE));
});

export type AuthResult = { ok: boolean; error?: string; user?: Identity };

export const loginFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { email: string; password: string } }): Promise<AuthResult> => {
    await initDb();
    const email = data.email.trim().toLowerCase();
    const row = db()
      .query("SELECT * FROM users WHERE email = $email")
      .get({ $email: email }) as
      | { id: number; email: string; password_hash: string; name: string; role: "user" | "admin" }
      | undefined;
    if (!row) return { ok: false, error: "Invalid email or password." };
    const valid = await Bun.password.verify(data.password, row.password_hash);
    if (!valid) return { ok: false, error: "Invalid email or password." };
    const token = createSession(db(), row.id);
    setCookie(SESSION_COOKIE, token, cookieOpts);
    return { ok: true, user: { id: row.id, email: row.email, name: row.name, role: row.role } };
  },
);

export const registerFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { email: string; password: string; name: string } }): Promise<AuthResult> => {
    await initDb();
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();
    if (!email || !data.password || !name) {
      return { ok: false, error: "Name, email, and password are required." };
    }
    if (data.password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters." };
    }
    const existing = db()
      .query("SELECT id FROM users WHERE email = $email")
      .get({ $email: email });
    if (existing) return { ok: false, error: "An account with that email already exists." };
    const hash = await Bun.password.hash(data.password);
    const info = db()
      .query("INSERT INTO users (email, password_hash, name, role) VALUES ($email, $hash, $name, 'user')")
      .run({ $email: email, $hash: hash, $name: name });
    const id = Number(info.lastInsertRowid);
    const token = createSession(db(), id);
    setCookie(SESSION_COOKIE, token, cookieOpts);
    return { ok: true, user: { id, email, name, role: "user" } };
  },
);

export const logoutFn = createServerFn({ method: "POST" }).handler(async (): Promise<{ ok: boolean }> => {
  await initDb();
  destroySession(db(), getCookie(SESSION_COOKIE));
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/* Domain data                                                         */
/* ------------------------------------------------------------------ */

export interface ProfessionSummary {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  is_sample: boolean;
}

export const listProfessions = createServerFn().handler(async (): Promise<ProfessionSummary[]> => {
  await initDb();
  const rows = db()
    .query(
      `SELECT id, name, slug, category, description, is_sample
         FROM professions ORDER BY name`,
    )
    .all() as Array<{
    id: number;
    name: string;
    slug: string;
    category: string;
    description: string;
    is_sample: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    category: r.category,
    description: r.description,
    is_sample: r.is_sample === 1,
  }));
});

export interface ProfessionDetail extends ProfessionSummary {
  typical_customers: string[];
  required_skills: string[];
  suggested_education: string[];
  licenses_certifications: string[];
  exam_names: string[];
  exam_subjects: string[];
  business_opportunities: string[];
  startup_cost_range: string;
  equipment_requirements: string[];
  insurance_considerations: string[];
  revenue_models: string[];
  typical_risks: string[];
  marketing_channels: string[];
  funding_options: string[];
  employees_subcontractors: string[];
  official_links: Array<{ label: string; url: string }>;
  location_requirements: string;
  last_reviewed: string;
  admin_notes: string;
}

export const getProfession = createServerFn().handler(
  async ({ data }: { data: { slug: string } }): Promise<ProfessionDetail | null> => {
    await initDb();
    const r = db()
      .query("SELECT * FROM professions WHERE slug = $slug")
      .get({ $slug: data.slug }) as Record<string, unknown> | undefined;
    if (!r) return null;
    return professionRow(r);
  },
);

function professionRow(r: Record<string, unknown>): ProfessionDetail {
  return {
    id: Number(r.id),
    name: String(r.name),
    slug: String(r.slug),
    category: String(r.category),
    description: String(r.description),
    is_sample: Number(r.is_sample) === 1,
    typical_customers: parseJson<string[]>(r.typical_customers as string, []),
    required_skills: parseJson<string[]>(r.required_skills as string, []),
    suggested_education: parseJson<string[]>(r.suggested_education as string, []),
    licenses_certifications: parseJson<string[]>(r.licenses_certifications as string, []),
    exam_names: parseJson<string[]>(r.exam_names as string, []),
    exam_subjects: parseJson<string[]>(r.exam_subjects as string, []),
    business_opportunities: parseJson<string[]>(r.business_opportunities as string, []),
    startup_cost_range: String(r.startup_cost_range ?? ""),
    equipment_requirements: parseJson<string[]>(r.equipment_requirements as string, []),
    insurance_considerations: parseJson<string[]>(r.insurance_considerations as string, []),
    revenue_models: parseJson<string[]>(r.revenue_models as string, []),
    typical_risks: parseJson<string[]>(r.typical_risks as string, []),
    marketing_channels: parseJson<string[]>(r.marketing_channels as string, []),
    funding_options: parseJson<string[]>(r.funding_options as string, []),
    employees_subcontractors: parseJson<string[]>(r.employees_subcontractors as string, []),
    official_links: parseJson<Array<{ label: string; url: string }>>(
      r.official_links as string,
      [],
    ),
    location_requirements: String(r.location_requirements ?? ""),
    last_reviewed: String(r.last_reviewed ?? ""),
    admin_notes: String(r.admin_notes ?? ""),
  };
}

export interface BusinessModel {
  id: number;
  profession_id: number;
  name: string;
  description: string;
  target_customers: string[];
  services: string[];
  startup_equipment: string[];
  startup_cost_categories: Array<{ label: string; amount: number }>;
  pricing_methods: string[];
  revenue_streams: string[];
  insurance: string[];
  marketing_methods: string[];
  risks: string[];
  hiring_needs: string[];
  validation_experiment: string;
  first_ten_customer_ideas: string[];
  funding_readiness: string[];
  is_sample: boolean;
}

export const listBusinessModels = createServerFn().handler(
  async ({ data }: { data: { professionId?: number } }): Promise<BusinessModel[]> => {
    await initDb();
    const rows = (data.professionId
      ? db()
          .query("SELECT * FROM business_models WHERE profession_id = $pid ORDER BY id")
          .all({ $pid: data.professionId })
      : db().query("SELECT * FROM business_models ORDER BY id").all()) as Array<
      Record<string, unknown>
    >;
    return rows.map((r) => ({
      id: Number(r.id),
      profession_id: Number(r.profession_id),
      name: String(r.name),
      description: String(r.description),
      target_customers: parseJson<string[]>(r.target_customers as string, []),
      services: parseJson<string[]>(r.services as string, []),
      startup_equipment: parseJson<string[]>(r.startup_equipment as string, []),
      startup_cost_categories: parseJson<Array<{ label: string; amount: number }>>(
        r.startup_cost_categories as string,
        [],
      ),
      pricing_methods: parseJson<string[]>(r.pricing_methods as string, []),
      revenue_streams: parseJson<string[]>(r.revenue_streams as string, []),
      insurance: parseJson<string[]>(r.insurance as string, []),
      marketing_methods: parseJson<string[]>(r.marketing_methods as string, []),
      risks: parseJson<string[]>(r.risks as string, []),
      hiring_needs: parseJson<string[]>(r.hiring_needs as string, []),
      validation_experiment: String(r.validation_experiment ?? ""),
      first_ten_customer_ideas: parseJson<string[]>(r.first_ten_customer_ideas as string, []),
      funding_readiness: parseJson<string[]>(r.funding_readiness as string, []),
      is_sample: Number(r.is_sample) === 1,
    }));
  },
);

export interface RoadmapTask {
  id: number;
  profession_id: number | null;
  step_order: number;
  title: string;
  description: string;
  difficulty: string;
  est_time: string;
  suggested_deadline_days: number;
  category: string;
}

export const listRoadmap = createServerFn().handler(
  async ({ data }: { data: { professionId?: number } }): Promise<RoadmapTask[]> => {
    await initDb();
    const generic = db()
      .query(
        `SELECT * FROM roadmap_tasks WHERE profession_id IS NULL ORDER BY step_order`,
      )
      .all() as Array<Record<string, unknown>>;
    let specific: Array<Record<string, unknown>> = [];
    if (data.professionId) {
      specific = db()
        .query(
          `SELECT * FROM roadmap_tasks WHERE profession_id = $pid ORDER BY step_order`,
        )
        .all({ $pid: data.professionId }) as Array<Record<string, unknown>>;
    }
    const rows = data.professionId ? [...generic, ...specific] : generic;
    return rows.map((r) => ({
      id: Number(r.id),
      profession_id: r.profession_id === null ? null : Number(r.profession_id),
      step_order: Number(r.step_order),
      title: String(r.title),
      description: String(r.description),
      difficulty: String(r.difficulty),
      est_time: String(r.est_time),
      suggested_deadline_days: Number(r.suggested_deadline_days),
      category: String(r.category),
    }));
  },
);

/* ------------------------------------------------------------------ */
/* Onboarding (user profile)                                            */
/* ------------------------------------------------------------------ */

export interface OnboardingProfile {
  country: string;
  state: string;
  city: string;
  profession: string;
  license_status: string;
  business_type: string;
  target_launch: string;
  budget: string;
  experience: string;
  education: string;
  funding_goals: string;
}

export interface MyProfileResult {
  name: string;
  onboarding: OnboardingProfile | null;
}

/** Return the current user's name + saved onboarding answers (JSON round-trip). */
export const getMyProfile = createServerFn().handler(
  async (): Promise<MyProfileResult | null> => {
    await initDb();
    const token = getCookie(SESSION_COOKIE);
    const user = identityFromToken(db(), token);
    if (!user) return null;
    const row = db()
      .query("SELECT name, onboarding FROM users WHERE id = $id")
      .get({ $id: user.id }) as { name: string; onboarding: string | null } | undefined;
    if (!row) return null;
    return {
      name: row.name,
      onboarding: parseJson<OnboardingProfile | null>(row.onboarding, null),
    };
  },
);

export type SaveOnboardingResult = { ok: boolean; error?: string };

/** Persist onboarding answers to the logged-in user's profile (JSON column). */
export const saveOnboarding = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: OnboardingProfile }): Promise<SaveOnboardingResult> => {
    await initDb();
    const token = getCookie(SESSION_COOKIE);
    const user = identityFromToken(db(), token);
    if (!user) return { ok: false, error: "You must be logged in to save your profile." };
    db()
      .query("UPDATE users SET onboarding = $json WHERE id = $id")
      .run({ $json: JSON.stringify(data), $id: user.id });
    return { ok: true };
  },
);

/* ------------------------------------------------------------------ */
/* Career Explorer (/explorer comparison)                              */
/* ------------------------------------------------------------------ */

export interface ExplorerValue {
  label: string;
  text: string;
}

export interface ExplorerProfile {
  trainingTime: ExplorerValue;
  examDifficulty: ExplorerValue;
  startupCost: ExplorerValue;
  selfEmploymentPotential: ExplorerValue;
  customerDemand: ExplorerValue;
  equipment: ExplorerValue;
  businessModels: string[];
  timeToFirstCustomer: ExplorerValue;
  workMode: ExplorerValue;
}

export interface ExplorerProfession {
  id: number;
  name: string;
  slug: string;
  category: string;
  is_sample: boolean;
  explorer_profile: ExplorerProfile;
}

export const getExplorerProfiles = createServerFn().handler(
  async (): Promise<ExplorerProfession[]> => {
    await initDb();
    const rows = db()
      .query(
        `SELECT id, name, slug, category, is_sample, explorer_profile
           FROM professions ORDER BY name`,
      )
      .all() as Array<{
      id: number;
      name: string;
      slug: string;
      category: string;
      is_sample: number;
      explorer_profile: string | null;
    }>;
    return rows
      .filter((r) => r.explorer_profile) // only professions with comparison data
      .map((r) => ({
        id: Number(r.id),
        name: String(r.name),
        slug: String(r.slug),
        category: String(r.category),
        is_sample: Number(r.is_sample) === 1,
        explorer_profile: parseJson<ExplorerProfile>(r.explorer_profile as string, {
          trainingTime: { label: "", text: "" },
          examDifficulty: { label: "", text: "" },
          startupCost: { label: "", text: "" },
          selfEmploymentPotential: { label: "", text: "" },
          customerDemand: { label: "", text: "" },
          equipment: { label: "", text: "" },
          businessModels: [],
          timeToFirstCustomer: { label: "", text: "" },
          workMode: { label: "", text: "" },
        }),
      }));
  },
);

/* ------------------------------------------------------------------ */
/* M3 — Personalized Career Roadmap                                     */
/* ------------------------------------------------------------------ */

export type RoadmapStatus = "not_started" | "in_progress" | "done";

export interface RoadmapTaskWithProgress {
  id: number;
  profession_id: number | null;
  profession_name: string | null;
  step_order: number;
  title: string;
  description: string;
  difficulty: string;
  est_time: string;
  suggested_deadline_days: number;
  category: string;
  official_link: string | null;
  status: RoadmapStatus;
  deadline: string | null;
  notes: string;
}

const ROADMAP_ALLOWED = new Set(["not_started", "in_progress", "done"]);

/** Core merge logic shared by the server fn and the verification script.
 *  A null userId returns the read-only roadmap (all statuses "not_started"). */
export function roadmapForUser(
  d: Database,
  userId: number | null,
): RoadmapTaskWithProgress[] {
  const generic = d
    .query(
      `SELECT t.*, p.name AS profession_name FROM roadmap_tasks t
         LEFT JOIN professions p ON p.id = t.profession_id
        WHERE t.profession_id IS NULL ORDER BY t.step_order`,
    )
    .all() as Array<Record<string, unknown>>;
  const specific = d
    .query(
      `SELECT t.*, p.name AS profession_name FROM roadmap_tasks t
         LEFT JOIN professions p ON p.id = t.profession_id
        WHERE t.profession_id IS NOT NULL ORDER BY t.step_order`,
    )
    .all() as Array<Record<string, unknown>>;
  const rows = [...generic, ...specific];

  const progress = new Map<string, { status: string; deadline: string | null; notes: string }>();
  if (userId != null) {
    const progRows = d
      .query(
        "SELECT roadmap_task_id, status, deadline, notes FROM roadmap_progress WHERE user_id = $uid",
      )
      .all({ $uid: userId }) as Array<{
      roadmap_task_id: number;
      status: string;
      deadline: string | null;
      notes: string;
    }>;
    for (const pr of progRows) {
      progress.set(String(pr.roadmap_task_id), {
        status: pr.status,
        deadline: pr.deadline,
        notes: pr.notes,
      });
    }
  }

  return rows.map((r) => {
    const id = Number(r.id);
    const prog = progress.get(String(id));
    return {
      id,
      profession_id: r.profession_id === null ? null : Number(r.profession_id),
      profession_name: r.profession_name ? String(r.profession_name) : null,
      step_order: Number(r.step_order),
      title: String(r.title),
      description: String(r.description),
      difficulty: String(r.difficulty),
      est_time: String(r.est_time),
      suggested_deadline_days: Number(r.suggested_deadline_days),
      category: String(r.category),
      official_link: r.official_link ? String(r.official_link) : null,
      status: prog && ROADMAP_ALLOWED.has(prog.status) ? (prog.status as RoadmapStatus) : "not_started",
      deadline: prog?.deadline ?? null,
      notes: prog?.notes ?? "",
    };
  });
}

export interface SaveRoadmapInput {
  taskId: number;
  status: RoadmapStatus;
  notes?: string;
  deadline?: string | null;
}
export type SaveRoadmapResult =
  | { ok: true; task: RoadmapTaskWithProgress }
  | { ok: false; error: string };

/** Core save logic shared by the server fn and the verification script.
 *  Requires a real userId. Upserts the user's progress row. */
export function saveRoadmapTask(
  d: Database,
  userId: number,
  input: SaveRoadmapInput,
): RoadmapTaskWithProgress {
  if (!ROADMAP_ALLOWED.has(input.status)) {
    throw new Error("Invalid roadmap status.");
  }
  const notes = input.notes ?? "";
  const deadline = input.deadline ? String(input.deadline) : null;
  const now = new Date().toISOString();
  d.query(
    `INSERT INTO roadmap_progress (user_id, roadmap_task_id, status, deadline, notes, updated_at)
     VALUES ($uid, $tid, $status, $deadline, $notes, $now)
     ON CONFLICT(user_id, roadmap_task_id) DO UPDATE SET
       status = excluded.status,
       deadline = excluded.deadline,
       notes = excluded.notes,
       updated_at = excluded.updated_at`,
  ).run({ $uid: userId, $tid: input.taskId, $status: input.status, $deadline: deadline, $notes: notes, $now: now });
  const task = roadmapForUser(d, userId).find((t) => t.id === input.taskId);
  if (!task) throw new Error("Roadmap task not found.");
  return task;
}

export const getMyRoadmap = createServerFn().handler(
  async ({ data }: { data: { professionId?: number } }): Promise<RoadmapTaskWithProgress[]> => {
    await initDb();
    const token = getCookie(SESSION_COOKIE);
    const user = identityFromToken(db(), token);
    // Signed-out visitors get a read-only roadmap.
    return roadmapForUser(db(), user ? user.id : null);
  },
);

export const updateRoadmapTask = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: SaveRoadmapInput }): Promise<SaveRoadmapResult> => {
    await initDb();
    const token = getCookie(SESSION_COOKIE);
    const user = identityFromToken(db(), token);
    if (!user) return { ok: false, error: "You must be logged in to save roadmap progress." };
    try {
      const task = saveRoadmapTask(db(), user.id, data);
      return { ok: true, task };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Could not save." };
    }
  },
);

/* ------------------------------------------------------------------ */
/* M3 — Exam Preparation Center                                         */
/* ------------------------------------------------------------------ */

export interface ExamCourse {
  id: number;
  profession_id: number;
  profession_name: string;
  profession_slug: string;
  title: string;
  description: string;
  is_sample: boolean;
  lesson_count: number;
  question_count: number;
}

export const listExamCourses = createServerFn().handler(async (): Promise<ExamCourse[]> => {
  await initDb();
  const rows = db()
    .query(
      `SELECT c.id, c.profession_id, c.title, c.description, c.is_sample,
              p.name AS profession_name, p.slug AS profession_slug,
              (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lesson_count,
              (SELECT COUNT(*) FROM practice_questions q WHERE q.course_id = c.id) AS question_count
         FROM exam_courses c JOIN professions p ON p.id = c.profession_id
        ORDER BY p.name, c.id`,
    )
    .all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: Number(r.id),
    profession_id: Number(r.profession_id),
    profession_name: String(r.profession_name),
    profession_slug: String(r.profession_slug),
    title: String(r.title),
    description: String(r.description),
    is_sample: Number(r.is_sample) === 1,
    lesson_count: Number(r.lesson_count),
    question_count: Number(r.question_count),
  }));
});

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  body: string;
  order_index: number;
}

export const listCourseLessons = createServerFn().handler(
  async ({ data }: { data: { courseId: number } }): Promise<Lesson[]> => {
    await initDb();
    const rows = db()
      .query(
        "SELECT * FROM lessons WHERE course_id = $cid ORDER BY order_index",
      )
      .all({ $cid: data.courseId }) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: Number(r.id),
      course_id: Number(r.course_id),
      title: String(r.title),
      body: String(r.body),
      order_index: Number(r.order_index),
    }));
  },
);

/** Masked practice question — no correct answer sent to the client.
 *  Correctness is validated server-side on submit. */
export interface PracticeQuestion {
  id: number;
  profession_id: number;
  course_id: number | null;
  question: string;
  options: string[];
  difficulty: string;
  topic: string;
  is_sample: boolean;
}

export const listPracticeQuestions = createServerFn().handler(
  async ({ data }: { data: { professionId?: number } }): Promise<PracticeQuestion[]> => {
    await initDb();
    const rows = (data.professionId
      ? db()
          .query(
            "SELECT * FROM practice_questions WHERE profession_id = $pid ORDER BY topic, id",
          )
          .all({ $pid: data.professionId })
      : db().query("SELECT * FROM practice_questions ORDER BY topic, id").all()) as Array<
      Record<string, unknown>
    >;
    return rows.map((r) => ({
      id: Number(r.id),
      profession_id: Number(r.profession_id),
      course_id: r.course_id === null ? null : Number(r.course_id),
      question: String(r.question),
      options: parseJson<string[]>(r.options as string, []),
      difficulty: String(r.difficulty ?? "easy"),
      topic: String(r.topic ?? ""),
      is_sample: Number(r.is_sample) === 1,
    }));
  },
);

export interface AnswerResult {
  ok: boolean;
  correct: boolean;
  explanation: string;
  loggedIn: boolean;
  error?: string;
}

export const answerQuestion = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { questionId: number; optionIndex: number } }): Promise<AnswerResult> => {
    await initDb();
    const token = getCookie(SESSION_COOKIE);
    const user = identityFromToken(db(), token);
    const row = db()
      .query("SELECT correct_index, explanation FROM practice_questions WHERE id = $qid")
      .get({ $qid: data.questionId }) as
      | { correct_index: number; explanation: string }
      | undefined;
    if (!row) return { ok: false, correct: false, explanation: "", loggedIn: !!user, error: "Question not found." };
    const correct = Number(row.correct_index) === Number(data.optionIndex);
    if (user) {
      db()
        .query(
          `INSERT INTO question_progress (user_id, question_id, correct, answered_at)
           VALUES ($uid, $qid, $correct, $now)
           ON CONFLICT(user_id, question_id) DO UPDATE SET
             correct = excluded.correct, answered_at = excluded.answered_at`,
        )
        .run({ $uid: user.id, $qid: data.questionId, $correct: correct ? 1 : 0, $now: new Date().toISOString() });
    }
    return { ok: true, correct, explanation: String(row.explanation ?? ""), loggedIn: !!user };
  },
);

export interface TopicAccuracy {
  topic: string;
  answered: number;
  correct: number;
  accuracy: number; // 0-100
}
export interface ExamProgress {
  totalQuestions: number;
  answered: number;
  correct: number;
  pctAnswered: number; // 0-100
  pctCorrect: number; // 0-100 of answered
  byTopic: TopicAccuracy[];
  weakTopics: string[];
}

export const getExamProgress = createServerFn().handler(
  async ({ data }: { data: { professionId?: number } }): Promise<ExamProgress | null> => {
    await initDb();
    const token = getCookie(SESSION_COOKIE);
    const user = identityFromToken(db(), token);
    if (!user) return null;

    const pid = data.professionId;
    const total = (
      pid
        ? db().query("SELECT COUNT(*) AS c FROM practice_questions WHERE profession_id = $pid").get({ $pid: pid })
        : db().query("SELECT COUNT(*) AS c FROM practice_questions").get()
    ) as { c: number };

    const joined = pid
      ? db()
          .query(
            `SELECT q.topic, qp.correct
               FROM question_progress qp
               JOIN practice_questions q ON q.id = qp.question_id
              WHERE qp.user_id = $uid AND q.profession_id = $pid`,
          )
          .all({ $uid: user.id, $pid: pid })
      : db()
          .query(
            `SELECT q.topic, qp.correct
               FROM question_progress qp
               JOIN practice_questions q ON q.id = qp.question_id
              WHERE qp.user_id = $uid`,
          )
          .all({ $uid: user.id });

    const answers = joined as Array<{ topic: string; correct: number }>;
    const answered = answers.length;
    const correct = answers.filter((a) => Number(a.correct) === 1).length;

    const byTopicMap = new Map<string, { topic: string; answered: number; correct: number }>();
    for (const a of answers) {
      const t = byTopicMap.get(a.topic) ?? { topic: a.topic, answered: 0, correct: 0 };
      t.answered += 1;
      if (Number(a.correct) === 1) t.correct += 1;
      byTopicMap.set(a.topic, t);
    }
    const byTopic = [...byTopicMap.values()].map((t) => ({
      ...t,
      accuracy: t.answered ? Math.round((t.correct / t.answered) * 100) : 0,
    }));
    byTopic.sort((a, b) => a.accuracy - b.accuracy);
    // "Weak topics" are the lowest-accuracy topics with at least one answer —
    // clearly sample-derived, NOT a real-exam prediction.
    const weakTopics = byTopic.filter((t) => t.answered >= 1 && t.accuracy < 60).map((t) => t.topic);

    return {
      totalQuestions: Number(total.c),
      answered,
      correct,
      pctAnswered: Number(total.c) ? Math.round((answered / Number(total.c)) * 100) : 0,
      pctCorrect: answered ? Math.round((correct / answered) * 100) : 0,
      byTopic,
      weakTopics,
    };
  },
);

export interface FundingCategory {
  id: number;
  name: string;
  description: string;
  repayment_required: string;
  ownership_surrendered: string;
  common_eligibility: string[];
  documents_requested: string[];
  benefits: string[];
  risks: string[];
  preparation_steps: string[];
  questions_to_ask: string[];
}

export const listFundingCategories = createServerFn().handler(async (): Promise<
  FundingCategory[]
> => {
  await initDb();
  const rows = db()
    .query("SELECT * FROM funding_categories ORDER BY id")
    .all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    description: String(r.description),
    repayment_required: String(r.repayment_required),
    ownership_surrendered: String(r.ownership_surrendered),
    common_eligibility: parseJson<string[]>(r.common_eligibility as string, []),
    documents_requested: parseJson<string[]>(r.documents_requested as string, []),
    benefits: parseJson<string[]>(r.benefits as string, []),
    risks: parseJson<string[]>(r.risks as string, []),
    preparation_steps: parseJson<string[]>(r.preparation_steps as string, []),
    questions_to_ask: parseJson<string[]>(r.questions_to_ask as string, []),
  }));
});
