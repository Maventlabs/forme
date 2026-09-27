'use client'

import Image from 'next/image'
import { useState } from 'react'
import {
  AtSign, Box, ChevronDown, ChevronRight, Image as ImageIcon,
  Layers2, MousePointer2, Plus, Type,
} from 'lucide-react'
import styles from './landing.module.css'

/** Honest temporary preview: no AI, account, sharing or persistence is simulated. */
export function WorkspacePreview({ compact = false, interactive = false }: { compact?: boolean; interactive?: boolean }) {
  const [selected, setSelected] = useState<'Hero' | 'Heading' | 'Media' | 'Text'>('Hero')
  const [breakpoint, setBreakpoint] = useState<'Desktop' | 'Mobile'>('Desktop')
  const [hasText, setHasText] = useState(false)

  const addText = () => {
    setHasText(true)
    setSelected('Text')
  }

  const reset = () => {
    setHasText(false)
    setSelected('Hero')
    setBreakpoint('Desktop')
  }

  const toggleBreakpoint = () => setBreakpoint((current) => current === 'Desktop' ? 'Mobile' : 'Desktop')

  return (
    <div className={styles.previewWrap}>
      {interactive && <div className={styles.previewTouchControls} role="group" aria-label="Workspace preview controls">
        <button type="button" onClick={() => setSelected('Hero')} aria-pressed={selected === 'Hero'}><MousePointer2 size={16} aria-hidden="true" /><span>Hero</span></button>
        <button type="button" onClick={() => setSelected('Heading')} aria-pressed={selected === 'Heading'}><Type size={16} aria-hidden="true" /><span>Heading</span></button>
        <button type="button" onClick={() => setSelected('Media')} aria-pressed={selected === 'Media'}><ImageIcon size={16} aria-hidden="true" /><span>Media</span></button>
        <button type="button" onClick={addText}><Plus size={16} aria-hidden="true" /><span>Add text</span></button>
        <button type="button" onClick={toggleBreakpoint} aria-label={`Switch to ${breakpoint === 'Desktop' ? 'Mobile' : 'Desktop'} frame`}><Box size={16} aria-hidden="true" /><span>{breakpoint}</span></button>
        <button type="button" onClick={reset}><Layers2 size={16} aria-hidden="true" /><span>Reset</span></button>
      </div>}
    <div className={`${styles.workspace} ${compact ? styles.workspaceCompact : ''}`} role={interactive ? 'group' : 'img'} aria-label={interactive ? 'Interactive local preview of the FORME workspace' : 'Illustrative dark FORME workspace with semantic wireframe and floating Composer'}>
      <aside className={styles.workspaceRail} aria-hidden="true">
        <Image src="/brand/forme/forme-logo-mark-white.png" alt="" width={189} height={174} style={{ width: 28, height: 'auto' }} />
        <div className={styles.railItems}>
          <span className={styles.railActive}><Layers2 size={16} />File</span>
          <span><Box size={16} />Agents</span>
          <span><ImageIcon size={16} />Assets</span>
          <span><MousePointer2 size={16} />Tools</span>
          <span><Layers2 size={16} />Variables</span>
        </div>
      </aside>
      <div className={styles.canvasArea} aria-hidden={interactive ? undefined : true}>
        <div className={styles.canvasTopline}><span>Untitled project <ChevronRight size={12} /> Homepage</span><span>100% <ChevronDown size={12} /></span></div>
        <div className={styles.canvasFrames}>
          <div className={styles.desktopFrame}>
            <span className={styles.frameLabel}>Homepage · Desktop <span>1440</span></span>
            <div className={styles.wireframe}>
              <div className={styles.wireNav}><span className={styles.wireBrand} /> <span /> <span /> <span /></div>
              <div className={styles.wireHero}>
                <div className={styles.wireCopy}>
                  {interactive && <button type="button" className={styles.previewNodeTarget} onClick={() => setSelected('Heading')} aria-label="Select Heading node" aria-pressed={selected === 'Heading'}>Heading</button>}
                  <span className={styles.wireEyebrow} /><span className={styles.wireTitle} /><span className={styles.wireTitleShort} /><span className={styles.wireLine} /><span className={styles.wireLineShort} /><span className={styles.wireButton} />
                  {hasText && <span className={styles.previewAddedText}>New text block</span>}
                </div>
                {interactive ? <button type="button" className={`${styles.wireMedia} ${styles.previewMediaButton}`} onClick={() => setSelected('Media')} aria-label="Select Media node" aria-pressed={selected === 'Media'}><ImageIcon size={24} strokeWidth={1.4} /><span>Media</span></button> : <div className={styles.wireMedia}><ImageIcon size={24} strokeWidth={1.4} /><span>Media</span></div>}
              </div>
              <div className={styles.wireSections}><div /><div /><div /></div>
            </div>
          </div>
          <div className={styles.mobileFrame}>
            {interactive ? <button type="button" className={styles.frameLabelButton} onClick={() => setBreakpoint('Mobile')} aria-pressed={breakpoint === 'Mobile'}>Mobile <span>390</span></button> : <span className={styles.frameLabel}>Mobile <span>390</span></span>}
            <div className={styles.mobileWire}><div /><span /><span /><div /></div>
          </div>
        </div>
        <div className={styles.toolDock}>
          {interactive ? <><button type="button" onClick={() => setSelected('Hero')} aria-label="Select Hero node" aria-pressed={selected === 'Hero'}><MousePointer2 size={17} /></button><button type="button" onClick={() => setBreakpoint('Desktop')} aria-label="Select Desktop frame" aria-pressed={breakpoint === 'Desktop'}><Box size={17} /></button><button type="button" onClick={addText} aria-label="Add a text block to preview"><Type size={17} /></button><button type="button" onClick={() => setSelected('Media')} aria-label="Select Media node" aria-pressed={selected === 'Media'}><ImageIcon size={17} /></button><button type="button" onClick={reset} aria-label="Reset preview"><Layers2 size={17} /></button></> : <><span className={styles.toolSelected}><MousePointer2 size={17} /></span><span><Box size={17} /></span><span><Type size={17} /></span><span><ImageIcon size={17} /></span><span><Layers2 size={17} /></span></>}
        </div>
        <div className={styles.composer}>
          <p>{interactive ? <>Select a node or add text. <strong>@{selected}</strong> is in focus.</> : <>Make <strong>@Hero</strong> more focused, keep the layout intact.</>}</p>
          <div className={styles.composerTools} aria-hidden="true"><span><Plus size={15} /></span><span>/</span><span><AtSign size={15} /></span><span className={styles.composerSelect}>Preset <ChevronDown size={11} /></span><span className={styles.composerSelect}>Model <ChevronDown size={11} /></span><span className={styles.composerSend}>Send</span></div>
        </div>
      </div>
      <aside className={styles.inspector} aria-hidden={interactive ? undefined : true}>
        <div className={styles.inspectorTop}><span className={styles.avatar} />Workspace <ChevronDown size={12} /></div>
        <div className={styles.inspectorActions} aria-hidden="true"><span>Share</span><span>Export</span></div>
        <div className={styles.inspectorHeader}>Inspector <span aria-live={interactive ? 'polite' : undefined}>{selected}</span></div>
        <div className={styles.inspectorGroup}><p>Layout</p><div><span>X <b>0</b></span><span>Y <b>96</b></span></div><div><span>W <b>{breakpoint === 'Mobile' ? '390' : '1440'}</b></span><span>H <b>Auto</b></span></div></div>
        <div className={styles.inspectorGroup}><p>Spacing</p><div><span>Padding <b>64</b></span><span>Gap <b>32</b></span></div></div>
        <div className={styles.inspectorGroup}><p>Breakpoint</p><div><span>{breakpoint} <b>{breakpoint === 'Mobile' ? '390' : '1440'}</b></span></div></div>
      </aside>
    </div>
    </div>
  )
}
