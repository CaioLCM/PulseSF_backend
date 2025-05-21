import {Router, Request, Response} from "express"
const router = Router();
import connectDB from "../data/config";
import model from "../data/model";
const {user, project} = model;
import jwt from 'jsonwebtoken';
import 'dotenv/config'
import { profile } from "console";

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
            await usercreated.save();
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
            {user: {email: check.email, nickname: check.username, profilePicture: check.profilePicture}},
            process.env.JWT_SECRET!,
            {expiresIn: '1h'}
        )
        res.status(200).json(
            {message: 'Success!',
                token,
                user: {
                    email: email,
                    name: check.username,
                    profile_picture: check.profilePicture
                }
            }
        );
    }
    
    else {
        res.status(400).send("Account does not exists!");
    }
})


router.post("/profileAdd", async (req, res) => {
    connectDB();
    const {email, image} = req.body
    const check = await user.updateOne({
        email: email
    }, {
        $set: {profilePicture: image}
    },
    {new: 
        true})
    if (check){
        res.status(200).json({message: "Success!"})
    }
    else {
        res.status(400).json({message: "Error!"})
    }
})

router.post("/projectCreate", async (req, res) => {
    connectDB();
    let {email, title, bio, members} = req.body;
    members = parseFloat(members);
    const projectCreated = await new project({projectName: title, projectBio: bio, projectNumberOfMembers: members, emailOwner: email})
    await projectCreated.save();
    res.status(200).send("Created with success!")
})

router.get("/projects", async (req, res) => {
    connectDB();
    const projects = await project.find();
    res.status(200).json(projects);
})

export default router;