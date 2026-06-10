-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Reset the database so this script can be run from the beginning
-- without conflicts from existing tables, duplicate primary keys,
-- or old relationship records.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

drop database if exists clientDB;
create database clientDB;

use clientdb;


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Create the client table.
-- Each client has one unique client id, one name, one email,
-- and one password.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

create table cldetails(
    clid int primary key,
    clname varchar(40) not null,
    email varchar(40) unique not null,
    `password` varchar(40) not null
);


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Insert the starting client records.
-- Amara is included first so the delete statement below can
-- demonstrate removing a client before meetings are created.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

insert into cldetails(clid, clname, email, `password`)
values
(1, 'Zora Whitaker', 'zora.whitaker@example.com', 'Zora@4821'),
(2, 'Cassian Brooks', 'cassian.brooks@example.com', 'Cassian@7392'),
(3, 'Marisol Vance', 'marisol.vance@example.com', 'Marisol@6158'),
(4, 'Dashiell Hayes', 'dashiell.hayes@example.com', 'Dashiell@2947'),
(5, 'Linnea Mercer', 'linnea.mercer@example.com', 'Linnea@8563'),
(6, 'Tobias Calloway', 'tobias.calloway@example.com', 'Tobias@3719'),
(7, 'Amara Winslow', 'amara.winslow@example.com', 'Amara@6402'),
(8, 'Soren Beckett', 'soren.beckett@example.com', 'Soren@9185');


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Remove Amara because she chose another firm.
-- This is done before creating meetings so no meeting records
-- will reference her client id.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

delete from cldetails
where clid = 7;


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Create the employee table.
-- These employees are internal staff members who can host
-- client meetings.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

create table empdetails(
    empid int primary key,
    empname varchar(40) not null,
    empemail varchar(40) unique not null,
    emppassword varchar(40) not null,
    department varchar(20) not null,
    title varchar(20) not null
);


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Insert the employee records.
-- These employees will later be connected to meetings through
-- the meetinghosts junction table.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

insert into empdetails(empid, empname, empemail, emppassword, department, title)
values
(1, 'John Carlo', 'john.carlo@example.com', 'Zora@4821', 'Executive', 'Operations Manager'),
(2, 'Ronna Joice', 'ronna.joice@example.com', 'Cassian@7392', 'Executive', 'Lead Designer'),
(3, 'Kaner Von', 'kaner.von@example.com', 'Marisol@6158', 'Executive', 'CEO');


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Create the meetings table.
-- This creates a many-to-one relationship between meetings
-- and clients because many meetings can belong to one client.
--
-- The clid column is a foreign key, so every meeting must be
-- connected to an existing client in cldetails.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

create table meetings(
    meetingid int primary key,
    meetingtopic varchar(110),
    numberofattendees int not null,
    meetingdate date not null,
    clid int not null,
    foreign key(clid) references cldetails(clid)
);


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Insert the meeting records.
-- Each meeting belongs to one client through clid.
--
-- Preliminary meetings have one host and one client attendee.
-- Sprint reviews and final design overviews have two hosts
-- and one client attendee.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

insert into meetings(meetingid, meetingtopic, numberofattendees, meetingdate, clid)
values
(1, 'Preliminary Design Overview', 2, date_add(curdate(), interval 7 day), 1),

(2, 'Sprint Review', 3, date_add(curdate(), interval 10 day), 2),
(3, 'Final Design Overview', 3, date_add(curdate(), interval 21 day), 2),

(4, 'Preliminary Design Overview', 2, date_add(curdate(), interval 8 day), 3),

(5, 'Sprint Review', 3, date_add(curdate(), interval 12 day), 4),
(6, 'Final Design Overview', 3, date_add(curdate(), interval 24 day), 4),

(7, 'Preliminary Design Overview', 2, date_add(curdate(), interval 9 day), 5),

(8, 'Sprint Review', 3, date_add(curdate(), interval 14 day), 6),
(9, 'Final Design Overview', 3, date_add(curdate(), interval 28 day), 6),

(10, 'Sprint Review', 3, date_add(curdate(), interval 15 day), 8),
(11, 'Final Design Overview', 3, date_add(curdate(), interval 30 day), 8);


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Create the meetinghosts junction table.
-- This creates a many-to-many relationship between meetings
-- and employees because one meeting can have multiple hosts,
-- and one employee can host multiple meetings.
--
-- The combined primary key prevents the same employee from
-- being assigned to the same meeting more than once.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

create table meetinghosts(
    meetingid int not null,
    empid int not null,
    primary key(meetingid, empid),
    foreign key(meetingid) references meetings(meetingid),
    foreign key(empid) references empdetails(empid)
);


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Assign employees as meeting hosts based on the meeting topic.
--
-- Preliminary design overview meetings are hosted by Ronna.
-- Sprint review meetings are hosted by Ronna and John.
-- Final design overview meetings are hosted by Ronna and Kaner.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

insert into meetinghosts(meetingid, empid)
select
    m.meetingid,
    e.empid
