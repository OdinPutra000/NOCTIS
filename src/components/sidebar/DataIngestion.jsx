import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/investigationStore';
import { CASE_TYPES } from '../../data/sampleCase';
import { FileText, Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

export default function DataIngestion() {
  const {
    rawIntelligence,
    setRawIntelligence,
    caseName,
    setCaseName,
    caseType,
    setCaseType,
    runAnalysis,
    clearCase,
    loadSampleCase,
    analysisRunning,
    importCaseData
  } = useStore();

  const [isDragging, setIsDragging] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }
  const [ingestedFiles, setIngestedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const showStatus = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const processFile = async (file) => {
    const name = file.name;
    const extension = name.slice(name.lastIndexOf('.')).toLowerCase();
    
    // Set Case Name from file name if not already set or default
    const baseName = name.slice(0, name.lastIndexOf('.')).replace(/[_-]/g, ' ');
    if (!caseName || caseName === 'Unnamed Investigation' || caseName === 'Operation Ghost Wire') {
      setCaseName(baseName.toUpperCase());
    }

    try {
      if (extension === '.json') {
        const text = await readTextFile(file);
        const data = JSON.parse(text);
        
        // Check if this is a fully exported NOCTIS case structure
        if (data.entities && Array.isArray(data.entities) && data.relationships && Array.isArray(data.relationships)) {
          importCaseData(data);
          showStatus(`Imported full case structure from ${name}`, 'success');
          setIngestedFiles(prev => [...prev, { name, size: file.size, type: 'JSON CASE' }]);
          return;
        } else {
          // Standard JSON raw intelligence
          const formattedText = JSON.stringify(data, null, 2);
          const currentText = useStore.getState().rawIntelligence;
          setRawIntelligence(currentText ? `${currentText}\n\n=== INGESTED JSON: ${name} ===\n${formattedText}` : formattedText);
          showStatus(`Ingested data from ${name}`);
        }
      } else if (extension === '.pdf') {
        const parsedText = await extractPdfText(file);
        const currentText = useStore.getState().rawIntelligence;
        setRawIntelligence(currentText ? `${currentText}\n\n=== INGESTED PDF: ${name} ===\n${parsedText}` : parsedText);
        showStatus(`Ingested readable strings from ${name}`);
      } else {
        // Plain text, logs, csv, xml
        const text = await readTextFile(file);
        const currentText = useStore.getState().rawIntelligence;
        setRawIntelligence(currentText ? `${currentText}\n\n=== INGESTED FILE: ${name} ===\n${text}` : text);
        showStatus(`Ingested text from ${name}`);
      }

      setIngestedFiles(prev => [...prev, { name, size: file.size, type: extension.slice(1).toUpperCase() }]);
    } catch (err) {
      console.error(err);
      showStatus(`Failed to read/parse ${name}`, 'error');
    }
  };

  const readTextFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  };

  const extractPdfText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target.result;
          const arr = new Uint8Array(buffer);
          let binary = '';
          const chunkSize = 65536; // process in chunks to prevent stack overflow
          for (let i = 0; i < arr.length; i += chunkSize) {
            const sub = arr.subarray(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, sub);
          }

          // Extract text inside PDF parentheses
          const matches = [];
          const regex = /\(([^)]+)\)\s*(?:Tj|TJ)/g;
          let match;
          while ((match = regex.exec(binary)) !== null) {
            matches.push(match[1]);
          }

          if (matches.length > 0) {
            const cleanText = matches
              .map(m => m.replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
                         .replace(/\\(.)/g, '$1'))
              .join(' ');
            resolve(cleanText);
          } else {
            // Heuristic extraction for readable ascii sequences
            const asciiRegex = /[\x20-\x7E\s]{4,}/g;
            const strings = binary.match(asciiRegex) || [];
            const filtered = strings.filter(str => {
              const s = str.trim();
              if (s.startsWith('%PDF') || s.includes('obj') || s.includes('endobj') || s.includes('stream')) return false;
              return s.length > 8 && /[a-zA-Z]/.test(s);
            });
            resolve(filtered.join('\n'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        await processFile(file);
      }
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      for (const file of files) {
        await processFile(file);
      }
    }
  };

  const handleAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleClearAll = () => {
    clearCase();
    setIngestedFiles([]);
    showStatus('Workspace reset successfully');
  };

  return (
    <div className="p-3">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".txt,.log,.csv,.json,.xml,.pdf"
        className="hidden"
      />

      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-noctis-accent" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-noctis-text-muted">PASTE INTELLIGENCE DATA</span>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 border-r border-noctis-border bg-[#050505] flex flex-col items-center py-2 text-[10px] text-[#333] font-mono select-none pointer-events-none rounded-l-md overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <textarea
          className="noctis-textarea mb-2 pl-10"
          style={{ minHeight: '180px', fontSize: '0.68rem', backgroundColor: '#000000' }}
          placeholder="Paste intelligence reports, logs, metadata, cyber alerts, phone records, emails, OSINT, locations, devices, relationships, raw data or any information..."
          value={rawIntelligence}
          onChange={(e) => setRawIntelligence(e.target.value)}
        />
      </div>

      {/* File Ingestion Notification Banner */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-2 rounded border mb-2 text-[9px] font-mono flex items-center gap-2 ${
              statusMsg.type === 'error'
                ? 'bg-noctis-danger/10 border-noctis-danger/30 text-noctis-danger'
                : 'bg-noctis-success/10 border-noctis-success/30 text-noctis-success'
            }`}
          >
            {statusMsg.type === 'error' ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
            <span className="flex-1">{statusMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-1.5 mb-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runAnalysis}
          disabled={analysisRunning || !rawIntelligence.trim()}
          className="btn-primary flex-1 text-[10px] uppercase tracking-wider disabled:opacity-40"
        >
          {analysisRunning ? (
            <span className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 border border-noctis-accent border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : 'INGEST & ANALYZE'}
        </motion.button>
        <button onClick={handleClearAll} className="btn-ghost text-[10px] uppercase tracking-wider px-2 border border-noctis-border hover:bg-noctis-surface">CLEAR ALL</button>
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={loadSampleCase}
        className="w-full text-[10px] uppercase tracking-wider py-1.5 px-3 rounded border border-noctis-cyan/30 bg-transparent text-noctis-cyan hover:bg-noctis-cyan/10 transition-colors mb-3 font-medium"
        style={{ color: '#00bcd4', borderColor: 'rgba(0, 188, 212, 0.3)' }}
      >
        ◈ LOAD SAMPLE CASE
      </motion.button>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleAreaClick}
        className={`border border-dashed rounded-md p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors mb-3 group ${
          isDragging
            ? 'border-noctis-cyan bg-noctis-cyan/5'
            : 'border-noctis-border hover:border-[#444] hover:bg-[#111]'
        }`}
      >
        <Upload
          size={18}
          className={`mb-2 transition-transform duration-200 ${
            isDragging ? 'text-noctis-cyan scale-110' : 'text-noctis-text-muted group-hover:text-noctis-text'
          }`}
        />
        <span className="text-[10px] font-medium text-noctis-text-muted group-hover:text-noctis-text mb-1 select-none">
          {isDragging ? 'Release to Ingest Files' : 'Drag & Drop Files Here or Click to Browse'}
        </span>
        <span className="text-[8px] text-[#555] select-none">
          Supports: .txt, .log, .csv, .json, .xml, .pdf
        </span>
      </div>

      {/* Ingested Files List */}
      {ingestedFiles.length > 0 && (
        <div className="mb-3 border border-noctis-border rounded-md p-2 bg-[#050505]">
          <div className="text-[8px] uppercase tracking-widest text-[#555] font-semibold mb-1.5 flex justify-between items-center">
            <span>INGESTED SOURCES ({ingestedFiles.length})</span>
            <button
              onClick={() => setIngestedFiles([])}
              className="text-[#f85149] hover:underline flex items-center gap-0.5 text-[8px]"
            >
              <Trash2 size={8} /> Clear List
            </button>
          </div>
          <div className="space-y-1 max-h-[100px] overflow-y-auto">
            {ingestedFiles.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between text-[9px] font-mono text-noctis-text bg-[#0a0a0a] border border-noctis-border/50 rounded px-1.5 py-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  <FileText size={10} className="text-[#6b7280]" />
                  <span className="truncate text-[#d1d5db]" title={f.name}>{f.name}</span>
                </div>
                <span className="text-[8px] text-[#555] ml-2 flex-shrink-0">
                  {f.type} ({formatSize(f.size)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div>
          <label className="text-[9px] uppercase tracking-widest text-noctis-text-muted mb-1 block">Case Type</label>
          <select className="noctis-select text-xs" value={caseType} onChange={(e) => setCaseType(e.target.value)}>
            {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-widest text-noctis-text-muted mb-1 block">Case Name</label>
          <input
            className="noctis-input text-xs"
            placeholder="Enter case name..."
            value={caseName}
            onChange={(e) => setCaseName(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
