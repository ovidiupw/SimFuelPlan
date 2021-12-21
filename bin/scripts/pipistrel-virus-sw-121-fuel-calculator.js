var lerp = require("lerp")

// Parameters / Configuration //

var TRIP_LENGTH_NM = 200;
var CRUISE_ALTITUDE_FEET = 8000;
var ISA_DEVIATION_CELSIUS = 10;
var AVERAGE_CRUISE_HEAD_WINDS_KTAS = 15;

var DESCENT_SPEED_KTAS = 110;
var DESTINATION_AIRPORT_ALTITUDE_FEET = 1520;
var DESCENT_FEET_PER_MINUTE = 700;

var START_TAXI_TAKEOFF_FUEL_GALLONS = 1.1;
var UNUSABLE_FUEL_GALLONS = 0.1;

var FUEL_RESERVE_TIME_MINUTES = 45;
var FUEL_RESERVE_CRUISE_MULTIPLIER = 1.5;

// Data //

var REQUIRED_FUEL_GALLONS_TO_REACH_ALTITUDE_FEET = {
  "2000": 0.2,
  "4000": 0.5,
  "6000": 1,
  "8000": 1.8,
  "10000": 2.8,
  "12000": 4
};

var REQUIRED_DISTANCE_NAUTICAL_MILES_TO_REACH_ALTITUDE_FEET = {
  "2000": 3,
  "4000": 5.8,
  "6000": 8.6,
  "8000": 13,
  "10000": 18.5,
  "12000": 26
};

// Assuming 2200 engine RPM.
var CRUISE_GALLONS_PER_HOUR_FOR_ALTITUDE_FEET_STANDARD_ISA = {
  "2000": 5.7,
  "4000": 5.5,
  "6000": 5.1,
  "8000": 5.1,
  "10000": 4.9,
  "12000": 4.4
}

// Assuming 2200 engine RPM.
var CRUISE_KTAS_FOR_ALTITUDE_FEET_STANDARD_ISA = {
  "2000": 129,
  "4000": 130,
  "6000": 132,
  "8000": 132,
  "10000": 133,
  "12000": 120
}

// Computation //

// Assuming no wind.
function computeClimbFuelGallons(cruiseAltitudeFeet, isaDeviationCelsius) {
  if (cruiseAltitudeFeet > 12000) {
    throw "Altitude more than 12000 feet not supported";
  }

  var lowerThousandAltitude = Math.floor(cruiseAltitudeFeet / 1000) * 1000;
  var upperThousandAltitude = Math.ceil(cruiseAltitudeFeet / 1000) * 1000;
  var lowerTwoThousandMultiplierAltitude = lowerThousandAltitude;
  var upperTwoThousandMultiplierAltitude = upperThousandAltitude;
  if ((lowerThousandAltitude / 1000) % 2 != 0) {
    lowerTwoThousandMultiplierAltitude = Math.max(2000, (lowerTwoThousandMultiplierAltitude - 1000))
  }
  if ((upperThousandAltitude / 1000) % 2 != 0) {
    upperTwoThousandMultiplierAltitude = Math.min(12000, (upperTwoThousandMultiplierAltitude + 1000))
  }
  var climbFuelGallons = lerp(
    REQUIRED_FUEL_GALLONS_TO_REACH_ALTITUDE_FEET[lowerTwoThousandMultiplierAltitude],
    REQUIRED_FUEL_GALLONS_TO_REACH_ALTITUDE_FEET[upperTwoThousandMultiplierAltitude],
    0.5
  )

  var numberOfTensOfCelsiusAboveISA = Math.floor(isaDeviationCelsius / 10);
  var climbFuelGallons = climbFuelGallons + climbFuelGallons * (numberOfTensOfCelsiusAboveISA / 10);

  return climbFuelGallons;
}

function computeDescentDistanceNM(cruiseAltitudeFeet, destinationAirportAltitudeFeet, descentFeetPerMinute, descentSpeedKTAS) {
  var feetToDescend = cruiseAltitudeFeet - destinationAirportAltitudeFeet;
  var minutesToDescend = feetToDescend / descentFeetPerMinute;
  var descentNMPerMinute = descentSpeedKTAS / 60;
  return descentNMPerMinute * minutesToDescend;
}

function computeDescentFuelGallons(descentDistanceNM, descentSpeedKTAS, descentGallonsPerHour) {
  return descentDistanceNM / descentSpeedKTAS * descentGallonsPerHour;
}

