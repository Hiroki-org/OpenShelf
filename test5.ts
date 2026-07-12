import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

const mockD1 = {
  prepare: (query: string) => {
    console.log("query:", query);
    return {
      bind: (...args: any[]) => {
        console.log("args:", args);
        return {
          all: async () => ({ results: [{ tag: "AI" }] })
        };
      }
    };
  }
};
const db = drizzle(mockD1 as any);

const TRIMMED_TAG_SQL = "TRIM(json_each.value)";
const userId = "u1";
const orgId = "o1";
const normalizedQuery = "test";

async function run() {
  const result = await db.all(sql`
    SELECT ${sql.raw(TRIMMED_TAG_SQL)} as tag
    FROM table
    WHERE user_id = ${userId}
      AND ${sql.raw(TRIMMED_TAG_SQL)} LIKE ${normalizedQuery} || % ESCAPE \ COLLATE NOCASE
  `);
  console.log("result:", result);
}
run();
