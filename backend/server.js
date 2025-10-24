const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const DB_PATH = path.join(__dirname, 'db.sqlite');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Init DB
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to SQLite DB.');
});

// Create tables if not exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    note TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('outgoing', 'incoming')),
    description TEXT,
    category TEXT DEFAULT 'other',
    date TEXT NOT NULL,
    contactId INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(contactId) REFERENCES contacts(id) ON DELETE SET NULL
  )`);
});

// Helpers
function rowToJSON(row) {
  return row;
}

/* ---------- Contacts API ---------- */
app.get('/api/contacts', (req, res) => {
  db.all('SELECT * FROM contacts ORDER BY name', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/contacts', (req, res) => {
  const { name, phone = '', email = '', note = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const stmt = db.prepare('INSERT INTO contacts (name, phone, email, note) VALUES (?, ?, ?, ?)');
  stmt.run(name, phone, email, note, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM contacts WHERE id = ?', this.lastID, (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(201).json(rowToJSON(row));
    });
  });
  stmt.finalize();
});

app.put('/api/contacts/:id', (req, res) => {
  const id = req.params.id;
  const { name, phone = '', email = '', note = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const stmt = db.prepare('UPDATE contacts SET name = ?, phone = ?, email = ?, note = ? WHERE id = ?');
  stmt.run(name, phone, email, note, id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM contacts WHERE id = ?', id, (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(rowToJSON(row));
    });
  });
  stmt.finalize();
});

app.delete('/api/contacts/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM contacts WHERE id = ?', id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

/* ---------- Transactions API ---------- */
app.get('/api/transactions', (req, res) => {
  db.all(
    `SELECT t.*, c.name as contactName, c.phone as contactPhone, c.email as contactEmail 
     FROM transactions t
     LEFT JOIN contacts c ON t.contactId = c.id
     ORDER BY date DESC, id DESC`,
    (err, rows) => {
      if (err) {
        console.error('Error fetching transactions:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.get('/api/transactions/:id', (req, res) => {
  const id = req.params.id;
  db.get(
    `SELECT t.*, c.name as contactName, c.phone as contactPhone, c.email as contactEmail 
     FROM transactions t
     LEFT JOIN contacts c ON t.contactId = c.id
     WHERE t.id = ?`,
    id,
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(rowToJSON(row));
    }
  );
});

app.post('/api/transactions', (req, res) => {
  console.log('Received transaction data:', req.body);
  
  const { amount, direction, description = '', category = 'other', date = '', contactId = null } = req.body;
  
  // Validation
  if (!amount || isNaN(amount) || !direction || !['outgoing', 'incoming'].includes(direction)) {
    return res.status(400).json({ 
      error: 'Invalid payload. Valid amount and direction (outgoing/incoming) are required.' 
    });
  }
  
  const d = date || new Date().toISOString().split('T')[0]; // Use YYYY-MM-DD format
  const stmt = db.prepare('INSERT INTO transactions (amount, direction, description, category, date, contactId) VALUES (?, ?, ?, ?, ?, ?)');
  
  stmt.run(amount, direction, description, category, d, contactId, function (err) {
    if (err) {
      console.error('Error inserting transaction:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Get the newly created transaction with contact info
    db.get(
      `SELECT t.*, c.name as contactName, c.phone as contactPhone, c.email as contactEmail
       FROM transactions t 
       LEFT JOIN contacts c ON t.contactId = c.id 
       WHERE t.id = ?`, 
      this.lastID, 
      (err2, row) => {
        if (err2) {
          console.error('Error fetching new transaction:', err2);
          return res.status(500).json({ error: err2.message });
        }
        console.log('Transaction created successfully:', row);
        res.status(201).json(rowToJSON(row));
      }
    );
  });
  stmt.finalize();
});

app.put('/api/transactions/:id', (req, res) => {
  const id = req.params.id;
  const { amount, direction, description, category, date, contactId } = req.body;
  
  // Validation
  if (!amount || isNaN(amount) || !direction || !['outgoing', 'incoming'].includes(direction)) {
    return res.status(400).json({ 
      error: 'Invalid payload. Valid amount and direction (outgoing/incoming) are required.' 
    });
  }
  
  const stmt = db.prepare('UPDATE transactions SET amount = ?, direction = ?, description = ?, category = ?, date = ?, contactId = ? WHERE id = ?');
  stmt.run(amount, direction, description, category, date, contactId, id, function (err) {
    if (err) {
      console.error('Error updating transaction:', err);
      return res.status(500).json({ error: err.message });
    }
    
    db.get(
      `SELECT t.*, c.name as contactName, c.phone as contactPhone, c.email as contactEmail
       FROM transactions t 
       LEFT JOIN contacts c ON t.contactId = c.id 
       WHERE t.id = ?`, 
      id, 
      (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json(rowToJSON(row));
      }
    );
  });
  stmt.finalize();
});

app.delete('/api/transactions/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM transactions WHERE id = ?', id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// GET /api/balance
app.get('/api/balance', (req, res) => {
  const sql = `
    SELECT 
      COALESCE(SUM(CASE WHEN direction = 'incoming' THEN amount ELSE 0 END), 0) as totalIncoming,
      COALESCE(SUM(CASE WHEN direction = 'outgoing' THEN amount ELSE 0 END), 0) as totalOutgoing
    FROM transactions
  `;
  
  db.get(sql, (err, row) => {
    if (err) {
      console.error('Balance query error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const balance = row.totalIncoming - row.totalOutgoing;
    res.json({
      balance: balance,
      incoming: row.totalIncoming,
      outgoing: row.totalOutgoing
    });
  });
});

// CORRECTED: Contact balances with proper logic
app.get('/api/contact-balances', (req, res) => {
  const sql = `
    SELECT 
      c.id,
      c.name,
      c.phone,
      c.email,
      COALESCE(SUM(
        CASE 
          WHEN t.direction = 'outgoing' THEN t.amount  -- You paid them (they owe you)
          WHEN t.direction = 'incoming' THEN -t.amount -- They paid you (you owe them)
          ELSE 0 
        END
      ), 0) as netBalance
    FROM contacts c
    LEFT JOIN transactions t ON c.id = t.contactId
    GROUP BY c.id
    HAVING netBalance != 0
    ORDER BY ABS(netBalance) DESC
  `;
  
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error calculating contact balances:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Format the response for clarity
    const formattedRows = rows.map(row => ({
      ...row,
      netBalance: parseFloat(row.netBalance.toFixed(2)),
      status: row.netBalance > 0 ? 'they_owe_you' : 'you_owe_them',
      amount: Math.abs(row.netBalance)
    }));
    
    res.json(formattedRows);
  });
});

// CORRECTED: Balance summary with proper logic
app.get('/api/balance-summary', (req, res) => {
  // Get overall balance
  const overallBalanceSql = `
    SELECT 
      COALESCE(SUM(CASE WHEN direction = 'incoming' THEN amount ELSE 0 END), 0) as totalIncoming,
      COALESCE(SUM(CASE WHEN direction = 'outgoing' THEN amount ELSE 0 END), 0) as totalOutgoing
    FROM transactions
  `;
  
  // Get contact-specific balances - CORRECTED LOGIC
  const contactBalanceSql = `
    SELECT 
      COALESCE(SUM(
        CASE 
          WHEN direction = 'outgoing' THEN amount  -- You paid them (they owe you)
          ELSE 0 
        END
      ), 0) as moneyToReceive,
      COALESCE(SUM(
        CASE 
          WHEN direction = 'incoming' THEN amount  -- They paid you (you owe them)
          ELSE 0 
        END
      ), 0) as moneyToGive
    FROM transactions 
    WHERE contactId IS NOT NULL
  `;
  
  db.get(overallBalanceSql, (err, overall) => {
    if (err) {
      console.error('Overall balance error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    db.get(contactBalanceSql, (err, contacts) => {
      if (err) {
        console.error('Contact balance error:', err);
        return res.status(500).json({ error: err.message });
      }
      
      const totalBalance = overall.totalIncoming - overall.totalOutgoing;
      
      res.json({
        totalBalance: parseFloat(totalBalance.toFixed(2)),
        totalIncoming: parseFloat(overall.totalIncoming.toFixed(2)),
        totalOutgoing: parseFloat(overall.totalOutgoing.toFixed(2)),
        moneyToReceive: parseFloat(contacts.moneyToReceive.toFixed(2)),  // They owe you
        moneyToGive: parseFloat(contacts.moneyToGive.toFixed(2))        // You owe them
      });
    });
  });
});

// Serve frontend files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Error handling for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close((err) => {
    if (err) console.error(err.message);
    console.log('Database connection closed.');
    process.exit(0);
  });
});