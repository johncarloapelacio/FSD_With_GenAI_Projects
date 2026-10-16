"""Run integration checks against a real MySQL/MariaDB service using its CLI.
Creates and removes only a uniquely named disposable database.
"""
from pathlib import Path
import os
import re
import subprocess
import uuid

SCHEMA = "clientdb_quality_test_" + uuid.uuid4().hex
assert re.fullmatch(r"clientdb_quality_test_[a-f0-9]{32}", SCHEMA)
COMMAND = [os.getenv("MYSQL_BIN", "mysql"), "--protocol=TCP", "--batch", "--skip-column-names",
           "--default-character-set=utf8mb4", "--host=" + os.getenv("MYSQL_HOST", "127.0.0.1"),
           "--port=" + os.getenv("MYSQL_PORT", "3306"), "--user=" + os.getenv("MYSQL_USER", "root")]
ENV = dict(os.environ)
ENV["MYSQL_PWD"] = os.getenv("MYSQL_PASSWORD", "")
CHECKS = 0


def execute(sql, database=True, expected_codes=()):
    global CHECKS
    command = COMMAND + (["--database=" + SCHEMA] if database else [])
    # Credentials are passed via environment, never command arguments or printed.
    result = subprocess.run(command, input="SET SESSION sql_mode='STRICT_ALL_TABLES,ONLY_FULL_GROUP_BY,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'; SET SESSION group_concat_max_len=65535;\n" + sql,
                            text=True, encoding="utf-8", capture_output=True, env=ENV, timeout=30)
    if expected_codes:
        assert result.returncode != 0, "Expected database to reject: " + sql
        match = re.search(r"ERROR (\d+)", result.stderr)
        assert match and int(match.group(1)) in expected_codes, f"Unexpected rejection: {result.stderr.strip()}"
        CHECKS += 1
    elif result.returncode:
        raise RuntimeError(result.stderr.strip())
    return result.stdout.strip()


def equal(sql, expected):
    global CHECKS
    actual = execute(sql)
    assert actual == str(expected), f"{sql}: expected {expected!r}, received {actual!r}"
    CHECKS += 1


def main():
    global CHECKS
    created = False
    try:
        execute(f"CREATE DATABASE `{SCHEMA}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;", database=False)
        created = True
        execute(Path(__file__).with_name("clientDB.sql").read_text(encoding="utf-8-sig"))
        CHECKS += 1
        equal("SELECT COUNT(*) FROM cldetails;", 7)
        equal("SELECT COUNT(*) FROM empdetails;", 3)
        equal("SELECT COUNT(*) FROM meetings;", 11)
        equal("SELECT COUNT(*) FROM meetinghosts;", 19)
        equal("SELECT COUNT(*) FROM meeting_summary;", 11)
        equal("SELECT numberofattendees FROM meeting_summary WHERE meetingid=1;", 2)
        equal("SELECT numberofattendees FROM meeting_summary WHERE meetingid=2;", 3)
        equal("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND column_name LIKE '%password%';", 0)
        equal("SELECT COUNT(*) FROM client_meeting_emails WHERE clid=6 AND email='tobias.calloway@example.com' AND emailpreview LIKE '%Sprint Review%' AND emailpreview LIKE '%Final Design Overview%';", 1)
        equal("SELECT COUNT(*) FROM client_meeting_emails WHERE clid=3 AND emailpreview LIKE '%Preliminary Design Overview%';", 1)
        equal("SELECT GROUP_CONCAT(empid ORDER BY empid) FROM meetinghosts WHERE meetingid=3;", "2,3")
        for sql, expected_codes in [
            ("INSERT INTO cldetails VALUES (99,'Other','ZORA.WHITAKER@example.com');", (1062,)),
            ("INSERT INTO cldetails VALUES (99,'   ','valid@example.com');", (3819, 4025)),
            ("INSERT INTO cldetails VALUES (99,'Other','invalid-email');", (3819, 4025)),
            ("INSERT INTO cldetails VALUES (99,'Other','other@example.com ');", (3819, 4025)),
            ("INSERT INTO meetings VALUES (99,'Orphan','2026-12-01',999);", (1452,)),
            ("INSERT INTO meetings VALUES (99,'','2026-12-01',1);", (3819, 4025)),
            ("INSERT INTO meetings VALUES (99,'Invalid date','2026-02-30',1);", (1292,)),
            ("INSERT INTO meetinghosts VALUES (1,2);", (1062,)),
            ("INSERT INTO meetinghosts VALUES (1,999);", (1452,)),
            ("DELETE FROM cldetails WHERE clid=1;", (1451,)),
            ("DELETE FROM empdetails WHERE empid=2;", (1451,))
        ]:
            execute(sql, expected_codes=expected_codes)
        execute("INSERT INTO cldetails VALUES (99,'Unscheduled','unscheduled@example.com'); INSERT INTO empdetails VALUES (99,'New host','new@example.com','Support','Advisor'); INSERT INTO meetings VALUES (99,'Unassigned','2026-12-01',99);")
        equal("SELECT meetinghosts FROM meeting_summary WHERE meetingid=99;", "Unassigned")
        equal("SELECT meetings FROM employee_schedules WHERE empid=99;", "No meetings assigned")
        execute("INSERT INTO meetinghosts VALUES (99,99);")
        equal("SELECT numberofattendees FROM meeting_summary WHERE meetingid=99;", 2)
        execute("DELETE FROM meetings WHERE meetingid=99;")
        equal("SELECT COUNT(*) FROM meetinghosts WHERE meetingid=99;", 0)
        equal("SELECT COUNT(*) FROM client_meeting_emails WHERE clid=99 AND emailpreview LIKE '%No meetings%';", 1)
        # Loading into a populated schema must fail closed, preserving existing data.
        execute(Path(__file__).with_name("clientDB.sql").read_text(encoding="utf-8-sig"), expected_codes=(1050,))
        equal("SELECT COUNT(*) FROM cldetails;", 8)
        print(f"PASS: {CHECKS} real-database integration checks ({execute('SELECT VERSION();')}).")
    finally:
        if created:
            execute(f"DROP DATABASE `{SCHEMA}`;", database=False)


if __name__ == "__main__":
    main()
