const { expect } = require('chai');
const sinon = require('sinon');

const RBAC = require('../src/rbac/rbac');
const Role = require('../src/rbac/role');
const User = require('../src/rbac/user');

describe('rbac', () => {
  describe('.constructor', () => {
    it('should throw err if schema is invalid', () => {
      expect(() => new RBAC({
        logEnabled: 123
      })).to.throw();
    });
    it('should create the rbac', () => {
      const rbac = new RBAC();
      expect(rbac._logEnabled).to.be.true;
      expect(rbac._id).to.exist;
      expect(rbac._roles).to.be.an.instanceof(Object);
      expect(rbac._users).to.be.an.instanceof(Object);
      expect(rbac._tokens).to.be.an.instanceof(Object);
    });
  });
  describe('.getSettings', () => {
    it('should get the settings', () => {
      const rbac = new RBAC({
        logEnabled: false
      });
      const settings = rbac.getSettings();
      expect(settings.logEnabled).to.be.false;
    });
  });
  describe('.setSettings', () => {
    it('should set the settings', () => {
      const rbac = new RBAC({
        logEnabled: false
      });
      rbac.setSettings({
        logEnabled: true
      });
      expect(rbac._logEnabled).to.be.true;
    });
    it('should throw err if schema is invalid', () => {
      const rbac = new RBAC({
        logEnabled: false
      });
      expect(() => rbac.setSettings({
        logEnabled: 123
      })).to.throw();
    });
  });
  describe('.getState', () => {
    it('should get the state', () => {
      const rbac = new RBAC();
      expect(rbac.getState().id).to.exist;
    });
  });
  describe('.addRole', () => {
    let rbac;
    beforeEach(() => {
      rbac = new RBAC({
        logEnabled: false
      });
    });
    it('should throw err if the role already exists', () => {
      rbac._roles['role'] = new Role();
      expect(() => rbac.addRole('role', {}));
    });
    it('should throw err if the roleName does not match schema', () => {
      expect(() => rbac.addRole(234, {}));
    });
    it('should throw err if the roleOptions dont match schema', () => {
      expect(() => rbac.addRole('role', { can: 234 }));
    });
    it('should add the role', () => {
      rbac.addRole('role', {});
      expect(rbac._roles['role']).to.exist;
    });;
  });
  describe('.getRole', () => {
    let rbac;
    beforeEach(() => {
      rbac = new RBAC({
        logEnabled: false
      });
    });
    it('should get the role', () => {
      rbac._roles['role'] = new Role();
      expect(rbac.getRole('role')).to.exist;
    });
    it('shoud return undef when role dne', () => {
      rbac._roles['role'] = new Role();
      expect(rbac.getRole('role1')).to.be.undefined;
    });
  });
  describe('.rmRole', () => {
    let rbac;
    beforeEach(() => {
      rbac = new RBAC({
        logEnabled: false
      });
    });
    it('should do nothing if the role does not exist', () => {
      rbac._roles['role'] = new Role();
      rbac.rmRole('role1');
      expect(Object.keys(rbac._roles)).to.have.length(1);
    });
    it('should remove the users with this role', () => {
      rbac._roles['role'] = new Role();
      rbac._users['user'] = new User({
        name: 'user',
        roles: ['role']
      });
      rbac._users['nope'] = new User({
        name: 'nope',
        roles: ['nope']
      })
      rbac.rmRole('role');
      expect(Object.keys(rbac._users)).to.have.length(1);
      expect(rbac._users['user']).to.be.undefined;
      expect(rbac._users['nope'].roles).to.be.an('array');
      expect(rbac._users['nope'].roles).to.have.length(1);
      expect(rbac._users['nope'].roles[0]).to.equal('nope');
    });
    it('should remove the role', () => {
      rbac._roles['role'] = new Role();
      rbac.rmRole('role');
      expect(Object.keys(rbac._roles)).to.have.length(0);
      expect(rbac._roles['role']).to.be.undefined;
    });
  });
  describe('.checkRole', () => {
    let rbac;
    beforeEach(() => {
      rbac = new RBAC({
        logEnabled: false
      });
    });
    it('should ret false if role doesnt exist', () => {
      expect(rbac.checkRole('role', 'action')).to.be.false;
    });
    it('should ret false if the role doesnt contain the action and doesnt have inherited roles', () => {
      rbac._roles['role'] = new Role({
        can: [ 'action' ],
        inherits: []
      });
      expect(rbac.checkRole('role', 'nope')).to.be.false;
    });
    it('should ret false if the role doesnt contain the action and inherited roles dont either', () => {
      rbac._roles['role'] = new Role({
        can: [ 'action' ],
        inherits: [ 'role1' ]
      });
      rbac._roles['role1'] = new Role({
        can: [ 'action1' ]
      });
      expect(rbac.checkRole('role', 'nope')).to.be.false;
    });
    it('should ret true if the role contains the action', () => {
      rbac._roles['role'] = new Role({
        can: [ 'action' ],
        inherits: [ 'role1' ]
      });
      rbac._roles['role1'] = new Role({
        can: [ 'action1' ]
      });
      expect(rbac.checkRole('role', 'action')).to.be.true;
    });
    it('should ret true if the role doesnt contain the action, but inherited roles do', () => {
      rbac._roles['role'] = new Role({
        can: [ 'action' ],
        inherits: [ 'role1' ]
      });
      rbac._roles['role1'] = new Role({
        can: [ 'action1' ]
      });
      expect(rbac.checkRole('role', 'action1')).to.be.true;
    });
    it('should ret true if the role doesnt contain the action, but inherited of inherited roles do', () => {
      rbac._roles['role'] = new Role({
        can: [ 'action' ],
        inherits: [ 'role1' ]
      });
      rbac._roles['role1'] = new Role({
        can: [ 'action1' ],
        inherits: [ 'role2' ]
      });
      rbac._roles['role2'] = new Role({
        can: [ 'action2' ]
      });
      expect(rbac.checkRole('role', 'action2')).to.be.true;
    });
    it('should function if an inherited role does not exist', () => {
      rbac._roles['role'] = new Role({
        can: [ 'action' ],
        inherits: [ 'role2' ]
      });
      rbac._roles['role1'] = new Role({
        can: [ 'action1' ]
      });
      expect(rbac.checkRole('role', 'action1')).to.be.false;
    });
    it('should ret true if not enabled', () => {
      rbac._enabled = false;
      rbac._roles['role'] = new Role({
        can: [ 'action' ],
        inherits: []
      });
      expect(rbac.checkRole('role', 'nope')).to.be.true;
    });
  });
  describe('.addUser', () => {
    let rbac;
    beforeEach(() => {
      rbac = new RBAC({
        logEnabled: false
      });
      rbac._roles['role'] = new Role({
        can: [ 'action' ]
      });
    });
    it('should throw err if user already exists', () => {
      rbac._users['user'] = new User({
        name: 'user',
        roles: ['role']  
      });
      expect(() => rbac.addUser('user', 'role')).to.throw();
    });
    it('should throw err if the role doesnt exist', () => {
      expect(() => rbac.addUser('user', 'nope')).to.throw();
    });
    it('should throw err if the userName doesnt match schema', () => {
      expect(() => rbac.addUser(234, 'role')).to.throw();
    });
    it('should add the user', () => {
      rbac.addUser('user', ['role']);
      expect(rbac._users['user']).to.exist;
      expect(rbac._users['user'].roles).to.be.an('array');
      expect(rbac._users['user'].roles).to.have.length(1);
      expect(rbac._users['user'].roles[0]).to.equal('role');
    });
    it('should add token and user to tokens', () => {
      rbac.addUser('user', ['role']);
      const user = rbac._users['user'];
      expect(rbac._tokens[user.token]).to.not.be.undefined;
      expect(rbac._tokens[user.token]).to.equal(user.name);
    });
  });
  describe('.getUser', () => {
    let rbac;
    beforeEach(() => {
      rbac = new RBAC({
        logEnabled: false
      });
    });
    it('should get the user when given name', () => {
      rbac._users['user'] = new User({
        name: 'user',
        roles: ['role']
      });
      expect(rbac.getUser('user').name).to.equal('user');
      expect(rbac.getUser('user').roles).to.be.an('array');
      expect(rbac.getUser('user').roles).to.have.length(1);
      expect(rbac.getUser('user').roles[0]).to.equal('role');
    });
    it('should get the user when given token', () => {
      rbac._users['user'] = new User({
        name: 'user',
        roles: ['role']
      });
      const token = rbac._users['user'].token;
      rbac._tokens[token] = 'user';
      expect(rbac.getUser(token).name).to.equal('user');
      expect(rbac.getUser(token).roles).to.be.an('array');
      expect(rbac.getUser(token).roles).to.have.length(1);
      expect(rbac.getUser(token).roles[0]).to.equal('role');
    });
  });
  describe('.rmUser', () => {
    let rbac;
    beforeEach(() => {
      rbac = new RBAC({
        logEnabled: false
      });
    });
    it('should do nothing if the user does not exist', () => {
      rbac._users['user'] = new User({
        name: 'user',
        roles: ['role']
      });
      rbac.rmUser('nope');
      expect(Object.keys(rbac._users)).to.have.length(1);
    });
    it('should remove the user', () => {
      rbac._users['user'] = new User({
        name: 'user',
        roles: ['role']
      });
      rbac.rmUser('user');
      expect(Object.keys(rbac._users)).to.have.length(0);
      expect(rbac._users['user']).to.be.undefined;
    });
    it('should remove the token', () => {
      rbac._users['user'] = new User({
        name: 'user',
        roles: ['role']
      });
      const token = rbac._users['user'].token;
      rbac._tokens[token] = 'user';
      rbac.rmUser('user');
      expect(Object.keys(rbac._tokens)).to.have.length(0);
      expect(rbac._tokens[token]).to.be.undefined;
    });
  });
  describe('.editUser', () => {
    let rbac;
    beforeEach(() => {
      rbac = new RBAC({
        logEnabled: false
      });
    });
    it('should edit the users role', () => {
      rbac._users['user'] = new User({
        name: 'user',
        roles: ['role']
      });
      rbac._roles['cool'] = new Role();
      rbac.editUser('user', ['cool']);
      expect(rbac.getUser('user').roles).to.be.an('array');
      expect(rbac.getUser('user').roles).to.have.length(1);
      expect(rbac.getUser('user').roles[0]).to.equal('cool');
    });
  });
  describe('.clear', () => {
    let rbac;
    beforeEach(() => {
      rbac = new RBAC({
        logEnabled: false
      });
    });
    it('should clear both the roles and users', () => {
      rbac._users['user'] = new User({
        name: 'user',
        roles: ['role']
      });
      rbac._roles['cool'] = new Role();
      rbac.clear();
      expect(Object.keys(rbac._roles)).to.have.length(0);
      expect(Object.keys(rbac._users)).to.have.length(0);
    });
  });
  describe('.check', () => {
    let rbac;
    beforeEach(() => {
      rbac = new RBAC({
        logEnabled: false
      });
    });
    it('should ret true if the user doesnt exist and default role has the action', () => {
      rbac._roles[rbac._defaultRole] = new Role({
        can: [ 'action' ]
      });
      expect(rbac.check('user', 'action')).to.be.true;
    });
    it('should ret false if the user doesnt exist and default role does not have the action', () => {
      rbac._roles[rbac._defaultRole] = new Role({
        can: [ 'action1' ]
      });
      expect(rbac.check('user', 'action')).to.be.false;
    });
    it('should ret false if the user doesnt exist and default role doesnt exist', () => {
      expect(rbac.check('user', 'action')).to.be.false;
    });
    it('should ret false if the role does not exist for the user', () => {
      rbac._users['user'] = new User({
        name: 'user',
        roles: ['role']
      });
      expect(rbac.check('user', 'action')).to.be.false;
    });
    it('should ret false if the users role does not have the action', () => {
      rbac._users['user'] = new User({
        name: 'user',
        roles: ['role']
      });
      rbac._roles['role'] = new Role();
      expect(rbac.check('user', 'action')).to.be.false;
    });
    it('should ret true if the users role does have the action', () => {
      rbac._users['user'] = new User({
        name: 'user',
        roles: ['role']
      });
      rbac._roles['role'] = new Role({
        can: [ 'action' ]
      });
      expect(rbac.check('user', 'action')).to.be.true;
    });
    it('should ret true if its not enabled', () => {
      rbac._enabled = false;
      rbac._users['user'] = new User({
        name: 'user',
        roles: ['role']
      });
      expect(rbac.check('user', 'action')).to.be.true;
    });
  });
});