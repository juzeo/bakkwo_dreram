import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.TIDB_HOST || 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com',
  port: Number(process.env.TIDB_PORT) || 4000,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE || 'bakkwodream',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;