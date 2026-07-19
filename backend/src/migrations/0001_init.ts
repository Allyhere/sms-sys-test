import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init000117558400000000 implements MigrationInterface {
  name = 'Init000117558400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    const directionEnumExists = await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = 'message_direction_enum'`,
    );
    if (!directionEnumExists || directionEnumExists.length === 0) {
      await queryRunner.query(
        `CREATE TYPE "public"."message_direction_enum" AS ENUM('inbound', 'outbound')`,
      );
    }

    const statusEnumExists = await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = 'message_status_enum'`,
    );
    if (!statusEnumExists || statusEnumExists.length === 0) {
      await queryRunner.query(
        `CREATE TYPE "public"."message_status_enum" AS ENUM('received', 'queued', 'processing', 'sent', 'delivered', 'undelivered', 'failed')`,
      );
    }

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "phoneNumber" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_conversations_phoneNumber" UNIQUE ("phoneNumber"),
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL,
        "twilio_message_sid" character varying,
        "direction" "public"."message_direction_enum" NOT NULL,
        "body" text NOT NULL,
        "status" "public"."message_status_enum" NOT NULL DEFAULT 'received',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_messages_twilio_message_sid" UNIQUE ("twilio_message_sid"),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messages_conversation_id" ON "messages" ("conversation_id")`,
    );

    const fkExists = await queryRunner.query(
      `SELECT 1 FROM pg_constraint WHERE conname = 'FK_messages_conversation'`,
    );
    if (!fkExists || fkExists.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "messages"
          ADD CONSTRAINT "FK_messages_conversation"
          FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "messages" DROP CONSTRAINT IF EXISTS "FK_messages_conversation"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_messages_conversation_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."message_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."message_direction_enum"`,
    );
  }
}
