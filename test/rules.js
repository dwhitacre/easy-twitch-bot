const { expect } = require('chai');
const sinon = require('sinon');

const Rule = require('../src/rules/rule');
const Rules = require('../src/rules/rules');

describe('rules', () => {
  describe('.constructor', () => {
    it('should create the rules', () => {
      const rules = new Rules();
      expect(rules).to.exist;
      expect(rules._rules).to.exist;
    });
  });
  describe('.add', () => {
    let rules;
    beforeEach(() => {
      rules = new Rules();
    });
    it('should throw an err if the ruleDef doesnt match schema', () => {
      expect(() => rules.add({})).to.throw();
    });
    it('should throw an err if the rule already exists', () => {
      rules._rules.push(new Rule({
        name: 'test',
        handler: async () => {}
      }));
      expect(() => rules.add({
        name: 'test',
        handler: async () => {}
      })).to.throw();
    });
    it('should add the rule if it has no aliases', () => {
      rules.add({
        name: 'test',
        handler: async () => {}
      });
      const rule = rules._rules.pop();
      expect(rule.name).to.equal('test');
      expect(rule.isAlias).to.be.false;
    });
    it('should add the rule and alias rules if it has aliases', () => {
      rules.add({
        name: 'test',
        aliases: ['t', 'e'],
        handler: async () => {}
      });
      expect(rules._rules).to.have.length(3);
      let foundRule = false;
      let foundTAlias = false;
      let foundEAlias = false;
      rules._rules.forEach(rule => {
        if (rule.name === 'test') {
          foundRule = true;
          expect(rule.isAlias).to.be.false;
        } else if (rule.name === 't') {
          foundTAlias = true;
          expect(rule.isAlias).to.be.true;
          expect(rule.aliasTo).to.equal('test');
        } else if (rule.name === 'e') {
          foundEAlias = true;
          expect(rule.isAlias).to.be.true;
          expect(rule.aliasTo).to.equal('test');
        }
      });
      expect(foundRule).to.be.true;
      expect(foundTAlias).to.be.true;
      expect(foundEAlias).to.be.true;
    });
  });
  describe('.get', () => {
    let rules;
    beforeEach(() => {
      rules = new Rules();
    });
    it('should return undefined if not rule is found', () => {
      rules._rules.push(new Rule({
        name: 'findme',
        handler: async () => {}
      }));
      expect(rules.get('test')).to.be.undefined;
    });
    it('should return the rule if the rule is found', () => {
      rules._rules.push(new Rule({
        name: 'findme',
        handler: async () => {}
      }));
      const rule = rules.get('findme');
      expect(rule).to.exist;
      expect(rule.name).to.equal('findme');
      expect(rule.isAlias).to.be.false;
    });
    it('should return the alias if the alias is found', () => {
      rules._rules.push(new Rule({
        name: 'findme',
        aliases: ['f'],
        handler: async () => {}
      }));
      rules._rules.push(new Rule({
        name: 'f',
        isAlias: true,
        aliasTo: 'findme',
        handler: async () => {}
      }));
      const rule = rules.get('f');
      expect(rule).to.exist;
      expect(rule.name).to.equal('f');
      expect(rule.isAlias).to.be.true;
    });
  });
  describe('.rm', () => {
    let rules;
    beforeEach(() => {
      rules = new Rules();
    });
    it('should do nothing if the rule doesnt exist', () => {
      rules._rules.push(new Rule({
        name: 'findme',
        handler: async () => {}
      }));
      rules.rm('test');
      expect(rules._rules).to.have.length(1);
    });
    it('should remove the rule if it has no aliases', () => {
      rules._rules.push(new Rule({
        name: 'findme',
        handler: async () => {}
      }));
      rules.rm('findme');
      expect(rules._rules).to.have.length(0);
    });
    it('should remove the rule and its aliases if it has some', () => {
      rules._rules.push(new Rule({
        name: 'findme',
        aliases: ['f', 'i'],
        handler: async () => {}
      }));
      rules._rules.push(new Rule({
        name: 'f',
        isAlias: true,
        aliasTo: 'findme',
        handler: async () => {}
      }));
      rules._rules.push(new Rule({
        name: 'i',
        isAlias: true,
        aliasTo: 'findme',
        handler: async () => {}
      }));
      rules.rm('findme');
      expect(rules._rules).to.have.length(0);
    });
    it('should remove the alias and its pointer in its parent rule', () => {
      rules._rules.push(new Rule({
        name: 'findme',
        aliases: ['f'],
        handler: async () => {}
      }));
      rules._rules.push(new Rule({
        name: 'f',
        isAlias: true,
        aliasTo: 'findme',
        handler: async () => {}
      }));
      rules.rm('f');
      expect(rules._rules).to.have.length(1);
      const rule = rules._rules.pop();
      expect(rule.aliases).to.have.length(0);
    });
  });
  describe('.edit', () => {
    let rules;
    beforeEach(() => {
      rules = new Rules();
    });
    it('should throw err if the rule doesnt exist', () => {
      rules._rules.push(new Rule({
        name: 'findme',
        handler: async () => {}
      }));
      expect(() => rules.edit({ name: 'test' })).to.throw();
    });
    it('should throw err if the rule is an alias', () => {
      rules._rules.push(new Rule({
        name: 'findme',
        aliases: ['f'],
        handler: async () => {}
      }));
      rules._rules.push(new Rule({
        name: 'f',
        isAlias: true,
        aliasTo: 'findme',
        handler: async () => {}
      }));
      expect(() => rules.edit({ name: 'f' })).to.throw();
    });
    it('should merge the new def with the existing def and create a new rule', () => {
      rules._rules.push(new Rule({
        name: 'findme',
        handler: async () => {}
      }));
      rules.edit({
        name: 'findme',
        flags: [ 'newflag' ]
      });
      const rule = rules._rules.pop();
      expect(rule.flags).to.have.length(1);
      expect(rule.flags[0]).to.equal('newflag');
    });
    it('should throw err if the new def merged with existing def doesnt match schema', () => {
      rules._rules.push(new Rule({
        name: 'findme',
        handler: async () => {}
      }));
      expect(() => rules.edit({ name: 'findme', enabled: 'wow' })).to.throw();
    });
  });
  describe('.clear', () => {
    it('should remove all the rules', () => {
      const rules = new Rules();
      rules._rules.push(new Rule({
        name: 'findme',
        handler: async () => {}
      }));
      rules.clear();
      expect(rules._rules).to.have.length(0);
    });
  });
});