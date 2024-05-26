import { DisplayNode } from '../components/KanjiGraph';
import topology from '../assets/topology.json';

//---------------------------------------------------------------------
// DATA STRUCTURES

// This is the structure of the JSON file
// The topology is a dictionary syntactically,
// semantically it is a DAG modified to have just one root ("0")
type Topology = Record<string, string[]>;


export class KanjiNode {
  // DAG properties
  name: string;
  children: KanjiNode[];
  parents: KanjiNode[];

  // for kanji
  isRelevant: boolean = false;
  isKnown: boolean = false;
  priority: number | undefined; // lower is more important

  // For display
  displayNode?: DisplayNode;

  constructor(name: string) {
    this.name = name;
    this.children = [];
    this.parents = [];
  }

  addChild(node: KanjiNode): void {
    this.children.push(node);
  }

  addParent(node: KanjiNode): void {
    this.parents.push(node);
  }

  // equals(other: Node): boolean {
  //   if (this === other) return true;
  //   if (other == null || this.constructor !== other.constructor) return false;

  //   return (
  //     this.name === other.name &&
  //     this.isRelevant === other.isRelevant &&
  //     this.isKnown === other.isKnown &&
  //     this.priority === other.priority &&
  //     this.children.length === other.children.length &&
  //     this.parents.length === other.parents.length &&
  //     this.children.every((child, idx) => child.equals(other.children[idx])) &&
  //     this.parents.every((parent, idx) => parent.equals(other.parents[idx]))
  //   );
  // }
}

//---------------------------------------------------------------------
// FUNCTIONS TO CREATE THE GRAPH

function findOrCreateNode(name: string, thelist: KanjiNode[]): KanjiNode {
  let node = thelist.find(x => x.name === name);
  if (!node) {
    node = new KanjiNode(name);
    thelist.push(node);
  }
  return node;
}

/**
 * This function builds the DAG from the JSON file.
 * Does not mark known kanji yet (this is done on the subgraph)
 * @returns [allnodes, root] where allnodes is a list of all nodes and root is the root node
 */
function buildDAG(): [KanjiNode[], KanjiNode] {
  const root = new KanjiNode("0")
  const allnodes: KanjiNode[] = [root];

  const keys = Object.keys(topology);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const currentNode = findOrCreateNode(key, allnodes);
    currentNode.priority = i; // assign priority when we are reaching the node *in the list*
    for (const parent of (topology as Topology)[key]) {
      const parentNode = findOrCreateNode(parent, allnodes);
      currentNode.addParent(parentNode);
      parentNode.addChild(currentNode);
    }
  }
  return [allnodes, root]
}

// New subgraph functions
/**
 * This function takes the whole kanji topography as graph and node list and returns a subgraph of kanjis to know.
 * The subgraph is a DAG with the same structure as the original, but with only the relevant nodes.
 * Parent and children arrays are sorted by priority.
 * Already known kanji are marked as such.
 * @param allRoot the root node of the whole kanji graph
 * @param nodeList the list of all kanji nodes
 * @param targetKanji the list of kanji to learn
 * @returns
 */
function getTargetSubgraph(allRoot: KanjiNode, nodeList: KanjiNode[], targetKanji: string[], knownKanji: string[]): [KanjiNode[], KanjiNode] {
  // Step 1: go throught the allRoot graph and mark everything relevant
  const paint = (node: KanjiNode | undefined) => {
    // In this case, either the node does not exist or this subgraph has already been painted
    if (!node || node.isRelevant) return;
    // recursion 🙏
    node.isRelevant = true;
    for (const parent of node.parents) {
      paint(parent);
    }
  }
  // paint all the target kanji (we go UP through parents, not down through children!)
  for (const kanji of targetKanji) {
    const startNode = nodeList.find(x => x.name === kanji);
    paint(startNode);
  }

  // Step 2: create a new graph with only the relevant nodes
  const relevantWalker = (node: KanjiNode): KanjiNode => {
    // copy the node properties
    const currentNewNode = new KanjiNode(node.name);
    currentNewNode.isRelevant = node.isRelevant;
    currentNewNode.isKnown = node.isKnown;
    currentNewNode.priority = node.priority;

    // add only the relevant parents
    for (const child of node.children) {
      if (child.isRelevant) {
        const relevantChildrenRoot = relevantWalker(child);
        currentNewNode.addChild(relevantChildrenRoot);
        relevantChildrenRoot.addParent(currentNewNode);
      }
    }

    return currentNewNode
  }
  const relevantRootNode = relevantWalker(allRoot);

  // Step 2a: clean up the graph
  for (const node of nodeList) {
    node.isRelevant = false;
  }


  // At this point, we have our subgraph. Now, do some adjustments.
  // Step 3: Mark the nodes we know
  markKnown(relevantRootNode, knownKanji);

  // Step 4: Sort the children and parent arrays by priority
  // This way, a left-to right dfs will give a natural order to learn the kanji where
  // the most important ones are first
  const prioWalker = (node: KanjiNode) => {
    node.children.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    node.parents.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    for (const child of node.children) {
      prioWalker(child);
    }
  }
  prioWalker(relevantRootNode);

  // Step 5: Generate the list of relevant nodes
  const visited: Set<string> = new Set();
  const relevantList: KanjiNode[] = [];
  const listWalker = (node: KanjiNode) => {
    if (visited.has(node.name)) return;

    visited.add(node.name);
    relevantList.push(node);
    for (const child of node.children) {
      listWalker(child);
    }
  }
  listWalker(relevantRootNode);

  // Finally, return
  return [relevantList, relevantRootNode];
}


function markKnown(rootNode: KanjiNode, knownList: string[]) {

  const visited = new Set();

  const paint = (node: KanjiNode) => {
    visited.add(node)

    const match = knownList.find(x => x === node.name);
    if (match) {
      node.isKnown = true;
    }

    for (const child of node.children) {
      if (!visited.has(child)) {
        paint(child);
      }
    }
  }

  paint(rootNode);
}


// //---------------------------------------------------------------------
// // MAIN FUNCTION

// Do this only once
const [allList, allRoot] = buildDAG();

export default function getKanjiOrder(kanjis: string, known: string = ""): [KanjiNode[], KanjiNode] {
  //   // TODO: find the ones that actually are kanji from the input string (Add resilience)

  // Split our inputs strings into lists
  const targetList: string[] = kanjis.split('');
  const knownList: string[] = known.split('');

  // Get the relevant subgraph
  const [relevantList, relevantRoot] = getTargetSubgraph(allRoot, allList, targetList, knownList);

  return [relevantList, relevantRoot];

}
