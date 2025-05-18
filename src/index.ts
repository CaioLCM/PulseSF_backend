import express from 'express';
import router from './API/routes';
import "dotenv/config"
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(router);
app.listen(process.env.PORT, () => {console.log("Server on!")})