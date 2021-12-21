function newFuelData(lbs, date) {
  return {
    "fuel_lbs": lbs,
    "date": date
  }
}

function computeLbsPerSegmentPerHour(fuelData) {
  var lbsPerSegmentPerHour = [];
  for (var i=0; i < fuelData.length - 1; i++) {
    lbsPerSegmentPerHour.push(computeLbsPerHour(fuelData[i], fuelData[i+1]));
  }
  return lbsPerSegmentPerHour
}

function computeLbsPerHour(fuelDataStart, fuelDataEnd) {
  const minutesBetweenStartEnd  =  (fuelDataEnd["date"].getTime() - fuelDataStart["date"].getTime()) / 1000 / 60;
  const lbsBetweenStartEnd = Math.abs(fuelDataEnd["fuel_lbs"] - fuelDataStart["fuel_lbs"])
  return Math.ceil(60 / minutesBetweenStartEnd * lbsBetweenStartEnd);
}

const CLIMB_FUEL_TO_DATE = [
  newFuelData(18600, new Date(1970, 1, 1, 5, 35, 0)),
  newFuelData(14800, new Date(1970, 1, 1, 5, 59, 0))
];

console.log("-----------");
console.log(`CLIMB fuel LBS/hour per segment: ${computeLbsPerSegmentPerHour(CLIMB_FUEL_TO_DATE)}`);
console.log(`CLIMB fuel LBS/hour: ${computeLbsPerHour(CLIMB_FUEL_TO_DATE[0], CLIMB_FUEL_TO_DATE[CLIMB_FUEL_TO_DATE.length-1])}`);
console.log("-----------\n");

const CRUISE_FUEL_TO_DATE = [
  newFuelData(14800, new Date(1970, 1, 1, 5, 59, 0)),
  newFuelData(11600, new Date(1970, 1, 1, 6, 38, 0))
];
console.log("-----------");
console.log(`CRUISE fuel LBS/hour per segment: ${computeLbsPerSegmentPerHour(CRUISE_FUEL_TO_DATE)}`);
console.log(`CRUISE fuel LBS/hour: ${computeLbsPerHour(CRUISE_FUEL_TO_DATE[0], CRUISE_FUEL_TO_DATE[CRUISE_FUEL_TO_DATE.length-1])}`);
console.log("-----------\n");
