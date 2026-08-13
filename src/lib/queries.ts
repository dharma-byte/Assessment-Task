import "server-only";
import { runQuery } from "./db";
import type {
  ComponentSummary,
  ExpertMatch,
  MatchReason,
  PersonSummary,
  ProjectStatus,
  ProjectSummary,
  SkillCategory,
  TeamSummary,
} from "./types";

/**
 * Every function here issues exactly one parameterized Cypher statement (no
 * string concatenation — values always travel as $params) and returns
 * plain, UI-ready shapes. Pages and route handlers never write Cypher
 * themselves; they call these.
 */

// ---------------------------------------------------------------------------
// Overview / browse
// ---------------------------------------------------------------------------

export interface OverviewStats {
  people: number;
  teams: number;
  skills: number;
  projects: number;
  skillGaps: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const [row] = await runQuery<{
    people: number;
    teams: number;
    skills: number;
    projects: number;
    skillGaps: number;
  }>(`
    CALL { MATCH (p:Person) RETURN count(p) AS people }
    CALL { MATCH (t:Team) RETURN count(t) AS teams }
    CALL { MATCH (s:Skill) RETURN count(s) AS skills }
    CALL { MATCH (pr:Project) RETURN count(pr) AS projects }
    CALL {
      MATCH (pr:Project)-[:REQUIRES_SKILL]->(reqSkill:Skill)
      WHERE NOT EXISTS {
        MATCH (pr)<-[:WORKED_ON]-(:Person)-[:HAS_SKILL]->(reqSkill)
      }
      RETURN count(DISTINCT reqSkill) AS skillGaps
    }
    RETURN people, teams, skills, projects, skillGaps
  `);
  return row;
}

export async function listPeople(): Promise<PersonSummary[]> {
  return runQuery<PersonSummary>(`
    MATCH (p:Person)
    OPTIONAL MATCH (p)-[:MEMBER_OF]->(t:Team)
    RETURN p.id AS id, p.name AS name, p.title AS title, p.avatarColor AS avatarColor,
           t.id AS teamId, t.name AS teamName
    ORDER BY p.name
  `);
}

export async function listProjects(): Promise<ProjectSummary[]> {
  return runQuery<ProjectSummary>(`
    MATCH (pr:Project)
    RETURN pr.id AS id, pr.name AS name, pr.description AS description, pr.status AS status
    ORDER BY pr.name
  `);
}

export async function listSkills(term?: string): Promise<
  { id: string; name: string; category: SkillCategory }[]
> {
  return runQuery(
    `
    MATCH (s:Skill)
    WHERE $term IS NULL OR toLower(s.name) CONTAINS toLower($term)
    RETURN s.id AS id, s.name AS name, s.category AS category
    ORDER BY s.name
  `,
    { term: term ?? null }
  );
}

// ---------------------------------------------------------------------------
// Expert search — direct match, skill-adjacency traversal, and network-aware search
// ---------------------------------------------------------------------------

interface DirectMatchRow {
  id: string;
  name: string;
  title: string;
  avatarColor: string;
  teamId: string | null;
  teamName: string | null;
  level: number;
  endorsed: boolean;
}

/** Direct HAS_SKILL match, one hop. The baseline a relational join handles fine. */
async function getDirectSkillMatches(
  skillId: string,
  minLevel: number
): Promise<DirectMatchRow[]> {
  return runQuery<DirectMatchRow>(
    `
    MATCH (p:Person)-[hs:HAS_SKILL]->(:Skill {id: $skillId})
    WHERE hs.level >= $minLevel
    OPTIONAL MATCH (p)-[:MEMBER_OF]->(t:Team)
    RETURN p.id AS id, p.name AS name, p.title AS title, p.avatarColor AS avatarColor,
           t.id AS teamId, t.name AS teamName, hs.level AS level, hs.endorsed AS endorsed
    `,
    { skillId, minLevel }
  );
}

