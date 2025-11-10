ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
CREATE INDEX `password_idx` ON `users` (`passwordHash`);