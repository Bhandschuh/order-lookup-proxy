const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const SHOPIFY_API_URL = 'https://thick-quality-glass.myshopify.com/admin/api/2023-10';
const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

console.log('Starting server with token:', ADMIN_API_TOKEN); // Debug log at startup

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://thick-quality-glass.myshopify.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.post('/order-lookup', async (req, res) => {
  const { email, orderNumber } = req.body;

  if (!email || !orderNumber) {
    return res.status(400).json({ error: 'Email and order number are required' });
  }

  console.log('Request received:', { email, orderNumber }); // Debug log for request
  console.log('Using token for request:', ADMIN_API_TOKEN); // Debug log for token

  try {
    const response = await axios.get(`${SHOPIFY_API_URL}/orders.json`, {
      headers: { 'X-Shopify-Access-Token': ADMIN_API_TOKEN },
      params: { email, name: `#${orderNumber}`, status: 'any', limit: 1 }
    });

    console.log('Shopify API response:', response.data); // Debug log for response

    const orders = response.data.orders;
    if (!orders || !orders.length) {
      return res.status(404).json({ error: 'No order found' });
    }

    const order = orders[0];
    res.json({
      id: order.id,
      name: order.name,
      email: order.email,
      totalPrice: order.total_price,
      lineItems: order.line_items.map(item => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price
      })),
      createdAt: order.created_at,
      shippingAddress: order.shipping_address || null
    });
  } catch (error) {
    console.error('Error fetching order:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});