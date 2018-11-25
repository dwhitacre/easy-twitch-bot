const Rule = require('./rule');

class Rules {
  constructor() {
    this._rules = [];
  }

  add(ruleDef) {
    const rule = new Rule(ruleDef);

    if (this.get(rule.name)) throw new Error(`Rule ${rule.name} already exists`);

    const aliasRules = [];
    rule.aliases.forEach(alias => {
      aliasRules.push(new Rule({
        name: alias,
        handler: async () => {},
        isAlias: true,
        aliasTo: rule.name
      }));
    });

    this._rules.push(rule);
    this._rules = this._rules.concat(aliasRules);

    return [ rule, ...aliasRules ];
  }

  get(ruleName) {
    return this._rules.find(rule => {
      return rule.name === ruleName;
    });
  }

  rm(ruleName) {
    const foundRule = this.get(ruleName);
    if (!foundRule) return;

    const removed = [];

    if (foundRule.isAlias) {
      const aliasTo = this.get(foundRule.aliasTo);
      aliasTo.removeAlias(foundRule.name);
    } else {
      foundRule.aliases.forEach(alias => {
        this._rules = this._rules.filter(rule => {
          if (rule.name === alias) {
            removed.push(rule);
          }
          return rule.name !== alias;
        });
      });
    }

    this._rules = this._rules.filter(rule => {
      if (rule.name === ruleName) {
        removed.push(rule);
      }
      return rule.name !== ruleName;
    });

    return removed;
  }

  edit(ruleDef) {
    const foundRule = this.get(ruleDef.name);
    if (!foundRule) throw new Error(`No rule with ${ruleDef.name} exists.`);
    if (foundRule.isAlias) throw new Error(`Cannot edit ${foundRule.name} directly as its an alias. Try editing ${foundRule.aliasTo}.`);
  
    const newDef = {
      ...foundRule.getDef(),
      ...ruleDef
    };

    const rule = new Rule(newDef);
    this.rm(rule.name);
    this.add(rule.getDef());
    return rule;
  }

  clear() {
    this._rules = [];
  }
}

module.exports = Rules;