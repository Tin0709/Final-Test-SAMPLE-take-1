import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors()); // allow requests from React apps
app.use(express.json());

// ===== Sample Data (with your real name and ID) =====
const customers = [
  { id: 1, name: 'Alice', address: '101 Main Street' },
  { id: 2, name: 'Bob', address: '303 Sub Street' },
  { id: 3, name: 'Tin', address: 's3988418 RMIT' }
];

const orders = [
  { customer_id: 1, product_id: 1, quantity: 2 },
  { customer_id: 1, product_id: 2, quantity: 3 },
  { customer_id: 3, product_id: 1, quantity: 5 },
  { customer_id: 3, product_id: 3, quantity: 2 }
];

const products = [
  { id: 1, name: 'Laptop',   price: 500.0, sell_off: true,  percent: 10.0 },
  { id: 2, name: 'Phone',    price: 350.0, sell_off: false },
  { id: 3, name: 'Keyboard', price: 130.0, sell_off: true,  percent: 40.0 },
  { id: 4, name: 'Tablet',   price: 680.0, sell_off: false }
];

// Helper: compute effective price with sell_off
function effectivePrice(product) {
  if (product.sell_off) {
    const percent = typeof product.percent === 'number' ? product.percent : 0;
    return product.price * (1 - percent / 100);
  }
  return product.price;
}

// ===== Routes =====

// GET /customers -> all customers (id, name, address)
app.get('/customers', (req, res) => {
  res.json(customers);
});

// GET /customers/:id -> one customer plus "orders" [{product_id, quantity}]
app.get('/customers/:id', (req, res) => {
  const id = Number(req.params.id);
  const customer = customers.find(c => c.id === id);

  // Per spec, assume a matching customer is always found
  const customerOrders = orders
    .filter(o => o.customer_id === id)
    .map(o => ({ product_id: o.product_id, quantity: o.quantity }));

  res.json({ ...customer, orders: customerOrders });
});

app.get('/customers/:id/total', (req, res) => {
  const id = Number(req.params.id);
  const customerOrders = orders.filter(o => o.customer_id === id);

  const total = customerOrders.reduce((sum, o) => {
    const product = products.find(p => p.id === o.product_id);
    const unit = effectivePrice(product);
    return sum + unit * o.quantity;
  }, 0);

  res.json({ total_price: Number(total.toFixed(2)) });
});

// 404 for all other routes
app.use((req, res) => {
  res.status(404).json({ msg: 'not found' });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Express server listening on http://localhost:${PORT}`);
});
