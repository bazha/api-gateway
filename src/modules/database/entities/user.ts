import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  // HMAC-SHA256 hex digest = 64 chars. Pin the length so a future driver
  // switch (or MySQL strict mode) doesn't silently truncate stored hashes.
  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  @Exclude()
  refreshTokenHash: string | null;

  // Incremented on every refresh-token rotation. The version is embedded in
  // the refresh-token JWT; presenting an older-version token after rotation
  // indicates reuse and triggers family revocation.
  @Column({ type: 'integer', default: 0 })
  @Exclude()
  refreshTokenVersion: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
