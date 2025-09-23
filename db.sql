-- CREATE TABLE posts (
--   id integer primary key autoincrement not null,
--   title text not null,
--   author text not null,
--   date_added datetime not null,
--   content text not null,
--   file_key text not null
--   );

-- CREATE TABLE reminders (
--   id integer primary key autoincrement,
--   subject text not null,
--   title text not null,
--   deadline datetime not null,
--   date_added datetime not null,
--   description datetime not null,
--   reference text
--   , type text not null, file_key);

-- CREATE TABLE reviewer_comment_replies (
--   id integer primary key autoincrement not null,
--   author text not null,
--   content text not null,
--   likes text not null,
--   date_added datetime not null,
--   comment_id integer not null
--   );

-- CREATE TABLE reviewer_comments (
--   id integer primary key autoincrement,
--   author text not null,
--   content text not null,
--   likes integer not null,
--   date_added datetime not null,
-- 	reviewer_id integer not null
--   );

-- CREATE TABLE "reviewers"
--   (
--   id integer primary key autoincrement,
--   creator text not null,
--   reviewer text not null,
--   title text not null,
--   date_added text default (datetime('now')),
--   subject text default "None",
--   description text default "None",
--   rating integer default 0,
--   status integer default 1
--   );

CREATE TABLE reminder_suggestions (
  id integer primary key autoincrement,
  subject text not null,
  title text not null,
  deadline datetime not null,
  date_added datetime not null,
  description text not null,
  reference text,
  type text not null,
  file_key text,
  creator text default null
  );
