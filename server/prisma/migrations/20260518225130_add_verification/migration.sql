-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verification_code" VARCHAR(6),
ADD COLUMN     "verification_expires" TIMESTAMP(3);
