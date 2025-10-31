require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const ImageKit = require("imagekit");
const { db } = require("./firebase");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
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

  console.log("req.body", req.body);

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
    console.error("Admin creation error:", err);
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
  const id = uuidv4();
  const { name, category, subcategory, discount, floor } = req.body;

  try {
    const imageUpload = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: "/supermall",
    });

    const imgUrl = imageUpload.url;

    const discountNum = Number(discount);
    const floorNum = Number(floor);

    await db.collection("stores").doc(id).set({
      id,
      name,
      img: imgUrl,
      category,
      subcategory,
      products: [],
      discount: discountNum,
      floor: floorNum,
    });
    res.status(201).json({ message: "Store created", id, imgUrl });
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

app.get("/api/stores/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection("stores").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Store not found" });

    const store = { id: doc.id, ...doc.data() };

    const productSnapshot = await db
      .collection("products")
      .where("storeId", "==", id)
      .get();

    const products = productSnapshot.docs.map((doc) => doc.data());
    console.log("products", products);
    store.products = products;
    console.log("store products", store.products);

    res.status(200).json(store);
  } catch (err) {
    console.error("Error fetching store with products:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/stores/:id", upload.single("img"), async (req, res) => {
  const { id } = req.params;
  const { name, category, subcategory, discount, floor } = req.body;

  try {
    const doc = await db.collection("stores").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Store not found" });
    }

    const storeData = doc.data();
    let imgUrl = storeData?.img;

    if (req.file) {
      try {
        if (imgUrl) {
          const filePath = imgUrl.split("/").slice(-2).join("/");
          await imagekit.deleteFile(filePath).catch(() => {});
        }

        const imageUpload = await imagekit.upload({
          file: req.file.buffer,
          fileName: req.file.originalname,
          folder: "/supermall",
        });

        imgUrl = imageUpload.url;
      } catch (uploadErr) {
        return res
          .status(500)
          .json({ error: "Image upload failed", details: uploadErr.message });
      }
    }

    const updateData = {
      name,
      category,
      subcategory,
      floor: Number(floor),
      discount: Number(discount),
    };

    if (req.file && imgUrl) {
      updateData.img = imgUrl;
    }

    // Update store document
    await db.collection("stores").doc(id).update(updateData);

    res.status(200).json({ message: "Store updated", id, img: imgUrl });
  } catch (err) {
    console.error("Store update error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/stores/:id", async (req, res) => {
  const { id: storeId } = req.params;

  try {
    const productsSnapshot = await db
      .collection("products")
      .where("storeId", "==", storeId)
      .get();

    const batch = db.batch();

    productsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the store itself
    batch.delete(db.collection("stores").doc(storeId));

    await batch.commit();

    res.status(200).json({
      message: `Store and ${productsSnapshot.size} associated products deleted`,
      storeId,
    });
  } catch (err) {
    console.error("Error deleting store and products:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/product", upload.single("img"), async (req, res) => {
  const id = uuidv4();
  const { name, price, discount, description, storeId } = req.body;

  console.log(storeId);

  try {
    const imageUpload = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: "/supermall/products",
    });

    const imgUrl = imageUpload.url;

    const discountNum = Number(discount);
    const priceNum = Number(price);

    await db.collection("products").doc(id).set({
      id,
      name,
      img: imgUrl,
      price: priceNum,
      discount: discountNum,
      description,
      storeId,
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
