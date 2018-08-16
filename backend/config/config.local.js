Object.defineProperty(exports, "__esModule", { value: true });
let config = {
    version: '2.3',
    serve: {
        port: 8080,
    },
    keys: ['some secret hurr'],
    session: {
        key: 'rap2:sess',
    },
    db: {
        dialect: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: '',
        database: 'RAP2_DELOS_APP_LOCAL',
        pool: {
            max: 5,
            min: 0,
            idle: 10000,
        },
        logging: false
    },
    redis: {}
};
exports.default = config;
//# sourceMappingURL=config.local.js.map