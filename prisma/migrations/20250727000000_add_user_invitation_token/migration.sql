-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "invitation_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_invitation_token_key" ON "usuarios"("invitation_token");

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "invitation_expires_at" TIMESTAMP(3);
