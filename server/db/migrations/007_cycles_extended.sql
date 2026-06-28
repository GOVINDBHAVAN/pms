-- Extend review_cycles with per-phase date windows and check-in flag
-- Phase windows: goal-setting approval, calibration; check-in toggle

ALTER TABLE review_cycles ADD COLUMN approval_open    TEXT;
ALTER TABLE review_cycles ADD COLUMN approval_close   TEXT;
ALTER TABLE review_cycles ADD COLUMN calibration_open  TEXT;
ALTER TABLE review_cycles ADD COLUMN calibration_close TEXT;
ALTER TABLE review_cycles ADD COLUMN check_in_allowed  INTEGER DEFAULT 1;
