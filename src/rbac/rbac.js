const Joi = require('joi');
const uuid = require('uuid');

const { rbac: schema, userName: userNameSchema, roleName: roleNameSchema } = require('./schema');
const Role = require('./role');
const User = require('./user');
const log = require('../log');

const from = 'rbac';

class RBAC {
  constructor(settings) {
    const { error, value } = Joi.validate(settings, schema);
    if (error) throw error;

    // settings
    this._enabled = value.enabled;
    this._defaultRole = value.defaultRole;
    this._logEnabled = value.logEnabled;

    // state
    this._id = uuid.v1();

    // implementation
    this._roles = {};
    this._users = {};
    this._tokens = {};
  }

  getSettings() {
    return {
      enabled: this._enabled,
      defaultRole: this._defaultRole,
      logEnabled: this._logEnabled
    };
  }

  setSettings(settings) {
    const { error, value } = Joi.validate(settings, schema);
    if (error) throw error;

    this._enabled = value.enabled;
    this._defaultRole = value.defaultRole;
    this._logEnabled = value.logEnabled;
  }

  getState() {
    return {
      id: this._id
    };
  }

  addRole(roleName, roleOptions) {
    if (this.getRole(roleName)) throw new Error(`Role ${roleName} already exists`);

    const { error, value } = Joi.validate(roleName, roleNameSchema);
    if (error) throw error;

    const role = new Role(roleOptions);

    this._log({
      message: `Added role: ${value}`
    });

    this._roles[value] = role;
  }

  getRole(roleName) {
    return this._roles[roleName];
  }

  rmRole(roleName) {
    if (!this.getRole(roleName)) return;

    this._log({
      message: `Removed role: ${roleName}`
    });

    for (let u in this._users) {
      const user = this.getUser(u);
      const roles = user.roles;
      if (roles.indexOf(roleName) > -1) {
        const newRoles = roles.filter(role => role !== roleName);
        newRoles.length === 0 ? this.rmUser(user.name) : this.editUser(u, newRoles);
      }
    }

    delete this._roles[roleName];
  }

  checkRole(roleName, action) {
    if (!this._enabled) return true;

    const role = this.getRole(roleName);
    if (!role) {
      this._log({
        message: `role not found in check: ${roleName}`
      });
      return false;
    }

    if (role.can.indexOf(action) > -1) return true;

    return role.inherits.some(i => {
      const iRole = this.getRole(i);
      if (!iRole) return false;
      return this.checkRole(i, action);
    });
  }

  addUser(userName, roleNames) {
    if (this.getUser(userName)) throw new Error(`user already exists with username: ${userName}`);

    if (!(roleNames instanceof Array)) throw new Error(`roles must be an array`);

    roleNames.forEach(roleName => {
      if (!this.getRole(roleName)) throw new Error(`role doesnt exist: ${roleName}`);
    })

    const { error, value } = Joi.validate(userName, userNameSchema);
    if (error) throw error;

    const user = new User({
      name: value,
      roles: roleNames
    });

    this._tokens[user.token] = user.name;

    this._log({
      message: `Added user: ${user.name}`
    });

    this._users[user.name] = user;
  }

  getUser(userNameOrToken) {
    let user = this._users[userNameOrToken];
    if (!user) user = this._users[this._tokens[userNameOrToken]];
    return user;
  }

  rmUser(userName) {
    const user = this.getUser(userName);
    if (!user) return;

    this._log({
      message: `Removed user: ${user.name}`
    });

    delete this._tokens[user.token];
    delete this._users[user.name];
  }

  editUser(userName, roleNames) {
    this.rmUser(userName);
    this.addUser(userName, roleNames);
  }

  clear() {
    this._roles = {};
    this._users = {};
    this._tokens = {};
  }

  check(userName, action) {
    if (!this._enabled) return true;

    const user = this.getUser(userName);

    const userRoleNames = user ? user.roles : this._defaultRole;

    for (var i = 0; i < userRoleNames.length; i++) {
      var userRoleName = userRoleNames[i];
      var userRole = this.getRole(userRoleName);
      if (!userRole) return false;
      if (this.checkRole(userRoleName, action)) return true;
    }
    return false;
  }

  _log(message) {
    message = {
      id: this._id,
      from,
      type: 'internal',
      ...message
    };
    log(message, this._logEnabled);
  }
}

module.exports = RBAC;