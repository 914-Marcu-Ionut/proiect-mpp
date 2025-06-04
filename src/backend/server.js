const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const FullRepoImport = require('./repo.js');
const FullRepo = FullRepoImport.default;
const utils = require('./utils.js');
const ws = require('ws')
//const WebSocketServer = ws.WebSocketServer


const app = express();
const wss = new ws.Server({ port: 8080 });
const PORT = process.env.PORT || 5555;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 100 // 100MB limit
    }
});

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.json(utils.build_status_obj(-1, "No file uploaded"));
    }
    res.json(utils.build_status_obj(1, {
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`
    }));
});

// File download endpoint
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.json(utils.build_status_obj(-1, "File not found"));
    }
});

// Get latest data point
app.get('/api/latest-data', (req, res) => {
    const newEntity = {
        id: Date.now(),
        value: Math.random() * 100,
        timestamp: new Date().toISOString()
    };
    res.json(utils.build_status_obj(1, newEntity));
});

app.get('/api/health', (req, res) => res.json(utils.build_status_obj(1)));

function validateRepoParam(req) {
    const repoName = req.query.repo_name
    console.log('repo name', repoName)
    if (!repoName) {
        return [-1, utils.build_status_obj(-1, "repo undefined")]
    }
    const repo = FullRepo.get(repoName)
    if (repo == null) {
        return [-1, utils.build_status_obj(-1, "repo not found")]
    }
    return [1, repo]
}

// GET entity
app.get('/api/entities', (req, res) => {
    const [repo_status, repo] = validateRepoParam(req)
    if (repo_status == -1) {
        return res.json(repo)
    }
    const resp = repo.getData()
    console.log(resp)
    return res.json(resp)
});

app.get('/api/stats', (req, res) => {

    const resp = repo.getData()
    return res.json(resp)
});

app.post('/api/add-entity', (req, res) => {
    const [repo_status, repo] = validateRepoParam(req)
    if (repo_status == -1) {
        return res.json(repo)
    }

    const entity = req.body;
    if (!entity) {
        return utils.build_status_obj(-1, "undefined entity")
    }

    const resp = repo.insert(entity)
    return res.json(resp)
});


app.patch('/api/modify-entity', (req, res) => {
    const [repo_status, repo] = validateRepoParam(req)
    if (repo_status == -1) {
        return res.json(repo)
    }

    const entity = req.body[0];
    if (!entity) {
        return utils.build_status_obj(-1, "undefined entity")
    }

    const new_entity = req.body[1];
    if (!new_entity) {
        return utils.build_status_obj(-1, "undefined entity")
    }


    const resp = repo.replace(entity, new_entity)
    return res.json(resp)
});

app.delete('/api/delete', (req, res) => {
    const [repo_status, repo] = validateRepoParam(req)
    if (repo_status == -1) {
        return res.json(repo)
    }

    const entity = req.body;
    if (!entity) {
        return utils.build_status_obj(-1, "undefined entity")
    }

    const resp = repo.delete(entity)
    return res.json(resp)
});


app.get('/api/filter-entities', (req, res) => {
    const [repo_status, repo] = validateRepoParam(req)
    if (repo_status == -1) {
        return res.json(repo)
    }

    const resp = repo.filter(parseFloat(req.query.percent))
    return res.json(resp)
});


app.get('/api/sort-entities', (req, res) => {
    const [repo_status, repo] = validateRepoParam(req)
    if (repo_status == -1) {
        return res.json(repo)
    }

    const resp = repo.sort(req.query.order)
    return res.json(resp)
});


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


setTimeout(() => {
    console.log('starting ws server...')
    wss.on('connection', async function connection(ws) {
        ws.on('error', console.error);

        while (true) {
            const newEntity = {
                id: Date.now(),
                value: Math.random() * 100,
                timestamp: new Date().toISOString()
            };
            try {
                ws.send(JSON.stringify(newEntity));
            } catch {
                console.log('client disconnected')
                break
            }
            await sleep(2500)
        }
    })
    console.log('listening ws')
}, 1)

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
}); 