interface RelatedMatchRow extends DirectMatchRow {
  viaSkillName: string;
  pathStrength: number;
  hops: number;
}

/**
 * The "a relational database would find this awkward" query: walks the
 * Skill graph outward from the requested skill (up to 2 RELATED_TO hops),
 * multiplies relationship strengths along the way to get a decaying
 * path-strength score, and finds people who hold any skill on that
 * frontier. In SQL this needs a recursive CTE just to enumerate the
 * skill neighborhood, plus a running-product aggregate carried through
 * the recursion — Cypher expresses it as one variable-length pattern.
 */
async function getRelatedSkillMatches(
  skillId: string,
  minLevel: number
): Promise<RelatedMatchRow[]> {
  return runQuery<RelatedMatchRow>(
    `
    MATCH (target:Skill {id: $skillId})
    MATCH (target)-[rels:RELATED_TO*1..2]-(related:Skill)
    WHERE related <> target
    MATCH (p:Person)-[hs:HAS_SKILL]->(related)
    WHERE hs.level >= $minLevel
    WITH p, hs, related, rels,
         reduce(strength = 1.0, r IN rels | strength * r.strength) AS pathStrength
    WHERE pathStrength >= 0.25
    WITH p, hs, related, pathStrength, size(rels) AS hops
    ORDER BY pathStrength DESC
    WITH p, hs, head(collect({ name: related.name, pathStrength: pathStrength, hops: hops })) AS best
    OPTIONAL MATCH (p)-[:MEMBER_OF]->(t:Team)
    RETURN p.id AS id, p.name AS name, p.title AS title, p.avatarColor AS avatarColor,
           t.id AS teamId, t.name AS teamName, hs.level AS level, hs.endorsed AS endorsed,
           best.name AS viaSkillName, best.pathStrength AS pathStrength, best.hops AS hops
    `,
    { skillId, minLevel }
  );
}

interface NetworkMatchRow {
  id: string;
  name: string;
  hops: number;
}

/**
 * The required 2+ hop traversal: everyone reachable from `personId` within
 * two KNOWS hops who also holds the requested skill. Powers the "people
 * connected to me" boost in the expert finder.
 */
async function getNetworkSkillMatches(
  personId: string,
  skillId: string,
  minLevel: number
): Promise<NetworkMatchRow[]> {
  return runQuery<NetworkMatchRow>(
    `
    MATCH (me:Person {id: $personId})
    MATCH knowsPath = (me)-[:KNOWS*1..2]-(candidate:Person)
    WHERE candidate <> me
    MATCH (candidate)-[hs:HAS_SKILL]->(:Skill {id: $skillId})
    WHERE hs.level >= $minLevel
    RETURN candidate.id AS id, candidate.name AS name, min(length(knowsPath)) AS hops
    `,
    { personId, skillId, minLevel }
  );
}

export interface ExpertSearchParams {
  skillId: string;
  minLevel?: number;
  networkFromPersonId?: string;
}

/**
 * Combines the three retrieval queries above into one ranked, explained
 * result set. Merging and scoring happen here in the app layer rather than
 * in one mega-query, so each Cypher statement stays independently readable
 * and testable.
 */
