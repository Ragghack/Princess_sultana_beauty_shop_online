/*
  Warnings:

  - The values [GROWTH_SERUM,HAIR_BUNDLE,CONDITIONER,TREATMENT] on the enum `products_category` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `products` MODIFY `category` ENUM('HAIR_OIL', 'SHAMPOO', 'MASK', 'BUTTER') NOT NULL;
