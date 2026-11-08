import React, { useState } from 'react';
import { VehicleAttributes, AIPredictionRecord } from '../../types/auction';
import { predictVehiclePrice } from '../../services/api/aiService';
import { PredictionWidget } from '../../components/prediction/PredictionWidget';
import { Scale, RefreshCw } from 'lucide-react';

const PRESET_VEHICLES: { label: string; spec: VehicleAttributes }[] = [
  {
    label: '2021 Hyundai Creta SX (O) Diesel',
    spec: {
      brand: 'Hyundai',
      model: 'Creta SX (O) 1.5 CRDi',
      year: 2021,
      mileage: 28500,
      fuel_type: 'Diesel',
      engine_type: '1.5L U2 CRDi 115bhp Diesel',
      transmission: '6-Speed Automatic',
      exterior_color: 'Phantom Black',
      interior_color: 'Black / Greige Leatherette',
      accident_history: 'None reported',
      clean_title: 'Yes',
    },
  },
  {
    label: '2020 Honda City ZX CVT',
    spec: {
      brand: 'Honda',
      model: 'City ZX 1.5 i-VTEC CVT',
      year: 2020,
      mileage: 34200,
      fuel_type: 'Gasoline',
      engine_type: '1.5L 4-Cylinder i-VTEC 121bhp',
      transmission: '7-Step CVT Automatic',
      exterior_color: 'Platinum White Pearl',
      interior_color: 'Ivory / Black Leather',
      accident_history: 'None reported',
      clean_title: 'Yes',
    },
  },
  {
    label: '2022 Maruti Suzuki Swift ZXi AMT',
    spec: {
      brand: 'Maruti Suzuki',
      model: 'Swift ZXi 1.2 DualJet AMT',
      year: 2022,
      mileage: 19400,
      fuel_type: 'Gasoline',
      engine_type: '1.2L K-Series DualJet 89bhp',
      transmission: '5-Speed AMT',
      exterior_color: 'Solid Fire Red',
      interior_color: 'Charcoal Black Fabric',
      accident_history: 'None reported',
      clean_title: 'Yes',
    },
  },
];

export const AIPriceEstimatorPage: React.FC = () => {
  const [spec, setSpec] = useState<VehicleAttributes>(PRESET_VEHICLES[0].spec);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<AIPredictionRecord | null>(null);

  React.useEffect(() => {
    let mounted = true;
    predictVehiclePrice(PRESET_VEHICLES[0].spec)
      .then((res) => {
        if (mounted) setPrediction(res);
      })
      .catch(() => {
        // Fallback handled inside predictVehiclePrice
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleRunValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    try {
      const res = await predictVehiclePrice(spec);
      setPrediction(res);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Unboxed Header */}
      <div className="border-b border-[#232730] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[#F4F5F7]">
            AI Used-Car Price Estimator (₹ INR)
          </h1>
          <p className="text-xs text-[#8E95A5] mt-1 max-w-2xl leading-relaxed">
            Check the estimated fair market price of any pre-owned Indian passenger car based on its make, model, year, kilometers driven, and condition.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESET_VEHICLES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={async () => {
                setSpec(preset.spec);
                setIsPredicting(true);
                try {
                  const res = await predictVehiclePrice(preset.spec);
                  setPrediction(res);
                } finally {
                  setIsPredicting(false);
                }
              }}
              className="px-3 py-1.5 rounded bg-[#12141A] hover:bg-[#171A22] text-xs text-[#F4F5F7] border border-[#232730] hover:border-[#C5A46D]/50 transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Input Form, Right Valuation Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleRunValuation}
          className="lg:col-span-5 bg-[#12141A] border border-[#232730] rounded-md p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#232730] pb-3.5">
            <h3 className="text-sm font-semibold text-[#F4F5F7]">
              Vehicle Details
            </h3>
            <span className="text-xs font-mono text-[#C5A46D]">Indian Market (₹)</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="text-[#8E95A5] block mb-1.5">
                Brand
              </label>
              <input
                type="text"
                value={spec.brand}
                onChange={(e) => setSpec({ ...spec, brand: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#8E95A5] block mb-1.5">
                Model &amp; Variant
              </label>
              <input
                type="text"
                value={spec.model}
                onChange={(e) => setSpec({ ...spec, model: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#8E95A5] block mb-1.5">
                Year
              </label>
              <input
                type="number"
                min={1995}
                max={2026}
                value={spec.year}
                onChange={(e) => setSpec({ ...spec, year: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#8E95A5] block mb-1.5">
                Kilometers Driven
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={spec.mileage}
                onChange={(e) =>
                  setSpec({ ...spec, mileage: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#8E95A5] block mb-1.5">
                Fuel Type
              </label>
              <select
                value={spec.fuel_type || 'Gasoline'}
                onChange={(e) => setSpec({ ...spec, fuel_type: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] focus:outline-none"
              >
                <option value="Gasoline">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric (EV)</option>
              </select>
            </div>

            <div>
              <label className="text-[#8E95A5] block mb-1.5">
                Transmission
              </label>
              <input
                type="text"
                value={spec.transmission || ''}
                onChange={(e) =>
                  setSpec({ ...spec, transmission: e.target.value })
                }
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] focus:outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[#8E95A5] block mb-1.5">
                Engine Details
              </label>
              <input
                type="text"
                value={spec.engine_type || ''}
                onChange={(e) =>
                  setSpec({ ...spec, engine_type: e.target.value })
                }
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#8E95A5] block mb-1.5">
                Accident History
              </label>
              <select
                value={String(spec.accident_history ?? 'None reported')}
                onChange={(e) =>
                  setSpec({ ...spec, accident_history: e.target.value })
                }
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] focus:outline-none"
              >
                <option value="None reported">No accidents</option>
                <option value="At least 1 accident or damage reported">
                  Previous accident / repair
                </option>
              </select>
            </div>

            <div>
              <label className="text-[#8E95A5] block mb-1.5">
                Clean RC &amp; Title
              </label>
              <select
                value={String(spec.clean_title ?? 'Yes')}
                onChange={(e) =>
                  setSpec({ ...spec, clean_title: e.target.value })
                }
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] focus:outline-none"
              >
                <option value="Yes">Yes (Clean RC)</option>
                <option value="No">No / Rebuilt</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPredicting}
            className="w-full py-3 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isPredicting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Calculating Fair Price...</span>
              </>
            ) : (
              <>
                <Scale className="w-4 h-4" />
                <span>Calculate Fair Market Value (₹)</span>
              </>
            )}
          </button>
        </form>

        {/* Right Output Column */}
        <div className="lg:col-span-7">
          {prediction && <PredictionWidget prediction={prediction} />}
        </div>
      </div>
    </div>
  );
};
