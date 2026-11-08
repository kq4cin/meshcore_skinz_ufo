/* meshcore.js ships untyped ES modules; we deep-import only browser-safe files. */
declare module '@liamcottle/meshcore.js/src/connection/web_ble_connection.js' {
  const WebBleConnection: { open(): Promise<any> };
  export default WebBleConnection;
}
declare module '@liamcottle/meshcore.js/src/connection/web_serial_connection.js' {
  const WebSerialConnection: { open(): Promise<any> };
  export default WebSerialConnection;
}
declare module '@liamcottle/meshcore.js/src/constants.js' {
  const Constants: any;
  export default Constants;
}
