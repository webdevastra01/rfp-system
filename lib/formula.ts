const RENTAL_HOURS = [8, 12, 24] as const;

const VEHICLE_CATEGORIES = [
  "Compact",
  "Sedan",
  "MPV",
  "SUV",
  "Pick-up",
  "Wagon",
  "Van",
] as const;

const REGION_VARIANTS = [
  "Davao City",
  "Davao Region",
  "Sarangani | South Cot",
  "Bukidnon",
  "Caraga | Misamis Oriental | Sultan Kudarat",
  "Camiguin | Cotabato City | Lanao | Misamis Occidental | Zamboanga",
  "BARMM",
] as const;

const VEHICLE_CLASSIFICATIONS = ["Budget Mile", "Primo", "Premium"] as const;

type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];
type VehicleClassification = (typeof VEHICLE_CLASSIFICATIONS)[number];
type RentalHours = (typeof RENTAL_HOURS)[number];
type RegionVariant = (typeof REGION_VARIANTS)[number];

/** Rate tiers corresponding to RENTAL_HOURS */
type VehicleRates = Partial<Record<VehicleClassification, readonly number[]>>;

type UnlimitedMileageRates = Partial<
  Record<
    VehicleCategory,
    Partial<
      Record<
        RentalHours,
        Partial<
          Record<VehicleClassification, Partial<Record<RegionVariant, number>>>
        >
      >
    >
  >
>;

type VehicleConfig = {
  rates?: VehicleRates;
  rate?: number;
  cdw: number;
  carwash_fee: number;
  excess_hourly_rate: number;
  excess_km_rate: number;
};

const RATES: Record<VehicleCategory, VehicleConfig> = {
  Compact: {
    rates: { "Budget Mile": [899, 1399, 1499] },
    cdw: 350,
    carwash_fee: 200,
    excess_hourly_rate: 300,
    excess_km_rate: 4,
  },
  Sedan: {
    rates: {
      "Budget Mile": [999, 1599, 1699],
      Primo: [1099, 1699, 1799],
      Premium: [1199, 1799, 1899],
    },
    cdw: 350,
    carwash_fee: 200,
    excess_hourly_rate: 300,
    excess_km_rate: 4,
  },
  MPV: {
    rates: {
      "Budget Mile": [1500, 2199, 2299],
      Primo: [1700, 2399, 2499],
    },
    cdw: 500,
    carwash_fee: 250,
    excess_hourly_rate: 350,
    excess_km_rate: 5,
  },
  SUV: {
    rates: {
      "Budget Mile": [2500, 3199, 3299],
      Primo: [2700, 3399, 3499],
    },
    cdw: 500,
    carwash_fee: 300,
    excess_hourly_rate: 400,
    excess_km_rate: 5,
  },
  "Pick-up": {
    rates: { "Budget Mile": [2500, 3199, 3299] },
    cdw: 500,
    carwash_fee: 300,
    excess_hourly_rate: 400,
    excess_km_rate: 5,
  },
  Wagon: {
    rates: { "Budget Mile": [2500, 3199, 3299] },
    cdw: 500,
    carwash_fee: 250,
    excess_hourly_rate: 350,
    excess_km_rate: 5,
  },
  Van: {
    rate: 4500,
    cdw: 500,
    carwash_fee: 300,
    excess_hourly_rate: 400,
    excess_km_rate: 5,
  },
} as const;

