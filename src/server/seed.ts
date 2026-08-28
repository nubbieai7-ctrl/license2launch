/**
 * License2Launch — seed data (M1)
 *
 * Seeds the 3 pilot professions, 6 business models (2 per profession), the
 * generic roadmap template + profession-specific steps, 12 funding categories,
 * a small set of sample practice questions, and demo users.
 *
 * CONTENT RULES (apply everywhere — see team brief):
 *  - Educational/organizational only. No promises of passing/licensing/funding/profit.
 *  - All invented/example content is labeled as sample data.
 *  - No invented laws, license names, exams, grants, stats, or official URLs.
 *    Official links are only real, verifiable industry sites; location-specific
 *    authorities use a "confirm via your local authority" placeholder.
 *
 * DEMO CREDENTIALS (hashed at seed time with Bun.password):
 *   Admin  : admin@license2launch.demo   /  L2L-admin-2026!
 *   Sample : sample@license2launch.demo  /  L2L-sample-2026!
 * These are demo-only credentials for the sandbox environment. Change them in
 * any real deployment.
 */
import type { Database } from "bun:sqlite";

export async function seedIfEmpty(d: Database): Promise<void> {
  const { c } = d
    .query("SELECT COUNT(*) AS c FROM professions")
    .get() as { c: number };
  const now = "2026-08-25";
  if (c === 0) {
    // Content seeding is fully synchronous — run inside one transaction.
    const run = d.transaction(() => {
      seedProfessions(d, now);
      seedBusinessModels(d);
      seedRoadmap(d);
      seedFunding(d);
      seedQuestions(d);
    });
    run();
  }
  // Backfill explorer profiles for existing rows (idempotent — only sets rows
  // where the column is still NULL, so it never overwrites or duplicates).
  seedExplorerProfiles(d);
  // M3: persistent, idempotent content upgrades that also run on pre-existing DBs:
  //  - roadmap official-links (real links only or empty for "confirm with authority")
  //  - per-profession sample exam courses + lessons
  //  - the per-profession sample practice-question bank (with topic/difficulty)
  seedRoadmapOfficialLinks(d);
  seedExamContent(d);
  seedQuestionBank(d);
  // User seeding hashes passwords (async bcrypt) — do it outside the sync txn.
  await seedUsers(d);
}

/** Resolve a profession id by slug from the DB (robust even when the seed-time
 *  slug map wasn't populated, e.g. on an already-seeded database). */
function professionIdFor(d: Database, slug: string): number {
  const row = d
    .query("SELECT id FROM professions WHERE slug = $s")
    .get({ $s: slug }) as { id: number } | undefined;
  return row ? Number(row.id) : -1;
}

function insertProfession(
  d: Database,
  p: Record<string, unknown>,
): number {
  const info = d
    .query(
      `INSERT INTO professions (
        name, slug, category, description, typical_customers, required_skills,
        suggested_education, licenses_certifications, exam_names, exam_subjects,
        business_opportunities, startup_cost_range, equipment_requirements,
        insurance_considerations, revenue_models, typical_risks, marketing_channels,
        funding_options, employees_subcontractors, official_links,
        location_requirements, last_reviewed, admin_notes, is_sample
      ) VALUES (
        $name, $slug, $category, $description, $typical_customers, $required_skills,
        $suggested_education, $licenses_certifications, $exam_names, $exam_subjects,
        $business_opportunities, $startup_cost_range, $equipment_requirements,
        $insurance_considerations, $revenue_models, $typical_risks, $marketing_channels,
        $funding_options, $employees_subcontractors, $official_links,
        $location_requirements, $last_reviewed, $admin_notes, $is_sample
      )`,
    )
    .run({
      $name: p.name,
      $slug: p.slug,
      $category: p.category,
      $description: p.description,
      $typical_customers: $j(p.typical_customers),
      $required_skills: $j(p.required_skills),
      $suggested_education: $j(p.suggested_education),
      $licenses_certifications: $j(p.licenses_certifications),
      $exam_names: $j(p.exam_names),
      $exam_subjects: $j(p.exam_subjects),
      $business_opportunities: $j(p.business_opportunities),
      $startup_cost_range: p.startup_cost_range,
      $equipment_requirements: $j(p.equipment_requirements),
      $insurance_considerations: $j(p.insurance_considerations),
      $revenue_models: $j(p.revenue_models),
      $typical_risks: $j(p.typical_risks),
      $marketing_channels: $j(p.marketing_channels),
      $funding_options: $j(p.funding_options),
      $employees_subcontractors: $j(p.employees_subcontractors),
      $official_links: $j(p.official_links),
      $location_requirements: p.location_requirements,
      $last_reviewed: p.last_reviewed,
      $admin_notes: p.admin_notes,
      $is_sample: p.is_sample ? 1 : 0,
    });
  return Number(info.lastInsertRowid);
}

/** JSON-stringify helper (returns null for undefined). */
function $j(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  return JSON.stringify(v);
}

