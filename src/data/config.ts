import moongose from 'mongoose';

const uri = "mongodb+srv://caiolenemagalhaes:caio123@cluster0.tsksbk0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
    try{
        await moongose.connect(uri);
        console.log("Success!");
    } catch(error) {
        console.error("Error!", error);
    }
}
connectDB()