import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import { MongoClient} from "mongodb";


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const mongoClient = new MongoClient(process.env.MONGO_URI);




const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("Back-end funcionando, nao esquece de desligar a cada atualizaçao")
});