const UNLI_MILEAGE_RATES: UnlimitedMileageRates = {
  Compact: {
    8: {
      "Budget Mile": {
        "Davao City": 1400,
        "Davao Region": 1900,
      },
    },

    12: {
      "Budget Mile": {
        "Davao City": 1900,
        "Davao Region": 2200,
        "Sarangani | South Cot": 2700,
        Bukidnon: 2900,
        "Caraga | Misamis Oriental | Sultan Kudarat": 3400,
        "Camiguin | Cotabato City | Lanao | Misamis Occidental | Zamboanga": 3900,
        BARMM: 4400,
      },
    },

    24: {
      "Budget Mile": {
        "Davao City": 2000,
        "Davao Region": 2300,
        "Sarangani | South Cot": 2800,
        Bukidnon: 3000,
        "Caraga | Misamis Oriental | Sultan Kudarat": 3500,
        "Camiguin | Cotabato City | Lanao | Misamis Occidental | Zamboanga": 4000,
        BARMM: 4500,
      },
    },
  },

  Sedan: {
    8: {
      "Budget Mile": {
        "Davao City": 1600,
        "Davao Region": 2100,
      },

      Primo: {
        "Davao City": 1700,
        "Davao Region": 2200,
      },
    },

    12: {
      "Budget Mile": {
        "Davao City": 2100,
        "Davao Region": 2700,
        "Sarangani | South Cot": 2900,
        Bukidnon: 3400,
        "Caraga | Misamis Oriental | Sultan Kudarat": 3900,
        "Camiguin | Cotabato City | Lanao | Misamis Occidental | Zamboanga": 4400,
        BARMM: 4900,
      },

      Primo: {
        "Davao City": 2200,
        "Davao Region": 2800,
        "Sarangani | South Cot": 3000,
        Bukidnon: 3500,
        "Caraga | Misamis Oriental | Sultan Kudarat": 4000,
        "Camiguin | Cotabato City | Lanao | Misamis Occidental | Zamboanga": 4500,
        BARMM: 5000,
      },
    },

    24: {
      "Budget Mile": {
        "Davao City": 2200,
        "Davao Region": 2800,
        "Sarangani | South Cot": 3000,
        Bukidnon: 3500,
        "Caraga | Misamis Oriental | Sultan Kudarat": 4000,
        "Camiguin | Cotabato City | Lanao | Misamis Occidental | Zamboanga": 4500,
        BARMM: 5000,
      },

      Primo: {
        "Davao City": 2300,
        "Davao Region": 2900,
        "Sarangani | South Cot": 3100,
        Bukidnon: 3600,
        "Caraga | Misamis Oriental | Sultan Kudarat": 4100,
        "Camiguin | Cotabato City | Lanao | Misamis Occidental | Zamboanga": 4600,
        BARMM: 5100,
      },
    },
  },

  Wagon: {
    8: {
      "Budget Mile": {
        "Davao City": 2100,
        "Davao Region": 2600,
      },
    },

    12: {
      "Budget Mile": {
        "Davao City": 2600,
        "Davao Region": 3100,
        "Sarangani | South Cot": 3800,
        Bukidnon: 3800,
        "Caraga | Misamis Oriental | Sultan Kudarat": 4300,
        "Camiguin | Cotabato City | Lanao | Misamis Occidental | Zamboanga": 4800,
        BARMM: 5300,
      },
    },

    24: {
      "Budget Mile": {
        "Davao City": 2700,
        "Davao Region": 3200,
        "Sarangani | South Cot": 3900,
        Bukidnon: 3900,
        "Caraga | Misamis Oriental | Sultan Kudarat": 4400,
        "Camiguin | Cotabato City | Lanao | Misamis Occidental | Zamboanga": 4900,
        BARMM: 5400,
      },
    },
  },

  MPV: {
    8: {
      "Budget Mile": {
        "Davao City": 2200,
        "Davao Region": 2700,
      },

      Primo: {
        "Davao City": 2400,
        "Davao Region": 2900,
      },
    },

    12: {
      "Budget Mile": {
        "Davao City": 2700,
        "Davao Region": 3200,
        "Sarangani | South Cot": 3900,
        Bukidnon: 3900,
        "Caraga | Misamis Oriental | Sultan Kudarat": 4400,
        "Camiguin | Cotabato City | Lanao | Misamis Occidental | Zamboanga": 4800,
        BARMM: 5400,
      },

      Primo: {
        "Davao City": 2900,
        "Davao Region": 3400,
        "Sarangani | South Cot": 4100,
        Bukidnon: 4100,
        "Caraga | Misamis Oriental | Sultan Kudarat": 4600,
        "Camiguin | Cotabato City | Lanao | Misamis Occidental | Zamboanga": 5000,
        BARMM: 5600,
      },
    },

    24: {
      "Budget Mile": {
        "Davao City": 2800,
        "Davao Region": 3300,
        "Sarangani | South Cot": 4000,
        Bukidnon: 4000,
        "Caraga | Misamis Oriental | Sultan Kudarat": 4500,
        "Camiguin | Cotabato City | Lanao | Misamis Occidental | Zamboanga": 5000,
        BARMM: 5500,
      },

      Primo: {
        "Davao City": 3000,
        "Davao Region": 3500,
        "Sarangani | South Cot": 4200,
        Bukidnon: 4200,
        "Caraga | Misamis Oriental | Sultan Kudarat": 4700,
        "Camiguin | Cotabato City | Lanao | Misamis Occidental | Zamboanga": 5200,
        BARMM: 5700,
      },
    },
  },
};

function getVehiclePricing(
  category: VehicleCategory,
  hours: number,
  classification?: VehicleClassification,
) {
  const vehicle = RATES[category];

  // Van uses a flat rate (no classification or hourly tiers)
  if ("rate" in vehicle) {
    return {
      rental_rate: vehicle.rate,
      cdw: vehicle.cdw,
      carwash_fee: vehicle.carwash_fee,
      excess_hourly_rate: vehicle.excess_hourly_rate,
      excess_km_rate: vehicle.excess_km_rate,
    };
  }

  if (!classification) {
    throw new Error(`Classification is required for ${category} (not Van)`);
  }

  const rates = vehicle.rates?.[classification];
  if (!rates) {
    throw new Error(
      `Classification "${classification}" is not available for ${category}`,
    );
  }

  const rateIndex = RENTAL_HOURS.findIndex((limit) => hours <= limit);

  if (rateIndex === -1 || rateIndex >= rates.length) {
    throw new Error(
      `Unsupported rental duration: ${hours}h. ` +
        `Supported durations are up to ${RENTAL_HOURS.at(-1)} hours.`,
    );
  }

  return {
    rental_rate: rates[rateIndex],
    cdw: vehicle.cdw,
    carwash_fee: vehicle.carwash_fee,
    excess_hourly_rate: vehicle.excess_hourly_rate,
    excess_km_rate: vehicle.excess_km_rate,
  };
}

function calculateBeyondOperatingHoursFee(
  startDate: Date,
  endDate: Date,
  beyondOperatingHoursRate: number,
) {
  const operatingStartHour = 5; // 5 AM
  const operatingEndHour = 19; // 7 PM

  let affectedDays = 0;

  const current = new Date(startDate);

  while (current <= endDate) {
    const dayStart = new Date(current);
    dayStart.setHours(0, 0, 0, 0);

    const rentalStartsToday =
      current.toDateString() === startDate.toDateString();

    const rentalEndsToday = current.toDateString() === endDate.toDateString();

    const startHour = rentalStartsToday ? startDate.getHours() : 0;
    const endHour = rentalEndsToday ? endDate.getHours() : 23;

    const hasBeyondHours =
      startHour < operatingStartHour ||
      endHour >= operatingEndHour ||
      (!rentalStartsToday && !rentalEndsToday); // full rental day

    if (hasBeyondHours) {
      affectedDays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return {
    affectedDays,
    fee: affectedDays * beyondOperatingHoursRate,
  };
}

export {
  RATES,
  UNLI_MILEAGE_RATES,
  getVehiclePricing,
  calculateBeyondOperatingHoursFee,
};