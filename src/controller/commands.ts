import model from "../data/model"
const message = model.message;
async function createMessage(data: any) {
     const message_created = await new message({
            "senderEmail": data["senderEmail"],
            "text": data["text"]
        })
    await message_created.save();
}

export default createMessage; 
