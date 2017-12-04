// @flow

// TODO(sven): define types values and name
// Globaly??
type ModuleExportInstance = {
  name: string;
  value: any;
};

type ModuleInstance = {
  types: any;
  funcaddrs: any;
  tableaddrs: any;
  memaddrs: any;
  globaladdrs: any;

  // TODO(sven): exports should have multiple exports,
  // not according to https://webassembly.github.io/spec/exec/runtime.html#module-instances?
  exports: Array<ModuleExportInstance>;
}

function createInstance(n: Module): ModuleInstance {
  const exports = [];

  if (n.fields) {

    n.fields.forEach((field) => {

      /**
       * Find and instantiate exports
       */
      if (field.type === 'ModuleExport') {
        exports.push(
          createModuleExportIntance(field.name, field.descr.id)
        );
      }

    });
  }

  return {
    exports,
  };
}

function createModuleExportIntance(name: string, value: any): ModuleExportInstance {
  return {name, value};
}

module.exports = {
  createInstance,
};