function seedProfessions(d: Database, now: string): void {
  const data: Array<Record<string, unknown>> = [
    // ============================ ELECTRICIAN ============================
    {
      name: "Electrician",
      slug: "electrician",
      category: "Skilled Trades",
      description:
        "Electricians install, maintain, and repair electrical systems in homes, businesses, and industrial settings. Getting licensed typically involves classroom instruction, on-the-job (apprenticeship) hours, and a licensing exam that varies by state.",
      typical_customers: [
        "Homeowners",
        "Property managers and landlords",
        "General contractors",
        "Commercial property owners",
        "Industrial facilities",
      ],
      required_skills: [
        "Electrical theory and code knowledge",
        "Reading blueprints and wiring diagrams",
        "Hands-on troubleshooting",
        "Physical stamina and manual dexterity",
        "Safety awareness",
        "Customer communication",
      ],
      suggested_education: [
        "Trade school or apprenticeship program",
        "On-the-job training / apprenticeship hours",
        "Ongoing code updates (e.g., National Electrical Code)",
      ],
      licenses_certifications: [
        "Journeyman electrician license (state-specific)",
        "Master electrician license (state-specific)",
        "Local permit / business registration as required",
      ],
      exam_names: [
        "State journeyman electrician exam (sample reference — confirm the exact name with your state licensing board)",
      ],
      exam_subjects: [
        "Electrical theory",
        "National Electrical Code (NEC)",
        "Local codes and regulations",
        "Safety practices",
      ],
      business_opportunities: [
        "Residential service and repair",
        "New-construction wiring",
        "Commercial electrical contracting",
        "Lighting installation and retrofits",
        "Maintenance and inspection contracts",
      ],
      startup_cost_range:
        "Sample range only: a small service business often starts with a few thousand dollars (tools, insurance, licensing fees) up to tens of thousands for a fully equipped service van and inventory.",
      equipment_requirements: [
        "Hand tools and power tools",
        "Testing meters and diagnostic equipment",
        "Service vehicle",
        "Safety gear",
        "Parts and inventory",
      ],
      insurance_considerations: [
        "Liability insurance is typically recommended",
        "Workers' comp may be required once you hire employees",
        "Commercial auto coverage for a work vehicle",
        "Confirm exact requirements with an insurance professional and your state",
      ],
      revenue_models: [
        "Hourly service fees",
        "Project-based (flat-rate) quotes",
        "Retainer / maintenance contracts",
        "Markup on parts and materials",
      ],
      typical_risks: [
        "Slower startup before a regular flow of work builds",
        "Seasonal demand fluctuations",
        "Liability if work is faulty or unsafe",
        "Competition with established contractors",
        "Regulatory and insurance compliance",
      ],
      marketing_channels: [
        "Local SEO and a Google Business Profile",
        "Word of mouth and referrals",
        "Referrals from real estate agents and property managers",
        "Local home-improvement events",
        "Social media before/after project photos",
      ],
      funding_options: [
        "Personal savings",
        "Friends and family loans",
        "Equipment financing for tools and vehicle",
        "Small business loans or microloans",
        "Grant eligibility varies — research and confirm before relying on any grant",
      ],
      employees_subcontractors: [
        "May start solo or with an apprentice",
        "Can hire licensed helpers/electricians as work scales",
        "May subcontract specialty work on larger jobs",
      ],
      official_links: [
        { label: "NFPA — National Electrical Code", url: "https://www.nfpa.org" },
        { label: "National Joint Apprenticeship & Training Committee", url: "https://www.njatc.org" },
      ],
      location_requirements: "State licensing board — confirm via your local authority.",
      last_reviewed: now,
      admin_notes: "Sample data for M1 foundation.",
      is_sample: 1,
    },
    // ============================= NURSING =============================
    {
      name: "Nursing (Registered Nurse)",
      slug: "nursing",
      category: "Healthcare",
      description:
        "Registered nurses provide and coordinate patient care, educate patients and families, and work in hospitals, clinics, homes, and other settings. Becoming an RN requires completing an approved nursing education program and passing the NCLEX exam, with licensing through your state board of nursing.",
      typical_customers: [
        "Patients and families (direct care)",
        "Healthcare facilities",
        "Home-care clients",
        "Educational / coaching clients (sample)",
      ],
      required_skills: [
        "Clinical assessments and care planning",
        "Medication administration",
        "Patient and family communication",
        "Critical thinking and prioritization",
        "Documentation and record-keeping",
        "Compassion and emotional resilience",
      ],
      suggested_education: [
        "Approved nursing diploma, associate, or bachelor's degree program",
        "Clinical hours through an approved program",
        "Ongoing continuing-education for license renewal",
      ],
      licenses_certifications: [
        "Registered Nurse (RN) license via your state board of nursing",
        "Advanced certifications are optional and specialize a practice",
      ],
      exam_names: [
        "NCLEX (National Council Licensure Examination) — administered by state boards of nursing via NCSBN",
      ],
      exam_subjects: [
        "Safe and effective care environment",
        "Health promotion and maintenance",
        "Psychosocial integrity",
        "Physiological integrity",
      ],
      business_opportunities: [
        "Independent private-duty / home care nursing (sample)",
        "Nursing education and health coaching (sample)",
        "Consulting for care facilities",
        "Independent health screenings and wellness services",
      ],
      startup_cost_range:
        "Sample range only: varies widely by model. Private-duty nursing may need little more than liability coverage and credentials; a coaching or education practice may add website, insurance, and course tools.",
      equipment_requirements: [
        "Clinical supplies as appropriate to the service",
        "Secure documentation / record-keeping tools",
        "Liability insurance",
        "Transportation",
        "Website and scheduling tools (for coaching/education models)",
      ],
      insurance_considerations: [
        "Professional liability (malpractice) insurance is commonly recommended",
        "Business liability coverage for an independent practice",
        "State board rules govern independent practice scope",
        "Confirm exact requirements with an insurance professional and your board of nursing",
      ],
      revenue_models: [
        "Hourly or per-visit private-duty fees",
        "Block packages for coaching/education",
        "Retainer relationships with families or facilities",
        "Group workshops or courses",
      ],
      typical_risks: [
        "Scope-of-practice and regulatory limits",
        "Liability exposure in direct care",
        "Client volume that fluctuates",
        "Burnout / on-call demands",
        "Insurance and compliance costs",
      ],
      marketing_channels: [
        "Referrals from doctors, discharge planners, and facilities",
        "Local SEO and website",
        "Healthcare professional networks",
        "Community health events",
        "Social media educational content",
      ],
      funding_options: [
        "Personal savings",
        "Friends and family loans",
        "Small business loans or microloans",
        "Grant eligibility varies — research and confirm before relying on any grant",
      ],
      employees_subcontractors: [
        "Can start solo as an independent practitioner",
        "May hire additional licensed nurses or support staff as demand grows",
        "Contractors must be properly licensed and insured",
      ],
      official_links: [
        { label: "NCSBN — National Council of State Boards of Nursing (NCLEX)", url: "https://www.ncsbn.org" },
        { label: "American Nurses Association", url: "https://www.nursingworld.org" },
      ],
      location_requirements: "State board of nursing — confirm via your local authority.",
      last_reviewed: now,
      admin_notes: "Sample data for M1 foundation.",
      is_sample: 1,
    },
    // ========================== REAL ESTATE ===========================
    {
      name: "Real Estate Agent",
      slug: "real-estate",
      category: "Sales & Professional Services",
      description:
        "Real estate agents help clients buy, sell, and rent property, guiding them through listings, showings, negotiations, and contracts. Becoming an agent generally requires state-approved pre-licensing coursework and passing a state licensing exam, with ongoing education for renewal.",
      typical_customers: [
        "Home buyers and sellers",
        "Investors",
        "Renters and landlords",
        "First-time homebuyers",
      ],
      required_skills: [
        "Sales and negotiation",
        "Local market knowledge",
        "Contract and paperwork literacy",
        "Communication and client relations",
        "Time management and self-discipline",
        "Marketing and online presence",
      ],
      suggested_education: [
        "State-approved pre-licensing coursework",
        "State real estate exam",
        "Ongoing continuing education for license renewal",
      ],
      licenses_certifications: [
        "Real estate salesperson / agent license (state-specific)",
        "Broker license (state-specific) — generally after more experience",
        "Association memberships (e.g., REALTOR) are voluntary designations",
      ],
      exam_names: [
        "State real estate salesperson exam (sample reference — confirm the exact name with your state real estate commission)",
      ],
      exam_subjects: [
        "Real estate principles and practices",
        "Contracts and agency law",
        "Property ownership and transfer",
        "Financing and valuation basics",
        "State-specific laws",
      ],
      business_opportunities: [
        "Residential resale representation",
        "New-home sales",
        "Leasing / rentals",
        "Investor-focused buyer representation",
        "Property management (separate license often required)",
      ],
      startup_cost_range:
        "Sample range only: agents commonly join a brokerage, so startup costs can be relatively light (licensing, association fees, marketing, tech tools) but vary by market and brokerage.",
      equipment_requirements: [
        "Reliable phone and computer",
        "Vehicle and transportation",
        "Marketing materials and photography",
        "MLS / brokerage tools and lockbox access",
        "CRM and document software",
      ],
      insurance_considerations: [
        "Errors & omissions (E&O) insurance is commonly required via brokerage",
        "Business liability coverage",
        "Professional standards vary by state and association",
        "Confirm exact requirements with an insurance professional and your state real estate commission",
      ],
      revenue_models: [
        "Commission on closed transactions (split with brokerage)",
        "Referral fees",
        "Flat-fee listing services (sample)",
        "Property-management fees (with proper license)",
      ],
      typical_risks: [
        "Income is commission-based and irregular",
        "Transaction cycles can be slow early on",
        "Market conditions affect deal volume",
        "Legal/contractual risk in transactions",
        "High competition in many markets",
      ],
      marketing_channels: [
        "Online listings (MLS), website, and local SEO",
        "Open houses",
        "Social media and video tours",
        "Referrals from past clients and network",
        "Community and networking events",
      ],
      funding_options: [
        "Personal savings",
        "Friends and family loans",
        "Small business loans or microloans",
        "Grant eligibility varies — research and confirm before relying on any grant",
      ],
      employees_subcontractors: [
        "Most agents start as independent-contractor agents within a brokerage",
        "May build a team with buyer's agents and transaction coordinators",
        "Broker oversight requirements vary by state",
      ],
      official_links: [
        { label: "National Association of REALTORS", url: "https://www.nar.realtor" },
        { label: "Association of Real Estate License Law Officials", url: "https://www.arello.org" },
      ],
      location_requirements: "State real estate commission — confirm via your local authority.",
      last_reviewed: now,
      admin_notes: "Sample data for M1 foundation.",
      is_sample: 1,
    },
  ];

  for (const p of data) {
    // store slugs for later use by business models / roadmap
    const slug = p.slug as string;
    const id = insertProfession(d, p);
    professionsById.set(slug, id);
  }
}

/** slug -> id mapping populated during seeding for FK references. */
export const professionsById = new Map<string, number>();

function insertBusinessModel(
  d: Database,
  b: Record<string, unknown>,
): void {
  d.query(
    `INSERT INTO business_models (
      profession_id, name, description, target_customers, services,
      startup_equipment, startup_cost_categories, pricing_methods,
      revenue_streams, insurance, marketing_methods, risks, hiring_needs,
      validation_experiment, first_ten_customer_ideas, funding_readiness, is_sample
    ) VALUES (
      $profession_id, $name, $description, $target_customers, $services,
      $startup_equipment, $startup_cost_categories, $pricing_methods,
      $revenue_streams, $insurance, $marketing_methods, $risks, $hiring_needs,
      $validation_experiment, $first_ten_customer_ideas, $funding_readiness, $is_sample
    )`,
  ).run({
    $profession_id: b.profession_id,
    $name: b.name,
    $description: b.description,
    $target_customers: $j(b.target_customers),
    $services: $j(b.services),
    $startup_equipment: $j(b.startup_equipment),
    $startup_cost_categories: $j(b.startup_cost_categories),
    $pricing_methods: $j(b.pricing_methods),
    $revenue_streams: $j(b.revenue_streams),
    $insurance: $j(b.insurance),
    $marketing_methods: $j(b.marketing_methods),
    $risks: $j(b.risks),
    $hiring_needs: $j(b.hiring_needs),
    $validation_experiment: b.validation_experiment,
    $first_ten_customer_ideas: $j(b.first_ten_customer_ideas),
    $funding_readiness: $j(b.funding_readiness),
    $is_sample: b.is_sample ? 1 : 0,
  });
}

