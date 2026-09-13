// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {sqliteTable,text,integer,index,primaryKey} from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{code:text('code').primaryKey(),owner:text('owner').notNull(),course:text('course').notNull(),unit:text('unit').notNull().default('all'),difficulty:text('difficulty').notNull().default('standard'),created:integer('created').notNull()});
export const runs=sqliteTable('runs',{id:text('id').primaryKey(),owner:text('owner').notNull(),room:text('room'),student:text('student').notNull(),course:text('course').notNull(),started:integer('started').notNull(),state:text('state').notNull(),version:integer('version').notNull().default(0)},t=>[index('runs_room').on(t.room),index('runs_owner').on(t.owner)]);

export const solutions=sqliteTable('solutions',{runId:text('run_id').notNull().references(()=>runs.id,{onDelete:'cascade'}),question:integer('question').notNull(),drawing:text('drawing').notNull(),submitted:integer('submitted').notNull(),afterDeadline:integer('after_deadline').notNull().default(0),revision:integer('revision').notNull().default(1)},t=>[primaryKey({columns:[t.runId,t.question]})]);
