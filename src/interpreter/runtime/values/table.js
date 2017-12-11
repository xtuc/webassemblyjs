// @flow

export class Table {
  _element: string;
  _initial: number;
  _maximum: number;

  constructor(descr: TableDescriptor) {

    if (typeof descr !== 'object') {
      throw new TypeError('TableDescriptor must be an object');
    }

    if (typeof descr.maximum === 'number') {
      this._maximum = descr.maximum;
    }

    if (typeof descr.initial === 'number') {
      this._initial = descr.initial;

      if (this._initial > this._maximum) {
        throw new RangeError('Initial number can not be higher than the maximum');
      }
    }
  }

}