function seedBusinessModels(d: Database): void {
  const models: Array<Record<string, unknown>> = [
    // ---------------- Electrician ----------------
    {
      profession_id: () => professionsById.get("electrician")!,
      name: "Residential Service Electrician (Sample)",
      description:
        "A sample model: a small business that responds to homeowners' electrical service calls — troubleshooting, repairs, panel upgrades, outlet/lighting work — and builds recurring relationships.",
      target_customers: ["Homeowners", "Landlords and property managers", "Small businesses"],
      services: ["Diagnostics and repairs", "Panel and wiring upgrades", "Lighting installation", "Safety inspections"],
      startup_equipment: ["Hand/power tools", "Test meters", "Service vehicle", "Parts inventory", "Safety gear"],
      startup_cost_categories: [
        { label: "Tools & test equipment", amount: 3000 },
        { label: "Vehicle", amount: 20000 },
        { label: "Insurance (first year)", amount: 2500 },
        { label: "Licensing & permits", amount: 800 },
        { label: "Marketing & website", amount: 1500 },
      ],
      pricing_methods: ["Hourly service rates", "Flat-rate common repairs", "Travel/diagnostic fee"],
      revenue_streams: ["Service call fees", "Repair project quotes", "Maintenance contracts", "Parts markup"],
      insurance: ["Liability insurance", "Workers' comp (if hiring)", "Commercial auto"],
      marketing_methods: ["Google Business Profile", "Referral program", "Property-manager partnerships", "Local SEO"],
      risks: ["Slow startup pipeline", "Seasonal demand", "Liability exposure", "Competition"],
      hiring_needs: ["Start solo", "Add an apprentice or licensed helper as volume grows"],
      validation_experiment:
        "Sample: offer discounted troubleshooting appointments to the first 10 neighbors/property managers and track repeat requests.",
      first_ten_customer_ideas: [
        "Current landlord / property-manager contacts",
        "Local real estate agents needing pre-sale inspections",
        "Homeowner association lists",
        "Neighborhood social groups",
      ],
      funding_readiness: ["Cost estimate", "Simple budget", "Bookkeeping setup"],
      is_sample: 1,
    },
    {
      profession_id: () => professionsById.get("electrician")!,
      name: "New-Construction & Remodel Wiring (Sample)",
      description:
        "A sample model: a business focused on rough-in and finish wiring for builders and remodelers, providing project-based electrical work on new builds and renovations.",
      target_customers: ["General contractors", "Home builders", "Remodelers", "Commercial developers"],
      services: ["Rough-in wiring", "Finish electrical", "Panel installation", "Code-compliant updates"],
      startup_equipment: ["Professional tool set", "Bending tools & fasteners", "Service vehicle", "Job-site safety gear"],
      startup_cost_categories: [
        { label: "Tools & equipment", amount: 5000 },
        { label: "Vehicle", amount: 22000 },
        { label: "Insurance", amount: 3000 },
        { label: "Licensing & bonds", amount: 1200 },
        { label: "Marketing (trade networking)", amount: 1000 },
      ],
      pricing_methods: ["Per-square-foot bids", "Project lump-sum quotes", "Change-order pricing"],
      revenue_streams: ["Contract project revenue", "Change orders", "Service callbacks"],
      insurance: ["General liability", "Workers' comp (as needed)", "Commercial auto"],
      marketing_methods: ["Builder/GC relationships", "Trade networking", "Portfolio of completed work", "Referrals"],
      risks: ["Cash-flow gaps on large projects", "Tied to construction cycle", "Liability on workmanship", "Bid competition"],
      hiring_needs: ["Start solo or with one licensed helper", "Grow with apprentices as demand allows"],
      validation_experiment:
        "Sample: bid 3 small remodel projects at a competitive price to validate estimating and build references.",
      first_ten_customer_ideas: ["Local remodelers", "Small home builders", "Referral network of GCs"],
      funding_readiness: ["Project cost estimate", "Working-capital buffer", "Bookkeeping setup"],
      is_sample: 1,
    },
    // ---------------- Nursing ----------------
    {
      profession_id: () => professionsById.get("nursing")!,
      name: "Independent Private-Duty Home Care (Sample)",
      description:
        "A sample model: an RN offering private-duty nursing visits to clients in their homes — assessments, medication management, and coordination of care, within the RN scope allowed by the state board.",
      target_customers: ["Seniors and families", "Post-surgical patients", "Chronic-care clients", "Discharged patients"],
      services: ["In-home assessments", "Medication management support", "Care coordination", "Caregiver education"],
      startup_equipment: ["Clinical supplies", "Secure documentation tools", "Transportation", "Liability insurance"],
      startup_cost_categories: [
        { label: "Liability insurance (first year)", amount: 1200 },
        { label: "Supplies", amount: 800 },
        { label: "Website & scheduling", amount: 900 },
        { label: "Marketing", amount: 1000 },
        { label: "Professional memberships", amount: 300 },
      ],
      pricing_methods: ["Per-visit fees", "Hourly care rates", "Package plans"],
      revenue_streams: ["Private-duty visit fees", "Care-plan packages", "Educational sessions"],
      insurance: ["Professional liability (malpractice)", "Business liability"],
      marketing_methods: ["Discharge-planner referrals", "Physician referrals", "Local SEO", "Community health events"],
      risks: ["Scope-of-practice limits", "Fluctuating client volume", "Liability exposure", "Regulatory compliance"],
      hiring_needs: ["Start solo", "May add licensed support staff as demand grows"],
      validation_experiment:
        "Sample: take 2-3 private-duty referrals and track outcomes and client satisfaction before scaling marketing.",
      first_ten_customer_ideas: ["Discharge planners", "Home-care agencies needing overflow", "Physician offices", "Local senior groups"],
      funding_readiness: ["Liability quote", "Simple budget", "Licensing/board verification"],
      is_sample: 1,
    },
    {
      profession_id: () => professionsById.get("nursing")!,
      name: "Nursing Education & Health Coaching (Sample)",
      description:
        "A sample model: an RN offering wellness education and health coaching — group workshops, one-on-one coaching, and courses — built on RN expertise rather than direct clinical care.",
      target_customers: ["Individuals seeking health coaching", "Companies (wellness programs)", "Community groups", "Healthcare organizations"],
      services: ["One-on-one health coaching", "Group workshops", "Online courses", "Corporate wellness talks"],
      startup_equipment: ["Computer & video tools", "Website & booking", "Course platform", "Marketing materials"],
      startup_cost_categories: [
        { label: "Website & booking", amount: 800 },
        { label: "Course platform", amount: 600 },
        { label: "Marketing", amount: 1000 },
        { label: "Insurance", amount: 900 },
        { label: "Professional memberships", amount: 300 },
      ],
      pricing_methods: ["Per-session coaching", "Program packages", "Workshop fees", "Course pricing"],
      revenue_streams: ["Coaching packages", "Workshop registrations", "Course sales", "Corporate contracts"],
      insurance: ["Professional liability", "Business liability"],
      marketing_methods: ["Educational social content", "Email list", "Local speaking", "Referrals"],
      risks: ["Scope limits (coaching, not treatment)", "Building an audience takes time", "Income varies", "Regulatory clarity needed"],
      hiring_needs: ["Start solo", "Contract experts for specific topics as needed"],
      validation_experiment:
        "Sample: run a free community workshop, collect feedback, and pre-sell a small pilot coaching group.",
      first_ten_customer_ideas: ["Personal network", "Local gyms/wellness centers", "Employer HR contacts", "Senior centers"],
      funding_readiness: ["Service pricing", "Simple budget", "Insurance quote"],
      is_sample: 1,
    },
    // ---------------- Real Estate ----------------
    {
      profession_id: () => professionsById.get("real-estate")!,
      name: "Residential Buyer & Seller Agent (Sample)",
      description:
        "A sample model: a real estate salesperson representing home buyers and sellers, typically under a sponsoring broker, earning commission on closed transactions.",
      target_customers: ["Home buyers", "Home sellers", "Investors", "First-time buyers"],
      services: ["Listings & marketing", "Buyer representation", "Showings & open houses", "Contract guidance"],
      startup_equipment: ["Computer & phone", "Vehicle", "Marketing materials", "CRM & document tools"],
      startup_cost_categories: [
        { label: "Licensing & association fees", amount: 1000 },
        { label: "Brokerage onboarding", amount: 800 },
        { label: "Marketing & photos", amount: 1500 },
        { label: "Tech tools (CRM, site)", amount: 1200 },
        { label: "E&O insurance", amount: 700 },
      ],
      pricing_methods: ["Commission on closed transactions", "Referral fees"],
      revenue_streams: ["Buyer-side commission", "Listing commission", "Referral fees"],
      insurance: ["Errors & omissions (E&O) via brokerage", "Business liability"],
      marketing_methods: ["MLS & website", "Open houses", "Social media & video", "Referrals", "Networking"],
      risks: ["Commission-based income", "Slow start", "Market swings", "Contractual/legal risk", "Competition"],
      hiring_needs: ["Start as a solo agent under a broker", "Build a team (buyer's agents, TC) later"],
      validation_experiment:
        "Sample: line up 3 target contacts and complete 1-2 transactions to validate market fit before heavy marketing spend.",
      first_ten_customer_ideas: ["Personal network", "Past contacts", "Referrals from a sponsoring broker", "Local networking groups"],
      funding_readiness: ["Budget for ramp-up period", "Brokerage expectations", "Licensing plan"],
      is_sample: 1,
    },
    {
      profession_id: () => professionsById.get("real-estate")!,
      name: "Residential Property Management (Sample)",
      description:
        "A sample model: a business that manages residential rental properties for owners — tenant placement, rent collection, maintenance coordination, and owner reporting (property-management licensing requirements vary by state).",
      target_customers: ["Rental property owners", "Absentee landlords", "Small investors", "New landlords"],
      services: ["Tenant placement", "Rent collection", "Maintenance coordination", "Owner reporting"],
      startup_equipment: ["Computer & phone", "Management software", "Vehicle", "Marketing materials"],
      startup_cost_categories: [
        { label: "Management software", amount: 1000 },
        { label: "Licensing (varies by state)", amount: 800 },
        { label: "Insurance", amount: 1000 },
        { label: "Marketing", amount: 900 },
        { label: "Office/legal templates", amount: 500 },
      ],
      pricing_methods: ["Monthly % of rent", "Leasing fees", "Flat management fees"],
      revenue_streams: ["Management fees", "Leasing/setup fees", "Vendor referral arrangements"],
      insurance: ["General liability", "E&O (as applicable)", "Fidelity bonding as required"],
      marketing_methods: ["Referrals from real estate agents", "Online presence", "Landlord networking", "Local investor groups"],
      risks: ["Rental vacancy periods", "Maintenance surprises", "Legal/regulatory compliance", "Owner expectations", "State licensing rules"],
      hiring_needs: ["Start solo", "Add field staff/maintenance partners as portfolio grows"],
      validation_experiment:
        "Sample: manage 2-3 owner properties, refine your service agreement, and track owner satisfaction before scaling.",
      first_ten_customer_ideas: ["Local agents with landlord clients", "Investor meetups", "Small landlord groups", "Property lists"],
      funding_readiness: ["Software budget", "Simple pricing", "Local licensing check"],
      is_sample: 1,
    },
  ];

  // Resolve profession_id lazy getters now that all professions are inserted.
  for (const m of models) {
    (m as any).profession_id = (m.profession_id as () => number)();
  }
  for (const m of models) insertBusinessModel(d, m);
}

