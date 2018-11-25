const Joi = require('joi');

const host = Joi.string().default('localhost');
const port = Joi.number().min(1).max(65536).default(3000);
const path = Joi.string().alphanum().max(50).default('/rules');
const tokenPath = Joi.string().alphanum().max(50).default('/token');
const logEnabled = Joi.boolean().default(true);

const server = Joi.object().keys({
  host,
  port,
  path,
  tokenPath,
  logEnabled
}).default();

const name = Joi.string().alphanum().max(500).required();
const enabled = Joi.boolean().default(true);
const args = Joi.array().items(Joi.string().alphanum().max(50)).max(50).single().default([]);
const flags = Joi.array().items(Joi.string().alphanum().max(50)).max(50).single().default([]);
const handler = Joi.func().required();

const route = Joi.object().keys({
  name,
  enabled,
  args,
  flags,
  handler
}).default();

module.exports = { server, route };