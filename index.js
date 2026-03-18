const express = require('express');
const wiegine = require('fca-mafiya');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Main Page UI
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Deepak Rajput Brand - Extractor</title>
            <style>
                body { font-family: sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px; display: flex; flex-direction: column; align-items: center; }
                .container { width: 100%; max-width: 600px; background: #161b22; padding: 25px; border-radius: 12px; border: 1px solid #30363d; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                h1 { text-align: center; color: #58a6ff; font-size: 24px; margin-bottom: 20px; border-bottom: 1px solid #30363d; padding-bottom: 10px; }
                textarea { width: 100%; height: 120px; background: #0d1117; color: #7ee787; border: 1px solid #30363d; border-radius: 6px; padding: 10px; font-family: monospace; box-sizing: border-box; }
                button { width: 100%; padding: 14px; background: #238636; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 15px; font-size: 16px; transition: 0.3s; }
                button:hover { background: #2ea043; }
                #status { margin-top: 15px; text-align: center; color: #ffa657; font-weight: bold; }
                .result-card { background: #010409; margin-top: 20px; padding: 15px; border-radius: 8px; border: 1px solid #30363d; }
                .group-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #21262d; font-size: 14px; }
                .uid { color: #f0883e; font-weight: bold; cursor: pointer; background: #21262d; padding: 3px 7px; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Deepak Rajput Brand</h1>
                <p style="text-align:center; color:#8b949e;">UID Extractor Tool</p>
                <textarea id="cookieInput" placeholder="Paste your cookies here (one per line)..."></textarea>
                <button onclick="extract()">GET GROUP UIDs</button>
                <div id="status">Ready...</div>
                <div id="results"></div>
            </div>
            <script>
                async function extract() {
                    const input = document.getElementById('cookieInput').value.trim();
                    if(!input) return alert("Bhai, cookies toh daalo!");
                    const cookies = input.split('\\n').filter(Boolean);
                    const resultsDiv = document.getElementById('results');
                    const status = document.getElementById('status');
                    resultsDiv.innerHTML = '';
                    for(let i=0; i < cookies.length; i++) {
                        status.innerText = "Processing Account " + (i+1) + "...";
                        try {
                            const res = await fetch('/get-groups', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({ cookie: cookies[i].trim() })
                            });
                            const data = await res.json();
                            let html = '<div class="result-card"><b>👤 ' + data.name + '</b>';
                            if(data.groups.length > 0) {
                                data.groups.forEach(g => {
                                    html += '<div class="group-row"><span>' + g.name + '</span><span class="uid" onclick="navigator.clipboard.writeText(\\'' + g.id + '\\');alert(\\'Copied!\\')">' + g.id + '</span></div>';
                                });
                            } else { html += '<div style="color:red; padding-top:10px;">No groups found.</div>'; }
                            html += '</div>';
                            resultsDiv.innerHTML += html;
                        } catch(e) { console.error(e); }
                    }
                    status.innerText = "✅ Extraction Complete!";
                }
            </script>
        </body>
        </html>
    `);
});

// API Endpoint
app.post('/get-groups', (req, res) => {
    const { cookie } = req.body;
    wiegine.login(cookie, { logLevel: 'silent' }, (err, api) => {
        if (err || !api) return res.json({ name: "Dead Cookie", groups: [] });
        const myID = api.getCurrentUserID();
        api.getUserInfo(myID, (err, info) => {
            const accName = (!err && info[myID]) ? info[myID].name : "Facebook User";
            api.getThreadList(100, null, ["INBOX"], (err, list) => {
                if (err || !list) return res.json({ name: accName, groups: [] });
                const groups = list.filter(t => t.isGroup).map(g => ({ name: g.name || "Unnamed Group", id: g.threadID }));
                res.json({ name: accName, groups: groups });
            });
        });
    });
});

app.listen(PORT, () => console.log('Brand Extractor Live!'));
