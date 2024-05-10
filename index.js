const express = require('express');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// CORS
const corsOption = {
    origin: ['http://localhost:5173','http://localhost:5174'],
    credentials: true,
    optionSuccessStatus: 200,
}

// middle wire
app.use(cors(corsOption))
app.use(express.json())


// mongo DB



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uwjhzip.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

        // database 
        const assignmentCollection = client.db('brainDB').collection('allAssign');

        // get all assignment
        app.get('/allPost',async(req,res)=>{
            const result = await assignmentCollection.find().toArray()
            res.send(result)
        } )

        // get posted assiment by id 
        app.delete('/userPost/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id : new ObjectId(id) };
            const result = await assignmentCollection.deleteOne(query);
            res.send(result)
        } )


        // add all posted assignment in db
        app.post('/allAssign',async(req,res)=>{
            const assignmentData = req.body;
            const result = await assignmentCollection.insertOne(assignmentData);
            res.send(result)
        })
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);



app.get('/', (req,res)=>{
    res.send('My brain-boost server is running')
})

app.listen(port , ()=>{
    console.log(`my server use port: ${port}`);
} )