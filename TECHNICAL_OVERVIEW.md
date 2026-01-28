# Lease Workflow - Technical Overview

**Project Date:** January 29, 2026  
**Repository:** lease-workflow (GitHub)  
**Technology Stack:** Next.js 16, TypeScript, Prisma ORM, PostgreSQL, Vercel Workflow, React Query

---

## 1. Setup Instructions

### 1.1 Installation & Dependencies

**Prerequisites:**
- Node.js 18+ (recommended: LTS)
- pnpm (package manager)
- PostgreSQL database (local or cloud-hosted)
- Vercel account (for Workflow and Blob Storage)

**Installation Steps:**

```bash
# Clone repository
git clone <repo-url>
cd lease-workflow

# Install dependencies
pnpm install

# Generate Prisma client
pnpm exec prisma generate

# Apply database migrations
pnpm exec prisma migrate dev
```

### 1.2 Environment Configuration

Create `.env.local` in the project root with the following variables:

```env
# Database Connection (Prisma)
# Format: postgresql://user:password@host:port/database
# Supports Prisma Accelerate: prisma+postgres://accelerate.prisma-data.net/?api_key=...
DATABASE_URL="your-database-connection-string-here"

# File Storage (Vercel Blob)
# Token with read/write permissions for document uploads
BLOB_READ_WRITE_TOKEN="your-blob-storage-token-here"

# Workflow Authentication
# Minimum 32 characters, used to authenticate internal API requests
# This token is shared between workflow steps and internal API routes
WORKFLOW_INTERNAL_TOKEN="your-secure-internal-token-here-min-32-chars"

# Application URL (used in workflow steps for API calls)
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Development
# NEXT_PUBLIC_APP_URL="https://your-domain.com"  # Production
```

**Secure Token Generation:**
```bash
# macOS/Linux
openssl rand -base64 24

# Alternative (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.3 Database Setup

**Initial Setup:**

```bash
# Run migrations (creates all tables)
pnpm exec prisma migrate dev --name init

# Seed development data (optional)
pnpm exec prisma db seed
```

**Check Database Status:**
```bash
# Open Prisma Studio (visual database explorer)
pnpm exec prisma studio
```

**Schema Location:** `prisma/schema.prisma`

### 1.4 Running the Project

**Development:**
```bash
# Start Next.js dev server (with hot reload)
pnpm run dev

# Accessible at: http://localhost:3000
# API routes at: http://localhost:3000/api/*
```

**Production Build:**
```bash
# Build the application
pnpm run build

# Start production server
pnpm run start
```

**Linting:**
```bash
# Run ESLint
pnpm run lint
```

### 1.5 Production Deployment

**Recommended Platform:** Vercel (seamless Next.js + Workflow integration)

**Deployment Steps:**

1. **Connect Repository:**
   - Push to GitHub
   - Connect repository to Vercel

2. **Configure Environment Variables:**
   - Set all `.env.local` variables in Vercel project settings
   - Ensure `WORKFLOW_INTERNAL_TOKEN` is secure (minimum 32 characters)

3. **Deploy:**
   - Vercel automatically triggers builds on push to main
   - Database migrations should be run before deployment

4. **Post-Deployment:**
   - Verify database connectivity: `NEXT_PUBLIC_APP_URL`
   - Test API endpoints: `/api/health` or `/api/applications`
   - Monitor Vercel logs for errors

---

## 2. Architecture Overview

### 2.1 High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                         │
│                   - Application Dashboard                        │
│              - Application Form with Document Upload             │
│                    - Human Review Interface                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js API Routes (Backend)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Public Routes (/api/*)                                 │   │
│  │  - POST /applications - Create new application          │   │
│  │  - GET /applications - Search & list applications       │   │
│  │  - GET /applications/[id] - Get application details     │   │
│  │  - POST /applications/[id]/decision - Submit human      │   │
│  │    review decision and resume workflow                  │   │
│  │  - POST /upload - Handle document uploads to blob       │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Internal Routes (/api/internal/*)                      │   │
│  │  - Protected by WORKFLOW_INTERNAL_TOKEN                 │   │
│  │  - Used exclusively by workflow steps                   │   │
│  │  - PATCH /applications/[id] - Update application state  │   │
│  │  - PATCH /documents/[id] - Update document metadata     │   │
│  │  - POST/PATCH /applications/[id]/review-decision        │   │
│  │  - GET /documents - Fetch application documents         │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            Vercel Workflow Orchestration Engine                  │
│         (Persistent, resumable, fault-tolerant)                  │
│                                                                   │
│  processApplicationWorkflow()                                     │
│  ├─ Step 1: Extract Documents (AI analysis in parallel)         │
│  ├─ Step 2: Fraud Detection (cross-validation signals)          │
│  ├─ Step 3: Route Decision (manual review or auto-approve)      │
│  ├─ Step 4: Human Review (awaits hook event, resumable)         │
│  ├─ Step 5: Background Check (3rd party verification)           │
│  └─ Step 6: Finalize Application (approval/rejection)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
    ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐
    │   Database  │  │ Blob Storage │  │   AI Services   │
    │ PostgreSQL  │  │ Vercel Blob  │  │  (Placeholder)  │
    └─────────────┘  └──────────────┘  └─────────────────┘
         │                                      │
    5 Core Tables:                     Simulated AI extraction:
    - Listing                          - Pay stub parsing
    - Application                      - Tax return extraction
    - ApplicationDocument              - ID verification
    - Document                         - Confidence scoring
    - HumanReviewDecision             (Ready for real LLM)
```

### 2.2 Core Data Models

**Listing** - Rental property listings
```typescript
{
  id: Int (PK)
  address: String
  createdAt: DateTime
  updatedAt: DateTime
  applications: Application[] (relation)
}
```

