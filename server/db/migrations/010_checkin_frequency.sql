-- Adds per-target check-in frequency (Rule PT2) and status/confidence fields to check-ins (Rules PT3, PT4)

-- checkin_frequency: employee sets this at target creation so the system knows
-- how often to expect updates and when to flag a target as "needs check-in".
-- daily | weekly | bi_weekly | monthly | quarterly | semi_annual | annual
ALTER TABLE targets ADD COLUMN checkin_frequency TEXT DEFAULT 'monthly';

-- status_flag: each check-in records whether the target is on track (Rule PT3).
-- on_track | at_risk | blocked | completed
ALTER TABLE checkins ADD COLUMN status_flag TEXT DEFAULT 'on_track';

-- confidence_score: for OKR Key Results only — how confident is the employee
-- they will hit the target by cycle end, independent of % achieved (Rule PT4).
-- Range 0.0 to 1.0.
ALTER TABLE checkins ADD COLUMN confidence_score REAL;
