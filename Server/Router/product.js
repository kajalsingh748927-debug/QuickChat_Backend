import express from "express";
import Product from "../Models/auth/Product.js";
import authMiddleware from "../middleware/authenticate.js"; // tumhare JWT verify ka code

const router = express.Router();

// ✅ Add Product
router.get("/", async (req, res) => {
  try {

    const user = await Product.find();
    if(!user){
      return res.status(400).json({
        sucess:false, 
        message:"not work properly",
      });
    }

    res.status(200).json({ success: true,
       message: "data was printed suceess fully",
         user
       });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.post("/:id/new", async (req, res) => {
  try {
     const {id}= req.params;
    const {name ,price,description }= req.body;
    const product =  new Product({name ,price,description, createdBy:id});
    if(!product){
      return res.status(400).json({sucess:false, message:"not product have"});
    }
    await product.save();

    res.status(200).json({ success: true,
       message: "product added suceessfully",
       product
       });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/delete/:product", authMiddleware,async (req, res) => {
  try {

     const  product =req.params.product;

    const data =  await Product.findById(product);

    if(data.createdBy.toString() !==req.user.id){
            return res.status(403).json({ success: false, message: "Not authorized" });

    }
    if(!data) return res.status(400).json({success:false, message:"user not exist"});
    await data.deleteOne();
    res.status(200).json({ success: true,
       message: "data delete suceessfully"
       });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/:id", async (req, res) => {
  try {
     const {id}= req.params;
    const product =  await Product.findById({id});
    if(!product){
      return res.status(400).json({sucess:false, message:"not product have"});
    }
    console.log(product);

    res.status(200).json({ success: true,
       message: "product added suceessfully",
       product
       });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
