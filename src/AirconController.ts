import * as ElType from "./ElType";
import { Socket, createSocket } from "dgram";
import { ElFrame } from "./ElFrame";

export class AirconController {
    host: string;
    port: number;
    private promises: Array<Function[]> = new Array(0x10000);
    private recieveServer: Socket;
    private initializeCompleted: boolean = false;

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;

        this.recieveServer = createSocket('udp4');
        this.recieveServer.on('error', console.error);
        this.recieveServer.on('message', (message, remote) => {
            const frame = new Uint8Array(message);
            try {
                const smFrameData = new ElType.ElSpecifiedMessageFrameData(frame);
                if (this.promises[smFrameData.transactionId.value]) {
                    this.promises[smFrameData.transactionId.value][0](smFrameData);
                } else {
                    return;
                }
            } catch (exception) {
                console.error(exception);
            }
        });
    }

    initialize() {
        return new Promise((resolve, reject) => {
            this.recieveServer.bind(this.port, '0.0.0.0', () => {
                this.initializeCompleted = true;
                resolve();
            });
        });
    }

    finalize() {
        return new Promise((resolve, reject) => {
            this.recieveServer.close(() => {
                resolve();
            })
        });
    }

    sendFrame(seoj: ElType.ElObject, deoj: ElType.ElObject, esv: ElType.ElService, properties: ElType.ElProperty[], timeout = 7000): Promise<ElType.ElSpecifiedMessageFrameData> {
        return new Promise((resolve, reject) => {
            if (!this.initializeCompleted) {
                reject('サーバが初期化されていません');
            }
            let tid = -1;
            let i = 0;
            do {
                tid = Math.floor(Math.random() * 0x10000);
                if (!this.promises[tid]) {
                    this.promises[tid] = [resolve, reject];
                    break;
                }
                if (++i > 10) {
                    reject('トランザクションIDが枯渇しています');
                }
            } while (true);

            const transactionId = new ElType.ElTransactionId(tid);
            const frameData = ElFrame.createSmfFrame(transactionId, seoj, deoj, esv, properties);
            const client = createSocket('udp4');
            client.send(frameData, this.port, this.host, () => {
                client.close();
            });
        });
    }

    async getOperationStatus(): Promise<ElType.OperationStatus> {
        const result = await this.sendFrame(
            new ElType.ElObject(0x05, 0xFF, 0x01),
            new ElType.ElObject(0x01, 0x30, 0x01),
            ElType.ElService.Get,
            [
                new ElType.ElProperty(0x80),
            ]
        );
        switch (result.properties[0].propertyData[0]) {
            case ElType.OperationStatus.ON:
            case ElType.OperationStatus.OFF:
                return result.properties[0].propertyData[0];
            default:
                throw new RangeError('Unsupported Operation State');
        }
    }

    async setOperationStatus(state: ElType.OperationStatus): Promise<void> {
        await this.sendFrame(
            new ElType.ElObject(0x05, 0xFF, 0x01),
            new ElType.ElObject(0x01, 0x30, 0x01),
            ElType.ElService.SetC,
            [
                new ElType.ElProperty(0x80, new Uint8Array([state])),
            ]
        );
        return;
    }

    async getPowerSavingOperationSetting(): Promise<ElType.PowerSavingOperationSetting> {
        const result = await this.sendFrame(
            new ElType.ElObject(0x05, 0xFF, 0x01),
            new ElType.ElObject(0x01, 0x30, 0x01),
            ElType.ElService.Get,
            [
                new ElType.ElProperty(0x8F),
            ]
        );
        switch (result.properties[0].propertyData[0]) {
            case ElType.PowerSavingOperationSetting.ON:
            case ElType.PowerSavingOperationSetting.OFF:
                return result.properties[0].propertyData[0];
            default:
                throw new RangeError('Unsupported Power Saving Operation Setting');
        }
    }

    async setPowerSavingOperationSetting(setting: ElType.PowerSavingOperationSetting): Promise<void> {
        await this.sendFrame(
            new ElType.ElObject(0x05, 0xFF, 0x01),
            new ElType.ElObject(0x01, 0x30, 0x01),
            ElType.ElService.SetC,
            [
                new ElType.ElProperty(0x8F, new Uint8Array([setting])),
            ]
        );
        return;
    }

    async getOperationModeSetting(): Promise<ElType.OperationModeSetting> {
        const result = await this.sendFrame(
            new ElType.ElObject(0x05, 0xFF, 0x01),
            new ElType.ElObject(0x01, 0x30, 0x01),
            ElType.ElService.Get,
            [
                new ElType.ElProperty(0xB0),
            ]
        );
        switch (result.properties[0].propertyData[0]) {
            case ElType.OperationModeSetting.AUTOMATIC:
            case ElType.OperationModeSetting.COOLING:
            case ElType.OperationModeSetting.HEATING:
            case ElType.OperationModeSetting.DEHUMIDIFICATION:
            case ElType.OperationModeSetting.AIR_CIRCULATOR:
            case ElType.OperationModeSetting.OTHER:
                return result.properties[0].propertyData[0];
            default:
                throw new RangeError('Unsupported Operation Mode Setting');
        }
    }

    async setOperationModeSetting(setting: ElType.OperationModeSetting): Promise<void> {
        await this.sendFrame(
            new ElType.ElObject(0x05, 0xFF, 0x01),
            new ElType.ElObject(0x01, 0x30, 0x01),
            ElType.ElService.SetC,
            [
                new ElType.ElProperty(0xB0, new Uint8Array([setting])),
            ]
        );
        return;
    }
}
