import {Router, Request, Response} from "express"
const router = Router();
import connectDB from "../data/config";
import user from "../data/model";
import jwt from 'jsonwebtoken';
import 'dotenv/config'

router.post('/logon', async (req: Request, res: Response) => {
    connectDB();
    const {username, email, password} = req.body;
    try{
        const check = await user.findOne({'email': email});
        if (check){
            res.status(400).send("Not possible to create the account!");
        }
        else {
            const usercreated = new user({username: username, email: email, password: password});
            usercreated.save();
            res.status(200).send("Created with success!");
        }

    }catch{
        res.status(400).send("Not possible to create the account!")
    }
})

router.post('/login',  async (req: Request, res: Response) => {
    connectDB();
    const {email,  password} = req.body;
    console.log("Req recebida!")
    const check = await user.findOne({'email': email, 'password': password});
    if (check){
        const token = jwt.sign(
            {user: {email: check.email, nickname: check.username}},
            process.env.JWT_SECRET!,
            {expiresIn: '1h'}
        )
        res.status(200).json(
            {message: 'Success!',
                token,
                user: {
                    email: email,
                    name: check.username
                }
            }
        );
    }
    else {
        res.status(400).send("Account does not exists!");
    }
})

export default router;