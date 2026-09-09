import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ProductsHero from "@/components/ProductsHero";

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-white text-[#181917]">
      <Navbar />
      <div className="flex min-h-screen pt-15">
        <Sidebar />
        <main className="min-w-0 flex-1 px-5 pb-12 sm:px-8 lg:px-10" aria-busy="true" aria-label="Cargando catálogo">
          <div className="mx-auto max-w-[1440px]">
            <ProductsHero />
            <div className="animate-pulse border-t border-[#e3e5df] pt-6">
              <div className="h-10 w-48 rounded-full bg-slate-100" />
              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-2xl border border-orange-100 bg-white">
                    <div className="aspect-[4/4.6] bg-slate-100" />
                    <div className="space-y-3 p-5">
                      <div className="h-5 rounded bg-slate-100" />
                      <div className="h-4 w-2/3 rounded bg-slate-100" />
                      <div className="h-16 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
