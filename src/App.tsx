import { useEffect, useState } from 'react';
import './App.css'
import KanjiGraph from './components/KanjiGraph'
import getKanjiOrder, { KanjiNode, getRecommendedOrder } from './logic/kanjiorder';


function App() {


  const [kanjiNodeList, setKanjiNodeList] = useState<KanjiNode[]>([]);
  const [kanjiRoot, setKanjiRoot] = useState<KanjiNode>(new KanjiNode(''));

  const [recommendedOrder, setRecommendedOrder] = useState<string>('');

  const [targetKanjiString, setTargetKanjiString] = useState<string>('');
  const [knownKanjiString, setKnownKanjiString] = useState<string>('');

  useEffect(() => {

    // Get the kanji graph
    const [relevantList, relevantRoot] = getKanjiOrder(targetKanjiString, knownKanjiString);
    setKanjiNodeList(relevantList);
    setKanjiRoot(relevantRoot);

    // Get order in string form
    const orderString = getRecommendedOrder(relevantRoot).map(x => x.name).filter(x => !knownKanjiString.includes(x)).join('');
    setRecommendedOrder(orderString);

    // Cleanup function
    return () => {
      // Perform any necessary cleanup here
    };
  }, [targetKanjiString, knownKanjiString, setKanjiNodeList, setKanjiRoot, setRecommendedOrder]);


  return (
    <div className='flex flex-row'>
      {/* Hardcoded style for the 2 sections because otherwise the graph will fill the whole screen */}
      <div style={{ position: "fixed", left: 0, top: 0, width: '50%', height: '100%' }}>
        <KanjiGraph kanjiNodeList={kanjiNodeList} kanjiRoot={kanjiRoot} />
      </div>
      <div style={{ position: "fixed", right: 0, top: 0, width: '50%', height: '100%' }}>
        <div className='m-4 text-left'>
          <h1 className='text-3xl '>Kanji Order Tool</h1>
          <div className='mt-6'>
            <form>
              <div className='mb-4'>
                <label htmlFor='targetKanji' className='block text-lg font-medium text-gray-700'>Target Kanji</label>
                <textarea id='targetKanji'
                  value={targetKanjiString}
                  onChange={(e) => setTargetKanjiString(e.target.value)}
                  className='mt-1 p-2 border border-gray-300 rounded-md' />
              </div>
              <div className='mb-4'>
                <label htmlFor='knownKanji' className='block text-lg font-medium text-gray-700'>Known Kanji</label>
                <textarea value={knownKanjiString} onChange={(e) => setKnownKanjiString(e.target.value)} id='knownKanji' className='mt-1 p-2 border border-gray-300 rounded-md' />
              </div>
            </form>
          </div>
          <div>
            <h2 className='text-xl mt-6'>Recommended Order</h2>
            <p>{recommendedOrder}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
