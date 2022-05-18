import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import { MongoClient} from "mongodb";
import dayjs from 'dayjs'


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const mongoClient = new MongoClient(process.env.MONGO_URI);

app.post('/poll', async (req, res) => {
    const { title} = req.body;
    let {expireAt} = req.body;

    if(!expireAt){
        let expiration = dayjs().add(30, 'day').format("YYYY-MM-DD HH:mm").toString()
        expireAt = expiration
        console.log(expireAt);
    }
    if(!title){
        console.log("titulo nao pode ser vazio")
        res.status(422).send("titulo nao pode ser vazio");
    }
    try {
        await mongoClient.connect()
        const db = mongoClient.db(process.env.DATABASE);
        await db.collection("poll").insertOne({
            title: title,
            expireAt: expireAt
        });
        res.status(201).send("Usuario cadastrado com sucesso");
    } catch (e) {
        console.error(e);
        res.sendStatus(422);
    }
    console.log(expireAt);
    res.status(201).send("Criado com sucess")
});



const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("Back-end funcionando, nao esquece de desligar a cada atualizaçao")
});