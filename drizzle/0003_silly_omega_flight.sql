CREATE TABLE `customRolePermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customRoleId` int NOT NULL,
	`permission` varchar(128) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customRolePermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customRoles_id` PRIMARY KEY(`id`),
	CONSTRAINT `customRoles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `customRoleId` int;--> statement-breakpoint
CREATE INDEX `customRole_perm_idx` ON `customRolePermissions` (`customRoleId`,`permission`);--> statement-breakpoint
CREATE INDEX `customRole_name_idx` ON `customRoles` (`name`);--> statement-breakpoint
CREATE INDEX `customRole_idx` ON `users` (`customRoleId`);