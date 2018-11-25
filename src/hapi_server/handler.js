const Boom = require('boom');
const uuid = require('uuid');

const from = 'hapi_handler';
const target = 'rest';

const handler = async (request, h, self) => {
  if (!request.payload) return Boom.badRequest('request must have a payload');
  const payload = request.payload;

  const id = uuid.v1();

  const user = self._parent.rbac.getUser(request.query.token);
  const username = user ? user.name : undefined;

  self._log({
    id,
    from,
    target,
    type: 'received',
    message: `${JSON.stringify({ payload, params: request.query })}`,
    username
  });

  const route = self.getRoute(payload.name);
  if (!route) {
    self._log({
      id,
      from,
      type: 'internal',
      message: `Unknown route: ${payload.name}`,
      username
    });
    return Boom.notFound(`request name '${payload.name}' does not exist`);
  }
  if (!route.enabled) {
    self._log({
      id,
      from,
      type: 'internal',
      message: `Route currently disabled: ${route.name}`,
      username
    });
    return Boom.notImplemented(`request name '${route.name}' not currently enabled`);
  }
  if (!self._parent.rbac.check(username, route.name)) {
    self._log({
      id,
      from,
      type: 'internal',
      message: `User, ${username}, does not have access to route: ${payload.name}`,
      username
    });
    return Boom.forbidden(`request name '${route.name}' not permitted for user`);
  }

  const args = {};
  route.args.forEach(arg => {
    args[arg] = payload[arg];
  });

  const flags = {};
  route.flags.forEach(flag => {
    flags[flag] = request.query[flag];
  });

  const response = await route.handler({
    route,
    name: payload.name,
    target,
    messageType: 'route',
    messageRaw: '',
    args,
    flags,
    bot: self._parent,
    username
  });

  const fullResponse = {
    message: response,
    name: payload.name
  };

  self._log({
    id,
    from,
    target,
    type: 'sent',
    message: `${JSON.stringify(fullResponse)}`,
    username
  });

  return fullResponse;
};

module.exports = handler;