// ======================================================================
// ROADMAP TEMPLATE
// Generic ~19-step "prepare -> launch" roadmap + profession-specific steps.
// ======================================================================
function seedRoadmap(d: Database): void {
  type Step = {
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    est_time: string;
    days: number;
    category: string;
  };
  const generic: Step[] = [
    { title: "Research your profession & licensing path", description: "Understand what it takes to become licensed in your profession and what the work looks like day to day.", difficulty: "easy", est_time: "2–4 hours", days: 3, category: "research" },
    { title: "Confirm requirements with your state licensing board", description: "Verify education, experience, and exam requirements directly with the authority that licenses your profession in your state.", difficulty: "easy", est_time: "1–2 hours", days: 5, category: "licensing" },
    { title: "Choose your education & training provider", description: "Select an approved education or apprenticeship program that fits your schedule and budget.", difficulty: "medium", est_time: "1 day", days: 7, category: "education" },
    { title: "Enroll and complete required coursework", description: "Complete the coursework or classroom hours your state requires before the exam.", difficulty: "hard", est_time: "Weeks–months", days: 90, category: "education" },
    { title: "Log required on-the-job / practical hours", description: "Accumulate the apprenticeship or clinical hours your license requires, tracking hours accurately.", difficulty: "hard", est_time: "Months", days: 180, category: "education" },
    { title: "Prepare for the licensing exam", description: "Use prep materials and practice questions to get ready for your profession's exam.", difficulty: "hard", est_time: "4–8 weeks", days: 45, category: "exam" },
    { title: "Take (and pass) the licensing exam", description: "Register for and sit for the exam with your state's approved testing service.", difficulty: "hard", est_time: "Exam day", days: 14, category: "exam" },
    { title: "Apply for your license & pay fees", description: "Submit your application, background check, and fees to your state licensing authority.", difficulty: "medium", est_time: "1 week", days: 14, category: "licensing" },
    { title: "Research business structure options", description: "Compare sole proprietorship vs. LLC and understand what fits your risk and tax situation.", difficulty: "medium", est_time: "2–3 hours", days: 7, category: "business" },
    { title: "Register your business with the state", description: "Choose a business name and register your entity with your state and local jurisdiction.", difficulty: "medium", est_time: "1 day", days: 7, category: "business" },
    { title: "Get an EIN and open a business bank account", description: "Obtain an Employer Identification Number (EIN) from the IRS and separate your business finances.", difficulty: "easy", est_time: "1 day", days: 5, category: "business" },
    { title: "Obtain required insurance", description: "Secure the liability and other insurance your profession and state require.", difficulty: "medium", est_time: "1 week", days: 10, category: "business" },
    { title: "Set up basic bookkeeping & accounting", description: "Open simple books so you can track income, expenses, and taxes from day one.", difficulty: "medium", est_time: "1 day", days: 7, category: "finance" },
    { title: "Determine your pricing & services", description: "Define the services you'll offer and how you'll price them (hourly, project, package).", difficulty: "medium", est_time: "1 day", days: 7, category: "business" },
    { title: "Estimate startup costs & create a budget", description: "List your one-time and recurring costs and build a simple startup budget.", difficulty: "medium", est_time: "1 day", days: 7, category: "finance" },
    { title: "Build a simple marketing plan & online presence", description: "Create a basic website/Google profile and decide your first marketing channels.", difficulty: "medium", est_time: "1–2 weeks", days: 14, category: "marketing" },
    { title: "Line up supplies, tools, and workspace", description: "Arrange the equipment and workspace you need to start delivering services.", difficulty: "medium", est_time: "1 week", days: 10, category: "operations" },
    { title: "Set up client/leads process & templates", description: "Prepare intake forms, quotes, and simple workflows so you can serve clients consistently.", difficulty: "medium", est_time: "1 week", days: 10, category: "operations" },
    { title: "Launch & review — track progress, adjust", description: "Start serving clients, track what works, and review your plan monthly.", difficulty: "medium", est_time: "Ongoing", days: 30, category: "launch" },
  ];

  // Profession-specific steps (category overlaps above).
  const electrician: Step[] = [
    { title: "Complete your apprenticeship/education path", description: "Meet the classroom and on-the-job hours your state requires for electrician licensure.", difficulty: "hard", est_time: "Typically a multi-year apprenticeship", days: 365, category: "education" },
    { title: "Prepare for your state's electrician exam", description: "Study the National Electrical Code and electrical theory for your state's journeyman exam.", difficulty: "hard", est_time: "6–10 weeks", days: 60, category: "exam" },
  ];
  const nursing: Step[] = [
    { title: "Complete an approved nursing program + clinical hours", description: "Graduate from an approved nursing education program and complete required clinical hours.", difficulty: "hard", est_time: "Months–years depending on program", days: 365, category: "education" },
    { title: "Apply for & prepare for the NCLEX", description: "Through your state board of nursing, register for the NCLEX and prepare using approved review materials.", difficulty: "hard", est_time: "6–10 weeks", days: 60, category: "exam" },
  ];
  const realEstate: Step[] = [
    { title: "Complete state-approved pre-licensing coursework", description: "Finish the pre-licensing education hours your state real estate commission requires.", difficulty: "medium", est_time: "Weeks–months", days: 90, category: "education" },
    { title: "Register for and pass your state real estate exam", description: "Schedule and pass the state licensing exam through your state's approved provider.", difficulty: "hard", est_time: "1–2 months", days: 45, category: "exam" },
  ];

  let order = 0;
  const ins = d.prepare(
    `INSERT INTO roadmap_tasks
      (profession_id, step_order, title, description, difficulty, est_time, suggested_deadline_days, category)
     VALUES ($pid, $step_order, $title, $description, $difficulty, $est_time, $days, $category)`,
  );
  for (const s of generic) {
    order += 1;
    ins.run({ $pid: null, $step_order: order, $title: s.title, $description: s.description, $difficulty: s.difficulty, $est_time: s.est_time, $days: s.days, $category: s.category });
  }
  const addFor = (slug: string, steps: Step[]) => {
    const pid = professionsById.get(slug)!;
    for (const s of steps) {
      order += 1;
      ins.run({ $pid: pid, $step_order: order, $title: s.title, $description: s.description, $difficulty: s.difficulty, $est_time: s.est_time, $days: s.days, $category: s.category });
    }
  };
  addFor("electrician", electrician);
  addFor("nursing", nursing);
  addFor("real-estate", realEstate);
}

