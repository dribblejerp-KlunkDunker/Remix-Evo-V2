import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  FileCode,
  File,
  X,
  CheckCircle2,
  Trash2,
  Download,
  Eye,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
  Plus,
  AlertCircle,
  Dna,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { AgentSkill, SkillAttachedFile } from '../../types/skills';

interface SkillFileDropzoneProps {
  skills: AgentSkill[];
  selectedSkillId?: string;
  onSelectSkill?: (skillId: string) => void;
  onAttachFilesToSkill: (skillId: string, files: SkillAttachedFile[]) => void;
  onRemoveFileFromSkill: (skillId: string, fileId: string) => void;
  onCreateSkillFromFiles?: (files: SkillAttachedFile[], skillName: string) => void;
  onApplyRulesToSkill?: (skillId: string, extractedRules: string[]) => void;
  onInspectSkill?: (skill: AgentSkill) => void;
  isEmbedded?: boolean; // True when rendered inside SkillDetailsModal
}

export const SkillFileDropzone: React.FC<SkillFileDropzoneProps> = ({
  skills,
  selectedSkillId,
  onSelectSkill,
  onAttachFilesToSkill,
  onRemoveFileFromSkill,
  onCreateSkillFromFiles,
  onApplyRulesToSkill,
  onInspectSkill,
  isEmbedded = false
}) => {
  const [activeSkillId, setActiveSkillId] = useState<string>(
    selectedSkillId || (skills.length > 0 ? skills[0].id : '')
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<SkillAttachedFile | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'txt' | 'md' | 'pdf'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with prop when selectedSkillId changes
  React.useEffect(() => {
    if (selectedSkillId) {
      setActiveSkillId(selectedSkillId);
    }
  }, [selectedSkillId]);

  const targetSkill = skills.find((s) => s.id === activeSkillId) || skills[0];

  // Helper to extract text from PDF arrayBuffer
  const extractPdfText = (buffer: ArrayBuffer): string => {
    try {
      const bytes = new Uint8Array(buffer);
      let text = '';
      const len = Math.min(bytes.length, 50000); // Sample first 50KB for text streams
      for (let i = 0; i < len; i++) {
        const char = bytes[i];
        if (char >= 32 && char <= 126) {
          text += String.fromCharCode(char);
        } else if (char === 10 || char === 13) {
          text += '\n';
        }
      }
      // Match PDF text stream objects: BT ... ET
      const matches = text.match(/BT[\s\S]*?ET/g);
      if (matches && matches.length > 0) {
        return matches
          .map((m) => m.replace(/BT|ET|\/F\d+|\d+\s+Tf|\d+\s+Td/g, '').replace(/[\\(\\)]/g, ' ').trim())
          .filter(Boolean)
          .join('\n');
      }
      return text.slice(0, 5000);
    } catch {
      return 'PDF Document attached (binary format).';
    }
  };

  // Helper to parse rules and directives from markdown or text
  const extractParsedData = (name: string, content: string, type: 'txt' | 'md' | 'pdf') => {
    const lines = content.split('\n');
    const extractedRules: string[] = [];
    const extractedDirectives: string[] = [];
    let extractedTitle = name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    let extractedDescription = '';

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Extract title from first markdown header
      if ((trimmed.startsWith('# ') || trimmed.startsWith('## ')) && extractedTitle === name) {
        extractedTitle = trimmed.replace(/^#+\s*/, '');
      }

      // Extract rules (lines starting with RULE, Rule, - [Rule], or numbered rules)
      if (
        /^(RULE\s*\d*|Rule\s*\d*|\d+\.\s*Rule|\*\s*Rule|Invariant)/i.test(trimmed) ||
        (trimmed.startsWith('- ') && /must|never|require|verify|always/i.test(trimmed))
      ) {
        extractedRules.push(trimmed.replace(/^[-*]\s*/, ''));
      }

      // Extract directives
      if (/directive|constraint|framework|role:/i.test(trimmed)) {
        extractedDirectives.push(trimmed.replace(/^[-*]\s*/, ''));
      }

      if (!extractedDescription && trimmed.length > 30 && !trimmed.startsWith('#')) {
        extractedDescription = trimmed;
      }
    });

    return {
      extractedTitle,
      extractedDescription: extractedDescription || `Knowledge specifications imported from ${name}`,
      extractedRules: extractedRules.slice(0, 10),
      extractedDirectives: extractedDirectives.slice(0, 5),
      charCount: content.length,
      pdfPageCount: type === 'pdf' ? Math.max(1, Math.round(content.length / 2500)) : undefined
    };
  };

  // Process dropped or selected files
  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (!targetSkill) {
        setStatusMessage('Error: No target skill selected.');
        return;
      }

      setIsProcessing(true);
      setStatusMessage(`Processing ${fileList.length} file(s)...`);

      const attachedResults: SkillAttachedFile[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const lowerName = file.name.toLowerCase();
        let fileType: 'txt' | 'md' | 'pdf' | null = null;

        if (lowerName.endsWith('.txt')) fileType = 'txt';
        else if (lowerName.endsWith('.md')) fileType = 'md';
        else if (lowerName.endsWith('.pdf')) fileType = 'pdf';

        if (!fileType) {
          continue; // Ignore non-supported files
        }

        try {
          let fullContent = '';
          let blobUrl: string | undefined = undefined;

          if (fileType === 'pdf') {
            blobUrl = URL.createObjectURL(file);
            const arrayBuffer = await file.arrayBuffer();
            fullContent = extractPdfText(arrayBuffer);
          } else {
            fullContent = await file.text();
          }

          const parsedData = extractParsedData(file.name, fullContent, fileType);

          const attached: SkillAttachedFile = {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            name: file.name,
            type: fileType,
            sizeBytes: file.size,
            uploadedAt: new Date().toISOString(),
            contentPreview: fullContent.slice(0, 800),
            fullContent,
            blobUrl,
            parsedData
          };

          attachedResults.push(attached);
        } catch (err) {
          console.error(`Failed to process file ${file.name}:`, err);
        }
      }

      if (attachedResults.length > 0) {
        onAttachFilesToSkill(targetSkill.id, attachedResults);
        setStatusMessage(
          `Successfully attached ${attachedResults.length} file(s) to "${targetSkill.name}"!`
        );
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage('No valid .txt, .md, or .pdf files found.');
        setTimeout(() => setStatusMessage(null), 4000);
      }

      setIsProcessing(false);
    },
    [targetSkill, onAttachFilesToSkill]
  );

  // Drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Seed sample files for instant test drive
  const handleLoadSampleFiles = () => {
    if (!targetSkill) return;

    const sampleFiles: SkillAttachedFile[] = [
      {
        id: `sample-md-${Date.now()}`,
        name: 'SEC_Staff_Accounting_Bulletin_104_Forensics.md',
        type: 'md',
        sizeBytes: 14250,
        uploadedAt: new Date().toISOString(),
        contentPreview: `# SEC SAB 104 Revenue Recognition & Forensic Auditing Spec
## Autonomous Agent Invariant Rules
- RULE 1: Delivery has occurred or services have been rendered prior to recognizing upfront milestones.
- RULE 2: Fixed or determinable seller pricing must be independently reconciled against signed addenda.
- RULE 3: Collectibility must be reasonably assured; flag any aging receivable beyond 90 days.
- RULE 4: Reject bill-and-hold agreements lacking explicit written buyer-side custodial justification.
`,
        fullContent: `# SEC SAB 104 Revenue Recognition & Forensic Auditing Spec

## 1. Domain Invariant Rules
- RULE 1: Delivery has occurred or services have been rendered prior to recognizing upfront milestones.
- RULE 2: Fixed or determinable seller pricing must be independently reconciled against signed addenda.
- RULE 3: Collectibility must be reasonably assured; flag any aging receivable beyond 90 days.
- RULE 4: Reject bill-and-hold agreements lacking explicit written buyer-side custodial justification.

## 2. Adversarial Testbench Parameters
Agents must evaluate vendor financing kickbacks, gross vs net reporting under ASC 606, and deferred revenue haircuts during asset divestitures.`,
        parsedData: {
          extractedTitle: 'SEC SAB 104 Revenue Recognition & Forensic Auditing Spec',
          extractedDescription: 'Autonomous Forensic Agent Invariant Rules & Testbench Parameters',
          extractedRules: [
            'RULE 1: Delivery has occurred or services have been rendered prior to recognizing upfront milestones.',
            'RULE 2: Fixed or determinable seller pricing must be independently reconciled against signed addenda.',
            'RULE 3: Collectibility must be reasonably assured; flag any aging receivable beyond 90 days.',
            'RULE 4: Reject bill-and-hold agreements lacking explicit written buyer-side custodial justification.'
          ],
          charCount: 14250
        }
      },
      {
        id: `sample-txt-${Date.now()}`,
        name: 'Jump_Diffusion_Calibration_Constraints.txt',
        type: 'txt',
        sizeBytes: 8640,
        uploadedAt: new Date().toISOString(),
        contentPreview: `Merton Jump Diffusion Model Constraints (Stochastic Calculus):
RULE 1: Jump intensity lambda must be bounded between 0.05 and 1.85 events/annum.
RULE 2: Non-Gaussian log jump variance delta^2 must enforce strict positive definiteness.
RULE 3: Hedging delta cross-gamma must never exceed 3.5x collateral headroom.
RULE 4: Enforce zero arbitrage across deep out-of-the-money put spreads.`,
        fullContent: `Merton Jump Diffusion Model Constraints (Stochastic Calculus):
RULE 1: Jump intensity lambda must be bounded between 0.05 and 1.85 events/annum.
RULE 2: Non-Gaussian log jump variance delta^2 must enforce strict positive definiteness.
RULE 3: Hedging delta cross-gamma must never exceed 3.5x collateral headroom.
RULE 4: Enforce zero arbitrage across deep out-of-the-money put spreads.

System Directive:
Cross-verify smile curvature against historical implied volatility surfaces during sudden liquidity contraction regimes.`,
        parsedData: {
          extractedTitle: 'Merton Jump Diffusion Model Constraints',
          extractedDescription: 'Stochastic Calculus & Non-Gaussian Jump Parameters',
          extractedRules: [
            'RULE 1: Jump intensity lambda must be bounded between 0.05 and 1.85 events/annum.',
            'RULE 2: Non-Gaussian log jump variance delta^2 must enforce strict positive definiteness.',
            'RULE 3: Hedging delta cross-gamma must never exceed 3.5x collateral headroom.',
            'RULE 4: Enforce zero arbitrage across deep out-of-the-money put spreads.'
          ],
          charCount: 8640
        }
      },
      {
        id: `sample-pdf-${Date.now()}`,
        name: 'Basel_III_Liquidity_Coverage_Ratio_Handbook.pdf',
        type: 'pdf',
        sizeBytes: 124500,
        uploadedAt: new Date().toISOString(),
        contentPreview: `BASEL COMMITTEE ON BANKING SUPERVISION
INTERNATIONAL REGULATORY FRAMEWORK FOR LIQUIDITY RISK
RULE 1: High Quality Liquid Assets (HQLA) must cover 100% of 30-day net stressed cash outflows.
RULE 2: Level 2B assets cannot exceed 15% of total liquidity buffer.
RULE 3: Operational deposit run-off assumptions must account for wholesale uninsured flight risk.`,
        fullContent: `BASEL COMMITTEE ON BANKING SUPERVISION
INTERNATIONAL REGULATORY FRAMEWORK FOR LIQUIDITY RISK

Section 3. Liquidity Coverage Ratio (LCR) Mandates:
RULE 1: High Quality Liquid Assets (HQLA) must cover 100% of 30-day net stressed cash outflows.
RULE 2: Level 2B assets cannot exceed 15% of total liquidity buffer.
RULE 3: Operational deposit run-off assumptions must account for wholesale uninsured flight risk.
RULE 4: Uncommitted credit facilities to financial institutions must assume 100% drawdown under systemic crisis.`,
        parsedData: {
          extractedTitle: 'Basel III Liquidity Coverage Ratio Handbook',
          extractedDescription: 'International Regulatory Framework for Liquidity Risk & Capital Ratios',
          extractedRules: [
            'RULE 1: High Quality Liquid Assets (HQLA) must cover 100% of 30-day net stressed cash outflows.',
            'RULE 2: Level 2B assets cannot exceed 15% of total liquidity buffer.',
            'RULE 3: Operational deposit run-off assumptions must account for wholesale uninsured flight risk.',
            'RULE 4: Uncommitted credit facilities to financial institutions must assume 100% drawdown under systemic crisis.'
          ],
          pdfPageCount: 18,
          charCount: 124500
        }
      }
    ];

    onAttachFilesToSkill(targetSkill.id, sampleFiles);
    setStatusMessage(`Loaded 3 sample skill files (.md, .txt, .pdf) into "${targetSkill.name}"!`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const attachedFiles = targetSkill?.attachedFiles || [];

  const filteredFiles = attachedFiles.filter((f) => {
    if (filterType === 'all') return true;
    return f.type === filterType;
  });

  return (
    <div className={`space-y-6 ${isEmbedded ? '' : 'p-6 bg-stone-950/60 border border-stone-800'}`}>
      {/* Header & Target Skill Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <span className="text-amber-400 font-bold uppercase tracking-wider">
              Skill Knowledge Vault & Ingestion
            </span>
            <span>·</span>
            <span>.txt, .md, .pdf Document Dropzone</span>
          </div>
          <h3 className="text-lg font-serif font-bold text-white mt-0.5">
            Skill Source Documents & Attached Specifications
          </h3>
          <p className="text-xs text-stone-400 font-sans mt-0.5 max-w-2xl leading-relaxed">
            Drop in markdown instructions, domain guideline text files, and reference PDF papers. All attached files are parsed and tied directly to this agent skill for test validation and reasoning matrix extraction.
          </p>
        </div>

        {/* Skill Selector */}
        {!isEmbedded && (
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-mono text-stone-400">Target Skill:</label>
            <div className="relative">
              <select
                value={activeSkillId}
                onChange={(e) => {
                  setActiveSkillId(e.target.value);
                  if (onSelectSkill) onSelectSkill(e.target.value);
                }}
                className="bg-stone-900 border border-stone-700 text-xs font-mono text-amber-300 px-3 py-2 pr-8 focus:outline-none focus:border-amber-500 cursor-pointer appearance-none"
              >
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.stage.toUpperCase()})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed p-8 text-center transition-all cursor-pointer relative overflow-hidden ${
          isDragging
            ? 'border-amber-400 bg-amber-950/30 ring-4 ring-amber-500/20'
            : 'border-stone-700 hover:border-amber-500/80 bg-stone-900/40 hover:bg-stone-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFiles(e.target.files);
            }
          }}
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto bg-stone-900 border border-stone-700 flex items-center justify-center text-amber-400 shadow-inner">
            <Upload className={`w-7 h-7 ${isDragging ? 'animate-bounce text-amber-300' : ''}`} />
          </div>

          <div>
            <h4 className="text-sm font-serif font-bold text-white">
              Drop .txt, .MD, and PDF files here for{' '}
              <strong className="text-amber-400 font-mono">
                {targetSkill?.name || 'Selected Skill'}
              </strong>
            </h4>
            <p className="text-xs text-stone-400 mt-1 font-sans">
              or click to browse from your device. Ingests all reference files, strict rules, and domain papers.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2 text-[11px] font-mono text-stone-500">
            <span className="flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span>.MD (Markdown Docs)</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>.TXT (Directives & Code)</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <File className="w-3.5 h-3.5 text-rose-400" />
              <span>.PDF (Research Papers)</span>
            </span>
          </div>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-mono text-amber-300">
            <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Parsing file contents and extracting rule directives...</span>
          </div>
        )}
      </div>

      {/* Action Strip: Status & Sample Seed Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          {statusMessage ? (
            <span className="px-3 py-1 bg-amber-950/80 border border-amber-500/70 text-amber-300 animate-in fade-in">
              {statusMessage}
            </span>
          ) : (
            <span className="text-stone-500">
              Attached to this skill:{' '}
              <strong className="text-stone-300">{attachedFiles.length} files</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSampleFiles}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 transition-colors cursor-pointer"
            title="Load sample .md, .txt, and .pdf files to test immediately"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Sample Skill Files (.md, .txt, .pdf)</span>
          </button>
        </div>
      </div>

      {/* Attached Files List & Vault */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs font-mono">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 border transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-stone-800 text-white border-stone-600 font-bold'
                  : 'text-stone-400 border-transparent hover:text-stone-200'
              }`}
            >
              All Files ({attachedFiles.length})
            </button>
            <button
              onClick={() => setFilterType('md')}
              className={`px-3 py-1 border transition-all cursor-pointer ${
                filterType === 'md'
                  ? 'bg-stone-800 text-purple-300 border-stone-600 font-bold'
                  : 'text-stone-400 border-transparent hover:text-stone-200'
              }`}
            >
              .MD Markdown ({attachedFiles.filter((f) => f.type === 'md').length})
            </button>
            <button
              onClick={() => setFilterType('txt')}
              className={`px-3 py-1 border transition-all cursor-pointer ${
                filterType === 'txt'
                  ? 'bg-stone-800 text-blue-300 border-stone-600 font-bold'
                  : 'text-stone-400 border-transparent hover:text-stone-200'
              }`}
            >
              .TXT Plaintext ({attachedFiles.filter((f) => f.type === 'txt').length})
            </button>
            <button
              onClick={() => setFilterType('pdf')}
              className={`px-3 py-1 border transition-all cursor-pointer ${
                filterType === 'pdf'
                  ? 'bg-stone-800 text-rose-300 border-stone-600 font-bold'
                  : 'text-stone-400 border-transparent hover:text-stone-200'
              }`}
            >
              .PDF Documents ({attachedFiles.filter((f) => f.type === 'pdf').length})
            </button>
          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="p-8 text-center bg-stone-900/30 border border-stone-800 text-stone-500 font-mono text-xs">
            No {filterType !== 'all' ? `.${filterType.toUpperCase()}` : ''} files attached to{' '}
            <strong className="text-stone-400">{targetSkill?.name}</strong> yet. Drop files above or click &quot;Load Sample Skill Files&quot; to test.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredFiles.map((file) => {
              const extColor =
                file.type === 'md'
                  ? 'text-purple-400 border-purple-500/40 bg-purple-950/30'
                  : file.type === 'txt'
                  ? 'text-blue-400 border-blue-500/40 bg-blue-950/30'
                  : 'text-rose-400 border-rose-500/40 bg-rose-950/30';

              const FileIcon =
                file.type === 'md' ? FileCode : file.type === 'txt' ? FileText : File;

              const rulesCount = file.parsedData?.extractedRules?.length || 0;

              return (
                <div
                  key={file.id}
                  className="bg-stone-950/70 border border-stone-800 p-3.5 hover:border-stone-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 border flex items-center justify-center shrink-0 ${extColor}`}
                    >
                      <FileIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap font-mono">
                        <span className="font-bold text-white truncate max-w-sm">
                          {file.name}
                        </span>
                        <span className={`text-[10px] uppercase px-1.5 py-0.2 border ${extColor}`}>
                          .{file.type}
                        </span>
                        <span className="text-stone-500 text-[11px]">
                          {(file.sizeBytes / 1024).toFixed(1)} KB
                        </span>
                        {file.parsedData?.pdfPageCount && (
                          <span className="text-stone-500 text-[11px]">
                            ~{file.parsedData.pdfPageCount} pages
                          </span>
                        )}
                      </div>

                      {file.parsedData?.extractedDescription && (
                        <p className="text-stone-400 text-xs font-sans mt-0.5 truncate">
                          {file.parsedData.extractedDescription}
                        </p>
                      )}

                      {rulesCount > 0 && (
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{rulesCount} Invariant Rules Parsed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Apply Rules to Skill button if rules were extracted */}
                    {rulesCount > 0 && onApplyRulesToSkill && (
                      <button
                        onClick={() => {
                          if (file.parsedData?.extractedRules) {
                            onApplyRulesToSkill(
                              targetSkill.id,
                              file.parsedData.extractedRules
                            );
                            setStatusMessage(
                              `Injected ${rulesCount} rules from ${file.name} into ${targetSkill.name}!`
                            );
                            setTimeout(() => setStatusMessage(null), 3500);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-[11px] font-mono transition-colors flex items-center gap-1 cursor-pointer"
                        title="Inject extracted rules into this agent's strictRules genome"
                      >
                        <Dna className="w-3 h-3" />
                        <span>Inject Rules ({rulesCount})</span>
                      </button>
                    )}

                    {/* View Preview Button */}
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-[11px] font-mono transition-colors flex items-center gap-1 cursor-pointer"
                      title="Preview file contents"
                    >
                      <Eye className="w-3 h-3 text-amber-400" />
                      <span>Preview</span>
                    </button>

                    {/* Download Button */}
                    <button
                      onClick={() => {
                        const blob =
                          file.fullContent
                            ? new Blob([file.fullContent], {
                                type:
                                  file.type === 'pdf'
                                    ? 'application/pdf'
                                    : 'text/plain;charset=utf-8'
                              })
                            : new Blob([''], { type: 'text/plain' });
                        const url = file.blobUrl || URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = file.name;
                        a.click();
                      }}
                      className="p-1.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors cursor-pointer"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete File Button */}
                    <button
                      onClick={() => onRemoveFileFromSkill(targetSkill.id, file.id)}
                      className="p-1.5 bg-stone-900 hover:bg-rose-950 text-stone-500 hover:text-rose-300 border border-stone-800 hover:border-rose-700 transition-colors cursor-pointer"
                      title="Remove file from skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="File Preview"
          className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        >
          <div className="bg-stone-900 border border-stone-700 shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden text-stone-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-sm font-serif font-bold text-white truncate">
                    {previewFile.name}
                  </h4>
                  <div className="text-[11px] font-mono text-stone-400">
                    Format: <strong className="text-amber-400 uppercase">.{previewFile.type}</strong> · Size: {(previewFile.sizeBytes / 1024).toFixed(1)} KB · Attached to: {targetSkill?.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewFile.parsedData?.extractedRules &&
                  previewFile.parsedData.extractedRules.length > 0 &&
                  onApplyRulesToSkill && (
                    <button
                      onClick={() => {
                        if (previewFile.parsedData?.extractedRules) {
                          onApplyRulesToSkill(
                            targetSkill.id,
                            previewFile.parsedData.extractedRules
                          );
                          setStatusMessage(
                            `Injected rules from ${previewFile.name} into ${targetSkill.name}!`
                          );
                          setPreviewFile(null);
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-mono font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Dna className="w-3.5 h-3.5 fill-current" />
                      <span>Inject {previewFile.parsedData.extractedRules.length} Rules</span>
                    </button>
                  )}

                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs leading-relaxed space-y-4">
              {/* Extracted Rules Summary if present */}
              {previewFile.parsedData?.extractedRules &&
                previewFile.parsedData.extractedRules.length > 0 && (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Parsed Agent Rules & Invariants ({previewFile.parsedData.extractedRules.length})</span>
                    </span>
                    <ul className="space-y-1 text-emerald-200">
                      {previewFile.parsedData.extractedRules.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">›</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* PDF Document Preview or Raw Text */}
              {previewFile.type === 'pdf' && previewFile.blobUrl ? (
                <div className="space-y-3">
                  <div className="p-3 bg-stone-950 border border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
                    <span>PDF Document View (Interactive Embedded Frame):</span>
                    <a
                      href={previewFile.blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <span>Open in New Tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <iframe
                    src={previewFile.blobUrl}
                    className="w-full h-96 border border-stone-800 bg-stone-950"
                    title={previewFile.name}
                  />
                  <div className="text-[11px] text-stone-400">
                    <span className="font-bold text-stone-300">Extracted Text Streams:</span>
                    <pre className="p-3 bg-stone-950 border border-stone-800 text-stone-300 whitespace-pre-wrap font-mono mt-1 max-h-48 overflow-y-auto">
                      {previewFile.fullContent || 'No extracted text stream.'}
                    </pre>
                  </div>
                </div>
              ) : (
                <pre className="p-4 bg-stone-950 border border-stone-800 text-stone-300 whitespace-pre-wrap font-mono overflow-x-auto selection:bg-amber-500/30">
                  {previewFile.fullContent || previewFile.contentPreview || 'Empty file.'}
                </pre>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-end">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