export async function findExperts({
  skillId,
  minLevel = 1,
  networkFromPersonId,
}: ExpertSearchParams): Promise<ExpertMatch[]> {
  const [direct, related, network] = await Promise.all([
    getDirectSkillMatches(skillId, minLevel),
    getRelatedSkillMatches(skillId, minLevel),
    networkFromPersonId
      ? getNetworkSkillMatches(networkFromPersonId, skillId, minLevel)
      : Promise.resolve([]),
  ]);

  const networkHops = new Map(network.map((n) => [n.id, n.hops]));
  const byId = new Map<string, ExpertMatch>();

  for (const row of direct) {
    byId.set(row.id, {
      person: {
        id: row.id,
        name: row.name,
        title: row.title,
        avatarColor: row.avatarColor,
        teamId: row.teamId,
        teamName: row.teamName,
      },
      score: row.level / 5 + (row.endorsed ? 0.15 : 0),
      reasons: [
        {
          kind: "direct",
          label: row.endorsed
            ? `Endorsed skill, level ${row.level}/5`
            : `Direct skill match, level ${row.level}/5`,
        },
      ],
    });
  }

  for (const row of related) {
    const score = (row.level / 5) * row.pathStrength * (row.hops === 1 ? 1 : 0.6);
    const existing = byId.get(row.id);
    const reason: MatchReason = {
      kind: "related-skill",
      label: `Related via ${row.viaSkillName} (${Math.round(row.pathStrength * 100)}% strength, ${row.hops} hop${row.hops > 1 ? "s" : ""})`,
    };
    if (existing) {
      existing.score = Math.max(existing.score, score);
      existing.reasons.push(reason);
    } else {
      byId.set(row.id, {
        person: {
          id: row.id,
          name: row.name,
          title: row.title,
          avatarColor: row.avatarColor,
          teamId: row.teamId,
          teamName: row.teamName,
        },
        score,
        reasons: [reason],
      });
    }
  }

  for (const [id, hops] of networkHops) {
    const existing = byId.get(id);
    const reason: MatchReason = {
      kind: "network",
      label: `${hops} hop${hops > 1 ? "s" : ""} from you in the collaboration network`,
    };
    if (existing) {
      existing.score += 0.2 / hops;
      existing.reasons.push(reason);
    }
    // If someone only qualifies via network but wasn't in direct/related results,
    // they didn't meet the skill/level filter at all — skip them.
  }

  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, 20);
}

// ---------------------------------------------------------------------------
// Person detail
// ---------------------------------------------------------------------------

export interface PersonDetail {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarColor: string;
  team: TeamSummary | null;
  skills: { id: string; name: string; category: SkillCategory; level: number; endorsed: boolean }[];
  projects: { id: string; name: string; status: ProjectStatus; role: string }[];
  collaborators: { id: string; name: string; title: string; teamName: string | null }[];
}

export async function getPersonDetail(id: string): Promise<PersonDetail | null> {
  const [row] = await runQuery<PersonDetail>(
    `
    MATCH (p:Person {id: $id})
    OPTIONAL MATCH (p)-[:MEMBER_OF]->(team:Team)
    CALL {
      WITH p
      MATCH (p)-[hs:HAS_SKILL]->(skill:Skill)
      RETURN collect({id: skill.id, name: skill.name, category: skill.category, level: hs.level, endorsed: hs.endorsed}) AS skills
    }
    CALL {
      WITH p
      MATCH (p)-[w:WORKED_ON]->(proj:Project)
      RETURN collect({id: proj.id, name: proj.name, status: proj.status, role: w.role}) AS projects
    }
    CALL {
      WITH p
      MATCH (p)-[:KNOWS]-(collab:Person)
      OPTIONAL MATCH (collab)-[:MEMBER_OF]->(ct:Team)
      RETURN collect({id: collab.id, name: collab.name, title: collab.title, teamName: ct.name}) AS collaborators
    }
    RETURN p.id AS id, p.name AS name, p.title AS title, p.bio AS bio, p.avatarColor AS avatarColor,
           CASE WHEN team IS NULL THEN NULL ELSE {id: team.id, name: team.name, department: team.department} END AS team,
           skills, projects, collaborators
    `,
    { id }
  );
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Project detail
// ---------------------------------------------------------------------------

export interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  requiredSkills: { id: string; name: string; importance: number; coveredBy: string[] }[];
  team: { id: string; name: string; title: string; role: string }[];
  components: ComponentSummary[];
}

interface ProjectDetailRow {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  requiredSkillsRaw: { id: string; name: string; importance: number }[];
  team: { id: string; name: string; title: string; role: string }[];
  components: ComponentSummary[];
}

