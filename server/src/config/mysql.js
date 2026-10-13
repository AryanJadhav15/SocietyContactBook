import mysql from "mysql2/promise";
import { env } from "./env.js";

const databaseUrl = new URL(env.DATABASE_URL);

const sslMode = databaseUrl.searchParams.get("ssl-mode");
const sslAccept = databaseUrl.searchParams.get("sslaccept");

databaseUrl.searchParams.delete("ssl-mode");
databaseUrl.searchParams.delete("sslaccept");

const requiresSsl =
    sslMode?.toLowerCase() === "required" ||
    sslAccept?.toLowerCase() === "strict";

const caCertificate = process.env.DB_CA_CERT?.replace(/\\n/g, "\n");

export const sqlPool = mysql.createPool({
    uri: databaseUrl.toString(),
    connectionLimit: 10,
    namedPlaceholders: true,
    ...(requiresSsl
        ? {
              ssl: {
                  rejectUnauthorized: true,
                  ...(caCertificate ? { ca: caCertificate } : {}),
              },
          }
        : {}),
});
