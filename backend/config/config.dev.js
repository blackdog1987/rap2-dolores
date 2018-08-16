Object.defineProperty(exports, "__esModule", { value: true });
let config = {
    version: '2.3',
    serve: {
        port: 38080,
    },
    keys: ['some secret hurr'],
    session: {
        key: 'rap2:sess',
    },
    db: {
        dialect: 'mysql',
        host: 'localhost',
        port: 33306,
        username: 'root',
        password: '',
        database: 'rap2',
        pool: {
            max: 5,
            min: 0,
            idle: 10000,
        },
        logging: false,
    },
    redis: {}
};
exports.default = config;
//# sourceMappingURL=config.dev.js.map