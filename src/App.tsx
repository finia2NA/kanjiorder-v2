import { useRef } from 'react'
import './App.css'
import getKanjiOrder from './logic/kanjiorder';
import { GraphCanvas } from 'reagraph';


function App() {
  const inputRef = useRef<HTMLInputElement>(null)


  const getRequirements = (kanjis: string) => {
    // console.log(kanjis)
    getKanjiOrder("漢字");
  };

  getRequirements("漢字");



  return (
    // <>
    //   Wanted Kanji
    //   <input ref={inputRef} />

    //   <button onClick={() => getRequirements(inputRef.current?.value || '')}>Get Requirements</button>
    // </>
    <GraphCanvas
      nodes={[
        {
          id: 'n-1',
          label: '1'
        },
        {
          id: 'n-2',
          label: '2'
        }
      ]}
      edges={[
        {
          id: '1->2',
          source: 'n-1',
          target: 'n-2',
          label: 'Edge 1-2'
        }
      ]}
    />
  )
}

export default App
