const express = require("express");

const cors = require("cors");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();

const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

app.use(cors());

const port = process.env.PORT || 3001;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yus1g0f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // connect server
    //  await client.connect();

    const database = client.db("communityDB");
    const users = database.collection("users");
    const challenges = database.collection("challenges");
    const participations = database.collection("participations");
    //  jwt
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "2h",
      });
      res.send({ token });
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      // console.log(token);
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, dec) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.dec = dec;

        next();
      });
    };
    // users
    app.post("/users", async (req, res) => {
      const user = req.body;
      // insert email if does not exist
      const query = { email: user.email };

      const exist = await users.findOne(query);
      if (exist) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await users.insertOne(user);
      res.send(result);
    });
    app.get("/users", verifyToken, async (req, res) => {
      const query = {};
      const options = {
        sort: {
          points: -1,
        },
      };

      const result = await users.find(query, options).toArray();
      res.send(result);
    });
    app.get("/user/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await users.findOne(filter);
      res.send(result);
    });
    app.patch("/user/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const update = req.body;
      const updateUser = {
        $set: update,
      };

      const result = await users.updateOne(filter, updateUser);
      res.send(result);
    });
    // challenges
    app.get("/challenges", async (req, res) => {
      const result = await challenges.find().toArray();

      res.send(result);
    });

    app.get("/challenge/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await challenges.findOne(filter);
      res.send(result);
    });
    app.get("/challenges/mine", verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.host) {
        query = { host: req.query.host };
      }
      const result = await challenges.find(query).toArray();

      res.send(result);
    });
    app.post("/challenges", verifyToken, async (req, res) => {
      const challenge = req.body;
      const result = await challenges.insertOne(challenge);
      res.send(result);
    });

    app.patch("/challenge/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const update = req.body;
      const updateChallenge = {
        $set: update,
      };
      const result = await challenges.updateOne(filter, updateChallenge);
      res.send(result);
    });
    app.delete("/challenge/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await challenges.deleteOne(filter);
      res.send(result);
    });
    // participation
    app.post("/participations", verifyToken, async (req, res) => {
      const participation = req.body;
      const result = await participations.insertOne(participation);
      res.send(result);
    });
    app.get("/participations/mine", verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.participant) {
        query = { participant: req.query.participant };
      }
      const result = await participations.find(query).toArray();

      res.send(result);
    });
    app.patch("/participation/mine/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const update = {
        $set: {
          completed: true,
        },
      };

      const result = await participations.updateOne(filter, update);
      res.send(result);
    });
    app.delete("/participation/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const result = await participations.deleteOne(filter);
      res.send(result);
    });
    //  send a ping for connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connection successful");
  } finally {
    // await client.close()
  }
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});
run().catch(console.dir());
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
