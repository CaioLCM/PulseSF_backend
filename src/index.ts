import express from 'express';
import router from './API/routes';
import "dotenv/config"
import cors from 'cors';
import {Server} from 'socket.io';
import http from 'http'
import createMessage from './controller/commands'
import model from './data/model';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

const userSockets = new Map<string, string>()

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(router);
io.on('connection', (socket) => {
    console.log("Novo cliente conectado:", socket.id)

    socket.on('register', (userEmail: string) => {
        if (userEmail){
            console.log(`User ${userEmail} is now on the game with socket ${socket.id}`)
            userSockets.set(userEmail, socket.id)
        }
    })

    socket.on("sendGlobalMessage", async (data) => {
        console.log("Mensagem global recebida: ", data)
        await createMessage(data)
        io.emit('newMessage', data)
    })

    socket.on('sendMessage', async (data) => {
        const {senderId, receiverId, text, timestamp} = data;
        console.log(`Private message of ${senderId} to ${receiverId}: ${text}`, data)
        try{
            const newMessage = new model.message({
                senderEmail: senderId,
                receiverEmail: receiverId,
                text: text,
                timestamp: timestamp
            });
            const savedMessage = await newMessage.save();

            console.log("Message saved with success")

            const receiverSocketId = userSockets.get(receiverId);

            if (receiverSocketId){
                io.to(receiverSocketId).emit("newMessage", savedMessage.toObject());
                console.log(`Send message to socket ${receiverSocketId}`)
            } else {
                console.log(`User ${receiverId} not online`)
            }
        } catch (error) {
            console.error("Error to process the private message:", error)
        }
    })

    socket.on('disconnect', () => {
        console.log("Cliente desconectado:", socket.id)
        for (const [email, id] of userSockets.entries()){
            if (id === socket.id){
                userSockets.delete(email)
                console.log(`Usuário ${email} removido do mapa de sockets`)
                break
            }
        }
    })
})

server.listen(process.env.PORT, () => {
    console.log("Server on!")
})