// ======================================================================
// FUNDING CATEGORIES (12) — general categories only. NO fake providers.
// Providers are left empty for admin to add in a later milestone.
// ======================================================================
function seedFunding(d: Database): void {
  type C = {
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
  };
  const cats: C[] = [
    {
      name: "Personal Savings",
      description: "Funding your startup from your own savings. No repayment or ownership given up.",
      repayment_required: "No",
      ownership_surrendered: "No",
      common_eligibility: ["You have savings you can invest"],
      documents_requested: ["Personal budget and savings records"],
      benefits: ["No repayment or interest", "Full ownership and control", "Fast and simple"],
      risks: ["Uses your personal safety net", "All risk is yours if the business fails"],
      preparation_steps: ["Set a personal budget", "Decide how much you can realistically invest"],
      questions_to_ask: ["How much am I comfortable risking?", "What cash do I need left for living costs?"],
    },
    {
      name: "Friends & Family Loans",
      description: "Borrowing from people you know, usually informally. Mixes personal relationships with business funds.",
      repayment_required: "Yes",
      ownership_surrendered: "Usually no (if a loan)",
      common_eligibility: ["Trusted personal contacts willing to lend"],
      documents_requested: ["A written agreement", "Repayment plan"],
      benefits: ["Flexible terms", "Can be lower-cost than banks", "Fast to arrange"],
      risks: ["Can strain relationships", "Informal terms can cause conflict", "Interest may still apply"],
      preparation_steps: ["Put terms in writing", "Agree on a clear repayment schedule", "Treat it like a real loan"],
      questions_to_ask: ["What happens if I'm late?", "Should this be an equity share or a loan?"],
    },
    {
      name: "Grants",
      description: "Non-repayable funding awards. Competitive and often targeted at specific groups or missions; rarely apply to established small businesses.",
      repayment_required: "No",
      ownership_surrendered: "No",
      common_eligibility: ["Varies by program; often mission/location/demographic-specific"],
      documents_requested: ["Application/narrative", "Business plan", "Proof of eligibility"],
      benefits: ["Non-repayable", "No ownership given up", "Credibility if awarded"],
      risks: ["Highly competitive", "Narrow eligibility", "Time to apply and report"],
      preparation_steps: ["Research genuine programs only", "Read eligibility closely", "Prepare a clear plan"],
      questions_to_ask: ["Is this grant real and current?", "What are the reporting requirements?"],
    },
    {
      name: "Microloans",
      description: "Small loans (commonly modest amounts) from authorized lenders, often for early-stage small businesses.",
      repayment_required: "Yes",
      ownership_surrendered: "No",
      common_eligibility: ["Early-stage small business", "Basic business plan", "Credit history as required"],
      documents_requested: ["Business plan", "Cash-flow projections", "Personal/business financials"],
      benefits: ["Accessible for small amounts", "Can build business credit", "Often education/mentoring included"],
      risks: ["Interest and fees", "Repayment regardless of revenue", "Collateral may be required"],
      preparation_steps: ["Build cash-flow projections", "Understand total cost of borrowing"],
      questions_to_ask: ["What is the APR and all fees?", "What collateral or guarantee is required?"],
    },
    {
      name: "Bank Loans",
      description: "Traditional term loans from banks. Usually require strong credit, collateral, and a solid track record.",
      repayment_required: "Yes",
      ownership_surrendered: "No",
      common_eligibility: ["Strong credit history", "Established revenue history", "Collateral"],
      documents_requested: ["Business plan", "Financial statements", "Tax returns", "Collateral details"],
      benefits: ["Larger amounts available", "Clear terms", "No ownership given up"],
      risks: ["Strict eligibility", "Hard to qualify for brand-new businesses", "Interest and fees", "Personal guarantee often required"],
      preparation_steps: ["Build credit", "Prepare financials", "Shop multiple lenders"],
      questions_to_ask: ["What are the full terms and fees?", "Can I get pre-approval?"],
    },
    {
      name: "Community Lenders / CDFIs",
      description: "Community development financial institutions and mission-driven lenders that serve local and underserved businesses.",
      repayment_required: "Yes",
      ownership_surrendered: "No",
      common_eligibility: ["Local small businesses", "Mission-aligned borrowers", "May accept lower credit"],
      documents_requested: ["Business plan", "Cash-flow projections", "Personal financials"],
      benefits: ["More flexible than big banks", "Technical assistance often available", "Community focus"],
      risks: ["Interest and fees", "Repayment required", "Availability varies by region"],
      preparation_steps: ["Research local CDFI lenders", "Prepare your plan and projections"],
      questions_to_ask: ["Do you offer technical assistance?", "What rates and terms can you offer?"],
    },
    {
      name: "Credit Unions",
      description: "Member-owned financial cooperatives offering small-business lending, often with lower fees and personal service.",
      repayment_required: "Yes",
      ownership_surrendered: "No",
      common_eligibility: ["Membership in the credit union", "Credit and business history as required"],
      documents_requested: ["Membership proof", "Business plan", "Financials"],
      benefits: ["Member-focused service", "Often lower fees", "Local decision-making"],
      risks: ["Membership required", "Terms vary", "Still a loan to repay"],
      preparation_steps: ["Join and build a relationship", "Prepare financials"],
      questions_to_ask: ["What small-business products exist?", "What are fees and rates?"],
    },
    {
      name: "Investors (Equity)",
      description: "Investors who provide capital in exchange for an ownership stake in your business. Includes angel investors and venture funds at different scales.",
      repayment_required: "No (but they own part of the business)",
      ownership_surrendered: "Yes — a share of ownership",
      common_eligibility: ["High-growth potential", "Strong team and pitch", "Scalable model"],
      documents_requested: ["Investor pitch", "Business plan", "Financial projections", "Legal documents"],
      benefits: ["Large capital", "Strategic advice and network"],
      risks: ["Giving up ownership and some control", "Expectations for growth/exit", "Dilution"],
      preparation_steps: ["Clarify you actually want investors", "Prepare a pitch", "Understand valuation basics"],
      questions_to_ask: ["What ownership % and rights do you want?", "What do you expect in return?"],
    },
    {
      name: "Crowdfunding",
      description: "Raising small amounts from many people, often online — either as rewards, donations, or (where applicable) equity.",
      repayment_required: "Usually no (rewards-based)",
      ownership_surrendered: "No for rewards/donation; equity for equity-crowdfunding",
      common_eligibility: ["A compelling story/product", "A network to rally"],
      documents_requested: ["Campaign page", "Rewards/perks", "Platform requirements"],
      benefits: ["Validation and early customers", "No repayment (rewards-based)", "Marketing built in"],
      risks: ["Fees and platform rules", "Effort to run the campaign", "Only raised if goal met (many platforms)"],
      preparation_steps: ["Build an audience early", "Plan rewards", "Tell a clear story"],
      questions_to_ask: ["What does the platform charge?", "What happens if I don't hit the goal?"],
    },
    {
      name: "Equipment Financing",
      description: "Loans or leases used specifically to buy equipment (vehicles, tools, machines) the equipment serves as collateral.",
      repayment_required: "Yes",
      ownership_surrendered: "No (you pay for the equipment)",
      common_eligibility: ["Business need for the equipment", "Credit as required", "Deposit sometimes"],
      documents_requested: ["Equipment quote", "Business financials", "Use-of-funds detail"],
      benefits: ["Fits purchases like a service van or tools", "Equipment itself as collateral"],
      risks: ["Equipment can be repossessed", "Interest and fees", "Depreciation"],
      preparation_steps: ["Get clear equipment quotes", "Compare lease vs. buy"],
      questions_to_ask: ["What are monthly payments and total cost?", "What happens to the equipment at the end?"],
    },
    {
      name: "Business Competitions",
      description: "Pitch competitions and small-business contests that award non-repayable prizes or funding to winners.",
      repayment_required: "No",
      ownership_surrendered: "Usually no (prize is non-dilutive)",
      common_eligibility: ["Open to entrants who meet the contest rules"],
      documents_requested: ["Application", "Video/pitch", "Business summary"],
      benefits: ["Non-repayable prize money", "Visibility and validation", "Mentorship"],
      risks: ["Very competitive", "Win or nothing", "Time to prepare"],
      preparation_steps: ["Find legitimate contests", "Polish your pitch", "Understand judging criteria"],
      questions_to_ask: ["Is this contest legitimate and current?", "Are there strings attached to the prize?"],
    },
    {
      name: "Revenue-Based Financing",
      description: "Funding repaid as a fixed percentage of monthly revenue until an agreed amount is paid back.",
      repayment_required: "Yes (from revenue)",
      ownership_surrendered: "No equity",
      common_eligibility: ["Steady revenue history", "Business with predictable sales"],
      documents_requested: ["Revenue/financial records", "Bank statements", "Business plan"],
      benefits: ["Payments scale with revenue", "No equity given up"],
      risks: ["Can be expensive", "Fixed % can strain cash flow", "Still must be repaid"],
      preparation_steps: ["Understand the repayment cap", "Stress-test your cash flow"],
      questions_to_ask: ["What is the total payback amount?", "What % of revenue is taken each period?"],
    },
  ];

  const ins = d.prepare(
    `INSERT INTO funding_categories
      (name, description, repayment_required, ownership_surrendered, common_eligibility,
       documents_requested, benefits, risks, preparation_steps, questions_to_ask)
     VALUES ($name, $description, $repayment_required, $ownership_surrendered, $elig,
       $docs, $benefits, $risks, $steps, $questions)`,
  );
  for (const c of cats) {
    ins.run({
      $name: c.name,
      $description: c.description,
      $repayment_required: c.repayment_required,
      $ownership_surrendered: c.ownership_surrendered,
      $elig: $j(c.common_eligibility),
      $docs: $j(c.documents_requested),
      $benefits: $j(c.benefits),
      $risks: $j(c.risks),
      $steps: $j(c.preparation_steps),
      $questions: $j(c.questions_to_ask),
    });
  }
}

