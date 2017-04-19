const definitions = require("./built-in-definitions");

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

module.exports = function({ types: t }) {
  function record(path, builtIn, builtIns) {
    if (builtIn && !builtIns.has(builtIn)) {
      builtIns.add(builtIn);
    }
  }

  function recordEsRuntimeFeature(path, builtIn, builtIns) {
    if (Array.isArray(builtIn)) {
      for (const i of builtIn) {
        record(path, i, builtIns);
      }
    } else {
      record(path, builtIn, builtIns);
    }
  }

  const recordEsRuntimeFeatures = {
    // Symbol()
    // new Promise
    ReferencedIdentifier(path) {
      const { node, parent, scope } = path;

      if (t.isMemberExpression(parent)) return;
      if (!has(definitions.globals, node.name)) return;
      if (scope.getBindingIdentifier(node.name)) return;

      const builtIn = definitions.globals[node.name];
      recordEsRuntimeFeature(path, builtIn, this.builtIns);
    },

    // arr[Symbol.iterator]()
    CallExpression(path) {
      // we can't compile this
      if (path.node.arguments.length) return;

      const callee = path.node.callee;
      if (!t.isMemberExpression(callee)) return;
      if (!callee.computed) return;
      if (!path.get("callee.property").matchesPattern("Symbol.iterator")) {
        return;
      }

      record(path, "web.dom.iterable", this.builtIns);
    },

    // Symbol.iterator in arr
    BinaryExpression(path) {
      if (path.node.operator !== "in") return;
      if (!path.get("left").matchesPattern("Symbol.iterator")) return;

      record(path, "web.dom.iterable", this.builtIns);
    },

    // yield*
    YieldExpression(path) {
      if (!path.node.delegate) return;

      record(path, "web.dom.iterable", this.builtIns);
    },

    // Array.from
    MemberExpression: {
      enter(path) {
        if (!path.isReferenced()) return;

        const { node } = path;
        const obj = node.object;
        const prop = node.property;

        if (!t.isReferenced(obj, node)) return;

        // doesn't reference the global
        if (path.scope.getBindingIdentifier(obj.name)) return;

        if (has(definitions.staticMethods, obj.name)) {
          const staticMethods = definitions.staticMethods[obj.name];
          if (has(staticMethods, prop.name)) {
            const builtIn = staticMethods[prop.name];
            recordEsRuntimeFeature(path, builtIn, this.builtIns);
          }
        }

        if (
          !node.computed &&
          t.isIdentifier(prop) &&
          has(definitions.instanceMethods, prop.name)
        ) {
          const builtIn = definitions.instanceMethods[prop.name];
          recordEsRuntimeFeature(path, builtIn, this.builtIns);
        } else if (node.computed) {
          if (
            t.isStringLiteral(prop) &&
            has(definitions.instanceMethods, prop.value)
          ) {
            const builtIn = definitions.instanceMethods[prop.value];
            recordEsRuntimeFeature(path, builtIn, this.builtIns);
          } else {
            const res = path.get("property").evaluate();
            if (res.confident) {
              const builtIn = definitions.instanceMethods[res.value];
              recordEsRuntimeFeature(
                path.get("property"),
                builtIn,
                this.builtIns
              );
            }
          }
        }
      },

      // Symbol.match
      exit(path) {
        if (!path.isReferenced()) return;

        const { node } = path;
        const obj = node.object;

        if (!has(definitions.globals, obj.name)) return;
        if (path.scope.getBindingIdentifier(obj.name)) return;

        const builtIn = definitions.globals[obj.name];
        recordEsRuntimeFeature(path, builtIn, this.builtIns);
      },
    },

    // var { repeat, startsWith } = String
    VariableDeclarator(path) {
      if (!path.isReferenced()) return;

      const { node } = path;
      const obj = node.init;

      if (!t.isObjectPattern(node.id)) return;
      const props = node.id.properties;

      if (!t.isReferenced(obj, node)) return;

      // doesn't reference the global
      if (path.scope.getBindingIdentifier(obj.name)) return;

      for (let prop of props) {
        prop = prop.key;
        if (
          !node.computed &&
          t.isIdentifier(prop) &&
          has(definitions.instanceMethods, prop.name)
        ) {
          const builtIn = definitions.instanceMethods[prop.name];
          recordEsRuntimeFeature(path, builtIn, this.builtIns);
        }
      }
    },
  };

  return {
    name: "babel-foo",
    pre() {
      this.builtIns = new Set();
    },
    visitor: recordEsRuntimeFeatures,
  };
};
