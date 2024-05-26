import topology from '../assets/topology.json';

//---------------------------------------------------------------------
// DATA STRUCTURES

// This is the structure of the JSON file
type Topology = Record<string, string[]>;

export interface KanjiNode {
  name: string;
  children: Node[];
  isKnown?: boolean;
}

class Node implements KanjiNode {
  name: string;
  children: Node[];
  isKnown?: boolean = false;

  constructor(name: string) {
    this.name = name;
    this.children = [];
  }

  addEdge(node: Node): void {
    this.children.push(node);
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

function buildDAG(): [Node[], Node] {
  // Create nodes
  const root = new Node("0")
  const allnodes: Node[] = [root];
  for (const key in topology as Topology) {
    const current = findOrCreateNode(key, allnodes);
    for (const connection of (topology as Topology)[key]) {
      const node = findOrCreateNode(connection, allnodes);
      current.addEdge(node);
    }
  }
  return [allnodes, root]
}

// Build our subgraph from targets to be included
function d2(fullGraph: Node[], targets: string[]): Node[] {
  const resolved: Node[] = [];
  for (const name of targets) {
    try {
      const node = fullGraph.find((x: Node) => x.name === name);
      if (node) {
        depResolve(node, resolved);
      } else {
        console.log("Something went wrong for " + name);
      }
    } catch (error) {
      console.log("Something went wrong for " + name);
    }
  }
  return resolved;
}

function depResolve(node: Node, resolved: Node[]): void {
  // Source: https://www.electricmonk.nl/docs/dependency_resolving_algorithm/dependency_resolving_algorithm.html
  for (const edge of node.children) {
    if (!resolved.includes(edge)) {
      depResolve(edge, resolved);
    }
  }
  resolved.push(node);
}

//---------------------------------------------------------------------
// FUNCTION TO MARK KNOWN KANJIS
function markKnown(kanjiList: Node[], knownList: string[]) {
  for (const node of kanjiList) {
    for (const candidate of knownList) {
      if (node.name === candidate) {
        node.isKnown = true;
      }
    }
  }
}


//---------------------------------------------------------------------
// MAIN FUNCTION

export default function getKanjiOrder(kanjis: string, known: string = ""): void {
  // TODO: find the ones that actually are kanji from the input string (Add resilience)

  // Split our inputs strings into lists
  const targetList: string[] = kanjis.split('');
  const knownList: string[] = known.split('');

  // First, build the DAG of ALL Kanji (big!)
  const [allGraph, allRoot] = buildDAG();

  // Then, get the subtree for the Kanji we actually want
  const resolved: Node[] = d2(allGraph, targetList);

  // Mark the known kanjis

  // const l1: string[] = resolved.map(x => x.name);
  // const l2: string[] = l1.filter(x => !known.includes(x));

  // console.log("Whole order:");
  // console.log(l1);

  // console.log("New ones:");
  // console.log(l2);

  // console.log("You have to learn: " + l2.length + ", you already knew: " + (l1.length - l2.length));

  // console.log(resolved);
}





