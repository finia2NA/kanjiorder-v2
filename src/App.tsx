import { useRef } from 'react'
import './App.css'
import getKanjiOrder, { KanjiNode } from './logic/kanjiorder';
import { GraphCanvas, GraphCanvasRef, useSelection } from 'reagraph';

export interface DisplayNode {
  id: string;
  label: string;
  dataNode: KanjiNode;
}

export interface DisplayEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

function App() {
  // Data generation...
  const [kanjiNodeList, kanjiRoot] = getKanjiOrder("女怒相違偉");

  const [nodes, edges]: [DisplayNode[], DisplayEdge[]] = [[], []]
  for (const node of kanjiNodeList) {

    // Node
    const currentDisplayNode: DisplayNode = {
      id: "n-" + node.name,
      label: node.name,
      dataNode: node
    }
    nodes.push(currentDisplayNode);

    // Edges
    for (const child of node.children) {
      const currentEdge: DisplayEdge = {
        id: node.name + "->" + child.name,
        source: "n-" + node.name,
        target: "n-" + child.name,
        // label: "Edge " + node.name + "-" + child.name
      };
      edges.push(currentEdge);
    }
  }



  // Display...
  const graphRef = useRef<GraphCanvasRef>(null);
  const { selections, actives, onNodeClick, onCanvasClick, onNodePointerOver, onNodePointerOut } = useSelection({
    ref: graphRef,
    nodes: nodes,
    edges: edges,
    pathHoverType: 'in',
    pathSelectionType: 'in',
    type: 'multi',
  });



  return (
    // <>
    //   Wanted Kanji
    //   <input ref={inputRef} />

    //   <button onClick={() => getRequirements(inputRef.current?.value || '')}>Get Requirements</button>
    // </>
    <GraphCanvas
      ref={graphRef}
      labelFontUrl="https://ey2pz3.csb.app/NotoSansSC-Regular.ttf"
      layoutType="treeTd2d" // Note: our data is not a tree, but a DAG. But the layout seems to still work
      // layoutType="hierarchicalTd" // Alternative layout
      nodes={nodes}
      edges={edges}
      selections={selections}
      actives={actives}
      onNodePointerOver={onNodePointerOver}
      onNodePointerOut={onNodePointerOut}
      onCanvasClick={onCanvasClick}
      onNodeClick={onNodeClick}
    />
  )
}

export default App
