import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the two columns that back the refresh-token rotation + reuse-detection
 * scheme on the `users` table:
 *
 *   - refreshTokenHash    varchar(64) NULL   — HMAC-SHA256 hex digest of the
 *                                              currently-valid refresh token,
 *                                              or NULL after logout / reuse
 *                                              detection.
 *   - refreshTokenVersion integer NOT NULL 0 — monotonically increments on
 *                                              every rotation; embedded in
 *                                              the refresh-token JWT so an
 *                                              older-version token presented
 *                                              after rotation is treated as
 *                                              reuse.
 *
 * The length pin on `refreshTokenHash` (64) matches the hex digest width and
 * guards against silent truncation under drivers that enforce a MySQL-style
 * strict mode. Both columns are safe to add online: the hash is nullable and
 * the version has a default, so existing rows backfill without writes.
 */
export class AddRefreshTokenColumns1776038400000 implements MigrationInterface {
  name = 'AddRefreshTokenColumns1776038400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "refreshTokenHash" character varying(64) DEFAULT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "refreshTokenVersion" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "refreshTokenVersion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "refreshTokenHash"`,
    );
  }
}
