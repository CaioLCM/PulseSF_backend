import express from 'express';
import router from './API/routes';
import "dotenv/config"
import cors from 'cors';
import {Server} from 'socket.io';
import http from 'http'
import createMessage from './controller/commands'

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(router);
io.on('connection', (socket) => {
    console.log("Novo cliente conectado:", socket.id)

    socket.on("sendGlobalMessage", async (data) => {
        console.log("Mensagem global recebida: ", data)
        await createMessage(data)
        io.emit('newMessage', data)
    })

    socket.on('sendMessage', (data) => {
        console.log("Mensagem recebida", data)
        io.emit('newMessage', data)
    })

    socket.on('disconnect', () => {
        console.log("Cliente desconectado:", socket.id)
    })
})

server.listen(process.env.PORT, () => {
    console.log("Server on!")
})

