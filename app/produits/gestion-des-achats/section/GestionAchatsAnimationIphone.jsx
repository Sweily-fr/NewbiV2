"use client";
import React from "react";

export function GestionAchatsAnimationIphone() {
  return (
    <div className="flex flex-col items-center">
      {/* iPhone Frame */}
      <div className="relative w-[180px] xl:w-[220px]">
        <div className="relative bg-[#2F2F2D] rounded-[28px] shadow-xl border border-[#202020] p-1.5">
          {/* Screen with rounded corners */}
          <div className="relative rounded-[24px] overflow-hidden">
            {/* Camera view with hand holding receipt */}
            <div className="relative bg-[#8B9A7D]">
              <img
                src="https://static7.depositphotos.com/1023803/781/i/450/depositphotos_7811067-stock-photo-paying-bill.jpg"
                alt="Main tenant un ticket de caisse"
                className="w-full h-[300px] xl:h-[340px] object-cover opacity-90"
              />

              {/* Receipt overlay - simulating the actual receipt in the image */}
              {/* <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="bg-white shadow-lg px-4 py-3 w-[110px] xl:w-[130px]"
                  style={{
                    clipPath: "polygon(5% 0%, 95% 2%, 100% 100%, 0% 98%)",
                    transform: "rotate(-2deg)",
                  }}
                >
                  <div className="text-center mb-3">
                    <p className="text-[10px] xl:text-xs font-semibold text-gray-800">
                      Maison Z&K
                    </p>
                    <p className="text-[6px] xl:text-[7px] text-gray-500 mt-0.5">
                      84, place de Lebreton,
                    </p>
                    <p className="text-[6px] xl:text-[7px] text-gray-500">
                      75003 Paris
                    </p>
                    <p className="text-[6px] xl:text-[7px] text-gray-500">
                      Tel : 07 99 50 10 35
                    </p>
                  </div>

                  <div className="border-t border-dotted border-gray-300 my-2" />

                  <p className="text-center text-[8px] xl:text-[9px] text-gray-600 tracking-wider">
                    REÇU
                  </p>

                  <div className="border-t border-dotted border-gray-300 my-2" />

                  <div className="flex justify-between text-[7px] xl:text-[8px] mb-1">
                    <span className="text-gray-600 font-medium">
                      DESCRIPTION
                    </span>
                    <span className="text-gray-600 font-medium">PRIX (€)</span>
                  </div>

                  <div className="space-y-0.5 text-[6px] xl:text-[7px] text-gray-700">
                    <div className="flex justify-between">
                      <span>2 Repas du jour</span>
                      <span>30,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2 Café</span>
                      <span>4,00</span>
                    </div>
                  </div>

                  <div className="border-t border-dotted border-gray-300 my-2" />

                  <div className="flex justify-between text-[8px] xl:text-[9px] font-semibold text-gray-800">
                    <span>TOTAL</span>
                    <span>EUR 34,00</span>
                  </div>

                  <div className="border-t border-dotted border-gray-300 my-2" />

                  <div className="text-[5px] xl:text-[6px] text-gray-500 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Carte bancaire</span>
                      <span>--- --- --- -234</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ticket n°</span>
                      <span>#5232</span>
                    </div>
                  </div>

                  <div className="border-t border-dotted border-gray-300 my-2" />

                  <p className="text-center text-[6px] xl:text-[7px] text-emerald-700 font-medium">
                    MERCI DE VOTRE VISITE
                  </p>
                  <p className="text-center text-[6px] xl:text-[7px] text-emerald-700 font-medium">
                    ET À BIENTÔT
                  </p>

                  <div className="mt-2 flex justify-center gap-[1px]">
                    {[...Array(30)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-gray-800"
                        style={{
                          width: Math.random() > 0.5 ? "2px" : "1px",
                          height: "16px",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div> */}

              {/* Camera capture button */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-full border-[2.5px] border-white/90 flex items-center justify-center">
                  <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-full bg-white/90" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TVA Section - Outside the iPhone frame */}
      {/* <div className="mt-8 w-full max-w-[320px]">
        <p className="text-xl xl:text-2xl font-semibold text-gray-900 mb-4">
          TVA
        </p>
        <div className="flex gap-3">
          <button className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            0 %
          </button>
          <button className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            10 %
          </button>
          <button className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            20 %
          </button>
          <button className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Autre
          </button>
        </div>
      </div> */}
    </div>
  );
}

export default GestionAchatsAnimationIphone;
