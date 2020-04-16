/* eslint-disable no-underscore-dangle */

import omit from '../omit';

type TreeNode<T extends Record<string, any>> = Node<T> & T;

export class Node<T extends Record<string, any>> {
  public parent?: TreeNode<T>;

  public children?: Array<TreeNode<T>>;

  public ancestors?: Array<TreeNode<T>>;

  public proletariats?: Array<TreeNode<T>>;

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
}

type Mode = 'parent' | 'children';

export interface ITreeOpts {
  puid?: string;
  mode?: Mode;
  ancestors?: boolean;
  proletariats?: boolean;
}

const DEFAULT_PUID = 'parent.id';
// const DEFAULT_MODE = '';

export default class Tree<T extends Record<string, any>> {
  public opts: Required<ITreeOpts>;

  public roots: Array<TreeNode<T>> = [];

  public nodes: { [x: string]: TreeNode<T> } = {};

  constructor(data: T[], opts: ITreeOpts = {}) {
    const { puid = DEFAULT_PUID, mode, ancestors, proletariats } = opts;
    this.opts = {
      puid,
      ancestors: !!ancestors,
      proletariats: !!proletariats,
      mode: mode || Tree.guess({ data, puid }),
    };
    this.bind(data);
    this.reschedule();
  }

  private static guess<T>({ data, puid }: { data: T[]; puid: string }): Mode {
    const one = data[0];
    const property = puid.split('.')[0];
    if (one && property && Object.prototype.hasOwnProperty.call(one, property)) {
      return 'parent';
    }

    if (one && Object.prototype.hasOwnProperty.call(one, 'children')) {
      return 'children';
    }

    throw new Error('tree init options error');
  }

  private reschedule() {
    const { ancestors, proletariats } = this.opts;
    const forAncestors = (node: TreeNode<T>): TreeNode<T>[] | undefined =>
      node.parent ? (forAncestors(node.parent) || []).concat([node.parent]) : undefined;
    const forProletariats = (node: TreeNode<T>): TreeNode<T>[] | undefined =>
      node.children?.length
        ? node.children.map(c => (c.children?.length ? forProletariats(c) : c)).flat()
        : undefined;

    Object.values(this.nodes).forEach(node => {
      if (ancestors) {
        node.ancestors = forAncestors(node);
      }
      if (proletariats) {
        node.proletariats = forProletariats(node);
      }
    });
  }

  public toJSON() {
    const hide = (node: TreeNode<T>): TreeNode<T> =>
      omit(node, ['parent', 'children', 'ancestors', 'proletariats']) as T;
    const loop = (nodes: TreeNode<T>[]): TreeNode<T>[] =>
      nodes.map(node => {
        const next = hide(node);
        next.children = next.children && loop(next.children);
        next.ancestors = next.ancestors && loop(next.ancestors);
        next.proletariats = next.proletariats && loop(next.proletariats);

        return next;
      });

    return loop(this.roots);
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
          parent.children = parent.children || [];
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
            parent.children = parent.children || [];
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