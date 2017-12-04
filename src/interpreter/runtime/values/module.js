// @flow

function createInstance(n: Module): ModuleInstance {
  const exports = [];
  const types = [];

  if (n.fields) {

    n.fields.forEach((field) => {

      /**
       * Find and instantiate exports
       */
      if (field.type === 'ModuleExport') {
        const addr = 0x0;

        const externalVal = {
          type: field.descr.type,
          addr
        };

        exports.push(
          createModuleExportIntance(field.name, externalVal)
        );
      }

    });
  }

  return {
    exports,
    types,
  };
}

function createModuleExportIntance(
  name: string,
  value: ExternalVal,
): ExportInstance {
  return {
    name,
    value,
  };
}

module.exports = {
  createInstance,
};
