const Joi = require('Joi');

const name = Joi.string().alphanum().max(500).required();
const aliases = Joi.array().items(Joi.string().alphanum().max(500)).max(50).single().default([]);
const enabled = Joi.boolean().default(true);
const args = Joi.array().items(Joi.string().alphanum().max(50)).max(50).single().default([]);
const flags = Joi.array().items(Joi.string().alphanum().max(50)).max(50).single().default([]);
const handler = Joi.func().required();
const isAlias = Joi.boolean().default(false);
const aliasTo = Joi.string().alphanum().max(500);

const rule = Joi.object().keys({
  name,
  aliases,
  enabled,
  args,
  flags,
  handler,
  isAlias,
  aliasTo
});

module.exports = { rule };