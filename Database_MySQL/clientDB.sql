-- Client meeting scheduling demonstration (MySQL 8.0.16+ / MariaDB 10.6+).
-- Select a NEW EMPTY database before loading this file. It never drops a database.
-- All contacts are synthetic; authentication credentials do not belong in this model.
SET NAMES utf8mb4;
SET SESSION group_concat_max_len = 65535;

CREATE TABLE cldetails (
    clid INT PRIMARY KEY,
    clname VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    CONSTRAINT ck_client_id CHECK (clid > 0),
    CONSTRAINT ck_client_name CHECK (CHAR_LENGTH(TRIM(clname)) > 0),
    CONSTRAINT ck_client_email CHECK (CHAR_LENGTH(email) = CHAR_LENGTH(TRIM(email)) AND email LIKE '%_@_%._%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE empdetails (
    empid INT PRIMARY KEY,
    empname VARCHAR(100) NOT NULL,
    empemail VARCHAR(254) NOT NULL UNIQUE,
    department VARCHAR(80) NOT NULL,
    title VARCHAR(80) NOT NULL,
    CONSTRAINT ck_employee_id CHECK (empid > 0),
    CONSTRAINT ck_employee_name CHECK (CHAR_LENGTH(TRIM(empname)) > 0),
    CONSTRAINT ck_employee_email CHECK (CHAR_LENGTH(empemail) = CHAR_LENGTH(TRIM(empemail)) AND empemail LIKE '%_@_%._%'),
    CONSTRAINT ck_employee_department CHECK (CHAR_LENGTH(TRIM(department)) > 0),
    CONSTRAINT ck_employee_title CHECK (CHAR_LENGTH(TRIM(title)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meetings (
    meetingid INT PRIMARY KEY,
    meetingtopic VARCHAR(110) NOT NULL,
    meetingdate DATE NOT NULL,
    clid INT NOT NULL,
    CONSTRAINT ck_meeting_id CHECK (meetingid > 0),
    CONSTRAINT ck_meeting_topic CHECK (CHAR_LENGTH(TRIM(meetingtopic)) > 0),
    CONSTRAINT ck_meeting_date CHECK (meetingdate >= '1000-01-01'),
    CONSTRAINT fk_meeting_client FOREIGN KEY (clid) REFERENCES cldetails(clid) ON DELETE RESTRICT,
    INDEX ix_client_schedule (clid, meetingdate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meetinghosts (
    meetingid INT NOT NULL,
    empid INT NOT NULL,
    PRIMARY KEY (meetingid, empid),
    CONSTRAINT fk_host_meeting FOREIGN KEY (meetingid) REFERENCES meetings(meetingid) ON DELETE CASCADE,
    CONSTRAINT fk_host_employee FOREIGN KEY (empid) REFERENCES empdetails(empid) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

START TRANSACTION;
INSERT INTO cldetails (clid, clname, email) VALUES
(1, 'Zora Whitaker', 'zora.whitaker@example.com'),
(2, 'Cassian Brooks', 'cassian.brooks@example.com'),
(3, 'Marisol Vance', 'marisol.vance@example.com'),
(4, 'Dashiell Hayes', 'dashiell.hayes@example.com'),
(5, 'Linnea Mercer', 'linnea.mercer@example.com'),
(6, 'Tobias Calloway', 'tobias.calloway@example.com'),
(7, 'Amara Winslow', 'amara.winslow@example.com'),
(8, 'Soren Beckett', 'soren.beckett@example.com');
-- Demonstrate removal before scheduling references exist.
DELETE FROM cldetails WHERE clid = 7;

INSERT INTO empdetails (empid, empname, empemail, department, title) VALUES
(1, 'John Carlo', 'john.carlo@example.com', 'Executive', 'Operations Manager'),
(2, 'Ronna Joice', 'ronna.joice@example.com', 'Executive', 'Lead Designer'),
(3, 'Kaner Von', 'kaner.von@example.com', 'Executive', 'CEO');

-- Fixed dates make seed data reproducible; use real dates for a live schedule.
INSERT INTO meetings (meetingid, meetingtopic, meetingdate, clid) VALUES
(1, 'Preliminary Design Overview', '2026-11-01', 1),
(2, 'Sprint Review', '2026-11-04', 2),
(3, 'Final Design Overview', '2026-11-15', 2),
(4, 'Preliminary Design Overview', '2026-11-02', 3),
(5, 'Sprint Review', '2026-11-06', 4),
(6, 'Final Design Overview', '2026-11-18', 4),
(7, 'Preliminary Design Overview', '2026-11-03', 5),
(8, 'Sprint Review', '2026-11-08', 6),
(9, 'Final Design Overview', '2026-11-22', 6),
(10, 'Sprint Review', '2026-11-09', 8),
(11, 'Final Design Overview', '2026-11-24', 8);

-- Assign stable employee IDs, not nonunique display names.
INSERT INTO meetinghosts (meetingid, empid)
SELECT m.meetingid, e.empid
FROM meetings m JOIN empdetails e ON
    (m.meetingtopic = 'Preliminary Design Overview' AND e.empid = 2) OR
    (m.meetingtopic = 'Sprint Review' AND e.empid IN (1, 2)) OR
    (m.meetingtopic = 'Final Design Overview' AND e.empid IN (2, 3));
COMMIT;

-- One client attendee plus the host count. No redundant stored attendee total.
-- LEFT JOIN retains meetings that have not yet been assigned hosts.
CREATE VIEW meeting_summary AS
SELECT m.meetingid, m.clid, m.meetingtopic, m.meetingdate,
       COUNT(mh.empid) AS hostcount,
       COUNT(mh.empid) + 1 AS numberofattendees,
       COALESCE(GROUP_CONCAT(CONCAT(e.empname, ' (', e.title, ')')
                 ORDER BY e.empid SEPARATOR ', '), 'Unassigned') AS meetinghosts
FROM meetings m
LEFT JOIN meetinghosts mh ON mh.meetingid = m.meetingid
LEFT JOIN empdetails e ON e.empid = mh.empid
GROUP BY m.meetingid, m.clid, m.meetingtopic, m.meetingdate;

CREATE VIEW client_meeting_emails AS
SELECT c.clid, c.clname, c.email,
       CASE WHEN COUNT(ms.meetingid) = 0 THEN CONCAT('Hello ', c.clname, ',\n\nNo meetings are currently scheduled.')
       ELSE CONCAT('Hello ', c.clname, ',\n\nHere are your scheduled meetings:\n',
           GROUP_CONCAT(CONCAT('- ', ms.meetingtopic, ' on ', DATE_FORMAT(ms.meetingdate, '%M %d, %Y'),
             ' | Meeting Hosts: ', ms.meetinghosts)
             ORDER BY ms.meetingdate, ms.meetingid SEPARATOR '\n'),
           '\n\nThank you,\nExecutive Team') END AS emailpreview
FROM cldetails c LEFT JOIN meeting_summary ms ON ms.clid = c.clid
GROUP BY c.clid, c.clname, c.email;

CREATE VIEW employee_schedules AS
SELECT e.empid, e.empname, e.title,
       COALESCE(GROUP_CONCAT(CONCAT(m.meetingtopic, ' with ', c.clname, ' <', c.email, '>',
         ' on ', DATE_FORMAT(m.meetingdate, '%M %d, %Y'))
         ORDER BY m.meetingdate, m.meetingid SEPARATOR '\n'), 'No meetings assigned') AS meetings
FROM empdetails e LEFT JOIN meetinghosts mh ON mh.empid = e.empid
LEFT JOIN meetings m ON m.meetingid = mh.meetingid
LEFT JOIN cldetails c ON c.clid = m.clid
GROUP BY e.empid, e.empname, e.title;

SELECT c.clid AS `Client ID`, c.clname AS `Client Name`, ms.*
FROM cldetails c JOIN meeting_summary ms ON ms.clid = c.clid
ORDER BY c.clid, ms.meetingdate, ms.meetingid;
SELECT * FROM client_meeting_emails WHERE clid IN (6, 3) ORDER BY clid;
SELECT * FROM employee_schedules ORDER BY empid;
