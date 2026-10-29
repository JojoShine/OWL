ALTER TABLE "owl_system_configs"
  ADD COLUMN "password_policy" VARCHAR(20) NOT NULL DEFAULT 'standard',
  ADD COLUMN "login_failure_limit" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "login_lock_minutes" INTEGER NOT NULL DEFAULT 15,
  ADD CONSTRAINT "owl_password_policy_check" CHECK ("password_policy" IN ('basic', 'standard', 'strict')),
  ADD CONSTRAINT "owl_login_failure_limit_check" CHECK ("login_failure_limit" IN (3, 5, 10)),
  ADD CONSTRAINT "owl_login_lock_minutes_check" CHECK ("login_lock_minutes" IN (5, 15, 30));
