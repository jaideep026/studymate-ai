function matches(doc, query) {
  return Object.keys(query).every((key) => {
    const qVal = query[key];
    const dVal = doc[key];
    if (qVal && typeof qVal === "object" && qVal.toString && dVal && dVal.toString) {
      return dVal.toString() === qVal.toString();
    }
    return dVal === qVal;
  });
}

class QueryResult {
  constructor(results) {
    this.results = results;
  }
  select() {
    return this;
  }
  sort(sortSpec) {
    if (sortSpec) {
      const [field, dir] = Object.entries(sortSpec)[0];
      this.results = [...this.results].sort((a, b) => {
        const av = a[field];
        const bv = b[field];
        if (av < bv) return dir === 1 ? -1 : 1;
        if (av > bv) return dir === 1 ? 1 : -1;
        return 0;
      });
    }
    return this;
  }
  then(resolve, reject) {
    return Promise.resolve(this.results).then(resolve, reject);
  }
}

function createCollection() {
  let store = [];
  let counter = 1;

  function nextId() {
    return `id_${counter++}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function attachSave(doc) {
    if (typeof doc.save === 'function') return doc;
    Object.defineProperty(doc, 'save', {
      value: async function save() {
        this.updatedAt = new Date();
        const idx = store.findIndex((d) => d._id === this._id);
        if (idx !== -1) store[idx] = this;
        return this;
      },
      enumerable: false,
      configurable: true,
    });
    return doc;
  }

  return {
    async create(data) {
      const now = new Date();
      const doc = attachSave({ _id: nextId(), createdAt: now, updatedAt: now, ...data });
      store.push(doc);
      return doc;
    },
    async findOne(query) {
      const found = store.find((d) => matches(d, query));
      return found ? attachSave(found) : null;
    },
    find(query = {}) {
      return new QueryResult(store.filter((d) => matches(d, query)));
    },
    __reset() {
      store = [];
      counter = 1;
    },
  };
}

module.exports = { createCollection };
