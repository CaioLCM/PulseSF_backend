import { Router, Request, Response, response } from "express";
const router = Router();
import connectDB from "../data/config";
import model from "../data/model";
const user = model.user;
const project = model.project;
const event = model.event;
import jwt from "jsonwebtoken";
import "dotenv/config";
import { profile, timeStamp } from "console";
import { connect } from "http2";
import { json } from "stream/consumers";
import { strict } from "assert";
import { getGlobalMessages } from "../controller/messageController";

connectDB();

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log("Req recebida!");
  const check = await user.findOne({ email: email, password: password });
  if (check) {
    const token = jwt.sign(
      {
        user: {
          email: check.email,
          nickname: check.username,
          profilePicture: check.profilePicture,
        },
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      message: "Success!",
      token,
      user: {
        email: email,
        name: check.username,
        profile_picture: check.profilePicture,
      },
    });
  } else {
    res.status(400).send("Account does not exists!");
  }
});

router.post("/logon", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  try {
    const check = await user.findOne({ email: email });
    if (check) {
      res.status(400).send("Not possible to create the account!");
    } else {
      const usercreated = new user({
        username: username,
        email: email,
        password: password,
      });
      await usercreated.save();
      res.status(200).send("Created with success!");
    }
  } catch {
    res.status(400).send("Not possible to create the account!");
  }
});

router.post("/profileAdd", async (req: Request, res: Response) => {
  const { email, image } = req.body;
  const check = await user.updateOne(
    {
      email: email,
    },
    {
      $set: { profilePicture: image },
    },
    { new: true }
  );
  if (check) {
    res.status(200).json({ message: "Success!" });
  } else {
    res.status(400).json({ message: "Error!" });
  }
});

router.post("/projectCreate", async (req: Request, res: Response) => {
  let { email, title, bio, members } = req.body;
  members = parseFloat(members);
  const projectCreated = await new project({
    projectName: title,
    projectBio: bio,
    projectNumberOfMembers: members,
    emailOwner: email,
  });
  await projectCreated.save();
  res.status(200).send("Created with success!");
});

router.get("/projects", async (req: Request, res: Response) => {
  const projects = await project.find();
  console.log(projects);
  res.status(200).json(projects);
});

router.post("/removeProject", async (req: Request, res: Response) => {
  await project.deleteOne({ projectName: req.body["name"] });
  res.status(200).json({ message: "OK" });
});

router.post("/removeUser", async (req: Request, res: Response) => {
  const {email, project_name} = req.body;
  const projects = await project.findOne({projectName: project_name})
  if (email == projects?.emailOwner){
    await project.deleteOne({ projectName: project_name });
    res.status(200).json({ message: "OK" });
  }
  else {
    const members = projects?.member_list
    members?.splice(members.indexOf(email), 1)
    await project.findOneAndUpdate({projectName: project_name}, {member_list: members})
    res.status(200).end()
  }
})

router.post("/searchPicture", async (req: Request, res: Response) => {
  const {email} = req.body;
  console.log(email)
  const picture = await user.findOne({ email: req.body["email"] });
  res.status(200).json({ picture: picture!["profilePicture"] });
});

router.post("/addMember", async (req: Request, res: Response): Promise<any> => {
  const { project_name, member_list } = req.body;
  const check = await project.updateOne(
    {
      projectName: project_name,
    },
    {
      $set: { member_list: member_list },
    }
  );

  if (check.matchedCount == 0) {
    return res.status(404).json({ message: "Project not found" });
  }

  if (
    check.modifiedCount > 0 ||
    (check.matchedCount > 0 && check.modifiedCount === 0)
  ) {
    res.status(200).json({ message: "Updated member list!" });
  } else {
    return res.status(400).json({ message: "Not possible to update the list" });
  }
});

