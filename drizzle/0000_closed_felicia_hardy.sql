CREATE TABLE `candidate_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`image_uri` text NOT NULL,
	`candidates_json` text NOT NULL,
	`selected_item_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `disposal_rules` (
	`municipality_id` text NOT NULL,
	`item_id` text NOT NULL,
	`category_name` text NOT NULL,
	`instructions` text NOT NULL,
	`notes` text,
	`official_url` text,
	PRIMARY KEY(`municipality_id`, `item_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_disposal_rules_municipality_item` ON `disposal_rules` (`municipality_id`,`item_id`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`aliases_json` text NOT NULL,
	`keywords_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_items_display_name` ON `items` (`display_name`);--> statement-breakpoint
CREATE TABLE `municipalities` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`version` text NOT NULL
);
