-- Add input_type to targets and performance_library.
-- input_type describes HOW a target's value is entered/measured (number, percentage, boolean, etc.)
-- This is distinct from measurement_type (scoring direction: higher_better / lower_better)
-- and from the org-level rating_scale (how achievement % converts to a final review rating).

ALTER TABLE targets ADD COLUMN input_type TEXT DEFAULT 'number';
ALTER TABLE performance_library ADD COLUMN input_type TEXT DEFAULT 'number';
