import { Request, Response } from "express";
import model from "../data/model"

const message = model.message;

export const getMessages = async (req: Request, res: Response) => {
    try{
        const messages = await message.find({}).sort({timestamp: 1});
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({error: "Error to search mensages"});
    }
} 

