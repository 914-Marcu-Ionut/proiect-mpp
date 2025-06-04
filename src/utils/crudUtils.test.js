import {
    addRepository,
    deleteRepository,
    sortRepositoriesByPercent,
    sortRepositoriesByDate,
    filterData
} from './crudUtils';

const mockTables = {
    'default': [
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
        {
            repo_name: 'user/repo2',
            data: {
                percent: 65.2,
                links: ['https://example.org'],
                keys_found: ['DB_PASS|db/config.js'],
                must_keys: ['API_KEY', 'DB_PASS'],
                bad_keys: [],
            },
            created: '2023-03-10T08:15:00',
            updated: '2023-06-05T09:30:00',
            found: '2023-03-10T11:20:00'
        }
    ],
    'ai': [
        {
            repo_name: 'user/ai-repo',
            data: {
                percent: 92.7,
                links: ['https://ai.project.com'],
                keys_found: ['PROD_API_KEY|config/prod.js'],
                must_keys: ['PROD_API_KEY'],
                bad_keys: [],
            },
            created: '2023-02-05T12:45:00',
            updated: '2023-05-18T16:30:00',
            found: '2023-02-06T09:10:00'
        }
    ]
};

describe('CRUD Utility Functions', () => {
    describe('Filter check', () => {
        test("Check filter", () => {
            let tableData = [{
                data: {
                    name: "1",
                    percent: 100
                }
            }, {
                data: {
                    name: "2",
                    percent: 50
                }
            }, {
                data: {
                    name: "3",
                    percent: 25
                }
            }]
            let new_table = filterData(tableData, 90)
            expect(new_table.length).toEqual(1);
            expect(new_table[0].data.percent).toEqual(100);

            new_table = filterData(tableData, 40)
            expect(new_table.length).toEqual(2);
            expect(new_table[1].data.percent).toEqual(50);
        })
    })
    describe('addRepository', () => {
        test('adds a repository to an existing table', () => {
            const newRepo = {
                repo_name: 'test/new-repo',
                data: {
                    percent: 75.0,
                    links: [],
                    keys_found: ['TEST_KEY|path.js'],
                    must_keys: ['TEST_KEY'],
                    bad_keys: [],
                }
            };

            const result = addRepository(mockTables, 'default', newRepo);

            expect(Object.keys(result)).toEqual(Object.keys(mockTables));

            expect(result.default.length).toBe(mockTables.default.length + 1);

            const addedRepo = result.default.find(repo => repo.repo_name === 'test/new-repo');
            expect(addedRepo).toBeDefined();
            expect(addedRepo.data.percent).toBe(75.0);

            expect(result.ai).toEqual(mockTables.ai);
        });

        test('adds a repository to a non-existent table', () => {
            const newRepo = {
                repo_name: 'test/new-repo',
                data: {
                    percent: 75.0,
                    links: [],
                    keys_found: ['TEST_KEY|path.js'],
                    must_keys: ['TEST_KEY'],
                    bad_keys: [],
                }
            };

            const result = addRepository(mockTables, 'newTable', newRepo);

            expect(result.newTable).toBeDefined();
            expect(result.newTable.length).toBe(1);

            expect(result.newTable[0].repo_name).toBe('test/new-repo');
        });

        test('adds timestamp data to new repository', () => {
            const newRepo = {
                repo_name: 'test/new-repo',
                data: {
                    percent: 75.0,
                    links: [],
                    keys_found: [],
                    must_keys: [],
                    bad_keys: [],
                }
            };

            const result = addRepository(mockTables, 'default', newRepo);
            const addedRepo = result.default.find(repo => repo.repo_name === 'test/new-repo');

            expect(addedRepo.created).toBeDefined();
            expect(addedRepo.updated).toBeDefined();
            expect(addedRepo.found).toBeDefined();

            expect(new Date(addedRepo.created).toISOString()).toBe(addedRepo.created);
            expect(new Date(addedRepo.updated).toISOString()).toBe(addedRepo.updated);
            expect(new Date(addedRepo.found).toISOString()).toBe(addedRepo.found);
        });
    });

    describe('deleteRepository', () => {
        test('deletes a repository from a table by index', () => {
            const firstRepoName = mockTables.default[0].repo_name;
            const result = deleteRepository(mockTables, 'default', 0);

            expect(Object.keys(result)).toEqual(Object.keys(mockTables));

            expect(result.default.length).toBe(mockTables.default.length - 1);

            const stillHasRepo = result.default.some(repo => repo.repo_name === firstRepoName);
            expect(stillHasRepo).toBe(false);

            expect(result.ai).toEqual(mockTables.ai);
        });

        test('handles invalid index gracefully', () => {
            const result = deleteRepository(mockTables, 'default', 999);
            expect(result.default).toEqual(mockTables.default);
        });

        test('handles non-existent table gracefully', () => {
            const result = deleteRepository(mockTables, 'nonExistentTable', 0);
            expect(result.default).toEqual(mockTables.default);
            expect(result.ai).toEqual(mockTables.ai);
        });
    });

    describe('sortRepositoriesByPercent', () => {
        test('sorts repositories by percent in descending order (default)', () => {
            const allRepos = [...mockTables.default, ...mockTables.ai];

            const result = sortRepositoriesByPercent(allRepos);
            expect(result[0].data.percent).toBeGreaterThan(result[1].data.percent);
            expect(result[0].data.percent).toBeGreaterThan(result[2].data.percent);
            expect(result[1].data.percent).toBeGreaterThan(result[2].data.percent);
        });

        test('sorts repositories by percent in ascending order', () => {
            const allRepos = [...mockTables.default, ...mockTables.ai];

            const result = sortRepositoriesByPercent(allRepos, 'ascending');

            expect(result[0].data.percent).toBeLessThan(result[1].data.percent);
            expect(result[0].data.percent).toBeLessThan(result[2].data.percent);
            expect(result[1].data.percent).toBeLessThan(result[2].data.percent);
        });

        test('handles empty array', () => {
            const result = sortRepositoriesByPercent([]);
            expect(result).toEqual([]);
        });

        test('handles null or undefined input', () => {
            expect(sortRepositoriesByPercent(null)).toEqual([]);
            expect(sortRepositoriesByPercent(undefined)).toEqual([]);
        });
    });

    describe('sortRepositoriesByDate', () => {
        test('sorts repositories by created date in descending order (default)', () => {
            const result = sortRepositoriesByDate(mockTables.default, 'created');

            const firstDate = new Date(result[0].created);
            const secondDate = new Date(result[1].created);
            expect(firstDate.getTime()).toBeGreaterThan(secondDate.getTime());
        });

        test('sorts repositories by updated date in ascending order', () => {
            const result = sortRepositoriesByDate(mockTables.default, 'updated', 'ascending');

            const firstDate = new Date(result[0].updated);
            const secondDate = new Date(result[1].updated);
            expect(firstDate.getTime()).toBeLessThan(secondDate.getTime());
        });

        test('handles invalid date field gracefully', () => {
            const input = [...mockTables.default];
            const result = sortRepositoriesByDate(input, 'nonexistentField');

            expect(result).toEqual(input);
        });
    });
});