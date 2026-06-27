-- 9-Box Grid and BSC Perspective foundation
-- ALTER TABLE is safe here: migration runner checks schema_versions before applying.

-- BSC: tag each BSC Metric target to one of the org's configured perspectives
ALTER TABLE targets ADD COLUMN bsc_perspective TEXT;

-- 9-Box: Performance axis comes from performance_summary.final_score (already exists).
-- Potential axis is a separate manager/HR assessment entered during calibration.
ALTER TABLE performance_summary ADD COLUMN potential_rating INTEGER;        -- 1=Low 2=Medium 3=High
ALTER TABLE performance_summary ADD COLUMN potential_label TEXT;            -- custom label from org settings
ALTER TABLE performance_summary ADD COLUMN succession_risk TEXT;            -- 'low'|'medium'|'high' (optional)
ALTER TABLE performance_summary ADD COLUMN readiness_level TEXT;            -- 'ready_now'|'1_2_years'|'long_term' (optional)
ALTER TABLE performance_summary ADD COLUMN ninebox_position TEXT;           -- e.g. '3_3' = high_perf_high_potential
ALTER TABLE performance_summary ADD COLUMN bsc_perspective_scores TEXT;     -- JSON: {"Financial":3.8,"Customer":4.2,...}
