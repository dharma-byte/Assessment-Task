/**
 * Shared domain types for the graph, mirroring the node labels and relationship
 * properties defined in the data model (see README "Data model" section and
 * scripts/seed-data.ts for the source of truth).
 */

export type SkillCategory = "language" | "framework" | "domain" | "tool";
export type ProjectStatus = "active" | "maintenance" | "planned";

export interface TeamSummary {
  id: string;
  name: string;
  department: string;
}

export interface PersonSummary {
  id: string;
  name: string;
  title: string;
  avatarColor: string;
  teamId: string | null;
  teamName: string | null;
}

export interface SkillSummary {
  id: string;
  name: string;
  category: SkillCategory;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
}

export interface ComponentSummary {
  id: string;
  name: string;
  path: string;
}

/** One reason an expert-search result was surfaced — shown verbatim in the UI. */
export interface MatchReason {
  kind: "direct" | "related-skill" | "network";
  label: string;
}

export interface ExpertMatch {
  person: PersonSummary;
  score: number;
  reasons: MatchReason[];
}
