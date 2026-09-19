-- The application inserts a work order first (to get its generated id),
-- then immediately updates it with a human-readable code derived from that id,
-- both within the same request. NOT NULL on the first insert broke that flow.
-- UNIQUE is preserved - Postgres allows multiple NULLs in a UNIQUE column,
-- so this does not weaken uniqueness once the code is set.
ALTER TABLE work_orders ALTER COLUMN code DROP NOT NULL;
