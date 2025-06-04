const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const FullRepoImport = require('./repo_sql.js');
const Repo = FullRepoImport.default;
const AuthService = FullRepoImport.AuthService;

const utils = require('./utils.js');

const app = express();
const PORT = process.env.PORT || 5555;

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
        fileSize: 1024 * 1024 * 100
    }
});

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json(utils.build_status_obj(-1, err.message));
});


function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    try {
        const decoded = AuthService.verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.message === 'Access token expired') {
            return res.status(401).json({ 
                error: 'Access token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        return res.status(403).json({ error: error.message });
    }
}

function authorize(roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}



async function validateRepo(req, res, next) {
    const repoName = req.query.repo_name;
    console.log('Repository name:', repoName);
    
    if (!repoName) {
        return res.json(utils.build_status_obj(-1, "Repository undefined"));
    }
    req.repo_type = repoName
    req.repository = Repo;
    next();
}

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const tokens = await AuthService.login(username, password);
        res.json(tokens);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const tokens = await AuthService.refreshAccessToken(refreshToken);
        res.json(tokens);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

app.post('/api/auth/logout', authenticateJWT, async (req, res) => {
    try {
        await AuthService.logout(req.user.userId);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/profile', authenticateJWT, async (req, res) => {
    const user = await UserType.findByPk(req.user.userId, {
        attributes: ['id', 'username', 'role']
    });
    res.json(user);
});


app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.json(utils.build_status_obj(-1, "No file uploaded"));
        }
        res.json(utils.build_status_obj(1, {
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}`
        }));
    } catch (error) {
        console.error('File upload error:', error);
        res.json(utils.build_status_obj(-1, error.message));
    }
});

app.get('/api/download/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../uploads', filename);
        
        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.json(utils.build_status_obj(-1, "File not found"));
        }
    } catch (error) {
        console.error('File download error:', error);
        res.json(utils.build_status_obj(-1, error.message));
    }
});

app.get('/api/latest-data', (req, res) => {
    try {
        const newEntity = {
            id: Date.now(),
            value: Math.random() * 100,
            timestamp: new Date().toISOString()
        };
        res.json(utils.build_status_obj(1, newEntity));
    } catch (error) {
        console.error('Latest data error:', error);
        res.json(utils.build_status_obj(-1, error.message));
    }
});

app.get('/api/health', (req, res) => res.json(utils.build_status_obj(1)));












app.get('/api/entities', authenticateJWT, validateRepo, async (req, res) => {
    try {
        const resp = await req.repository.getData(req.user.userId,{type:req.repo_type});
        console.log('Entities retrieved:', resp);
        res.json(resp);
    } catch (error) {
        console.error('Get entities error:', error);
        res.json(utils.build_status_obj(-1, error.message));
    }
});

app.get('/api/stats', authenticateJWT, validateRepo, async (req, res) => {
    try {
        const resp = await req.repository.getData(req.user.userId,{type:req.repo_type});
        res.json(resp);
    } catch (error) {
        console.error('Get stats error:', error);
        res.json(utils.build_status_obj(-1, error.message));
    }
});

// Add entity
app.post('/api/add-entity', authenticateJWT,validateRepo, async (req, res) => {
    try {
        var entity = req.body;
        if (!entity) {
            return res.json(utils.build_status_obj(-1, "Undefined entity"));
        }

        // Convert dates to ISO format
        if (entity.created) {
            entity.created = new Date(entity.created).toISOString();
        }
        if (entity.updated) {
            entity.updated = new Date(entity.updated).toISOString();
        }
        if (entity.found) {
            entity.found = new Date(entity.found).toISOString();
        }

        entity.repo_type = req.repo_type;
        console.log(entity)
        const resp = await req.repository.insert(req.user.userId,entity);
        console.log('RESP',resp)
        if(resp.status == -1){
            res.status(400)
        }
        res.json(resp);
    } catch (error) {
        console.error('Add entity error:', error);
        res.json(utils.build_status_obj(-1, error.message));
    }
});

// Modify entity
app.patch('/api/modify-entity', authenticateJWT,validateRepo, async (req, res) => {
    try {
        const [entity, newEntity] = req.body;
        if (!entity || !newEntity) {
            return res.json(utils.build_status_obj(-1, "Undefined entity"));
        }

        if (newEntity.created) {
            newEntity.created = new Date(newEntity.created).toISOString();
        }
        if (newEntity.updated) {
            newEntity.updated = new Date(newEntity.updated).toISOString();
        }
        if (newEntity.found) {
            newEntity.found = new Date(newEntity.found).toISOString();
        }

        const resp = await req.repository.replace(req.user.userId,req.repo_type, entity, newEntity);
        if(resp.status == -1){
            res.status(400)
        }
        res.json(resp);
    } catch (error) {
        console.error('Modify entity error:', error);
        res.json(utils.build_status_obj(-1, error.message));
    }
});

// Delete entity
app.delete('/api/delete', authenticateJWT,validateRepo, async (req, res) => {
    try {
        const entity = req.body;
        if (!entity) {
            return res.json(utils.build_status_obj(-1, "Undefined entity"));
        }

        const resp = await req.repository.delete(req.user.userId,entity);
        if(resp.status == -1){
            res.status(400)
        }
        res.json(resp);
    } catch (error) {
        console.error('Delete entity error:', error);
        res.json(utils.build_status_obj(-1, error.message));
    }
});

// Filter entities
app.get('/api/filter-entities', authenticateJWT,validateRepo, async (req, res) => {
    try {
        const percent = parseFloat(req.query.percent);
        if (isNaN(percent)) {
            return res.json(utils.build_status_obj(-1, "Invalid percent value"));
        }

        const resp = await req.repository.filter(req.user.userId,percent);
        if(resp.status == -1){
            res.status(400)
        }
        res.json(resp);
    } catch (error) {
        console.error('Filter entities error:', error);
        res.json(utils.build_status_obj(-1, error.message));
    }
});

// Sort entities
app.get('/api/sort-entities',authenticateJWT,validateRepo, async (req, res) => {
    try {
        const order = req.query.order?.toLowerCase();
        if (order !== 'asc' && order !== 'desc') {
            return res.json(utils.build_status_obj(-1, "Invalid sort order"));
        }

        const resp = await req.repository.sort(req.user.userId,order);
        if(resp.status == -1){
            res.status(400)
        }
        res.json(resp);
    } catch (error) {
        console.error('Sort entities error:', error);
        res.json(utils.build_status_obj(-1, error.message));
    }
});

// Init
async function startServer() {
    try {
        await Repo.initialize();
        
        app.listen(PORT, () => {
            console.log(`Backend server running on http://localhost:${PORT}`);
            console.log('Repositories initialized successfully');
        });
    } catch (error) {
        console.error('Failed to initialize repositories:', error);
        process.exit(1);
    }
}

startServer(); 