// ======================================================================
// SAMPLE PRACTICE QUESTIONS — a tiny sample; M3 owns full question content.
// ======================================================================
function seedQuestions(d: Database): void {
  const ins = d.prepare(
    `INSERT INTO practice_questions
      (profession_id, question, options, correct_index, explanation, is_sample)
     VALUES ($pid, $q, $opts, $ci, $exp, 1)`,
  );
  const sets: Record<string, Array<[string, string[], number, string]>> = {
    electrician: [
      ["Which organization develops the National Electrical Code (NEC)? (Sample question)", ["OSHA", "NFPA", "EPA", "FDA"], 1, "The National Electrical Code is developed by the NFPA (nfpa.org). Sample question only."],
      ["What does a circuit breaker primarily protect against? (Sample question)", ["Water damage", "Overcurrent / short circuits", "Pest intrusion", "Vandalism"], 1, "Circuit breakers protect wiring from overcurrent and short circuits. Sample question only."],
    ],
    nursing: [
      ["Which exam do most entry-level registered nurse candidates take to become licensed? (Sample question)", ["MCAT", "NCLEX", "GRE", "LSAT"], 1, "Most RN candidates take the NCLEX through their state board of nursing via NCSBN. Sample question only."],
      ["What is the primary purpose of the NCLEX-RN? (Sample question)", ["Test basic programming", "Test entry-level nursing competency for safe practice", "Assess physical fitness", "Evaluate marketing skills"], 1, "The NCLEX-RN measures entry-level nursing competence. Sample question only."],
    ],
    "real-estate": [
      ["Which national organization is closely associated with real estate professionals and the REALTOR designation? (Sample question)", ["NAR", "NFPA", "FAA", "USDA"], 0, "The National Association of REALTORS (nar.realtor) is the professional association. Sample question only."],
      ["Before taking a state license exam, most states require agents to complete what? (Sample question)", ["No preparation", "State-approved pre-licensing coursework", "A medical exam", "A driving test"], 1, "Most states require state-approved pre-licensing education before the exam. Sample question only."],
    ],
  };
  for (const [slug, rows] of Object.entries(sets)) {
    const pid = professionsById.get(slug)!;
    for (const [q, opts, ci, exp] of rows) {
      ins.run({ $pid: pid, $q: q, $opts: JSON.stringify(opts), $ci: ci, $exp: exp });
    }
  }
}

// ======================================================================
// USERS — admin + sample. Passwords hashed here with Bun.password.
//   admin : admin@license2launch.demo / L2L-admin-2026!
//   sample: sample@license2launch.demo / L2L-sample-2026!
// ======================================================================
// ======================================================================
// EXPLORER PROFILES — sample comparison data for /explorer.
// Only updates rows where explorer_profile is NULL (idempotent) so it never
// overwrites admin edits, duplicates, or drops existing rows.
// All values are clearly sample estimates — no promised income/timelines.
// ======================================================================
type ExplorerValue = { label: string; text: string };
type ExplorerProfile = {
  trainingTime: ExplorerValue;
  examDifficulty: ExplorerValue;
  startupCost: ExplorerValue;
  selfEmploymentPotential: ExplorerValue;
  customerDemand: ExplorerValue;
  equipment: ExplorerValue;
  businessModels: string[];
  timeToFirstCustomer: ExplorerValue;
  workMode: ExplorerValue;
};

function seedExplorerProfiles(d: Database): void {
  const profiles: Record<string, ExplorerProfile> = {
    electrician: {
      trainingTime: {
        label: "High",
        text: "Typically a multi-year apprenticeship; timelines vary by state and program (sample).",
      },
      examDifficulty: {
        label: "High",
        text: "Code-heavy exam; difficulty varies by state (sample).",
      },
      startupCost: {
        label: "Medium",
        text: "Sample range: roughly $5k–$30k+ depending on tools, vehicle, and insurance (varies widely).",
      },
      selfEmploymentPotential: {
        label: "High",
        text: "Licensed electricians commonly operate independent service businesses (sample).",
      },
      customerDemand: {
        label: "High",
        text: "Generally steady demand for electrical services, but varies by local market (sample).",
      },
      equipment: {
        label: "High",
        text: "Hand/power tools, test meters, safety gear, service vehicle.",
      },
      businessModels: [
        "Residential service & repair",
        "New-construction / remodel wiring",
        "Commercial contracting",
        "Lighting & maintenance contracts",
      ],
      timeToFirstCustomer: {
        label: "Medium",
        text: "Sample estimate: weeks to a few months to build a steady client flow.",
      },
      workMode: {
        label: "In-person",
        text: "Almost entirely in-person service work on site.",
      },
    },
    nursing: {
      trainingTime: {
        label: "Medium",
        text: "Approved degree/diploma program — commonly ~2–4 years (sample).",
      },
      examDifficulty: {
        label: "High",
        text: "The NCLEX is a rigorous exam; pass rates vary (sample).",
      },
      startupCost: {
        label: "Low",
        text: "Sample range: a coaching/education or private-duty model can start with modest costs (insurance, tools, website).",
      },
      selfEmploymentPotential: {
        label: "Medium",
        text: "Independent practice is possible but limited by scope-of-practice rules (sample).",
      },
      customerDemand: {
        label: "High",
        text: "Generally strong healthcare demand; varies by market and setting (sample).",
      },
      equipment: {
        label: "Low",
        text: "Often minimal — clinical supplies, record-keeping tools, transportation.",
      },
      businessModels: [
        "Private-duty home care (sample)",
        "Health coaching / education (sample)",
        "Nursing consulting",
        "Wellness services",
      ],
      timeToFirstCustomer: {
        label: "Medium",
        text: "Sample estimate: depends on model; referrals can bring early clients.",
      },
      workMode: {
        label: "Both",
        text: "Can be in-person (patient care) and/or online (coaching/education).",
      },
    },
    "real-estate": {
      trainingTime: {
        label: "Low",
        text: "State-approved pre-licensing coursework — commonly weeks to a few months (sample).",
      },
      examDifficulty: {
        label: "Medium",
        text: "State licensing exam; difficulty varies (sample).",
      },
      startupCost: {
        label: "Low",
        text: "Sample range: joining a brokerage can keep startup costs relatively light (licensing, association fees, marketing).",
      },
      selfEmploymentPotential: {
        label: "High",
        text: "Agents often work as independent contractors (sample).",
      },
      customerDemand: {
        label: "Medium",
        text: "Commission-based; demand swings with the housing market (sample).",
      },
      equipment: {
        label: "Low",
        text: "Phone, computer, vehicle, marketing tools, MLS/CRM access.",
      },
      businessModels: [
        "Buyer & seller representation",
        "Leasing / rentals",
        "Investor representation",
        "Property management (separate license)",
      ],
      timeToFirstCustomer: {
        label: "Low",
        text: "Sample estimate: a first transaction can come relatively quickly once licensed, but income is irregular.",
      },
      workMode: {
        label: "Both",
        text: "Mostly in-person (showings, meetings) with online marketing.",
      },
    },
  };

  const upd = d.prepare(
    `UPDATE professions SET explorer_profile = $profile WHERE slug = $slug AND explorer_profile IS NULL`,
  );
  for (const [slug, profile] of Object.entries(profiles)) {
    upd.run({ $slug: slug, $profile: JSON.stringify(profile) });
  }
}

// ======================================================================
// ROADMAP OFFICIAL LINKS (M3) — only REAL, verifiable links; otherwise left
// NULL and the UI shows a "confirm with your authority" placeholder.
// ======================================================================
function seedRoadmapOfficialLinks(d: Database): void {
  const links: Array<{ title: string; label: string; url: string }> = [
    {
      title: "Get an EIN and open a business bank account",
      label: "IRS — Employer ID Numbers",
      url: "https://www.irs.gov/businesses/small-businesses-self-employed/employer-id-numbers",
    },
    {
      title: "Apply for & prepare for the NCLEX",
      label: "NCSBN — National Council of State Boards of Nursing",
      url: "https://www.ncsbn.org",
    },
    {
      title: "Prepare for your state's electrician exam",
      label: "NFPA — National Electrical Code",
      url: "https://www.nfpa.org",
    },
    {
      title: "Register for and pass your state real estate exam",
      label: "ARELLO — real estate license law officials",
      url: "https://www.arello.org",
    },
  ];
  const upd = d.prepare(
    `UPDATE roadmap_tasks SET official_link = $url WHERE title = $title AND official_link IS NULL`,
  );
  for (const l of links) {
    upd.run({ $title: l.title, $url: l.url });
  }
}

