import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),
});

export async function POST(req: Request) {
    const tableName = process.env.TABLE_NAME || 'receptions';
    const { id, check } = await req.json();
    if (typeof id !== 'number' || typeof check !== 'boolean') {
        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    try {
        await pool.query(
            `UPDATE ${tableName} SET checker = $1 WHERE id = $2`,
            [check, id]
        );
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
}