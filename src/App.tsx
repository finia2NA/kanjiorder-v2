import { useEffect, useState } from 'react';
import './App.css'
import KanjiGraph from './components/KanjiGraph'
import getKanjiOrder, { KanjiNode } from './logic/kanjiorder';


function App() {


  const [kanjiNodeList, setKanjiNodeList] = useState<KanjiNode[]>([]);
  const [kanjiRoot, setKanjiRoot] = useState<KanjiNode>(new KanjiNode(''));

  const [targetKanjiString, setTargetKanjiString] = useState<string>('');
  const [knownKanjiString, setKnownKanjiString] = useState<string>('');

  useEffect(() => {

    // Get the kanji order
    const [relevantList, relevantRoot] = getKanjiOrder(targetKanjiString, knownKanjiString);
    setKanjiNodeList(relevantList);
    setKanjiRoot(relevantRoot);


    // Cleanup function
    return () => {
      // Perform any necessary cleanup here
    };
  }, [targetKanjiString, knownKanjiString]);

  const debugFunction = () => {
    console.log(targetKanjiString)
    console.log(kanjiNodeList)
    debugger;
  }


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
            <button onClick={debugFunction}>Debug</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