router.get("/searchUsers", async (req, res) => {
  const check = await user.find({});
  const users_info: { email: string; profile_picture: string, friends: String[] }[] = [];
  check.map((pr) =>
    users_info.push({
      email: pr["email"],
      profile_picture:
        pr["profilePicture"] != null
          ? pr["profilePicture"]
          : "No profile picture",
      friends: pr["friends"]
    })
  );
  res.status(200).json({
    users_info,
  });
});

router.post("/searchUser", async (req, res) => {
  console.log("Search user working!!!");
  console.log(req.body["email"]);
  const check = await user.findOne({
    email: req.body["email"],
  });
  if (check) {
    const bio =
      check.get("bio") == null ? "Add your info here!!!" : check.get("bio");
    res.status(200).json({
      bio: bio,
    });
  } else {
    console.log("User not found");
    res.status(400);
  }
});

router.post("/updateBio", async (req, res) => {
  const { email, bio } = req.body;
  const check = await user.updateOne(
    {
      email: email,
    },

    {
      $set: { bio: bio },
    },
    { new: true }
  );
  console.log(check.matchedCount);
  res.status(200).json({ message: "Bio updated!" });
});

///////////////////////////////////////////////////////////

router.post("/addFriend", async (req, res) => {
  const requests = [];
  const { email_req, email_res } = req.body;

  try {
    const previous = await user.findOne({
      email: email_res,
    });

    const previous_requests = previous?.get("add_request");

    if (previous_requests != null) {
      previous_requests.forEach((add_req) => {
        requests.push(add_req);
      });
    }

    requests.push(email_req);

    const check = await user.updateOne(
      {
        email: email_res,
      },
      {
        $set: { add_request: requests },
      }
    );
    res.status(200);
  } catch (erro: any) {
    console.log("Error! " + erro);
    res.status(400);
  }
});

router.post("/checkFriend", async (req: Request, res: Response) => {
  const { email_req, email_res } = req.body;
  const check = await user.findOne({
    email: email_res,
  });
  check?.add_request?.forEach((add_req) => {
    if (add_req == email_req) {
      res.status(200).end();
    }
  });

  res.status(400).end();
});

router.post("/searchRequests", async (req: Request, res: Response) => {
  const { email } = req.body;
  const check = await user.findOne({
    email: email,
  });

  if (check?.add_request != null) {
    res.status(200).json({
      requests: check.add_request,
    });
  } else {
    res.status(400).end();
  }
});

router.post("/removeFriendRequest", async (req: Request, res: Response) => {
  const { email_request, email_response } = req.body;
  const check = await user.findOne({
    email: email_response,
  });
  if (check?.add_request != null) {
    const req_list = check.add_request;
    req_list.splice(req_list.indexOf(email_request), 1);
    const check_ = await user.findOneAndUpdate(
      {
        email: email_response,
      },
      {
        add_request: req_list,
      }
    );
  }
});

router.post("/acceptFriendRequest", async (req, res) => {
  const { email_req, email_res } = req.body;
  const friends1 = [];
  const user1 = await user.findOne({
    email: email_req,
  });
  if (user1?.friends != null) {
    user1.friends.forEach((friend) => {
      friends1.push(friend);
    });
  }
  friends1.push(email_res);
  await user.findOneAndUpdate(
    {
      email: email_req,
    },
    { friends: friends1 }
  );

  const friends2 = [];
  const user2 = await user.findOne({
    email: email_res,
  });
  if (user2?.friends != null) {
    user2.friends.forEach((friend) => {
      friends2.push(friend);
    });
  }
  friends2.push(email_req);
  await user.findOneAndUpdate(
    {
      email: email_res,
    },
    { friends: friends2 }
  );
  res.status(200);
});

router.post("/searchFriends", async (req, res) => {
  console.log("chegou aqui")
  const { email_user } = req.body;
  const foundUser = await user.findOne({ email: email_user });
  console.log("Amigos")
  console.log(foundUser?.friends)
  res.status(200).json({ friends: foundUser?.friends ?? [] });
})

