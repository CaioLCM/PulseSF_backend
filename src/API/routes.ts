import { Router, Request, Response } from "express";
const router = Router();
import connectDB from "../data/config";
import model from "../data/model";
const user = model.user;
const project = model.project;
const event = model.event;
import jwt from "jsonwebtoken";
import "dotenv/config";
import { profile } from "console";
import { connect } from "http2";
import { json } from "stream/consumers";
import { strict } from "assert";
import { getMessages } from "../controller/messageController";

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

router.post("/searchPicture", async (req: Request, res: Response) => {
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
  const users_info: { email: string; profile_picture: string }[] = [];
  check.map((pr) =>
    users_info.push({
      email: pr["email"],
      profile_picture:
        pr["profilePicture"] != null
          ? pr["profilePicture"]
          : "No profile picture",
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

router.get("/messages", getMessages);

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
/////////////////////////////////////////////////////////////////////////////////////

export default router;
