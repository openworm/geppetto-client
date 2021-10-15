import ASimpleInstance from './ASimpleInstance';

export default class SimpleConnectionInstance extends ASimpleInstance{
  constructor (node) {
    super(node);
    this.a = node.a;
    this.b = node.b
  }
  
}