router.post("/removeFriend", async (req: Request, res: Response) => {
  const {email_req, email_res} = req.body;
  const foundUser1 = await user.findOne({email: email_req});
  const user1_friends = foundUser1?.friends;
  user1_friends?.splice(user1_friends.indexOf(email_res), 1);
  await user.findOneAndUpdate({
    email: email_req
  }, {
    friends: user1_friends
  })

  const foundUser2 = await user.findOne({email: email_res});
  const user2_friends = foundUser2?.friends;
  user2_friends?.splice(user2_friends.indexOf(email_req), 1);
  await user.findOneAndUpdate(
    {email: email_res},
    {friends: user2_friends}
  )
  res.status(200).end();
})

router.get("/Globalmessages", getGlobalMessages);

router.post("/addEvent", async (req, res) => {
  const {email_req, title, description, Date} = req.body
  const new_event = new event(
    {
      title: title,
      description: description,
      creatorEmail: email_req,
      timestamp: Date
    }
  )
  await new_event.save();
  res.status(200).end()
})

router.get("/getEvents", async (req: Request, res: Response) => {
  const events = await event.find({})
  res.status(200).json(events);
})

router.post("/UpVote", async (req, res) => {
  const {email, title} = req.body
  const Event = await event.find({
    title: title
  })
  const last_upVotes = Event[0]["upvotes"]
  if (last_upVotes.indexOf(email) == -1){
    last_upVotes.push(email)
      await event.findOneAndUpdate(
    { title: title },
    { upvotes: last_upVotes }
  )
  res.status(200).json({"message": "Upvote added with success!"})
  }
  else{
    last_upVotes.splice(last_upVotes.indexOf(email), 1)
    await event.findOneAndUpdate(
    { title: title },
    { upvotes: last_upVotes }
  )
    res.status(200).json({"message": "Upvote deleted with success!"})
  }
})

router.post("/DownVote", async(req, res) => {
   const {email, title} = req.body
  const Event = await event.find({
    title: title
  })
  const last_downVotes = Event[0]["downvotes"]
  if (last_downVotes.indexOf(email) == -1){
    last_downVotes.push(email)
      await event.findOneAndUpdate(
    { title: title },
    { downvotes: last_downVotes }
  )
  res.status(200).json({"message": "Downvote added with success!"})
  }
  else{
    last_downVotes.splice(last_downVotes.indexOf(email), 1)
    await event.findOneAndUpdate(
    { title: title },
    { downvotes: last_downVotes }
  )
    res.status(200).json({"message": "Downvote deleted with success!"})
  }
})

router.post("/removeEvent", async (req, res) => {

    const {title} = req.body;
    await event.findOneAndDelete(
      { title: title }
    )
    res.status(200).end()
})

router.post("/loadToDoList", async (req, res) => {
  const {email} = req.body;
  const user_account = await user.findOne({
    email: email
  })
  res.status(200).send(user_account?.todolist)
})

router.post("/updateToDoList", async (req, res) => {
  const {email, title} = req.body;
  const toDo_list = []
  const user_account = await user.findOne({
    email: email
  })
  if (user_account?.todolist && user_account.todolist.length > 0){
    toDo_list.push(...user_account.todolist)
  }

  toDo_list.push({title: title, checked: false})
  await user.findOneAndUpdate({
    email: email
  },
  {
    todolist: toDo_list
  })
  res.status(200).end()
})

router.post("/updateCheckState", async (req: Request, res: Response) => {
  const {email, title} = req.body;
  const toDo_list: { title: string; checked: boolean }[] = [];
  const user_account = await user.findOne({
    email: email
  });
  if (user_account?.todolist) {
    toDo_list.push(...user_account.todolist.map((item: any) => ({ title: item.title, checked: item.checked })));
  }
  toDo_list.forEach((E) => {
    
    if (E["title"] == title) {
      E["checked"] = !E["checked"];
    }
  });
  await user.findOneAndUpdate({
    email: email
  }, {
    todolist: toDo_list
  })
})

