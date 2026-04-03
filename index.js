const express = require('express');
const axios = require('axios');
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
            <title>Deepak Rajput Brand - Pro Extractor</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px; display: flex; flex-direction: column; align-items: center; }
                .container { width: 100%; max-width: 650px; background: #161b22; padding: 30px; border-radius: 15px; border: 1px solid #30363d; box-shadow: 0 15px 35px rgba(0,0,0,0.6); }
                h1 { text-align: center; color: #58a6ff; font-size: 26px; margin-bottom: 5px; text-transform: uppercase; }
                .brand-sub { text-align: center; color: #8b949e; margin-bottom: 20px; font-size: 13px; }
                
                .mode-selector { display: flex; gap: 10px; margin-bottom: 20px; }
                .mode-btn { flex: 1; padding: 12px; border: 1px solid #30363d; background: #21262d; color: white; cursor: pointer; border-radius: 8px; font-weight: bold; transition: 0.3s; }
                .mode-btn.active { background: #1f6feb; border-color: #58a6ff; }
                
                textarea { width: 100%; height: 130px; background: #0d1117; color: #7ee787; border: 1px solid #30363d; border-radius: 8px; padding: 12px; font-family: monospace; box-sizing: border-box; margin-bottom: 15px; }
                .main-btn { width: 100%; padding: 15px; background: #238636; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; }
                .main-btn:hover { background: #2ea043; }
                
                #status { margin-top: 20px; text-align: center; color: #ffa657; font-weight: 500; }
                .account-card { background: #010409; border: 1px solid #30363d; border-radius: 10px; padding: 15px; margin-top: 20px; border-left: 5px solid #58a6ff; }
                .group-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #21262d; font-size: 14px; }
                .uid-badge { background: #1f6feb; color: white; padding: 4px 8px; border-radius: 5px; font-family: monospace; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Deepak Rajput Brand</h1>
                <div class="brand-sub">Premium Multi-Mode Extractor</div>

                <div class="mode-selector">
                    <button id="cookieBtn" class="mode-btn active" onclick="setMode('cookie')">COOKIE MODE</button>
                    <button id="tokenBtn" class="mode-btn" onclick="setMode('token')">TOKEN V7 MODE</button>
                </div>

                <textarea id="userInput" placeholder="Paste your data here (one per line)..."></textarea>
                <button class="main-btn" onclick="startExtraction()">START EXTRACTION</button>
                
                <div id="status">Ready to scan...</div>
                <div id="results"></div>
            </div>

            <script>
                let currentMode = 'cookie';

                function setMode(mode) {
                    currentMode = mode;
                    document.getElementById('cookieBtn').classList.toggle('active', mode === 'cookie');
                    document.getElementById('tokenBtn').classList.toggle('active', mode === 'token');
                    document.getElementById('userInput').placeholder = mode === 'cookie' ? "Paste Cookies here..." : "Paste EAAB... Tokens here...";
                    document.getElementById('results').innerHTML = '';
                }

                async function startExtraction() {
                    const data = document.getElementById('userInput').value.trim().split('\\n').filter(Boolean);
                    if(data.length === 0) return alert("Pehle data toh daalo!");
                    
                    const resultsDiv = document.getElementById('results');
                    const status = document.getElementById('status');
                    resultsDiv.innerHTML = '';

                    const endpoint = currentMode === 'cookie' ? '/extract-cookie' : '/extract-token';

                    for(let i=0; i < data.length; i++) {
                        status.innerText = \`Processing \${i+1} of \${data.length}...\`;
                        try {
                            const res = await fetch(endpoint, {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({ input: data[i].trim() })
                            });
                            const result = await res.json();
                            
                            let html = \`<div class="account-card"><b>👤 \${result.name}</b>\`;
                            if(result.groups && result.groups.length > 0) {
                                result.groups.forEach(g => {
                                    html += \`<div class="group-item"><span>\${g.name}</span><span class="uid-badge" onclick="copyUID('\${g.id}')">\${g.id}</span></div>\`;
                                });
                            } else { 
                                html += '<p style="color:red; font-size:12px; margin-top:5px;">(No groups or error fetching list)</p>'; 
                            }
                            html += '</div>';
                            resultsDiv.innerHTML += html;
                        } catch(e) { console.error(e); }
                    }
                    status.innerText = "✅ Task Finished!";
                }

                function copyUID(uid) {
                    navigator.clipboard.writeText(uid);
                    alert("UID Copied: " + uid);
                }
            </script>
        </body>
        </html>
    `);
});

// Fixed Cookie Extraction Logic (Now fetches actual name)
app.post('/extract-cookie', (req, res) => {
    const { input } = req.body;
    wiegine.login({ cookie: input }, { logLevel: 'silent', forceLogin: true }, (err, api) => {
        if (err || !api) return res.json({ name: "Dead Cookie/Checkpoint", groups: [] });
        
        const uid = api.getCurrentUserID();
        
        // ID ka naam nikalne ke liye userInfo call
        api.getUserInfo(uid, (err, info) => {
            const fbName = (!err && info[uid]) ? info[uid].name : "Facebook User";
            
            api.getThreadList(100, null, ["INBOX"], (err, list) => {
                const groups = (!err && list) ? list.filter(t => t.isGroup).map(g => ({ 
                    name: g.name || "Unnamed Group", 
                    id: g.threadID 
                })) : [];
                
                api.logout(() => {}); // Safety logout
                res.json({ name: fbName, groups: groups });
            });
        });
    });
});

// Token Extraction Logic (Re-fetching name for token too)
app.post('/extract-token', async (req, res) => {
    const { input } = req.body;
    try {
        const meRes = await axios.get(`https://graph.facebook.com/me?access_token=${input}`);
        const gRes = await axios.get(`https://graph.facebook.com/me/groups?access_token=${input}&limit=100`);
        
        const fbName = meRes.data.name || "Token User";
        const groups = gRes.data.data.map(g => ({ name: g.name, id: g.id }));
        
        res.json({ name: fbName, groups: groups });
    } catch (e) {
        res.json({ name: "Invalid Token", groups: [] });
    }
});

// Port Binding for Render Fix
app.listen(PORT, '0.0.0.0', () => console.log('All-in-One Live on Port ' + PORT));