from meetings m
inner join empdetails e
    on (
        m.meetingtopic = 'Preliminary Design Overview'
        and e.empname = 'Ronna Joice'
    )
    or (
        m.meetingtopic = 'Sprint Review'
        and e.empname in('Ronna Joice', 'John Carlo')
    )
    or (
        m.meetingtopic = 'Final Design Overview'
        and e.empname in('Ronna Joice', 'Kaner Von')
    );


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- View the raw meeting-host relationship records.
-- Each row means one employee is assigned as a host for one
-- specific meeting.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

select *
from meetinghosts;


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- View the full client meeting report.
-- Each meeting appears as one row, and group_concat combines
-- multiple meeting hosts into one readable cell.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

select
    c.clid as `Client ID`,
    c.clname as `Client Name`,
    m.meetingid as `Meeting ID`,
    m.meetingtopic as `Topic`,
    group_concat(
        concat(e.empname, ' (', e.title, ')')
        separator ', '
    ) as `Meeting Hosts`,
    m.meetingdate as `Date`
from cldetails c
inner join meetings m
    on c.clid = m.clid
inner join meetinghosts mh
    on m.meetingid = mh.meetingid
inner join empdetails e
    on mh.empid = e.empid
group by
    c.clid,
    c.clname,
    m.meetingid,
    m.meetingtopic,
    m.meetingdate
order by
    c.clid,
    m.meetingdate;


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Create an email-ready meeting summary for Tobias.
-- This returns one row with the client's email address and a
-- readable message showing all scheduled meetings, dates,
-- and meeting hosts.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

select
    c.clid as `Client ID`,
    c.clname as `Client Name`,
    c.email as `Client Email`,
    concat(
        'Hello ', c.clname, ',\n\n',
        'Here are your scheduled meetings:\n',
        group_concat(
            concat(
                '- ', meeting_summary.meetingtopic,
                ' on ', date_format(meeting_summary.meetingdate, '%M %d, %Y'),
                ' | Meeting Hosts: ', meeting_summary.meetinghosts
            )
            order by meeting_summary.meetingdate
            separator '\n'
        ),
        '\n\nThank you,\nExecutive Team'
    ) as `Email Preview`
from cldetails c
inner join(
    select
        m.clid,
        m.meetingid,
        m.meetingtopic,
        m.meetingdate,
        group_concat(
            concat(e.empname, ' (', e.title, ')')
            separator ', '
        ) as meetinghosts
    from meetings m
    inner join meetinghosts mh
        on m.meetingid = mh.meetingid
    inner join empdetails e
        on mh.empid = e.empid
    group by
        m.clid,
        m.meetingid,
        m.meetingtopic,
        m.meetingdate
) as meeting_summary
    on c.clid = meeting_summary.clid
where c.clname = 'Tobias Calloway'
group by
    c.clid,
    c.clname,
    c.email;


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- Create an email-ready meeting summary for Marisol.
-- This returns one row with the client's email address and a
-- readable message showing all scheduled meetings, dates,
-- and meeting hosts.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

select
    c.clid as `Client ID`,
    c.clname as `Client Name`,
    c.email as `Client Email`,
    concat(
        'Hello ', c.clname, ',\n\n',
        'Here are your scheduled meetings:\n',
        group_concat(
            concat(
                '- ', meeting_summary.meetingtopic,
                ' on ', date_format(meeting_summary.meetingdate, '%M %d, %Y'),
                ' | Meeting Hosts: ', meeting_summary.meetinghosts
            )
            order by meeting_summary.meetingdate
            separator '\n'
        ),
        '\n\nThank you,\nExecutive Team'
    ) as `Email Preview`
from cldetails c
inner join(
    select
        m.clid,
        m.meetingid,
        m.meetingtopic,
        m.meetingdate,
        group_concat(
            concat(e.empname, ' (', e.title, ')')
            separator ', '
        ) as meetinghosts
    from meetings m
    inner join meetinghosts mh
        on m.meetingid = mh.meetingid
    inner join empdetails e
        on mh.empid = e.empid
    group by
        m.clid,
        m.meetingid,
        m.meetingtopic,
        m.meetingdate
) as meeting_summary
    on c.clid = meeting_summary.clid
where c.clname = 'Marisol Vance'
group by
    c.clid,
    c.clname,
    c.email;


-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- View each employee's meeting schedule.
-- Each employee appears as one row, and group_concat combines
-- the meetings they host with the related client names,
-- client email addresses, and meeting dates.
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

select
    e.empid as `Employee ID`,
    concat(e.empname, ' (', e.title, ')') as `Employee`,
    group_concat(
        concat(
            m.meetingtopic,
            ' with ', c.clname,
            ' <', c.email, '>',
            ' on ', date_format(m.meetingdate, '%M %d, %Y')
        )
        order by m.meetingdate
        separator '\n'
    ) as `Meetings, Clients, and Dates`
from empdetails e
inner join meetinghosts mh
    on e.empid = mh.empid
inner join meetings m
    on mh.meetingid = m.meetingid
inner join cldetails c
    on m.clid = c.clid
group by
    e.empid,
    e.empname,
    e.title
order by
    e.empid;