router.post("/removeToDoItem", async (req: Request, res: Response) => {
  const {email, title} = req.body
  const user_account = await user.findOne({
    email: email
  })
  const toDo_list: { title: string; checked: boolean }[] = [];
  if (user_account && user_account.todolist) {
    toDo_list.push(...user_account.todolist.map((item: any) => ({ title: item.title, checked: item.checked })));
  }
  const index = toDo_list.findIndex((E) => E.title === title);
  if (index !== -1) {
    toDo_list.splice(index, 1);
  }
  await user.findOneAndUpdate(
    { email: email },
    { todolist: toDo_list }
  );
  res.status(200).end();
});

router.post("/createTag", async (req, res) => {
  const {email, title, color} = req.body
  const user_account = await user.findOne({
    email: email
  })
  const tag_list: {tagname: String, color: String}[] = []
    if (user_account && user_account.tags) {
    tag_list.push(...user_account.tags.map((item: any) => ({ tagname: item.tagname, color: item.color })));
  }
  tag_list.push({"tagname": title, "color": color})
  await user.findOneAndUpdate({
    email: email
  },
  {
    tags: tag_list
  }
)
res.status(200).end()
})

router.post("/loadTags", async (req: Request, res: Response) => {
  const {email} = req.body
  const user_account = await user.findOne({
    email: email
  })
  const tag_list: {tagname: String, color: String}[] = []
  if (user_account && user_account.tags) {
    tag_list.push(...user_account.tags.map((item: any) => ({ tagname: item.tagname, color: item.color })));
  }
  res.status(200).send(tag_list)
})

router.post("/addTagToToDoEvent", async (req: Request, res: Response) => {
  const {email, title, tagName, color} = req.body
  const info = await user.findOne({
    email: email
  })

  const event = info?.todolist.find((item: any) => item.title === title)
  if (event) {
    event.tag.splice(0, 1);
    if (tagName != null && tagName != "None"){
      event.tag.push({tagname: tagName, color: color});
    }
  }

  if (!info?.username){
    info!.username = "Default"
  }

  info?.save()

  res.status(200).end()
})

router.post("/send-private-message", async (req: Request, res: Response) => {
  const { senderEmail, receiverEmail, text } = req.body;
  if (!senderEmail || !receiverEmail || !text) {
    res.status(400).json({ message: "Missing required fields." });
    return;
  }

  try {
    const newMessage = new model.message({
      senderEmail,
      receiverEmail,
      text,
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).send({ message: "Error sending message", error });
  }
});

router.post("/get-private-messages", async (req: Request, res: Response) => {
  const {user1Email, user2Email} = req.body;
  if (!user1Email || !user2Email){
    res.status(400).json({message: "Missing user emails"});
    return;
  }

  try {
    const messages = await model.message.find({
      $or: [
        {senderEmail: user1Email, receiverEmail: user2Email},
        {senderEmail: user2Email, receiverEmail: user1Email}
      ]
    }).sort({timeStamp: 'asc'});
    res.status(200).json(messages);
  } catch (error){
    res.status(500).json({message: "Error fetching messages", error});
  }
});

router.post("/addPoints", async (req: Request, res: Response) => {
  const {email, points} = req.body;
  const user_account = await user.findOne({
    email: email
  });
  if (user_account) {
    const newPoints = (user_account.points || 0) + points;
    await user.findOneAndUpdate(
      { email: email },
      { points: newPoints }
    );
    res.status(200).json({ message: "Points added successfully!" });
  } else {
    res.status(404).json({ message: "User not found!" });
  }
});

router.get("/getPoints", async (req: Request, res: Response) => {
  const {email} = req.body;
  const user_account = await user.findOne({
    email: email
  });
  if (user_account) {
    res.status(200).json({ points: user_account.points || 0 });
  } else {
    res.status(404).json({ message: "User not found!" });
  }
});
/////////////////////////////////////////////////////////////////////////////////////

export default router;
