-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'ai');

-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "title" TEXT;
