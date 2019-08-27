import { AirconController } from './AirconController';
import { OperationState, PowerSavingOperationSetting } from './ElType';

const controller = new AirconController((process.env.AIRCON_IP || ''), 3610);

async function main() {
    await controller.initialize();
    await displayOnOffInformation(controller.getOperationState.bind(controller), 'Operation status', OperationState.ON, OperationState.OFF);
    await displayOnOffInformation(controller.getPowerSavingOperationSetting.bind(controller), 'Power-saving operation status', PowerSavingOperationSetting.ON, PowerSavingOperationSetting.OFF);
    await controller.finalize();
}

main();

async function displayOnOffInformation(func: Function, label: string, onValue: any, offValue: any) {
    const result = await func();
    if(result === onValue) {
        console.log(`${label}: ON`);
    } else if(result === offValue) {
        console.log(`${label}: OFF`);
    } else {
        console.log(`${label}: Invalid value (hex ${result.toString(16).padStart(2, '0')})`);
    }
}
