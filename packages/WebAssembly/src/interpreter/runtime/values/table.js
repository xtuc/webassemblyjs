// @flow

const DEFAULT_MAX_TABLE_ENTRY = 2 ** 23;

export class Table {
  _element: string;
  _initial: number;
  _maximum: number;

  _offset: number;
  _elements: Array<Hostfunc>;

  constructor(descr: TableDescriptor) {
    if (typeof descr !== "object") {
      throw new TypeError("TableDescriptor must be an object");
    }

    if (typeof descr.maximum === "number") {
      this._maximum = descr.maximum;
    } else {
      this._maximum = DEFAULT_MAX_TABLE_ENTRY;
    }

    if (typeof descr.initial === "number") {
      this._initial = descr.initial;

      if (this._initial > this._maximum) {
        throw new RangeError(
          "Initial number can not be higher than the maximum"
        );
      }
    }

    this._elements = Array(this._initial);
    this._offset = 0;
  }

  push(fn: Hostfunc) {
    const offset = this._offset % this._maximum;

    this._elements[offset] = fn;
    this._offset = offset + 1;
  }

  get(offset: number): ?Hostfunc {
    const element = this._elements[offset];

    if (typeof element === "undefined") {
      return null;
    } else {
      return element;
    }
  }

  get length(): number {
    return this._elements.length;
  }
}
