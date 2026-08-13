/**
 * Loads the dataset from scripts/seed-data.ts into CognoDB.
 *
 * Run with `npm run seed` (reads connection details from .env.local — copy
 * .env.example first). Safe to re-run: it wipes and rebuilds the graph each
 * time so the demo data stays in a known state.
 */
import neo4j from "neo4j-driver";
import {
  TEAMS,
  SKILLS,
  RELATED_SKILLS,
  PROJECTS,
  PEOPLE,
  WORKED_ON,
  TOUCHED,
  KNOWS,
  componentIdFor,
} from "./seed-data";

const uri = process.env.COGNODB_URI;
const user = process.env.COGNODB_USERNAME || "cognodb";
const password = process.env.COGNODB_PASSWORD;

if (!uri || !password) {
  console.error(
    "Missing COGNODB_URI or COGNODB_PASSWORD.\n" +
      "Copy .env.example to .env.local and fill in your CognoDB Cloud connection details, then re-run `npm run seed`."
  );
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const COMPONENTS = PROJECTS.flatMap((project) =>
  project.components.map((c) => ({
    id: componentIdFor(project.id, c.name),
    name: c.name,
    path: c.path,
    projectId: project.id,
  }))
);

const REQUIRES_SKILL = PROJECTS.flatMap((project) =>
  project.requiredSkills.map(([skillId, importance]) => ({
    projectId: project.id,
    skillId,
    importance,
  }))
);

const HAS_SKILL = PEOPLE.flatMap((person) =>
  person.skills.map((s) => ({
    personId: person.id,
    skillId: s.skillId,
    level: s.level,
    endorsed: s.endorsed,
  }))
);

async function main() {
  const session = driver.session();
  try {
    console.log("Verifying connectivity to CognoDB...");
    await driver.verifyConnectivity();
    console.log("Connected.\n");

    console.log("Resetting graph (MATCH (n) DETACH DELETE n)...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("Creating uniqueness constraints...");
    for (const [label, prop] of [
      ["Person", "id"],
      ["Team", "id"],
      ["Skill", "id"],
      ["Project", "id"],
      ["Component", "id"],
    ]) {
      await session.run(
        `CREATE CONSTRAINT IF NOT EXISTS FOR (n:${label}) REQUIRE n.${prop} IS UNIQUE`
      );
    }

    console.log("Loading nodes...");
    await session.run(
      `UNWIND $rows AS row CREATE (t:Team {id: row.id, name: row.name, department: row.department})`,
      { rows: TEAMS }
    );
    await session.run(
      `UNWIND $rows AS row CREATE (s:Skill {id: row.id, name: row.name, category: row.category})`,
      { rows: SKILLS }
    );
    await session.run(
      `UNWIND $rows AS row CREATE (pr:Project {id: row.id, name: row.name, description: row.description, status: row.status})`,
      { rows: PROJECTS.map(({ id, name, description, status }) => ({ id, name, description, status })) }
    );
    await session.run(
      `UNWIND $rows AS row CREATE (c:Component {id: row.id, name: row.name, path: row.path})`,
      { rows: COMPONENTS }
    );
    await session.run(
      `UNWIND $rows AS row
       CREATE (p:Person {id: row.id, name: row.name, title: row.title, bio: row.bio, avatarColor: row.avatarColor})`,
      { rows: PEOPLE.map(({ id, name, title, bio, avatarColor }) => ({ id, name, title, bio, avatarColor })) }
    );

    console.log("Loading relationships...");
    await session.run(
      `UNWIND $rows AS row
       MATCH (p:Person {id: row.personId}), (t:Team {id: row.teamId})
       CREATE (p)-[:MEMBER_OF]->(t)`,
      { rows: PEOPLE.map((p) => ({ personId: p.id, teamId: p.teamId })) }
    );
    await session.run(
      `UNWIND $rows AS row
       MATCH (p:Person {id: row.personId}), (s:Skill {id: row.skillId})
       CREATE (p)-[:HAS_SKILL {level: row.level, endorsed: row.endorsed}]->(s)`,
      { rows: HAS_SKILL }
    );
    await session.run(
      `UNWIND $rows AS row
       MATCH (a:Skill {id: row[0]}), (b:Skill {id: row[1]})
       CREATE (a)-[:RELATED_TO {strength: row[2]}]->(b)`,
      { rows: RELATED_SKILLS }
    );
    await session.run(
      `UNWIND $rows AS row
       MATCH (pr:Project {id: row.projectId}), (s:Skill {id: row.skillId})
       CREATE (pr)-[:REQUIRES_SKILL {importance: row.importance}]->(s)`,
      { rows: REQUIRES_SKILL }
    );
    await session.run(
      `UNWIND $rows AS row
       MATCH (c:Component {id: row.id}), (pr:Project {id: row.projectId})
       CREATE (c)-[:PART_OF]->(pr)`,
      { rows: COMPONENTS }
    );
    await session.run(
      `UNWIND $rows AS row
       MATCH (p:Person {id: row.personId}), (pr:Project {id: row.projectId})
       CREATE (p)-[:WORKED_ON {role: row.role, since: row.since}]->(pr)`,
      { rows: WORKED_ON }
    );
    await session.run(
      `UNWIND $rows AS row
       MATCH (p:Person {id: row.personId}), (c:Component {id: row.componentId})
       CREATE (p)-[:TOUCHED {commits: row.commits, lastTouched: row.lastTouched}]->(c)`,
      { rows: TOUCHED }
    );
    await session.run(
      `UNWIND $rows AS row
       MATCH (a:Person {id: row.aId}), (b:Person {id: row.bId})
       CREATE (a)-[:KNOWS {strength: row.strength}]->(b)`,
      { rows: KNOWS }
    );

    const [{ counts }] = (
      await session.run(`
        CALL { MATCH (n) RETURN count(n) AS nodes }
        CALL { MATCH ()-[r]->() RETURN count(r) AS rels }
        RETURN {nodes: nodes, relationships: rels} AS counts
      `)
    ).records.map((r) => r.toObject() as { counts: { nodes: number; relationships: number } });

    console.log(
      `\nDone. Loaded ${PEOPLE.length} people, ${TEAMS.length} teams, ${SKILLS.length} skills, ` +
        `${PROJECTS.length} projects, ${COMPONENTS.length} components.`
    );
    console.log(`Graph totals: ${counts.nodes} nodes, ${counts.relationships} relationships.`);
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message ?? err);
  process.exit(1);
});
