var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const _1 = require("../");
var SCOPES;
(function (SCOPES) {
    SCOPES["REQUEST"] = "request";
    SCOPES["RESPONSE"] = "response";
})(SCOPES = exports.SCOPES || (exports.SCOPES = {}));
var TYPES;
(function (TYPES) {
    TYPES["STRING"] = "String";
    TYPES["NUMBER"] = "Number";
    TYPES["BOOLEAN"] = "Boolean";
    TYPES["OBJECT"] = "Object";
    TYPES["ARRAY"] = "Array";
    TYPES["FUNCTION"] = "Function";
    TYPES["REGEXP"] = "RegExp";
})(TYPES = exports.TYPES || (exports.TYPES = {}));
let Property = class Property extends sequelize_typescript_1.Model {
};
Property.TYPES = TYPES;
Property.SCOPES = SCOPES;
__decorate([
    sequelize_typescript_1.AutoIncrement,
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Property.prototype, "id", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(SCOPES.RESPONSE),
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.ENUM(SCOPES.REQUEST, SCOPES.RESPONSE),
        comment: 'property owner',
    }),
    __metadata("design:type", String)
], Property.prototype, "scope", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column({
        type: sequelize_typescript_1.DataType.ENUM(TYPES.STRING, TYPES.NUMBER, TYPES.BOOLEAN, TYPES.OBJECT, TYPES.ARRAY, TYPES.FUNCTION, TYPES.REGEXP),
        comment: 'property type',
    }),
    __metadata("design:type", String)
], Property.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.STRING(256)),
    __metadata("design:type", String)
], Property.prototype, "name", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.STRING(128), comment: 'property generation rules' }),
    __metadata("design:type", String)
], Property.prototype, "rule", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.TEXT, comment: 'value of this property' }),
    __metadata("design:type", String)
], Property.prototype, "value", void 0);
__decorate([
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Property.prototype, "description", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(-1),
    sequelize_typescript_1.Column({ comment: 'parent property ID' }),
    __metadata("design:type", Number)
], Property.prototype, "parentId", void 0);
__decorate([
    sequelize_typescript_1.AllowNull(false),
    sequelize_typescript_1.Default(1),
    sequelize_typescript_1.Column(sequelize_typescript_1.DataType.BIGINT(11)),
    __metadata("design:type", Number)
], Property.prototype, "priority", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => _1.Interface),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Property.prototype, "interfaceId", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => _1.User),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Property.prototype, "creatorId", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => _1.Module),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Property.prototype, "moduleId", void 0);
__decorate([
    sequelize_typescript_1.ForeignKey(() => _1.Repository),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Property.prototype, "repositoryId", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => _1.User, 'creatorId'),
    __metadata("design:type", _1.User)
], Property.prototype, "creator", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => _1.Interface, 'interfaceId'),
    __metadata("design:type", _1.Interface)
], Property.prototype, "interface", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => _1.Module, 'moduleId'),
    __metadata("design:type", _1.Module)
], Property.prototype, "module", void 0);
__decorate([
    sequelize_typescript_1.BelongsTo(() => _1.Repository, 'repositoryId'),
    __metadata("design:type", _1.Repository)
], Property.prototype, "repository", void 0);
Property = __decorate([
    sequelize_typescript_1.Table({ paranoid: true, freezeTableName: false, timestamps: true })
], Property);
exports.default = Property;
//# sourceMappingURL=property.js.map