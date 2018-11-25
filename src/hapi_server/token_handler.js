const Boom = require('boom');
const Joi = require('joi');
const uuid = require('uuid');

const from = 'hapi_token_handler';
const target = 'rest';

const tokenHandler = async (request, h, self) => {
  if (!request.query) return Boom.badRequest('request must have query params');
  const query = request.query;

  const id = uuid.v1();

  const username = query.user;

  self._log({
    id,
    from,
    target,
    type: 'received',
    message: `request for token received for ${username}`,
    username
  });

  const user = self._parent.rbac.getUser(username);

  if (!user) {
    self._log({
      id,
      from,
      type: 'internal',
      message: `Unknown user: ${username}`,
      username
    });
    return Boom.notFound(`User token not found for ${username}`);
  }

  const token = user.token;

  const sentToken = await self._parent.twitchClient.whisper(user.name, `token: ${token}`);

  if (sentToken) {
    self._log({
      id,
      from,
      target,
      type: 'sent',
      message: `sent token to user ${user.name} in twitch whisper`,
      username: user.name
    });
    return { message: `sent token to user ${user.name}` };
  }

  self._log({
    id,
    from,
    target,
    type: 'internal',
    message: `failed to send token to user ${user.name} in twitch whisper, twitchClient isnt running`,
    username: user.name
  });
  return Boom.notImplemented(`failed to send token to user ${user.name}`);
};

module.exports = tokenHandler;