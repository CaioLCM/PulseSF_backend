import moongose from 'mongoose';
import 'dotenv/config'

const connectDB = async () => {
    try{
        await moongose.connect(process.env.MONGODB_URI!);
        console.log("Success!");
    } catch(error) {
        console.error("Error!", error);
    }
}

connectDB();

export default connectDB;