import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace this with the path to your service account JSON file
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');

async function main() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`ERROR: Service account key not found at ${SERVICE_ACCOUNT_PATH}`);
    console.error('Please download it from Firebase Console -> Project Settings -> Service Accounts, rename it to "serviceAccountKey.json", and place it in the project root.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

  initializeApp({
    credential: cert(serviceAccount)
  });

  const db = getFirestore();
  console.log('Listening for waitlist emails from Firestore. Keep this script running to dynamically update the HTML file...');
  
  db.collection('waitlist').onSnapshot(snapshot => {
    const emails = [];
    const seen = new Set();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.email) {
        const emailLower = data.email.toLowerCase().trim();
        if (!seen.has(emailLower)) {
          seen.add(emailLower);
          let timeString = 'N/A';
          const ts = data.createdAt || data.timestamp;
          if (ts) {
            if (typeof ts.toMillis === 'function') {
              timeString = new Date(ts.toMillis()).toLocaleString();
            } else if (typeof ts === 'string' || typeof ts === 'number') {
              timeString = new Date(ts).toLocaleString();
            }
          }
          
          emails.push({
            id: doc.id,
            email: emailLower,
            timestamp: timeString
          });
        }
      }
    });

    console.log(`\nUpdate received! Found ${emails.length} emails. Regenerating HTML page...`);

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Waitlist Emails - Offline Admin</title>
  <style>
    :root {
      --bg: #0b0b0b;
      --surface: #111111;
      --text: #f0ede8;
      --primary: #fd4378;
      --primary-hover: #e82c61;
      --border: rgba(240,237,232,0.14);
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 2rem;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: var(--surface);
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    h1 {
      margin-top: 0;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }
    input[type="text"] {
      flex: 1;
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text);
      font-size: 1rem;
    }
    button {
      background-color: var(--primary);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: var(--primary-hover);
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 1rem;
      border-bottom: 1px solid var(--border);
    }
    th {
      background-color: var(--bg);
      font-weight: 600;
      color: #94a3b8;
    }
    tr:hover {
      background-color: var(--bg);
    }
    .count {
      color: #94a3b8;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    
    /* Live status indicator */
    .live-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #10b981;
      font-size: 0.8rem;
      font-weight: bold;
      margin-left: 1rem;
      padding: 0.25rem 0.75rem;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 12px;
      vertical-align: middle;
    }
    .live-indicator {
      width: 8px;
      height: 8px;
      background-color: #10b981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Waitlist Directory <span class="live-status"><div class="live-indicator"></div> Live Updating</span></h1>
    <div class="count">Total emails: <span id="totalCount">${emails.length}</span></div>
    
    <div class="toolbar">
      <input type="text" id="searchInput" placeholder="Search emails...">
      <button id="copyBtn">Copy All Filtered Emails</button>
    </div>

    <table id="emailTable">
      <thead>
        <tr>
          <th style="width: 50px;">#</th>
          <th>Email</th>
          <th>Signup Time</th>
        </tr>
      </thead>
      <tbody>
        ${emails.map((e, index) => `
          <tr>
            <td style="color: #94a3b8;">${index + 1}</td>
            <td class="email-cell">${e.email}</td>
            <td>${e.timestamp}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <script>
    // Refresh the page automatically if it's served via a simple file protocol 
    // and Live Server isn't present, or we can just let Live Server handle it.
    // For now we assume the user might be using Live Server for hot reloads.
    
    const searchInput = document.getElementById('searchInput');
    const table = document.getElementById('emailTable');
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    const copyBtn = document.getElementById('copyBtn');
    const totalCount = document.getElementById('totalCount');

    searchInput.addEventListener('input', function() {
      const filter = this.value.toLowerCase();
      let visibleCount = 0;
      
      for (let i = 0; i < rows.length; i++) {
        const email = rows[i].getElementsByClassName('email-cell')[0].innerText.toLowerCase();
        if (email.includes(filter)) {
          rows[i].style.display = '';
          visibleCount++;
        } else {
          rows[i].style.display = 'none';
        }
      }
      totalCount.innerText = visibleCount;
    });

    copyBtn.addEventListener('click', function() {
      let emailsToCopy = [];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].style.display !== 'none') {
          emailsToCopy.push(rows[i].getElementsByClassName('email-cell')[0].innerText);
        }
      }
      
      const textToCopy = emailsToCopy.join(', ');
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Copied!';
        copyBtn.style.backgroundColor = '#10b981';
        setTimeout(() => {
          copyBtn.innerText = originalText;
          copyBtn.style.backgroundColor = '';
        }, 2000);
      });
    });
  </script>
</body>
</html>
    `;

    const outputPath = path.join(__dirname, '..', 'waitlist_offline.html');
    fs.writeFileSync(outputPath, htmlContent);
    console.log(`HTML file successfully updated at: ${outputPath}`);
  }, err => {
    console.error('Error listening to Firestore:', err);
  });
}

main().catch(console.error);
