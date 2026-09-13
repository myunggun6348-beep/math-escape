CREATE TABLE `solutions` (
	`run_id` text NOT NULL,
	`question` integer NOT NULL,
	`drawing` text NOT NULL,
	`submitted` integer NOT NULL,
	`after_deadline` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`run_id`, `question`),
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE cascade
);