**Application** - Rental application submission
```typescript
{
  id: Int (PK)
  applicantName: String
  applicantEmail: String
  listingId: Int (FK)
  status: String ("draft" | "submitted" | "processing" | "approved" | "rejected")
  workflowRunId: String? (Vercel Workflow run ID)
  workflowStatus: String? ("idle" | "running" | "paused_for_review" | "completed")
  lastCompletedStep: String? (Step ID from WORKFLOW_STEPS)
  fraudScore: Float? (0-100)
  fraudSignals: Json? (Array of fraud detection signals)
  workflowErrorDetails: Json?
  createdAt: DateTime
  updatedAt: DateTime
  
  documents: ApplicationDocument[] (relation)
  reviewDecisions: HumanReviewDecision[] (relation)
  listing: Listing (relation)
}
```

**ApplicationDocument** - Link between Application and Document with extraction metadata
```typescript
{
  id: Int (PK)
  applicationId: Int (FK)
  documentId: Int (FK)
  documentType: String ("pay_stub" | "tax_return" | "id_verification")
  verificationStatus: String ("pending" | "extracted" | "verified" | "failed")
  aiExtractedData: Json? (Structured data from AI extraction)
  confidenceScore: Float? (0-1 range, extraction quality)
  workflowStepId: String? (Which step processed this document)
  
  application: Application (relation)
  document: Document (relation)
}
```

**Document** - Uploaded document file metadata
```typescript
{
  id: Int (PK)
  blobUrl: String (Vercel Blob storage URL)
  filename: String
  fileSize: Int (bytes)
  mimeType: String ("application/pdf" | "image/jpeg" | "image/png")
  uploadedAt: DateTime
  status: String ("uploaded" | "processing" | "verified")
  
  applicationDocuments: ApplicationDocument[] (relation)
}
```

**HumanReviewDecision** - Tracks manual approvals/rejections
```typescript
{
  id: Int (PK)
  applicationId: Int (FK)
  workflowRunId: String (Vercel Workflow ID)
  decision: String? ("approved" | "rejected")
  reason: String? (Reviewer's comment)
  fraudContext: Json? (Fraud signals shown to reviewer)
  status: String ("pending" | "completed")
  reviewedAt: DateTime?
  createdAt: DateTime
  
  application: Application (relation)
}
```

### 2.3 Data Flow

```
1. APPLICATION CREATION
   ┌─────────────────────────────────────────────────────┐
   │ User submits form with applicant info + documents   │
   └──────────────────┬──────────────────────────────────┘
                      │
                      ▼
   ┌──────────────────────────────────────────────────┐
   │ Documents uploaded to Vercel Blob Storage        │
   │ (supports PDF, JPEG, PNG, max 10MB each)        │
   └──────────────────┬───────────────────────────────┘
                      │
                      ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ Server Action: createApplication()                           │
   │ - Creates Application record (status: "submitted")           │
   │ - Creates Document records (from uploaded files)             │
   │ - Creates ApplicationDocument links (status: "pending")      │
   │ - Triggers processApplicationWorkflow via Vercel Workflow    │
   │   using start() API                                          │
   └──────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────┐
        │ Workflow queued for execution    │
        │ Application ready for processing │
        └─────────────────────────────────┘


2. WORKFLOW EXECUTION (Vercel Workflow)
   ┌─────────────────────────────────────────────────────────────────┐
   │ processApplicationWorkflow(applicationId)                        │
   │                                                                   │
   │ STEP 1: Extract Documents                                        │
   │ ├─ Fetch all documents for application                          │
   │ ├─ Run AI analysis on each document in parallel                 │
   │ │  ├─ Pay Stub → extract monthlyIncome, employerName           │
   │ │  ├─ Tax Return → extract annualIncome, taxYear               │
   │ │  └─ ID Document → extract fullName, dateOfBirth, address     │
   │ ├─ Calculate confidence scores per document                    │
   │ └─ Update ApplicationDocument records                           │
   │                                                                   │
   │ STEP 2: Fraud Analysis                                           │
   │ ├─ Compare extracted data (income mismatch detection)           │
   │ ├─ Evaluate low extraction confidence                           │
   │ ├─ Check for missing critical fields                           │
   │ ├─ Analyze income anomalies (too high/low)                     │
   │ ├─ Calculate fraud score (0-100)                               │
   │ ├─ Generate fraud signals (typed alerts)                       │
   │ ├─ Store fraudScore and fraudSignals in Application record     │
   │ └─ Determine if fraud score > 50 (needs human review)          │
   │                                                                   │
   │ STEP 3: Route Decision                                           │
   │ ├─ IF fraud score > 50 OR confidence < 0.7:                   │
   │ │  └─ Route to MANUAL_REVIEW (pause workflow)                  │
   │ └─ ELSE:                                                        │
   │    └─ Route to AUTO_APPROVE (continue workflow)                │
   │                                                                   │
   │ STEP 4: Human Review (if MANUAL_REVIEW path)                   │
   │ ├─ Create HumanReviewDecision record (status: pending)         │
   │ ├─ Set Application workflowStatus: "paused_for_review"         │
   │ ├─ Define hook listener: defineHook<HumanReviewEvent>()        │
   │ ├─ PAUSE WORKFLOW - awaits user decision via hook              │
   │ ├─ User submits decision through UI button                     │
   │ ├─ POST /api/applications/[id]/decision endpoint:              │
   │ │  └─ Calls resumeHook() to resume workflow                    │
   │ ├─ Workflow resumes with decision and reason                   │
   │ └─ Update HumanReviewDecision record (status: completed)       │
   │                                                                   │
   │ STEP 5: Background Check                                        │
   │ ├─ IF decision = "rejected":                                   │
   │ │  └─ Skip background check (already rejected)                 │
   │ └─ ELSE:                                                        │
   │    ├─ Call 3rd party background check API                      │
   │    │  (placeholder: currently simulates 90% pass rate)          │
   │    └─ Update decision based on background check result         │
   │                                                                   │
   │ STEP 6: Finalize Application                                    │
   │ ├─ IF decision = "rejected" OR background check failed:        │
   │ │  ├─ Set Application status: "rejected"                       │
   │ │  └─ Set workflowStatus: "completed"                          │
   │ └─ ELSE (approved):                                             │
   │    ├─ Set Application status: "approved"                       │
   │    ├─ Set workflowStatus: "completed"                          │
   │    ├─ Mark all ApplicationDocuments: verified                  │
   │    └─ TODO: Trigger lease generation workflow                  │
   │                                                                   │
   └─────────────────────────────────────────────────────────────────┘


3. HUMAN DECISION FLOW (Manual Review Path)
   ┌────────────────────────────────────────┐
   │ Application paused_for_review          │
   │ HumanReviewDecision created (pending)  │
   │ Dashboard shows pending review item    │
   └──────────────────┬─────────────────────┘
                      │
                      ▼
   ┌──────────────────────────────────────────────────────────┐
   │ User navigates to application detail page                │
   │ Reviews:                                                  │
   │ - Applicant information                                   │
   │ - Extracted document data (with confidence scores)        │
   │ - Fraud signals and score                                 │
   │ - Application history/status                              │
   └──────────────────┬───────────────────────────────────────┘
                      │
                      ▼
   ┌──────────────────────────────────────────────────────────┐
   │ User clicks "Approve" or "Reject" button                 │
   │ (optional: adds reason/comment)                          │
   │ Calls Server Action: submitReviewDecision()              │
   └──────────────────┬───────────────────────────────────────┘
                      │
                      ▼
   ┌──────────────────────────────────────────────────────────┐
   │ POST /api/applications/[id]/decision                      │
   │ ├─ Validates decision (approved|rejected)                │
   │ ├─ Checks application workflowStatus                     │
   │ │  (must be "paused_for_review")                         │
   │ ├─ Calls resumeHook() with decision and reason           │
   │ └─ Returns success/error response                        │
   └──────────────────┬───────────────────────────────────────┘
                      │
                      ▼
   ┌──────────────────────────────────────────────────────────┐
   │ Vercel Workflow resumes from Step 4                      │
   │ Continues to Steps 5 (Background Check) & 6 (Finalize)   │
   │ Updates Application status based on final decision        │
   └──────────────────────────────────────────────────────────┘


4. STATE MANAGEMENT & TRACKING
   Application Lifecycle:
   ┌─────────┬───────────────┬──────────────┬────────────┬──────────┐
   │ submitted│  processing   │ paused_for_  │ approved   │ rejected │
   │          │               │ review       │            │          │
   └─────────┴───────────────┴──────────────┴────────────┴──────────┘

   Workflow Status Tracking:
   ┌──────┬─────────┬────────────────────┬──────────────┬───────────┐
   │ idle │ running │ paused_for_review  │ error        │ completed │
   └──────┴─────────┴────────────────────┴──────────────┴───────────┘

   Step Completion Tracking (lastCompletedStep):
   ├─ extract_documents (Step 1)
   ├─ fraud_analysis (Step 2)
   ├─ route_decision (Step 3)
   ├─ await_human_decision (Step 4)
   ├─ background_check (Step 5)
   └─ finalize_application (Step 6)
```

