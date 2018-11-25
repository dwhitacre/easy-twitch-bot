const { expect } = require('chai');
const sinon = require('sinon');

const Server = require('../src/hapi_server/hapi_server');
const Route = require('../src/hapi_server/route');

describe('hapi_server', () => {
  describe('.constructor', () => {
    it('should throw an error if the settings dont match the schema', () => {
      expect(() => new Server({ port: 'nope' })).to.throw();
    });
    it('should create a hapi server object', () => {
      const server = new Server({
        port: 5000,
        host: 'localhost'
      });
      expect(server._port).to.equal(5000);
      expect(server._host).to.equal('localhost');
      expect(server._path).to.equal('/rules');
      expect(server._logEnabled).to.be.true;
      expect(server._routes).to.exist;
    });
  });
  describe('.getSettings', () => {
    it('should return the server settings', () => {
      const settings = new Server().getSettings();
      expect(settings.host).to.equal('localhost');
      expect(settings.port).to.equal(3000);
      expect(settings.path).to.equal('/rules');
      expect(settings.logEnabled).to.be.true;
    });
  });
  describe('.setSettings', () => {
    it('should throw an error when the server is running', () => {
      const server = new Server();
      server._running = true;
      expect(() => server.setSettings({ port: 7000 })).to.throw();
    });
    it('should throw an error if the settings dont match the schema', () => {
      const server = new Server();
      expect(() => server.setSettings({ host: 0 })).to.throw();
    });
    it('should set the settings', () => {
      const server = new Server({ port: 10, host: 'host' });
      server.setSettings({ port: 7000, host: 'newHost' });
      expect(server._port).to.equal(7000);
      expect(server._host).to.equal('newHost');
    });
    it('should mark the server as dirty', () => {
      const server = new Server({ port: 10, host: 'host' });
      server._dirty = false;
      server.setSettings({ port: 7000, host: 'newHost' });
      expect(server._dirty).to.be.true;
    });
  });
  describe('.getState', () => {
    it('should return the current state', () => {
      const state = new Server().getState();
      expect(state.running).to.be.false;
      expect(state.dirty).to.be.true;
    });
  });
  describe('.init', () => {
    it('should do nothing if the server is not dirty', () => {
      const server = new Server();
      server._dirty = false;
      server.init();
      expect(server._server).to.be.undefined;
    });
    it('should throw an error if the server is running', () => {
      const server = new Server();
      server._running = true;
      expect(() => server.init()).to.throw();
    });
    it('should create the hapi server', () => {
      const server = new Server();
      server.init();
      expect(server._server).to.be.an.instanceof(Object);
    });
    it('should mark the server as not dirty', () => {
      const server = new Server();
      server.init();
      expect(server._dirty).to.be.false;
    });
  });
  describe('.start', () => {
    let hapiServerStub, server;
    beforeEach(() => {
      hapiServerStub = {
        start: sinon.spy(),
        info: {
          uri: 'localhost'
        }
      };
      server = new Server();
      server._server = hapiServerStub;
      server._dirty = false;
      server._logEnabled = false;
    });
    it('should do nothing if the server is already running', async () => {
      server._running = true;
      await server.start();
      expect(hapiServerStub.start.notCalled).to.be.true;
    });
    it('should throw an error if the server is dirty', async () => {
      server._dirty = true;
      let caughtErr = false;
      try {
        await server.start();
      } catch (err) {
        caughtErr = true;
      }
      expect(caughtErr).to.be.true;
      expect(hapiServerStub.start.notCalled).to.be.true;
    });
    it('should mark the server as running', async () => {
      await server.start();
      expect(server._running).to.be.true;
    });
    it('should start the hapi server', async () => {
      await server.start();
      expect(hapiServerStub.start.calledOnce).to.be.true;
    });
  });
  describe('.stop', () => {
    let hapiServerStub, server;
    beforeEach(() => {
      hapiServerStub = {
        stop: sinon.spy(),
        info: {
          uri: 'localhost'
        }
      };
      server = new Server();
      server._server = hapiServerStub;
      server._logEnabled = false;
      server._running = true;
    });
    it('should do nothing if the server is not running', async () => {
      server._running = false;
      await server.stop();
      expect(hapiServerStub.stop.notCalled).to.be.true;
    });
    it('should mark the server as not running', async () => {
      await server.stop();
      expect(server._running).to.be.false;
    });
    it('should stop the hapi server', async () => {
      await server.stop();
      expect(hapiServerStub.stop.calledOnce).to.be.true;
    });
  });
  describe('.addRoute', () => {
    it('should throw err if routeDef doesnt match schema', () => {
      const server = new Server();
      expect(() => server.addRoute({})).to.throw();
    });
    it('should throw err if route already exists', () => {
      const server = new Server();
      server._routes.push(new Route({
        name: 'test',
        handler: async () => {}
      }));
      expect(() => server.addRoute({
        name: 'test',
        handler: async () => {}
      })).to.throw();
    });
    it('should add route', () => {
      const server = new Server();
      server.addRoute({
        name: 'test',
        handler: async () => {}
      });
      const route = server._routes.pop();
      expect(route.name).to.equal('test');
    });
  });
  describe('.getRoute', () => {
    it('should return route if it exists', () => {
      const server = new Server();
      server._routes.push(new Route({
        name: 'test',
        handler: async () => {}
      }));
      const route = server.getRoute('test');
      expect(route.name).to.equal('test');
    });
    it('should return undefined if it doesnt exist', () => {
      const server = new Server();
      server._routes.push(new Route({
        name: 'test',
        handler: async () => {}
      }));
      const route = server.getRoute('nope');
      expect(route).to.be.undefined;
    });
  });
  describe('rmRoute', () => {
    it('should do nothing if route does not exist', () => {
      const server = new Server();
      server._routes.push(new Route({
        name: 'test',
        handler: async () => {}
      }));
      server.rmRoute('nope');
      expect(server._routes).to.have.length(1);
    });
    it('should remove route if it exists', () => {
      const server = new Server();
      server._routes.push(new Route({
        name: 'test',
        handler: async () => {}
      }));
      server.rmRoute('test');
      expect(server._routes).to.have.length(0);
    });
  });
  describe('editRoute', () => {
    it('should throw err if the route does not exist', () => {
      const server = new Server();
      server._routes.push(new Route({
        name: 'test',
        handler: async () => {}
      }));
      expect(() => server.editRoute({
        name: 'nope',
        handler: async () => {}
      })).to.throw();
    });
    it('should throw err if the new routeDef does not match the schema', () => {
      const server = new Server();
      server._routes.push(new Route({
        name: 'test',
        handler: async () => {}
      }));
      expect(() => server.editRoute({
        name: 'test',
        args: 234,
        handler: async () => {}
      })).to.throw();
    });
    it('should edit the route', () => {
      const server = new Server();
      server._routes.push(new Route({
        name: 'test',
        handler: async () => {}
      }));
      server.editRoute({
        name: 'test',
        args: ['args'],
        handler: async () => {}
      });
      const route = server._routes.pop();
      expect(route.args).to.deep.equal(['args']);
    });
  });
  describe('clearRoute', () => {
    it('should remove all the routes', () => {
      const server = new Server();
      server._routes.push(new Route({
        name: 'test',
        handler: async () => {}
      }));
      server.clearRoute();
      expect(server._routes).to.have.length(0);
    });
  });
});