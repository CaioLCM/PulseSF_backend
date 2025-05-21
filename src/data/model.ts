import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {type: String, require: true},
    email: {type: String, require: true, unique: true},
    password: {type: String, require: true},
    createdAt: {type: Date, default: Date.now},
    profilePicture: {type: String, require: false}
})

const user = mongoose.model('User', userSchema);

export default user;