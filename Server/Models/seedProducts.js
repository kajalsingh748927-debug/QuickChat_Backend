// seedProducts.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./Product.js"; // adjust path as needed

dotenv.config();

// connect DB
await mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Dummy product data
const products = [
  {
    name: "iPhone 15",
    price: 79999,
    description: "Latest Apple iPhone with A17 Bionic chip",
    createdBy: "64fbd849f2e8a25b6c9c7a91", // replace with a real userId from DB
  },
  {
    name: "Samsung Galaxy S23",
    price: 69999,
    description: "Flagship Samsung smartphone with Snapdragon 8 Gen 2",
    createdBy: "64fbd849f2e8a25b6c9c7a91",
  },
  {
    name: "Sony WH-1000XM5",
    price: 29999,
    description: "Noise-cancelling wireless headphones",
    createdBy: "64fbd849f2e8a25b6c9c7a91",
  },
  {
    name: "MacBook Air M2",
    price: 119999,
    description: "Apple’s thin and light laptop with M2 chip",
    createdBy: "64fbd849f2e8a25b6c9c7a91",
  },
  {
    name: "Dell XPS 13",
    price: 99999,
    description: "Compact and powerful ultrabook",
    createdBy: "64fbd849f2e8a25b6c9c7a91",
  },
];

// Insert many
try {
  await Product.insertMany(products);
  console.log("Products seeded successfully!");
  mongoose.connection.close();
} catch (error) {
  console.error("Error seeding products:", error);
  mongoose.connection.close();
}
