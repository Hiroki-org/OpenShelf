import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

// mock D1 database
const mockD1 = {
  prepare: (query: string) => ({
    bind: (...args: any[]) => ({
      all: async () => ({ results: [{ a: 1 }] })
    })
  })
};

const db = drizzle(mockD1 as any);

async function test() {
  const result = await db.all(sql`SELECT 1`);
  console.log(result);
}
test().catch(console.error);
