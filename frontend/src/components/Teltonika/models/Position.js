export class Position {
  constructor(source = "teltonika") {
    this.source = source;
    this.timestamp = 0;
    this.latitude = 0;
    this.longitude = 0;
    this.altitude = 0;
    this.speed = 0;
    this.course = 0;
    this.satellites = 0;
    this.valid = true;
    this.attributes = new Map();
    this.alarms = [];
  }

  set(key, value) {
    this.attributes.set(key, value);
  }

  get(key) {
    return this.attributes.get(key);
  }

  setTimestamp(ts) {
    this.timestamp = ts;
  }

  setTime(date) {
    this.timestamp = date.getTime();
  }

  setLatitude(lat) {
    this.latitude = lat;
  }

  setLongitude(lng) {
    this.longitude = lng;
  }

  setAltitude(alt) {
    this.altitude = alt;
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  setCourse(course) {
    this.course = course;
  }

  setSatellites(sats) {
    this.satellites = sats;
  }

  setValid(valid) {
    this.valid = valid;
  }

  addAlarm(alarm) {
    if (alarm) this.alarms.push(alarm);
  }

  getOutdated() {
    return false;
  }

  toJSON() {
    return {
      timestamp: this.timestamp,
      latitude: this.latitude,
      longitude: this.longitude,
      altitude: this.altitude,
      speed: this.speed,
      course: this.course,
      satellites: this.satellites,
      valid: this.valid,
      attributes: Object.fromEntries(this.attributes),
      alarms: this.alarms,
    };
  }
}
