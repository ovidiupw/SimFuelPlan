var lerp = require("lerp")

// Parameters / Configuration //

var TRIP_LENGTH_NM = 175;
var CRUISE_ALTITUDE_FEET = 10000;
var ISA_DEVIATION_CELSIUS = 1;
var AVERAGE_CRUISE_HEAD_WINDS_KTAS = -12.67;

var DESCENT_SPEED_KTAS = 110;
var DESTINATION_AIRPORT_ALTITUDE_FEET = 278;
var DESCENT_FEET_PER_MINUTE = 500;

var START_TAXI_TAKEOFF_FUEL_GALLONS = 1.1;
var UNUSABLE_FUEL_GALLONS = 3;

var FUEL_RESERVE_TIME_MINUTES = 45;
var FUEL_RESERVE_CRUISE_MULTIPLIER = 1.5;

// Data //

var REQUIRED_FUEL_GALLONS_TO_REACH_ALTITUDE_FEET = {
  "1000": 0.4,
  "2000": 0.7,
  "3000": 1.2,
  "4000": 1.5,
  "5000": 1.8,
  "6000": 2.1,
  "7000": 2.5,
  "8000": 3.0,
  "9000": 3.4,
  "10000": 4.0,
  "11000": 4.6,
  "12000": 5.4
};

var REQUIRED_DISTANCE_NAUTICAL_MILES_TO_REACH_ALTITUDE_FEET = {
  "1000": 2,
  "2000": 4,
  "3000": 6,
  "4000": 8,
  "5000": 11,
  "6000": 14,
  "7000": 17,
  "8000": 21,
  "9000": 25,
  "10000": 29,
  "11000": 35,
  "12000": 43
};

// Assuming 2200 engine RPM.
var CRUISE_GALLONS_PER_HOUR_FOR_ALTITUDE_FEET_TWENTY_CELSIUS_BELOW_ISA = {
  "2000": 9.1,
  "4000": 8.6,
  "6000": 8.1,
  "8000": 7.7,
  "10000": 7.4,
  "12000": 7.1
}

// Assuming 2200 engine RPM.
var CRUISE_GALLONS_PER_HOUR_FOR_ALTITUDE_FEET_STANDARD_ISA = {
  "2000": 8.5,
  "4000": 8.1,
  "6000": 7.7,
  "8000": 7.3,
  "10000": 7.0,
  "12000": 6.8
}

// Assuming 2200 engine RPM.
var CRUISE_GALLONS_PER_HOUR_FOR_ALTITUDE_FEET_TWENTY_CELSIUS_ABOVE_ISA = {
  "2000": 8.0,
  "4000": 7.6,
  "6000": 7.3,
  "8000": 7.0,
  "10000": 6.7,
  "12000": 6.6
}

// Assuming 2200 engine RPM.
var CRUISE_KTAS_FOR_ALTITUDE_FEET_TWENTY_CELSIUS_BELOW_ISA = {
  "2000": 112,
  "4000": 112,
  "6000": 112,
  "8000": 111,
  "10000": 110,
  "12000": 108
}

// Assuming 2200 engine RPM.
var CRUISE_KTAS_FOR_ALTITUDE_FEET_STANDARD_ISA = {
  "2000": 112,
  "4000": 111,
  "6000": 111,
  "8000": 110,
  "10000": 108,
  "12000": 105
}

// Assuming 2200 engine RPM.
var CRUISE_KTAS_FOR_ALTITUDE_FEET_TWENTY_CELSIUS_ABOVE_ISA = {
  "2000": 111,
  "4000": 110,
  "6000": 109,
  "8000": 107,
  "10000": 105,
  "12000": 103
}

// Computation //

