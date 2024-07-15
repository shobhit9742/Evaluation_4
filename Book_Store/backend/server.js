const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/mongoose");
const sequelize = require("./config/sequelize");
const { protect, authorize } = require("./middleware/authMiddleware");
const Book = require("./models/Book");
const User = require("./models/User");
const http = require("http");
const nodemailer = require("nodemailer");
const winston = require("winston");
const cron = require("cron");
const EventEmitter = require("events");
const socketIo = require("socket.io");
// const { info } = require("console");
dotenv.config();

connectDB();
sequelize.sync();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.json());

const eventEmitter = new EventEmitter();

// logging setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: "./logs/error.log",
      level: "error",
    }),
    new winston.transports.File({ filename: "./logs/combines.log" }),
  ],
});

// notification
io.on("connecting", (socket) => {
  console.log("New User Connected");
  eventEmitter.on("orderPlaced", (order) => {
    socket.emit("orderPlaced", order);
  });
  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});

// nodemailer - Email

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "shobhitgupta0602@gmail.com",
    pass: "ondh ckmf uhcw uyvp",
  },
});

//
eventEmitter.on("orderPlaced", (order) => {
  const mailOptions = {
    from: "shobhitgupta0602@gmail.com",
    to: order.email,
    subject: "Order Confirmation",
    text: `Thank you for youe order, ${order.name}!.`,
    // html: "<p>HTML version of the message</p>",
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error(`Error Sending Email: ${error}`);
    } else {
      logger.info(`Email Sent: ${info.response}`);
    }
  });
});

app.post("/order", (req, res) => {
  const order = req.body;
  eventEmitter.emit("orderPlaced", order);
  res.status(201).send("Order Placed");
  logger.info("Order Placed: ");
});

const getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBook = async (req, res) => {
  const { title, author, description, publishedDate } = req.body;
  try {
    const newBook = new Book({ title, author, description, publishedDate });
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBook = async (req, res) => {
  try {
    const { title, author, description, publishedDate } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    book.title = title || book.title;
    book.author = author || book.author;
    book.description = description || book.description;
    book.publishedDate = publishedDate || book.publishedDate;
    const updatedBook = await book.save();
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    await book.remove();
    res.status(200).json({ message: "Book removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Routes
app.get("/api/books", protect, authorize("VIEW_ALL", "VIEWER"), getBooks);
app.post("/api/books", protect, authorize("CREATOR"), createBook);
app.get(
  "/api/books/:id",
  protect,
  authorize("VIEW_ALL", "VIEWER"),
  getBookById
);
app.put("/api/books/:id", protect, authorize("CREATOR"), updateBook);
app.patch("/api/books/:id", protect, authorize("CREATOR"), updateBook);
app.delete("/api/books/:id", protect, authorize("CREATOR"), deleteBook);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
