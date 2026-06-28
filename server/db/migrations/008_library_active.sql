-- Add is_active flag to performance_library so library items can be deactivated without deletion
-- Per BUSINESS_LOGIC.md §14: library items are NEVER deleted, only deactivated

ALTER TABLE performance_library ADD COLUMN is_active INTEGER DEFAULT 1;
