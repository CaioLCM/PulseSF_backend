import express from "express"

const MainServer = express();

MainServer.listen(3000, () => {console.log("Server on!")})

export default MainServer;