// Assuming no wind.
function computeClimbFuelGallons(cruiseAltitudeFeet, isaDeviationCelsius) {
  if (cruiseAltitudeFeet > 12000) {
    throw "Altitude more than 12000 feet not supported";
  }
  var lowerThousandAltitude = Math.floor(cruiseAltitudeFeet / 1000) * 1000;
  var upperThousandAltitude = Math.ceil(cruiseAltitudeFeet / 1000) * 1000;
  var climbFuelGallons = lerp(
    REQUIRED_FUEL_GALLONS_TO_REACH_ALTITUDE_FEET[lowerThousandAltitude],
    REQUIRED_FUEL_GALLONS_TO_REACH_ALTITUDE_FEET[upperThousandAltitude],
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
    REQUIRED_DISTANCE_NAUTICAL_MILES_TO_REACH_ALTITUDE_FEET[lowerThousandAltitude],
    REQUIRED_DISTANCE_NAUTICAL_MILES_TO_REACH_ALTITUDE_FEET[upperThousandAltitude],
    0.5
  );
  var descentDistanceNM = computeDescentDistanceNM(cruiseAltitudeFeet, DESTINATION_AIRPORT_ALTITUDE_FEET, DESCENT_FEET_PER_MINUTE, DESCENT_SPEED_KTAS);
  var cruiseDistanceNM = tripLengthNM - climbDistanceNM - descentDistanceNM;
  if (cruiseDistanceNM <= 0) {
    throw "Remaining cruise distance after climb must be >= 0 taking into account the climb and descent distances";
  }

  var cruiseGallonsPerHourAtMinusTwentyISA = lerp(
    CRUISE_GALLONS_PER_HOUR_FOR_ALTITUDE_FEET_TWENTY_CELSIUS_BELOW_ISA[lowerTwoThousandMultiplierAltitude],
    CRUISE_GALLONS_PER_HOUR_FOR_ALTITUDE_FEET_TWENTY_CELSIUS_BELOW_ISA[upperTwoThousandMultiplierAltitude],
    0.5
  );
  var cruiseKTASAtStandardMinusTwentyISA = lerp(
    CRUISE_KTAS_FOR_ALTITUDE_FEET_TWENTY_CELSIUS_BELOW_ISA[lowerTwoThousandMultiplierAltitude],
    CRUISE_KTAS_FOR_ALTITUDE_FEET_TWENTY_CELSIUS_BELOW_ISA[upperTwoThousandMultiplierAltitude],
    0.5
  );
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
  var cruiseGallonsPerHourAtPlusTwentyISA = lerp(
    CRUISE_GALLONS_PER_HOUR_FOR_ALTITUDE_FEET_TWENTY_CELSIUS_ABOVE_ISA[lowerTwoThousandMultiplierAltitude],
    CRUISE_GALLONS_PER_HOUR_FOR_ALTITUDE_FEET_TWENTY_CELSIUS_ABOVE_ISA[upperTwoThousandMultiplierAltitude],
    0.5
  );
  var cruiseKTASAtStandardPlusTwentyISA = lerp(
    CRUISE_KTAS_FOR_ALTITUDE_FEET_TWENTY_CELSIUS_ABOVE_ISA[lowerTwoThousandMultiplierAltitude],
    CRUISE_KTAS_FOR_ALTITUDE_FEET_TWENTY_CELSIUS_ABOVE_ISA[upperTwoThousandMultiplierAltitude],
    0.5
  );

  var cruiseKTAS = cruiseKTASAtStandardISA;
  var cruiseGallonsPerHour = cruiseGallonsPerHourAtStandardISA;

  if (isaDeviationCelsius >= -20 && isaDeviationCelsius <= 0) {
    cruiseKTAS = lerp(
      cruiseKTASAtStandardMinusTwentyISA,
      cruiseKTASAtStandardISA,
      0.5
    );
    cruiseGallonsPerHour = lerp(
      cruiseGallonsPerHourAtMinusTwentyISA,
      cruiseGallonsPerHourAtStandardISA,
      0.5
    );
  } else if (isaDeviationCelsius > 0 && isaDeviationCelsius <= 20) {
    cruiseKTAS = lerp(
      cruiseKTASAtStandardISA,
      cruiseKTASAtStandardPlusTwentyISA,
      0.5
    );
    cruiseGallonsPerHour = lerp(
      cruiseGallonsPerHourAtStandardISA,
      cruiseGallonsPerHourAtPlusTwentyISA,
      0.5
    );
  }

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
