/*
  Warnings:

  - Made the column `minPurchaseAmount` on table `discount_codes` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `daily_metrics_date_idx` ON `daily_metrics`;

-- AlterTable
ALTER TABLE `discount_codes` MODIFY `minPurchaseAmount` DECIMAL(10, 2) NOT NULL;
