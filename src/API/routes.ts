import {Router, Request, Response} from "express"
const router = Router();
import connectDB from "../data/config";
import user from "../data/model";
import jwt from 'jsonwebtoken';

router.post('/logon', (req: Request, res: Response) => {
    connectDB();
    const {username, email, password} = req.body;
    res.status(200).send("Created with success!")
    const usercreated = new user({username: username, email: email, password: password})
    usercreated.save();
})

router.post('/login',  async (req: Request, res: Response) => {
    connectDB();
    const {email,  password} = req.body;
    console.log("Req recebida!")
    const check = await user.findOne({'email': email, 'password': password});
    if (check){
        const token = jwt.sign(
            {user: check},
            'meusegredo',
            {expiresIn: '1h'}
        )
        res.status(200).json(
            {message: 'Success!',
                token,
                user: {
                    email: email,
                    name: check.email
                }
            }
        );
    }
    else {
        res.status(400).send("Account does not exists!");
    }
})

export default router;