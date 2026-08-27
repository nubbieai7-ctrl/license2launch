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
