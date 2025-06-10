import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    username: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    createdAt: {type: Date, default: Date.now},
    profilePicture: {type: String, required: false, default: "No profile picture"},
    bio: {type: String, required: false, default: ""},
    friends: [{type: String}],
    add_request: [{type: String}]
})

const projectSchema = new mongoose.Schema({
    projectName: {type: String, required: true},
    projectBio: {type: String, required: true},
    projectNumberOfMembers: {type: Number, required: true},
    emailOwner: {type: String, required: true},
    member_list: [{type: String}]
})

const message = new mongoose.Schema({
    "_id": {type: String, required: true},
    "senderEmail": {type: String, required: true},
    "receiverEmail": {type: String, required: true},
    "text": {type: String, required: true},
    "timestamp": {type: Date, default: Date.now}
})

const user = mongoose.model('User', userSchema);
const project = mongoose.model('Project', projectSchema);

export default {user, project};