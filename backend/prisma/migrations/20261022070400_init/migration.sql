-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'worker', 'department_supervisor', 'super_admin');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('queued', 'assigned', 'in_progress', 'resolved', 'escalated');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Critical', 'High', 'Normal', 'Low');

-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('available', 'busy', 'off_duty');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('active', 'scheduled', 'leave');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "department" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'queued',
    "priority" "Priority" NOT NULL DEFAULT 'Normal',
    "reportedBy" TEXT NOT NULL,
    "reportedByUserId" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "slaMinutes" INTEGER NOT NULL,
    "slaDeadline" TIMESTAMP(3) NOT NULL,
    "assignedWorkerId" TEXT,
    "assignedWorkerName" TEXT,
    "photoUrl" TEXT,
    "resolutionPhoto" TEXT,
    "coordinates" JSONB,
    "feedback" JSONB,
    "reworkCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" "WorkerStatus" NOT NULL DEFAULT 'available',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jobsCompleted" INTEGER NOT NULL DEFAULT 0,
    "reworkRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shift" TEXT NOT NULL,
    "currentBuilding" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftRoster" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "workerName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'scheduled',
    "buildingAssigned" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftRoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "adminRole" "UserRole" NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_ticketId_key" ON "Issue"("ticketId");

-- CreateIndex
CREATE INDEX "Issue_department_status_idx" ON "Issue"("department", "status");

-- CreateIndex
CREATE INDEX "Issue_slaDeadline_idx" ON "Issue"("slaDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_email_key" ON "Worker"("email");

-- CreateIndex
CREATE INDEX "Worker_department_status_idx" ON "Worker"("department", "status");

-- CreateIndex
CREATE INDEX "ShiftRoster_department_date_idx" ON "ShiftRoster"("department", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftRoster_workerId_date_key" ON "ShiftRoster"("workerId", "date");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_department_timestamp_idx" ON "AuditLog"("department", "timestamp");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_assignedWorkerId_fkey" FOREIGN KEY ("assignedWorkerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRoster" ADD CONSTRAINT "ShiftRoster_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
