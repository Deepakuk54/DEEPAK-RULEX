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
                .container { width: 100%; max-width: 600px; background: #161b22; padding: 25px; border-radius: 12px; border: 1px solid #30363d; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                h1 { text-align: center; color: #58a6ff; font-size: 24px; margin-bottom: 20px; }
                textarea { width: 100%; height: 120px; background: #0d1117; color: #7ee787; border: 1px solid #30363d; border-radius: 8px; padding: 12px; margin-bottom: 15px; outline: none; }
                .main-btn { width: 100%; padding: 14px; background: #238636; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
                #status { margin-top: 15px; text-align: center; color: #ffa657; }
                .account-card { background: #010409; border: 1px solid #30363d; border-radius: 10px; padding: 15px; margin-top: 15px; border-left: 5px solid #58a6ff; }
                .group-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #21262d; font-size: 13px; }
                .uid-badge { background: #1f6feb; color: white; padding: 3px 7px; border-radius: 4px; font-family: monospace; cursor: pointer; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>◈ Deepak Rajput Brand ◈</h1>
                <textarea id="userInput" placeholder="Paste String Cookies here..."></textarea>
                <button class="main-btn" onclick="start()">START EXTRACTION</button>
                <div id="status">Ready...</div>
                <div id="results"></div>
            </div>
            <script>
                async function start() {
                    const data = document.getElementById('userInput').value.trim().split('\\n').filter(Boolean);
                    const resultsDiv = document.getElementById('results');
                    const status = document.getElementById('status');
                    resultsDiv.innerHTML = '';
                    for(let i=0; i < data.length; i++) {
                        status.innerText = "Checking " + (i+1) + "/" + data.length;
                        try {
                            const res = await fetch('/extract-cookie', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({ input: data[i].trim() })
                            });
                            const result = await res.json();
                            let html = \`<div class="account-card">
                                <b>👤 \${result.name}</b><br>
                                <small style="color:#8b949e">UID: \${result.uid}</small>\`;
                            if(result.groups && result.groups.length > 0) {
                                result.groups.forEach(g => {
                                    html += \`<div class="group-item"><span>\${g.name}</span><span class="uid-badge" onclick="navigator.clipboard.writeText('\${g.id}')">\${g.id}</span></div>\`;
                                });
                            } else { html += '<p style="color:red">No Groups Found</p>'; }
                            html += '</div>';
                            resultsDiv.innerHTML += html;
                        } catch(e) {}
                    }
                    status.innerText = "✅ Finished!";
                }
            </script>
        </body>
        </html>
    `);
});

// Conversion function: String cookie ko AppState array mein badalne ke liye
function stringToAppState(str) {
    return str.split(';').map(v => v.split('=')).reduce((acc, v) => {
        if (v.length > 1) {
            acc.push({
                key: v[0].trim(),
                value: v[1].trim(),
                domain: "facebook.com",
                path: "/",
                hostOnly: false
            });
        }
        return acc;
    }, []);
}

app.post('/extract-cookie', (req, res) => {
    const { input } = req.body;
    try {
        // Step 1: Convert String to AppState
        const state = stringToAppState(input);

        // Step 2: Login using converted AppState
        wiegine.login({ appState: state }, { 
            logLevel: 'silent', 
            forceLogin: true,
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        }, (err, api) => {
            if (err || !api) {
                return res.json({ name: "Dead/Invalid", uid: "---", groups: [] });
            }
            
            const uid = api.getCurrentUserID();
            
            api.getThreadList(100, null, ["INBOX"], (err, list) => {
                const groups = (!err && list) ? list.filter(t => t.isGroup).map(g => ({ name: g.name || "Group", id: g.threadID })) : [];
                
                api.getUserInfo(uid, (e, info) => {
                    const name = (!e && info[uid]) ? info[uid].name : "Active User";
                    res.json({ name: name, uid: uid, groups: groups });
                });
            });
        });
    } catch (e) {
        res.json({ name: "Format Error", uid: "---", groups: [] });
    }
});

app.listen(PORT, '0.0.0.0', () => console.log('Live!'));