export async function getProjectDetail(id: string): Promise<ProjectDetail | null> {
  const [row] = await runQuery<ProjectDetailRow>(
    `
    MATCH (proj:Project {id: $id})
    CALL {
      WITH proj
      MATCH (proj)-[req:REQUIRES_SKILL]->(skill:Skill)
      RETURN collect({id: skill.id, name: skill.name, importance: req.importance}) AS requiredSkillsRaw
    }
    CALL {
      WITH proj
      MATCH (proj)<-[w:WORKED_ON]-(person:Person)
      RETURN collect({id: person.id, name: person.name, title: person.title, role: w.role}) AS team
    }
    CALL {
      WITH proj
      MATCH (proj)<-[:PART_OF]-(c:Component)
      RETURN collect({id: c.id, name: c.name, path: c.path}) AS components
    }
    RETURN proj.id AS id, proj.name AS name, proj.description AS description, proj.status AS status,
           requiredSkillsRaw AS requiredSkillsRaw, team, components
    `,
    { id }
  );
  if (!row) return null;

  // coveredBy is computed as a second pass (simple JS map/filter) rather than
  // inside the Cypher above, where the OPTIONAL MATCH would otherwise force
  // an awkward nested collect — clearer to finish in application code.
  const coverage = await runQuery<{ skillId: string; coveredBy: string[] }>(
    `
    MATCH (proj:Project {id: $id})-[:REQUIRES_SKILL]->(skill:Skill)
    OPTIONAL MATCH (proj)<-[:WORKED_ON]-(member:Person)-[:HAS_SKILL]->(skill)
    RETURN skill.id AS skillId, collect(DISTINCT member.name) AS coveredBy
    `,
    { id }
  );
  const coverageBySkill = new Map(coverage.map((c) => [c.skillId, c.coveredBy]));

  const { requiredSkillsRaw, ...rest } = row;
  return {
    ...rest,
    requiredSkills: requiredSkillsRaw.map((s) => ({
      ...s,
      coveredBy: coverageBySkill.get(s.id) ?? [],
    })),
  };
}

/** People who've recently touched this project's code, ranked as reviewer/owner candidates. */
export interface ReviewerSuggestion {
  id: string;
  name: string;
  title: string;
  avatarColor: string;
  teamName: string | null;
  totalCommits: number;
  lastTouched: string;
  components: string[];
}

export async function getSuggestedReviewers(projectId: string): Promise<ReviewerSuggestion[]> {
  return runQuery<ReviewerSuggestion>(
    `
    MATCH (proj:Project {id: $projectId})<-[:PART_OF]-(c:Component)<-[t:TOUCHED]-(p:Person)
    WITH p, sum(t.commits) AS totalCommits, max(t.lastTouched) AS lastTouched, collect(DISTINCT c.name) AS components
    OPTIONAL MATCH (p)-[:MEMBER_OF]->(team:Team)
    RETURN p.id AS id, p.name AS name, p.title AS title, p.avatarColor AS avatarColor, team.name AS teamName,
           totalCommits, lastTouched, components
    ORDER BY totalCommits DESC
    LIMIT 8
    `,
    { projectId }
  );
}

// ---------------------------------------------------------------------------
// Path finder — shortest path between two people in the collaboration graph
// ---------------------------------------------------------------------------

export interface PathResult {
  people: { id: string; name: string; title: string }[];
  hops: number;
}

export async function findShortestPath(
  fromId: string,
  toId: string
): Promise<PathResult | null> {
  const [row] = await runQuery<PathResult>(
    `
    MATCH (a:Person {id: $fromId}), (b:Person {id: $toId})
    MATCH path = shortestPath((a)-[:KNOWS*..6]-(b))
    RETURN [n IN nodes(path) | {id: n.id, name: n.name, title: n.title}] AS people,
           length(path) AS hops
    `,
    { fromId, toId }
  );
  return row ?? null;
}
