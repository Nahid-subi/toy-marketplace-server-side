require('dotenv').config()
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0mmsquj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const createToken = (user) => {
    if (!user || !user.uid) {
        throw new Error('User uid not provided');
    }

    try {
        const token = jwt.sign(
            { uid: user.uid },
            process.env.TOKEN_SECRET,
            { expiresIn: '7d' }
        );
        return token;
    } catch (error) {
        throw new Error('Failed to generate JWT token');
    }
};


const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send("Authorization header missing");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).send("Token missing");
    }

    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);

        if (!verified?.uid) {
            return res.status(403).send("You are not authorized");
        }

        req.user = verified.uid;
        next();
    } catch (err) {
        return res.status(403).send("Invalid or expired token");
    }
};


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const toyCollection = client.db('toyMarketUser').collection('allToys')
        const userCollection = client.db('toyMarketUser').collection('userCollection');




        // this post for add a toy
        app.post('/addtoy',verifyToken, async (req, res) => {
            const newToy = req.body; // Assuming your client sends the new toy data in the request body

            try {
                const result = await toyCollection.insertOne(newToy); // Use the new collection
                res.status(201).json(result);
            } catch (error) {
                res.status(500).send("Error adding the toy.");
            }
        });


        // this is get for all toy
        app.get('/alltoys', async (req, res) => {
            const cursor = toyCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        //this is get for all toy by id
        app.get('/alltoys/:id', async (req, res) => {
            const requestedId = req.params.id; // Get the id parameter from the request
            try {
                const cursor = toyCollection.find({ _id: new ObjectId(requestedId) });
                const result = await cursor.toArray();

                if (result.length > 0) {
                    res.send(result);
                } else {
                    res.status(404).send("Toy not found.");
                }
            } catch (error) {
                res.status(500).send("Error fetching the toy.");
            }
        });

        app.get('/all_toys/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const query = { "seller.email": email };  // Adjust the query to match the nested email field
                const cursor = toyCollection.find(query);
                const result = await cursor.toArray();
                res.status(200).json(result);
            } catch (error) {
                console.error('Error fetching data:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        // // this is for delete api delete my toy
        app.delete('/delete_toy/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await toyCollection.deleteOne(query);
            res.send(result)
        })

        app.put("/update_toy/:id", verifyToken,async (req, res) => {
            const id = req.params.id;
            const updateData = req.body;
            const result = await toyCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData },
                { upsert: true }
            );
            res.send(result)
        })




        // user manage api
        app.post("/user", async (req, res) => {
            const user = req.body;
            const token = createToken(user)
            const findUser = await userCollection.findOne({ email: user.email });
            if (findUser) {
                return res.send({
                    status: "success",
                    message: "Login success",
                    token
                })
            }
            await userCollection.insertOne(user);
            res.send(token)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('car market place is running')
})

app.listen(port, () => {
    console.log(`Car Doctor Server is running on port ${port}`)
})