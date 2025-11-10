-- Add new fields to posts table
ALTER TABLE `posts` ADD `tags` text;
ALTER TABLE `posts` ADD `version` int NOT NULL DEFAULT 1;

-- User sessions table
CREATE TABLE `userSessions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `token` varchar(255) NOT NULL UNIQUE,
  `ipAddress` varchar(45),
  `userAgent` text,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `session_userId_idx` (`userId`),
  INDEX `session_token_idx` (`token`)
);

-- Password reset tokens
CREATE TABLE `passwordResets` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `token` varchar(255) NOT NULL UNIQUE,
  `expiresAt` timestamp NOT NULL,
  `used` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `reset_token_idx` (`token`),
  INDEX `reset_userId_idx` (`userId`)
);

-- Notifications
CREATE TABLE `notifications` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `type` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `read` boolean NOT NULL DEFAULT false,
  `relatedResourceType` varchar(64),
  `relatedResourceId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `notification_userId_idx` (`userId`),
  INDEX `notification_read_idx` (`read`)
);

-- Post versions
CREATE TABLE `postVersions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `postId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `versionNumber` int NOT NULL,
  `editedBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `version_postId_idx` (`postId`)
);

-- Post comments
CREATE TABLE `postComments` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `postId` int NOT NULL,
  `userId` int NOT NULL,
  `content` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `comment_postId_idx` (`postId`),
  INDEX `comment_userId_idx` (`userId`)
);

-- Post shares
CREATE TABLE `postShares` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `postId` int NOT NULL,
  `sharedWithUserId` int NOT NULL,
  `sharedByUserId` int NOT NULL,
  `canEdit` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `share_postId_idx` (`postId`),
  INDEX `share_sharedWith_idx` (`sharedWithUserId`)
);

-- Post categories
CREATE TABLE `postCategories` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(64) NOT NULL UNIQUE,
  `description` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Post category mappings
CREATE TABLE `postCategoryMappings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `postId` int NOT NULL,
  `categoryId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `mapping_postId_idx` (`postId`),
  INDEX `mapping_categoryId_idx` (`categoryId`)
);

-- Temporary role assignments
CREATE TABLE `temporaryRoleAssignments` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `temporaryRole` enum('admin', 'editor', 'viewer') NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `grantedBy` int NOT NULL,
  `reason` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `tempRole_userId_idx` (`userId`),
  INDEX `tempRole_expiresAt_idx` (`expiresAt`)
);
