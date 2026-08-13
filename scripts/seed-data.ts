/**
 * Seed dataset for TeamGraph.
 *
 * This file only builds data in memory — see scripts/seed.ts for the part
 * that actually writes it to CognoDB. Splitting them keeps the interesting
 * modeling decisions (who knows whom, which skills relate to which, which
 * projects are deliberately under-staffed) separate from the write mechanics.
 *
 * Randomness is seeded (mulberry32) so re-running produces the same graph —
 * useful when you want a stable demo to record a screencast against.
 */

// ---------------------------------------------------------------------------
// Deterministic RNG
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260813);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(rand() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function chance(p: number): boolean {
  return rand() < p;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export const TEAMS = [
  { id: "team-payments", name: "Payments Platform", department: "Payments" },
  { id: "team-identity", name: "Identity & Access", department: "Security" },
  { id: "team-growth", name: "Growth", department: "Product" },
  { id: "team-search", name: "Search & Discovery", department: "Product" },
  { id: "team-mobile", name: "Mobile", department: "Product" },
  { id: "team-data", name: "Data Platform", department: "Data" },
  { id: "team-ranking", name: "ML Ranking", department: "Data" },
  { id: "team-devinfra", name: "Developer Infra", department: "Infrastructure" },
  { id: "team-sre", name: "Site Reliability", department: "Infrastructure" },
  { id: "team-design-systems", name: "Design Systems", department: "Product" },
] as const;

// ---------------------------------------------------------------------------
// Skills + adjacency graph
// ---------------------------------------------------------------------------

export const SKILLS: { id: string; name: string; category: "language" | "framework" | "domain" | "tool" }[] = [
  // Languages
  { id: "skill-typescript", name: "TypeScript", category: "language" },
  { id: "skill-python", name: "Python", category: "language" },
  { id: "skill-go", name: "Go", category: "language" },
  { id: "skill-rust", name: "Rust", category: "language" },
  { id: "skill-java", name: "Java", category: "language" },
  { id: "skill-kotlin", name: "Kotlin", category: "language" },
  { id: "skill-swift", name: "Swift", category: "language" },
  // Frameworks
  { id: "skill-react", name: "React", category: "framework" },
  { id: "skill-nextjs", name: "Next.js", category: "framework" },
  { id: "skill-nodejs", name: "Node.js", category: "framework" },
  { id: "skill-fastapi", name: "FastAPI", category: "framework" },
  { id: "skill-spring-boot", name: "Spring Boot", category: "framework" },
  { id: "skill-graphql", name: "GraphQL", category: "framework" },
  { id: "skill-grpc", name: "gRPC", category: "framework" },
  // Domains
  { id: "skill-payments", name: "Payments", category: "domain" },
  { id: "skill-fraud", name: "Fraud Detection", category: "domain" },
  { id: "skill-identity", name: "Identity & Auth", category: "domain" },
  { id: "skill-compliance", name: "Compliance", category: "domain" },
  { id: "skill-search-ranking", name: "Search Ranking", category: "domain" },
  { id: "skill-recsys", name: "Recommendation Systems", category: "domain" },
  { id: "skill-billing", name: "Billing", category: "domain" },
  { id: "skill-observability", name: "Observability", category: "domain" },
  { id: "skill-data-pipelines", name: "Data Pipelines", category: "domain" },
  { id: "skill-accessibility", name: "Accessibility", category: "domain" },
  { id: "skill-perf", name: "Performance Engineering", category: "domain" },
  { id: "skill-ios", name: "Mobile (iOS)", category: "domain" },
  { id: "skill-android", name: "Mobile (Android)", category: "domain" },
  // Tools
  { id: "skill-kubernetes", name: "Kubernetes", category: "tool" },
  { id: "skill-terraform", name: "Terraform", category: "tool" },
  { id: "skill-postgres", name: "PostgreSQL", category: "tool" },
  { id: "skill-kafka", name: "Kafka", category: "tool" },
  { id: "skill-redis", name: "Redis", category: "tool" },
  { id: "skill-elasticsearch", name: "Elasticsearch", category: "tool" },
  { id: "skill-docker", name: "Docker", category: "tool" },
];

/** Hand-curated skill adjacency — this is what makes the multi-hop expert search meaningful. */
export const RELATED_SKILLS: [string, string, number][] = [
  ["skill-typescript", "skill-react", 0.8],
  ["skill-react", "skill-nextjs", 0.9],
  ["skill-nextjs", "skill-nodejs", 0.6],
  ["skill-nodejs", "skill-typescript", 0.7],
  ["skill-python", "skill-fastapi", 0.85],
  ["skill-python", "skill-data-pipelines", 0.6],
  ["skill-go", "skill-grpc", 0.7],
  ["skill-go", "skill-kubernetes", 0.5],
  ["skill-java", "skill-spring-boot", 0.85],
  ["skill-kotlin", "skill-android", 0.9],
  ["skill-swift", "skill-ios", 0.9],
  ["skill-graphql", "skill-nodejs", 0.5],
  ["skill-graphql", "skill-react", 0.4],
  ["skill-payments", "skill-billing", 0.7],
  ["skill-payments", "skill-fraud", 0.6],
  ["skill-payments", "skill-compliance", 0.5],
  ["skill-identity", "skill-compliance", 0.6],
  ["skill-identity", "skill-fraud", 0.4],
  ["skill-search-ranking", "skill-recsys", 0.7],
  ["skill-search-ranking", "skill-elasticsearch", 0.6],
  ["skill-recsys", "skill-data-pipelines", 0.5],
  ["skill-data-pipelines", "skill-kafka", 0.7],
  ["skill-data-pipelines", "skill-postgres", 0.5],
  ["skill-observability", "skill-kubernetes", 0.5],
  ["skill-observability", "skill-perf", 0.6],
  ["skill-kubernetes", "skill-terraform", 0.6],
  ["skill-kubernetes", "skill-docker", 0.8],
  ["skill-terraform", "skill-docker", 0.4],
  ["skill-redis", "skill-perf", 0.5],
  ["skill-postgres", "skill-redis", 0.4],
  ["skill-accessibility", "skill-react", 0.5],
  ["skill-perf", "skill-react", 0.4],
  ["skill-elasticsearch", "skill-data-pipelines", 0.5],
];

// ---------------------------------------------------------------------------
// Projects (+ required skills — some deliberately under-covered, see below)
// ---------------------------------------------------------------------------

export const PROJECTS: {
  id: string;
  name: string;
  description: string;
  status: "active" | "maintenance" | "planned";
  team: string;
  requiredSkills: [string, number][]; // [skillId, importance 1-3]
  components: { name: string; path: string }[];
}[] = [
  {
    id: "proj-checkout-redesign",
    name: "Checkout Redesign",
    description: "Rebuilding the checkout flow for a single-page, mobile-first experience.",
    status: "active",
    team: "team-payments",
    requiredSkills: [["skill-payments", 3], ["skill-react", 2], ["skill-typescript", 2], ["skill-accessibility", 1]],
    components: [
      { name: "cart-service", path: "services/checkout/cart-service" },
      { name: "payment-flow-ui", path: "apps/web/checkout/payment-flow" },
      { name: "checkout-api", path: "services/checkout/api" },
    ],
  },
  {
    id: "proj-fraud-shield",
    name: "Fraud Shield",
    description: "Real-time transaction risk scoring to catch fraudulent payments before settlement.",
    status: "active",
    team: "team-payments",
    // Coverage here isn't hand-rigged — it falls out of the seeded RNG the same way
    // it would from real staffing data. As of the committed seed, this project
    // happens to land the richest gap example: Fraud Detection (critical) held by
    // exactly one person, Python and Data Pipelines uncovered entirely. Re-running
    // the seed with different data will shuffle which project shows this.
    requiredSkills: [["skill-fraud", 3], ["skill-python", 2], ["skill-data-pipelines", 2]],
    components: [
      { name: "risk-scoring-engine", path: "services/fraud/risk-scoring" },
      { name: "rules-worker", path: "services/fraud/rules-worker" },
    ],
  },
  {
    id: "proj-billing-v2",
    name: "Billing Engine v2",
    description: "Usage-based billing engine replacing the legacy flat-rate invoicing system.",
    status: "maintenance",
    team: "team-payments",
    requiredSkills: [["skill-billing", 3], ["skill-java", 2], ["skill-spring-boot", 2], ["skill-postgres", 1]],
    components: [
      { name: "invoice-generator", path: "services/billing/invoice-generator" },
      { name: "billing-api", path: "services/billing/api" },
    ],
  },
  {
    id: "proj-sso-rollout",
    name: "SSO Rollout",
    description: "Company-wide single sign-on rollout across internal and customer-facing apps.",
    status: "active",
    team: "team-identity",
    requiredSkills: [["skill-identity", 3], ["skill-go", 2], ["skill-grpc", 1]],
    components: [
      { name: "auth-gateway", path: "services/identity/auth-gateway" },
      { name: "session-service", path: "services/identity/session-service" },
    ],
  },
  {
    id: "proj-compliance-reporting",
    name: "Compliance Reporting",
    description: "Automated regulatory reporting pipeline for financial audits.",
    status: "planned",
    team: "team-identity",
    requiredSkills: [["skill-compliance", 3], ["skill-python", 2], ["skill-postgres", 1]],
    components: [{ name: "reporting-pipeline", path: "services/compliance/reporting-pipeline" }],
  },
  {
    id: "proj-growth-experiments",
    name: "Growth Experiments Platform",
    description: "Self-serve A/B testing platform for the growth team's onboarding funnels.",
    status: "active",
    team: "team-growth",
    requiredSkills: [["skill-typescript", 2], ["skill-nextjs", 2], ["skill-graphql", 1]],
    components: [
      { name: "experiments-dashboard", path: "apps/web/experiments" },
      { name: "assignment-service", path: "services/growth/assignment-service" },
    ],
  },
  {
    id: "proj-search-relevance",
    name: "Search Relevance Overhaul",
    description: "Rebuilding the ranking pipeline behind product search to cut zero-result queries.",
    status: "active",
    team: "team-search",
    requiredSkills: [["skill-search-ranking", 3], ["skill-elasticsearch", 2], ["skill-python", 1]],
    components: [
      { name: "ranking-service", path: "services/search/ranking-service" },
      { name: "query-parser", path: "services/search/query-parser" },
    ],
  },
  {
    id: "proj-recsys",
    name: "Recommendation Engine",
    description: "Personalized \"related items\" recommendations powered by user behavior data.",
    status: "active",
    team: "team-ranking",
    requiredSkills: [["skill-recsys", 3], ["skill-data-pipelines", 2], ["skill-python", 2]],
    components: [
      { name: "candidate-generator", path: "services/recsys/candidate-generator" },
      { name: "feature-pipeline", path: "services/recsys/feature-pipeline" },
    ],
  },
  {
    id: "proj-mobile-ios",
    name: "Mobile iOS Revamp",
    description: "Full UI rewrite of the iOS app on the new native design system.",
    status: "active",
    team: "team-mobile",
    requiredSkills: [["skill-swift", 3], ["skill-ios", 3], ["skill-accessibility", 1]],
    components: [{ name: "ios-app", path: "apps/ios/TeamGraph" }],
  },
  {
    id: "proj-mobile-android",
    name: "Mobile Android Revamp",
    description: "Full UI rewrite of the Android app on the new native design system.",
    status: "active",
    team: "team-mobile",
    requiredSkills: [["skill-kotlin", 3], ["skill-android", 3], ["skill-accessibility", 1]],
    components: [{ name: "android-app", path: "apps/android/teamgraph" }],
  },
  {
    id: "proj-data-lake",
    name: "Data Lake Migration",
    description: "Migrating batch analytics off the legacy warehouse onto a streaming-first data lake.",
    status: "active",
    team: "team-data",
    requiredSkills: [["skill-data-pipelines", 3], ["skill-kafka", 2], ["skill-terraform", 1]],
    components: [
      { name: "ingestion-service", path: "services/data/ingestion-service" },
      { name: "stream-processor", path: "services/data/stream-processor" },
    ],
  },
  {
    id: "proj-platform-reliability",
    name: "Platform Reliability Initiative",
    description: "Company-wide SLO program: tracing, alerting, and incident tooling.",
    status: "active",
    team: "team-sre",
    requiredSkills: [["skill-observability", 3], ["skill-kubernetes", 2], ["skill-terraform", 2]],
    components: [
      { name: "slo-dashboard", path: "services/sre/slo-dashboard" },
      { name: "alert-router", path: "services/sre/alert-router" },
    ],
  },
];

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  "Ava", "Liam", "Maya", "Noah", "Priya", "Ethan", "Sofia", "Kai", "Zara", "Lucas",
  "Amara", "Mateo", "Nina", "Owen", "Leila", "Diego", "Yuki", "Grace", "Idris", "Elena",
  "Arjun", "Chloe", "Femi", "Ines", "Tomas", "Ruth", "Hiro", "Layla", "Marcus", "Anya",
  "Devon", "Fatima", "Callum", "Naomi", "Rafael", "Sasha", "Wei", "Isabel", "Theo", "Amina",
  "Jonas", "Keiko", "Lena", "Omar", "Petra", "Rosa", "Sven", "Talia", "Victor", "Zoe",
];
const LAST_NAMES = [
  "Nakamura", "Osei", "Ferreira", "Kowalski", "Singh", "Novak", "Adeyemi", "Larsson", "Kim", "Rossi",
  "Haddad", "Petrova", "Okoye", "Dubois", "Mendez", "Andersen", "Ibrahim", "Yamamoto", "Costa", "Weber",
  "Sharma", "Nilsson", "Abara", "Moreau", "Kaur", "Lindgren", "Santos", "Volkov", "Chowdhury", "Ekwueme",
];

const TITLES_BY_LEVEL = [
  "Software Engineer I",
  "Software Engineer II",
  "Senior Software Engineer",
  "Staff Engineer",
  "Tech Lead",
  "Engineering Manager",
];

const AVATAR_PALETTE = [
  "#6366f1", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#22c55e", "#ec4899", "#06b6d4", "#f97316",
];

/** Skills most relevant to each team — used to bias realistic skill assignment. */
const TEAM_SKILL_BIAS: Record<string, string[]> = {
  "team-payments": ["skill-payments", "skill-billing", "skill-fraud", "skill-java", "skill-spring-boot", "skill-typescript", "skill-react", "skill-postgres"],
  "team-identity": ["skill-identity", "skill-compliance", "skill-go", "skill-grpc", "skill-fraud"],
  "team-growth": ["skill-typescript", "skill-react", "skill-nextjs", "skill-graphql", "skill-nodejs"],
  "team-search": ["skill-search-ranking", "skill-elasticsearch", "skill-python", "skill-data-pipelines"],
  "team-mobile": ["skill-swift", "skill-ios", "skill-kotlin", "skill-android", "skill-accessibility"],
  "team-data": ["skill-data-pipelines", "skill-kafka", "skill-postgres", "skill-python", "skill-terraform"],
  "team-ranking": ["skill-recsys", "skill-data-pipelines", "skill-python", "skill-search-ranking"],
  "team-devinfra": ["skill-kubernetes", "skill-terraform", "skill-docker", "skill-go", "skill-observability"],
  "team-sre": ["skill-observability", "skill-kubernetes", "skill-terraform", "skill-perf", "skill-redis"],
  "team-design-systems": ["skill-react", "skill-typescript", "skill-accessibility", "skill-perf"],
};

export interface SeedPerson {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarColor: string;
  teamId: string;
  skills: { skillId: string; level: number; endorsed: boolean }[];
}

function buildPeople(): SeedPerson[] {
  const usedNames = new Set<string>();
  const people: SeedPerson[] = [];

  // Roughly proportional headcount per team (payments/data-heavy org).
  const headcount: Record<string, number> = {
    "team-payments": 7,
    "team-identity": 4,
    "team-growth": 5,
    "team-search": 4,
    "team-mobile": 6,
    "team-data": 5,
    "team-ranking": 4,
    "team-devinfra": 4,
    "team-sre": 4,
    "team-design-systems": 4,
  };

  for (const team of TEAMS) {
    const n = headcount[team.id] ?? 4;
    for (let i = 0; i < n; i++) {
      let full = "";
      do {
        full = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      } while (usedNames.has(full));
      usedNames.add(full);

      const id = `person-${slugify(full)}`;
      const title = pick(TITLES_BY_LEVEL);
      const bias = TEAM_SKILL_BIAS[team.id] ?? [];
      const skillCount = 3 + Math.floor(rand() * 3); // 3-5
      const chosenSkillIds = new Set<string>();
      // Bias toward team-relevant skills, then top up with anything.
      for (const s of pickN(bias, Math.min(skillCount, bias.length))) chosenSkillIds.add(s);
      while (chosenSkillIds.size < skillCount) {
        chosenSkillIds.add(pick(SKILLS).id);
      }

      const skills = [...chosenSkillIds].map((skillId) => {
        const level = 1 + Math.floor(rand() * 5);
        return { skillId, level, endorsed: level >= 4 ? chance(0.6) : chance(0.15) };
      });

      people.push({
        id,
        name: full,
        title,
        bio: `${title} on ${team.name}, focused on ${SKILLS.find((s) => s.id === skills[0].skillId)?.name ?? "the team's core stack"}.`,
        avatarColor: pick(AVATAR_PALETTE),
        teamId: team.id,
        skills,
      });
    }
  }

  return people;
}

export const PEOPLE = buildPeople();

// ---------------------------------------------------------------------------
// Project staffing (WORKED_ON) + code ownership (TOUCHED)
// ---------------------------------------------------------------------------

export interface WorkedOn {
  personId: string;
  projectId: string;
  role: "Contributor" | "Lead" | "Reviewer";
  since: string;
}

export interface Touched {
  personId: string;
  componentId: string;
  commits: number;
  lastTouched: string;
}

function randomPastDate(maxDaysAgo: number): string {
  const days = Math.floor(rand() * maxDaysAgo);
  const d = new Date("2026-08-13T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function buildStaffingAndOwnership() {
  const workedOn: WorkedOn[] = [];
  const touched: Touched[] = [];

  const peopleByTeam = new Map<string, SeedPerson[]>();
  for (const p of PEOPLE) {
    if (!peopleByTeam.has(p.teamId)) peopleByTeam.set(p.teamId, []);
    peopleByTeam.get(p.teamId)!.push(p);
  }

  for (const project of PROJECTS) {
    const teamMembers = peopleByTeam.get(project.team) ?? [];
    // Most of the owning team works on their team's flagship project; occasionally
    // borrow one person from an adjacent team for cross-team texture.
    const staffed = pickN(teamMembers, Math.min(teamMembers.length, 3 + Math.floor(rand() * 3)));
    staffed.forEach((person, idx) => {
      workedOn.push({
        personId: person.id,
        projectId: project.id,
        role: idx === 0 ? "Lead" : chance(0.3) ? "Reviewer" : "Contributor",
        since: randomPastDate(500),
      });
    });

    // Component ownership: staffed people touch 1-2 of their project's components.
    const componentIds = project.components.map((c) => `comp-${slugify(project.id + "-" + c.name)}`);
    for (const person of staffed) {
      const myComponents = pickN(componentIds, 1 + Math.floor(rand() * Math.min(2, componentIds.length)));
      for (const componentId of myComponents) {
        touched.push({
          personId: person.id,
          componentId,
          commits: 3 + Math.floor(rand() * 120),
          lastTouched: randomPastDate(365),
        });
      }
    }
  }

  return { workedOn, touched };
}

export const { workedOn: WORKED_ON, touched: TOUCHED } = buildStaffingAndOwnership();

export function componentIdFor(projectId: string, componentName: string): string {
  return `comp-${slugify(projectId + "-" + componentName)}`;
}

// ---------------------------------------------------------------------------
// Collaboration graph (KNOWS)
// ---------------------------------------------------------------------------

export interface Knows {
  aId: string;
  bId: string;
  strength: number;
}

function buildCollaborationGraph(): Knows[] {
  const edges: Knows[] = [];
  const seen = new Set<string>();

  function addEdge(aId: string, bId: string, strength: number) {
    if (aId === bId) return;
    const key = [aId, bId].sort().join("|");
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ aId, bId, strength: Math.round(strength * 100) / 100 });
  }

  const peopleByTeam = new Map<string, SeedPerson[]>();
  for (const p of PEOPLE) {
    if (!peopleByTeam.has(p.teamId)) peopleByTeam.set(p.teamId, []);
    peopleByTeam.get(p.teamId)!.push(p);
  }

  // Within-team familiarity. A random-recursive-tree first (each member links to
  // one random *earlier* member) guarantees every team is internally connected —
  // relying on chance() alone for this, as an earlier version did, occasionally
  // left a team member isolated. Extra probabilistic edges on top add richness
  // (multiple routes, varying strength) without weakening that guarantee.
  for (const members of peopleByTeam.values()) {
    for (let i = 1; i < members.length; i++) {
      const j = Math.floor(rand() * i);
      addEdge(members[i].id, members[j].id, 0.6 + rand() * 0.4);
    }
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        if (chance(0.5)) addEdge(members[i].id, members[j].id, 0.5 + rand() * 0.5);
      }
    }
  }

  // Cross-team familiarity from shared project staffing.
  const byProject = new Map<string, string[]>();
  for (const w of WORKED_ON) {
    if (!byProject.has(w.projectId)) byProject.set(w.projectId, []);
    byProject.get(w.projectId)!.push(w.personId);
  }
  for (const members of byProject.values()) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        if (chance(0.5)) addEdge(members[i], members[j], 0.3 + rand() * 0.4);
      }
    }
  }

  // Inter-team backbone: every team connects through one shared hub team
  // (star topology, not a chain) so the whole org is a single connected
  // component and any two people are reachable in a small number of hops —
  // a linear chain of 10 teams could put worst-case pairs 9+ hops apart;
  // a star caps cross-team distance at 2. Payments is the hub simply because
  // it's the largest team, not for any narrative reason.
  const hubTeam = "team-payments";
  for (const team of TEAMS) {
    if (team.id === hubTeam) continue;
    const a = pick(peopleByTeam.get(hubTeam) ?? []);
    const b = pick(peopleByTeam.get(team.id) ?? []);
    if (a && b) addEdge(a.id, b.id, 0.3 + rand() * 0.3);
  }
  // A handful of extra direct cross-team links, so paths between non-hub teams
  // aren't *always* routed through the same one or two hub people.
  for (let k = 0; k < 10; k++) {
    const teamA = pick(TEAMS);
    const teamB = pick(TEAMS);
    if (teamA.id === teamB.id) continue;
    const a = pick(peopleByTeam.get(teamA.id) ?? []);
    const b = pick(peopleByTeam.get(teamB.id) ?? []);
    if (a && b) addEdge(a.id, b.id, 0.3 + rand() * 0.3);
  }

  return edges;
}

export const KNOWS = buildCollaborationGraph();
