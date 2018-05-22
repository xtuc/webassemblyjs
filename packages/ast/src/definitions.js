const definitions = {};

function defineType(typeName, metadata) {
  definitions[typeName] = metadata;
}

defineType("Module", {
  spec: {
    wasm:
      "https://webassembly.github.io/spec/core/binary/modules.html#binary-module",
    wat: "https://webassembly.github.io/spec/core/text/modules.html#text-module"
  },
  doc:
    "A module consists of a sequence of sections (termed fields in the text format).",
  fields: {
    id: {
      maybe: true,
      type: "string"
    },
    fields: {
      array: true,
      type: "Node"
    },
    metadata: {
      optional: true,
      type: "ModuleMetadata"
    }
  }
});

defineType("ModuleMetadata", {
  fields: {
    sections: {
      array: true,
      type: "SectionMetadata"
    },
    functionNames: {
      optional: true,
      array: true,
      type: "FunctionNameMetadata"
    },
    localNames: {
      optional: true,
      array: true,
      type: "ModuleMetadata"
    }
  }
});

defineType("ModuleNameMetadata", {
  fields: {
    value: {
      type: "string"
    }
  }
});

defineType("FunctionNameMetadata", {
  fields: {
    value: {
      type: "string"
    },
    index: {
      type: "number"
    }
  }
});

defineType("LocalNameMetadata", {
  fields: {
    value: {
      type: "string"
    },
    localIndex: {
      type: "number"
    },
    functionIndex: {
      type: "number"
    }
  }
});

defineType("BinaryModule", {
  fields: {
    id: {
      maybe: true,
      type: "string"
    },
    blob: {
      array: true,
      type: "string"
    }
  }
});

defineType("QuoteModule", {
  fields: {
    id: {
      maybe: true,
      type: "string"
    },
    string: {
      array: true,
      type: "string"
    }
  }
});

defineType("SectionMetadata", {
  fields: {
    section: {
      type: "SectionName"
    },
    startOffset: {
      type: "number"
    },
    size: {
      type: "NumberLiteral"
    },
    vectorOfSize: {
      comment: "Size of the vector in the section (if any)",
      type: "NumberLiteral"
    }
  }
});

/*
Instructions
*/

defineType("LoopInstruction", {
  unionType: ["Block", "Instruction"],
  fields: {
    id: {
      constant: true,
      type: "string",
      value: "loop"
    },
    label: {
      maybe: true,
      type: "Identifier"
    },
    resulttype: {
      maybe: true,
      type: "Valtype"
    },
    instr: {
      array: true,
      type: "Instruction"
    }
  }
});

defineType("Instr", {
  unionType: ["Expression", "Instruction"],
  fields: {
    id: {
      type: "string"
    },
    object: {
      optional: true,
      type: "Valtype"
    },
    args: {
      array: true,
      type: "Expression"
    },
    namedArgs: {
      optional: true,
      type: "Object"
    }
  }
});

defineType("IfInstruction", {
  unionType: ["Instruction"],
  fields: {
    id: {
      constant: true,
      type: "string",
      value: "if"
    },
    testLabel: {
      comment: "only for WAST",
      type: "Identifier"
    },
    test: {
      array: true,
      type: "Instruction"
    },
    result: {
      maybe: true,
      type: "Valtype"
    },
    consequent: {
      array: true,
      type: "Instruction"
    },
    alternate: {
      array: true,
      type: "Instruction"
    }
  }
});

/* 
Concrete value types
*/

defineType("StringLiteral", {
  unionType: ["Expression"],
  fields: {
    value: {
      type: "string"
    }
  }
});

defineType("NumberLiteral", {
  unionType: ["NumericLiteral", "Expression"],
  fields: {
    value: {
      type: "number"
    },
    raw: {
      type: "string"
    }
  }
});

defineType("LongNumberLiteral", {
  unionType: ["NumericLiteral", "Expression"],
  fields: {
    value: {
      type: "LongNumber"
    },
    raw: {
      type: "string"
    }
  }
});

defineType("FloatLiteral", {
  unionType: ["NumericLiteral", "Expression"],
  fields: {
    value: {
      type: "number"
    },
    nan: {
      optional: true,
      type: "boolean"
    },
    inf: {
      optional: true,
      type: "boolean"
    },
    raw: {
      type: "string"
    }
  }
});

defineType("Elem", {
  fields: {
    table: {
      type: "Index"
    },
    offset: {
      array: true,
      type: "Instruction"
    },
    funcs: {
      array: true,
      type: "Index"
    }
  }
});

defineType("IndexInFuncSection", {
  fields: {
    index: {
      type: "Index"
    }
  }
});