### 2.4 Control Flow - Key Decision Points

```
Application Processing Decision Tree:
├─ DOCUMENT EXTRACTION (Step 1)
│  ├─ Success → Continue
│  └─ Failure → Workflow error, can retry
│
├─ FRAUD ANALYSIS (Step 2)
│  ├─ Calculate fraud score
│  └─ Generate signals
│
├─ ROUTE DECISION (Step 3)
│  ├─ IF fraud_score > 50 OR confidence < 0.7
│  │  └─ ROUTE TO MANUAL_REVIEW ← BLOCKS HERE
│  └─ ELSE
│     └─ AUTO_APPROVE (low risk)
│
├─ HUMAN REVIEW (Step 4, if needed)
│  ├─ Workflow pauses, awaiting hook event
│  ├─ User submits decision via API
│  ├─ Decision: approved OR rejected
│  └─ Workflow resumes with decision
│
├─ BACKGROUND CHECK (Step 5)
│  ├─ IF already rejected → skip
│  ├─ ELSE
│  │  ├─ Run background check
│  │  └─ Pass/Fail determines path
│  └─ Return backgroundPassed status
│
└─ FINALIZE (Step 6)
   ├─ IF rejected OR background failed
   │  └─ Set status: rejected
   └─ ELSE
      ├─ Set status: approved
      └─ Mark documents verified
```

### 2.5 External Services & Integrations

| Service | Purpose | Status | Notes |
|---------|---------|--------|-------|
| **Vercel Workflow** | Orchestration, persistence, hooks | ✅ Integrated | Provides `start()`, `defineHook()`, `resumeHook()`, `fetch()` APIs |
| **Vercel Blob** | Document file storage | ✅ Integrated | `BLOB_READ_WRITE_TOKEN` for API access |
| **PostgreSQL** | Primary database | ✅ Integrated | Via Prisma ORM, supports Accelerate |
| **AI Document Extraction** | Parse documents (pay stub, tax returns, ID) | 🔄 Placeholder | Currently mocked in `lib/ai.ts`, ready for LLM integration |
| **Background Check Service** | 3rd party verification (Checkr, etc.) | 🔄 TODO | Placeholder in `workflows/application/steps/background-check.ts` |
| **Lease Generation** | Generate lease documents | 🔄 Future | Not yet implemented |

---

## 3. Workflow Description

### 3.1 Typical Request Flow (Happy Path - Low Risk)

