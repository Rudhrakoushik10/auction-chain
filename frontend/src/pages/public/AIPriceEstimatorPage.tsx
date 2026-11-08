import React, { useState } from 'react';
import { VehicleAttributes, AIPredictionRecord } from '../../types/auction';
import { predictVehiclePrice } from '../../services/api/aiService';
import { PredictionWidget } from '../../components/prediction/PredictionWidget';
import { Scale, Car, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

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
  const { openAuthModal } = useWallet();
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
    <div className="space-y-10 pb-16">
      {/* Header Banner */}
      <div className="bg-[#12141A] border border-[#232730] rounded-md p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[#C5A46D] text-[11px] font-mono uppercase tracking-[0.16em] mb-2">
              <Scale className="w-3.5 h-3.5" />
              <span>AI Vehicle Valuation Workstation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7]">
              Indian Market Valuation & Oracle Hash Generator
            </h1>
            <p className="text-sm text-[#8E95A5] mt-2 max-w-2xl leading-relaxed">
              Evaluate pre-owned Indian passenger vehicles in INR (₹) and inspect
              the canonical SHA-256 data payload and{' '}
              <code className="font-mono text-[#F4F5F7]">PriceOracle.sol</code>{' '}
              record generated prior to auction consignment.
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
                className="px-3 py-2 rounded bg-[#0B0C10] hover:bg-[#171A22] text-xs font-mono text-[#F4F5F7] border border-[#232730] hover:border-[#C5A46D]/50 transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Input Form, Right Valuation Certificate */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleRunValuation}
          className="lg:col-span-5 bg-[#12141A] border border-[#232730] rounded-md p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#232730] pb-3.5">
            <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#F4F5F7] flex items-center gap-2">
              <Car className="w-4 h-4 text-[#C5A46D]" />
              Vehicle Attributes (Canonical Schema)
            </h3>
            <span className="text-[10px] font-mono text-[#646C7E]">INR Valuation</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="text-[#8E95A5] block mb-1.5 font-mono text-[11px]">
                Manufacturer / Brand
              </label>
              <input
                type="text"
                value={spec.brand}
                onChange={(e) => setSpec({ ...spec, brand: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#8E95A5] block mb-1.5 font-mono text-[11px]">
                Model & Trim
              </label>
              <input
                type="text"
                value={spec.model}
                onChange={(e) => setSpec({ ...spec, model: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#8E95A5] block mb-1.5 font-mono text-[11px]">
                Registration Year
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
              <label className="text-[#8E95A5] block mb-1.5 font-mono text-[11px]">
                Odometer (km)
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
              <label className="text-[#8E95A5] block mb-1.5 font-mono text-[11px]">
                Fuel Type
              </label>
              <select
                value={spec.fuel_type || 'Gasoline'}
                onChange={(e) => setSpec({ ...spec, fuel_type: e.target.value })}
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] focus:outline-none"
              >
                <option value="Gasoline">Petrol (Gasoline)</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric (EV)</option>
              </select>
            </div>

            <div>
              <label className="text-[#8E95A5] block mb-1.5 font-mono text-[11px]">
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
              <label className="text-[#8E95A5] block mb-1.5 font-mono text-[11px]">
                Engine Specification
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
              <label className="text-[#8E95A5] block mb-1.5 font-mono text-[11px]">
                Accident History
              </label>
              <select
                value={String(spec.accident_history ?? 'None reported')}
                onChange={(e) =>
                  setSpec({ ...spec, accident_history: e.target.value })
                }
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] focus:outline-none"
              >
                <option value="None reported">None reported</option>
                <option value="At least 1 accident or damage reported">
                  Accident / damage reported
                </option>
              </select>
            </div>

            <div>
              <label className="text-[#8E95A5] block mb-1.5 font-mono text-[11px]">
                Clean RC Title
              </label>
              <select
                value={String(spec.clean_title ?? 'Yes')}
                onChange={(e) =>
                  setSpec({ ...spec, clean_title: e.target.value })
                }
                className="w-full px-3 py-2 rounded bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] text-[#F4F5F7] focus:outline-none"
              >
                <option value="Yes">Yes (Clean Title)</option>
                <option value="No">No / Rebuilt</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPredicting}
            className="w-full py-3 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] font-semibold text-xs uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isPredicting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Computing Market Valuation...</span>
              </>
            ) : (
              <>
                <Scale className="w-4 h-4" />
                <span>Generate Valuation & Oracle Hash</span>
              </>
            )}
          </button>
        </form>

        {/* Right Output Column */}
        <div className="lg:col-span-7 space-y-6">
          {prediction && <PredictionWidget prediction={prediction} />}

          {/* Consignment Action Callout */}
          <div className="bg-[#12141A] border border-[#232730] rounded-md p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F4F5F7]">
                <ShieldCheck className="w-4 h-4 text-[#C5A46D]" />
                <span>Anchor This Valuation to a Sealed-Bid Listing</span>
              </div>
              <p className="text-xs text-[#8E95A5]">
                Connect as Seller (#0) to commit this{' '}
                <code className="font-mono text-[#F4F5F7]">prediction_id</code> to{' '}
                <code className="font-mono text-[#C5A46D]">PriceOracle.sol</code>{' '}
                and open a sealed-bid reserve auction.
              </p>
            </div>
            <button
              type="button"
              onClick={openAuthModal}
              className="px-5 py-2.5 rounded-md bg-[#171A22] hover:bg-[#C5A46D] text-[#F4F5F7] hover:text-[#0B0C10] border border-[#C5A46D]/40 text-xs font-semibold uppercase tracking-[0.1em] flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Seller Wallet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
