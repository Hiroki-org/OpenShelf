import { drizzle } from "drizzle-orm/d1";
import { sql } from "drizzle-orm";
const mockD1 = {
  prepare: (query: string) => ({
    bind: (...args: any[]) => ({
      all: async () => ({ results: [{ a: 1 }] })
    })
  })
};
const db = drizzle(mockD1 as any);
async function run() {
  console.log(typeof db.all);
  console.log(await db.all(sql`SELECT 1`));
}
run();
