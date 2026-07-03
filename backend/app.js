const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');

app.use(express.static(path.join(__dirname, "../frontend")));

// Routers
const userRouter = require('./routes/userRoutes');
const categoryRouter = require('./routes/categoryRoutes');
const productRouter = require('./routes/productRoutes');
const cartRouter = require('./routes/cartRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const orderRouter = require('./routes/orderRoutes');
const reportRouter = require('./routes/reportRoutes');
const addressRouter = require('./routes/addressRoutes');

// Middlewares
app.use(cors());
app.use(express.json());

// Serve uploaded images (matches the path used in middlewares/upload.js)
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Mount routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/addresses', addressRouter);

module.exports = app;