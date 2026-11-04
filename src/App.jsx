import { useEffect } from 'react';
import initShardBox from './shardBox.js';
import MusicPlayer from './MusicPlayer.jsx';
import './style.css';

export default function App() {
  useEffect(() => {
    initShardBox();
  }, []);


  return (
    <>
      <div id="stage"><canvas id="gl" aria-label="A 3D box of six circuit shards, one for each section. Drag to orbit." /></div>
      <div id="hud">
        <div className="top">
          <div className="id"><span className="id-name" id="idName" /><span className="id-role" id="idRole" /></div>
          <div className="top-right">
            <div className="hint" id="hint" />
          </div>
        </div>
        <figure className="photo" id="photo" role="img" aria-label="Portrait">
          <div className="photo-frame"><div className="crt" id="photoCrt" /></div>
          <figcaption className="photo-cap"><span id="photoId" /><span className="rec">● REC</span></figcaption>
        </figure>
        <aside className="panel" id="panel" role="dialog" aria-labelledby="pTitle" aria-hidden="true">
          <div className="panel-edge">
            <div className="panel-in">
              <button className="panel-x" id="pClose" type="button" aria-label="Close details">×</button>
              <header className="panel-head">
                <div className="panel-bar"><span className="panel-sys" id="pSys" /><span className="panel-n" id="pNum" /></div>
                <h2 className="panel-t" id="pTitle" />
                <p className="panel-tag" id="pTag" />
              </header>
              <div className="panel-body" id="pBody" />
              <footer className="panel-foot" id="pFoot" />
            </div>
          </div>
        </aside>
        <div className="bottom">
          <div className="cap-slot" aria-live="polite">
            <a className="cap" id="cap" target="_blank" rel="noopener noreferrer" hidden />
            <p className="idle" id="idle" />
          </div>
          <nav className="dots" id="dots" aria-label="Sections" />
          <MusicPlayer />
        </div>
      </div>
      <div id="fallback" hidden>This page needs WebGL to draw the box. Try a recent version of Chrome, Safari or Firefox.</div>
    </>
  );
}