// ======================================================================
// SAMPLE EXAM COURSES + LESSONS (M3) — clearly sample content, not the
// official exam. 1 course per profession, 3 short sample lessons each.
// ======================================================================
function seedExamContent(d: Database): void {
  type Lesson = { title: string; body: string };
  const courses: Array<{ slug: string; title: string; description: string; lessons: Lesson[] }> = [
    {
      slug: "electrician",
      title: "Electrical Systems & NEC Basics (Sample)",
      description:
        "A short sample overview of electrical theory, the National Electrical Code, and safety practices. This is sample study content — not the official exam and not a substitute for your state-approved curriculum.",
      lessons: [
        {
          title: "Electrical Theory Fundamentals (Sample)",
          body: "This sample lesson covers the basic units used in electrical work: voltage (measured in volts), current (amperes), resistance (ohms), and power (watts). In a simple series circuit, a single open break stops current flow through the whole loop. Understanding these relationships is the foundation for reading wiring and troubleshooting.\n\nSample content only — confirm the depth and topics required for your specific state exam with your licensing authority.",
        },
        {
          title: "Introduction to the National Electrical Code (Sample)",
          body: "The National Electrical Code (NEC) is a widely used set of standards for safe electrical installation. Key ideas include conductor ampacity (the maximum current a conductor can safely carry), grounding, and bonding for electrical continuity and fault protection.\n\nThis is sample study material. Always train with the current, official code and your state-approved program.",
        },
        {
          title: "Safety & Working Practices (Sample)",
          body: "Working safely on electrical systems means verifying power is off before work where required, using appropriate test instruments such as a digital multimeter, and using protective devices like GFCIs in wet locations. Safe work practices protect the electrician and the occupants.\n\nSample content only — follow your employer/state safety requirements and the authority having jurisdiction.",
        },
      ],
    },
    {
      slug: "nursing",
      title: "NCLEX-RN Readiness (Sample)",
      description:
        "A short sample set of lessons aligned to broad NCLEX client-need areas. This is sample study content only — it is not the NCLEX and does not predict exam performance.",
      lessons: [
        {
          title: "Safe & Effective Care Environment (Sample)",
          body: "This sample lesson covers core ideas about keeping patients safe: identifying the client with two identifiers before care, practicing hand hygiene to reduce infection, and protecting the client during care. Prioritizing safety and infection control are recurring themes in nursing review.\n\nSample content only — see your board of nursing and approved review materials for real exam details.",
        },
        {
          title: "Health Promotion & Physiological Integrity (Sample)",
          body: "This sample lesson touches on preventive health topics such as adult immunizations, bone-health nutrition, and recognizing signs of dehydration or low blood glucose. These are the kinds of physiological-integrity topics that appear in nursing review materials.\n\nThis is sample study content, not the official exam or a promise of passing.",
        },
        {
          title: "Fundamentals of Prioritization & Communication (Sample)",
          body: "Nurses often prioritize based on what threatens the client's airway, breathing, and circulation first. Therapeutic communication keeps the focus on the client's perspective, for example by inviting them to share how they are feeling rather than dismissing a concern.\n\nSample review content only — always reference current, approved nursing education and your state board of nursing.",
        },
      ],
    },
    {
      slug: "real-estate",
      title: "Real Estate Licensing Principles (Sample)",
      description:
        "A short sample set of lessons on real estate principles, agency, finance, and licensing. This is sample study content — not the official state exam and not legal advice.",
      lessons: [
        {
          title: "Real Estate Principles & Practices (Sample)",
          body: "This sample lesson introduces core concepts like the MLS (Multiple Listing Service), the physical characteristics of land (immobility, indestructibility, and uniqueness), and how property is brought to market. These basics support the day-to-day work of an agent.\n\nSample content only — confirm the topics for your state exam with your state real estate commission.",
        },
        {
          title: "Contracts, Agency & Finance Basics (Sample)",
          body: "Agency relationships define whom an agent represents: a buyer's agent represents the buyer, and the agent owes fiduciary duties. Around financing, a mortgage payment often includes principal, interest, and escrowed taxes and insurance (PITI).\n\nThis is sample study material, not legal advice. Consult a qualified professional for your transaction.",
        },
        {
          title: "State Law & Ethics Review (Sample)",
          body: "Licensing and continuing-education requirements are set by each state's licensing authority, and agency disclosure informs parties whom the agent represents. Ethical practice keeps the client's interests ahead of the agent's own.\n\nSample content only — confirm your state's specific pre-licensing and continuing-education requirements.",
        },
      ],
    },
  ];

  for (const c of courses) {
    const pid = professionIdFor(d, c.slug);
    if (pid < 0) continue;
    let courseId: number;
    const existing = d
      .query("SELECT id FROM exam_courses WHERE profession_id = $pid")
      .get({ $pid: pid }) as { id: number } | undefined;
    if (existing) {
      courseId = Number(existing.id);
    } else {
      const info = d
        .query(
          "INSERT INTO exam_courses (profession_id, title, description, is_sample) VALUES ($pid, $t, $d, 1)",
        )
        .run({ $pid: pid, $t: c.title, $d: c.description });
      courseId = Number(info.lastInsertRowid);
    }
    const lessonCount = d
      .query("SELECT COUNT(*) AS c FROM lessons WHERE course_id = $cid")
      .get({ $cid: courseId }) as { c: number };
    if (lessonCount.c === 0) {
      const ins = d.prepare(
        "INSERT INTO lessons (course_id, title, body, order_index) VALUES ($cid, $t, $b, $o)",
      );
      c.lessons.forEach((l, i) =>
        ins.run({ $cid: courseId, $t: l.title, $b: l.body, $o: i }),
      );
    }
  }
}

