import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

// Configuração de Fallback para ambiente de desenvolvimento sem Cloud SQL
// Em produção, as variáveis SQL_* são injetadas automaticamente pelo AIS
const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.SQL_HOST || 'localhost',
      user: process.env.SQL_USER || 'postgres',
      password: process.env.SQL_PASSWORD || 'postgres',
      database: process.env.SQL_DB_NAME || 'audit_db',
      port: parseInt(process.env.SQL_PORT || '5432'),
    });

export const db = drizzle(pool, { schema });
