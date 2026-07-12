import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/d1";

// mock D1 database
const mockD1 = {
  prepare: (query: string) => ({
    bind: (...args: any[]) => ({
      all: async () => ({ results: [] })
    })
  })
};

const db = drizzle(mockD1 as any);

async function test() {
  const result = await db.run(sql`SELECT 1`);
  console.log(result);
}
test().catch(console.error);
