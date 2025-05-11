import express from 'express';
import router from './API/routes';
import "dotenv/config"

const app = express();

app.use(router);
app.listen(process.env.PORT, () => {console.log("Server on!")})