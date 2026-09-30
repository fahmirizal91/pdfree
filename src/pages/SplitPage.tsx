// src/pages/SplitPage.tsx
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip'; // Tambahkan import jszip
import { Scissors, Download, Loader2, Trash2, Undo2, GripVertical, FileWarning } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import PdfPagePreview from '@/components/PdfPagePreview';

interface PageItem {
  id: string;
  originalIndex: number;
  isExcluded: boolean;
}

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<'all' | 'selected'>('selected'); 

  const onDrop = async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setLoading(true);
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const count = pdf.getPageCount();
      
      const pageList: PageItem[] = Array.from({ length: count }, (_, i) => ({
        id: `page-id-${i}`,
        originalIndex: i,
        isExcluded: false
      }));
      setPages(pageList);
    } catch (error) {
      console.error(error);
      alert("Gagal membaca file PDF.");
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    onDrop
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const newPages = Array.from(pages);
    const [reorderedItem] = newPages.splice(result.source.index, 1);
    newPages.splice(result.destination.index, 0, reorderedItem);

    setPages(newPages);
  };

  const toggleExcludePage = (index: number) => {
    setPages(prev => prev.map((item, i) => i === index ? {...item, isExcluded: !item.isExcluded} : item));
  };

  const includedPageCount = pages.filter(p => !p.isExcluded).length;

  const handleProcess = async () => {
    if (!file || processing) return;

    if (mode === 'selected' && includedPageCount === 0) {
      alert("Silakan pilih minimal satu halaman untuk diproses.");
      return;
    }

    setProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      
      if (mode === 'all') {
        // PERBAIKAN: Gunakan JSZip untuk mode Split All
        const zip = new JSZip();
        
        for (let i = 0; i < sourcePdf.getPageCount(); i++) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
          newPdf.addPage(copiedPage);
          const pdfBytes = await newPdf.save();
          
          // Masukkan file PDF tunggal ke dalam ZIP
          zip.file(`page_${i + 1}_${file.name}`, pdfBytes);
        }

        // Generate dan Download file ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `split_all_${file.name.replace('.pdf', '')}.zip`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 100);

      } else {
        // Mode 'selected' tetap menggabungkan halaman ke dalam 1 PDF baru
        const newPdf = await PDFDocument.create();
        const indicesToKeep = pages
          .filter(p => !p.isExcluded)
          .map(p => p.originalIndex);

        if (indicesToKeep.length > 0) {
          const copiedPages = await newPdf.copyPages(sourcePdf, indicesToKeep);
          copiedPages.forEach(p => newPdf.addPage(p));
          
          const pdfBytes = await newPdf.save();
          downloadFile(pdfBytes, `processed_${file.name}`);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat memproses PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadFile = (bytes: Uint8Array, fileName: string) => {
    const blob = new Blob([bytes as any], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex justify-center items-center gap-3">
          <Scissors className="text-orange-500" size={40} /> Pisahkan & Atur PDF
        </h1>
        <p className="text-gray-600">Geser halaman untuk mengurutkan, klik hapus untuk mengecualikan halaman.</p>
      </div>

      {!file ? (
        <div {...getRootProps()} className={`border-4 border-dashed border-orange-200 bg-white p-20 text-center rounded-3xl cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <input {...getInputProps()} />
          {loading ? (
            <div className='flex flex-col items-center gap-4'>
              <Loader2 className="animate-spin text-orange-500" size={48}/>
              <p className="text-xl font-medium text-gray-700">Menganalisa PDF...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4">
               <p className="text-xl font-medium text-gray-700">Tarik & Lepas file PDF di sini</p>
               <p className="text-sm text-gray-400">Atau klik untuk memilih file</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-8">
          {/* Panel Kontrol */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit sticky top-24">
              <h2 className="font-bold text-xl mb-4">Opsi Split</h2>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setMode('selected')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${mode === 'selected' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}
                >
                  <p className="font-bold">Urutkan & Ekstrak</p>
                  <p className="text-xs text-gray-500 mt-1">Halaman tersisa ({includedPageCount}) akan digabungkan menjadi satu PDF baru sesuai urutan.</p>
                </button>

                <button 
                  onClick={() => setMode('all')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${mode === 'all' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}
                >
                  <p className="font-bold">Pisahkan Semua</p>
                  <p className="text-xs text-gray-500 mt-1">Semua halaman akan dipisah dan diunduh dalam bentuk file ZIP.</p>
                </button>
              </div>

              <div className="flex gap-2 mt-6 p-3 bg-gray-50 rounded-lg text-sm border shadow-inner">
                <GripVertical className='text-gray-300 flex-shrink-0'/>
                <p className='text-gray-500'>Tips: Seret dan lepaskan kartu halaman di sebelah kanan untuk mengatur urutan.</p>
              </div>

              <button
                onClick={handleProcess}
                disabled={processing}
                className="w-full mt-6 bg-orange-500 text-white font-bold py-4 rounded-xl hover:bg-orange-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {processing ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                {processing ? "MEMPROSES..." : "SIMPAN PERUBAHAN"}
              </button>
              
              <button onClick={() => setFile(null)} disabled={processing} className="w-full mt-4 text-gray-400 text-sm hover:underline hover:text-red-500 transition-colors">
                Ganti File
              </button>
            </div>
            
            {mode === 'all' && (
               <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-800 flex gap-3 text-sm">
                 <FileWarning className="text-amber-500 flex-shrink-0" size={20}/>
                 <p><b>Catatan:</b> Mode "Pisahkan Semua" akan mengabaikan kustomisasi urutan. File akan diunduh sebagai <b>.zip</b> agar tidak diblokir oleh browser.</p>
               </div>
            )}
          </div>

          {/* Panel Grid Halaman */}
          <div className="lg:col-span-1">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="pdf-pages-grid" direction="horizontal">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef} 
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-10"
                  >
                    {pages.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`transition-shadow ${snapshot.isDragging ? 'shadow-2xl z-50' : ''}`}
                          >
                            <div className={`bg-white border rounded-2xl shadow-sm relative group overflow-hidden ${item.isExcluded ? 'opacity-50 grayscale' : ''}`}>
                              
                              {item.isExcluded && (
                                <div className="absolute inset-0 bg-gray-100/50 z-20 flex items-center justify-center pointer-events-none">
                                  <div className='p-3 bg-gray-800/80 rounded-full text-white shadow-lg'>
                                    <FileWarning size={24}/>
                                  </div>
                                </div>
                              )}

                              <div className="p-2 pb-0 relative">
                                <div {...provided.dragHandleProps} className='cursor-grab active:cursor-grabbing hover:opacity-90 transition-opacity'>
                                    <PdfPagePreview file={file} pageIndex={item.originalIndex} />
                                </div>
                                <div className='absolute top-3 right-3 bg-gray-900/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'>
                                    Asli: {item.originalIndex + 1}
                                </div>
                              </div>
                              
                              <div className="px-3 py-2 flex justify-between items-center border-t mt-2 bg-gray-50/50">
                                <span className={`text-xs font-bold uppercase tracking-wider ${item.isExcluded ? 'text-gray-400' : 'text-orange-600'}`}>
                                  Hal {index + 1}
                                </span>
                                <div className="flex gap-1 z-30">
                                  {item.isExcluded ? (
                                    <button 
                                        onClick={() => toggleExcludePage(index)} 
                                        title="Sertakan halaman ini"
                                        className="p-1.5 bg-white border shadow-sm hover:bg-orange-50 rounded-lg text-gray-600 hover:text-orange-600 transition-colors"
                                    >
                                        <Undo2 size={14}/>
                                    </button>
                                  ) : (
                                    <button 
                                        onClick={() => toggleExcludePage(index)} 
                                        title="Hapus halaman ini"
                                        className="p-1.5 bg-white border shadow-sm hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      )}
    </div>
  );
}