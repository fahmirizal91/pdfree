import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Loader2 } from 'lucide-react';

interface PdfPagePreviewProps {
  file: File; 
  pageIndex: number; // Index halaman (biasanya dimulai dari 0 di array, tapi PDF.js mulai dari 1)
  scale?: number;
}

export default function PdfPagePreview({ file, pageIndex, scale = 0.5 }: PdfPagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    let renderTask: pdfjs.RenderTask;
    let pdfDocument: pdfjs.PDFDocumentProxy;

    const renderPage = async () => {
      setIsRendering(true);
      
      try {
        // 1. Load dokumen PDF
        const arrayBuffer = await file.arrayBuffer();
        pdfDocument = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        // 2. Ambil halaman (PDF.js menggunakan 1-based index)
        const page = await pdfDocument.getPage(pageIndex + 1);
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;

        // 3. Atur skala dan ukuran canvas
        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
		  canvas: canvas,
        };

        // 4. Eksekusi render dan TUNGGU sampai selesai
        renderTask = page.render(renderContext);
        await renderTask.promise;
        
        // 5. Jika sukses sepenuhnya, matikan status rendering
        setIsRendering(false);

      } catch (error: any) {
        // Abaikan error "RenderingCancelled" karena itu wajar terjadi 
        // saat komponen di-unmount (misal saat drag & drop cepat)
        if (error.name !== 'RenderingCancelledException') {
          console.error(`Gagal merender halaman ${pageIndex + 1}:`, error);
          setIsRendering(false);
        }
      }
    };

    renderPage();

    // CLEANUP FUNCTION: Sangat penting!
    // Membatalkan proses render jika user tiba-tiba menghapus halaman atau pindah menu
    // Ini mencegah canvas tertimpa render lama yang telat selesai.
    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [file, pageIndex, scale]);

  return (
    <div className="relative flex items-center justify-center w-full min-h-[150px] bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      
      {/* Tampilkan Loading Spinner selama canvas masih digambar */}
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
          <Loader2 className="animate-spin text-orange-500" size={24} />
        </div>
      )}
      
      {/* Sembunyikan canvas menggunakan opacity sampai benar-benar siap */}
      <canvas 
        ref={canvasRef} 
        className={`max-w-full h-auto transition-opacity duration-300 ${
          isRendering ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}