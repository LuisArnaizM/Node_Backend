// Mock de Sequelize
const mockSequelize = {
  define: jest.fn(),
  authenticate: jest.fn(),
  sync: jest.fn(),
  close: jest.fn(),
  transaction: jest.fn(),
  Op: {
    or: Symbol('or'),
    and: Symbol('and'),
    eq: Symbol('eq'),
    ne: Symbol('ne'),
    gt: Symbol('gt'),
    gte: Symbol('gte'),
    lt: Symbol('lt'),
    lte: Symbol('lte'),
    like: Symbol('like'),
    iLike: Symbol('iLike'),
    in: Symbol('in'),
    notIn: Symbol('notIn')
  }
};

// Mock de DataTypes
const mockDataTypes = {
  UUID: 'UUID',
  UUIDV4: 'UUIDV4',
  STRING: 'STRING',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  DATE: 'DATE',
  TEXT: 'TEXT',
  ENUM: 'ENUM'
};

module.exports = {
  sequelize: mockSequelize,
  Sequelize: mockSequelize,
  DataTypes: mockDataTypes
};