// ======================================================================
// SAMPLE PRACTICE QUESTION BANK (M3) — original, sample-labeled questions.
// Extends the M1 6 questions into ~10 per profession (30 total) with topic +
// difficulty, and assigns each profession's questions to its sample course.
// Idempotent: updates metadata on existing rows and inserts only as many as
// needed to reach the target count (never duplicates).
// ======================================================================
function seedQuestionBank(d: Database): void {
  type Q = {
    q: string;
    opts: string[];
    ci: number;
    exp: string;
    topic: string;
    diff: string;
  };
  const sets: Record<string, Q[]> = {
    electrician: [
      { q: "Which organization develops the National Electrical Code (NEC)? (Sample question)", opts: ["OSHA", "NFPA", "EPA", "FDA"], ci: 1, exp: "The National Electrical Code is developed by the NFPA (nfpa.org). Sample question only.", topic: "National Electrical Code", diff: "easy" },
      { q: "What does a circuit breaker primarily protect against? (Sample question)", opts: ["Water damage", "Overcurrent / short circuits", "Pest intrusion", "Vandalism"], ci: 1, exp: "Circuit breakers protect wiring from overcurrent and short circuits. Sample question only.", topic: "Electrical Theory", diff: "easy" },
      { q: "In a simple series circuit, if one resistor fails open, what happens to the current? (Sample question)", opts: ["Current increases", "Current stops flowing through the loop", "Current is unchanged", "Voltage doubles"], ci: 1, exp: "An open break in a series circuit stops current through the whole loop. Sample question only.", topic: "Electrical Theory", diff: "medium" },
      { q: "Which device is designed to protect people from electric shock in wet locations? (Sample question)", opts: ["GFCI outlet", "Standard fuse", "Step-down transformer", "Relay"], ci: 0, exp: "A GFCI (ground-fault circuit interrupter) is designed to cut power on a ground fault, often required in wet locations. Sample question only.", topic: "Safety", diff: "easy" },
      { q: "What does the ampacity of a conductor refer to? (Sample question)", opts: ["Its physical length", "The maximum current it can safely carry", "Its color code", "Its resistance at 0ºC"], ci: 1, exp: "Ampacity is the maximum current a conductor can safely carry under specified conditions. Sample question only.", topic: "National Electrical Code", diff: "medium" },
      { q: "Which tool is most appropriate for measuring voltage in a live circuit? (Sample question)", opts: ["Digital multimeter", "Pipe wrench", "Tape measure", "Hammer"], ci: 0, exp: "A digital multimeter is used to measure voltage. Sample question only.", topic: "Tools & Equipment", diff: "easy" },
      { q: "Which unit measures electrical power? (Sample question)", opts: ["Ampere", "Volt", "Watt", "Ohm"], ci: 2, exp: "Electrical power is measured in watts (volts × amps). Sample question only.", topic: "Electrical Theory", diff: "medium" },
      { q: "What is a primary purpose of grounding a system? (Sample question)", opts: ["To increase the operating voltage", "To provide a safe path for fault current", "To reduce the number of outlets", "To store electrical energy"], ci: 1, exp: "Grounding provides a safe path for fault current and helps protect people and equipment. Sample question only.", topic: "Safety", diff: "medium" },
      { q: "What does the term bonding refer to in electrical work? (Sample question)", opts: ["Connecting metal parts to establish electrical continuity", "Insulating a conductor", "Increasing circuit resistance", "Painting conduit for identification"], ci: 0, exp: "Bonding connects metal parts to establish electrical continuity so a fault current has a low-resistance path. Sample question only.", topic: "National Electrical Code", diff: "hard" },
      { q: "A continuity test on a wire is best used to check what? (Sample question)", opts: ["Whether the wire is continuous with no breaks", "The wire's color code", "The voltage present in the circuit", "The load current"], ci: 0, exp: "Continuity testing verifies a complete, unbroken path through a conductor. Sample question only.", topic: "Tools & Equipment", diff: "medium" },
    ],
    nursing: [
      { q: "Which exam do most entry-level registered nurse candidates take to become licensed? (Sample question)", opts: ["MCAT", "NCLEX", "GRE", "LSAT"], ci: 1, exp: "Most RN candidates take the NCLEX through their state board of nursing via NCSBN. Sample question only.", topic: "Safe Care Environment", diff: "easy" },
      { q: "What is the primary purpose of the NCLEX-RN? (Sample question)", opts: ["Test basic programming", "Test entry-level nursing competency for safe practice", "Assess physical fitness", "Evaluate marketing skills"], ci: 1, exp: "The NCLEX-RN measures entry-level nursing competence for safe practice. Sample question only.", topic: "Safe Care Environment", diff: "easy" },
      { q: "A patient's oxygen saturation reads 88%. Which action best supports the airway and breathing? (Sample question)", opts: ["Administer a sedative", "Reposition and provide supplemental oxygen per protocol", "Restrict all fluids", "Encourage deep breathing only during exercise"], ci: 1, exp: "Positioning and supplemental oxygen support oxygenation; 88% saturation warrants prompt attention per protocol. Sample question only.", topic: "Physiological Integrity", diff: "medium" },
      { q: "Which nutrient is important for bone health and commonly discussed in wellness education? (Sample question)", opts: ["Calcium", "Caffeine", "Sodium", "Saturated fat"], ci: 0, exp: "Calcium is important for bone health and is a common wellness-education topic. Sample question only.", topic: "Health Promotion", diff: "easy" },
      { q: "Which action best reduces the risk of healthcare-associated infection? (Sample question)", opts: ["Hand hygiene before and after client contact", "Sharing client care items", "Leaving bed rails down", "Reusing single-use gloves"], ci: 0, exp: "Hand hygiene is a cornerstone of infection prevention. Sample question only.", topic: "Safe Care Environment", diff: "medium" },
      { q: "A client with diabetes has a blood glucose of 45 mg/dL. Which response is most appropriate? (Sample question)", opts: ["Provide a fast-acting carbohydrate per protocol", "Withhold all food", "Increase the insulin dose", "Decrease glucose monitoring"], ci: 0, exp: "A low blood glucose reading is treated with a fast-acting carbohydrate per protocol. Sample question only.", topic: "Physiological Integrity", diff: "hard" },
      { q: "Which response best demonstrates therapeutic communication? (Sample question)", opts: ["“Tell me more about how you are feeling.”", "“You shouldn't worry about that.”", "“Everyone handles this the same way.”", "“Just focus on getting better.”"], ci: 0, exp: "Inviting the client to elaborate keeps communication client-focused and therapeutic. Sample question only.", topic: "Psychosocial Integrity", diff: "easy" },
      { q: "Which group of immunizations is commonly recommended for adults as part of preventive health? (Sample question)", opts: ["Influenza and tetanus boosters per current guidelines", "None are recommended for adults", "Only travel immunizations", "Only childhood immunizations"], ci: 0, exp: "Adult immunizations such as influenza and tetanus boosters are commonly recommended per current guidelines. Sample question only.", topic: "Health Promotion", diff: "medium" },
      { q: "When identifying a client before medication administration, which is appropriate to confirm? (Sample question)", opts: ["Two identifiers such as name and date of birth", "The client's favorite color", "The room number alone", "The client's shoe size"], ci: 0, exp: "Using two identifiers (e.g., name and date of birth) is a standard safety practice before medication. Sample question only.", topic: "Safe Care Environment", diff: "hard" },
      { q: "Which finding suggests possible dehydration? (Sample question)", opts: ["Decreased urine output", "Increased skin turgor", "Moist mucous membranes", "Clear urine"], ci: 0, exp: "Decreased urine output can be a sign of dehydration. Sample question only.", topic: "Physiological Integrity", diff: "medium" },
    ],
    "real-estate": [
      { q: "Which national organization is closely associated with real estate professionals and the REALTOR designation? (Sample question)", opts: ["NAR", "NFPA", "FAA", "USDA"], ci: 0, exp: "The National Association of REALTORS (nar.realtor) is the professional association. Sample question only.", topic: "Principles & Practices", diff: "easy" },
      { q: "Before taking a state license exam, most states require agents to complete what? (Sample question)", opts: ["No preparation", "State-approved pre-licensing coursework", "A medical exam", "A driving test"], ci: 1, exp: "Most states require state-approved pre-licensing education before the exam. Sample question only.", topic: "State Law & Ethics", diff: "easy" },
      { q: "Which term describes the estimated value of a property based on comparable sales? (Sample question)", opts: ["Market or appraised value", "Tax basis", "Replacement cost only", "Assessed penalty"], ci: 0, exp: "An appraisal or market value is commonly estimated from comparable sales. Sample question only.", topic: "Finance & Valuation", diff: "medium" },
      { q: "In a typical buyer representation agreement, whom does the buyer's agent represent? (Sample question)", opts: ["The buyer", "The seller", "The lender", "Both buyer and seller equally"], ci: 0, exp: "A buyer's agent represents the buyer in a typical buyer representation agreement. Sample question only.", topic: "Contracts & Agency", diff: "medium" },
      { q: "What does MLS commonly stand for in real estate? (Sample question)", opts: ["Multiple Listing Service", "Main Lending System", "Municipal Licensing Service", "Market Location Service"], ci: 0, exp: "MLS stands for Multiple Listing Service, the shared database of listings. Sample question only.", topic: "Principles & Practices", diff: "easy" },
      { q: "A real estate agent who puts a client's interests ahead of their own is practicing what? (Sample question)", opts: ["Fiduciary duty", "Negligence", "Dual agency without consent", "Deceptive practice"], ci: 0, exp: "Putting the client's interests ahead of one's own reflects fiduciary duty. Sample question only.", topic: "State Law & Ethics", diff: "medium" },
      { q: "Which of the following often makes up the full mortgage payment (PITI)? (Sample question)", opts: ["Principal and interest", "Property taxes and insurance (when escrowed)", "All of the above together", "Only closing costs"], ci: 2, exp: "PITI commonly includes principal, interest, taxes, and insurance. Sample question only.", topic: "Finance & Valuation", diff: "hard" },
      { q: "What is an example of an agency disclosure in a real estate transaction? (Sample question)", opts: ["Informing parties whom the agent represents", "Advertising a listing's asking price", "Setting the commission rate", "Choosing the escrow officer"], ci: 0, exp: "An agency disclosure tells parties whom the agent represents in the transaction. Sample question only.", topic: "Contracts & Agency", diff: "hard" },
      { q: "The physical characteristics of land include which of the following? (Sample question)", opts: ["Immobility, indestructibility, and uniqueness", "Easy duplication", "Instant mobility", "Perishability"], ci: 0, exp: "Land is commonly described as immobile, indestructible, and unique. Sample question only.", topic: "Principles & Practices", diff: "medium" },
      { q: "Continuing-education requirements for real estate license renewal are typically set by whom? (Sample question)", opts: ["The state licensing authority", "The homeowner", "The local utility company", "The title company"], ci: 0, exp: "State licensing authorities typically set continuing-education requirements. Sample question only.", topic: "State Law & Ethics", diff: "medium" },
    ],
  };

  for (const [slug, rows] of Object.entries(sets)) {
    const pid = professionIdFor(d, slug);
    if (pid < 0) continue;
    const course = d
      .query("SELECT id FROM exam_courses WHERE profession_id = $pid")
      .get({ $pid: pid }) as { id: number } | undefined;
    const cid = course ? Number(course.id) : null;
    // Update topic/difficulty/course_id on any existing matching rows.
    const upd = d.prepare(
      `UPDATE practice_questions SET topic = $topic, difficulty = $diff, course_id = $cid
        WHERE profession_id = $pid AND question = $q`,
    );
    for (const r of rows) {
      upd.run({ $pid: pid, $q: r.q, $topic: r.topic, $diff: r.diff, $cid: cid });
    }
    // Insert only enough to reach the target count (never duplicates).
    const target = 10;
    const cnt = d
      .query("SELECT COUNT(*) AS c FROM practice_questions WHERE profession_id = $pid")
      .get({ $pid: pid }) as { c: number };
    if (cnt.c < target) {
      const ins = d.prepare(
        `INSERT INTO practice_questions
           (profession_id, question, options, correct_index, explanation, is_sample, topic, difficulty, course_id)
         VALUES ($pid, $q, $opts, $ci, $exp, 1, $topic, $diff, $cid)`,
      );
      for (let i = cnt.c; i < target && i < rows.length; i++) {
        const r = rows[i];
        ins.run({
          $pid: pid,
          $q: r.q,
          $opts: JSON.stringify(r.opts),
          $ci: r.ci,
          $exp: r.exp,
          $topic: r.topic,
          $diff: r.diff,
          $cid: cid,
        });
      }
    }
  }
}

async function seedUsers(d: Database): Promise<void> {
  const s = d.query("SELECT COUNT(*) AS c FROM users").get() as { c: number };
  if (s.c > 0) return;
  const ins = d.prepare(
    `INSERT INTO users (email, password_hash, name, role) VALUES ($email, $hash, $name, $role)`,
  );
  const adminHash = await Bun.password.hash("L2L-admin-2026!");
  const sampleHash = await Bun.password.hash("L2L-sample-2026!");
  ins.run({ $email: "admin@license2launch.demo", $hash: adminHash, $name: "Admin", $role: "admin" });
  ins.run({ $email: "sample@license2launch.demo", $hash: sampleHash, $name: "Sample User", $role: "user" });
}