```
Timeline: ~15-30 seconds

User Action:
┌──────────────────────────────────────────────────────────┐
│ 1. Opens browser → http://localhost:3000                 │
│ 2. Clicks "New Application"                              │
│ 3. Fills form: Name, Email, Listing selection            │
└───────────────────┬──────────────────────────────────────┘

File Upload:
┌──────────────────────────────────────────────────────────┐
│ 4. Selects 3 documents:                                  │
│    - pay_stub.pdf                                        │
│    - tax_return.pdf                                      │
│    - id_verification.jpg                                 │
│ 5. Clicks "Upload to Blob Storage" button                │
│    → Files uploaded to Vercel Blob                       │
│    → Server receives blob URLs                           │
└───────────────────┬──────────────────────────────────────┘

Application Creation:
┌──────────────────────────────────────────────────────────────┐
│ 6. Server Action: createApplication()                        │
│    - Creates Application record (submitted)                  │
│    - Creates 3 Document records                              │
│    - Creates 3 ApplicationDocument links (pending)           │
│    - Calls start(processApplicationWorkflow, [app.id])       │
│    - Updates Application.workflowRunId                       │
└───────────────────┬────────────────────────────────────────┘
                    │
                    ▼
Workflow Queued (Async):
┌──────────────────────────────────────────────────────────────┐
│ 7. processApplicationWorkflow(applicationId) starts          │
│    [This continues asynchronously in the background]         │
└───────────────────┬────────────────────────────────────────┘

Step 1 - Extract Documents (~5s):
┌──────────────────────────────────────────────────────────────┐
│ - Fetch all documents                                        │
│ - Call analyzeDocument() for each:                           │
│   • pay_stub.pdf                                             │
│   • tax_return.pdf                                           │
│   • id_verification.jpg                                      │
│ - Extract data + calculate confidence                        │
│ - Update ApplicationDocument records                         │
│ Output:                                                      │
│  pay_stub: { monthlyIncome: 5000, ...}  (confidence: 0.85)  │
│  tax_return: { annualIncome: 60000, ...}  (confidence: 0.90) │
│  id_doc: { fullName: "John Doe", ... }  (confidence: 0.95)  │
└───────────────────┬────────────────────────────────────────┘

Step 2 - Fraud Analysis (~1s):
┌──────────────────────────────────────────────────────────────┐
│ - Compare income: $5000/mo (pay stub) vs $5000/mo (tax)     │
│   → Difference < $1000: NO SIGNAL                            │
│ - Average confidence: (0.85 + 0.90 + 0.95) / 3 = 0.90      │
│   → >= 0.7: NO SIGNAL                                        │
│ - All required fields present: NO SIGNAL                     │
│ - Income $5000/mo is reasonable: NO SIGNAL                  │
│                                                              │
│ Result:                                                      │
│  fraudScore: 0                                               │
│  signals: []                                                 │
│  needsReview: false (score <= 50 AND confidence >= 0.7)    │
└───────────────────┬────────────────────────────────────────┘

Step 3 - Route Decision (~1s):
┌──────────────────────────────────────────────────────────────┐
│ - Check: fraudScore > 50? NO                                 │
│ - Route: AUTO_APPROVE path                                   │
│ - Update Application.workflowStatus: "running"               │
└───────────────────┬────────────────────────────────────────┘

Step 4 - Human Review (~0s):
┌──────────────────────────────────────────────────────────────┐
│ - Auto-approve path: SKIP HUMAN REVIEW                       │
│ - Set decision: "auto_approved"                              │
└───────────────────┬────────────────────────────────────────┘

Step 5 - Background Check (~2s):
┌──────────────────────────────────────────────────────────────┐
│ - Decision is "auto_approved": proceed                       │
│ - Call background check service                              │
│ - Simulate 90% pass rate: PASS ✓                             │
│ - Decision remains "auto_approved"                           │
└───────────────────┬────────────────────────────────────────┘

Step 6 - Finalize (~1s):
┌──────────────────────────────────────────────────────────────┐
│ - Decision = "auto_approved" AND backgroundPassed = true     │
│ - Set Application.status: "approved"                         │
│ - Set Application.workflowStatus: "completed"                │
│ - Mark all documents: verificationStatus: "verified"         │
│                                                              │
│ RESULT: Application automatically approved! ✓                │
└──────────────────────────────────────────────────────────────┘

User Experience:
┌────────────────────────────────────────────────────────────────┐
│ 8. Dashboard updates in real-time                              │
│    - Application appears with status "approved"                │
│    - No manual review needed                                   │
│    - Takes ~15-30s total                                       │
│                                                                │
│ 9. Application can proceed to lease generation (future step)   │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 High-Risk Path (Manual Review Required)

```
Timeline: User-dependent (pauses for human decision)

[Steps 1-3 same as above, but FRAUD SIGNALS DETECTED]

Step 2 - Fraud Analysis (High Risk Scenario):
┌──────────────────────────────────────────────────────────────┐
│ Scenario: Income documents don't match                        │
│                                                              │
│ - Pay stub: $5000/month                                       │
│ - Tax return: $15000/month (annually: $180k vs $60k)         │
│ - Difference: $10000 > $1000 threshold                       │
│                                                              │
│ Signals generated:                                           │
│  1. income_mismatch (HIGH severity)                          │
│     "Pay stub shows $5000/month, but tax return shows        │
│      $15000/month"                                           │
│  2. unusually_high_income (MEDIUM severity)                  │
│     "Monthly income of $15000 is unusually high"             │
│                                                              │
│ fraudScore: 85 (60 for mismatch + 25 for high income)       │
│ confidence: 0.90                                              │
│ needsReview: true (score > 50)                               │
└───────────────────┬────────────────────────────────────────┘

Step 3 - Route Decision:
┌──────────────────────────────────────────────────────────────┐
│ - Check: fraudScore (85) > 50? YES                           │
│ - Route: MANUAL_REVIEW path                                   │
│ - Update Application.status: "processing"                     │
│ - Update Application.workflowStatus: "paused_for_review"     │
│                                                              │
│ WORKFLOW PAUSES HERE, AWAITING HUMAN DECISION                │
└───────────────────┬────────────────────────────────────────┘

Step 4 - Await Human Decision (PAUSED):
┌──────────────────────────────────────────────────────────────┐
│ - Create HumanReviewDecision record:                          │
│   {                                                          │
│     applicationId: 123,                                      │
│     workflowRunId: "abc-123-xyz",                           │
│     decision: null,                                          │
│     reason: null,                                            │
│     status: "pending",                                       │
│     fraudContext: { score: 85, signals: [...] }             │
│   }                                                          │
│                                                              │
│ - Set hook listener: defineHook()                            │
│ - WORKFLOW BLOCKS: await reviewEvents                        │
│                                                              │
│ 🛑 PAUSED - Waiting for user action on UI                   │
└──────────────────────────────────────────────────────────────┘

