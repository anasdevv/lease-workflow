-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "lastCompletedStep" TEXT,
ADD COLUMN     "workflowErrorDetails" JSONB;

-- CreateIndex
CREATE INDEX "Application_workflowStatus_idx" ON "Application"("workflowStatus");
