import { pool } from '../config/db';
import { UserRole } from '../utils/constants';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface IUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export const User = {
  async findByEmail(email: string): Promise<IUser | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) return null;
    return rows[0] as IUser;
  },

  async findById(id: string): Promise<IUser | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    return rows[0] as IUser;
  },

  async create(user: {
    id?: string;
    name: string;
    email: string;
    passwordHash: string; // compatibility with our schema definitions
    role: UserRole;
  }): Promise<IUser> {
    const id = user.id || require('crypto').randomUUID();
    const passwordHash = user.passwordHash;

    await pool.query<ResultSetHeader>(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [id, user.name, user.email, passwordHash, user.role]
    );

    const created = await this.findById(id);
    if (!created) throw new Error('User creation failed');
    return created;
  },
};
