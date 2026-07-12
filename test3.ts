import { drizzle } from "drizzle-orm/d1";
const db = drizzle({} as any);
console.log(Object.keys(db));
