CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

ALTER TABLE "user" ADD COLUMN "theme_preference" "ThemePreference" NOT NULL DEFAULT 'SYSTEM';
