-- CreateIndex
CREATE INDEX "Application_applicantName_idx" ON "Application"("applicantName");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_fraudScore_idx" ON "Application"("fraudScore");

-- CreateIndex
CREATE INDEX "Listing_address_idx" ON "Listing"("address");
