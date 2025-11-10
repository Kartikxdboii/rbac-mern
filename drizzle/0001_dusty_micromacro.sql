CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`resourceType` varchar(64) NOT NULL,
	`resourceId` int,
	`allowed` boolean NOT NULL DEFAULT true,
	`denialReason` varchar(255),
	`correlationId` varchar(64),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`authorId` int NOT NULL,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`visibility` enum('private','internal','public') NOT NULL DEFAULT 'private',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rolePermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` enum('admin','editor','viewer') NOT NULL,
	`permission` varchar(128) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rolePermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','editor','viewer') NOT NULL DEFAULT 'viewer';--> statement-breakpoint
CREATE INDEX `userId_idx` ON `auditLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `auditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `resourceType_idx` ON `auditLogs` (`resourceType`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `auditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `authorId_idx` ON `posts` (`authorId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `posts` (`status`);--> statement-breakpoint
CREATE INDEX `visibility_idx` ON `posts` (`visibility`);--> statement-breakpoint
CREATE INDEX `role_permission_idx` ON `rolePermissions` (`role`,`permission`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);