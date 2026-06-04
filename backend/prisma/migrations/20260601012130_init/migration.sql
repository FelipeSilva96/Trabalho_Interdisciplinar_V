-- CreateEnum
CREATE TYPE "Algorithm" AS ENUM ('RMS_SIMPLE', 'RMS_TWO_STAGE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISCARDED');

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "algorithm" "Algorithm" NOT NULL DEFAULT 'UNKNOWN',
    "rms" DOUBLE PRECISION,
    "threshold" DOUBLE PRECISION,
    "latencyUs" INTEGER,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "imagePath" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_code_key" ON "Device"("code");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE INDEX "Event_deviceId_idx" ON "Event"("deviceId");

-- CreateIndex
CREATE INDEX "Event_algorithm_idx" ON "Event"("algorithm");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
