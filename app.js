const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

/* =========================
   CONFIG
========================= */
const PORT = process.env.PORT || 3000;

// Kubernetes MongoDB Service DNS
const MONGO_URI =
  process.env.MONGODB_URI || 'mongodb://vegetable-app-mongodb-svc:27017/vegetable_order_app';

/* =========================
   MIDDLEWARE
========================= */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public')); // Serve static frontend

/* =========================
   HEALTH CHECK (for K8s)
========================= */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'vegetable-app' });
});

/* =========================
   DATABASE
========================= */
const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Crash pod → Kubernetes restarts it
  }
};

connectToDatabase();

/* =========================
   SCHEMAS
========================= */

// Order Schema
const orderSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: {
    flat_no: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
  },
  vegetables: {
    brinjalQty: Number,
    tomatoQty: Number,
    carrotQty: Number,
    cucumberQty: Number,
    onionQty: Number,
    chilliQty: Number,
    spinachQuantity: Number,
    coriander: Number,
    Karvepaku: Number,
    pudina: Number,
  },
  totalCost: Number,
});

const Order = mongoose.model('Order', orderSchema);

// Cart Schema
const cartSchema = new mongoose.Schema({
  items: [
    {
      name: String,
      quantity: Number,
      totalCost: Number,
    },
  ],
  totalCartCost: Number,
});

const Cart = mongoose.model('Cart', cartSchema);

// Checkout Schema
const checkoutSchema = new mongoose.Schema({
  customer: {
    name: String,
    email: String,
    phone: String,
    address: {
      flat_no: String,
      area: String,
      city: String,
      state: String,
      pincode: String,
    },
  },
  cart: [
    {
      name: String,
      quantity: Number,
      totalCost: Number,
    },
  ],
  cartTotal: Number,
});

const Checkout = mongoose.model('Checkout', checkoutSchema);

/* =========================
   ROUTES
========================= */

// Order Routes
app.post('/order', async (req, res) => {
  try {
    const { name, email, phone, address, vegetables, totalCost } = req.body;
    const newOrder = new Order({ name, email, phone, address, vegetables, totalCost });
    const savedOrder = await newOrder.save();
    res.status(201).json({ message: 'Order placed successfully!', orderId: savedOrder._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/order/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) res.json(order);
    else res.status(404).json({ message: 'Order not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cart Routes
app.post('/cart', async (req, res) => {
  try {
    const { items, totalCartCost } = req.body;
    const newCart = new Cart({ items, totalCartCost });
    const savedCart = await newCart.save();
    res.status(201).json({ message: 'Cart data saved successfully!', cartId: savedCart._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/cart/:id', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id);
    if (cart) res.json(cart);
    else res.status(404).json({ message: 'Cart not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Checkout Routes
app.post('/checkout', async (req, res) => {
  try {
    const { customer, cart, cartTotal } = req.body;
    const newCheckout = new Checkout({ customer, cart, cartTotal });
    const savedCheckout = await newCheckout.save();
    res.status(201).json({ message: 'Checkout successful!', checkoutId: savedCheckout._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/checkout/:id', async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id);
    if (checkout) res.json(checkout);
    else res.status(404).json({ message: 'Checkout not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   SERVER
========================= */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Vegetable App running on port ${PORT}`);
});
