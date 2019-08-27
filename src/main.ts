import {AirconController} from './AirconController';

const controller = new AirconController(process.env.AIRCON_IP || '', 3610);

async function main() {
    await controller.initialize();
    const result = await controller.getPowerState();
    [
        "protocolType".padEnd(24, ' ') + ['ECHONET_LITE'][result.protocolType],
        "frameFormat".padEnd(24, ' ') + ['SPECIFIED_MESSAGE_FORMAT', 'ARBITRARY_MESSAGE_FORMAT'][result.frameFormat],
        "transactionId".padEnd(24, ' ') + result.transactionId,
        "sourceElObject".padEnd(24, ' ') + result.sourceElObject,
        "destinationElObject".padEnd(24, ' ') + result.destinationElObject,
        "service".padEnd(24, ' ') + result.service.toString(16).padStart(2, '0'),
        "properties".padEnd(24, ' ') + result.properties
    ].forEach(v => console.log(v));
    await controller.finalize();
}

main();
