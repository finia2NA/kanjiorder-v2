import { DisplayNode } from '../components/KanjiGraph';
import topology from '../assets/topology.json';

// This is the structure of the JSON file
// The topology is a dictionary syntactically,
// semantically it is a DAG I have modified to have just one root ("0")
type Topology = Record<string, string[]>;

// RADICALS:
// This is from https://www.localizingjapan.com/blog/2012/01/20/regular-expressions-for-japanese-text/ .
// Not using their regex because they match Kangxi unicode block, while I operate in CJK Unified Ideographs
// When normalized, some of these radicals turn into Kanji. I have done my best to remove them.

// This is the original
// const radicalList = new Set("⺀⺀⺁⺂⺃⺄⺅⺆⺇⺈⺉⺊⺋⺌⺍⺎⺏⺐⺑⺒⺓⺔⺕⺖⺗⺘⺙⺚⺛⺜⺝⺞⺟⺠⺡⺢⺣⺤⺥⺦⺧⺨⺩⺪⺫⺬⺭⺮⺯⺰⺱⺲⺳⺴⺵⺶⺷⺸⺹⺺⺻⺼⺽⺾⺿⻀⻁⻂⻃⻄⻅⻆⻇⻈⻉⻊⻋⻌⻍⻎⻏⻐⻑⻒⻓⻔⻕⻖⻗⻘⻙⻚⻛⻜⻝⻞⻟⻠⻡⻢⻣⻤⻥⻦⻧⻨⻩⻪⻫⻬⻭⻮⻯⻰⻱⻲⻳⼀⼁⼂⼃⼄⼅⼆⼇⼈⼉⼊⼋⼌⼍⼎⼏⼐⼑⼒⼓⼔⼕⼖⼗⼘⼙⼚⼛⼜⼝⼞⼟⼠⼡⼢⼣⼤⼥⼦⼧⼨⼩⼪⼫⼬⼭⼮⼯⼰⼱⼲⼳⼴⼵⼶⼷⼸⼹⼺⼻⼼⼽⼾⼿⽀⽁⽂⽃⽄⽅⽆⽇⽈⽉⽊⽋⽌⽍⽎⽏⽐⽑⽒⽓⽔⽕⽖⽗⽘⽙⽚⽛⽜⽝⽞⽟⽠⽡⽢⽣⽤⽥⽦⽧⽨⽩⽪⽫⽬⽭⽮⽯⽰⽱⽲⽳⽴⽵⽶⽷⽸⽹⽺⽻⽼⽽⽾⽿⾀⾁⾂⾃⾄⾅⾆⾇⾈⾉⾊⾋⾌⾍⾎⾏⾐⾑⾒⾓⾔⾕⾖⾗⾘⾙⾚⾛⾜⾝⾞⾟⾠⾡⾢⾣⾤⾥⾦⾧⾨⾩⾪⾫⾬⾭⾮⾯⾰⾱⾲⾳⾴⾵⾶⾷⾸⾹⾺⾻⾼⾽⾾⾿⿀⿁⿂⿃⿄⿅⿆⿇⿈⿉⿊⿋⿌⿍⿎⿏⿐⿑⿒⿓⿔⿕".normalize("NFKC").split(''));

// This is the one I have cleaned
const radicalSet = new Set("⺀⺁⺂⺃⺄⺅⺆⺇⺈⺉⺊⺋⺌⺍⺎⺏⺐⺑⺒⺓⺔⺕⺖⺗⺘⺙⺚⺛⺜⺝⺞⺡⺢⺣⺤⺥⺦⺧⺨⺩⺪⺫⺬⺭⺮⺯⺰⺱⺲⺳⺴⺵⺶⺷⺸⺹⺺⺻⺼⺽⺾⺿⻀⻂⻃⻅⻇⻈⻉⻊⻋⻌⻍⻎⻏⻐⻒⻓⻔⻕⻖⻗⻙⻚⻛⻜⻝⻞⻟⻠⻡⻢⻣⻥⻦⻧⻪⻫⻬⻭⻮⻰⻱龟丨丶丿亅亠儿冂冖冫几凵勹匕匚匸卜卩厂厶夂夊宀寸小尢尸屮巛巾幺广廴廾弋弓彐彡彳戈戶攴斤无曰歹殳毋气爻爿片牙瓦疋疒癶禸禾糸缶网而耒肉自至臼舛艮艸襾豸辵釆隶隹韋韭髟鬥鬯鬲鹵麥黍黑黹黽鼎鼠齊齒龜龠".normalize("NFKC").split(''));

