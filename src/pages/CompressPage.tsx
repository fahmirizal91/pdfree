// src/pages/CompressPage.tsx
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { FileDown, Download, Loader2, Zap, CheckCircle2, FileText, RefreshCw } from 'lucide-react';

// Setup Worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface CompressionOption {
  id: 'extreme' | 'recommended' | 'less';
  title: string;
  desc: string;
  quality: number;
}

const COMPRESSION_LEVELS: CompressionOption[] = [
  { id: 'extreme', title: 'Kompresi Ekstrem', desc: 'Kualitas lebih rendah, ukuran file paling kecil', quality: 0.1 },
  { id: 'recommended', title: 'Kompresi Disarankan', desc: 'Keseimbangan terbaik antara kualitas & ukuran', quality: 0.4 },
  { id: 'less', title: 'Kompresi Ringan', desc: 'Kualitas tinggi, ukuran file sedikit berkurang', quality: 0.7 },
];

export default function CompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(COMPRESSION_LEVELS[1]);
  const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setResult(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    onDrop
  });

  const handleCompress = async () => {
    if (!file || processing) return;
    setProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const outPdf = await PDFDocument.create();

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        const imgDataUri = canvas.toDataURL('image/jpeg', selectedLevel.quality);
        const imgBytes = await fetch(imgDataUri).then(res => res.arrayBuffer());

        const img = await outPdf.embedJpg(imgBytes);
        const newPage = outPdf.addPage([img.width, img.height]);
        newPage.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }

      const pdfBytes = await outPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      setResult({ blob, size: blob.size });
    } catch (e) {
      console.error(e);
      alert("Gagal mengompres PDF");
    } finally {
      setProcessing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">

      {/* HEADER */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex justify-center items-center gap-3">
          <FileDown className="text-blue-500" size={40} />
          Kompres PDF
        </h1>
        <p className="text-gray-600">
          Kecilkan ukuran file PDF dengan mudah dengan tetap menjaga kualitas terbaik.
        </p>
      </div>

      {!file ? (
        /* DROPZONE AREA - Styled like Merge & Split */
        <div
          {...getRootProps()}
          className={`
            border-4 border-dashed p-20 text-center rounded-3xl cursor-pointer
            transition-all duration-300
            ${isDragActive
              ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg'
              : 'border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-xl font-medium text-gray-700">
              Tarik & Lepaskan file PDF di sini
            </p>
            <p className="text-sm text-gray-400">
              atau klik untuk memilih file dari komputer Anda
            </p>
          </div>
        </div>
      ) : (
        /* ACTIVE FILE SETTINGS AREA */
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100">
            
            {/* FILE INFO */}
            <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl flex-shrink-0">
                  <FileText size={24} />
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-gray-800 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Ukuran Asli: <span className="font-semibold">{formatSize(file.size)}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                title="Ganti File"
              >
                <RefreshCw size={20} />
              </button>
            </div>

            {/* OPTIONS - Styled like SplitPage selected mode */}
            {!result && (
              <>
                <h2 className="font-bold text-xl mb-4 text-gray-800">Tingkat Kompresi</h2>
                <div className="space-y-3 mb-8">
                  {COMPRESSION_LEVELS.map((level) => {
                    const active = selectedLevel.id === level.id;
                    return (
                      <button
                        key={level.id}
                        onClick={() => setSelectedLevel(level)}
                        className={`
                          w-full p-4 rounded-xl border-2 text-left transition-all
                          ${active
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-100 bg-white hover:border-blue-200'
                          }
                        `}
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-gray-800">
                            {level.title}
                          </p>
                          {active && (
                            <CheckCircle2 className="text-blue-500" size={20} />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {level.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* ACTION BUTTON */}
                <button
                  onClick={handleCompress}
                  disabled={processing}
                  className="w-full bg-blue-600 text-white text-lg font-bold py-4 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  {processing ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                  {processing ? "Memproses PDF..." : "KOMPRES PDF"}
                </button>
              </>
            )}

            {/* RESULT AREA */}
            {result && (
              <div className="mt-4 bg-green-50 border-2 border-green-200 p-6 rounded-2xl text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-green-800 font-bold text-2xl mb-2">Kompresi Selesai!</h3>
                
                <div className="flex justify-center items-center gap-6 my-6 text-green-700 bg-white p-4 rounded-xl border border-green-100">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Ukuran Asli</p>
                    <p className="font-bold text-lg line-through opacity-70">{formatSize(file.size)}</p>
                  </div>
                  <div className="w-px h-10 bg-green-200"></div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Ukuran Baru</p>
                    <p className="font-bold text-2xl text-green-600">{formatSize(result.size)}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="inline-block bg-green-200 text-green-800 text-sm font-bold px-3 py-1 rounded-full">
                    Anda hemat {Math.round((1 - result.size / file.size) * 100)}%
                  </span>
                </div>

                <button
                  onClick={() => {
                    const url = URL.createObjectURL(result.blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `compressed_${file.name}`;
                    a.click();
                  }}
                  className="w-full bg-green-600 text-white text-lg font-bold py-4 rounded-xl hover:bg-green-700 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                >
                  <Download size={24} />
                  UNDUH PDF ({formatSize(result.size)})
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}