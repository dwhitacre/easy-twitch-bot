const Joi = require('joi');

const username = Joi.string().required();
const token = Joi.string().required();
const channels = Joi.array().items(Joi.string()).single().default([]);
const commandPrefix = Joi.string().max(1).default('!');
const channelPrefix = Joi.string().max(1).default('#');
const logEnabled = Joi.boolean().default(true);

const client = Joi.object().keys({
  username,
  token,
  channels,
  commandPrefix,
  channelPrefix,
  logEnabled
}).default();

const name = Joi.string().alphanum().max(500).required();
const enabled = Joi.boolean().default(true);
const args = Joi.array().items(Joi.string().alphanum().max(50)).max(50).single().default([]);
const flags = Joi.array().items(Joi.string().alphanum().max(50)).max(50).single().default([]);
const handler = Joi.func().required();

const command = Joi.object().keys({
  name,
  enabled,
  args,
  flags,
  handler
}).default();

module.exports = { client, command };