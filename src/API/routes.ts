import { Router, Request, Response } from "express";
const router = Router();
import connectDB from "../data/config";
import model from "../data/model";
const user = model.user;
const project = model.project;
import jwt from "jsonwebtoken";
import "dotenv/config";
import { profile } from "console";
import { connect } from "http2";
import { json } from "stream/consumers";
import { strict } from "assert";

connectDB()

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
  const {project_name, member_list} = req.body;
  const check = await project.updateOne(
    {
      projectName: project_name,
    },
    {
      $set: { member_list: member_list },
    },
  );
  
  if (check.matchedCount == 0){
    return res.status(404).json({message: "Project not found"});
  }
  
  if(check.modifiedCount > 0 || (check.matchedCount > 0 && check.modifiedCount === 0)){
    res.status(200).json({message: "Updated member list!"})
  }
  
  else {
    return res.status(400).json({message: "Not possible to update the list"})
  }
  
});

router.get("/searchUsers", async (req, res) => {
  const check = await user.find({});
  const users_info: { email: string; profile_picture: string }[] = [];
  check.map((pr) => users_info.push({ email: pr["email"], profile_picture: pr["profilePicture"] != null? pr["profilePicture"] : "No profile picture" }));
  res.status(200)
  .json(
    {
      users_info
    }
  )
})

router.post("/searchUser", async (req, res) => {
  console.log("Search user working!!!")
  console.log(req.body['email'])
  const check = await user.findOne({
    email: req.body['email']
  })
  if (check) {
    const bio = check.get("bio") == null ? "Add your info here!!!" : check.get("bio")
    res.status(200).json({
      "bio": bio 
    });
  } else {
    console.log("User not found");
    res.status(400);
  }
})

router.post("/updateBio", async (req, res) => {
  const {email, bio} = req.body;
  const check = await user.updateOne({
    email: email
  },
  
  {
    $set: {bio: bio}
  },
  {new: true}
);
console.log(check.matchedCount)
res.status(200).json({ message: "Bio updated!" });
});

router.post("/addFriend", async (req, res) => {
  const requests = [];
  const {email_req, email_res} = req.body;
  
  try{
    const previous = await user.findOne({
      email: email_res
    })
    
    const previous_requests = previous?.get("add_request")
    
    if(previous_requests != null){
      previous_requests.forEach((add_req) => {
        requests.push(add_req)
      })
    }
    
    requests.push(email_req)
    
    const check = await user.updateOne({
      email: email_res
    },
    {
      $set: {add_request: requests}
    }
  )
  res.status(200)
} catch (erro: any) {
  console.log("Error! " + erro)
  res.status(400)
}

})

router.post("/checkFriend", async (req: Request, res: Response) => {
  const {email_req, email_res} = req.body
  const check = await user.findOne({
    email: email_res
  })
  console.log(check?.email)
  check?.add_request?.forEach((add_req) => {
    if (add_req == email_req){
      res.status(200).end()
    }
  })

  res.status(400).end()
}
)

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
export default router;
