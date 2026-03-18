const express = require('express');
const wiegine = require('fca-mafiya');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Deepak Rajput Brand - UID Extractor</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0d1117; color: #c9d1d9; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
                .container { width: 100%; max-width: 650px; background: #161b22; padding: 30px; border-radius: 15px; border: 1px solid #30363d; box-shadow: 0 15px 35px rgba(0,0,0,0.6); }
                h1 { text-align: center; color: #58a6ff; font-size: 28px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px; }
                .brand-sub { text-align: center; color: #8b949e; margin-bottom: 25px; font-size: 14px; }
                label { display: block; margin-bottom: 8px; font-weight: bold; color: #f0f6fc; }
                textarea { width: 100%; height: 120px; background: #0d1117; color: #7ee787; border: 1px solid #30363d; border-radius: 8px; padding: 12px; font-family: 'Courier New', Courier, monospace; box-sizing: border-box; font-size: 14px; margin-bottom: 15px; }
                button { width: 100%; padding: 15px; background-color: #238636; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; transition: background 0.3s; }
                button:hover { background-color: #2ea043; }
                #status { margin-top: 20px; text-align: center; font-size: 15px; color: #ffa657; font-weight: 500; }
                .result-container { margin-top: 25px; }
                .account-card { background: #010409; border: 1px solid #30363d; border-radius: 10px; padding: 15px; margin-bottom: 20px; border-left: 5px solid #58a6ff; }
                .account-header { font-size: 18px; font-weight: bold; color: #58a6ff; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
                .group-list { list-style: none; padding: 0; margin: 0; }
                .group-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #21262d; }
                .group-name { font-size: 14px; color: #e6edf3; }
                .uid-badge { background: #1f6feb; color: white; padding: 5px 10px; border-radius: 5px; font-family: monospace; font-size: 13px; cursor: pointer; transition: 0.2s; }
                .uid-badge:hover { background: #388bfd; box-shadow: 0 0 10px rgba(56,139,253,0.5); }
                .no-groups { color: #f85149; text-align: center; padding: 10px; }
            </style>
        </head>
        <body>

        <div class="container">
            <h1>Deepak Rajput Brand</h1>
            <div class="brand-sub">Premium Group UID Extractor Tool</div>
            
            <label>Paste Your Cookies (One per line):</label>
            <textarea id="cookieInput" placeholder="Paste your Facebook cookies here..."></textarea>
            
            <button onclick="startExtraction()">EXTRACT ALL GROUP UIDs</button>
            
            <div id="status">System Ready. Waiting for cookies...</div>
            
            <div id="results" class="result-container"></div>
        </div>

        <script>
            async function startExtraction() {
                const input = document.getElementById('cookieInput').value.trim();
                if(!input) { alert("Bhai, pehle cookies toh daalo!"); return; }

                const cookies = input.split('\\n').filter(Boolean);
                const resultsDiv = document.getElementById('results');
                const status = document.getElementById('status');
                
                resultsDiv.innerHTML = '';
                
                for(let i=0; i < cookies.length; i++) {
                    status.innerText = \`🔍 Scanning Account \${i+1} of \${cookies.length}...\`;
                    try {
                        const response = await fetch('/extract', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ cookie: cookies[i].trim() })
                        });
                        const data = await response.json();
                        
                        let html = \`<div class="account-card">
                            <div class="account-header">
                                <span>👤 \${data.name}</span>
                                <span style="font-size: 12px; color: #8b949e;">Groups: \${data.groups.length}</span>
                            </div>\`;
                        
                        if(data.groups.length > 0) {
                            html += '<ul class="group-list">';
                            data.groups.forEach(g => {
                                html += \`<li class="group-item">
                                    <span class="group-name">\${g.name}</span>
                                    <span class="uid-badge" onclick="copyUID('\${g.id}')" title="Click to Copy">\${g.id}</span>
                                </li>\`;
                            });
                            html += '</ul>';
                        } else {
                            html += '<div class="no-groups">No active groups found for this ID.</div>';
                        }
                        html += '</div>';
                        resultsDiv.innerHTML += html;
                    } catch (e) {
                        console.error(e);
                        status.innerText = "⚠️ Error processing cookie.";
                    }
                }
                status.innerText = "✅ Extraction Completed Successfully!";
            }

            function copyUID(uid) {
                navigator.clipboard.writeText(uid).then(() => {
                    alert("UID Copied: " + uid);
                });
            }
        </script>

        </body>
        </html>
    `);
});

app.post('/extract', (req, res) => {
    const { cookie } = req.body;
    wiegine.login(cookie.trim(), { logLevel: 'silent' }, (err, api) => {
        if (err || !api) return res.json({ name: "Dead/Invalid Cookie", groups: [] });

        const myID = api.getCurrentUserID();
        api.getUserInfo(myID, (err, info) => {
            const userName = (!err && info[myID]) ? info[myID].name : "Active User";
            
            api.getThreadList(100, null, ["INBOX"], (err, list) => {
                if (err || !list) return res.json({ name: userName, groups: [] });
                
                const groupData = list
                    .filter(t => t.isGroup)
                    .map(g => ({ name: g.name || "Unnamed Group", id: g.threadID }));
                
                res.json({ name: userName, groups: groupData });
            });
        });
    });
});

app.listen(PORT, () => console.log(\`Deepak Rajput Brand Extractor Live on port \${PORT}\`));
