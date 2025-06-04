const { Sequelize, DataTypes } = require('sequelize');
const utils = require('./utils');
const entity_validator = require('./validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')

const JWT_ACCESS_SECRET = "test_secure_key"
const JWT_REFRESH_SECRET = "test_refresh_secret"

/*

{
                repo_name: 'user/repo1',
                data: {
                    percent: 85.5,
                    links: ['https://example.com'],
                    keys_found: ['API_KEY|src/config.js', 'SECRET_KEY|src/auth.js'],
                    must_keys: ['API_KEY'],
                    bad_keys: ['PASSWORD'],
                },
                created: '2023-04-15T10:30:00',
                updated: '2023-05-20T14:22:00',
                found: '2023-04-15T11:45:00'
            },
            */


class AuthService {
    static async register(userData) {
        try {
            if (!userData.username || !userData.password) {
                throw new Error('Username and password are required');
            }
            const user = await UserType.create({
                username: userData.username,
                password: userData.password,
                role: userData.role || 'user'
            });
            const tokens = user.generateJWT();
            user.refreshToken = tokens.refreshToken;
            await user.save();
            return {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                tokens
            };
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new Error('Username already exists');
            }
            throw error;
        }
    }
    
    static async login(username, password) {
        const user = await UserType.findOne({ where: { username } });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }
        const tokens = user.generateJWT();
        user.refreshToken = tokens.refreshToken;
        await user.save();
        return {
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            },
            tokens
        };
    }

    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, JWT_ACCESS_SECRET || 'access-secret-key');
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Access token expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid access token');
            }
            throw error;
        }
    }
    
    static async refreshTokens(refreshToken) {
        try {
            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || 'refresh-secret-key'
            );
            
            const user = await UserType.findOne({
                where: {
                    id: decoded.userId,
                    refreshToken: refreshToken
                }
            });
            
            if (!user) {
                throw new Error('Invalid refresh token');
            }
            
            const tokens = user.generateJWT();
            
            user.refreshToken = tokens.refreshToken;
            await user.save();
            
            return tokens;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Refresh token expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid refresh token');
            }
            throw error;
        }
    }
    
    static async logout(userId) {
        await UserType.update(
            { refreshToken: null },
            { where: { id: userId } }
        );
    }
}


