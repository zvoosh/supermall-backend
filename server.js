require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const ImageKit = require("imagekit");
const { db } = require("./firebase");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage() });

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

app.use(express.json());

app.post("/api/admin", async (req, res) => {
  const uid = uuidv4();
  const { fullname, username, password, email } = req.body;

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await db.collection("admin").doc(uid).set({
      uid,
      fullname,
      username,
      password: hashedPassword,
      email,
    });

    res.status(201).json({ message: "Admin created", uid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const snapshot = await db
      .collection("admin")
      .where("username", "==", username)
      .get();
    if (snapshot.empty)
      return res.status(401).json({ error: "Invalid credentials" });

    const adminData = snapshot.docs[0].data();

    const isMatch = await bcrypt.compare(password, adminData.password);

    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    res.status(200).json({ message: "Login successful", uid: adminData.uid });
  } catch (err) {
    res.status(500).json({ error: err.mssage });
  }
  e;
});

app.post("/api/store", upload.single("img"), async (req, res) => {
  const uid = uuidv4();
  const { name, category, subcategory, products, discount } = req.body;

  try {
    const imageUpload = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: "/supermall",
    });

    const imgUrl = imageUpload.url;

    await db.collection("stores").doc(uid).set({
      uid,
      name,
      img: imgUrl,
      category,
      subcategory,
      products,
      discount,
    });

    res.status(201).json({ message: "Store created", uid, imgUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/stores", async (req, res) => {
  try {
    const snapshot = await db.collection("stores").get();
    const stores = snapshot.docs.map((doc) => doc.data());
    res.status(200).json(stores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/store/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection("stores").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Store not found" });

    res.status(200).json(doc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/store/:id", upload.single("img"), async (req, res) => {
  const { id } = req.params;
  const { name, category, subcategory, products, discount } = req.body;

  try {
    const doc = await db.collection("stores").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Store not found" });

    const storeData = doc.data();
    let imgUrl = storeData.img;

    if (req.file) {
      if (storeData.img) {
        const filePath = storeData.img.split("/").slice(-2).join("/");
        await imagekit.deleteFile(filePath).catch(() => {});
      }

      const imageUpload = await imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname,
        folder: "/supermall",
      });

      imgUrl = imageUpload.url;
    }

    await db.collection("stores").doc(id).update({
      name,
      category,
      subcategory,
      products,
      discount,
      img: imgUrl,
    });

    res.status(200).json({ message: "Store updated", id, img: imgUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/store/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection("stores").doc(id).delete();
    res.status(200).json({ message: "Store deleted", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/product", upload.single("img"), async (req, res) => {
  const { name, price, discount, description } = req.body;
  const id = uuidv4();

  try {
    const imageUpload = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: "/supermall/products",
    });

    const imgUrl = imageUpload.url;

    await db
      .collection("products")
      .doc(id)
      .set({
        id,
        name,
        img: imgUrl,
        price: Number(price),
        discount: Number(discount),
        description,
      });

    res.status(201).json({ message: "Product created", id, imgUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const snapshot = await db.collection("products").get();
    const products = snapshot.docs.map((doc) => doc.data());
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/product/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection("products").doc(id).get();
    if (!doc.exists)
      return res.status(404).json({ error: "Product not found" });

    res.status(200).json(doc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/product/:id", upload.single("img"), async (req, res) => {
  const { id } = req.params;
  const { name, price, discount, description } = req.body;

  try {
    const doc = await db.collection("products").doc(id).get();
    if (!doc.exists)
      return res.status(404).json({ error: "Product not found" });

    const productData = doc.data();
    let imgUrl = productData.img;

    if (req.file) {
      if (productData.img) {
        const filePath = productData.img.split("/").slice(-2).join("/");
        await imagekit.deleteFile(filePath).catch(() => {});
      }

      const imageUpload = await imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname,
        folder: "/supermall/products",
      });

      imgUrl = imageUpload.url;
    }

    await db
      .collection("products")
      .doc(id)
      .update({
        name,
        price: Number(price),
        discount: Number(discount),
        description,
        img: imgUrl,
      });

    res.status(200).json({ message: "Product updated", id, img: imgUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/product/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection("products").doc(id).delete();
    res.status(200).json({ message: "Product deleted", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
