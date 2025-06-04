const { faker } = require('@faker-js/faker');
const { Sequelize, DataTypes } = require('sequelize');
const utils = require('./utils');

// Initialize Sequelize with SQLite for default repo
const defaultSequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database_default.sqlite'
});

// Initialize Sequelize with SQLite for AI repo
const aiSequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database_ai.sqlite'
});

// Define Repository model for default repo
const DefaultRepository = defaultSequelize.define('Repository', {
    repo_name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    percent: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    created: {
        type: DataTypes.DATE,
        allowNull: false
    },
    updated: {
        type: DataTypes.DATE,
        allowNull: false
    },
    found: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

// Define Repository model for AI repo
const AiRepository = aiSequelize.define('Repository', {
    repo_name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    percent: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    created: {
        type: DataTypes.DATE,
        allowNull: false
    },
    updated: {
        type: DataTypes.DATE,
        allowNull: false
    },
    found: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

// Define Key model for default repo
const DefaultKey = defaultSequelize.define('Key', {
    key_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('found', 'must', 'bad'),
        allowNull: false
    }
});

// Define Key model for AI repo
const AiKey = aiSequelize.define('Key', {
    key_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('found', 'must', 'bad'),
        allowNull: false
    }
});

// Define Link model for default repo
const DefaultLink = defaultSequelize.define('Link', {
    url: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Define Link model for AI repo
const AiLink = aiSequelize.define('Link', {
    url: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Set up relationships for default repo
DefaultRepository.hasMany(DefaultLink);
DefaultLink.belongsTo(DefaultRepository);
DefaultRepository.belongsToMany(DefaultKey, { 
    through: 'DefaultRepositoryKeys',
    foreignKey: 'RepositoryRepoName',
    otherKey: 'KeyId'
});
DefaultKey.belongsToMany(DefaultRepository, { 
    through: 'DefaultRepositoryKeys',
    foreignKey: 'KeyId',
    otherKey: 'RepositoryRepoName'
});

// Set up relationships for AI repo
AiRepository.hasMany(AiLink);
AiLink.belongsTo(AiRepository);
AiRepository.belongsToMany(AiKey, { 
    through: 'AiRepositoryKeys',
    foreignKey: 'RepositoryRepoName',
    otherKey: 'KeyId'
});
AiKey.belongsToMany(AiRepository, { 
    through: 'AiRepositoryKeys',
    foreignKey: 'KeyId',
    otherKey: 'RepositoryRepoName'
});

// Add indices for better performance
async function addIndices(sequelize) {
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_percent ON Repositories(percent);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_created ON Repositories(created);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_type ON Keys(type);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_url ON Links(url);');
}

async function generateData() {
    try {
        // Sync both databases
        console.log('Syncing databases...');
        await defaultSequelize.sync({ force: true });
        await aiSequelize.sync({ force: true });

        // Add indices to both databases
        console.log('Adding indices...');
        await addIndices(defaultSequelize);
        await addIndices(aiSequelize);

        const BATCH_SIZE = 1000;
        const TOTAL_REPOS = 50000;

        // Generate data for default repo
        console.log('Generating data for default repo...');
        for (let i = 0; i < TOTAL_REPOS; i += BATCH_SIZE) {
            const batchSize = Math.min(BATCH_SIZE, TOTAL_REPOS - i);
            const defaultRepos = [];
            const defaultLinks = [];
            const defaultKeys = [];
            const defaultRepoKeys = [];

            for (let j = 0; j < batchSize; j++) {
                const timestamp = Date.now();
                const randomSuffix = faker.string.alphanumeric(8);
                const repoName = `${faker.internet.username()}-${timestamp}-${randomSuffix}`;
                const percent = faker.number.float({ min: 0, max: 100, precision: 0.01 });
                const created = faker.date.past();
                const updated = faker.date.recent();
                const found = faker.datatype.boolean() ? faker.date.recent() : null;

                defaultRepos.push({
                    repo_name: repoName,
                    percent,
                    created,
                    updated,
                    found
                });

                // Generate 1-5 links per repo
                const numLinks = faker.number.int({ min: 1, max: 5 });
                for (let k = 0; k < numLinks; k++) {
                    defaultLinks.push({
                        url: faker.internet.url(),
                        RepositoryRepoName: repoName
                    });
                }

                // Generate 2-10 keys per repo
                const numKeys = faker.number.int({ min: 2, max: 10 });
                const numFound = faker.number.int({ min: 1, max: Math.max(1, numKeys - 2) });
                const numMust = faker.number.int({ min: 1, max: Math.max(1, numKeys - numFound - 1) });
                const numBad = numKeys - numFound - numMust;

                // Generate found keys
                for (let k = 0; k < numFound; k++) {
                    const keyName = faker.lorem.word();
                    defaultKeys.push({
                        key_name: keyName,
                        file_path: faker.system.filePath(),
                        type: 'found'
                    });
                }

                // Generate must keys
                for (let k = 0; k < numMust; k++) {
                    const keyName = faker.lorem.word();
                    defaultKeys.push({
                        key_name: keyName,
                        file_path: null,
                        type: 'must'
                    });
                }

                // Generate bad keys
                for (let k = 0; k < numBad; k++) {
                    const keyName = faker.lorem.word();
                    defaultKeys.push({
                        key_name: keyName,
                        file_path: null,
                        type: 'bad'
                    });
                }
            }

            // Insert batch into default database
            await defaultSequelize.transaction(async (t) => {
                const repos = await DefaultRepository.bulkCreate(defaultRepos, { transaction: t });
                await DefaultLink.bulkCreate(defaultLinks, { transaction: t });
                const keys = await DefaultKey.bulkCreate(defaultKeys, { transaction: t });

                // Create associations after both repos and keys are created
                const repoKeys = [];
                let keyIndex = 0;
                for (const repo of repos) {
                    const numKeys = faker.number.int({ min: 2, max: 10 });
                    for (let k = 0; k < numKeys; k++) {
                        if (keys[keyIndex]) {
                            repoKeys.push({
                                RepositoryRepoName: repo.repo_name,
                                KeyId: keys[keyIndex].id
                            });
                            keyIndex++;
                        }
                    }
                }
                await defaultSequelize.models.DefaultRepositoryKeys.bulkCreate(repoKeys, { transaction: t });
            });

            console.log(`Generated ${i + batchSize} default repos`);
        }

        // Generate data for AI repo
        console.log('Generating data for AI repo...');
        for (let i = 0; i < TOTAL_REPOS; i += BATCH_SIZE) {
            const batchSize = Math.min(BATCH_SIZE, TOTAL_REPOS - i);
            const aiRepos = [];
            const aiLinks = [];
            const aiKeys = [];
            const aiRepoKeys = [];

            for (let j = 0; j < batchSize; j++) {
                const timestamp = Date.now();
                const randomSuffix = faker.string.alphanumeric(8);
                const repoName = `${faker.internet.username()}-${timestamp}-${randomSuffix}`;
                const percent = faker.number.float({ min: 0, max: 100, precision: 0.01 });
                const created = faker.date.past();
                const updated = faker.date.recent();
                const found = faker.datatype.boolean() ? faker.date.recent() : null;

                aiRepos.push({
                    repo_name: repoName,
                    percent,
                    created,
                    updated,
                    found
                });

                // Generate 1-5 links per repo
                const numLinks = faker.number.int({ min: 1, max: 5 });
                for (let k = 0; k < numLinks; k++) {
                    aiLinks.push({
                        url: faker.internet.url(),
                        RepositoryRepoName: repoName
                    });
                }

                // Generate 2-10 keys per repo
                const numKeys = faker.number.int({ min: 2, max: 10 });
                const numFound = faker.number.int({ min: 1, max: Math.max(1, numKeys - 2) });
                const numMust = faker.number.int({ min: 1, max: Math.max(1, numKeys - numFound - 1) });
                const numBad = numKeys - numFound - numMust;

                // Generate found keys
                for (let k = 0; k < numFound; k++) {
                    const keyName = faker.lorem.word();
                    aiKeys.push({
                        key_name: keyName,
                        file_path: faker.system.filePath(),
                        type: 'found'
                    });
                }

                // Generate must keys
                for (let k = 0; k < numMust; k++) {
                    const keyName = faker.lorem.word();
                    aiKeys.push({
                        key_name: keyName,
                        file_path: null,
                        type: 'must'
                    });
                }

                // Generate bad keys
                for (let k = 0; k < numBad; k++) {
                    const keyName = faker.lorem.word();
                    aiKeys.push({
                        key_name: keyName,
                        file_path: null,
                        type: 'bad'
                    });
                }
            }

            // Insert batch into AI database
            await aiSequelize.transaction(async (t) => {
                const repos = await AiRepository.bulkCreate(aiRepos, { transaction: t });
                await AiLink.bulkCreate(aiLinks, { transaction: t });
                const keys = await AiKey.bulkCreate(aiKeys, { transaction: t });

                // Create associations after both repos and keys are created
                const repoKeys = [];
                let keyIndex = 0;
                for (const repo of repos) {
                    const numKeys = faker.number.int({ min: 2, max: 10 });
                    for (let k = 0; k < numKeys; k++) {
                        if (keys[keyIndex]) {
                            repoKeys.push({
                                RepositoryRepoName: repo.repo_name,
                                KeyId: keys[keyIndex].id
                            });
                            keyIndex++;
                        }
                    }
                }
                await aiSequelize.models.AiRepositoryKeys.bulkCreate(repoKeys, { transaction: t });
            });

            console.log(`Generated ${i + batchSize} AI repos`);
        }

        console.log('Data generation completed successfully!');
        await defaultSequelize.close();
        await aiSequelize.close();
    } catch (error) {
        console.error('Error generating data:', error);
        await defaultSequelize.close();
        await aiSequelize.close();
        process.exit(1);
    }
}

generateData(); 