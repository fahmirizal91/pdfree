import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import { Merge, Download, Loader2, GripVertical, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

// Interface baru untuk membungkus File dengan ID unik
interface FileItem {
  id: string;
  file: File;
}

export default function MergePage() {
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate ID unik untuk setiap file agar aman saat di-drag
  const generateId = () => Math.random().toString(36).substring(2, 9);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    onDrop: (acceptedFiles) => {
      const newItems = acceptedFiles.map((file) => ({
        id: generateId(),
        file: file,
      }));
      setFileItems((prev) => [...prev, ...newItems]);
    }
  });

  // Fungsi untuk menangani saat user selesai menggeser item
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return; // Jika di-drop di luar area, abaikan

    const items = Array.from(fileItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFileItems(items); // Update urutan state
  };

  // Fungsi untuk menghapus file dari antrean
  const removeFile = (idToRemove: string) => {
    setFileItems((prev) => prev.filter(item => item.id !== idToRemove));
  };

  const handleMerge = async () => {
    if (fileItems.length < 2) {
      alert("Pilih minimal 2 file PDF untuk digabungkan!");
      return;
    }
    
    setLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const item of fileItems) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `merged_${Date.now()}.pdf`;
      link.click();
      
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menggabungkan PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex justify-center items-center gap-3">
          <Merge className="text-red-500" size={40} />
          Gabung PDF
        </h1>
        <p className="text-gray-600">
          Gabungkan file PDF dalam urutan yang Anda inginkan.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-4 border-dashed p-16 text-center rounded-3xl cursor-pointer transition-all ${
          isDragActive ? 'border-red-500 bg-red-50' : 'border-red-200 bg-white hover:border-red-400 hover:bg-red-50'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-xl font-medium text-gray-700">
          Tarik & Lepaskan file PDF di sini
        </p>
        <p className="text-sm text-gray-400 mt-2">atau klik untuk memilih file dari komputer Anda</p>
      </div>

      {fileItems.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-gray-800">Antrean File ({fileItems.length}):</h2>
            <p className="text-sm text-gray-500 italic">Tarik ikon <GripVertical size={16} className="inline"/> untuk mengatur urutan</p>
          </div>

          {/* Area Drag and Drop */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="pdf-files">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="flex flex-col gap-2 mb-6"
                >
                  {fileItems.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`px-4 py-3 bg-gray-50 rounded-xl flex justify-between items-center border transition-shadow ${
                            snapshot.isDragging ? 'shadow-lg border-red-300 bg-white z-50' : 'border-gray-200 hover:border-red-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {/* Tombol Drag Handle */}
                            <div 
                              {...provided.dragHandleProps}
                              className="text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing p-1"
                            >
                              <GripVertical size={20} />
                            </div>
                            
                            <span className="font-bold text-gray-400 w-6">{index + 1}.</span>
                            <span className="font-medium text-gray-700 truncate" title={item.file.name}>
                              {item.file.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <span className="text-xs text-gray-400 font-medium">
                              {(item.file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <button
                              onClick={() => removeFile(item.id)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Hapus file ini"
                            >
                              <X size={18} />
                            </button>
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

          <button
            onClick={handleMerge}
            disabled={loading || fileItems.length < 2}
            className="w-full bg-red-600 text-white text-lg font-bold py-4 rounded-xl hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Merge size={24} />}
            {loading ? "MEMPROSES..." : "GABUNGKAN PDF"}
          </button>
        </div>
      )}
    </div>
  );
}