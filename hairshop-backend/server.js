require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const ticketRoutes = require('./routes/tickets');

const app = express();
app.use(cors());
app.use(express.json());

// serve static admin files if you place them in /public
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> console.log('✅ MongoDB connected'))
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tickets', ticketRoutes);

// admin-only generic query route (use carefully)
app.post('/api/admin/query', async (req, res) => {
  // Only for admin usage via authenticated requests in production wrap with auth middleware
  return res.status(501).json({ message: 'Use admin endpoints' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
