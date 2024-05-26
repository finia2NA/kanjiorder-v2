import topology from '../assets/topology.json';

//---------------------------------------------------------------------
// DATA STRUCTURES

// This is the structure of the JSON file
// The topology is a dictionary syntactically,
// semantically it is a DAG modified to have just one root ("0")
type Topology = Record<string, string[]>;

export interface KanjiNode {
  // DAG properties
  name: string;
  children: Node[];
  parents: Node[];

  // for kanji
  isRelevant: boolean;
  isKnown: boolean;
  priority: number | undefined; // lower is more important
}

class Node implements KanjiNode {
  name: string;
  children: Node[];
  parents: Node[];
  isRelevant: boolean = false;
  isKnown: boolean = false;
  priority: number | undefined; // lower is more important

  constructor(name: string) {
    this.name = name;
    this.children = [];
    this.parents = [];
  }

  addChild(node: Node): void {
    this.children.push(node);
  }

  addParent(node: Node): void {
    this.parents.push(node);
  }
}

//---------------------------------------------------------------------
// FUNCTIONS TO CREATE THE GRAPH

function findOrCreateNode(name: string, thelist: Node[]): Node {
  let node = thelist.find(x => x.name === name);
  if (!node) {
    node = new Node(name);
    thelist.push(node);
  }
  return node;
}

/**
 * This function builds the DAG from the JSON file.
 * Does not mark known kanji yet (this is done on the subgraph)
 * @returns [allnodes, root] where allnodes is a list of all nodes and root is the root node
 */
function buildDAG(): [Node[], Node] {
  const root = new Node("0")
  const allnodes: Node[] = [root];

  const keys = Object.keys(topology);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const current = findOrCreateNode(key, allnodes);
    current.priority = i; // assign priority when we are reaching the node *in the list*
    for (const connection of (topology as Topology)[key]) {
      debugger;
      const node = findOrCreateNode(connection, allnodes);
      current.addChild(node);
      node.addParent(current);
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
 * @returns The root node of the new subgraph
 */
function getTargetSubgraph(allRoot: Node, nodeList: Node[], targetKanji: string[], knownKanji: string[]): Node {
  // This function essentially starts at the target kanji and then goes up the DAG, 
  // painting all parents as required
  const paint = (node: Node | undefined) => {
    // In this case, either the node does not exist or this subgraph has already been painted
    if (!node || node.isRelevant) return;
    // recursion 🙏
    node.isRelevant = true;
    for (const parent of node.children) {
      paint(parent);
    }
  }
  // paint all the target kanji (we go UP through parents, not down through children!)
  for (const kanji of targetKanji) {
    const startNode = nodeList.find(x => x.name === kanji);
    paint(startNode);
  }

  // create a new graph with only the relevant nodes
  const relevantWalker = (node: Node): Node => {
    // copy the node properties
    const currentNewNode = new Node(node.name);
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


    // At this point, we have our subgraph. Now, do some adjustments.
    // first, we mark the nodes we know
    markKnown(currentNewNode, knownKanji);

    // secondly, sort the children and parent arrays by priority
    // This way, a left-to right dfs will give a natural order to learn the kanji where
    // the most important ones are first
    const prioWalker = (node: Node) => {
      node.children.sort((a, b) => (a.priority || 0) - (b.priority || 0));
      node.parents.sort((a, b) => (a.priority || 0) - (b.priority || 0));
      for (const child of node.children) {
        prioWalker(child);
      }
    }
    prioWalker(currentNewNode);

    return currentNewNode;
  }

  // create the new graph
  const newRoot = relevantWalker(allRoot);

  return newRoot;
}

function markKnown(rootNode: Node, knownList: string[]) {

  const visited = new Set();

  const paint = (node: Node) => {
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

export default function getKanjiOrder(kanjis: string, known: string = ""): void {
  //   // TODO: find the ones that actually are kanji from the input string (Add resilience)

  // Split our inputs strings into lists
  const targetList: string[] = kanjis.split('');
  const knownList: string[] = known.split('');

  // First, build the DAG of ALL Kanji (big!)
  const [allList, allRoot] = buildDAG();

  // Then, get the relevant subgraph
  debugger;
  const newRoot = getTargetSubgraph(allRoot, allList, targetList, knownList);

  console.log(newRoot);

}
