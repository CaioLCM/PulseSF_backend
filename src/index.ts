import express, {Request, Response} from 'express';
import router from './API/routes';
import MainServer from './API/server';

const app = express();

app.use(MainServer);
app.use(router);