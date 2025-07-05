import { Pool } from 'pg';
import { config } from 'dotenv';

// .env ファイルの読み込み
config();

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),
});

export default pool; 