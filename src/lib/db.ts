import "server-only";
import neo4j, { type Driver } from "neo4j-driver";

/**
 * Single shared driver instance, created lazily on first use.
 *
 * Reads connection details from environment variables only — never commit
 * real values. See .env.example for the variables this expects.
 */
let driver: Driver | undefined;

/** Thrown when required env vars are missing or malformed. Recoverable by the operator, not the user. */
export class DatabaseConfigError extends Error {
  constructor(message: string) {
    // Prefixed so client-side error boundaries (which only see error.message,
    // not the class) can still tell config errors apart from connectivity errors.
    super(`CONFIG_ERROR: ${message}`);
    this.name = "DatabaseConfigError";
  }
}

/** Thrown when the driver can't be built or a query fails to reach CognoDB. */
export class DatabaseUnavailableError extends Error {
  constructor(cause: unknown) {
    super(
      `DB_UNAVAILABLE: Could not reach the database. It may be waking up, unreachable, or misconfigured.`
    );
    this.name = "DatabaseUnavailableError";
    this.cause = cause;
  }
}

function getDriver(): Driver {
  if (driver) return driver;

  const uri = process.env.COGNODB_URI;
  const user = process.env.COGNODB_USERNAME || "cognodb";
  const password = process.env.COGNODB_PASSWORD;

  if (!uri || !password) {
    throw new DatabaseConfigError(
      "Missing COGNODB_URI or COGNODB_PASSWORD. Copy .env.example to .env.local and fill in your CognoDB Cloud connection details."
    );
  }

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    // Free-tier CognoDB instances cap at 200 connections total — stay well under that.
    maxConnectionPoolSize: 20,
  });
  return driver;
}

/**
 * Runs a single parameterized Cypher statement and returns plain JS objects.
 * All query functions in src/lib/queries.ts go through this — it's the only
 * place that touches the driver, so connection handling and error translation
 * live in exactly one spot.
 */
export async function runQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  let session;
  try {
    session = getDriver().session();
  } catch (err) {
    if (err instanceof DatabaseConfigError) throw err;
    throw new DatabaseUnavailableError(err);
  }

  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => record.toObject() as T);
  } catch (err) {
    throw new DatabaseUnavailableError(err);
  } finally {
    await session.close();
  }
}

/** Used by the health-check API route and the home page's connectivity banner. */
export async function checkHealth(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  try {
    await getDriver().verifyConnectivity();
    return { ok: true };
  } catch (err) {
    if (err instanceof DatabaseConfigError) {
      return { ok: false, message: err.message.replace("CONFIG_ERROR: ", "") };
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Unknown connection error",
    };
  }
}
