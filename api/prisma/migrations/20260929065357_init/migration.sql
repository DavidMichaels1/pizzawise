-- CreateEnum
CREATE TYPE "Size" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "Crust" AS ENUM ('THIN', 'STUFFED', 'GLUTEN_FREE', 'SOURDOUGH', 'PAN', 'NEAPOLITAN');

-- CreateEnum
CREATE TYPE "Sauce" AS ENUM ('TOMATO', 'WHITE', 'PESTO', 'BBQ', 'SAN_MARZANO');

-- CreateEnum
CREATE TYPE "Topping" AS ENUM ('MUSHROOM', 'ONION', 'OLIVES', 'EXTRA_CHEESE', 'PEPPERONI', 'PINEAPPLE', 'ANCHOVY', 'BUFFALO_MOZZARELLA', 'ARTICHOKE', 'TRUFFLE_OIL', 'PROSCIUTTO', 'CORN', 'JALAPENO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" "Size" NOT NULL,
    "crust" "Crust" NOT NULL,
    "sauce" "Sauce" NOT NULL,
    "toppings" "Topping"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "size" "Size" NOT NULL,
    "crust" "Crust" NOT NULL,
    "sauce" "Sauce" NOT NULL,
    "toppings" "Topping"[],
    "pizzeriaId" TEXT NOT NULL,
    "pizzeriaName" TEXT NOT NULL,
    "pizzeriaLat" DOUBLE PRECISION NOT NULL,
    "pizzeriaLng" DOUBLE PRECISION NOT NULL,
    "deliveryLat" DOUBLE PRECISION NOT NULL,
    "deliveryLng" DOUBLE PRECISION NOT NULL,
    "priceAgorot" INTEGER NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "etaMinutes" INTEGER NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
