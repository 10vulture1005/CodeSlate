import User from '../models/usermodel.js';


export  const saveUser = (req, res) => {
    const { uid, email } = req.body;
    const user = new User({ uid, email });
    user.save();
    res.status(200).json({ message: "User saved successfully" });
    
}