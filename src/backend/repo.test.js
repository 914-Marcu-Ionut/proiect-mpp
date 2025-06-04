const utils = require('./utils');
const Validator = require('./validator');
const { Repo } = require('./repo');

jest.mock('./utils');
jest.mock('./validator');

describe('Repo class (realistic entity structure)', () => {
  let repo;
  const mockValidator = { validate: jest.fn() };

  const entity = {
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
    found: '2023-04-15T11:45:00',
  };

  const newEntity = {
    ...entity,
    data: { ...entity.data, percent: 95.2 }
  };

  beforeEach(() => {
    utils.hash_json.mockImplementation(obj => JSON.stringify(obj));
    utils.build_status_obj.mockImplementation((status, data = null) => ({ status, data }));
    utils.deepCopy.mockImplementation(obj => JSON.parse(JSON.stringify(obj)));

    mockValidator.validate.mockReset().mockReturnValue(utils.build_status_obj(1));

    repo = new Repo(mockValidator);
  });

  test('insert valid entity', () => {
    const result = repo.insert(entity);
    expect(mockValidator.validate).toHaveBeenCalledWith(entity);
    expect(result.status).toBe(1);
    const data = repo.getData();
    expect(data.status).toBe(1);
    expect(data.data).toContain(entity);
  });

  test('insert invalid entity', () => {
    mockValidator.validate.mockReturnValue(utils.build_status_obj(-1, "Invalid entity"));
    const result = repo.insert(entity);
    expect(result.status).toBe(-1);
    const data = repo.getData();
    expect(data.status).toBe(1);
    expect(data.data).toHaveLength(0);
  });

  test('replace existing entity', () => {
    repo.insert(entity);
    const result = repo.replace(entity, newEntity);
    expect(result.status).toBe(1);
    const data = repo.getData();
    expect(data.status).toBe(1);
    expect(data.data[0].data.percent).toBe(95.2);
  });

  test('replace non-existent entity', () => {
    const result = repo.replace(entity, newEntity);
    expect(result.status).toBe(-1);
    expect(result.data).toBe('entity not found');
  });

  test('delete existing entity', () => {
    repo.insert(entity);
    const result = repo.delete(entity);
    expect(result.status).toBe(1);
    const data = repo.getData();
    expect(data.status).toBe(1);
    expect(data.data).toHaveLength(0);
  });

  test('delete non-existent entity', () => {
    const result = repo.delete(entity);
    expect(result.status).toBe(-1);
    expect(result.data).toBe('entity not found');
  });

  test('sort descending by default', () => {
    const e1 = { ...entity, data: { ...entity.data, percent: 70 } };
    const e2 = { ...entity, data: { ...entity.data, percent: 90 } };

    repo.insert(e1);
    repo.insert(e2);

    const result = repo.sort('desc');
    expect(result.status).toBe(1);
    expect(result.data[0].data.percent).toBe(90);
    expect(result.data[1].data.percent).toBe(70);
  });

  test('sort ascending', () => {
    const e1 = { ...entity, data: { ...entity.data, percent: 20 } };
    const e2 = { ...entity, data: { ...entity.data, percent: 80 } };

    repo.insert(e1);
    repo.insert(e2);

    const result = repo.sort('asc');
    expect(result.status).toBe(1);
    expect(result.data[0].data.percent).toBe(20);
    expect(result.data[1].data.percent).toBe(80);
  });

  test('sort with invalid order returns error', () => {
    const result = repo.sort('invalid');
    expect(result.status).toBe(-1);
    expect(result.data).toBe('unknown sort method');
  });

  test('filter returns only matching entities', () => {
    const e1 = { ...entity, data: { ...entity.data, percent: 40 } };
    const e2 = { ...entity, data: { ...entity.data, percent: 85 } };

    repo.insert(e1);
    repo.insert(e2);

    const result = repo.filter(50);
    expect(result.status).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].data.percent).toBe(85);
  });

  test('filter with invalid percent returns error', () => {
    const result = repo.filter('abc');
    expect(result.status).toBe(-1);
    expect(result.data).toBe('invalid percent');
  });
});
