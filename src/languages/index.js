const CppAdapter = require('./cpp');
const PythonAdapter = require('./python');
const JavaAdapter = require('./java');

class LanguageRegistry {
    constructor() {
        this.adapters = new Map();
        this._registerDefaultAdapters();
    }

    _registerDefaultAdapters() {
        const cppAdapter = new CppAdapter();
        this.register(cppAdapter);
        const pythonAdapter = new PythonAdapter();
        this.register(pythonAdapter);
        const javaAdapter = new JavaAdapter();
        this.register(javaAdapter);
    }

    register(adapter) {
        if (!adapter || !adapter.name) {
            throw new Error('Invalid adapter: must have a name property');
        }
        this.adapters.set(adapter.name, adapter);
    }

    getByName(name) {
        return this.adapters.get(name) || null;
    }

    getByExtension(ext) {
        const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
        for (const adapter of this.adapters.values()) {
            if (adapter.extensions && adapter.extensions.includes(normalizedExt)) {
                return adapter;
            }
        }
        return null;
    }

    listAll() {
        return Array.from(this.adapters.values());
    }
}

const registry = new LanguageRegistry();

module.exports = {
    LanguageRegistry,
    registry,
    register: registry.register.bind(registry),
    getByName: registry.getByName.bind(registry),
    getByExtension: registry.getByExtension.bind(registry),
    listAll: registry.listAll.bind(registry)
};
