import {Router, Request, Response} from "express"
const router = Router();
import connectDB from "../data/config";
import user from "../data/model";

connectDB()

router.post('/logon', (req: Request, res: Response) => {
    const {username, email, password} = req.body;
    res.status(200).send("Created with success!")
    const usercreated = new user({username: username, email: email, password: password})
    usercreated.save();
})

export default router;