const { expect } = require('chai');
const sinon = require('sinon');

const Client = require('../src/twitch_client/twitch_client');
const Command = require('../src/twitch_client/command');

describe('twitch_client', () => {
  describe('.constructor', () => {
    it('should throw an error if the settings dont match the schema', () => {
      expect(() => new Client()).to.throw();
    });
    it('should create a twitch client object', () => {
      const client = new Client({
        username: 'username',
        token: 'oauth:token',
        channels: ['channel'],
        commandPrefix: '#',
        channelPrefix: '~'
      });
      expect(client._username).to.equal('username');
      expect(client._token).to.equal('oauth:token');
      expect(client._channels).to.deep.equal(['channel']);
      expect(client._commandPrefix).to.equal('#');
      expect(client._channelPrefix).to.equal('~');
      expect(client._logEnabled).to.be.true;
      expect(client._commands).to.exist;
    });
  });
  describe('.getSettings', () => {
    it('should return the client settings', () => {
      const settings = new Client({
        username: 'username',
        token: 'token'
      }).getSettings();
      expect(settings.username).to.equal('username');
      expect(settings.token).to.equal('token');
      expect(settings.channels).to.deep.equal([]);
      expect(settings.commandPrefix).to.equal('!');
      expect(settings.channelPrefix).to.equal('#');
      expect(settings.logEnabled).to.be.true;
    });
  });
  describe('.setSettings', () => {
    it('should throw an error when the client is running', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client._running = true;
      expect(() => client.setSettings({ channels: ['channel'] })).to.throw();
    });
    it('should throw an error if the settings dont match the schema', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      expect(() => client.setSettings({ channels: 123 })).to.throw();
    });
    it('should set the settings', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client.setSettings({
        username: 'username',
        token: 'oauth:token',
        channels: ['channel'],
        commandPrefix: '#',
        channelPrefix: '~'
      });
      expect(client._username).to.equal('username');
      expect(client._token).to.equal('oauth:token');
      expect(client._channels).to.deep.equal(['channel']);
      expect(client._commandPrefix).to.equal('#');
      expect(client._channelPrefix).to.equal('~');
    });
    it('should mark the client as dirty', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client._dirty = false;
      client.setSettings({
        username: 'username',
        token: 'oauth:token',
        channels: ['channel'],
        commandPrefix: '#',
        channelPrefix: '~'
      });
      expect(client._dirty).to.be.true;
    });
  });
  describe('.getState', () => {
    it('should return the current state', () => {
      const state = new Client({
        username: 'username',
        token: 'token'
      }).getState();
      expect(state.running).to.be.false;
      expect(state.dirty).to.be.true;
    });
  });
  describe('.init', () => {
    it('should do nothing if the client is not dirty', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client._dirty = false;
      client.init();
      expect(client._client).to.be.undefined;
    });
    it('should throw an error if the client is running', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client._running = true;
      expect(() => client.init()).to.throw();
    });
    it('should create the twitch client', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client.init();
      expect(client._client).to.be.an.instanceof(Object);
    });
    it('should mark the client as not dirty', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client.init();
      expect(client._dirty).to.be.false;
    });
  });
  describe('.start', () => {
    let twitchClientStub, client;
    beforeEach(() => {
      twitchClientStub = {
        connect: sinon.spy(),
        info: {
          uri: 'localhost'
        }
      };
      client = new Client({
        username: 'username',
        token: 'token'
      });
      client._client = twitchClientStub;
      client._dirty = false;
      client._logEnabled = false;
    });
    it('should do nothing if the client is already running', async () => {
      client._running = true;
      await client.start();
      expect(twitchClientStub.connect.notCalled).to.be.true;
    });
    it('should throw an error if the client is dirty', async () => {
      client._dirty = true;
      let caughtErr = false;
      try {
        await client.start();
      } catch (err) {
        caughtErr = true;
      }
      expect(caughtErr).to.be.true;
      expect(twitchClientStub.connect.notCalled).to.be.true;
    });
    it('should mark the client as running', async () => {
      await client.start();
      expect(client._running).to.be.true;
    });
    it('should start the twitch client', async () => {
      await client.start();
      expect(twitchClientStub.connect.calledOnce).to.be.true;
    });
  });
  describe('.stop', () => {
    let twitchClientStub, client;
    beforeEach(() => {
      twitchClientStub = {
        disconnect: sinon.spy(),
        info: {
          uri: 'localhost'
        }
      };
      client = new Client({
        username: 'username',
        token: 'token'
      });
      client._client = twitchClientStub;
      client._logEnabled = false;
      client._running = true;
    });
    it('should do nothing if the client is not running', async () => {
      client._running = false;
      await client.stop();
      expect(twitchClientStub.disconnect.notCalled).to.be.true;
    });
    it('should mark the client as not running', async () => {
      await client.stop();
      expect(client._running).to.be.false;
    });
    it('should stop the twitch client', async () => {
      await client.stop();
      expect(twitchClientStub.disconnect.calledOnce).to.be.true;
    });
  });
  describe('.addCommand', () => {
    it('should throw err if commandDef doesnt match schema', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      expect(() => client.addCommand({})).to.throw();
    });
    it('should throw err if command already exists', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client._commands.push(new Command({
        name: 'test',
        handler: async () => {}
      }));
      expect(() => client.addCommand({
        name: 'test',
        handler: async () => {}
      })).to.throw();
    });
    it('should add command', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client.addCommand({
        name: 'test',
        handler: async () => {}
      });
      const command = client._commands.pop();
      expect(command.name).to.equal('test');
    });
  });
  describe('.getCommand', () => {
    it('should return command if it exists', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client._commands.push(new Command({
        name: 'test',
        handler: async () => {}
      }));
      const command = client.getCommand('test');
      expect(command.name).to.equal('test');
    });
    it('should return undefined if it doesnt exist', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client._commands.push(new Command({
        name: 'test',
        handler: async () => {}
      }));
      const command = client.getCommand('nope');
      expect(command).to.be.undefined;
    });
  });
  describe('rmCommand', () => {
    it('should do nothing if command does not exist', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client._commands.push(new Command({
        name: 'test',
        handler: async () => {}
      }));
      client.rmCommand('nope');
      expect(client._commands).to.have.length(1);
    });
    it('should remove command if it exists', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client._commands.push(new Command({
        name: 'test',
        handler: async () => {}
      }));
      client.rmCommand('test');
      expect(client._commands).to.have.length(0);
    });
  });
  describe('editCommand', () => {
    it('should throw err if the command does not exist', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client._commands.push(new Command({
        name: 'test',
        handler: async () => {}
      }));
      expect(() => client.editCommand({
        name: 'nope',
        handler: async () => {}
      })).to.throw();
    });
    it('should throw err if the new commandDef does not match the schema', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client._commands.push(new Command({
        name: 'test',
        handler: async () => {}
      }));
      expect(() => client.editCommand({
        name: 'test',
        args: 234,
        handler: async () => {}
      })).to.throw();
    });
    it('should edit the command', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client._commands.push(new Command({
        name: 'test',
        handler: async () => {}
      }));
      client.editCommand({
        name: 'test',
        args: ['args'],
        handler: async () => {}
      });
      const command = client._commands.pop();
      expect(command.args).to.deep.equal(['args']);
    });
  });
  describe('clearCommand', () => {
    it('should remove all the commands', () => {
      const client = new Client({
        username: 'username',
        token: 'token'
      });
      client._commands.push(new Command({
        name: 'test',
        handler: async () => {}
      }));
      client.clearCommand();
      expect(client._commands).to.have.length(0);
    });
  });
});