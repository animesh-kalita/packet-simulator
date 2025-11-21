// Sample packet file for JavaScript format
// This file exports an array of packets to be sent

module.exports = [
  // GPS tracking packets
  "$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A",
  "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47",
  
  // Device status packets
  "device_id,7002238281,status,online,battery,85,signal,4",
  "device_id,7002238281,status,moving,battery,84,signal,4",
  
  // Location updates
  "loc,40.7128,-74.0060,25,20250121120000",
  "loc,40.7129,-74.0061,26,20250121120005",
  "loc,40.7130,-74.0062,27,20250121120010",
  
  // Alert packets
  "alert,overspeed,device_id,7002238281,speed,85,limit,80",
  "alert,geofence,device_id,7002238281,zone,restricted_area",
  
  // Heartbeat packets
  "hb,7002238281,20250121120015",
  "hb,7002238281,20250121120030",
  "hb,7002238281,20250121120045"
];