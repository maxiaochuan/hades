/* eslint-disable no-underscore-dangle */

type TreeNode<T extends Record<string, any>> = Node<T> & T;

export class Node<T extends Record<string, any>> {
  public parent?: TreeNode<T>;

  public children: Array<TreeNode<T>> = [];

  private _ancestors?: Array<TreeNode<T>>;

  public _proletariats?: Array<TreeNode<T>>;

  constructor(init: T) {
    Object.keys(init).forEach(key => {
      if (!/^(children|parent|ancestors|proletariats)$/.test(key)) {
        Object.defineProperty(this, key, {
          enumerable: true,
          configurable: true,
          writable: true,
          value: init[key],
        });
      }
    });
  }

  public get ancestors(): TreeNode<T>[] {
    if (!this._ancestors) {
      this._ancestors = this.parent ? this.parent.ancestors.concat(this.parent) : [];
    }
    return this._ancestors;
  }

  public get proletariats(): TreeNode<T>[] {
    if (!this._proletariats) {
      this._proletariats = this.children.length
        ? this.children.map(c => (c.children.length ? c.proletariats : c)).flat()
        : [];
    }
    return this._proletariats;
  }
}

export interface ITreeOpts {
  puid?: string;
  mode?: 'parent' | 'children';
}

const DEFAULT_PUID = 'parent.id';
// const DEFAULT_MODE = '';

export default class Tree<T extends Record<string, any>> {
  public opts: Required<ITreeOpts>;

  public roots: Array<TreeNode<T>> = [];

  public nodes: { [x: string]: TreeNode<T> } = {};

  constructor(data: T[], opts: ITreeOpts = {}) {
    this.opts = Tree.initOpts({ data, opts });
    this.bind(data);
  }

  // eslint-disable-next-line class-methods-use-this
  private static initOpts<T>({ data, opts }: { data: T[]; opts: ITreeOpts }): Required<ITreeOpts> {
    const { puid = DEFAULT_PUID, mode } = opts;

    if (mode) {
      return { mode, puid };
    }
    const one = data[0];
    const property = puid.split('.')[0];
    if (one && property && Object.prototype.hasOwnProperty.call(one, property)) {
      return { mode: 'parent', puid };
    }

    if (one && Object.prototype.hasOwnProperty.call(one, 'children')) {
      return { mode: 'children', puid };
    }

    throw new Error('tree init options error');
  }

  private bind(data: T[]) {
    const { mode } = this.opts;
    if (mode === 'parent') {
      const { puid = DEFAULT_PUID } = this.opts;
      this.nodes = data.reduce<Record<string, TreeNode<T>>>((prev, r) => {
        prev[r.id] = new Node(r) as TreeNode<T>;
        return prev;
      }, {});

      data.forEach(r => {
        const node = this.nodes[r.id];
        const pid = puid.split('.').reduce<any>((prev, k) => prev && prev[k], r);
        const parent = this.nodes[pid];
        if (parent) {
          node.parent = parent;
          parent.children.push(node);
        } else {
          this.roots.push(node);
        }
      });
    }

    if (mode === 'children') {
      const loop = (d: T[], parent?: TreeNode<T>) => {
        d.forEach(r => {
          const node = new Node(r) as TreeNode<T>;
          this.nodes[r.id] = node;
          if (parent) {
            node.parent = parent;
            parent.children.push(node);
          }
          if (r.children && r.children.length) {
            loop(r.children, node);
          }
        });

        d.forEach(r => {
          const node = this.nodes[r.id];
          if (!node.parent) {
            this.roots.push(node);
          }
        });
      };

      loop(data);
    }
  }
}
