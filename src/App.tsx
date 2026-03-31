import { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react'; // Tambahkan Menu dan X

// Import semua halaman
import Home from './pages/Home';
import MergePage from './pages/MergePage';
import SplitPage from './pages/SplitPage';
import CompressPage from './pages/CompressPage';
import EditPage from './pages/EditPage'; 
import RotatePage from './pages/RotatePage';
import PdfToJpgPage from './pages/PdfToJpgPage';
import JpgToPdfPage from './pages/JpgToPdfPage';

function App() {
  // State untuk mengontrol menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fungsi untuk menutup menu saat link diklik (khusus mobile)
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        
        {/* Navbar Global (Sticky) */}
        <nav className="bg-white border-b px-4 md:px-8 py-3 flex justify-between items-center shadow-sm sticky top-0 z-50">
          
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" onClick={closeMobileMenu} className="font-extrabold text-2xl text-red-600 flex items-center gap-2 tracking-tight">
              PDFRee
            </Link>

            {/* --- MENU DESKTOP (Sembunyi di HP) --- */}
            <div className="hidden lg:flex items-center gap-6 text-sm font-bold text-gray-700">
              <Link to="/merge" className="hover:text-red-600 transition-colors">Gabung PDF</Link>
              <Link to="/split" className="hover:text-red-600 transition-colors">Pisah PDF</Link>
              <Link to="/compress" className="hover:text-red-600 transition-colors">Kompres PDF</Link>
              {/*<Link to="/edit" className="hover:text-red-600 transition-colors">Edit PDF</Link>*/}
              
              {/* Dropdown Desktop: Alat Lainnya */}
              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-red-600 transition-colors py-2 outline-none">
                  Alat Lainnya <ChevronDown size={16} className="group-hover:rotate-180 transition-transform duration-300" />
                </button>
                <div className="absolute top-full left-0 mt-0 w-48 bg-white border border-gray-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col overflow-hidden transform origin-top group-hover:scale-100 scale-95">
                  <Link to="/rotate" className="px-4 py-3 hover:bg-red-50 hover:text-red-600 border-b border-gray-50">Putar PDF</Link>
                  <Link to="/pdf-to-jpg" className="px-4 py-3 hover:bg-red-50 hover:text-red-600 border-b border-gray-50">PDF ke JPG</Link>
                  <Link to="/jpg-to-pdf" className="px-4 py-3 hover:bg-red-50 hover:text-red-600">JPG ke PDF</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Area Kanan (Auth & Hamburger Button) */}
          <div className="flex items-center gap-4">
         
            {/* Tombol Hamburger Mobile */}
            <button 
              className="lg:hidden p-2 text-gray-600 hover:text-red-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* --- MENU MOBILE (Tampil saat Hamburger diklik) --- */}
          {isMobileMenuOpen && (
            <div className="absolute top-[100%] left-0 w-full bg-white border-b shadow-xl lg:hidden flex flex-col pb-4 animate-in slide-in-from-top-2 duration-200 z-50">
              <div className="flex flex-col px-6 py-2">
                
                <Link to="/merge" onClick={closeMobileMenu} className="py-4 border-b border-gray-50 font-bold text-gray-700 hover:text-red-600">Gabung PDF</Link>
                <Link to="/split" onClick={closeMobileMenu} className="py-4 border-b border-gray-50 font-bold text-gray-700 hover:text-red-600">Pisah PDF</Link>
                <Link to="/compress" onClick={closeMobileMenu} className="py-4 border-b border-gray-50 font-bold text-gray-700 hover:text-red-600">Kompres PDF</Link>
                {/*<Link to="/edit" onClick={closeMobileMenu} className="py-4 border-b border-gray-50 font-bold text-gray-700 hover:text-red-600">Edit PDF</Link>*/}
                
                {/* Grup Alat Lainnya di Mobile */}
                <div className="pt-4 pb-2">
                  <p className="text-xs font-black text-gray-400 mb-2 uppercase tracking-wider">Alat Lainnya</p>
                  <div className="flex flex-col pl-4 border-l-2 border-gray-100 space-y-4">
                    <Link to="/rotate" onClick={closeMobileMenu} className="font-medium text-gray-600 hover:text-red-600">Putar PDF</Link>
                    <Link to="/pdf-to-jpg" onClick={closeMobileMenu} className="font-medium text-gray-600 hover:text-red-600">PDF ke JPG</Link>
                    <Link to="/jpg-to-pdf" onClick={closeMobileMenu} className="font-medium text-gray-600 hover:text-red-600">JPG ke PDF</Link>
                  </div>
                </div>

                

              </div>
            </div>
          )}
        </nav>

        {/* Area Halaman */}
        <div className="relative z-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/merge" element={<MergePage />} />
            <Route path="/split" element={<SplitPage />} />
            <Route path="/compress" element={<CompressPage />} />
            {/*<Route path="/edit" element={<EditPage />} />*/}
            <Route path="/rotate" element={<RotatePage />} />
            <Route path="/pdf-to-jpg" element={<PdfToJpgPage />} />
            <Route path="/jpg-to-pdf" element={<JpgToPdfPage />} />
          </Routes>
        </div>
        
      </div>
    </Router>
  );
}

export default App;
