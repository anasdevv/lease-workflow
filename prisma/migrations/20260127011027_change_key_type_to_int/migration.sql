/*
  Warnings:

  - The primary key for the `ApplicationDocument` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ApplicationDocument` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Document` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Document` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `HumanReviewDecision` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `HumanReviewDecision` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `documentId` on the `ApplicationDocument` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "ApplicationDocument" DROP CONSTRAINT "ApplicationDocument_documentId_fkey";

-- AlterTable
ALTER TABLE "ApplicationDocument" DROP CONSTRAINT "ApplicationDocument_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "documentId",
ADD COLUMN     "documentId" INTEGER NOT NULL,
ADD CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Document" DROP CONSTRAINT "Document_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Document_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "HumanReviewDecision" DROP CONSTRAINT "HumanReviewDecision_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "HumanReviewDecision_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationDocument_applicationId_documentId_key" ON "ApplicationDocument"("applicationId", "documentId");

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
