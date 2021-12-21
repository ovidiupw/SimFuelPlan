// http://essentialpilot.co.za/2018/06/09/how-to-calculate-isa-temperature-deviation-and-why-you-should/

const ISA_AT_MSL = 15;
const TEMPERATURE_CHANGE_BY_1000_FEET_CLIMBED = -1.98;
const ALTITUDE_FEET = 39000;
const OUTSIDE_TEMPERATURE_AT_ALTITUDE_FEET = -65;

const isaAtAltitudeFeet = (ALTITUDE_FEET / 1000) * TEMPERATURE_CHANGE_BY_1000_FEET_CLIMBED + ISA_AT_MSL;
const isaDeviationAtAltitudeFeet = OUTSIDE_TEMPERATURE_AT_ALTITUDE_FEET - isaAtAltitudeFeet;

console.log(`ISA at ${ALTITUDE_FEET} feet: ${isaAtAltitudeFeet}`);
console.log(`ISA deviation at ${ALTITUDE_FEET} feet: ISA ${isaDeviationAtAltitudeFeet > 0 ? '+' : '-'} ${Math.abs(Math.ceil(isaDeviationAtAltitudeFeet))}`);
