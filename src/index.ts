import express from 'express';
import router from './API/routes';
import "dotenv/config"

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(router);
app.listen(process.env.PORT, () => {console.log("Server on!")})