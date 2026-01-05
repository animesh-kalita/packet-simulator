export function decodeBharat101(packet) {
  const clean = packet.trim();
  const parts = clean.split(",");

  if (parts.length < 50) {
    throw new Error("Invalid / incomplete Bharat-101 packet");
  }

  return {
    header: parts[0],
    vendor: parts[1],
    firmware: parts[2],
    packetType: parts[3],
    version: parts[4],
    liveFlag: parts[5], // L / H
    serialNo: parts[6],
    vehicleNo: parts[7],
    ignition: parts[8] === "1",

    date: parts[9],
    time: parts[10],

    latitude: Number(parts[11]),
    latDir: parts[12],
    longitude: Number(parts[13]),
    lonDir: parts[14],

    speed: Number(parts[15]),
    heading: Number(parts[16]),
    satellites: Number(parts[17]),
    altitude: Number(parts[18]),

    hdop: Number(parts[19]),
    vdop: Number(parts[20]),

    network: parts[21],
    gsmSignal: Number(parts[22]),
    networkReg: parts[23] === "1",

    extBattery: Number(parts[24]),
    intBattery: Number(parts[25]),

    charging: parts[26] === "1",
    gpsFix: parts[27],

    mcc: parts[28],
    mnc: parts[29],
    lac: parts[30],
    cellId: parts[31],

    odometer: Number(parts[47]),
    batteryPercent: Number(parts[51]?.replace("()*", "")) || 0,

    rawParts: parts,
  };
}