// Assuming 2200 engine RPM.
function computeCruiseFuel(cruiseAltitudeFeet, tripLengthNM, isaDeviationCelsius, averageCruiseHeadWindKTAS) {
  if (isaDeviationCelsius > 20 || isaDeviationCelsius < -20) {
    throw "ISA deviation only supported between -20 and 20 degrees celsius"
  }
  if (cruiseAltitudeFeet > 12000) {
    throw "Altitude more than 12000 feet not supported";
  }

  var lowerThousandAltitude = Math.floor(cruiseAltitudeFeet / 1000) * 1000;
  var upperThousandAltitude = Math.ceil(cruiseAltitudeFeet / 1000) * 1000;
  var lowerTwoThousandMultiplierAltitude = lowerThousandAltitude;
  var upperTwoThousandMultiplierAltitude = upperThousandAltitude;
  if ((lowerThousandAltitude / 1000) % 2 != 0) {
    lowerTwoThousandMultiplierAltitude = Math.max(2000, (lowerTwoThousandMultiplierAltitude - 1000))
  }
  if ((upperThousandAltitude / 1000) % 2 != 0) {
    upperTwoThousandMultiplierAltitude = Math.min(12000, (upperTwoThousandMultiplierAltitude + 1000))
  }

  var climbDistanceNM = lerp(
    REQUIRED_DISTANCE_NAUTICAL_MILES_TO_REACH_ALTITUDE_FEET[lowerTwoThousandMultiplierAltitude],
    REQUIRED_DISTANCE_NAUTICAL_MILES_TO_REACH_ALTITUDE_FEET[upperTwoThousandMultiplierAltitude],
    0.5
  );
  var descentDistanceNM = computeDescentDistanceNM(cruiseAltitudeFeet, DESTINATION_AIRPORT_ALTITUDE_FEET, DESCENT_FEET_PER_MINUTE, DESCENT_SPEED_KTAS);
  var cruiseDistanceNM = tripLengthNM - climbDistanceNM - descentDistanceNM;
  if (cruiseDistanceNM <= 0) {
    throw "Remaining cruise distance after climb must be >= 0 taking into account the climb and descent distances";
  }

  var cruiseGallonsPerHourAtStandardISA = lerp(
    CRUISE_GALLONS_PER_HOUR_FOR_ALTITUDE_FEET_STANDARD_ISA[lowerTwoThousandMultiplierAltitude],
    CRUISE_GALLONS_PER_HOUR_FOR_ALTITUDE_FEET_STANDARD_ISA[upperTwoThousandMultiplierAltitude],
    0.5
  );
  var cruiseKTASAtStandardISA = lerp(
    CRUISE_KTAS_FOR_ALTITUDE_FEET_STANDARD_ISA[lowerTwoThousandMultiplierAltitude],
    CRUISE_KTAS_FOR_ALTITUDE_FEET_STANDARD_ISA[upperTwoThousandMultiplierAltitude],
    0.5
  );

  var cruiseKTAS = cruiseKTASAtStandardISA;
  var cruiseGallonsPerHour = cruiseGallonsPerHourAtStandardISA;

  var windAdjustedCruiseKTAS = cruiseKTAS - averageCruiseHeadWindKTAS;

  var cruiseHours = cruiseDistanceNM / windAdjustedCruiseKTAS;
  return {
    gallons: cruiseHours * cruiseGallonsPerHour,
    gallonsPerHour: cruiseGallonsPerHour,
    cruiseHours: cruiseHours,
    cruiseKTAS: windAdjustedCruiseKTAS
  }
}

var cruiseFuel = computeCruiseFuel(CRUISE_ALTITUDE_FEET, TRIP_LENGTH_NM, ISA_DEVIATION_CELSIUS, AVERAGE_CRUISE_HEAD_WINDS_KTAS);
var descentDistanceNM = Math.round(computeDescentDistanceNM(CRUISE_ALTITUDE_FEET, DESTINATION_AIRPORT_ALTITUDE_FEET, DESCENT_FEET_PER_MINUTE, DESCENT_SPEED_KTAS) * 100)/100;
var fuel = {
  unusableFuelGallons: UNUSABLE_FUEL_GALLONS,
  startTaxiTakeoffGallons: START_TAXI_TAKEOFF_FUEL_GALLONS,
  climbGallons: computeClimbFuelGallons(CRUISE_ALTITUDE_FEET, ISA_DEVIATION_CELSIUS),
  cruiseGallons: Math.round(cruiseFuel.gallons * 100) / 100,
  cruiseGallonsPerHour: Math.round(cruiseFuel.gallonsPerHour * 100) / 100,
  cruiseHours: Math.round(cruiseFuel.cruiseHours * 100) / 100,
  cruiseKTAS: cruiseFuel.cruiseKTAS,
  descentGallons: computeDescentFuelGallons(
    computeDescentDistanceNM(CRUISE_ALTITUDE_FEET, DESTINATION_AIRPORT_ALTITUDE_FEET, DESCENT_FEET_PER_MINUTE, DESCENT_SPEED_KTAS),
    DESCENT_SPEED_KTAS,  cruiseFuel.gallons / cruiseFuel.cruiseHours
  ),
  reserveGallons: FUEL_RESERVE_CRUISE_MULTIPLIER * (cruiseFuel.gallons / cruiseFuel.cruiseHours) / 60 * FUEL_RESERVE_TIME_MINUTES,
}
var totalFuelGallons = fuel.climbGallons + fuel.cruiseGallons + fuel.descentGallons + fuel.reserveGallons + fuel.unusableFuelGallons;
var totalFuelLbs = 6 * totalFuelGallons; // http://www.pilotfriend.com/pilot_resources/tables.htm

// Display //

console.log(`CLIMB fuel gallons: ${Math.ceil(fuel.climbGallons)}`);
console.log(`CRUISE fuel gallons: ${Math.ceil(fuel.cruiseGallons)} (${fuel.cruiseGallonsPerHour} gal. per hour; ${fuel.cruiseHours} hours; ${fuel.cruiseKTAS} KTAS)`);
console.log(`DESCENT fuel gallons: ${Math.ceil(fuel.descentGallons)} (${descentDistanceNM} NM from Cruise to Dest. Apt. Elevation)`);
console.log(`RESERVE fuel gallons: ${Math.ceil(fuel.reserveGallons)}`);
console.log(`\n####-------####\n`)
console.log(`TOTAL fuel gallons: ${Math.ceil(totalFuelGallons)} (${Math.ceil(totalFuelLbs)} LBS)\n`)
