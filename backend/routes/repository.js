var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = require("./router");
const _ = require('underscore');
const pagination_1 = require("./utils/pagination");
const models_1 = require("../models");
const sequelize_typescript_1 = require("sequelize-typescript");
const tree_1 = require("./utils/tree");
const access_1 = require("./utils/access");
const Consts = require("./utils/const");
const redis_1 = require("../service/redis");
const migrate_1 = require("../service/migrate");
const { initRepository, initModule } = require('./utils/helper');
const Op = sequelize_typescript_1.Sequelize.Op;
router_1.default.get('/app/get', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    let data = {};
    let query = ctx.query;
    let hooks = {
        repository: models_1.Repository,
        module: models_1.Module,
        interface: models_1.Interface,
        property: models_1.Property,
    };
    for (let name in hooks) {
        if (!query[name])
            continue;
        data[name] = yield hooks[name].findById(query[name]);
    }
    ctx.body = {
        data: Object.assign({}, ctx.body && ctx.body.data, data),
    };
    return next();
}));
router_1.default.get('/repository/count', (ctx) => __awaiter(this, void 0, void 0, function* () {
    ctx.body = {
        data: yield models_1.Repository.count(),
    };
}));
router_1.default.get('/repository/list', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let where = {};
    let { name, user, organization } = ctx.query;
    if (+organization > 0) {
        const access = yield access_1.AccessUtils.canUserAccess(access_1.ACCESS_TYPE.ORGANIZATION, ctx.session.id, organization);
        if (access === false) {
            ctx.body = {
                isOk: false,
                errMsg: Consts.COMMON_MSGS.ACCESS_DENY
            };
            return;
        }
    }
    if (user)
        Object.assign(where, { ownerId: user, organizationId: null });
    if (organization)
        Object.assign(where, { organizationId: organization });
    if (name) {
        Object.assign(where, {
            [Op.or]: [
                { name: { [Op.like]: `%${name}%` } },
                { id: name }
            ]
        });
    }
    let total = yield models_1.Repository.count({
        where,
        include: [
            models_1.QueryInclude.Creator,
            models_1.QueryInclude.Owner,
            models_1.QueryInclude.Locker,
        ],
    });
    let pagination = new pagination_1.default(total, ctx.query.cursor || 1, ctx.query.limit || 100);
    let repositories = yield models_1.Repository.findAll({
        where,
        attributes: { exclude: [] },
        include: [
            models_1.QueryInclude.Creator,
            models_1.QueryInclude.Owner,
            models_1.QueryInclude.Locker,
            models_1.QueryInclude.Members,
            models_1.QueryInclude.Organization,
            models_1.QueryInclude.Collaborators,
        ],
        offset: pagination.start,
        limit: pagination.limit,
        order: [['updatedAt', 'DESC']],
    });
    ctx.body = {
        isOk: true,
        data: repositories,
        pagination: pagination,
    };
}));
router_1.default.get('/repository/owned', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let where = {};
    let { name } = ctx.query;
    if (name) {
        Object.assign(where, {
            [Op.or]: [
                { name: { [Op.like]: `%${name}%` } },
                { id: name }
            ]
        });
    }
    let auth = yield models_1.User.findById(ctx.query.user || ctx.session.id);
    let repositories = yield auth.$get('ownedRepositories', {
        where,
        include: [
            models_1.QueryInclude.Creator,
            models_1.QueryInclude.Owner,
            models_1.QueryInclude.Locker,
            models_1.QueryInclude.Members,
            models_1.QueryInclude.Organization,
            models_1.QueryInclude.Collaborators,
        ],
        order: [['updatedAt', 'DESC']],
    });
    ctx.body = {
        data: repositories,
        pagination: undefined,
    };
}));
router_1.default.get('/repository/joined', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let where = {};
    let { name } = ctx.query;
    if (name) {
        Object.assign(where, {
            [Op.or]: [
                { name: { [Op.like]: `%${name}%` } },
                { id: name }
            ]
        });
    }
    let auth = yield models_1.User.findById(ctx.query.user || ctx.session.id);
    let repositories = yield auth.$get('joinedRepositories', {
        where,
        attributes: { exclude: [] },
        include: [
            models_1.QueryInclude.Creator,
            models_1.QueryInclude.Owner,
            models_1.QueryInclude.Locker,
            models_1.QueryInclude.Members,
            models_1.QueryInclude.Organization,
            models_1.QueryInclude.Collaborators,
        ],
        order: [['updatedAt', 'DESC']],
    });
    ctx.body = {
        data: repositories,
        pagination: undefined,
    };
}));
router_1.default.get('/repository/get', (ctx) => __awaiter(this, void 0, void 0, function* () {
    const access = yield access_1.AccessUtils.canUserAccess(access_1.ACCESS_TYPE.REPOSITORY, ctx.session.id, ctx.query.id);
    if (access === false) {
        ctx.body = {
            isOk: false,
            errMsg: Consts.COMMON_MSGS.ACCESS_DENY
        };
        return;
    }
    const tryCache = yield redis_1.default.getCache(redis_1.CACHE_KEY.REPOSITORY_GET, ctx.query.id);
    let repository;
    if (tryCache) {
        repository = JSON.parse(tryCache);
    }
    else {
        repository = yield models_1.Repository.findById(ctx.query.id, {
            attributes: { exclude: [] },
            include: [
                models_1.QueryInclude.Creator,
                models_1.QueryInclude.Owner,
                models_1.QueryInclude.Locker,
                models_1.QueryInclude.Members,
                models_1.QueryInclude.Organization,
                models_1.QueryInclude.RepositoryHierarchy,
                models_1.QueryInclude.Collaborators
            ]
        });
        yield redis_1.default.setCache(redis_1.CACHE_KEY.REPOSITORY_GET, JSON.stringify(repository), ctx.query.id);
    }
    ctx.body = {
        data: repository,
    };
}));
router_1.default.post('/repository/create', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    let creatorId = ctx.session.id;
    let body = Object.assign({}, ctx.request.body, { creatorId, ownerId: creatorId });
    let created = yield models_1.Repository.create(body);
    if (body.memberIds) {
        let members = yield models_1.User.findAll({ where: { id: body.memberIds } });
        yield created.$set('members', members);
    }
    if (body.collaboratorIds) {
        let collaborators = yield models_1.Repository.findAll({ where: { id: body.collaboratorIds } });
        yield created.$set('collaborators', collaborators);
    }
    yield initRepository(created);
    ctx.body = {
        data: yield models_1.Repository.findById(created.id, {
            attributes: { exclude: [] },
            include: [
                models_1.QueryInclude.Creator,
                models_1.QueryInclude.Owner,
                models_1.QueryInclude.Locker,
                models_1.QueryInclude.Members,
                models_1.QueryInclude.Organization,
                models_1.QueryInclude.RepositoryHierarchy,
                models_1.QueryInclude.Collaborators,
            ],
        }),
    };
    return next();
}), (ctx) => __awaiter(this, void 0, void 0, function* () {
    yield models_1.Logger.create({
        userId: ctx.session.id,
        type: 'create',
        repositoryId: ctx.body.data.id,
    });
}));
router_1.default.post('/repository/update', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    let body = Object.assign({}, ctx.request.body);
    delete body.creatorId;
    delete body.organizationId;
    let result = yield models_1.Repository.update(body, { where: { id: body.id } });
    if (body.memberIds) {
        let reloaded = yield models_1.Repository.findById(body.id, {
            include: [{
                    model: models_1.User,
                    as: 'members',
                }],
        });
        let members = yield models_1.User.findAll({
            where: {
                id: {
                    [Op.in]: body.memberIds,
                },
            },
        });
        ctx.prevAssociations = reloaded.members;
        reloaded.$set('members', members);
        yield reloaded.save();
        ctx.nextAssociations = reloaded.members;
    }
    if (body.collaboratorIds) {
        let reloaded = yield models_1.Repository.findById(body.id);
        let collaborators = yield models_1.Repository.findAll({
            where: {
                id: {
                    [Op.in]: body.collaboratorIds,
                },
            },
        });
        reloaded.$set('collaborators', collaborators);
        yield reloaded.save();
    }
    ctx.body = {
        data: result[0],
    };
    return next();
}), (ctx) => __awaiter(this, void 0, void 0, function* () {
    let { id } = ctx.request.body;
    yield models_1.Logger.create({
        userId: ctx.session.id,
        type: 'update',
        repositoryId: id,
    });
    if (!ctx.prevAssociations || !ctx.nextAssociations)
        return;
    let prevIds = ctx.prevAssociations.map((item) => item.id);
    let nextIds = ctx.nextAssociations.map((item) => item.id);
    let joined = _.difference(nextIds, prevIds);
    let exited = _.difference(prevIds, nextIds);
    let creatorId = ctx.session.id;
    for (let userId of joined) {
        yield models_1.Logger.create({ creatorId, userId, type: 'join', repositoryId: id });
    }
    for (let userId of exited) {
        yield models_1.Logger.create({ creatorId, userId, type: 'exit', repositoryId: id });
    }
}));
router_1.default.post('/repository/transfer', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let { id, ownerId, organizationId } = ctx.request.body;
    let body = {};
    if (ownerId)
        body.ownerId = ownerId;
    if (organizationId) {
        body.organizationId = organizationId;
        body.ownerId = (yield models_1.Organization.findById(organizationId)).ownerId;
    }
    let result = yield models_1.Repository.update(body, { where: { id } });
    ctx.body = {
        data: result[0],
    };
}));
router_1.default.get('/repository/remove', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    let { id } = ctx.query;
    let result = yield models_1.Repository.destroy({ where: { id } });
    yield models_1.Module.destroy({ where: { repositoryId: id } });
    yield models_1.Interface.destroy({ where: { repositoryId: id } });
    yield models_1.Property.destroy({ where: { repositoryId: id } });
    ctx.body = {
        data: result,
    };
    return next();
}), (ctx) => __awaiter(this, void 0, void 0, function* () {
    if (ctx.body.data === 0)
        return;
    let { id } = ctx.query;
    yield models_1.Logger.create({
        userId: ctx.session.id,
        type: 'delete',
        repositoryId: id,
    });
}));
router_1.default.post('/repository/lock', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let user = ctx.session.id;
    if (!user) {
        ctx.body = { data: 0 };
        return;
    }
    let { id } = ctx.request.body;
    let result = yield models_1.Repository.update({ lockerId: user }, {
        where: { id },
    });
    ctx.body = { data: result[0] };
}));
router_1.default.post('/repository/unlock', (ctx) => __awaiter(this, void 0, void 0, function* () {
    if (!ctx.session.id) {
        ctx.body = { data: 0 };
        return;
    }
    let { id } = ctx.request.body;
    let result = yield models_1.Repository.update({ lockerId: null }, {
        where: { id },
    });
    ctx.body = { data: result[0] };
}));
router_1.default.get('/module/count', (ctx) => __awaiter(this, void 0, void 0, function* () {
    ctx.body = {
        data: yield models_1.Module.count(),
    };
}));
router_1.default.get('/module/list', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let where = {};
    let { repositoryId, name } = ctx.query;
    if (repositoryId)
        where.repositoryId = repositoryId;
    if (name)
        where.name = { [Op.like]: `%${name}%` };
    ctx.body = {
        data: yield models_1.Module.findAll({
            attributes: { exclude: [] },
            where,
        }),
    };
}));
router_1.default.get('/module/get', (ctx) => __awaiter(this, void 0, void 0, function* () {
    ctx.body = {
        data: yield models_1.Module.findById(ctx.query.id, {
            attributes: { exclude: [] },
        }),
    };
}));
router_1.default.post('/module/create', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    let creatorId = ctx.session.id;
    let body = Object.assign(ctx.request.body, { creatorId });
    body.priority = Date.now();
    let created = yield models_1.Module.create(body);
    yield initModule(created);
    ctx.body = {
        data: yield models_1.Module.findById(created.id),
    };
    return next();
}), (ctx) => __awaiter(this, void 0, void 0, function* () {
    let mod = ctx.body.data;
    yield models_1.Logger.create({
        userId: ctx.session.id,
        type: 'create',
        repositoryId: mod.repositoryId,
        moduleId: mod.id,
    });
}));
router_1.default.post('/module/update', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    let body = ctx.request.body;
    let result = yield models_1.Module.update(body, {
        where: { id: body.id },
    });
    ctx.body = {
        data: result[0],
    };
    return next();
}), (ctx) => __awaiter(this, void 0, void 0, function* () {
    if (ctx.body.data === 0)
        return;
    let mod = ctx.request.body;
    yield models_1.Logger.create({
        userId: ctx.session.id,
        type: 'update',
        repositoryId: mod.repositoryId,
        moduleId: mod.id,
    });
}));
router_1.default.get('/module/remove', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    let { id } = ctx.query;
    let result = yield models_1.Module.destroy({ where: { id } });
    yield models_1.Interface.destroy({ where: { moduleId: id } });
    yield models_1.Property.destroy({ where: { moduleId: id } });
    ctx.body = {
        data: result,
    };
    return next();
}), (ctx) => __awaiter(this, void 0, void 0, function* () {
    if (ctx.body.data === 0)
        return;
    let { id } = ctx.query;
    let mod = yield models_1.Module.findById(id, { paranoid: false });
    yield models_1.Logger.create({
        userId: ctx.session.id,
        type: 'delete',
        repositoryId: mod.repositoryId,
        moduleId: mod.id,
    });
}));
router_1.default.post('/module/sort', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let { ids } = ctx.request.body;
    let counter = 1;
    for (let index = 0; index < ids.length; index++) {
        yield models_1.Module.update({ priority: counter++ }, {
            where: { id: ids[index] }
        });
    }
    ctx.body = {
        data: ids.length,
    };
}));
router_1.default.get('/interface/count', (ctx) => __awaiter(this, void 0, void 0, function* () {
    ctx.body = {
        data: yield models_1.Interface.count(),
    };
}));
router_1.default.get('/interface/list', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let where = {};
    let { repositoryId, moduleId, name } = ctx.query;
    if (repositoryId)
        where.repositoryId = repositoryId;
    if (moduleId)
        where.moduleId = moduleId;
    if (name)
        where.name = { [Op.like]: `%${name}%` };
    ctx.body = {
        data: yield models_1.Interface.findAll({
            attributes: { exclude: [] },
            where,
        }),
    };
}));
router_1.default.get('/interface/get', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let { id, repositoryId, method, url } = ctx.query;
    let itf;
    if (id) {
        itf = yield models_1.Interface.findById(id, {
            attributes: { exclude: [] },
        });
    }
    else if (repositoryId && method && url) {
        let urlWithoutPrefixSlash = /(\/)?(.*)/.exec(url)[2];
        let repository = yield models_1.Repository.findById(repositoryId);
        let collaborators = yield repository.$get('collaborators');
        itf = yield models_1.Interface.findOne({
            attributes: { exclude: [] },
            where: {
                repositoryId: [repositoryId, ...collaborators.map(item => item.id)],
                method,
                url: [urlWithoutPrefixSlash, '/' + urlWithoutPrefixSlash],
            },
        });
    }
    itf = itf.toJSON();
    let scopes = ['request', 'response'];
    for (let i = 0; i < scopes.length; i++) {
        let properties = yield models_1.Property.findAll({
            attributes: { exclude: [] },
            where: { interfaceId: itf.id, scope: scopes[i] },
        });
        properties = properties.map(item => item.toJSON());
        itf[scopes[i] + 'Properties'] = tree_1.default.ArrayToTree(properties).children;
    }
    ctx.type = 'json';
    ctx.body = tree_1.default.stringifyWithFunctonAndRegExp({ data: itf });
}));
router_1.default.post('/interface/create', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    let creatorId = ctx.session.id;
    let body = Object.assign(ctx.request.body, { creatorId });
    body.priority = Date.now();
    let created = yield models_1.Interface.create(body);
    ctx.body = {
        data: yield models_1.Interface.findById(created.id),
    };
    return next();
}), (ctx) => __awaiter(this, void 0, void 0, function* () {
    let itf = ctx.body.data;
    yield models_1.Logger.create({
        userId: ctx.session.id,
        type: 'create',
        repositoryId: itf.repositoryId,
        moduleId: itf.moduleId,
        interfaceId: itf.id,
    });
}));
router_1.default.post('/interface/update', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    let body = ctx.request.body;
    let result = yield models_1.Interface.update(body, {
        where: { id: body.id },
    });
    ctx.body = {
        data: result[0],
    };
    return next();
}), (ctx) => __awaiter(this, void 0, void 0, function* () {
    if (ctx.body.data === 0)
        return;
    let itf = ctx.request.body;
    yield models_1.Logger.create({
        userId: ctx.session.id,
        type: 'update',
        repositoryId: itf.repositoryId,
        moduleId: itf.moduleId,
        interfaceId: itf.id,
    });
}));
router_1.default.get('/interface/remove', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    let { id } = ctx.query;
    let result = yield models_1.Interface.destroy({ where: { id } });
    yield models_1.Property.destroy({ where: { interfaceId: id } });
    ctx.body = {
        data: result,
    };
    return next();
}), (ctx) => __awaiter(this, void 0, void 0, function* () {
    if (ctx.body.data === 0)
        return;
    let { id } = ctx.query;
    let itf = yield models_1.Interface.findById(id, { paranoid: false });
    yield models_1.Logger.create({
        userId: ctx.session.id,
        type: 'delete',
        repositoryId: itf.repositoryId,
        moduleId: itf.moduleId,
        interfaceId: itf.id,
    });
}));
router_1.default.get('/__test__', (ctx) => __awaiter(this, void 0, void 0, function* () {
    const itf = yield models_1.Interface.findById(5331);
    itf.name = itf.name + '+';
    yield itf.save();
    ctx.body = {
        data: itf.name
    };
}));
router_1.default.post('/interface/lock', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    if (!ctx.session.id) {
        ctx.body = { data: 0 };
        return;
    }
    let { id } = ctx.request.body;
    let itf = yield models_1.Interface.findById(id);
    if (itf.lockerId) {
        ctx.body = {
            data: 0,
        };
        return;
    }
    const itf2 = yield models_1.Interface.findById(id);
    itf2.lockerId = ctx.session.id;
    yield itf2.save();
    ctx.body = {
        data: itf2
    };
    return next();
}));
router_1.default.post('/interface/unlock', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    if (!ctx.session.id) {
        ctx.body = { data: 0 };
        return;
    }
    let { id } = ctx.request.body;
    let itf = yield models_1.Interface.findById(id);
    if (itf.lockerId !== ctx.session.id) {
        ctx.body = { data: 0 };
        return;
    }
    const itf2 = yield models_1.Interface.findById(id);
    itf2.lockerId = null;
    yield itf2.save();
    ctx.body = {
        data: itf2
    };
    return next();
}));
router_1.default.post('/interface/sort', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let { ids } = ctx.request.body;
    let counter = 1;
    for (let index = 0; index < ids.length; index++) {
        yield models_1.Interface.update({ priority: counter++ }, {
            where: { id: ids[index] }
        });
    }
    ctx.body = {
        data: ids.length,
    };
}));
router_1.default.get('/property/count', (ctx) => __awaiter(this, void 0, void 0, function* () {
    ctx.body = {
        data: 0
    };
}));
router_1.default.get('/property/list', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let where = {};
    let { repositoryId, moduleId, interfaceId, name } = ctx.query;
    if (repositoryId)
        where.repositoryId = repositoryId;
    if (moduleId)
        where.moduleId = moduleId;
    if (interfaceId)
        where.interfaceId = interfaceId;
    if (name)
        where.name = { [Op.like]: `%${name}%` };
    ctx.body = {
        data: yield models_1.Property.findAll({ where }),
    };
}));
router_1.default.get('/property/get', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let { id } = ctx.query;
    ctx.body = {
        data: yield models_1.Property.findById(id, {
            attributes: { exclude: [] },
        }),
    };
}));
router_1.default.post('/property/create', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let creatorId = ctx.session.id;
    let body = Object.assign(ctx.request.body, { creatorId });
    let created = yield models_1.Property.create(body);
    ctx.body = {
        data: yield models_1.Property.findById(created.id, {
            attributes: { exclude: [] },
        }),
    };
}));
router_1.default.post('/property/update', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let properties = ctx.request.body;
    properties = Array.isArray(properties) ? properties : [properties];
    let result = 0;
    for (let item of properties) {
        let property = _.pick(item, Object.keys(models_1.Property.attributes));
        let affected = yield models_1.Property.update(property, {
            where: { id: property.id },
        });
        result += affected[0];
    }
    ctx.body = {
        data: result,
    };
}));
router_1.default.post('/properties/update', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    let { itf } = ctx.query;
    let properties = ctx.request.body;
    properties = Array.isArray(properties) ? properties : [properties];
    let existingProperties = properties.filter((item) => !item.memory);
    let result = yield models_1.Property.destroy({
        where: {
            id: { [Op.notIn]: existingProperties.map((item) => item.id) },
            interfaceId: itf
        }
    });
    for (let item of existingProperties) {
        let affected = yield models_1.Property.update(item, {
            where: { id: item.id },
        });
        result += affected[0];
    }
    let newProperties = properties.filter((item) => item.memory);
    let memoryIdsMap = {};
    for (let item of newProperties) {
        let created = yield models_1.Property.create(Object.assign({}, item, {
            id: undefined,
            parentId: -1,
            priority: item.priority || Date.now()
        }));
        memoryIdsMap[item.id] = created.id;
        item.id = created.id;
        result += 1;
    }
    for (let item of newProperties) {
        let parentId = memoryIdsMap[item.parentId] || item.parentId;
        yield models_1.Property.update({ parentId }, {
            where: { id: item.id },
        });
    }
    ctx.body = {
        data: result,
    };
    return next();
}), (ctx) => __awaiter(this, void 0, void 0, function* () {
    if (ctx.body.data === 0)
        return;
    let itf = yield models_1.Interface.findById(ctx.query.itf, {
        attributes: { exclude: [] },
    });
    yield models_1.Logger.create({
        userId: ctx.session.id,
        type: 'update',
        repositoryId: itf.repositoryId,
        moduleId: itf.moduleId,
        interfaceId: itf.id,
    });
}));
router_1.default.get('/property/remove', (ctx) => __awaiter(this, void 0, void 0, function* () {
    let { id } = ctx.query;
    ctx.body = {
        data: yield models_1.Property.destroy({
            where: { id },
        }),
    };
}));
router_1.default.post('/repository/import', (ctx) => __awaiter(this, void 0, void 0, function* () {
    if (!ctx.session || !ctx.session.id) {
        ctx.body = {
            isOk: false,
            message: 'NOT LOGIN'
        };
        return;
    }
    const { docUrl, orgId } = ctx.request.body;
    const result = yield migrate_1.default.importRepoFromRAP1DocUrl(orgId, ctx.session.id, docUrl);
    ctx.body = {
        isOk: result,
        message: result ? '导入成功' : '导入失败',
        repository: {
            id: 1,
        }
    };
}));
//# sourceMappingURL=repository.js.map