Human Reviewer Actions:
┌──────────────────────────────────────────────────────────────┐
│ Dashboard shows pending review:                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Application ID: 123                                    │  │
│ │ Applicant: John Doe <john@example.com>                 │  │
│ │ Status: Processing (⏸ Paused for Review)              │  │
│ │                                                        │  │
│ │ Fraud Score: 85/100 (🔴 HIGH RISK)                    │  │
│ │ Fraud Signals:                                         │  │
│ │  - Income Mismatch (HIGH) - Pay stub vs Tax return    │  │
│ │  - Unusually High Income (MEDIUM)                     │  │
│ │                                                        │  │
│ │ Extracted Documents:                                   │  │
│ │  Pay Stub: $5,000/month (confidence: 85%)             │  │
│ │  Tax Return: $180,000/year (confidence: 90%)          │  │
│ │  ID Verification: John Doe (confidence: 95%)          │  │
│ │                                                        │  │
│ │ [Reject] [APPROVE]                                    │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Reviewer decides: "Income mismatch is concerning. The        │
│ high pay stub income conflicts with lower tax return."       │
│ Clicks: [REJECT]                                             │
│ Adds reason: "Income documentation inconsistent"             │
└───────────────────┬────────────────────────────────────────┘

Workflow Resumes:
┌──────────────────────────────────────────────────────────────┐
│ POST /api/applications/123/decision                          │
│ {                                                            │
│   "decision": "rejected",                                    │
│   "reason": "Income documentation inconsistent"              │
│ }                                                            │
│                                                              │
│ Handler:                                                     │
│ - Validates decision and application state                   │
│ - Calls resumeHook("app-123", {decision, reason})           │
│ - Returns success response                                   │
│                                                              │
│ Workflow resumes from Step 4                                │
└───────────────────┬────────────────────────────────────────┘

Step 5 - Background Check:
┌──────────────────────────────────────────────────────────────┐
│ - Decision = "rejected" (already rejected)                   │
│ - SKIP background check                                      │
│ - Return decision: "rejected"                                │
└───────────────────┬────────────────────────────────────────┘

Step 6 - Finalize:
┌──────────────────────────────────────────────────────────────┐
│ - Decision = "rejected"                                      │
│ - Set Application.status: "rejected"                         │
│ - Set Application.workflowStatus: "completed"                │
│ - Update HumanReviewDecision.status: "completed"             │
│                                                              │
│ RESULT: Application rejected after human review ✗            │
└──────────────────────────────────────────────────────────────┘

User Experience:
┌────────────────────────────────────────────────────────────────┐
│ - Dashboard shows application status changed to "rejected"      │
│ - Rejection reason visible in history                          │
│ - Applicant could be notified via email (not yet implemented)  │
│ - Admin can view all decisions in application history          │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Background Jobs & Async Flows

**Workflow as Background Job:**
- Uses Vercel Workflow for durability and resumability
- Not a traditional job queue, but an orchestration platform
- Survives server restarts and crashes
- Can pause indefinitely (waiting for human decision)
- Can resume from last completed step

**Polling for Newly Created Applications:**
- Hook: `useNewlyCreatedApplicationsPolling()`
- Polls application details every 1 second (while being tracked)
- Shows live updates to dashboard as workflow progresses
- Stops polling once workflow completes

**Real-time Updates:**
- Client-side React Query with `refetchInterval`
- Manual `refetch()` calls after decision submission
- Revalidation paths for server-side caching

---

## 4. Assumptions and Limitations

### 4.1 System Assumptions

| Assumption | Details |
|-----------|---------|
| **Single Applicant per Application** | One person applies per application (no co-applicants) |
| **Single Listing per Application** | Application is tied to one property listing |
| **Document Validation** | Uploaded documents are assumed to be legitimate (fraud detection is AI-powered, not tamper-proof) |
| **Workflow Persistence** | Assumes Vercel Workflow platform is available; failures result in application pausing |
| **AI Extraction Quality** | Fraud detection quality depends on AI extraction accuracy (currently mocked) |
| **Background Check Availability** | Assumes 3rd party background check service will be available (currently not implemented) |
| **No Concurrent Approvals** | Only one workflow instance per application at a time |
| **Stateless API Routes** | All state stored in database; no in-memory session state |
| **Email Notifications** | Not yet implemented; decisions not automatically sent to applicants |

### 4.2 Technical Constraints

| Constraint | Impact | Mitigation |
|-----------|--------|-----------|
| **File Size Limit** | Max 10MB per document | Enforced at upload; prevents large video/image files |
| **Supported File Types** | PDF, JPEG, PNG only | Covers most document types; can extend in `upload/route.ts` |
| **Database Query Performance** | No pagination for large result sets | Implemented pagination (20 items/page) for applications list |
| **Workflow Step Atomicity** | Steps can fail and retry | `StepError` handling with `lastCompletedStep` tracking |
| **Human Decision Timeout** | No timeout on paused workflow | Could wait indefinitely; recommend UI timeout or auto-reject |
| **Concurrent Database Writes** | Race conditions possible | Prisma transactions used in `createApplication()` |
| **No Audit Trail** | Changes not logged for compliance | Could be added to middleware |

### 4.3 Scalability & Performance Considerations

**Current Capacity:**

```
Database:
├─ PostgreSQL (single instance via Prisma Accelerate)
├─ Supports ~10k concurrent connections (Accelerate limit)
├─ Query performance optimized with indexes on:
│  ├─ Application.listingId
│  ├─ Application.status
│  ├─ Application.fraudScore
│  ├─ Application.applicantEmail
│  └─ Application.applicantName
├─ Can handle ~100k applications (disk space dependent)
└─ Scaling: Can upgrade to dedicated database tier

File Storage:
├─ Vercel Blob has no documented limit per file (within 10MB soft limit)
├─ Supports millions of files
├─ Cost-based scaling: $0.50 per GB stored
└─ Throughput: Not rate-limited

Workflow Processing:
├─ Vercel Workflow can handle 1000s of concurrent workflows
├─ Each workflow uses minimal compute (mostly I/O wait)
├─ Hook pausing doesn't consume compute (no cost while paused)
└─ Document extraction (AI) will be bottleneck (depends on LLM provider)
```

