-- CreateTable
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'analysis',
    "summary" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "risks" TEXT NOT NULL,
    "outlook" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "inputTokens" INTEGER,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIInsight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "overall" REAL NOT NULL,
    "revenueHealth" REAL NOT NULL,
    "growthScore" REAL NOT NULL,
    "assetCoverage" REAL NOT NULL,
    "efficiency" REAL NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "scoreVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyScore_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ForecastRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "lowerBound" REAL NOT NULL,
    "upperBound" REAL NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.8,
    "method" TEXT NOT NULL DEFAULT 'holt',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ForecastRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
