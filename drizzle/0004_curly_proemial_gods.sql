CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`relatedResourceType` varchar(64),
	`relatedResourceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `passwordResets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResets_id` PRIMARY KEY(`id`),
	CONSTRAINT `passwordResets_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `postCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `postCategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `postCategories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `postCategoryMappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`categoryId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `postCategoryMappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `postComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `postComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `postShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`sharedWithUserId` int NOT NULL,
	`sharedByUserId` int NOT NULL,
	`canEdit` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `postShares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `postVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`versionNumber` int NOT NULL,
	`editedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `postVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `temporaryRoleAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`temporaryRole` enum('admin','editor','viewer') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`grantedBy` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `temporaryRoleAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `version` int DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX `notification_userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notification_read_idx` ON `notifications` (`read`);--> statement-breakpoint
CREATE INDEX `reset_token_idx` ON `passwordResets` (`token`);--> statement-breakpoint
CREATE INDEX `reset_userId_idx` ON `passwordResets` (`userId`);--> statement-breakpoint
CREATE INDEX `mapping_postId_idx` ON `postCategoryMappings` (`postId`);--> statement-breakpoint
CREATE INDEX `mapping_categoryId_idx` ON `postCategoryMappings` (`categoryId`);--> statement-breakpoint
CREATE INDEX `comment_postId_idx` ON `postComments` (`postId`);--> statement-breakpoint
CREATE INDEX `comment_userId_idx` ON `postComments` (`userId`);--> statement-breakpoint
CREATE INDEX `share_postId_idx` ON `postShares` (`postId`);--> statement-breakpoint
CREATE INDEX `share_sharedWith_idx` ON `postShares` (`sharedWithUserId`);--> statement-breakpoint
CREATE INDEX `version_postId_idx` ON `postVersions` (`postId`);--> statement-breakpoint
CREATE INDEX `tempRole_userId_idx` ON `temporaryRoleAssignments` (`userId`);--> statement-breakpoint
CREATE INDEX `tempRole_expiresAt_idx` ON `temporaryRoleAssignments` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `userSessions` (`userId`);--> statement-breakpoint
CREATE INDEX `session_token_idx` ON `userSessions` (`token`);