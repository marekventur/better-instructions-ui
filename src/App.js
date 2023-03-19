import './App.css';
import { useData } from './useData';

function App() {
  const { 
    current, 
    setCurrentModifications, 
    modifications, 
    next,
    previous, 
    currentIsHumanVerified, 
    setCurrentIsHumanVerified, 
    currentIsModified, 
    undoModifications, 
    download,
    clearModifications,
    deleteCurrent
  } = useData();
  return (
    <div className="root">
      <header>
        <h1>Instructions</h1>
        <p>Checked: {Object.entries(modifications).length}</p>
        <button onClick={() => previous()}>Previous</button>
        <button disabled={currentIsHumanVerified} onClick={() => setCurrentIsHumanVerified(true)}>Verify</button>
        <button onClick={() => next()}>Next</button>
        <button onClick={() => deleteCurrent(true)}>Mark for deletion</button>
        <button onClick={() => download()}>Download</button>
        <button onClick={() => clearModifications()}>Clear modifications</button>
      </header>
      <main>
        {current && <div className="content">
          <div className="label">Instructions</div>
          <textarea onChange={e => setCurrentModifications('instruction', e.target.value)} value={current.instruction} />

          <div className="label">Input</div>
          <textarea onChange={e => setCurrentModifications('input', e.target.value)} value={current.input} />

          <div className="label">Output</div>
          <textarea onChange={e => setCurrentModifications('output', e.target.value)} value={current.output} />
          
          <div className="label">Status</div>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={currentIsHumanVerified} 
                onChange={e => setCurrentIsHumanVerified(e.target.checked)}
              />
              Human verified
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={current?.delete ?? false} 
                onChange={e => deleteCurrent(e.target.checked)}
              />
              Mark for deletion
            </label>
            <button disabled={!currentIsModified} onClick={undoModifications}>Undo modifications</button>
          </div>
        </div>}
      </main>
    </div>
  );
}

export default App;
