import jwt from 'jsonwebtoken'


//check token every time

const io=  (req, res, next)=>{
 try{
const token = req.cookies.token;

//check token
 if(!token){
    return res.status(401).json({message:"access denied . No token provided"});
 }
 //check 
 const decoded= jwt.verify(token, process.env.JWT_SECRET);

 //// send to req, all godd
 req.user=decoded;
 console.log(req.user);
next();
}
catch (err) {
    res.status(500).json({ message: "Invalid token" });
}
}





export default authMiddleware;