**Bottlenecks:**

1. **AI Document Extraction** - If switching from mock to real LLM (OpenAI, Claude)
   - Add queue/batching for better throughput
   - Consider rate limits of LLM API
   - Implement retry logic with exponential backoff

2. **Database Queries** - For large result sets
   - Pagination already implemented
   - Consider full-text search for better perf on `applicantName`, `applicantEmail`, `address`
   - Add database query caching for stats

3. **Background Check Integration** - When implemented
   - 3rd party API latency (Checkr typically 1-5s)
   - Timeout handling recommended

**Recommendations for Production:**

```typescript
// 1. Add caching for frequently accessed data
const stats = await cache(() => getApplicationStats(), {
  revalidate: 60 // Revalidate every 60 seconds
});

// 2. Implement rate limiting on API routes
import { Ratelimit } from "@upstash/ratelimit";

// 3. Add database connection pooling
// Use Prisma Accelerate (already in use)

// 4. Monitor workflow execution times
// Vercel provides monitoring dashboard

// 5. Implement comprehensive error tracking
// Add Sentry or similar for production monitoring
```

### 4.4 Security Limitations

| Limitation | Risk | Mitigation |
|-----------|------|-----------|
| **Internal Token in Env** | Token compromise = unauthorized API access | Rotate regularly; use Vercel secrets management |
| **No User Authentication** | Anyone can submit applications | Add NextAuth.js or Clerk for user auth |
| **No RBAC** | All users have same permissions | Add role-based access control (admin vs reviewer) |
| **Document Privacy** | Uploaded documents accessible via blob URL | Blob URLs are guessable; add access controls |
| **Data at Rest** | Database contains sensitive PII | Enable database encryption; PostgreSQL supports this |
| **Audit Logging** | No record of who approved/rejected | Add audit log table with user IDs and timestamps |
| **CSRF Protection** | Not explicitly implemented | Next.js provides automatic CSRF tokens in forms |

---

## 5. How AI and Human Review Are Separated

### 5.1 AI-Powered Components

#### Document Extraction (Step 1)

**Location:** `workflows/application/steps/extract-documents.ts`

**Process:**
```typescript
// For each application document:
const extracted = await analyzeDocument(
  blobUrl,       // Document URL in Vercel Blob
  documentType,  // "pay_stub" | "tax_return" | "id_verification"
  filename       // For context (currently unused)
);

// Current Mock Implementation (lib/ai.ts):
// Returns: { data: {...}, confidence: 0-1 }
```

**Mock AI Output Examples:**

```typescript
// Pay Stub
{
  data: {
    employerName: "Acme Corp",
    monthlyIncome: 5000,
    payPeriod: "2024-01-01 to 2024-01-15"
  },
  confidence: 0.85
}

// Tax Return
{
  data: {
    annualIncome: 60000,
    taxYear: 2023
  },
  confidence: 0.90
}

// ID Verification
{
  data: {
    fullName: "John Doe",
    dateOfBirth: "1990-01-01",
    address: "123 Main St"
  },
  confidence: 0.95
}
```

**Real LLM Integration (Ready to Implement):**

```typescript
// Replace mock implementation with:
import OpenAI from "openai";

export async function analyzeDocument(blobUrl: string, documentType: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const message = await openai.messages.create({
    model: "gpt-4-vision",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: blobUrl }
          },
          {
            type: "text",
            text: `Extract structured data from this ${documentType}. Return JSON with fields...`
          }
        ]
      }
    ]
  });

  // Parse JSON response, calculate confidence from LLM certainty
  return { data: extracted, confidence };
}
```

#### Fraud Detection (Step 2)

**Location:** `lib/fraud-detection.ts`

**AI Analysis Features:**

1. **Income Mismatch Detection**
   ```typescript
   // Compare pay stub vs tax return income
   if (difference > $1000) {
     score += 60; // HIGH severity
   }
   ```

2. **Extraction Confidence Check**
   ```typescript
   if (avgConfidence < 0.7) {
     score += 30; // MEDIUM severity
   }
   ```

3. **Missing Field Detection**
   ```typescript
   if (!payStub?.employerName) {
     score += 20; // MEDIUM severity
   }
   ```

4. **Income Anomaly Detection**
   ```typescript
   if (monthlyIncome > 50000) {
     score += 25; // MEDIUM severity
   } else if (monthlyIncome < 2000) {
     score += 20; // MEDIUM severity
   }
   ```

**Fraud Score Calculation:**
- Base: 0 points
- Each signal adds points (20-60 depending on severity)
- Maximum: 100+
- Threshold for manual review: > 50 points

