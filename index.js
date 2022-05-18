import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import dayjs from 'dayjs'


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const mongoClient = new MongoClient(process.env.MONGO_URI);

app.post('/poll', async (req, res) => {
    const { title } = req.body;
    let { expireAt } = req.body;

    if (!expireAt) {
        let expiration = dayjs().add(30, 'day').format("YYYY-MM-DD HH:mm").toString()
        expireAt = expiration
        console.log(expireAt);
    }
    if (!title) {
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
    res.status(201).send("Criado com sucess");
});

app.get("/poll", async (req, res) => {
    try {
        await mongoClient.connect()
        const db = mongoClient.db(process.env.DATABASE);
        const polls = await db.collection("poll").find().toArray();
        console.log(polls);
        if (polls) {
            res.status(200).send(polls);
        } else {
            console.log("Nao foi possivel encontrar os polls")
            res.sendStatus(404);
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(422);
    }
});

app.post('/choice', async (req, res) => {
    const { title, poolId } = req.body;
    if (!title) {
        console.log("titulo nao pode ser vazio")
        res.status(422).send("titulo nao pode ser vazio");
    }
    try {
        await mongoClient.connect()
        const db = mongoClient.db(process.env.DATABASE);
        const poll = await db.collection("poll").findOne({ _id: new ObjectId(poolId) })
        const isTitleAtPoll = await db.collection("choice").findOne({ title: title })
        if (poll.expireAt) {
            //let validador = dayjs().isBefore(poll.expireAt)
            let validador = dayjs().isBefore(poll.expireAt)
            if (validador) {
                console.log("enquete aberta")
            } else {
                res.status(403).send("enquete já expirada")
            }
        }
        if (!poll) {
            res.status(404).send("nao existe esta enquete")
        }
        if (isTitleAtPoll) {
            res.status(409).send("Esta opçao ja existe")
        }
        await db.collection("choice").insertOne({
            title: title,
            poolId: poolId
        });
        res.status(201).send("Escolha cadastrada com sucesso");
    } catch (e) {
        console.log(e);
        res.sendStatus(422);
    }
});

app.get("/poll/:id/choice", async (req, res) => {
    const { id } = req.params;
    try {
        await mongoClient.connect()
        const db = mongoClient.db(process.env.DATABASE);
        const pool = await db.collection("poll").findOne({ _id: new ObjectId(id) });
        if (!pool) {
            res.status(405).send("Nao foi possivel encontrar a enquete");
        } else {
            const choices = await db.collection("choice").find({ poolId: id }).toArray();
            console.log(choices);
            if (choices.length !== 0) {
                res.status(200).send(choices);
            } else {
                res.status(404).send("Esta enquete ainda nao tem opçoes");
            }
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(422);
    }
});

app.post("/choice/:id/vote", async (req, res) => {
    const { id } = req.params;
    try {
        await mongoClient.connect()
        const db = mongoClient.db(process.env.DATABASE);
        const choice = await db.collection("choice").findOne({ _id: new ObjectId(id) });
        console.log(choice)
        if (!choice) {
            console.log("n")
            return res.status(404).send("Está opçao nao existe")
        } else {
            const poll = await db.collection("poll").findOne({ _id: new ObjectId(choice.poolId) })
            if (poll.expireAt) {
                let validador = dayjs().isBefore(poll.expireAt)
                if (validador) {
                    console.log("enquete aberta")
                } else {
                    return res.status(403).send("enquete já expirada")
                }
            }
            let createdAt = dayjs().format("YYYY-MM-DD HH:mm").toString()
            await db.collection("votes").insertOne({
                createdAt: createdAt,
                choiceId: id
            });
            return res.status(201).send("Voto cadastrado com sucesso");
        }
    } catch (e) {
        console.log(e);
        return res.sendStatus(422);
    }
});
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("Back-end funcionando, nao esquece de desligar a cada atualizaçao")
});