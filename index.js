const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const {MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ecommercedatabase.la5qrjd.mongodb.net/?retryWrites=true&w=majority&appName=ecommerceDatabase`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        //await client.connect();
        // Send a ping to confirm a successful connection

        const foodsCollection = client
            .db('hungerSolutions')
            .collection('foods');

        const foodRequestCollection = client
            .db('hungerSolutions')
            .collection('foodRequest');

        // Foods related API
        app.get('/foods', async (req, res) => {
            const result = await foodsCollection.find().toArray();
            res.send(result);
        });

        app.get('/foods/:id', async (req, res) => {
            const id = req.params;
            console.log('query id', id);
            const query = {_id: new ObjectId(id)};
            const result = await foodsCollection.findOne(query);
            res.send(result);
        });

        app.post('/foods', async (req, res) => {
            const foodsData = req.body;
            const result = await foodsCollection.insertOne(foodsData);
            res.send(result);
        });

        app.get('/myfoods', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            const query = {email: email};
            const result = await foodsCollection.find(query).toArray();
            res.send(result);
        });

        app.delete('myfoods/:id', async (req, res) => {
            const id = req.params;
            console.log(id);
            const query = {_id: new ObjectId(id)};
            const result = await foodsCollection.deleteMany(query);
            res.send(result);
        });

        app.patch('/myfoods', async (req, res) => {
            const id = req.params;
            const data = req.body;
            const query = {_id: new ObjectId(id)};
            const updateDoc = {
                $set: {
                    food_image: data.food_image,
                    food_name: data.food_name,
                    food_quantity: data.food_quantity,
                    additional_notes: data.additional_notes,
                    date_added: data.date_added,
                },
            };
            const result = await foodsCollection.updateOne(query, updateDoc);
            res.send(result);
        });

        // Foods request related API
        app.get('/myrequest', async (req, res) => {
            const email = req.query.email;
            const filter = {email: email};
            const result = await foodRequestCollection.find(filter).toArray();
            res.send(result);
        });

        app.post('/myrequest', async (req, res) => {
            const requestFoods = req.body;
            const result = await foodRequestCollection.insertOne(requestFoods);
            res.send(result);
        });

        // await client.db('admin').command({ping: 1});
        console.log(
            'Pinged your deployment. You successfully connected to MongoDB!'
        );
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('hello server');
});

app.listen(port, () => {
    console.log(`server is running via http://localhost:${port}`);
});
