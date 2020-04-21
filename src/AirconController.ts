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
                    switch(smFrameData.service) {
                        case ElType.ElService.SetI_SNA:
                        case ElType.ElService.SetC_SNA:
                        case ElType.ElService.Get_SNA:
                        case ElType.ElService.INF_SNA:
                        case ElType.ElService.SetGet_SNA:
                            this.promises[smFrameData.transactionId.value][1](smFrameData);
                            return;
                        
                        case ElType.ElService.SetI:
                        case ElType.ElService.SetC:
                        case ElType.ElService.Get:
                        case ElType.ElService.INF_REQ:
                        case ElType.ElService.SetGet:
                            this.promises[smFrameData.transactionId.value][1]('要求用ESVコードが送信されました');
                            return;

                        case ElType.ElService.Set_Res:
                        case ElType.ElService.Get_Res:
                        case ElType.ElService.INF:
                        case ElType.ElService.INFC:
                        case ElType.ElService.INFC_Res:
                        case ElType.ElService.SetGet_Res:
                            this.promises[smFrameData.transactionId.value][0](smFrameData);
                            return;

                        default:
                            this.promises[smFrameData.transactionId.value][1](smFrameData);
                            return;
                    }
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

    /**
     * 動作状態を取得
     */
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

    /**
     * 動作状態を設定
     * @param state 設定する動作状態
     */
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

    /**
     * 節電動作設定を取得
     */
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

    /**
     * 節電動作設定を設定
     * @param setting 設定する節電動作設定
     */
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

    /**
     * 運転モードを取得
     */
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

    /**
     * 運転モードを設定
     * @param setting 設定する運転モード
     */
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

    /**
     * 温度自動設定を取得
     */
    async getAutomaticTemperatureControlSetting(): Promise<ElType.AutomaticTemperatureControlSetting> {
        const result = await this.sendFrame(
            new ElType.ElObject(0x05, 0xFF, 0x01),
            new ElType.ElObject(0x01, 0x30, 0x01),
            ElType.ElService.Get,
            [
                new ElType.ElProperty(0xB1),
            ]
        );
        switch (result.properties[0].propertyData[0]) {
            case ElType.AutomaticTemperatureControlSetting.AUTOMATIC:
            case ElType.AutomaticTemperatureControlSetting.NON_AUTOMATIC:
                return result.properties[0].propertyData[0];
            default:
                throw new RangeError('Unsupported Automatic Temperature Control Setting');
        }
    }

    /**
     * 温度自動設定を設定
     * @param setting 設定する温度自動設定
     */
    async setAutomaticTemperatureControlSetting(setting: ElType.AutomaticTemperatureControlSetting): Promise<void> {
        await this.sendFrame(
            new ElType.ElObject(0x05, 0xFF, 0x01),
            new ElType.ElObject(0x01, 0x30, 0x01),
            ElType.ElService.SetC,
            [
                new ElType.ElProperty(0xB1, new Uint8Array([setting])),
            ]
        );
        return;
    }
}