defineType("ValtypeLiteral", {
  unionType: ["Expression"],
  fields: {
    name: {
      type: "Valtype"
    }
  }
});

defineType("TypeInstruction", {
  unionType: ["Instruction"],
  fields: {
    id: {
      maybe: true,
      type: "Index"
    },
    functype: {
      type: "Signature"
    }
  }
});

defineType("Start", {
  fields: {
    index: {
      type: "Index"
    }
  }
});

defineType("GlobalType", {
  unionType: ["ImportDescr"],
  fields: {
    valtype: {
      type: "Valtype"
    },
    mutability: {
      type: "Mutability"
    }
  }
});

defineType("LeadingComment", {
  fields: {
    value: {
      type: "string"
    }
  }
});

defineType("BlockComment", {
  fields: {
    value: {
      type: "string"
    }
  }
});

defineType("Data", {
  fields: {
    memoryIndex: {
      type: "Memidx"
    },
    offset: {
      type: "Instruction"
    },
    init: {
      type: "ByteArray"
    }
  }
});

defineType("Global", {
  fields: {
    globalType: {
      type: "GlobalType"
    },
    init: {
      array: true,
      type: "Instruction"
    },
    name: {
      maybe: true,
      type: "Identifier"
    }
  }
});

defineType("Table", {
  unionType: ["ImportDescr"],
  fields: {
    elementType: {
      type: "TableElementType"
    },
    limits: {
      type: "Limit"
    },
    name: {
      maybe: true,
      type: "Identifier"
    },
    elements: {
      array: true,
      optional: true,
      type: "Index"
    }
  }
});

defineType("Memory", {
  unionType: ["ImportDescr"],
  fields: {
    limits: {
      type: "Limit"
    },
    id: {
      maybe: true,
      type: "Index"
    }
  }
});

defineType("FuncImportDescr", {
  unionType: ["ImportDescr"],
  fields: {
    id: {
      type: "Identifier"
    },
    signature: {
      type: "Signature"
    }
  }
});

defineType("ModuleImport", {
  fields: {
    module: {
      type: "string"
    },
    name: {
      type: "string"
    },
    descr: {
      type: "ImportDescr"
    }
  }
});

defineType("ModuleExportDescr", {
  fields: {
    exportType: {
      type: "ExportDescrType"
    },
    id: {
      type: "Index"
    }
  }
});

defineType("ModuleExport", {
  fields: {
    name: {
      type: "string"
    },
    descr: {
      type: "ModuleExportDescr"
    }
  }
});

defineType("Limit", {
  fields: {
    min: {
      type: "number"
    },
    max: {
      optional: true,
      type: "number"
    }
  }
});

defineType("Signature", {
  fields: {
    params: {
      array: true,
      type: "FuncParam"
    },
    results: {
      array: true,
      type: "Valtype"
    }
  }
});

defineType("Program", {
  fields: {
    body: {
      array: true,
      type: "Node"
    }
  }
});

defineType("Identifier", {
  unionType: ["Expression"],
  fields: {
    value: {
      type: "string"
    },
    raw: {
      optional: true,
      type: "string"
    }
  }
});

defineType("BlockInstruction", {
  unionType: ["Block", "Instruction"],
  fields: {
    id: {
      constant: true,
      type: "string",
      value: "block"
    },
    label: {
      maybe: true,
      type: "Identifier"
    },
    instr: {
      array: true,
      type: "Instruction"
    },
    result: {
      maybe: true,
      type: "Valtype"
    }
  }
});

defineType("CallInstruction", {
  unionType: ["Instruction"],
  fields: {
    id: {
      constant: true,
      type: "string",
      value: "call"
    },
    index: {
      type: "Index"
    },
    instrArgs: {
      array: true,
      optional: true,
      type: "Expression"
    }
  }
});

defineType("CallIndirectInstruction", {
  unionType: ["Instruction"],
  fields: {
    id: {
      constant: true,
      type: "string",
      value: "call_indirect"
    },
    signature: {
      type: "SignatureOrTypeRef"
    },
    intrs: {
      array: true,
      optional: true,
      type: "Expression"
    }
  }
});

defineType("ByteArray", {
  fields: {
    values: {
      array: true,
      type: "Byte"
    }
  }
});

defineType("Func", {
  unionType: ["Block"],
  fields: {
    name: {
      maybe: true,
      type: "Index"
    },
    signature: {
      type: "SignatureOrTypeRef"
    },
    body: {
      array: true,
      type: "Instruction"
    },
    isExternal: {
      comment: "means that it has been imported from the outside js",
      optional: true,
      type: "boolean"
    },
    metadata: {
      optional: true,
      type: "FuncMetadata"
    }
  }
});

module.exports = definitions;
