import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const url = process.env.DATABASE_URL || "file:./game.db";
console.log("Connecting to:", url);

const prisma = new PrismaClient({
    log: ['warn']
} as any);

async function main() {
    try {
        await prisma.$connect();
        console.log("SUCCESS_CONNECTION");
        await prisma.$disconnect();
    } catch (e) {
        console.error("FAIL_CONNECTION", e);
    }
}
main();
