import { AirconController } from './AirconController';
import { OperationState, PowerSavingOperationSetting } from './ElType';

const controller = new AirconController((process.env.AIRCON_IP || ''), 3610);

async function main() {
    await controller.initialize();
    console.log((await controller.getOperationState() === OperationState.ON) ? 'ON' : 'OFF');
    console.log((await controller.getPowerSavingOperationSetting() === PowerSavingOperationSetting.ON) ? 'ON' : 'OFF');
    await controller.finalize();
}

main();
