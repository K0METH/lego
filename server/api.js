const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const PORT = 8092;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://garanceturpin:DQljxr8TySiSzs8W@cluster0.grrmwem.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "Lego";

let client = null;
let db = null;

// Connection to MongoDB
async function connectDB() {
  try {
    if (!client) {
      client = await MongoClient.connect(MONGODB_URI, {
        useNewUrlParser: true,
      });
      db = client.db(MONGODB_DB_NAME);
      console.log("✅ Connecté à MongoDB");
    }
    return db;
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB:", error);
    throw error;
  }
}

// Express configuration
const app = express();
app.use(require("body-parser").json());
app.use(cors());
app.use(helmet());
app.options("*", cors());

// Routes
app.get("/deals/best-discounts", async (req, res) => {
  try {
    const db = await connectDB();
    const deals = await db
      .collection("deals")
      .find()
      .sort({ discount: -1 })
      .toArray();
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/deals/most-commented", async (req, res) => {
  try {
    const db = await connectDB();
    const deals = await db
      .collection("deals")
      .find()
      .sort({ commentsCount: -1 })
      .toArray();
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/deals/by-price", async (req, res) => {
  try {
    const db = await connectDB();
    const deals = await db
      .collection("deals")
      .find()
      .sort({ price: 1 })
      .toArray();
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/deals/by-date", async (req, res) => {
  try {
    const db = await connectDB();
    const deals = await db
      .collection("deals")
      .find()
      .sort({ published: -1 })
      .toArray();
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/sales/:legoSetId", async (req, res) => {
  try {
    const db = await connectDB();
    const sales = await db
      .collection("sales")
      .find({ legoSetId: req.params.legoSetId })
      .toArray();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/sales/recent", async (req, res) => {
  try {
    const db = await connectDB();
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const sales = await db
      .collection("sales")
      .find({
        scraped: { $gte: threeWeeksAgo },
      })
      .toArray();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/deals", async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection("deals").insertMany(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/sales", async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection("sales").insertMany(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific deal by ID
app.get("/deals/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const deal = await db.collection("deals").findOne({ _id: req.params.id });

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search deals with filters
app.get("/deals/search", async (req, res) => {
  try {
    const db = await connectDB();
    const { limit = 12, price, date, filterBy } = req.query;

    const filter = {};
    if (price) {
      filter.price = { $lte: parseFloat(price) };
    }
    if (date) {
      filter.published = { $gte: new Date(date).getTime() / 1000 };
    }

    let sort = { price: 1 };
    if (filterBy === "best-discount") {
      sort = { discount: -1 };
    } else if (filterBy === "most-commented") {
      sort = { comments: -1 };
    }

    const deals = await db
      .collection("deals")
      .find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection("deals").countDocuments(filter);

    res.json({
      limit: parseInt(limit),
      total,
      results: deals,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search sales
app.get("/sales/search", async (req, res) => {
  try {
    const db = await connectDB();
    const { limit = 12, legoSetId } = req.query;

    const filter = {};
    if (legoSetId) {
      filter.legoSetId = legoSetId;
    }

    const sales = await db
      .collection("sales")
      .find(filter)
      .sort({ published: -1 })
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection("sales").countDocuments(filter);

    res.json({
      limit: parseInt(limit),
      total,
      results: sales,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (request, response) => {
  response.send({ ack: true });
});

app.listen(PORT, () => {
  console.log(`📡 Running on port ${PORT}`);
});
