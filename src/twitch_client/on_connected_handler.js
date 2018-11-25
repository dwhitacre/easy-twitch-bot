function onConnectedHandler(address, port) {
  this._log({
    message: `Connected to ${address}:${port}`
  });
}

module.exports = onConnectedHandler;