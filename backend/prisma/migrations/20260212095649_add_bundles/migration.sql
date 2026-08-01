/*
  Warnings:

  - A unique constraint covering the columns `[cartId,productId,bundleId]` on the table `cart_items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,productId,bundleId]` on the table `wishlist_items` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_productId_fkey`;

-- DropIndex
DROP INDEX `cart_items_cartId_productId_key` ON `cart_items`;

-- DropIndex
DROP INDEX `wishlist_items_userId_productId_key` ON `wishlist_items`;

-- AlterTable
ALTER TABLE `cart_items` ADD COLUMN `bundleId` VARCHAR(191) NULL,
    ADD COLUMN `isBundle` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `productId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `bundleId` VARCHAR(191) NULL,
    ADD COLUMN `bundleItems` TEXT NULL,
    ADD COLUMN `bundleName` VARCHAR(191) NULL,
    ADD COLUMN `isBundle` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `productId` VARCHAR(191) NULL,
    MODIFY `productSku` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `wishlist_items` ADD COLUMN `bundleId` VARCHAR(191) NULL,
    ADD COLUMN `isBundle` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `productId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `bundles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `shortDescription` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK') NOT NULL DEFAULT 'ACTIVE',
    `bundlePrice` DECIMAL(10, 2) NOT NULL,
    `originalPrice` DECIMAL(10, 2) NOT NULL,
    `savingsAmount` DECIMAL(10, 2) NOT NULL,
    `savingsPercent` DECIMAL(5, 2) NOT NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `salesCount` INTEGER NOT NULL DEFAULT 0,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `bundles_slug_key`(`slug`),
    INDEX `bundles_slug_idx`(`slug`),
    INDEX `bundles_status_idx`(`status`),
    INDEX `bundles_featured_idx`(`featured`),
    FULLTEXT INDEX `bundles_name_description_idx`(`name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bundle_items` (
    `id` VARCHAR(191) NOT NULL,
    `bundleId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `productName` VARCHAR(191) NOT NULL,
    `productPrice` DECIMAL(10, 2) NOT NULL,
    `productImage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bundle_items_bundleId_idx`(`bundleId`),
    INDEX `bundle_items_productId_idx`(`productId`),
    UNIQUE INDEX `bundle_items_bundleId_productId_key`(`bundleId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `cart_items_bundleId_idx` ON `cart_items`(`bundleId`);

-- CreateIndex
CREATE UNIQUE INDEX `cart_items_cartId_productId_bundleId_key` ON `cart_items`(`cartId`, `productId`, `bundleId`);

-- CreateIndex
CREATE INDEX `order_items_bundleId_idx` ON `order_items`(`bundleId`);

-- CreateIndex
CREATE INDEX `wishlist_items_bundleId_idx` ON `wishlist_items`(`bundleId`);

-- CreateIndex
CREATE UNIQUE INDEX `wishlist_items_userId_productId_bundleId_key` ON `wishlist_items`(`userId`, `productId`, `bundleId`);

-- AddForeignKey
ALTER TABLE `bundle_items` ADD CONSTRAINT `bundle_items_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `bundles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bundle_items` ADD CONSTRAINT `bundle_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `bundles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `bundles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlist_items` ADD CONSTRAINT `wishlist_items_bundleId_fkey` FOREIGN KEY (`bundleId`) REFERENCES `bundles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
