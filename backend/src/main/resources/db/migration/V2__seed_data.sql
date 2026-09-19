-- Seed data for Project KEYSTONE
-- All seed users share the password: Passw0rd!
-- (BCrypt hash below is for that password)

INSERT INTO customers (id, name, contact_email) VALUES
    (1, 'Meridian Facilities Management', 'ops@meridianfm.example'),
    (2, 'Harbor Point Offices', 'facilities@harborpoint.example');

INSERT INTO sites (id, customer_id, name, address) VALUES
    (1, 1, 'Meridian HQ Tower', '100 Meridian Ave, Springfield'),
    (2, 1, 'Meridian Distribution Center', '55 Industrial Way, Springfield'),
    (3, 2, 'Harbor Point Building A', '12 Harbor Rd, Bayview');

-- password: Passw0rd!
INSERT INTO users (id, name, email, password_hash, role, customer_id) VALUES
    (1, 'Dana Dispatcher', 'dispatcher@keystone.local', '$2b$10$GFQTrj./EEbEZbhHUucKFef59OS4CNmNjLzZ/xnlBr8WgXrf5.BV2', 'DISPATCHER', NULL),
    (2, 'Tariq Technician', 'technician@keystone.local', '$2b$10$GFQTrj./EEbEZbhHUucKFef59OS4CNmNjLzZ/xnlBr8WgXrf5.BV2', 'TECHNICIAN', NULL),
    (3, 'Mona Manager', 'manager@keystone.local', '$2b$10$GFQTrj./EEbEZbhHUucKFef59OS4CNmNjLzZ/xnlBr8WgXrf5.BV2', 'MANAGER', NULL),
    (4, 'Casey Customer', 'customer@keystone.local', '$2b$10$GFQTrj./EEbEZbhHUucKFef59OS4CNmNjLzZ/xnlBr8WgXrf5.BV2', 'CUSTOMER', 1),
    (5, 'Priya Technician', 'technician2@keystone.local', '$2b$10$GFQTrj./EEbEZbhHUucKFef59OS4CNmNjLzZ/xnlBr8WgXrf5.BV2', 'TECHNICIAN', NULL);

INSERT INTO parts (id, name, sku, unit_cost, stock_qty) VALUES
    (1, 'HVAC Air Filter 20x20', 'HVAC-FLT-2020', 12.50, 40),
    (2, 'Compressor Contactor 40A', 'ELEC-CTC-40A', 34.00, 15),
    (3, 'Copper Pipe Fitting 1/2in', 'PLMB-FIT-050', 3.25, 100),
    (4, 'Refrigerant R-410A (lb)', 'HVAC-REF-410A', 18.00, 25),
    (5, 'Circuit Breaker 20A', 'ELEC-BRK-20A', 9.75, 30);

INSERT INTO work_orders (id, code, title, description, priority, status, customer_id, site_id, assigned_to, created_by, sla_due_at) VALUES
    (1, 'WO-1001', 'AC unit not cooling - 3rd floor', 'Tenants report warm air from vents on floor 3.', 'HIGH', 'ASSIGNED', 1, 1, 2, 1, now() + interval '6 hours'),
    (2, 'WO-1002', 'Leaking pipe in break room', 'Water pooling under sink.', 'MEDIUM', 'NEW', 1, 1, NULL, 1, now() + interval '20 hours'),
    (3, 'WO-1003', 'Breaker tripping in loading dock', 'Breaker trips whenever the lift is used.', 'URGENT', 'IN_PROGRESS', 1, 2, 2, 1, now() + interval '2 hours'),
    (4, 'WO-1004', 'Routine HVAC filter replacement', 'Quarterly filter change.', 'LOW', 'COMPLETED', 2, 3, 5, 3, now() - interval '1 day');

INSERT INTO work_order_status_history (work_order_id, from_status, to_status, changed_by, note) VALUES
    (1, NULL, 'NEW', 1, 'Work order raised'),
    (1, 'NEW', 'ASSIGNED', 1, 'Assigned to Tariq'),
    (2, NULL, 'NEW', 1, 'Work order raised'),
    (3, NULL, 'NEW', 1, 'Work order raised'),
    (3, 'NEW', 'ASSIGNED', 1, 'Assigned to Tariq'),
    (3, 'ASSIGNED', 'IN_PROGRESS', 2, 'Started work'),
    (4, NULL, 'NEW', 3, 'Work order raised'),
    (4, 'NEW', 'ASSIGNED', 3, 'Assigned to Priya'),
    (4, 'ASSIGNED', 'IN_PROGRESS', 5, 'Started work'),
    (4, 'IN_PROGRESS', 'COMPLETED', 5, 'Filter replaced');

INSERT INTO part_usage (work_order_id, part_id, qty_used, logged_by) VALUES
    (4, 1, 2, 5);

INSERT INTO time_logs (work_order_id, technician_id, minutes, note) VALUES
    (4, 5, 45, 'Replaced filters and tested airflow'),
    (3, 2, 30, 'Diagnosing breaker fault');

-- keep sequences in sync with explicit ids inserted above
SELECT setval(pg_get_serial_sequence('customers','id'), (SELECT MAX(id) FROM customers));
SELECT setval(pg_get_serial_sequence('sites','id'), (SELECT MAX(id) FROM sites));
SELECT setval(pg_get_serial_sequence('users','id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('parts','id'), (SELECT MAX(id) FROM parts));
SELECT setval(pg_get_serial_sequence('work_orders','id'), (SELECT MAX(id) FROM work_orders));
