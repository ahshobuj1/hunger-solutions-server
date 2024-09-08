const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const {MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const port = process.env.PORT || 5000;

// middlewares
app.use(cookieParser());
app.use(express.json());
/* app.use(
    cors({
        origin: [
            'http://localhost:5173',
            'https://hunger-solutions-3d07f.web.app',
            'https://hunger-solutions-3d07f.firebaseapp.com',
        ],
        credentials: true,
    })
); */
app.use(
    cors({
        origin: ['http://localhost:5173'],
        credentials: true,
    })
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ecommercedatabase.la5qrjd.mongodb.net/?retryWrites=true&w=majority&appName=ecommerceDatabase`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

// Middlewares
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    console.log('cookies token ', token);

    if (!token) {
        return res.status(402).send({message: 'unauthorized'});
    }

    jwt.verify(token, process.env.SECRET_KEY_JWT, (err, decoded) => {
        if (err) {
            return res.status(402).send({message: 'unauthorized'});
        }

        req.user = decoded;
        next();
    });
};

// Cookie options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? true : false,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
};

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

        //Auth related API
        app.post('/jwt', async (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.SECRET_KEY_JWT, {
                expiresIn: '1h',
            });
            res.cookie('token', token, cookieOptions).send(token);
        });

        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', {...cookieOptions, maxAge: 0}).send({
                success: true,
            });
        });

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

        app.get('/myfoods', verifyToken, async (req, res) => {
            const email = req.query.email;
            console.log(email);
            console.log(req.user.email);

            if (req?.user?.email !== req?.query?.email) {
                return res.status(403).send({message: 'forbidden access'});
            }

            const query = {email: email};
            const result = await foodsCollection.find(query).toArray();
            res.send(result);
        });

        app.delete('/myfoods/:id', async (req, res) => {
            const id = req.params;
            console.log(id);
            const query = {_id: new ObjectId(id)};
            const result = await foodsCollection.deleteOne(query);
            res.send(result);
        });

        app.patch('/myfoods/:id', async (req, res) => {
            const id = req.params;
            const data = req.body;
            const query = {_id: new ObjectId(id)};
            const updateDoc = {
                $set: {
                    food_image: data.food_image,
                    food_name: data.food_name,
                    food_quantity: data.food_quantity,
                    additional_notes: data.additional_notes,
                    expiry_datetime: data.expiry_datetime,
                    pickup_location: data.pickup_location,
                },
            };
            const result = await foodsCollection.updateOne(query, updateDoc);
            res.send(result);
        });

        // Foods request related API
        app.get('/myrequest', verifyToken, async (req, res) => {
            const email = req?.query?.email;

            if (req?.user?.email !== req?.query?.email) {
                return res.status(403).send({message: 'forbidden access'});
            }

            const query = {email: email};
            const result = await foodRequestCollection.find(query).toArray();
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
