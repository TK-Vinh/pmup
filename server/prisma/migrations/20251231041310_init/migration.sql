-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Hero" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "iq" INTEGER NOT NULL,
    "eq" INTEGER NOT NULL,
    "mental" INTEGER NOT NULL,
    "playerId" TEXT NOT NULL,
    CONSTRAINT "Hero_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Injury" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "heroId" TEXT NOT NULL,
    "part" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    CONSTRAINT "Injury_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "heroId" TEXT,
    "name" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "durability" INTEGER NOT NULL,
    CONSTRAINT "Equipment_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