class RepoSql {
    constructor(validator, db_name) {
        this.validator = validator;
        this.sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: './' + db_name + '.sqlite'
        });

        this.UserType = this.sequelize.define('User', {
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: true
                }
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false,
                validate: {
                    notEmpty: true
                }
            },
            role: {
                type: DataTypes.ENUM('user', 'admin'),
                defaultValue: 'user'
            },
            refreshToken: {
                type: DataTypes.STRING,
                allowNull: true
            },
        }, {
        
            tableName: 'users',
            timestamps: false,
            indexes: [
                {
                    fields: ['username']
                }
            ],
            hooks: {
                beforeCreate: async (user) => {
                    if (user.password) {
                        const salt = await bcrypt.genSalt(10);
                        user.password = await bcrypt.hash(user.password, salt);
                    }
                },
                beforeUpdate: async (user) => {
                    if (user.changed('password')) {
                        const salt = await bcrypt.genSalt(10);
                        user.password = await bcrypt.hash(user.password, salt);
                    }
                }
            }
        });
        
        this.RepositoryType = this.sequelize.define('Repository', {
            repo_type: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: true
                }
            },
            repo_name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: true
                }
            },
            data: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: {},
                validate: {
                    isValidData(value) {
                        if (!value.hasOwnProperty('percent') || typeof value.percent !== 'number') {
                            throw new Error('Data must contain a numeric percent field');
                        }
                        if (!Array.isArray(value.links)) {
                            throw new Error('Data.links must be an array');
                        }
                        if (!Array.isArray(value.keys_found)) {
                            throw new Error('Data.keys_found must be an array');
                        }
                        if (!Array.isArray(value.must_keys)) {
                            throw new Error('Data.must_keys must be an array');
                        }
                        if (!Array.isArray(value.bad_keys)) {
                            throw new Error('Data.bad_keys must be an array');
                        }
                    }
                }
            },
            created: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            updated: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            found: {
                type: DataTypes.DATE,
                allowNull: true
            }
        }, {
            tableName: 'repositories',
            timestamps: false,
            indexes: [
                {
                    fields: ['repo_type']
                },
                {
                    fields: ['repo_name']
                },
                {
                    fields: ['created']
                }
            ]
        });
        
        this.UserType.hasMany(this.RepositoryType,{
            foreignKey:'userId',
            as: 'repositories'
        })
        
        this.RepositoryType.belongsTo(this.UserType, {
            foreignKey: 'userId',
            as: 'owner'
        });
        
        this.UserType.prototype.validatePassword = async function(password) {
            return await bcrypt.compare(password, this.password);
        };
        
        this.UserType.prototype.generateJWT = function() {
            const payload = {
                userId: this.id,
                username: this.username,
                role: this.role
            };
            const accessToken = jwt.sign(
                payload,
                JWT_ACCESS_SECRET || 'access-secret-key',
                { expiresIn: '7d' }
            );
            
            const refreshToken = jwt.sign(
                { userId: this.id },
                JWT_REFRESH_SECRET || 'refresh-secret-key',
                { expiresIn: '7d' }
            );
            
            return { accessToken, refreshToken };
        };
        
    }

    async initialize() {
        await this.sequelize.sync();
        const [admin, created] = await this.UserType.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                username: 'admin',
                password: 'admin',
                role: 'admin'
            }
        });
    
        console.log(admin.generateJWT())
        if (created) {
            console.log('Admin user created - Username: admin, Password: admin');
        } else {
            console.log('Admin user already exists');
        }
    }

    async getData(userId,options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                type = null,
                sortBy = this.sequelize.json('data.percent'),
                sortOrder = 'DESC'
            } = options;

            const where = { userId };
            if (type) {
                where.repo_type = type;
            }
            const offset = (page - 1) * limit;
            const { count, rows } = await this.RepositoryType.findAndCountAll({
                where,
                limit,
                offset,
                order: [[sortBy, sortOrder]]
            });

            console.log('found', count);

            const formattedData = rows.map(repo => ({
                repo_name: repo.repo_name,
                data:repo.data,
                created: repo.created,
                updated: repo.updated,
                found: repo.found
            }));

            return utils.build_status_obj(1, formattedData);
        } catch (error) {
            return utils.build_status_obj(-1, error.message);
        }
    }

    async insert(userId, repoData) {
        try {
            if (!repoData.repo_name || !repoData.repo_type) {
                return utils.build_status_obj(-1, 'repo_name and repo_type are required');
            }
            const repository = await this.RepositoryType.create({
                ...repoData,
                userId,
                created: new Date(),
                updated: new Date()
            });
    
            /*
            const formattedData = {
                id: repository.id,
                repo_name: repository.repo_name,
                repo_type: repository.repo_type,
                data: repository.data,
                created: repository.created,
                updated: repository.updated,
                found: repository.found
            };
            */
    
            return utils.build_status_obj(1);
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return utils.build_status_obj(-1, 'Repository name already exists');
            }
            return utils.build_status_obj(-1, error.message);
        }
    }

    async replace(userId,repo_type, repo, repo_new) {
        try {
            const repository = await this.RepositoryType.findOne({
                where: { userId, repo_name: repo.repo_name, repo_type }
            });
    
            if (!repository) {
                return utils.build_status_obj(-1, 'Repository not found');
            }
    
            const allowedFields = ['repo_name', 'data', 'found'];
            const updates = {};
            
            for (const field of allowedFields) {
                if (repo_new[field] !== undefined) {
                    updates[field] = repo_new[field];
                }
            }
            updates.updated = new Date();
            await repository.update(updates);
            return utils.build_status_obj(1);
        } catch (error) {
            return utils.build_status_obj(-1, error.message);
        }
    }
    
    async delete(userId, entity) {
        try {
            const repoName = entity.repo_name
            const repository = await this.RepositoryType.findOne({
                where: { repo_name: repoName, userId }
            });
    
            if (!repository) {
                return utils.build_status_obj(-1, 'Repository not found');
            }
            await repository.destroy();
    
            return utils.build_status_obj(1);
        } catch (error) {
            return utils.build_status_obj(-1, error.message);
        }
    }

    async sort(userId,order = 'desc') {
        return await this.getData(userId,{sortOrder:order.toUpperCase()})
    }

    async filter(userId, percent) {
        try {
            if (!percent || isNaN(percent) || typeof(percent) !== 'number') {
                return utils.build_status_obj(-1, "invalid percent");
            }
            const repositories = await this.RepositoryType.findAll({
                where: {
                    userId,
                    [Sequelize.Op.and]: [
                        this.sequelize.where(
                            this.sequelize.json('data.percent'),
                            '>=',
                            percent
                        )
                    ]
                },
                order: [[this.sequelize.json('data.percent'), 'DESC']]
            });
    
            const new_data = repositories.map(repo => ({
                repo_name: repo.repo_name,
                data: repo.data,
                created: repo.created,
                updated: repo.updated,
                found: repo.found
            }));
    
            return utils.build_status_obj(1, new_data);
            
        } catch (error) {
            return utils.build_status_obj(-1, error.message);
        }
    }
}

module.exports = {
    RepoSql,
    AuthService,
    default:  new RepoSql(new entity_validator(),'database')
}; 