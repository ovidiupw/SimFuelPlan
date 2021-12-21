/* ## Data ## */

var CLIMB_DISTANCE_NM = 140;
var DESCENT_DISTANCE_NM = 140;

var AVERAGE_HEAD_WINDS_KTAS = 0;
var CRUISE_KIAS = 250;
var TRIP_LENGTH_NM = 1035;

var CRUISE_LBS_PER_HOUR = 5200;
var CRUISE_ALTITUDE_FT = 36400;

var CLIMB_TO_CRUISE_FT_PER_MINUTE = 2200;
var CLIMB_LBS_PER_HOUR = 11000;

var DESCENT_TO_GROUND_FT_PER_MINUTE = 1400;
var DESCENT_LBS_PER_HOUR = 3000;

var TIME_TO_ALTERNATE_AIRPORT_MINTUES = 45;
var ALTERNATE_AIRPORT_CRUISE_FUEL_CONSUMPTION_MULTIPLIER = 1.25;

var FUEL_RESERVE_TIME_MINUTES = 45;
var FUEL_RESERVE_LBS_PER_HOUR = 5000;

var HOLDING_RESERVE_TIME_MINUTES = 30;
var HOLDING_RESERVE_LBS_PER_HOUR = 5000;

var GROUND_OPERATIONS_TIME_MINUTES = 30;
var GROUND_OPERATIONS_LBS_PER_HOUR = 4000;

var MAIN_TANKS_USABLE_FUEL_LBS = 46905;
var AUX_TANKS_USABLE_FUEL_LBS = 0;

var WING_TANK_MAX_FUEL_LBS = 8628;
var WING_TANKS_COUNT = 2;

/* ## Fuel calculation ## */

var cruiseKTAS = CRUISE_KIAS * (0.02 * (CRUISE_ALTITUDE_FT / 1000)) + CRUISE_KIAS - AVERAGE_HEAD_WINDS_KTAS;
var cruiseKTASPerMinute = cruiseKTAS / 60;
var cruiseTimeMinutes = (TRIP_LENGTH_NM - CLIMB_DISTANCE_NM - DESCENT_DISTANCE_NM) / cruiseKTASPerMinute;
var climbTimeMinutes = CRUISE_ALTITUDE_FT / CLIMB_TO_CRUISE_FT_PER_MINUTE;
var descentTimeMinutes = CRUISE_ALTITUDE_FT / DESCENT_TO_GROUND_FT_PER_MINUTE;

var TripFuel = {
  cruiseLbs: CRUISE_LBS_PER_HOUR / 60 * cruiseTimeMinutes,
  climbLbs:CLIMB_LBS_PER_HOUR / 60 * climbTimeMinutes,
  descentLbs: DESCENT_LBS_PER_HOUR / 60 * descentTimeMinutes,
  alternateAirportLbs: (ALTERNATE_AIRPORT_CRUISE_FUEL_CONSUMPTION_MULTIPLIER * CRUISE_LBS_PER_HOUR / 60) * TIME_TO_ALTERNATE_AIRPORT_MINTUES,
  reserveLbs: FUEL_RESERVE_LBS_PER_HOUR / 60 * FUEL_RESERVE_TIME_MINUTES,
  holdingLbs: HOLDING_RESERVE_LBS_PER_HOUR / 60 * HOLDING_RESERVE_TIME_MINUTES,
  groundOperationsLbs: GROUND_OPERATIONS_LBS_PER_HOUR / 60 * GROUND_OPERATIONS_TIME_MINUTES,
  getClimbCruiseDescentGroundFuel: function() {
    return Math.round((this.cruiseLbs + this.climbLbs + this.descentLbs + this.groundOperationsLbs) * 100) / 100;
  },
  getTripFuelLbs: function() {
    return Math.round((this.cruiseLbs
      + this.climbLbs
      + this.descentLbs
      + this.alternateAirportLbs
      + this.reserveLbs
      + this.holdingLbs
      + this.groundOperationsLbs) * 100) / 100;
  },
  getMainTankFuelLbs: function() {
    return Math.round(Math.min(MAIN_TANKS_USABLE_FUEL_LBS, this.getTripFuelLbs()) * 100 ) / 100;
  }
};

/* ## Fuel display ## */
console.log('T/O Fuel (lbs): ' + Math.floor(TripFuel.getTripFuelLbs()));
console.log('  Wing tanks (lbs): ' + Math.min(Math.floor(TripFuel.getTripFuelLbs() / WING_TANKS_COUNT), WING_TANK_MAX_FUEL_LBS));
Math.floor(TripFuel.getTripFuelLbs() / WING_TANKS_COUNT) > WING_TANK_MAX_FUEL_LBS
  ? console.log('  Center tank (lbs): ' + Math.floor(TripFuel.getTripFuelLbs() - WING_TANKS_COUNT * WING_TANK_MAX_FUEL_LBS))
  : console.log('  Center tank (lbs): 0');
console.log('Trip Fuel (lbs): ' +  Math.floor(TripFuel.getClimbCruiseDescentGroundFuel()));
console.log('Alternate APT Fuel (lbs): ' +  Math.floor(TripFuel.alternateAirportLbs));
console.log('Hold Fuel (lbs): ' +  Math.floor(TripFuel.holdingLbs));
console.log('Extra Fuel (lbs): ' +  Math.floor(TripFuel.reserveLbs));
console.log('Total Reserve Fuel (lbs): ' +  Math.floor(TripFuel.reserveLbs + TripFuel.groundOperationsLbs + TripFuel.alternateAirportLbs));
console.log('\nCruise KTAS: ' + cruiseKTAS);