**No Human Override at This Stage:**
- Fraud score is purely algorithmic
- Humans review the RESULT, not the process
- Humans cannot edit fraud score (they see it, but can't change it)

#### Routing Decision (Step 3)

**Location:** `workflows/application/steps/route-decision.ts`

**Automated Route Logic:**
```typescript
if (fraudScore > 50 || confidence < 0.7) {
  path = "manual_review"; // Requires human
} else {
  path = "auto_approve"; // No human needed
}
```

**No Human Input at This Stage:**
- Decision is deterministic
- Based solely on fraud analysis results

---

### 5.2 Human-Required Components

#### Manual Review Decision (Step 4)

**Location:** `workflows/application/steps/await-human-decision.ts`  
**UI:** `app/(applications)/page.tsx` + application detail view

**When Manual Review Triggers:**
- Fraud score > 50, OR
- Document extraction confidence < 70%

**What Reviewers See:**

```typescript
// HumanReviewDecision record contains:
{
  id: 1,
  applicationId: 123,
  workflowRunId: "abc-123-xyz",
  decision: null,           // Awaiting decision
  reason: null,             // Awaiting explanation
  fraudContext: {           // ← Human sees this
    score: 85,
    signals: [
      {
        type: "income_mismatch",
        severity: "high",
        details: "Pay stub shows $5000/mo, tax return shows $15000/mo"
      }
    ]
  },
  status: "pending",
  reviewedAt: null,
  createdAt: "2024-01-29T12:00:00Z"
}
```

**Extracted Data Shown to Reviewer:**

```typescript
// From ApplicationDocument records:
{
  documentType: "pay_stub",
  documentData: {
    employerName: "Acme Corp",
    monthlyIncome: 5000
  },
  confidenceScore: 0.85,  // Low = less reliable
  verificationStatus: "extracted"
}

// Human can visually verify against uploaded PDF
// Can override AI extraction if needed (future feature)
```

**Reviewer Decision Options:**

| Decision | Meaning | Next Step |
|----------|---------|-----------|
| **APPROVE** | Accept application despite flags | → Background Check → Finalize |
| **REJECT** | Decline application | → Skip to Finalize (rejected) |
| *(Add Comment)* | Optional reason for decision | Stored in `reason` field |

**Decision Submission Flow:**

```typescript
// Server Action: submitReviewDecision()
// → POST /api/applications/[id]/decision
// → resumeHook("app-{id}", { decision, reason })
// → Workflow resumes with human decision
```

**No AI Override:**
- Once human decides, AI signals are ignored
- Human decision is final for this step
- Fraud score remains visible but doesn't affect this decision

---

### 5.3 Complete AI vs Human Responsibility Matrix

```
┌──────────────────────────────────────────────────────────────────┐
│                        WORKFLOW STEP                              │
├──────────────────┬─────────────────────┬──────────────────────────┤
│ Step             │ AI/Automated        │ Human Role               │
├──────────────────┼─────────────────────┼──────────────────────────┤
│ 1. Extract       │ ✓ Extracts data    │ Can view & verify        │
│    Documents     │   from documents    │ extracted values         │
│                  │ ✓ Calculates        │ (UI: see extracted data) │
│                  │   confidence scores │                          │
├──────────────────┼─────────────────────┼──────────────────────────┤
│ 2. Fraud         │ ✓ Analyzes data    │ Cannot override          │
│    Detection     │ ✓ Compares income  │ AI score is informational│
│                  │ ✓ Detects anomalies│ only at this stage        │
│                  │ ✓ Generates signals│                          │
│                  │ ✓ Calculates score │                          │
├──────────────────┼─────────────────────┼──────────────────────────┤
│ 3. Route         │ ✓ Applies logic:   │ No intervention          │
│    Decision      │   score > 50       │                          │
│                  │   → manual_review  │                          │
│                  │   else → auto      │                          │
├──────────────────┼─────────────────────┼──────────────────────────┤
│ 4. Human Review  │ ✗ Workflow pauses  │ ✓ Reviews fraud signals  │
│    *(if needed)* │   at hook listener │ ✓ Views extracted data   │
│                  │ ✗ Awaits decision  │ ✓ Decides: approve/reject│
│                  │                    │ ✓ Adds optional reason   │
│                  │                    │ ✓ WORKFLOW RESUMES       │
├──────────────────┼─────────────────────┼──────────────────────────┤
│ 5. Background    │ ✓ Calls 3rd party  │ ✗ No visibility          │
│    Check         │   service          │ (TBD: could add UI)      │
│                  │ ✓ Interprets result│                          │
│                  │   pass/fail        │                          │
├──────────────────┼─────────────────────┼──────────────────────────┤
│ 6. Finalize      │ ✓ Applies final    │ ✗ No intervention        │
│                  │   decision logic   │ (automatic finalization) │
│                  │ ✓ Updates status   │                          │
│                  │ ✓ Marks verified   │                          │
└──────────────────┴─────────────────────┴──────────────────────────┘

Legend:
✓ = Responsible/Can intervene
✗ = Not responsible/No intervention
```

---

### 5.4 Guardrails Against Misuse & Automation Errors

#### Guardrail 1: Fraud Score Threshold

**Purpose:** Prevent auto-approval of risky applications

```typescript
// In routeDecisionStep:
if (fraudScore > 50 || confidence < 0.7) {
  // FORCE manual review
  path = 'manual_review';
}

// Lower threshold = more reviews
// Higher threshold = faster processing
// Current: 50 points
```

**Adjustment:**
```typescript
// To make system stricter (more manual reviews):
if (fraudScore > 40 || confidence < 0.8) {
  // More applications flagged
}

// To make system lenient (fewer manual reviews):
if (fraudScore > 70 || confidence < 0.5) {
  // Fewer applications flagged (risky!)
}
```

#### Guardrail 2: Extraction Confidence Minimum

**Purpose:** Prevent approving applications with low-quality data

```typescript
// In fraudAnalysisStep:
const needsReview = fraudScore > 50 || avgConfidence < 0.7;

// If avg confidence < 70%, application auto-routed to manual review
// Even if fraud score is 0
```

**Rationale:**
- If AI can't reliably extract document data → human should verify
- Prevents false negatives from low-quality documents

#### Guardrail 3: Signal Documentation

**Purpose:** Ensure reviewers understand WHY it was flagged

```typescript
// Every fraud signal has:
{
  type: "income_mismatch",        // Specific category
  severity: "high",                // high/medium/low
  details: "Pay stub shows $5000/mo, tax return shows $15000/mo"
  // ↑ Specific, human-readable explanation
}

// Prevents opaque "blackbox" decisions
// Reviewers can validate signals
```

#### Guardrail 4: Manual Review Cannot Be Bypassed

**Purpose:** Prevent accidental auto-approval of flagged applications

```typescript
// Once fraud score > 50, workflow MUST route to manual review
// Cannot be auto-approved even if background check passes
// Cannot be approved via API without human decision

// In finalizeApplicationStep:
if (decision === 'rejected' || !backgroundPassed) {
  status = 'rejected';
} else if (decision is 'auto_approved' but should not be) {
  throw new Error("Logic error");
}
```

#### Guardrail 5: Audit Trail

**Purpose:** Track all decisions for compliance

```typescript
// HumanReviewDecision table stores:
{
  applicationId: 123,
  workflowRunId: "abc-123",       // Can trace back to execution
  decision: "rejected",            // What was decided
  reason: "Income mismatch",       // Why
  fraudContext: {...},             // What was visible
  status: "completed",
  reviewedAt: "2024-01-29T14:30:00Z",  // When
  // Missing: WHO (reviewer user ID) - could be added
}

// Could add:
{
  reviewerId: 42,                  // Next.js NextAuth user ID
  reviewerEmail: "admin@company.com"
}
```

#### Guardrail 6: No Retroactive Score Changes

**Purpose:** Prevent fraud scores from being adjusted after decision

```typescript
// Application record has immutable fraud fields:
// - fraudScore: Float (set by fraud analysis, never changed)
// - fraudSignals: Json (set by fraud analysis, never changed)

// Human decision is separate:
// - HumanReviewDecision.decision (human adds, cannot be auto-changed)
// - HumanReviewDecision.reason (human adds, cannot be auto-changed)

// Final status determined by: decision + backgroundCheck + logic
// Not by changing fraud score
```

#### Guardrail 7: Background Check Isolation

**Purpose:** Don't let background check results override human decision

```typescript
// In backgroundCheckStep:
if (decision === 'rejected') {
  return {
    backgroundPassed: false,
    decision: 'rejected'    // Already rejected by human
  };
}

// Even if background check PASSES:
// - Cannot override human rejection
// - Workflow respects human decision

// If background check FAILS:
// - Final status is 'rejected'
// - But decision still attributed to background check, not fraud
```

#### Guardrail 8: Workflow Resumption Validation

**Purpose:** Prevent invalid decisions from resuming workflow

```typescript
// In /api/applications/[id]/decision:

// Validation checks:
if (!['approved', 'rejected'].includes(decision)) {
  return 400; // Invalid decision
}

if (application.workflowStatus !== 'paused_for_review') {
  return 400; // Workflow not paused (already running/completed)
}

// Only resumes if validation passes
await resumeHook(`app-${applicationId}`, { decision, reason });
```

---

### 5.5 Future Improvements for Human-AI Collaboration

```typescript
// 1. Confidence Intervals for AI Extraction
// Currently: Binary confidence (0-1)
// Future: Confidence interval per extracted field
{
  monthlyIncome: {
    value: 5000,
    confidence: 0.85,
    lowEstimate: 4500,   // 95% sure it's between this
    highEstimate: 5500   // and this
  }
}

// 2. AI Explanation Feature
// Currently: Signal type + details
// Future: "Why this was flagged" explanation
{
  type: "income_mismatch",
  details: "...",
  explanation: "Income documents often contain errors if applicant changed jobs"
}

// 3. Human Override of AI Extraction
// Currently: Cannot change extracted data
// Future: Reviewer can correct AI extraction
{
  type: "correction_override",
  field: "monthlyIncome",
  originalAIValue: 5000,
  correctedValue: 5500,
  reason: "PDF shows $5500 but AI misread"
}

// 4. ML Model Retraining
// Currently: Fixed fraud detection logic
// Future: Collect human decision outcomes to improve models
{
  fraudScore: 30,    // AI predicted low risk
  signals: [...],
  humanDecision: "rejected",
  reason: "Applicant has poor rental history",
  useForRetraining: true  // Feed back into model
}

// 5. Risk Scoring per Reviewer
// Currently: All reviewers see same threshold
// Future: Personalized thresholds based on reviewer patterns
{
  reviewer: "alice@company.com",
  baseThreshold: 50,
  personalThreshold: 45,  // Alice is more conservative
  approvalRate: 0.68
}

// 6. Batch Decision Making
// Currently: One application at a time
// Future: Review multiple applications in one session
{
  applicationIds: [123, 124, 125],
  batchApprovalRate: 0.75,  // 3 out of 4 approved
  estimatedTimePerApp: 45   // seconds
}
```

---

## Additional Resources & Next Steps

### For Development

- **Local Testing:**
  ```bash
  pnpm run dev                      # Start dev server
  pnpm exec prisma studio          # View database
  pnpm exec prisma migrate dev      # Create/update migrations
  pnpm run lint                    # Check code quality
  ```

- **Workflow Testing:**
  - Create test application and monitor logs
  - Check `console.log` statements in workflow steps
  - Use Vercel dashboard to view workflow runs

- **AI Integration:**
  - Replace mock in `lib/ai.ts` with real LLM (OpenAI, Claude, etc.)
  - Add `OPENAI_API_KEY` or equivalent to `.env.local`
  - Test extraction quality with real documents

### For Production

1. **Security Hardening:**
   - Implement user authentication (NextAuth.js)
   - Add role-based access control (admin, reviewer, etc.)
   - Rotate `WORKFLOW_INTERNAL_TOKEN` regularly
   - Add audit logging middleware

2. **Monitoring & Observability:**
   - Integrate Sentry for error tracking
   - Add application performance monitoring (APM)
   - Monitor workflow execution times
   - Alert on failed workflows

3. **Compliance:**
   - Implement GDPR compliance (right to delete, data export)
   - Add data retention policies
   - Document decision audit trail
   - Add consent management for document uploads

4. **Background Check Integration:**
   - Partner with Checkr, Clearview, or similar
   - Implement retry logic for failed checks
   - Add background check results to UI
   - Handle adverse action notifications

5. **Email Notifications:**
   - Send confirmation email on application submission
   - Notify on approval/rejection
   - Add review status updates
   - Implement email templates

---

## Contact & Support

**For Questions About:**
- Architecture: Review this document & code comments
- Deployment: Check Vercel documentation
- Workflow: See Vercel Workflow docs
- Database: See Prisma documentation
- React/UI: See React & TailwindCSS docs

**Code Locations:**
- Workflow Logic: `/workflows/application/`
- API Routes: `/app/api/`
- UI Components: `/components/`
- Database: `/prisma/schema.prisma`
- Utilities: `/lib/`

---

**Document Date:** January 29, 2026  
**Last Updated:** January 29, 2026  
**Status:** Complete & Ready for Review
