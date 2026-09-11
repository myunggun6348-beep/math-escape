CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`course` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`room` text,
	`student` text NOT NULL,
	`course` text NOT NULL,
	`started` integer NOT NULL,
	`state` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `runs_room` ON `runs` (`room`);--> statement-breakpoint
CREATE INDEX `runs_owner` ON `runs` (`owner`);