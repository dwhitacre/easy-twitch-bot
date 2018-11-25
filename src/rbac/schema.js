const Joi = require('joi');

const roleName = Joi.string().alphanum().max(500);
const userName = Joi.string().max(500);

const enabled = Joi.boolean().default(true);
const defaultRole = Joi.string().alphanum().max(500).default('default');
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

roleName.required();

const user = Joi.object().keys({
  name: userName,
  role: roleName
});

module.exports = { rbac, role, user, userName, roleName };