export class KanjiNode {
  // DAG properties
  name: string;
  children: KanjiNode[];
  parents: KanjiNode[];

  // for kanji
  isRadical: boolean;
  priority: number | undefined; // lower is more important
  isRelevant: boolean = false;
  isKnown: boolean = false;

  // For display
  displayNode?: DisplayNode;

  constructor(name: string) {
    // In unicode, some kanji have multiple representations, so we normalize them to a standard one.
    this.name = name.normalize("NFKC");
    this.children = [];
    this.parents = [];

    this.isRadical = radicalSet.has(this.name);
  }

  addChild(node: KanjiNode): void {
    this.children.push(node);
  }

  addParent(node: KanjiNode): void {
    this.parents.push(node);
  }

  /**
   * Returns a shallow copy of the node (no children or parents are copied, just the properties)
   * @returns 
   */
  shallowCopy(): KanjiNode {
    const newNode = new KanjiNode(this.name);
    newNode.isRadical = this.isRadical;
    newNode.isRelevant = this.isRelevant;
    newNode.isKnown = this.isKnown;
    newNode.priority = this.priority;
    return newNode;
  }
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

    node.isRelevant = true;
    // recursion 🙏
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
    const currentNewNode = node.shallowCopy();

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

  // Step 2a: clean up the big graph
  for (const node of nodeList) {
    node.isRelevant = false;
  }


  // At this point, we have our subgraph. Now, do some adjustments.
  // Step 3: Mark the nodes we know
  markKnown(relevantRootNode, knownKanji);

  // Step 4: Sort the children and parent arrays by priority
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

// ---------------------------------------------------------------------
// Order Recommendation

/**
 * Generates an order to study the kanji, where
 * 1. Consitituating parts are always learned before the kanji that uses them
 * 2. The most frequent kanji are learned first
 * @param rootNode 
 * @returns
 */
// NOTE: if a high-priority kanji is hidden behind a low-priority radical, it suffers in this
// Implementation. Could be improved by calculating a "value" of each node based on the
// collective priority of all its (multi-level) children.
export function getRecommendedOrder(rootNode: KanjiNode): KanjiNode[] {
  // List of directly reachable nodes, sorted by priority, advantage given to Kanji over radicals
  const possibleCandidates = [rootNode];
  // The order to return
  const returnList: KanjiNode[] = [];

  while (possibleCandidates.length > 0) {
    const candidate = possibleCandidates.shift();

    // This should never happen but the compiler wants this line
    if (!candidate) throw new Error("unexpectedly didn't receive a candidate");

    // See if the candidate is already in the return list
    // (Since it is a DFS it can be the child of multiple parents)
    const alreadyInList = returnList.find(x => x.name === candidate?.name);
    if (alreadyInList) continue;

    // If the candidate is not in the return list, add it
    returnList.push(candidate as KanjiNode);

    // Insert the children into possibleCandidates if all parents are already in the list
    for (const child of candidate.children) {
      if (child.parents.every(x => returnList.includes(x))) {
        possibleCandidates.push(child);
      }
    }

    // Sort the current list by if it is a radical first, then priority.
    // This way:
    // 1. All currently available kanji will be learned before new radicals
    // 2. The priority will be respected
    // NOTE: It would be better if we inserted at the correct position instead of pushing to the end
    //  and sorting, but I can optimize this later
    possibleCandidates.sort((a, b) => {
      // Sort by isRadical first
      if (a.isRadical && !b.isRadical) {
        return 1; // a is radical, b is not radical, so a should come after b
      } else if (!a.isRadical && b.isRadical) {
        return -1; // a is not radical, b is radical, so a should come before b
      }
      // Sort by priority if isRadical is the same
      return (a.priority || 0) - (b.priority || 0);
    });
  }

  return returnList;
}


// //---------------------------------------------------------------------
// // MAIN FUNCTION

// Build the DAG only once since it takes time
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

// Note: for the order string, we should do an approach where we compare the priority of our children to the priority of our brothers. The one with lowest priority should be chosen