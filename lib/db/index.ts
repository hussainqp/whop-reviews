import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";


const DATABASE_URL = process.env.POSTGRES_URL ?? "";

const db = drizzle(DATABASE_URL, { schema });

export default db;