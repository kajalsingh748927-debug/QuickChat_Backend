import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String ,required:true},
  price: { type: Number ,required:true},
  description: { type: String ,required:true},
  createdBy: {
     type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required:true
     }
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
