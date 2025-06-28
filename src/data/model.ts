import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  profilePicture: {
    type: String,
    required: false,
    default: "No profile picture",
  },
  bio: { type: String, required: false, default: "" },
  friends: [{ type: String }],
  add_request: [{ type: String }],
  tags: [
    {
      tagname: { type: String, required: true },
      color: { type: String, required: true },
    },
  ],
  todolist: [
    {
      title: { type: String, required: true },
      checked: { type: Boolean, default: false },   
      tag: [{ tagname: { type: String }, color: { type: String } }],
    },
  ],
});

const projectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  projectBio: { type: String, required: true },
  projectNumberOfMembers: { type: Number, required: true },
  emailOwner: { type: String, required: true },
  member_list: [{ type: String }],
});

const messageSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true },
  receiverEmail: { type: String },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const eventSchema = new mongoose.Schema({
  creatorEmail: { type: String, required: true },
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  timestamp: { type: String, required: true },
  upvotes: [{ type: String }],
  downvotes: [{ type: String }],
});

const user = mongoose.model("User", userSchema);
const project = mongoose.model("Project", projectSchema);
const message = mongoose.model("Message", messageSchema);
const event = mongoose.model("Event", eventSchema);

export default { user, project, message, event };
