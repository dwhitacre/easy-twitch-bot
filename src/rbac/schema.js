const Joi = require('joi');

const roleName = Joi.string().alphanum().max(500);
const roleNames = Joi.array().unique().items(roleName).single().min(1).max(500).required();
const userName = Joi.string().min(1).max(500).required();

const enabled = Joi.boolean().default(true);
const defaultRole = Joi.array().unique().items(roleName).single().max(500).default(['default']);
const logEnabled = Joi.boolean().default(true);

const rbac = Joi.object().keys({
  enabled,
  defaultRole,
  logEnabled
}).default();

const can = Joi.array().items(roleName).single().max(500).default([]);
const inherits = Joi.array().items(roleName).single().max(500).default([]);

const role = Joi.object().keys({
  can,
  inherits
}).default();

const user = Joi.object().keys({
  name: userName,
  roles: roleNames
});

module.exports = { rbac, role, user, userName, roleName, roleNames };